const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Block = require('../models/Block');
const upload = require('../config/multer');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Update user online status
router.put('/update-status', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { lastActive: new Date() },
      { new: true }
    ).select('_id username lastActive');

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's friends (following list)
router.get('/friends/list', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('following', 'username profilePicture email bio lastActive');
    
    res.json(user.following || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search users
router.get('/search/:query', protect, async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('_id username email profilePicture bio followers')
    .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('followers following', 'username profilePicture');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile (bio and profile picture)
router.put('/me/profile', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    const { bio } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update bio if provided
    if (bio !== undefined) {
      user.bio = bio;
    }

    // Update profile picture if file is uploaded
    if (req.file) {
      user.profilePicture = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        isPrivate: user.isPrivate
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle private account
router.put('/toggle-privacy', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.isPrivate = !user.isPrivate;
    await user.save();

    res.json({ 
      message: `Account is now ${user.isPrivate ? 'private' : 'public'}`,
      isPrivate: user.isPrivate 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Follow user (backward compatibility - redirects to follow requests)
router.put('/:id/follow', protect, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-follow
    if (req.userId === req.params.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // If unfollowing
    if (currentUser.following.includes(req.params.id)) {
      currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
      userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== req.userId);
      
      await currentUser.save();
      await userToFollow.save();

      // Delete follow notification
      await Notification.deleteOne({
        recipient: req.params.id,
        sender: req.userId,
        type: 'follow'
      });

      return res.json({ message: 'Unfollowed successfully' });
    }

    // If following
    // If recipient is not private, auto-follow
    if (!userToFollow.isPrivate) {
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.userId);
      
      await currentUser.save();
      await userToFollow.save();
      
      // Create follow notification
      await Notification.create({
        recipient: req.params.id,
        sender: req.userId,
        type: 'follow',
        message: `${currentUser.username} followed you`
      });

      return res.json({ message: 'Followed successfully' });
    }

    // If recipient is private, send follow request
    return res.status(400).json({ 
      message: 'User has a private account. Send follow request instead.',
      isPrivate: true 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Block user
router.post('/:id/block', protect, async (req, res) => {
  try {
    const userToBlock = await User.findById(req.params.id);
    if (!userToBlock) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.userId === req.params.id) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    // Check if already blocked
    const existingBlock = await Block.findOne({ 
      blocker: req.userId, 
      blocked: req.params.id 
    });

    if (existingBlock) {
      return res.status(400).json({ message: 'User already blocked' });
    }

    // Create block
    await Block.create({
      blocker: req.userId,
      blocked: req.params.id
    });

    // Unfollow if following
    const currentUser = await User.findById(req.userId);
    if (currentUser.following.includes(req.params.id)) {
      currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
      userToBlock.followers = userToBlock.followers.filter(id => id.toString() !== req.userId);
      await currentUser.save();
      await userToBlock.save();
    }

    res.json({ message: 'User blocked successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unblock user
router.post('/:id/unblock', protect, async (req, res) => {
  try {
    const userToUnblock = await User.findById(req.params.id);
    if (!userToUnblock) {
      return res.status(404).json({ message: 'User not found' });
    }

    const block = await Block.findOneAndDelete({
      blocker: req.userId,
      blocked: req.params.id
    });

    if (!block) {
      return res.status(404).json({ message: 'This user is not blocked' });
    }

    res.json({ message: 'User unblocked successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get blocked users list
router.get('/blocked/list', protect, async (req, res) => {
  try {
    const blocks = await Block.find({ blocker: req.userId })
      .populate('blocked', 'username profilePicture bio');

    const blockedUsers = blocks.map(block => block.blocked);
    res.json(blockedUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check if user is blocked
router.get('/:id/is-blocked', protect, async (req, res) => {
  try {
    const block = await Block.findOne({
      blocker: req.userId,
      blocked: req.params.id
    });

    res.json({ isBlocked: !!block });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

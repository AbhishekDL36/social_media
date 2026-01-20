const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

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

module.exports = router;

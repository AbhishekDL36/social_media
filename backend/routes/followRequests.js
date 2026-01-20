const express = require('express');
const FollowRequest = require('../models/FollowRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Send follow request
router.post('/send/:id', protect, async (req, res) => {
  try {
    const recipientId = req.params.id;

    // Check if trying to follow self
    if (req.userId === recipientId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    const currentUser = await User.findById(req.userId);
    if (currentUser.following.includes(recipientId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Check if request already exists
    const existingRequest = await FollowRequest.findOne({
      sender: req.userId,
      recipient: recipientId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Follow request already sent' });
    }

    // If recipient is not private, auto-approve
    if (!recipient.isPrivate) {
      currentUser.following.push(recipientId);
      recipient.followers.push(req.userId);
      await currentUser.save();
      await recipient.save();

      // Create notification
      await Notification.create({
        recipient: recipientId,
        sender: req.userId,
        type: 'follow',
        message: `${currentUser.username} followed you`
      });

      return res.json({ message: 'Followed successfully', autoApproved: true });
    }

    // Create follow request for private accounts
    const followRequest = await FollowRequest.create({
      sender: req.userId,
      recipient: recipientId,
      status: 'pending'
    });

    // Create notification for follow request
    await Notification.create({
      recipient: recipientId,
      sender: req.userId,
      type: 'follow',
      message: `${currentUser.username} sent you a follow request`
    });

    res.status(201).json({ message: 'Follow request sent', followRequest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending follow requests
router.get('/pending', protect, async (req, res) => {
  try {
    const requests = await FollowRequest.find({
      recipient: req.userId,
      status: 'pending'
    })
      .populate('sender', 'username profilePicture bio followers')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve follow request
router.put('/approve/:id', protect, async (req, res) => {
  try {
    const followRequest = await FollowRequest.findById(req.params.id);

    if (!followRequest) {
      return res.status(404).json({ message: 'Follow request not found' });
    }

    if (followRequest.recipient.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const sender = await User.findById(followRequest.sender);
    const recipient = await User.findById(followRequest.recipient);

    sender.following.push(followRequest.recipient);
    recipient.followers.push(followRequest.sender);

    followRequest.status = 'approved';

    await sender.save();
    await recipient.save();
    await followRequest.save();

    res.json({ message: 'Follow request approved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject follow request
router.put('/reject/:id', protect, async (req, res) => {
  try {
    const followRequest = await FollowRequest.findById(req.params.id);

    if (!followRequest) {
      return res.status(404).json({ message: 'Follow request not found' });
    }

    if (followRequest.recipient.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    followRequest.status = 'rejected';
    await followRequest.save();

    res.json({ message: 'Follow request rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unfollow user
router.delete('/unfollow/:id', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const userToUnfollow = await User.findById(req.params.id);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== req.userId);

    await currentUser.save();
    await userToUnfollow.save();

    // Delete follow notification
    await Notification.deleteOne({
      recipient: req.params.id,
      sender: req.userId,
      type: 'follow'
    });

    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove follower
router.delete('/remove-follower/:id', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const followerToRemove = await User.findById(req.params.id);

    if (!followerToRemove) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from current user's followers
    currentUser.followers = currentUser.followers.filter(id => id.toString() !== req.params.id);
    
    // Remove current user from follower's following
    followerToRemove.following = followerToRemove.following.filter(id => id.toString() !== req.userId);

    await currentUser.save();
    await followerToRemove.save();

    // Delete follow notification
    await Notification.deleteOne({
      recipient: req.userId,
      sender: req.params.id,
      type: 'follow'
    });

    res.json({ message: 'Follower removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

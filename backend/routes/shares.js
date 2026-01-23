const express = require('express');
const Share = require('../models/Share');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Share post with a user
router.post('/', protect, async (req, res) => {
  try {
    const { postId, userId, message } = req.body;

    if (!postId || !userId) {
      return res.status(400).json({ message: 'Post ID and User ID required' });
    }

    if (req.userId === userId) {
      return res.status(400).json({ message: 'Cannot share with yourself' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already shared
    const existingShare = await Share.findOne({
      post: postId,
      sharedBy: req.userId,
      sharedWith: userId
    });

    if (existingShare) {
      return res.status(400).json({ message: 'Already shared with this user' });
    }

    const share = new Share({
      post: postId,
      sharedBy: req.userId,
      sharedWith: userId,
      message
    });

    await share.save();

    // Create notification
    const notification = new Notification({
      recipient: userId,
      sender: req.userId,
      type: 'share',
      post: postId,
      message: 'shared a post with you'
    });

    await notification.save();

    await share.populate('post');
    await share.populate('sharedBy', 'username profilePicture');
    await share.populate('sharedWith', 'username profilePicture');

    res.status(201).json(share);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get shared posts for current user
router.get('/', protect, async (req, res) => {
  try {
    const shares = await Share.find({ sharedWith: req.userId })
      .sort({ createdAt: -1 })
      .populate('post')
      .populate('sharedBy', 'username profilePicture')
      .populate('sharedWith', 'username profilePicture');

    res.json(shares);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get users to share with (friends first, then chat history)
router.get('/suggest/users', protect, async (req, res) => {
  try {
    const Message = require('../models/Message');
    const currentUser = await User.findById(req.userId);
    const followingIds = currentUser.following || [];
    const followerIds = currentUser.followers || [];

    // Find mutual friends (both following each other)
    const friendIds = followingIds.filter(id => 
      followerIds.some(follower => follower.toString() === id.toString())
    );

    // Get friend users
    const friends = await User.find({
      _id: { $in: friendIds }
    })
      .select('username profilePicture');

    // Find users with chat history (both as sender and recipient)
    const senders = await Message.find({ sender: req.userId }).distinct('recipient');
    const recipients = await Message.find({ recipient: req.userId }).distinct('sender');
    
    // Combine and remove duplicates
    const allChatUserIds = [...new Set([...senders, ...recipients])];
    
    // Remove friends from chat users list
    const chatUserIds = allChatUserIds.filter(id => 
      !friendIds.some(friendId => friendId.toString() === id.toString())
    );

    // Get chat user details
    const chatUsers = await User.find({
      _id: { $in: chatUserIds }
    })
      .select('username profilePicture');

    // Combine: friends first, then chat users
    const allUsers = [...friends, ...chatUsers];

    res.json(allUsers);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete share
router.delete('/:id', protect, async (req, res) => {
  try {
    const share = await Share.findById(req.params.id);

    if (!share) {
      return res.status(404).json({ message: 'Share not found' });
    }

    // Only owner of share can delete
    if (share.sharedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Share.findByIdAndDelete(req.params.id);

    res.json({ message: 'Share deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Send message
router.post('/send/:recipientId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const recipientId = req.params.recipientId;

    if (!text || !recipientId) {
      return res.status(400).json({ message: 'Text and recipient required' });
    }

    if (req.userId === recipientId) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = new Message({
      sender: req.userId,
      recipient: recipientId,
      text
    });

    await message.save();
    
    // Create notification for message
    const notification = new Notification({
      recipient: recipientId,
      sender: req.userId,
      type: 'message',
      message: text
    });
    
    await notification.save();
    
    await message.populate('sender', 'username profilePicture');
    await message.populate('recipient', 'username profilePicture');

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages with a user (chat history)
router.get('/conversation/:userId', protect, async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: otherUserId },
        { sender: otherUserId, recipient: req.userId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profilePicture')
      .populate('recipient', 'username profilePicture');

    // Mark all received messages as read
    await Message.updateMany(
      {
        sender: otherUserId,
        recipient: req.userId,
        read: false
      },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all conversations (list of users you've messaged)
router.get('/', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.userId }, { recipient: req.userId }]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username profilePicture')
      .populate('recipient', 'username profilePicture');

    // Get unique users (conversations)
    const conversationMap = new Map();
    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === req.userId ? msg.recipient : msg.sender;
      const isUnread = msg.recipient._id.toString() === req.userId && !msg.read;
      
      if (!conversationMap.has(otherUser._id.toString())) {
        conversationMap.set(otherUser._id.toString(), {
          user: otherUser,
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          unreadCount: isUnread ? 1 : 0
        });
      } else if (isUnread) {
        // Increment unread count for existing conversations
        const conversation = conversationMap.get(otherUser._id.toString());
        conversation.unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get message requests (messages from non-followers)
router.get('/requests/inbox', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const followingIds = currentUser.following || [];

    // Get messages from users not being followed
    const messages = await Message.find({
      recipient: req.userId,
      sender: { $nin: followingIds }
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username profilePicture bio');

    // Get unique senders
    const senderMap = new Map();
    messages.forEach(msg => {
      if (!senderMap.has(msg.sender._id.toString())) {
        senderMap.set(msg.sender._id.toString(), {
          user: msg.sender,
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          messageId: msg._id
        });
      }
    });

    const requests = Array.from(senderMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark message as read
router.put('/:messageId/read', protect, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { read: true },
      { new: true }
    );

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get unread message count
router.get('/unread/count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.userId,
      read: false
    });

    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like/Unlike message
router.put('/:messageId/like', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.likes.includes(req.userId)) {
      message.likes = message.likes.filter(id => id.toString() !== req.userId);
    } else {
      message.likes.push(req.userId);
    }

    await message.save();
    await message.populate('sender', 'username profilePicture');
    await message.populate('recipient', 'username profilePicture');

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete message (soft delete)
router.delete('/:messageId', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete their own message
    if (String(message.sender) !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    // Soft delete - mark as deleted instead of removing
    message.deleted = true;
    message.text = '';
    await message.save();

    res.json({ message: 'Message deleted', deleted: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

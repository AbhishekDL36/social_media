const express = require('express');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');
const Notification = require('../models/Notification');
const upload = require('../config/multer');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Create group
router.post('/', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, description, isPrivate, memberIds } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

    const group = new Group({
      name: name.trim(),
      description: description || '',
      profilePicture,
      creator: req.userId,
      isPrivate: isPrivate === 'true' || isPrivate === true,
      members: [req.userId],
      admins: [req.userId]
    });

    // Add initial members if provided
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      const validMembers = memberIds.filter(id => id !== req.userId);
      group.members.push(...validMembers);
    }

    await group.save();
    await group.populate('creator', 'username profilePicture');
    await group.populate('members', 'username profilePicture');
    await group.populate('admins', 'username profilePicture');

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all groups user is member of
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .populate('creator', 'username profilePicture')
      .populate('members', 'username profilePicture')
      .populate('admins', 'username profilePicture')
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single group details
router.get('/:groupId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('creator', 'username profilePicture')
      .populate('members', 'username profilePicture')
      .populate('admins', 'username profilePicture');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.some(m => String(m._id) === req.userId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update group
router.put('/:groupId', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can update
    if (!group.admins.includes(req.userId)) {
      return res.status(403).json({ message: 'Only admins can update group' });
    }

    if (req.body.name) group.name = req.body.name.trim();
    if (req.body.description !== undefined) group.description = req.body.description;
    if (req.body.isPrivate !== undefined) group.isPrivate = req.body.isPrivate === 'true' || req.body.isPrivate === true;
    if (req.file) group.profilePicture = `/uploads/${req.file.filename}`;

    await group.save();
    await group.populate('creator', 'username profilePicture');
    await group.populate('members', 'username profilePicture');
    await group.populate('admins', 'username profilePicture');

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete group
router.delete('/:groupId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only creator can delete
    if (String(group.creator) !== req.userId) {
      return res.status(403).json({ message: 'Only creator can delete group' });
    }

    // Delete all group messages
    await GroupMessage.deleteMany({ group: req.params.groupId });

    // Delete group
    await Group.findByIdAndDelete(req.params.groupId);

    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add member to group
router.post('/:groupId/members', protect, async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can add members
    if (!group.admins.includes(req.userId)) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a member
    if (group.members.some(m => String(m) === userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Check if group is private
    if (group.isPrivate) {
      // For private groups, send invitation notification instead
      await Notification.create({
        recipient: userId,
        sender: req.userId,
        type: 'group_invite',
        message: `You were invited to join "${group.name}" group`,
        reference: req.params.groupId
      });

      return res.json({ message: 'Invitation sent to user' });
    }

    group.members.push(userId);
    await group.save();
    await group.populate('members', 'username profilePicture');

    // Notify user
    const currentUser = await User.findById(req.userId);
    await Notification.create({
      recipient: userId,
      sender: req.userId,
      type: 'group_add',
      message: `${currentUser.username} added you to "${group.name}" group`,
      reference: req.params.groupId
    });

    res.json({ message: 'Member added successfully', group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove member from group
router.delete('/:groupId/members/:memberId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can remove members (or user can remove themselves)
    if (!group.admins.includes(req.userId) && req.userId !== req.params.memberId) {
      return res.status(403).json({ message: 'You cannot remove this member' });
    }

    // Creator cannot be removed
    if (String(group.creator) === req.params.memberId) {
      return res.status(400).json({ message: 'Creator cannot be removed' });
    }

    group.members = group.members.filter(m => String(m) !== req.params.memberId);
    group.admins = group.admins.filter(a => String(a) !== req.params.memberId);

    await group.save();
    await group.populate('members', 'username profilePicture');
    await group.populate('admins', 'username profilePicture');

    res.json({ message: 'Member removed successfully', group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Make member admin
router.put('/:groupId/members/:memberId/admin', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can promote
    if (!group.admins.includes(req.userId)) {
      return res.status(403).json({ message: 'Only admins can promote members' });
    }

    if (!group.members.some(m => String(m) === req.params.memberId)) {
      return res.status(400).json({ message: 'User is not a member of this group' });
    }

    if (group.admins.some(a => String(a) === req.params.memberId)) {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    group.admins.push(req.params.memberId);
    await group.save();
    await group.populate('admins', 'username profilePicture');

    res.json({ message: 'Member promoted to admin', group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove admin status
router.delete('/:groupId/admins/:adminId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can demote (not self)
    if (!group.admins.includes(req.userId)) {
      return res.status(403).json({ message: 'Only admins can demote members' });
    }

    // Creator cannot be demoted
    if (String(group.creator) === req.params.adminId) {
      return res.status(400).json({ message: 'Creator cannot be demoted' });
    }

    group.admins = group.admins.filter(a => String(a) !== req.params.adminId);
    await group.save();
    await group.populate('admins', 'username profilePicture');

    res.json({ message: 'Admin status removed', group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send group message
router.post('/:groupId/messages', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.some(m => String(m) === req.userId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = new GroupMessage({
      group: req.params.groupId,
      sender: req.userId,
      text: text.trim()
    });

    await message.save();
    await message.populate('sender', 'username profilePicture');

    // Notify other group members
    const sender = await User.findById(req.userId);
    const otherMembers = group.members.filter(m => String(m) !== req.userId);
    
    for (const memberId of otherMembers) {
      await Notification.create({
        recipient: memberId,
        sender: req.userId,
        type: 'group_message',
        message: `${sender.username} sent a message in "${group.name}"`,
        reference: req.params.groupId
      });
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get group messages
router.get('/:groupId/messages', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.some(m => String(m) === req.userId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const messages = await GroupMessage.find({ group: req.params.groupId })
      .populate('sender', 'username profilePicture')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like group message
router.put('/:groupId/messages/:messageId/like', protect, async (req, res) => {
  try {
    const message = await GroupMessage.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const group = await Group.findById(req.params.groupId);
    if (!group.members.some(m => String(m) === req.userId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    if (message.likes.includes(req.userId)) {
      message.likes = message.likes.filter(id => String(id) !== req.userId);
    } else {
      message.likes.push(req.userId);
    }

    await message.save();
    await message.populate('sender', 'username profilePicture');

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search groups
router.get('/search', protect, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search public groups only
    const groups = await Group.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      isPrivate: false
    })
      .populate('creator', 'username profilePicture')
      .populate('members', 'username profilePicture')
      .limit(20);

    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

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

// Follow user
router.put('/:id/follow', protect, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.following.includes(req.params.id)) {
      currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
      userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== req.userId);
    } else {
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.userId);
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({ message: 'Follow toggled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

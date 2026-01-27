const express = require('express');
const Hashtag = require('../models/Hashtag');
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Extract hashtags from text
const extractHashtags = (text) => {
  if (!text) return [];
  const regex = /#\w+/g;
  const matches = text.match(regex) || [];
  return matches.map(tag => tag.slice(1).toLowerCase()); // Remove # and lowercase
};

// Get trending hashtags
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const hashtags = await Hashtag.find()
      .sort({ postCount: -1 })
      .limit(limit)
      .select('name postCount followers');

    res.json(hashtags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search hashtags (must come before /:hashtag routes)
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const hashtags = await Hashtag.find({ 
      name: { $regex: `^${query}`, $options: 'i' } 
    })
    .select('name postCount followers')
    .limit(10)
    .sort({ postCount: -1 });

    res.json(hashtags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get hashtag details and posts
router.get('/:hashtag/posts', async (req, res) => {
  try {
    const { hashtag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const hashtagDoc = await Hashtag.findOne({ name: hashtag.toLowerCase() });
    
    if (!hashtagDoc) {
      return res.json({
        hashtag: hashtag.toLowerCase(),
        posts: [],
        total: 0,
        isFollowed: false,
        pagination: { page, limit, total: 0, pages: 0 }
      });
    }

    const posts = await Post.find({ hashtags: hashtag.toLowerCase() })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profilePicture')
      .populate('comments.author', 'username')
      .populate('comments.replies.author', 'username profilePicture');

    const total = await Post.countDocuments({ hashtags: hashtag.toLowerCase() });

    // Check if current user follows this hashtag
    const token = req.headers.authorization?.split(' ')[1];
    let isFollowed = false;
    if (token) {
      try {
        const userId = require('../middleware/auth').getUserIdFromToken(token);
        isFollowed = hashtagDoc.followers.includes(userId);
      } catch (err) {
        // Token parsing failed, not followed
      }
    }

    res.json({
      hashtag: hashtag.toLowerCase(),
      posts,
      total: hashtagDoc.postCount,
      isFollowed,
      followerCount: hashtagDoc.followers.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Follow hashtag
router.post('/:hashtag/follow', protect, async (req, res) => {
  try {
    const { hashtag } = req.params;
    const hashtagName = hashtag.toLowerCase();

    let hashtagDoc = await Hashtag.findOne({ name: hashtagName });
    
    if (!hashtagDoc) {
      hashtagDoc = new Hashtag({ name: hashtagName });
    }

    // Check if already following
    if (hashtagDoc.followers.includes(req.userId)) {
      return res.status(400).json({ message: 'Already following this hashtag' });
    }

    hashtagDoc.followers.push(req.userId);
    await hashtagDoc.save();

    res.json({ message: 'Hashtag followed', followed: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unfollow hashtag
router.delete('/:hashtag/follow', protect, async (req, res) => {
  try {
    const { hashtag } = req.params;
    const hashtagName = hashtag.toLowerCase();

    const hashtagDoc = await Hashtag.findOne({ name: hashtagName });
    
    if (!hashtagDoc) {
      return res.status(404).json({ message: 'Hashtag not found' });
    }

    if (!hashtagDoc.followers.includes(req.userId)) {
      return res.status(400).json({ message: 'Not following this hashtag' });
    }

    hashtagDoc.followers = hashtagDoc.followers.filter(id => id.toString() !== req.userId);
    await hashtagDoc.save();

    res.json({ message: 'Hashtag unfollowed', followed: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check if user follows hashtag
router.get('/:hashtag/is-followed', protect, async (req, res) => {
  try {
    const { hashtag } = req.params;
    
    const hashtagDoc = await Hashtag.findOne({ name: hashtag.toLowerCase() });
    
    if (!hashtagDoc) {
      return res.json({ followed: false });
    }

    const followed = hashtagDoc.followers.includes(req.userId);
    res.json({ followed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's followed hashtags
router.get('/user/followed', protect, async (req, res) => {
  try {
    const hashtags = await Hashtag.find({ followers: req.userId })
      .select('name postCount followers')
      .sort({ name: 1 });

    res.json(hashtags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

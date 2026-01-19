const express = require('express');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username profilePicture').populate('comments.author', 'username');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create post
router.post('/', protect, async (req, res) => {
  try {
    const { caption, image } = req.body;

    const post = new Post({
      author: req.userId,
      caption,
      image
    });

    await post.save();
    await post.populate('author', 'username profilePicture');

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like post
router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.likes.includes(req.userId)) {
      post.likes = post.likes.filter(id => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({
      author: req.userId,
      text
    });

    await post.save();
    await post.populate('comments.author', 'username');

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

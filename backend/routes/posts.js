const express = require('express');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

const router = express.Router();

// Get feed (posts from followed users)
router.get('/', protect, async (req, res) => {
  try {
    const currentUser = await require('../models/User').findById(req.userId);
    const followingIds = currentUser.following || [];
    
    // Include current user's own posts
    followingIds.push(req.userId);

    const posts = await Post.find({ author: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate('author', 'username profilePicture')
      .populate('comments.author', 'username');
    
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's posts by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'username profilePicture')
      .populate('comments.author', 'username');
    
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single post by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePicture')
      .populate('comments.author', 'username');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get list of users who liked a post
router.get('/:id/likes', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('likes', 'username profilePicture');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post.likes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create post with file upload
router.post('/', protect, upload.single('media'), async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Determine media type
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const mediaPath = `/uploads/${req.file.filename}`;

    const post = new Post({
      author: req.userId,
      caption,
      media: mediaPath,
      mediaType
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

    const isLiking = !post.likes.includes(req.userId);

    if (isLiking) {
      post.likes.push(req.userId);
      
      // Create notification for post author (only if not liking own post)
      if (post.author.toString() !== req.userId) {
        const notification = new Notification({
          recipient: post.author,
          sender: req.userId,
          type: 'like',
          post: post._id
        });
        await notification.save();
      }
    } else {
      post.likes = post.likes.filter(id => id.toString() !== req.userId);
      
      // Delete like notification
      await Notification.deleteOne({
        recipient: post.author,
        sender: req.userId,
        type: 'like',
        post: post._id
      });
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

    // Create notification for post author (only if not commenting on own post)
    if (post.author.toString() !== req.userId) {
      const notification = new Notification({
        recipient: post.author,
        sender: req.userId,
        type: 'comment',
        post: post._id,
        message: text
      });
      await notification.save();
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like/Unlike comment by index
router.put('/:id/comment/:index/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= post.comments.length) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = post.comments[index];

    // Initialize likes array if it doesn't exist
    if (!comment.likes) {
      comment.likes = [];
    }

    // Check if already liked
    const alreadyLiked = comment.likes.some(id => id.toString() === req.userId);

    if (alreadyLiked) {
      // Remove like
      comment.likes = comment.likes.filter(id => id.toString() !== req.userId);
      
      // Delete notification
      await Notification.deleteOne({
        recipient: comment.author,
        sender: req.userId,
        type: 'like'
      });
    } else {
      // Add like
      comment.likes.push(req.userId);
      
      // Create notification (only if not liking own comment)
      if (comment.author.toString() !== req.userId) {
        await Notification.create({
          recipient: comment.author,
          sender: req.userId,
          type: 'like',
          post: post._id
        });
      }
    }

    await post.save();
    await post.populate('author', 'username profilePicture');
    await post.populate('comments.author', 'username');
    
    res.json(post);
  } catch (err) {
    console.error('Error liking comment:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

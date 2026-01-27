const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const SavedPost = require('../models/SavedPost');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');
const { validateReaction, getReactionLabel } = require('../utils/reactions');
const { processMentionsInComment } = require('../utils/mentions');

const router = express.Router();

// Get feed (posts from followed users) with pagination
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await require('../models/User').findById(req.userId);
    const followingIds = currentUser.following || [];
    
    // Include current user's own posts
    followingIds.push(req.userId);

    const posts = await Post.find({ author: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profilePicture')
      .populate('comments.author', 'username')
      .populate('comments.replies.author', 'username profilePicture');
    
    const total = await Post.countDocuments({ author: { $in: followingIds } });

    res.json({
      posts,
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

// Get user's posts by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'username profilePicture')
      .populate('comments.author', 'username')
      .populate('comments.replies.author', 'username profilePicture');
    
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
      .populate('comments.author', 'username')
      .populate('comments.replies.author', 'username profilePicture');
    
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

    // Extract hashtags from caption
    const Hashtag = require('../models/Hashtag');
    const extractHashtags = (text) => {
      if (!text) return [];
      const regex = /#\w+/g;
      const matches = text.match(regex) || [];
      return matches.map(tag => tag.slice(1).toLowerCase());
    };

    const hashtags = extractHashtags(caption);

    const post = new Post({
      author: req.userId,
      caption,
      hashtags,
      media: mediaPath,
      mediaType
    });

    await post.save();
    await post.populate('author', 'username profilePicture');

    // Create or update hashtag documents
    for (const tag of hashtags) {
      await Hashtag.findOneAndUpdate(
        { name: tag },
        {
          $addToSet: { posts: post._id },
          $inc: { postCount: 1 }
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reaction to post
router.put('/:id/reaction/:emoji', protect, async (req, res) => {
  try {
    // Decode URL-encoded emoji
    const emoji = decodeURIComponent(req.params.emoji);
    
    // Validate emoji
    if (!validateReaction(emoji)) {
      return res.status(400).json({ message: `Invalid reaction emoji: ${emoji}` });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Initialize reactions if not exists
    if (!post.reactions) {
      post.reactions = {};
    }

    // Initialize emoji array if not exists
    if (!post.reactions[emoji]) {
      post.reactions[emoji] = [];
    }

    // Check if user already reacted with this emoji
    const hasReacted = post.reactions[emoji].includes(req.userId);

    if (hasReacted) {
      // Remove reaction
      post.reactions[emoji] = post.reactions[emoji].filter(id => id.toString() !== req.userId);
    } else {
      // Remove user from all other reactions
      Object.keys(post.reactions).forEach(key => {
        post.reactions[key] = post.reactions[key].filter(id => id.toString() !== req.userId);
      });

      // Add new reaction
      post.reactions[emoji].push(req.userId);

      // Create notification for post author (only if not reacting to own post)
      if (post.author.toString() !== req.userId) {
        await Notification.create({
          recipient: post.author,
          sender: req.userId,
          type: 'reaction',
          message: `${getReactionLabel(emoji)} reacted to your post`,
          post: post._id
        });
      }
    }

    // Clean up empty reaction arrays
    Object.keys(post.reactions).forEach(key => {
      if (post.reactions[key].length === 0) {
        delete post.reactions[key];
      }
    });

    // Also update likes field for backward compatibility (❤️ only)
    post.likes = post.reactions['❤️'] || [];

    await post.save();
    await post.populate('author', 'username');
    
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy like endpoint (maps to ❤️ reaction)
router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Initialize reactions if not exists
    if (!post.reactions) {
      post.reactions = {};
    }

    if (!post.reactions['❤️']) {
      post.reactions['❤️'] = [];
    }

    const isLiking = !post.reactions['❤️'].includes(req.userId);

    if (isLiking) {
      post.reactions['❤️'].push(req.userId);
      
      // Create notification for post author (only if not liking own post)
      if (post.author.toString() !== req.userId) {
        await Notification.create({
          recipient: post.author,
          sender: req.userId,
          type: 'reaction',
          message: 'Loved your post',
          post: post._id
        });
      }
    } else {
      post.reactions['❤️'] = post.reactions['❤️'].filter(id => id.toString() !== req.userId);
      
      // Delete reaction notification
      await Notification.deleteOne({
        recipient: post.author,
        sender: req.userId,
        type: 'reaction',
        post: post._id
      });
    }

    // Also update likes field for backward compatibility
    post.likes = post.reactions['❤️'] || [];

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

    // Create comment with new ID
    const commentId = new mongoose.Types.ObjectId();
    post.comments.push({
      _id: commentId,
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
        comment: commentId,
        message: text
      });
      await notification.save();
    }

    // Process mentions in comment
    await processMentionsInComment(
      text,
      req.userId,
      post._id,
      commentId,
      'comment'
    );

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

// Save/Bookmark post
router.post('/:postId/save', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already saved
    const existingSave = await SavedPost.findOne({
      user: req.userId,
      post: req.params.postId
    });

    if (existingSave) {
      // Unsave
      await SavedPost.deleteOne({ _id: existingSave._id });
      return res.json({ message: 'Post unsaved', saved: false });
    }

    // Save
    await SavedPost.create({
      user: req.userId,
      post: req.params.postId
    });

    res.json({ message: 'Post saved', saved: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get saved posts
router.get('/saved/posts', protect, async (req, res) => {
  try {
    const savedPosts = await SavedPost.find({ user: req.userId })
      .populate({
        path: 'post',
        populate: [
          { path: 'author', select: 'username profilePicture' }
        ]
      })
      .sort({ savedAt: -1 });

    const posts = savedPosts.map(sp => sp.post);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check if post is saved
router.get('/:postId/is-saved', protect, async (req, res) => {
  try {
    const saved = await SavedPost.findOne({
      user: req.userId,
      post: req.params.postId
    });

    res.json({ saved: !!saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save post
router.post('/:postId/save', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already saved
    const existingSave = await SavedPost.findOne({
      user: req.userId,
      post: req.params.postId
    });

    if (existingSave) {
      return res.status(400).json({ message: 'Post already saved' });
    }

    const savedPost = new SavedPost({
      user: req.userId,
      post: req.params.postId
    });

    await savedPost.save();
    res.status(201).json({ message: 'Post saved', saved: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unsave post
router.delete('/:postId/save', protect, async (req, res) => {
  try {
    const result = await SavedPost.findOneAndDelete({
      user: req.userId,
      post: req.params.postId
    });

    if (!result) {
      return res.status(404).json({ message: 'Saved post not found' });
    }

    res.json({ message: 'Post unsaved', saved: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's saved posts
router.get('/saved/list', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const savedPosts = await SavedPost.find({ user: req.userId })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'post',
        populate: [
          { path: 'author', select: 'username profilePicture' },
          { path: 'comments.author', select: 'username' },
          { path: 'comments.replies.author', select: 'username profilePicture' }
        ]
      });

    const total = await SavedPost.countDocuments({ user: req.userId });

    res.json({
      posts: savedPosts.map(sp => sp.post),
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

// Edit post
router.put('/:id', protect, async (req, res) => {
  try {
    const { caption } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is post author
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    post.caption = caption || post.caption;
    post.updatedAt = Date.now();
    await post.save();
    await post.populate('author', 'username profilePicture');

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete post
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is post author
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Post.findByIdAndDelete(req.params.id);
    await SavedPost.deleteMany({ post: req.params.id });
    await Notification.deleteMany({ post: req.params.id });

    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add reply to comment
router.post('/:postId/comment/:commentIdx/reply', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const commentIdx = parseInt(req.params.commentIdx);
    const comment = post.comments[commentIdx];
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!comment.replies) {
      comment.replies = [];
    }

    const replyId = new mongoose.Types.ObjectId();
    const reply = {
      _id: replyId,
      author: req.userId,
      text,
      likes: [],
      createdAt: Date.now()
    };

    comment.replies.push(reply);
    await post.save();

    // Populate the reply author
    await post.populate('comments.replies.author', 'username profilePicture');

    // Get the newly added reply with populated author
    const savedReply = comment.replies[comment.replies.length - 1];

    // Create notification for comment author (only if not replying to own comment)
    if (comment.author.toString() !== req.userId) {
      const notification = new Notification({
        recipient: comment.author,
        sender: req.userId,
        type: 'comment',
        post: post._id,
        comment: comment._id,
        message: text,
        mentionedIn: 'reply'
      });
      await notification.save();
    }

    // Process mentions in reply
    await processMentionsInComment(
      text,
      req.userId,
      post._id,
      replyId,
      'reply'
    );

    res.status(201).json(savedReply);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete reply
router.delete('/:postId/comment/:commentIdx/reply/:replyId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const commentIdx = parseInt(req.params.commentIdx);
    const comment = post.comments[commentIdx];
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Check if user is reply author
    if (reply.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    reply.deleteOne();
    await post.save();

    res.json({ message: 'Reply deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like reply
router.put('/:postId/comment/:commentIdx/reply/:replyId/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const commentIdx = parseInt(req.params.commentIdx);
    const comment = post.comments[commentIdx];
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const isLiking = !reply.likes.includes(req.userId);

    if (isLiking) {
      reply.likes.push(req.userId);
    } else {
      reply.likes = reply.likes.filter(id => id.toString() !== req.userId);
    }

    await post.save();
    res.json(reply);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const Story = require('../models/Story');
const User = require('../models/User');
const Notification = require('../models/Notification');
const upload = require('../config/multer');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Create story
router.post('/', protect, upload.single('media'), async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No media uploaded' });
    }

    // Determine media type
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const mediaPath = `/uploads/${req.file.filename}`;

    const story = new Story({
      author: req.userId,
      caption,
      media: mediaPath,
      mediaType
    });

    await story.save();
    await story.populate('author', 'username profilePicture');

    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get stories from followed users (story feed)
router.get('/feed', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const followingIds = currentUser.following || [];
    
    // Include current user's stories
    followingIds.push(req.userId);

    // Get stories from last 24 hours from followed users
    const stories = await Story.find({
      author: { $in: followingIds },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username profilePicture');

    // Group stories by user
    const groupedStories = {};
    stories.forEach(story => {
      if (!groupedStories[story.author._id]) {
        groupedStories[story.author._id] = {
          user: story.author,
          stories: []
        };
      }
      groupedStories[story.author._id].stories.push(story);
    });

    res.json(Object.values(groupedStories));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get stories from specific user
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const stories = await Story.find({
      author: req.params.userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .sort({ createdAt: 1 })
      .populate('author', 'username profilePicture');

    if (!stories || stories.length === 0) {
      return res.json([]);
    }

    // Record view
    stories.forEach(story => {
      const hasViewed = story.views.some(v => String(v.userId) === req.userId);
      if (!hasViewed) {
        story.views.push({ userId: req.userId });
      }
    });
    await Promise.all(stories.map(s => s.save()));

    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single story
router.get('/:storyId', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId)
      .populate('author', 'username profilePicture');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Record view if not already viewed
    const hasViewed = story.views.some(v => String(v.userId) === req.userId);
    if (!hasViewed) {
      story.views.push({ userId: req.userId });
      await story.save();
    }

    res.json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete story
router.delete('/:storyId', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Only owner can delete
    if (String(story.author) !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Story.findByIdAndDelete(req.params.storyId);
    res.json({ message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like/Unlike story
router.put('/:storyId/like', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if already liked
    const isLiked = story.likes.some(like => String(like._id) === req.userId);

    if (isLiked) {
      // Unlike
      story.likes = story.likes.filter(like => String(like._id) !== req.userId);
      
      // Delete like notification
      await Notification.deleteOne({
        recipient: story.author._id,
        sender: req.userId,
        type: 'story_like',
        reference: req.params.storyId
      });
    } else {
      // Like
      story.likes.push(req.userId);
      
      // Create notification only if liking own story is avoided
      if (String(story.author._id) !== req.userId) {
        const currentUser = await User.findById(req.userId);
        await Notification.create({
          recipient: story.author._id,
          sender: req.userId,
          type: 'story_like',
          message: `${currentUser.username} liked your story`,
          reference: req.params.storyId
        });
      }
    }

    await story.save();
    await story.populate('likes', 'username profilePicture');

    res.json({
      _id: story._id,
      likes: story.likes,
      likeCount: story.likes.length,
      isLiked: !isLiked
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get story viewers
router.get('/:storyId/viewers', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId)
      .populate('views.userId', 'username profilePicture');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Only owner can see viewers
    if (String(story.author) !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      storyId: story._id,
      totalViews: story.views.length,
      viewers: story.views.map(v => ({
        user: v.userId,
        viewedAt: v.viewedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

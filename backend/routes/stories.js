const express = require('express');
const Story = require('../models/Story');
const StoryShare = require('../models/StoryShare');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const upload = require('../config/multer');
const { protect } = require('../middleware/auth');
const { validateReaction, getReactionLabel } = require('../utils/reactions');

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
    const mediaPath = req.file.path; // Cloudinary provides the full URL

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

// Get shared stories (received) - MUST come before /:storyId route
router.get('/received/shares', protect, async (req, res) => {
  try {
    const shares = await StoryShare.find({ sharedWith: req.userId })
      .populate('story')
      .populate('sharedBy', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.json(shares);
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

// Reply to story - sends as a direct message to story author
router.post('/:storyId/reply', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const story = await Story.findById(req.params.storyId)
      .populate('author', 'username profilePicture _id');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Reply message cannot be empty' });
    }

    const sender = await User.findById(req.userId).select('username profilePicture');
    if (!sender) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow replying to own story
    if (String(story.author._id) === req.userId) {
      return res.status(400).json({ message: 'You cannot reply to your own story' });
    }

    // Create message as story reply
    const messageDoc = await Message.create({
      sender: req.userId,
      recipient: story.author._id,
      text: message.trim(),
      storyReply: {
        storyId: req.params.storyId,
        storyAuthor: story.author._id,
        storyMedia: story.media,
        storyCaption: story.caption
      }
    });

    // Populate sender info
    await messageDoc.populate('sender', 'username profilePicture');

    // Create notification for story author
    await Notification.create({
      recipient: story.author._id,
      sender: req.userId,
      type: 'message',
      message: `${sender.username} replied to your story`
    });

    res.status(201).json({
      message: 'Reply sent successfully',
      reply: messageDoc
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get story replies (messages with storyReply metadata)
router.get('/:storyId/replies', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Get all messages that are replies to this story
    const replies = await Message.find({
      'storyReply.storyId': req.params.storyId
    })
      .populate('sender', 'username profilePicture _id')
      .sort({ createdAt: 1 });

    res.json(replies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like/Unlike story
// Story reaction endpoint
router.put('/:storyId/reaction/:emoji', protect, async (req, res) => {
  try {
    // Decode URL-encoded emoji
    const emoji = decodeURIComponent(req.params.emoji);
    
    // Validate emoji
    if (!validateReaction(emoji)) {
      return res.status(400).json({ message: `Invalid reaction emoji: ${emoji}` });
    }

    const story = await Story.findById(req.params.storyId)
      .populate('author', 'username profilePicture');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Initialize reactions if not exists
    if (!story.reactions) {
      story.reactions = {};
    }

    if (!story.reactions[emoji]) {
      story.reactions[emoji] = [];
    }

    // Check if user already reacted with this emoji
    const hasReacted = story.reactions[emoji].includes(req.userId);

    if (hasReacted) {
      // Remove reaction
      story.reactions[emoji] = story.reactions[emoji].filter(id => id.toString() !== req.userId);
    } else {
      // Remove user from all other reactions
      Object.keys(story.reactions).forEach(key => {
        story.reactions[key] = story.reactions[key].filter(id => id.toString() !== req.userId);
      });

      // Add new reaction
      story.reactions[emoji].push(req.userId);

      // Create notification for story author
      if (String(story.author._id) !== req.userId) {
        const currentUser = await User.findById(req.userId);
        await Notification.create({
          recipient: story.author._id,
          sender: req.userId,
          type: 'story_reaction',
          message: `${currentUser.username} ${getReactionLabel(emoji)} your story`
        });
      }
    }

    // Clean up empty reaction arrays
    Object.keys(story.reactions).forEach(key => {
      if (story.reactions[key].length === 0) {
        delete story.reactions[key];
      }
    });

    // Also update likes field for backward compatibility
    story.likes = story.reactions['❤️'] || [];

    await story.save();

    res.json({
      _id: story._id,
      reactions: story.reactions,
      isReacted: true
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy like endpoint (maps to ❤️ reaction)
router.put('/:storyId/like', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Initialize reactions if not exists
    if (!story.reactions) {
      story.reactions = {};
    }

    if (!story.reactions['❤️']) {
      story.reactions['❤️'] = [];
    }

    // Check if already liked
    const isLiked = story.reactions['❤️'].some(id => String(id) === req.userId);

    if (isLiked) {
      // Unlike
      story.reactions['❤️'] = story.reactions['❤️'].filter(id => String(id) !== req.userId);
      
      // Delete like notification
      await Notification.deleteOne({
        recipient: story.author._id,
        sender: req.userId,
        type: 'story_reaction'
      });
    } else {
      // Like
      story.reactions['❤️'].push(req.userId);
      
      // Create notification only if liking own story is avoided
      if (String(story.author._id) !== req.userId) {
        const currentUser = await User.findById(req.userId);
        await Notification.create({
          recipient: story.author._id,
          sender: req.userId,
          type: 'story_reaction',
          message: `${currentUser.username} loved your story`
        });
      }
    }

    // Also update likes field for backward compatibility
    story.likes = story.reactions['❤️'] || [];

    await story.save();
    await story.populate('likes', 'username profilePicture');

    res.json({
      _id: story._id,
      likes: story.likes,
      reactions: story.reactions,
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

// Share story with friends
router.post('/:storyId/share', protect, async (req, res) => {
  try {
    const { friendIds, message } = req.body;
    const story = await Story.findById(req.params.storyId).populate('author', 'isPrivate');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Get current user info
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user can share (must be following or own story)
    const storyAuthor = await User.findById(story.author._id);
    const canShare = String(story.author._id) === req.userId || 
                     currentUser.following.includes(story.author._id);

    if (!canShare) {
      return res.status(403).json({ message: 'You can only share stories from users you follow' });
    }

    // Validate friends
    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one friend' });
    }

    // Share with each friend
    const shares = [];
    for (const friendId of friendIds) {
      // Check if story author is public or friend is a mutual friend
      if (storyAuthor.isPrivate) {
        // For private accounts, only mutual followers can receive shares
        const isMutualFollower = storyAuthor.followers.includes(friendId) && 
                                currentUser.following.includes(friendId);
        if (!isMutualFollower) {
          continue; // Skip this friend
        }
      }

      const existingShare = await StoryShare.findOne({
        story: req.params.storyId,
        sharedBy: req.userId,
        sharedWith: friendId
      });

      if (!existingShare) {
        const share = await StoryShare.create({
          story: req.params.storyId,
          sharedBy: req.userId,
          sharedWith: friendId,
          message
        });
        shares.push(share);

        // Create notification for receiving user
        const shareMessage = message 
          ? `${currentUser.username} shared a story: "${message}"`
          : `${currentUser.username} shared a story with you`;
        
        await Notification.create({
          recipient: friendId,
          sender: req.userId,
          type: 'story_share',
          message: shareMessage,
          reference: req.params.storyId
        });
      }
    }

    res.status(201).json({
      message: `Story shared with ${shares.length} friend(s)`,
      shares
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

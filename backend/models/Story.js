const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  caption: String,
  views: [{
    userId: mongoose.Schema.Types.ObjectId,
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: {
    '❤️': [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    '😂': [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    '🔥': [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    '😮': [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    '😢': [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    '😡': [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  // Keep likes for backward compatibility - maps to ❤️ reaction
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    // Auto-delete after 24 hours
    expires: 86400
  }
});

module.exports = mongoose.model('Story', storySchema);

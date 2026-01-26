const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: String,
  media: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
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
  comments: [{
    _id: mongoose.Schema.Types.ObjectId,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replies: [{
      _id: mongoose.Schema.Types.ObjectId,
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: String,
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', postSchema);

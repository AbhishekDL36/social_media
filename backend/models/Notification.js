const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['follow', 'like', 'comment', 'message', 'share', 'reaction', 'story_reaction', 'story_reply', 'story_like', 'mention'],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post.comments'  // Reference to the comment/reply
  },
  message: String,
  read: {
    type: Boolean,
    default: false
  },
  mentionedIn: {
    type: String,
    enum: ['post_caption', 'comment', 'reply'],
    default: 'comment'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    default: null
  },
  messageType: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text'
  },
  voiceUrl: {
    type: String,
    default: null
  },
  voiceDuration: {
    type: Number,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Story reply metadata - allows replies to be linked back to the story
  storyReply: {
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story'
    },
    storyAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    storyMedia: String,
    storyCaption: String
  },
  deleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);

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
    required: true
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);

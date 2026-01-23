const mongoose = require('mongoose');

const storyShareSchema = new mongoose.Schema({
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    required: true
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StoryShare', storyShareSchema);

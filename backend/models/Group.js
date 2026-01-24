const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  profilePicture: {
    type: String,
    default: null
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Member roles (creator is admin by default)
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-add creator to members and admins
groupSchema.pre('save', function(next) {
  if (!this.members.includes(this.creator)) {
    this.members.push(this.creator);
  }
  if (!this.admins.includes(this.creator)) {
    this.admins.push(this.creator);
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Group', groupSchema);

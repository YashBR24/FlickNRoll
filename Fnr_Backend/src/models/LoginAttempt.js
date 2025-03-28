const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 1
  },
  lastAttempt: {
    type: Date,
    default: Date.now
  },
  blockedUntil: {
    type: Date
  }
});

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
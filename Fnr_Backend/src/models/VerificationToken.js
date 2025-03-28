const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  password: {
    type: String
  },
  name: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7200 // Token expires after 2 hour
  }
});

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
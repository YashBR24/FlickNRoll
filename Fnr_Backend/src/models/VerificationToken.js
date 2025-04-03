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
  phoneNumber: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  dateOfBirth: {
    type: Date
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7200 // Token expires after 2 hours
  }
});

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);

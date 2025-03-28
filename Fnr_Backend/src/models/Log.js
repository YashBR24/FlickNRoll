const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  level: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  method: {
    type: String
  },
  endpoint: {
    type: String
  },
  statusCode: {
    type: Number
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
});

module.exports = mongoose.model('Log', logSchema);
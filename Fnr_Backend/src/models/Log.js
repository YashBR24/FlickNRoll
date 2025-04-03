// models/Log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  message: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Log', logSchema);
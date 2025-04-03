// middleware/logger.js
const Log = require('../models/Log');

const log = async (message) => {
  try {
    await Log.create({ message });
    console.log(`Log : ${message}`)

  } catch (error) {
    console.error(`Failed to save log: ${error.message}`);
  }
};

module.exports = { log };
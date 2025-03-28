const express = require('express');
const router = express.Router();
const {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  markItemsInUse,
  addItemsToInventory
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getInventory);
router.post('/', protect, addInventoryItem);
router.put('/:id', protect, updateInventoryItem);
router.delete('/:id', protect, deleteInventoryItem);
router.put('/in-use/:id', protect, markItemsInUse);
router.put('/:id/add', protect, addItemsToInventory);

module.exports = router;
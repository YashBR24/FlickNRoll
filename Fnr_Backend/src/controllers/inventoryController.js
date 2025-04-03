const asyncHandler = require('express-async-handler');
const Inventory = require('../models/Inventory');
const Transaction = require('../models/Transaction');
const { log } = require('../middleware/logger');

const getNextInventoryNumber = async () => {
  const maxNumber = await Inventory.findOne().sort({ number: -1 }).select('number').lean();
  return maxNumber ? maxNumber.number + 1 : 1;
};

const getInventory = asyncHandler(async (req, res) => {
  log('FETCHING_INVENTORY_ITEMS');
  const inventory = await Inventory.find();
  log(`INVENTORY_ITEMS_RETRIEVED_${inventory.length}`);
  res.status(200).json(inventory);
});

const addInventoryItem = asyncHandler(async (req, res) => {
  log('ADDING_NEW_INVENTORY_ITEM');
  const { item, category, quantity, notes } = req.body;
  if (!item || !category || !quantity) {
    log('MISSING_REQUIRED_FIELDS_INVENTORY');
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const inventoryItem = await Inventory.create({
    item,
    category,
    quantity,
    notes,
    purchaseDate: new Date(),
  });
  log(`NEW_INVENTORY_ITEM_ADDED_${item}`);
  res.status(201).json(inventoryItem);
});

const updateInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  log(`UPDATING_INVENTORY_ITEM_${id}`);
  const item = await Inventory.findById(id);
  if (!item) {
    log(`INVENTORY_ITEM_NOT_FOUND_${id}`);
    res.status(404);
    throw new Error('Inventory item not found');
  }

  const updatedItem = await Inventory.findByIdAndUpdate(id, req.body, { new: true });
  log(`INVENTORY_ITEM_UPDATED_${id}`);
  res.status(200).json(updatedItem);
});

const deleteInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  log(`DELETING_INVENTORY_ITEM_${id}`);
  const item = await Inventory.findById(id);
  if (!item) {
    log(`INVENTORY_ITEM_NOT_FOUND_${id}`);
    res.status(404);
    throw new Error('Inventory item not found');
  }

  await item.deleteOne();
  log(`INVENTORY_ITEM_DELETED_${id}`);
  res.status(200).json({ id });
});

const markItemsInUse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  log(`MARKING_ITEMS_IN_USE_${id}`);

  if (!quantity || quantity <= 0) {
    log('INVALID_QUANTITY_SPECIFIED');
    res.status(400);
    throw new Error('Please provide a valid quantity');
  }

  const item = await Inventory.findById(id);
  if (!item) {
    log(`INVENTORY_ITEM_NOT_FOUND_${id}`);
    res.status(404);
    throw new Error('Inventory item not found');
  }

  if (item.available < quantity) {
    log('INSUFFICIENT_QUANTITY_AVAILABLE');
    res.status(400);
    throw new Error(`Only ${item.available} items available`);
  }

  item.inUse += quantity;
  await item.save();
  log(`ITEMS_MARKED_IN_USE_${quantity}`);
  res.status(200).json(item);
});

const addItemsToInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  log(`ADDING_ITEMS_TO_INVENTORY_${id}`);

  if (!quantity || quantity <= 0) {
    log('INVALID_QUANTITY_TO_ADD');
    res.status(400);
    throw new Error('Please provide a valid quantity to add');
  }

  const item = await Inventory.findById(id);
  if (!item) {
    log(`INVENTORY_ITEM_NOT_FOUND_${id}`);
    res.status(404);
    throw new Error('Inventory item not found');
  }

  item.quantity += quantity;
  const updatedItem = await item.save();
  log(`ITEMS_ADDED_TO_INVENTORY_${id}_${quantity}`);
  res.status(200).json(updatedItem);
});

module.exports = {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  markItemsInUse,
  addItemsToInventory,
};

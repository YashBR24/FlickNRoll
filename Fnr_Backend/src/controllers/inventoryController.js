const asyncHandler = require('express-async-handler');
const Inventory = require('../models/Inventory');
const Transaction = require('../models/Transaction');
const { saveLogToDB } = require('../middleware/logger');


// Function to get the next inventory number
const getNextInventoryNumber = async () => {
  const maxNumber = await Inventory.findOne().sort({ number: -1 }).select('number').lean();
  return maxNumber ? maxNumber.number + 1 : 1; // If no documents, start at 1
};

// Function to get the next transaction number
// const getNextTransactionNumber = async () => {
//   const count = await Transaction.countDocuments();
//   return count + 1;
// };

// Function to get the next transaction number
// const getNextTransactionNumber = async () => {
//   const count = await Transaction.countDocuments();
//   return count + 1;
// };

const getInventory = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching inventory items', req.method, req.originalUrl, null, req.user?.id);
    const inventory = await Inventory.find();
    await saveLogToDB('info', `Retrieved ${inventory.length} inventory items`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(inventory);
  } catch (error) {
    await saveLogToDB('error', `Error fetching inventory: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const addInventoryItem = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Adding new inventory item', req.method, req.originalUrl, null, req.user?.id);

    const { item, category, quantity, notes } = req.body; // , price, paymentMethod

    if (!item || !category || !quantity ) { // || !price || !paymentMethod
      await saveLogToDB('warn', 'Missing required fields for inventory item', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    // const validPaymentMethods = ['Cash', 'UPI', 'Card', 'other'];
    // if (!validPaymentMethods.includes(paymentMethod)) {
    //   await saveLogToDB('warn', 'Invalid payment method', req.method, req.originalUrl, 400, req.user?.id);
    //   res.status(400);
    //   throw new Error('Invalid payment method. Must be one of: Cash, UPI, Card, other');
    // }

    // const inventoryNumber = await getNextInventoryNumber();
    const inventoryItem = await Inventory.create({
      // number: inventoryNumber,
      item,
      category,
      quantity,
      notes,
      // price,
      // paymentMethod,
      purchaseDate: new Date(),
    });

    // const transactionNumber = await getNextTransactionNumber();
    // await Transaction.create({
    //   number: transactionNumber,
    //   type: 'expense',
    //   entryType: 'OUT',
    //   category: 'inventory',
    //   amount: price,
    //   description: `Purchase of ${quantity} ${item}(s)`,
    //   paymentMethod,
    //   reference: inventoryItem._id,
    //   referenceModel: 'Inventory',
    //   recordedBy: req.user.id,
    // });

    // await saveLogToDB('info', `Added new inventory item: ${item} with number ${inventoryNumber} and transaction number ${transactionNumber}`, req.method, req.originalUrl, 201, req.user?.id);
    res.status(201).json(inventoryItem);
  } catch (error) {
    await saveLogToDB('error', `Error adding inventory item: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const updateInventoryItem = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    await saveLogToDB('info', `Updating inventory item: ${id}`, req.method, req.originalUrl, null, req.user?.id);

    const item = await Inventory.findById(id);
    if (!item) {
      await saveLogToDB('warn', `Inventory item not found: ${id}`, req.method, req.originalUrl, 404, req.user?.id);
      res.status(404);
      throw new Error('Inventory item not found');
    }

    const updatedItem = await Inventory.findByIdAndUpdate(id, req.body, { new: true });

    await saveLogToDB('info', `Updated inventory item: ${id}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(updatedItem);
  } catch (error) {
    await saveLogToDB('error', `Error updating inventory item: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const deleteInventoryItem = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    await saveLogToDB('info', `Deleting inventory item: ${id}`, req.method, req.originalUrl, null, req.user?.id);

    const item = await Inventory.findById(id);
    if (!item) {
      await saveLogToDB('warn', `Inventory item not found: ${id}`, req.method, req.originalUrl, 404, req.user?.id);
      res.status(404);
      throw new Error('Inventory item not found');
    }

    await item.deleteOne();

    await saveLogToDB('info', `Deleted inventory item: ${id}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({ id });
  } catch (error) {
    await saveLogToDB('error', `Error deleting inventory item: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const markItemsInUse = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    console.log('Mark in-use endpoint hit:', { id, quantity, method: req.method });
    await saveLogToDB('info', `Marking items as in-use: ${id}`, req.method, req.originalUrl, null, req.user?.id);

    if (!quantity || quantity <= 0) {
      await saveLogToDB('warn', 'Invalid quantity specified', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error('Please provide a valid quantity');
    }

    const item = await Inventory.findById(id);
    if (!item) {
      await saveLogToDB('warn', `Inventory item not found: ${id}`, req.method, req.originalUrl, 404, req.user?.id);
      res.status(404);
      throw new Error('Inventory item not found');
    }

    if (item.available < quantity) {
      await saveLogToDB('warn', 'Insufficient available quantity', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error(`Only ${item.available} items available`);
    }

    item.inUse += quantity;
    await item.save();

    await saveLogToDB('info', `Marked ${quantity} items as in-use`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(item);
  } catch (error) {
    console.error('Error in markItemsInUse:', error.message);
    await saveLogToDB('error', `Error marking items as in-use: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const addItemsToInventory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    await saveLogToDB('info', `Adding items to inventory item: ${id}`, req.method, req.originalUrl, null, req.user?.id);

    if (!quantity || quantity <= 0) {
      await saveLogToDB('warn', 'Invalid quantity specified', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error('Please provide a valid quantity to add');
    }

    const item = await Inventory.findById(id);
    if (!item) {
      await saveLogToDB('warn', `Inventory item not found: ${id}`, req.method, req.originalUrl, 404, req.user?.id);
      res.status(404);
      throw new Error('Inventory item not found');
    }

    item.quantity += quantity;
    const updatedItem = await item.save();

    await saveLogToDB('info', `Added ${quantity} items to inventory item: ${id}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(updatedItem);
  } catch (error) {
    await saveLogToDB('error', `Error adding items to inventory: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

module.exports = {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  markItemsInUse,
  addItemsToInventory,
};
const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['income', 'expense'],
        default: 'income',
    },
    entryType: {
        type: String,
        required: true,
        enum: ['IN', 'OUT'],
        default: 'IN',
    },
    category1category: {
        type: String,
        required: true,
        enum: ['booking', 'inventory', 'transactions', 'other', 'membership'],
        default: 'transactions',
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    description: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash', 'UPI', 'Card', 'Member', 'other', 'cash'],
    },
    reference: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
});

module.exports = mongoose.model('Transaction', transactionSchema);
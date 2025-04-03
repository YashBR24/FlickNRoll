const mongoose = require('mongoose');

const inventorySchema = mongoose.Schema(
    {
        item: {
            type: String,
            required: [true, 'Please add an item name'],
        },
        category: {
            type: String,
            required: [true, 'Please add a category'],
            enum: ['Equipment', 'Accessories', 'Safety', 'other'],
        },
        quantity: {
            type: Number,
            required: [true, 'Please add quantity'],
            min: [0, 'Quantity cannot be negative'],
        },
        inUse: {
            type: Number,
            default: 0,
            min: [0, 'In-use quantity cannot be negative'],
        },
        available: {
            type: Number,
            default: function () {
                return this.quantity - (this.inUse || 0);
            },
        },
        purchaseDate: {
            type: Date,
            default: Date.now,
        },
        lastChecked: {
            type: Date,
            default: Date.now,
        },
        notes: {
            type: String,
        },

    },
    {
        timestamps: true,
    }
);

// Pre-save middleware to update available quantity and lastChecked
inventorySchema.pre('save', function (next) {
    this.available = this.quantity - (this.inUse || 0);

    if (this.available < 0) {
        return next(new Error('Available quantity cannot be negative. Check inUse and quantity values.'));
    }

    if (this.isModified('inUse') || this.isModified('quantity')) {
        this.lastChecked = new Date();
    }

    next();
});

// Method to mark items as in-use
inventorySchema.methods.markInUse = async function (quantity) {
    if (!quantity || quantity <= 0) {
        throw new Error('Please provide a valid quantity to mark as in-use');
    }

    const available = this.quantity - (this.inUse || 0);
    if (available < quantity) {
        throw new Error(`Only ${available} items available to mark as in-use`);
    }

    this.inUse = (this.inUse || 0) + quantity;
    return this.save();
};

module.exports = mongoose.model('Inventory', inventorySchema);
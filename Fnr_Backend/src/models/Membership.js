const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a membership name'],
            unique: true,
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
        },
        features: [{
            type: String,
        }],
        totalHours: {
            type: Number,
            required: [true, 'Please specify total hours allowed'],
            min: [1, 'Total hours must be a positive number'],
        },
        durationDays: {
            type: Number,
            required: [true, 'Please specify duration in days'],
        },
        price: {
            type: Number,
            required: [true, 'Please specify price'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Membership', membershipSchema);
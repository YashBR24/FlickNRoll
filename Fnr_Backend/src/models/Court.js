const mongoose = require('mongoose');

const courtSchema = mongoose.Schema(
    {
        number: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            unique: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Court', courtSchema);
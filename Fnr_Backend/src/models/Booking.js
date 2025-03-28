const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        court: {
            type: Number,
            required: [true, 'Please select a court number'],
            min: 1,
        },
        date: {
            type: Date,
            required: [true, 'Please select a date'],
        },
        startTime: {
            type: String,
            required: [true, 'Please select a start time'],
        },
        duration: {
            type: Number,
            required: [true, 'Please select duration in hours'],
            default: 1,
        },
        totalAmount: {
            type: Number,
            required: function() { return this.bookingType === 'general'; },
            default: function() { return this.bookingType === 'member' ? 0 : undefined; },
            min: [0, 'Total amount cannot be negative'],
        },
        advancePayment: {
            type: Number,
            required: function() { return this.bookingType === 'general'; },
            default: function() { return this.bookingType === 'member' ? 0 : undefined; },
            min: [0, 'Advance payment cannot be negative'],
            validate: {
                validator: function(value) {
                    return this.bookingType === 'general' ? value <= this.totalAmount : true;
                },
                message: 'Advance payment cannot exceed total amount',
            },
        },
        paymentMethod: {
            type: String,
            enum: ['Cash', 'UPI', 'Card', 'Member', 'other'],
            required: function() { return this.bookingType === 'general'; },
            default: function() { return this.bookingType === 'member' ? 'Member' : undefined; },
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'partially_paid', 'paid'],
            default: function() {
                if (this.bookingType === 'member') return 'paid';
                if (this.bookingType === 'general') return this.advancePayment === this.totalAmount ? 'paid' : 'partially_paid';
                return 'pending';
            },
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'confirmed',
        },
        bookingType: {
            type: String,
            enum: ['general', 'member'],
            required: [true, 'Please specify booking type'],
        },
        players: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
            required: function() { return this.bookingType === 'member'; },
        }],
        name: {
            type: String,
            required: function() { return this.bookingType === 'general'; },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Booking', bookingSchema);
const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
        },
        phoneNumber: {
            type: String,
            required: [true, 'Please add a phone number'],
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true,
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'manager', 'member'],
            default: 'user',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
        },
        verificationTokenExpires: {
            type: Date,
        },
        registrationIP: {
            type: String,
        },
        lastLogin: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);

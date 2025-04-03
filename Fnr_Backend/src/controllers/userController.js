const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { log } = require('../middleware/logger');

const getUsers = asyncHandler(async (req, res) => {
    if (!req.user) {
        log('UNAUTHORIZED_USER_ACCESS_ATTEMPT_NO_USER');
        return res.status(401).json({ message: 'Not authorized, no user found' });
    }

    log(`FETCHING_ALL_USERS_BY-${req.user.name}`);
    const users = await User.find().select('name email _id role phoneNumber dateOfBirth isVerified').sort('name');

    const usersWithMembership = await Promise.all(users.map(async (user) => {
        const member = await Member.findOne({ user: user._id });
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: member ? 'member' : user.role || 'user',
            isMember: !!member,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            isVerified: user.isVerified,
        };
    }));

    res.status(200).json(usersWithMembership);
});

const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!req.user || req.user.role !== 'admin') {
        log(`UNAUTHORIZED_USER_UPDATE_ATTEMPT_${req.user?.role || 'NO_ROLE'}`);
        return res.status(403).json({ message: 'Only admins can update users' });
    }

    log(`UPDATING_USER_${id}_${req.user.name}`);
    const user = await User.findById(id);
    if (!user) {
        log(`USER_NOT_FOUND_${id}`);
        return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    const updatedUser = await user.save();
    const member = await Member.findOne({ user: updatedUser._id });

    res.status(200).json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: member ? 'member' : updatedUser.role,
        isMember: !!member,
    });
});

const promoteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!req.user || req.user.role !== 'admin') {
        log(`UNAUTHORIZED_USER_PROMOTION_ATTEMPT_${req.user?.role || 'NO_ROLE'}`);
        return res.status(403).json({ message: 'Only admins can promote users' });
    }

    log(`PROMOTING_USER_${id}_TO_${role}_${req.user.name}`);
    const user = await User.findById(id);
    if (!user) {
        log(`USER_NOT_FOUND_${id}`);
        return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    const updatedUser = await user.save();
    const updatedMember = await Member.findOne({ user: updatedUser._id });

    res.status(200).json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedMember ? 'member' : updatedUser.role,
        isMember: !!updatedMember,
    });
});

module.exports = { getUsers, updateUser, promoteUser };
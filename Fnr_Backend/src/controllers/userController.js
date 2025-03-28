const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { saveLogToDB } = require('../middleware/logger');

const getUsers = asyncHandler(async (req, res) => {
    try {
        await saveLogToDB('info', 'Fetching all users', req.method, req.originalUrl, null, req.user?.id);

        const users = await User.find()
            .select('name email _id role')
            .sort('name');

        const usersWithMembership = await Promise.all(users.map(async (user) => {
            const member = await Member.findOne({ user: user._id });
            return {
                id: user._id,
                name: user.name,
                email: user.email,
                role: member ? 'member' : user.role || 'user',
                isMember: !!member,
            };
        }));

        await saveLogToDB('info', `Retrieved ${usersWithMembership.length} users`, req.method, req.originalUrl, 200, req.user?.id);
        res.status(200).json(usersWithMembership);
    } catch (error) {
        console.error('Error fetching users:', error);
        await saveLogToDB('error', `Error fetching users: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

const updateUser = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        await saveLogToDB('info', `Updating user: ${id}`, req.method, req.originalUrl, null, req.user?.id);

        if (!req.user || req.user.role !== 'admin') {
            await saveLogToDB('warn', 'Unauthorized user update attempt', req.method, req.originalUrl, 403, req.user?.id);
            return res.status(403).json({ message: 'Only admins can update users' });
        }

        const user = await User.findById(id);
        if (!user) {
            await saveLogToDB('warn', `User not found: ${id}`, req.method, req.originalUrl, 404, req.user?.id);
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        const updatedUser = await user.save();

        const member = await Member.findOne({ user: updatedUser._id });
        await saveLogToDB('info', `User updated successfully: ${id}`, req.method, req.originalUrl, 200, req.user?.id);
        res.status(200).json({
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: member ? 'member' : updatedUser.role,
            isMember: !!member,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        await saveLogToDB('error', `Error updating user: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
        res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
});

const getNextTransactionNumber = async () => {
    const maxNumber = await Transaction.findOne().sort({ number: -1 }).select('number').lean();
    return maxNumber ? maxNumber.number + 1 : 1;
};

const promoteUser = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { role, membershipId, paymentMethod, phone, address, emergencyContactName, emergencyContactNumber } = req.body;

        await saveLogToDB('info', `Promoting user: ${id} to role: ${role}`, req.method, req.originalUrl, null, req.user?.id);

        console.log('req.user:', req.user);
        if (!req.user || req.user.role !== 'admin') {
            await saveLogToDB('warn', 'Unauthorized user promotion attempt', req.method, req.originalUrl, 403, req.user?.id);
            return res.status(403).json({ message: 'Only admins can promote users' });
        }

        const validRoles = ['user', 'manager', 'admin', 'member'];
        if (!role || !validRoles.includes(role)) {
            await saveLogToDB('warn', `Invalid role provided: ${role}`, req.method, req.originalUrl, 400, req.user?.id);
            return res.status(400).json({ message: 'Invalid role. Must be "user", "manager", "admin", or "member"' });
        }

        const user = await User.findById(id);
        if (!user) {
            await saveLogToDB('warn', `User not found: ${id}`, req.method, req.originalUrl, 404, req.user?.id);
            return res.status(404).json({ message: 'User not found' });
        }

        let member = await Member.findOne({ user: user._id });
        if (role === 'member') {
            if (!membershipId) {
                await saveLogToDB('warn', 'Membership ID required to promote to member', req.method, req.originalUrl, 400, req.user?.id);
                return res.status(400).json({ message: 'Membership ID required to promote to member' });
            }
            if (!paymentMethod) {
                await saveLogToDB('warn', 'Payment method required to promote to member', req.method, req.originalUrl, 400, req.user?.id);
                return res.status(400).json({ message: 'Payment method required to promote to member' });
            }

            if (!member) {
                member = await Member.create({
                    user: user._id,
                    email: user.email,
                    membership: membershipId,
                    phone: phone || '', // Use provided phone or default to empty
                    address: address || '', // Use provided address or default to empty
                    emergencyContact: {
                        contactName: emergencyContactName || '', // Use provided or default
                        contactNumber: emergencyContactNumber || '', // Use provided or default
                    },
                    paymentMethod: paymentMethod,
                    hoursRemaining: 0,
                    membershipStartDate: new Date(),
                    membershipEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    membershipStatus: 'active',
                });

                const membershipDetails = await mongoose.model('Membership').findById(membershipId);
                if (membershipDetails) {
                    member.hoursRemaining = membershipDetails.totalHours;
                    member.membershipEndDate = new Date(Date.now() + membershipDetails.durationDays * 24 * 60 * 60 * 1000);
                    await member.save();

                    const transactionNumber = await getNextTransactionNumber();
                    await Transaction.create({
                        number: transactionNumber,
                        type: 'income',
                        entryType: 'IN',
                        category: 'membership',
                        amount: membershipDetails.price || 0,
                        description: `Membership promotion - ${membershipDetails.name || 'Unknown'}`,
                        paymentMethod: paymentMethod,
                        reference: member._id,
                        referenceModel: 'Member',
                        recordedBy: req.user._id,
                        date: new Date(),
                    });
                }
            }
            user.role = 'user';
        } else {
            user.role = role;
        }

        const updatedUser = await user.save();
        const updatedMember = await Member.findOne({ user: updatedUser._id });
        await saveLogToDB('info', `User promoted successfully: ${id} to ${role}`, req.method, req.originalUrl, 200, req.user?.id);
        res.status(200).json({
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedMember ? 'member' : updatedUser.role,
            isMember: !!updatedMember,
        });
    } catch (error) {
        console.error('Error promoting user:', error);
        await saveLogToDB('error', `Error promoting user: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

module.exports = { getUsers, updateUser, promoteUser };
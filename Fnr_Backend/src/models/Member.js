const mongoose = require('mongoose');

const memberSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
            unique: true,
        },
        name: {
            type: String,
            required: [true, 'Please provide member name']
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            trim: true,
            lowercase: true,
        },
        membership: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Membership',
            required: true,
        },
        membershipStatus: {
            type: String,
            enum: ['active', 'inactive' ],
            default: 'active',
        },
        manualStatusOverride: {
            type: Boolean,
            default: true, // False by default, set to true when manually updated
        },
        hoursRemaining: {
            type: Number,
            required: true,
            default: 0,
        },
        hoursUsed: {
            type: Number,
            default: 0,
        },
        phone: {
            type: String,
            required: [false],
        },
        address: {
            type: String,
        },
        emergencyContact: {
            contactName: String,
            contactNumber: String,required: [false],
        },
        membershipStartDate: {
            type: Date,
            default: Date.now,
        },
        membershipEndDate: {
            type: Date,
            required: true,
        },
        renewalHistory: [{
            previousPlan: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Membership',
            },
            newPlan: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Membership',
            },
            renewalDate: {
                type: Date,
                default: Date.now,
            },
            price: Number,
        }],
    },
    {
        timestamps: true,
    }
);

// Add a method to check if membership is expired
memberSchema.methods.isExpired = function () {
    return new Date() > this.membershipEndDate;
};

// Add a method to check if enough hours are available
memberSchema.methods.hasEnoughHours = function (requestedHours) {
    return this.hoursRemaining >= requestedHours;
};

// Add a method to deduct hours
memberSchema.methods.deductHours = async function (hours) {
    if (!this.hasEnoughHours(hours)) {
        throw new Error(`Insufficient hours remaining. You have ${this.hoursRemaining} hours left.`);
    }

    this.hoursRemaining -= hours;
    this.hoursUsed += hours;
    return this.save();
};

// Add a method to renew membership
memberSchema.methods.renew = async function (newPlanId) {
    const Membership = mongoose.model('Membership');
    const newPlan = await Membership.findById(newPlanId);
    if (!newPlan) {
        throw new Error('Invalid membership plan');
    }

    // Store renewal history
    this.renewalHistory.push({
        previousPlan: this.membership,
        newPlan: newPlan._id,
        price: newPlan.price,
    });

    // Update membership details
    this.membership = newPlan._id;
    this.membershipStartDate = new Date();
    this.membershipEndDate = new Date(Date.now() + newPlan.durationDays * 24 * 60 * 60 * 1000);
    this.membershipStatus = 'active';
    this.hoursRemaining = newPlan.totalHours;
    this.hoursUsed = 0;

    return this.save();
};

module.exports = mongoose.model('Member', memberSchema);
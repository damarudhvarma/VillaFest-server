import mongoose from "mongoose";

const hostCouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    discountPercentage: {
        type: Number,
        required: [true, 'Discount percentage is required'],
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100']
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: [true, 'Property is required']
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Host',
        required: [true, 'Host is required']
    },
    validFrom: {
        type: Date,
        required: [true, 'Valid from date is required']
    },
    validUntil: {
        type: Date,
        required: [true, 'Valid until date is required']
    },

    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },

    isActive: {
        type: Boolean,
        default: true
    },


}, {
    timestamps: true
});

// Middleware to validate that validUntil is after validFrom
hostCouponSchema.pre('save', function (next) {
    if (this.validUntil <= this.validFrom) {
        next(new Error('Valid until date must be after valid from date'));
    }
    next();
});

// Method to check if coupon is valid
hostCouponSchema.methods.isValid = function () {
    const now = new Date();
    return (
        this.isActive &&
        now >= this.validFrom &&
        now <= this.validUntil &&
        (this.maxUsage === null || this.usageCount < this.maxUsage)
    );
};

// Method to calculate discount amount
hostCouponSchema.methods.calculateDiscount = function (amount) {
    if (amount < this.minPurchase) {
        return 0;
    }

    // Calculate the discount amount
    let discountAmount = (amount * this.discountPercentage) / 100;

    // Apply maximum discount cap if specified
    if (this.maxDiscount > 0 && discountAmount > this.maxDiscount) {
        discountAmount = this.maxDiscount;
    }

    return discountAmount;
};

const hostCoupon = mongoose.model('HostCoupon', hostCouponSchema);

export default hostCoupon;
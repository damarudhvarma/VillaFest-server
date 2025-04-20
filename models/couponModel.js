import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
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
    maxDiscount: {
        type: Number,
        default: 0,
        min: [0, 'Maximum discount amount cannot be negative']
    },
    validFrom: {
        type: Date,
        required: [true, 'Valid from date is required']
    },
    validUntil: {
        type: Date,
        required: [true, 'Valid until date is required']
    },
    minPurchase: {
        type: Number,
        required: [true, 'Minimum purchase amount is required'],
        min: [0, 'Minimum purchase amount cannot be negative']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    termsAndConditions: {
        type: String,
        required: [true, 'Terms and conditions are required'],
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageCount: {
        type: Number,
        default: 0
    },
    maxUsage: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

// Middleware to validate that validUntil is after validFrom
couponSchema.pre('save', function (next) {
    if (this.validUntil <= this.validFrom) {
        next(new Error('Valid until date must be after valid from date'));
    }
    next();
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function () {
    const now = new Date();
    return (
        this.isActive &&
        now >= this.validFrom &&
        now <= this.validUntil &&
        (this.maxUsage === null || this.usageCount < this.maxUsage)
    );
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function (amount) {
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

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
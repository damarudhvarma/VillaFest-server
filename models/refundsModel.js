import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: [true, 'Property is required']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'Booking is required']
    },
    refundId: {
        type: String,
        required: [true, 'Refund ID is required']
    },
    paymentId: {
        type: String,
        required: [true, 'Payment ID is required']
    },
    amount: {
        type: Number,
        required: [true, 'Refund amount is required'],
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'processed', 'failed'],
        default: 'pending'
    },
    notes: {
        type: Map,
        of: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date,
        default: null
    },
    referenceId: {
        type: String,
        sparse: true,
        index: true
    }
}, {
    timestamps: true
});

// Remove any existing indexes on referenceId
refundSchema.index({ referenceId: 1 }, { sparse: true, unique: false });

const Refund = mongoose.model('Refund', refundSchema);

export default Refund;
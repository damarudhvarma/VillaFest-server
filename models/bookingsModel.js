import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
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
    checkIn: {
        type: Date,
        required: [true, 'Check-in date is required']
    },
    checkOut: {
        type: Date,
        required: [true, 'Check-out date is required']
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: 0
    },
    numberOfGuests: {
        type: Number,
        required: [true, 'Number of guests is required'],
        min: 1
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    paymentDetails: {
        orderId: String,
        paymentId: String,
        signature: String,
        paymentDate: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true
});


bookingSchema.pre('save', function (next) {
    if (this.checkOut <= this.checkIn) {
        next(new Error('Check-out date must be after check-in date'));
    }
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;

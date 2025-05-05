import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    weekendPrice: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    rules: [{
        type: String,
        trim: true
    }],
    amenities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Amenity',
        required: true
    }],
    customAmenities: [{
        type: String,
        trim: true
    }],
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    address: {
        street: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        postalCode: {
            type: String,
            required: true,
            trim: true
        }
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Host',

    },
    owner: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        contact: {
            type: Number,
            required: true,
            trim: true
        }
    },
    mainImage: {
        type: String,
        required: true,
        trim: true
    },
    additionalImages: [{
        type: String,
        trim: true
    }],
    maxGuests: {
        type: Number,
        required: true,
        min: 1
    },
    rooms: {
        type: Number,
        required: true,
        min: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    bookedDates: [{
        checkIn: {
            type: Date,
            required: true
        },
        checkOut: {
            type: Date,
            required: true
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking'
        }
    }]
}, {
    timestamps: true
});

// Create a 2dsphere index for location-based queries
propertySchema.index({ location: '2dsphere' });

const Property = mongoose.model('Property', propertySchema);

export default Property;

import mongoose from 'mongoose';

const hostPropertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
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
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Host',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    isActive: {
        type: Boolean,
        default: false
    },


    availability: [{
        date: {
            type: Date,

        },
        isAvailable: {
            type: Boolean,
            default: true
        }
    }]
}, {
    timestamps: true
});

// Create a 2dsphere index for location-based queries
hostPropertySchema.index({ location: '2dsphere' });

// Index for host and status for faster queries
hostPropertySchema.index({ host: 1, status: 1 });

const HostProperty = mongoose.model('HostProperty', hostPropertySchema);

export default HostProperty;

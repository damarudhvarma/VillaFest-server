import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Amenity name is required'],
        trim: true,
        unique: true
    },
    icon: {
        type: String, // Store the path/URL of the uploaded icon
    },
    iconUrl: {
        type: String, // Store the complete URL for the icon
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Create a virtual getter for the complete icon URL
amenitySchema.virtual('fullIconUrl').get(function () {
    if (!this.icon) return null;
    return `${process.env.BASE_URL}/uploads/amenities/${this.icon}`;
});

// Ensure virtuals are included in JSON output
amenitySchema.set('toJSON', { virtuals: true });
amenitySchema.set('toObject', { virtuals: true });

const Amenity = mongoose.model('Amenity', amenitySchema);

export default Amenity;

import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    imagePath: {
        type: String,
        required: [true, 'Image path is required'],
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Create the model only if it doesn't exist
const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);

export default Banner;




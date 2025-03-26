import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        image: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        description: {
            type: String,
            trim: true,
        },
        properties: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Remove the duplicate index definition
// categorySchema.index({ name: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);

export default Category; 
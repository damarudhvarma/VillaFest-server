import path from 'path';
import fs from 'fs';
import Banner from '../models/bannersModel.js';

export const createBanner = async (req, res) => {
    try {
        const { title, isActive } = req.body;
        const image = req.file;

        if (!image || !title) {
            return res.status(400).json({
                success: false,
                message: "Banner title and image are required"
            });
        }

        // Get the file extension from the uploaded file
        const ext = path.extname(image.originalname);

        // Create new filename with title and original extension
        const newFilename = `${title.toLowerCase().replace(/\s+/g, '-')}${ext}`;
        const oldPath = image.path;
        const newPath = path.join(path.dirname(oldPath), newFilename);

        // Rename the file to match the title
        fs.renameSync(oldPath, newPath);

        // Create new banner
        const banner = new Banner({
            title,
            imagePath: `/banners/${newFilename}`,
            isActive: isActive === 'true'
        });

        await banner.save();

        res.status(201).json({
            success: true,
            message: "Banner created successfully",
            banner
        });
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({
            success: false,
            message: "Error creating banner",
            error: error.message
        });
    }
};

export const getBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            banners
        });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching banners",
            error: error.message
        });
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the banner first to get the image path
        const banner = await Banner.findById(id);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        // Delete the image file
        const imagePath = path.join('public', banner.imagePath);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Delete the banner from database
        await Banner.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Banner deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting banner",
            error: error.message
        });
    }
};

export const editStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const banner = await Banner.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Banner status updated successfully",
            banner
        });
    } catch (error) {
        console.error('Error editing status:', error);
        res.status(500).json({
            success: false,
            message: "Error editing status",
            error: error.message
        });
    }
};
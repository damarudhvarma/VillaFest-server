import Amenity from "../models/amenityModel.js";
import path from "path";
import fs from "fs";

export const createAmenity = async (req, res) => {
    try {
        const { name } = req.body;

        // Create public/amenities directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public", "amenities");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        let iconUrl = null;
        if (req.file) {
            const fileExtension = path.extname(req.file.originalname);
            const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);

            // Move the file to public/amenities directory
            fs.renameSync(req.file.path, filePath);

            // Set the icon URL relative to public directory
            iconUrl = `/amenities/${fileName}`;
        }

        const amenity = await Amenity.create({
            name,
            icon: iconUrl,
            iconUrl: iconUrl,
            isActive: "true",
        });

        res.status(201).json({
            success: true,
            message: "Amenity created successfully",
            amenity,
        });
    } catch (error) {
        console.error("Error creating amenity:", error);
        // Delete uploaded file if amenity creation fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: "Error creating amenity",
            error: error.message,
        });
    }
};

export const getAmenities = async (req, res) => {
    try {
        const amenities = await Amenity.find();
        res.status(200).json({
            success: true,
            amenities,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching amenities",
            error: error.message,
        });
    }
};

export const updateAmenity = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;

        // Find the existing amenity
        const existingAmenity = await Amenity.findById(id);
        if (!existingAmenity) {
            return res.status(404).json({
                success: false,
                message: "Amenity not found",
            });
        }

        // Create public/amenities directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public", "amenities");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        let iconUrl = existingAmenity.icon;
        if (req.file) {
            // Delete old icon file if it exists
            if (existingAmenity.icon) {
                const oldFilePath = path.join(process.cwd(), "public", existingAmenity.icon);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            // Save new icon
            const fileExtension = path.extname(req.file.originalname);
            const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);

            // Move the file to public/amenities directory
            fs.renameSync(req.file.path, filePath);

            // Set the icon URL relative to public directory
            iconUrl = `/amenities/${fileName}`;
        }

        // Update the amenity
        const updatedAmenity = await Amenity.findByIdAndUpdate(
            id,
            {
                name,
                icon: iconUrl,
                iconUrl: iconUrl,
                isActive: isActive === "true",
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Amenity updated successfully",
            amenity: updatedAmenity,
        });
    } catch (error) {
        console.error("Error updating amenity:", error);
        // Delete uploaded file if update fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: "Error updating amenity",
            error: error.message,
        });
    }
};

export const deleteAmenityController = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the amenity first to get the icon path
        const amenity = await Amenity.findById(id);
        if (!amenity) {
            return res.status(404).json({
                success: false,
                message: "Amenity not found"
            });
        }

        // Delete the icon file if it exists
        if (amenity.icon) {
            const iconPath = path.join('public', amenity.icon);
            if (fs.existsSync(iconPath)) {
                fs.unlinkSync(iconPath);
            }
        }

        // Delete the amenity from database
        await Amenity.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Amenity deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting amenity:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting amenity",
            error: error.message
        });
    }
};
import path from 'path';
import fs from 'fs';
import Category from '../models/Category.js';

export const createCategoryController = async (req, res) => {
    try {
        const { name, isActive } = req.body;
        const image = req.file;

        if (!name || !image) {
            return res.status(400).json({
                success: false,
                message: "Category name and image are required"
            });
        }

        // Get the file extension from the uploaded file
        const ext = path.extname(image.originalname);

        // Create new filename with category name and original extension
        const newFilename = `${name.toLowerCase().replace(/\s+/g, '-')}${ext}`;
        const oldPath = image.path;
        const newPath = path.join(path.dirname(oldPath), newFilename);

        // Rename the file to match the category name
        fs.renameSync(oldPath, newPath);

        // Create new category
        const category = new Category({
            name,
            image: `/categories/${newFilename}`,
            isActive: isActive === 'true'
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: "Error creating category",
            error: error.message
        });
    }
};

export const getCategoriesController = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching categories",
            error: error.message
        });
    }
};

export const deleteCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting category",
            error: error.message
        });
    }
};


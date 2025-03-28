import Admin from '../models/adminModel.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';

export const registerAdminController = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin already exists with this email'
            });
        }

        // Create new admin
        const admin = new Admin({
            name,
            email,
            password
        });

        await admin.save();

        // Generate token
        const token = admin.generateToken();

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in admin registration',
            error: error.message
        });
    }
};

export const loginAdminController = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if admin exists
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = admin.generateToken();

        res.status(200).json({
            success: true,
            message: 'Admin logged in successfully',
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in admin login',
            error: error.message
        });
    }
};

export const getAdminController = async (req, res) => {
    
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        res.status(200).json({
            success: true,
            message: 'Admin profile fetched successfully',
            data: admin
        });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error in admin profile',
                error: error.message
            });
        }   
    }

  export const logoutAdminController = async (req, res) => {}





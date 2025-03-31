import User from '../models/userModel.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';

export const registerUserController = async (req, res) => {
    const { firstName, lastName, mobileNumber, email, password } = req.body;

    try {
        // Check if user exists with email
        const existingUserEmail = await User.findOne({ email });
        if (existingUserEmail) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Check if user exists with mobile number
        const existingUserMobile = await User.findOne({ mobileNumber });
        if (existingUserMobile) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this mobile number'
            });
        }

        // Create new user
        const user = new User({
            firstName,
            lastName,
            mobileNumber,
            email,
            password
        });

        await user.save();

        // Generate token
        const token = user.generateToken();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                mobileNumber: user.mobileNumber
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in user registration',
            error: error.message
        });
    }
};

export const loginUserController = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = user.generateToken();

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                mobileNumber: user.mobileNumber
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in user login',
            error: error.message
        });
    }
};

// Get user profile
export const getUserProfileController = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in getting user profile',
            error: error.message
        });
    }
};

// Update user profile
export const updateUserProfileController = async (req, res) => {
    try {
        const { firstName, lastName, mobileNumber } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields if provided
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (mobileNumber) {
            // Check if mobile number is already in use by another user
            const existingUser = await User.findOne({ mobileNumber });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number is already in use'
                });
            }
            user.mobileNumber = mobileNumber;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                mobileNumber: user.mobileNumber
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in updating user profile',
            error: error.message
        });
    }
};

export const getAllUsersController = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in getting all users',
            error: error.message
        });
    }
};

export const getUserByIdController = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in getting user by id',
            error: error.message
        });
    }
};  

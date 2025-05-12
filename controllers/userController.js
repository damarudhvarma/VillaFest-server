import User from '../models/userModel.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';
import Property from '../models/propertyModel.js';
import admin from '../firebaseAdmin.js';

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
        const user = await User.findById(req.jwt.id);

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
        const user = await User.findById(req.jwt.id).select('-password');
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

export const addToWishlistController = async (req, res) => {
    try {
        const { propertyId } = req.body;
        const user = await User.findById(req.jwt.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        if (user.wishlist.includes(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Property already in wishlist'
            });
        }

        user.wishlist.push(propertyId);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Property added to wishlist'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in adding property to wishlist',
            error: error.message
        });
    }
};

export const getWishlistController = async (req, res) => {
    try {
        const user = await User.findById(req.jwt.id).select('wishlist');
        const properties = await Property.find({ _id: { $in: user.wishlist } });

        res.status(200).json({
            success: true,
            data: properties
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in getting wishlist',
            error: error.message
        });
    }
};

export const removeFromWishlistController = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const user = await User.findById(req.jwt.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.wishlist.includes(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Property not in wishlist'
            });
        }

        user.wishlist = user.wishlist.filter(id => id.toString() !== propertyId);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Property removed from wishlist'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in removing property from wishlist',
            error: error.message
        });
    }
};

export const registerUserByFirebaseController = async (req, res) => {
    try {
        const { idToken, email, firstName, lastName, mobileNumber } = req.body;

        if (!idToken || !email || !firstName || !lastName || !mobileNumber) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: idToken, email, firstName, lastName, mobileNumber'
            });
        }

        // Verify and decode the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // Check if user already exists
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

        // Create new user with Firebase UID as password
        const user = new User({
            firstName,
            lastName,
            mobileNumber,
            email,
            password: decodedToken.uid // Using Firebase UID as password
        });

        await user.save();

        // Generate JWT token
        const token = user.generateToken();

        res.status(201).json({
            success: true,
            message: 'User registered successfully with Firebase',
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
            message: 'Error in registering user by firebase',
            error: error.message
        });
    }
}

export const loginUserByFirebaseController = async (req, res) => {
    try {
        const { idToken } = req.body;
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.comparePassword(uid);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        const token = user.generateToken();
        res.status(200).json({
            success: true,
            message: 'User logged in successfully with Firebase',
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in logging in user by firebase',
            error: error.message
        });
    }
}
export const isHostController = async (req, res) => {
    try {
        const user = await User.findById(req.jwt.id).populate('host');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const isHost = user.isHost;
        const hostDetails = user.host || null;
        res.status(200).json({
            success: true,
            data: {
                isHost,
                host: hostDetails
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching host status',
            error: error.message
        });
    }
}

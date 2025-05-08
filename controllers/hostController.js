import Host from '../models/hostModel.js';
import { validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import admin from '../firebaseAdmin.js';

// Create new host
export const createHostController = async (req, res) => {
    try {
        // Process uploaded photos
        let photoPaths = [];
        if (req.files && req.files.length > 0) {
            // Use the relative directory path stored in the request
            const relativeDir = req.relativeUploadDir || 'host-enquiry';
            photoPaths = req.files.map(file => `/${relativeDir}/${path.basename(file.filename)}`);
        }

        // Parse bank details if it's a string
        let bankDetails = req.body.bankDetails;
        if (typeof bankDetails === 'string') {
            try {
                bankDetails = JSON.parse(bankDetails);
            } catch (error) {
                console.error('Error parsing bank details:', error);
                bankDetails = {};
            }
        }

        // Parse amenities and property rules if they're strings
        let amenities = req.body.amenities;
        let propertyRules = req.body.propertyRules;

        if (typeof amenities === 'string') {
            try {
                amenities = JSON.parse(amenities);
            } catch (error) {
                console.error('Error parsing amenities:', error);
                amenities = [];
            }
        }

        if (typeof propertyRules === 'string') {
            try {
                propertyRules = JSON.parse(propertyRules);
            } catch (error) {
                console.error('Error parsing property rules:', error);
                propertyRules = [];
            }
        }

        // Check if host already exists
        const existingHost = await Host.findOne({ email: req.body.email });
        if (existingHost) {
            return res.status(400).json({
                success: false,
                message: 'Host with this email already exists'
            });
        }

        // Create new host
        const host = new Host({
            fullName: req.body.hostName,
            email: req.body.email,
            password: req.body.password,
            phoneNumber: req.body.hostPhone,
            bankingDetails: {
                accountHolderName: bankDetails.accountHolder,
                accountNumber: bankDetails.accountNumber,
                bankName: bankDetails.bankName,
                ifscCode: bankDetails.ifscCode
            },
            enquiry: {
                locationDetails: {
                    address: req.body.address,
                    city: req.body.city,
                    state: req.body.state,
                    postalCode: req.body.zipCode,
                    country: req.body.country,
                    latitude: req.body.latitude || null,
                    longitude: req.body.longitude || null
                },
                amenities: amenities,
                propertyRules: propertyRules,
                propertyDetails: {
                    title: req.body.propertyTitle,
                    numberOfRooms: req.body.numberOfRooms,
                    regularPrice: req.body.regularPrice,
                    weekendPrice: req.body.weekendPrice,
                    guestLimit: req.body.maxGuests,
                    description: req.body.description,
                    photos: photoPaths
                }
            }
        });

        await host.save();

        // Generate token
        const authToken = host.generateAuthToken();

        // Remove password from response
        const hostResponse = host.toObject();
        delete hostResponse.password;

        res.status(201).json({
            success: true,
            message: 'Host created successfully',
            data: {
                host: hostResponse,
                authToken
            }
        });
    } catch (error) {
        console.error('Error in createHostController:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating host',
            error: error.message
        });
    }
};

// Login host
export const loginHostController = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find host by email
        const host = await Host.findOne({ email }).select('+password');
        if (!host) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if host is active
        if (!host.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Verify password
        const isMatch = await host.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate tokens
        const authToken = host.generateAuthToken();


        // Remove password from response
        const hostResponse = host.toObject();
        delete hostResponse.password;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                host: hostResponse,
                authToken,

            }
        });
    } catch (error) {
        console.error('Error in loginHostController:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// Get host profile
export const getHostProfileController = async (req, res) => {
    try {
        const host = await Host.findById(req.hostData._id);
        if (!host) {
            return res.status(404).json({
                success: false,
                message: 'Host not found'
            });
        }

        res.status(200).json({
            success: true,
            data: host
        });
    } catch (error) {
        console.error('Error in getHostProfileController:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching host profile',
            error: error.message
        });
    }
};

// Update host profile
export const updateHostProfileController = async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = ['fullName', 'phoneNumber', 'bankingDetails'];
        const updateFields = Object.keys(updates).filter(key => allowedUpdates.includes(key));

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const host = await Host.findById(req.hostData._id);
        if (!host) {
            return res.status(404).json({
                success: false,
                message: 'Host not found'
            });
        }

        // Update fields
        updateFields.forEach(field => {
            if (field === 'bankingDetails') {
                Object.keys(updates.bankingDetails).forEach(key => {
                    host.bankingDetails[key] = updates.bankingDetails[key];
                });
            } else {
                host[field] = updates[field];
            }
        });

        await host.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: host
        });
    } catch (error) {
        console.error('Error in updateHostProfileController:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating host profile',
            error: error.message
        });
    }
};

// Change password
export const changePasswordController = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const host = await Host.findById(req.hostData._id).select('+password');

        // Verify current password
        const isMatch = await host.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        host.password = newPassword;
        await host.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error in changePasswordController:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

export const getHostsController = async (req, res) => {
    try {
        const hosts = await Host.find();

        // Separate hosts into active and pending
        const activeHosts = hosts.filter(host => host.isActive);
        const pendingHosts = hosts.filter(host => !host.isActive);

        res.status(200).json({
            success: true,
            data: {
                activeHosts,
                pendingHosts
            }
        });
    } catch (error) {
        console.error('Error in getHostsController:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching hosts',
            error: error.message
        });
    }
};

export const approveHostController = async (req, res) => {
    try {
        const { hostId } = req.params;
        const host = await Host.findById(hostId);

        if (!host) {
            return res.status(404).json({
                success: false,
                message: 'Host not found'
            });
        }

        host.isActive = true;
        await host.save();

        res.status(200).json({
            success: true,
            message: 'Host approved successfully'
        });
    } catch (error) {
        console.error('Error in approveHostController:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving host',
            error: error.message
        });
    }
};

export const rejectHostController = async (req, res) => {
    try {
        const { hostId } = req.params;
        const host = await Host.findById(hostId);

        if (!host) {
            return res.status(404).json({
                success: false,
                message: 'Host not found'
            });
        }

        // Get the property title from the host document
        const propertyTitle = host.enquiry?.propertyDetails?.title;

        // Delete the image folder if it exists
        if (propertyTitle) {
            const propertyFolderName = propertyTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            const imageFolderPath = path.join(process.cwd(), 'public', 'host-enquiry', propertyFolderName);

            // Check if the folder exists and delete it
            if (fs.existsSync(imageFolderPath)) {
                fs.rmSync(imageFolderPath, { recursive: true, force: true });
                console.log(`Deleted image folder: ${imageFolderPath}`);
            }
        }

        // Delete the host document
        await Host.findByIdAndDelete(hostId);

        res.status(200).json({
            success: true,
            message: 'Host rejected and deleted successfully'
        });
    } catch (error) {
        console.error('Error in rejectHostController:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting host',
            error: error.message
        });
    }
};

export const firebaseRegisterController = async (req, res) => {
    try {
        // Process uploaded photos
        let photoPaths = [];
        if (req.files && req.files.length > 0) {
            // Use the relative directory path stored in the request
            const relativeDir = req.relativeUploadDir || 'host-enquiry';
            photoPaths = req.files.map(file => `/${relativeDir}/${path.basename(file.filename)}`);
        }

        // Parse bank details if it's a string
        let bankDetails = req.body.bankDetails;
        if (typeof bankDetails === 'string') {
            try {
                bankDetails = JSON.parse(bankDetails);
            } catch (error) {
                console.error('Error parsing bank details:', error);
                bankDetails = {};
            }
        }

        // Parse amenities and property rules if they're strings
        let amenities = req.body.amenities;
        let propertyRules = req.body.propertyRules;

        if (typeof amenities === 'string') {
            try {
                amenities = JSON.parse(amenities);
            } catch (error) {
                console.error('Error parsing amenities:', error);
                amenities = [];
            }
        }

        if (typeof propertyRules === 'string') {
            try {
                propertyRules = JSON.parse(propertyRules);
            } catch (error) {
                console.error('Error parsing property rules:', error);
                propertyRules = [];
            }
        }

        // Verify and decode the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(req.body.idToken);
        const email = decodedToken.email;
        const uid = decodedToken.uid;

        // Check if host already exists
        const existingHost = await Host.findOne({ email });
        if (existingHost) {
            return res.status(400).json({
                success: false,
                message: 'Host with this email already exists'
            });
        }

        // Create new host
        const host = new Host({
            fullName: req.body.hostName,
            email: email, // Using email from decoded token
            password: uid, // Using Firebase UID as password
            phoneNumber: req.body.hostPhone,
            bankingDetails: {
                accountHolderName: bankDetails.accountHolder,
                accountNumber: bankDetails.accountNumber,
                bankName: bankDetails.bankName,
                ifscCode: bankDetails.ifscCode
            },
            enquiry: {
                locationDetails: {
                    address: req.body.address,
                    city: req.body.city,
                    state: req.body.state,
                    postalCode: req.body.zipCode,
                    country: req.body.country,
                    latitude: req.body.latitude || null,
                    longitude: req.body.longitude || null
                },
                amenities: amenities,
                propertyRules: propertyRules,
                propertyDetails: {
                    title: req.body.propertyTitle,
                    numberOfRooms: req.body.numberOfRooms,
                    regularPrice: req.body.regularPrice,
                    weekendPrice: req.body.weekendPrice,
                    guestLimit: req.body.maxGuests,
                    description: req.body.description,
                    photos: photoPaths
                }
            }
        });

        await host.save();

        // Generate token
        const authToken = host.generateAuthToken();

        // Remove password from response
        const hostResponse = host.toObject();
        delete hostResponse.password;

        res.status(201).json({
            success: true,
            message: 'Host registered successfully with Firebase',
            data: {
                host: hostResponse,
                authToken
            }
        });
    } catch (error) {
        console.error('Error in firebaseRegisterController:', error);
        res.status(500).json({
            success: false,
            message: 'Error in registering host with Firebase',
            error: error.message
        });
    }
};
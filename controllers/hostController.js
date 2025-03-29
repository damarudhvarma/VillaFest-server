import Host from '../models/hostModel.js';
import { validationResult } from 'express-validator';

// Create new host
export const createHostController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { fullName, email, password, phoneNumber, bankingDetails } = req.body;

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
            fullName,
            email,
            password,
            phoneNumber,
            bankingDetails
        });

        await host.save();

        // Generate tokens
        const authToken = host.generateAuthToken();


        // Remove password from response
        const hostResponse = host.toObject();
        delete hostResponse.password;

        res.status(201).json({
            success: true,
            message: 'Host created successfully',
            data: {
                host: hostResponse,
                authToken,

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
        const host = await Host.findById(req.host._id);
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

        const host = await Host.findById(req.host._id);
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
        const host = await Host.findById(req.host._id).select('+password');

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

        host.isActive = false;
        await host.save();

        res.status(200).json({
            success: true,
            message: 'Host rejected successfully'
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

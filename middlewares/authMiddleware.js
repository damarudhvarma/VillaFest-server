import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';
import User from '../models/userModel.js';
import Host from '../models/hostModel.js';

// Verify JWT Token
export const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

// Admin Authentication Middleware
export const isAdmin = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        // console.error('Error in isAdmin:', error);
        return res.status(500).json({ message: 'Server error.' });
    }
};

// User Authentication Middleware
export const isUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(403).json({ message: 'Access denied. User only.' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' });
    }
};

// Optional Authentication Middleware
export const optionalAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        }
        next();
    } catch (error) {
        next();
    }
}; 




export const authenticateHost = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get host from token
        const host = await Host.findById(decoded._id);
        if (!host) {
            return res.status(401).json({
                success: false,
                message: 'Host not found'
            });
        }

        // Check if host is active
        if (!host.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Add host to request object
        req.host = host;
        next();
    } catch (error) {
        console.error('Error in authenticateHost:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
}; 
import jwt from 'jsonwebtoken';
import Host from '../models/hostModel.js';

export const generateTokenController = async (req, res) => {
    try {
        const email = req.jwt.email;

        // Find the host by email
        const host = await Host.findOne({ email });
        if (!host) {
            return res.status(404).json({
                success: false,
                message: 'Host not found'
            });
        }

        // Generate SSO token with required payload
        const ssoToken = jwt.sign(
            {
                email: host.email,
                fullName: host.fullName
            },
            process.env.JWT_SECRET, {
            expiresIn: "2m", // short-lived for security
        }
        );
        const redirectUrl = `${process.env.ADMINPANEL_URL}/auth/sso-login?token=${ssoToken}`;

        res.status(200).json({
            success: true,
            redirectUrl
        });
    } catch (error) {
        console.error('Error in generateTokenController:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating SSO token',
            error: error.message
        });
    }
}

export const validateTokenController = async (req, res) => {
    try {
        const {token}=req.body;
        const decoded=jwt.verify(token,process.env.JWT_SECRET);

        // Find the host by email
        const host = await Host.findOne({ email: decoded.email });
        if (!host) {
            return res.status(404).json({
                success: false,
                message: 'Host not found'
            });
        }

        // Generate token with host data
        const adminToken = jwt.sign(
            {
                _id: host._id,
                email: host.email,
                fullName: host.fullName,
                phoneNumber: host.phoneNumber,
                isActive: host.isActive
            },
            process.env.JWT_SECRET
        );

        res.status(200).json({
            success: true,
            adminToken,
        });
    } catch (error) {
        console.error('Error in validateTokenController:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating token',
            error: error.message
        });
    }
}

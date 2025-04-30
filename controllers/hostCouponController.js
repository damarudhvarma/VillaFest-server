import HostCoupon from '../models/hostCouponModel.js';
import Property from '../models/propertyModel.js';

export const createHostCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            discount,
            isActive,
            propertyId,
            validFrom,
            validUntil
        } = req.body;

        // Validate required fields
        if (!code || !description || !discount || !propertyId || !validFrom || !validUntil) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if host data exists in request
        if (!req.hostData || !req.hostData._id) {
            return res.status(401).json({
                success: false,
                message: "Host authentication required"
            });
        }

        // Check if property exists
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        // Check if property belongs to the host
        if (property.host && property.host.toString() !== req.hostData._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only create coupons for your own properties"
            });
        }

        // Check if coupon code already exists
        const existingCoupon = await HostCoupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: "Coupon code already exists"
            });
        }

        // Create new coupon
        const newCoupon = new HostCoupon({
            code: code.toUpperCase(),
            description,
            discountPercentage: discount,
            isActive,
            property: propertyId,
            host: req.hostData._id,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil)
        });

        // Save the coupon
        await newCoupon.save();

        // Return success response
        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            data: newCoupon
        });

    } catch (error) {
        console.error("Error creating host coupon:", error);
        res.status(500).json({
            success: false,
            message: "Error creating host coupon",
            error: error.message
        });
    }
};

export const getHostCoupons = async (req, res) => {
    try {
        const hostId = req.hostData._id;
        const coupons = await HostCoupon.find({ host: hostId });

        res.status(200).json({
            success: true,
            data: coupons
        });
    } catch (error) {
        console.error("Error getting host coupons:", error);
        res.status(500).json({
            success: false,
            message: "Error getting host coupons",
            error: error.message
        });
    }
};

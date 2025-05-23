import Coupon from '../models/couponModel.js';
import HostCoupon from '../models/hostCouponModel.js';

export const createCoupon = async (req, res) => {
    try {
        console.log("req", req.body);

        const {
            code,
            discount,       // Frontend sends 'discount' instead of 'discountPercentage'
            validFrom,
            validUntil,
            minPurchase,
            maxDiscount,    // New field from frontend
            description,
            terms,          // Frontend sends 'terms' array instead of 'termsAndConditions'
            maxUsage,
            isActive
        } = req.body;

        // Check if coupon with same code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon with this code already exists'
            });
        }

        // Validate dates
        const fromDate = new Date(validFrom);
        const untilDate = new Date(validUntil);

        if (fromDate >= untilDate) {
            return res.status(400).json({
                success: false,
                message: 'Valid until date must be after valid from date'
            });
        }

        // Create new coupon with mapped fields
        const coupon = new Coupon({
            code: code.toUpperCase(),
            discountPercentage: discount,  // Map 'discount' to 'discountPercentage'
            validFrom: fromDate,
            validUntil: untilDate,
            minPurchase,
            maxDiscount: maxDiscount || 0, // Add maxDiscount field
            description,
            termsAndConditions: Array.isArray(terms) ? terms.join(', ') : terms, // Convert terms array to string
            maxUsage: maxUsage || null,
            isActive: isActive !== undefined ? isActive : true
        });

        await coupon.save();

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: coupon
        });

    } catch (error) {
        console.error('Create Coupon Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating coupon',
            error: error.message
        });
    }
};

export const getAllCoupons = async (req, res) => {
    try {
        const { active, current } = req.query;

        const coupons = await Coupon.find().sort({ createdAt: -1 });

        // Calculate validity status for each coupon
        const couponsWithStatus = coupons.map(coupon => {
            const now = new Date();
            const isValid =
                coupon.isActive &&
                now >= coupon.validFrom &&
                now <= coupon.validUntil &&
                (coupon.maxUsage === null || coupon.usageCount < coupon.maxUsage);

            const couponObj = coupon.toObject();
            couponObj.isCurrentlyValid = isValid;

            return couponObj;
        });

        res.status(200).json({
            success: true,
            count: couponsWithStatus.length,
            data: couponsWithStatus
        });
    } catch (error) {
        console.error('Get All Coupons Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching coupons',
            error: error.message
        });
    }
};

export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        // Find the coupon by ID
        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Update the isActive status
        coupon.isActive = isActive;
        await coupon.save();

        res.status(200).json({
            success: true,
            message: `Coupon ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: coupon
        });
    } catch (error) {
        console.error('Update Coupon Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating coupon',
            error: error.message
        });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the coupon by ID
        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Delete the coupon
        await Coupon.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (error) {
        console.error('Delete Coupon Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting coupon',
            error: error.message
        });
    }
};

export const applyCoupon = async (req, res) => {
    try {
        const { couponCode, propertyId, totalAmount } = req.body;

        // First try to find the coupon in regular Coupon collection
        let coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

        // If not found in regular coupons, try host coupons
        if (!coupon) {
            coupon = await HostCoupon.findOne({ code: couponCode.toUpperCase() });

            if (coupon) {
                // For host coupons, verify if it's valid for the specified property
                if (coupon.property.toString() !== propertyId) {
                    return res.status(400).json({
                        success: false,
                        message: 'This coupon is not valid for the selected property'
                    });
                }
            }
        }

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Check if coupon is currently valid
        const now = new Date();
        const isValid =
            coupon.isActive &&
            now >= coupon.validFrom &&
            now <= coupon.validUntil;

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Coupon is not valid'
            });
        }

        // Calculate the discount amount
        const discountAmount = (coupon.discountPercentage / 100) * totalAmount;
        const finalAmount = totalAmount - discountAmount;

        // Return the discount amount
        res.status(200).json({
            success: true,
            message: 'Coupon applied successfully',
            data: finalAmount
        });
    } catch (error) {
        console.error('Apply Coupon Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error applying coupon',
            error: error.message
        });
    }
};

export const getAll = async (req, res) => {
    try {
        // Fetch both regular coupons and host coupons
        const [regularCoupons, hostCoupons] = await Promise.all([
            Coupon.find().sort({ createdAt: -1 }),
            HostCoupon.find()
                .populate('property', 'title')
                .populate('host', 'name')
                .sort({ createdAt: -1 })
        ]);

        // Process regular coupons
        const processedRegularCoupons = regularCoupons.map(coupon => {
            const now = new Date();
            const isValid =
                coupon.isActive &&
                now >= coupon.validFrom &&
                now <= coupon.validUntil &&
                (coupon.maxUsage === null || coupon.usageCount < coupon.maxUsage);

            const couponObj = coupon.toObject();
            couponObj.isCurrentlyValid = isValid;
            couponObj.type = 'regular';
            return couponObj;
        });

        // Process host coupons
        const processedHostCoupons = hostCoupons.map(coupon => {
            const now = new Date();
            const isValid =
                coupon.isActive &&
                now >= coupon.validFrom &&
                now <= coupon.validUntil;

            const couponObj = coupon.toObject();
            couponObj.isCurrentlyValid = isValid;
            couponObj.type = 'host';
            return couponObj;
        });

        // Combine both types of coupons
        const allCoupons = [...processedRegularCoupons, ...processedHostCoupons];

        res.status(200).json({
            success: true,
            count: allCoupons.length,
            data: allCoupons
        });

    } catch (error) {
        console.error('Get All Coupons Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching coupons',
            error: error.message
        });
    }
};


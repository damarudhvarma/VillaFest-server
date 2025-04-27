import Coupon from '../models/couponModel.js';

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
        const { couponCode } = req.body;

        // Find the coupon by code
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

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
            now <= coupon.validUntil 

        // if (!isValid) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Coupon is not valid'
        //     });
        // }

    
        

        // Calculate the discount amount
        const discountAmount = (coupon.discountPercentage / 100) * req.body.totalAmount;
        const finalAmount = req.body.totalAmount - discountAmount;
        

       
      

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


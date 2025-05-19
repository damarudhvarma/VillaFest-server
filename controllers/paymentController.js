import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/bookingsModel.js';
import Property from '../models/propertyModel.js';
import dotenv from 'dotenv';
import { sendBookingConfirmationEmail } from '../methods/bookingConfirmationEmail.js';

// Ensure environment variables are loaded
dotenv.config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});



/**
 * Check if the property is available for the given dates
 * @param {string} propertyId - The ID of the property
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date
 * @returns {Promise<boolean>} - True if available, false otherwise
 */
const isPropertyAvailable = async (propertyId, checkIn, checkOut) => {
    try {
        const property = await Property.findById(propertyId);
        if (!property) return false;

        // Check if any booking overlaps with the requested dates
        const overlappingBooking = await Booking.findOne({
            property: propertyId,
            status: { $ne: 'cancelled' },
            $or: [
                // Check-in date falls within an existing booking
                {
                    checkIn: { $lte: checkIn },
                    checkOut: { $gt: checkIn }
                },
                // Check-out date falls within an existing booking
                {
                    checkIn: { $lt: checkOut },
                    checkOut: { $gte: checkOut }
                },
                // Requested dates completely encompass an existing booking
                {
                    checkIn: { $gte: checkIn },
                    checkOut: { $lte: checkOut }
                }
            ]
        });

        return !overlappingBooking;
    } catch (error) {
        console.error("Error checking property availability:", error);
        return false;
    }
};

/**
 * Create a new Razorpay order
 * @route POST /api/payment/order
 */
export const createOrder = async (req, res) => {
    try {
        const { amount, propertyId, userId, bookingDetails, userName, propertyTitle } = req.body;

        // Validate required fields
        if (!amount || !propertyId || !userId || !bookingDetails) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: amount, propertyId, userId, or bookingDetails"
            });
        }

        // Validate amount is a positive number
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a positive number"
            });
        }

        // Convert amount to paise (integer)
        const amountInPaise = Math.round(amount * 100);

        // Convert string dates to Date objects
        const checkInDate = new Date(bookingDetails.checkInDate);
        const checkOutDate = new Date(bookingDetails.checkOutDate);

        // Validate dates
        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid check-in or check-out date format"
            });
        }

        if (checkOutDate <= checkInDate) {
            return res.status(400).json({
                success: false,
                message: "Check-out date must be after check-in date"
            });
        }

        // Check if property is available for the requested dates
        const isAvailable = await isPropertyAvailable(propertyId, checkInDate, checkOutDate);
        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                message: "Property is not available for the selected dates"
            });
        }

        // Create Razorpay order
        const options = {
            amount: amountInPaise, // Use the converted amount in paise
            currency: "INR",
            receipt: `booking_${Date.now()}`,
            notes: {
                userName,
                propertyTitle,
                checkInDate: new Date(bookingDetails.checkInDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                }),
                checkOutDate: new Date(bookingDetails.checkOutDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                }),
                guests: bookingDetails.guests,
                nights: bookingDetails.nights,
                couponCode: bookingDetails.couponApplied?.code || null,
                couponDiscount: bookingDetails.couponApplied?.discount || 0
            }
        };

        const order = await razorpay.orders.create(options);

        return res.status(200).json({
            success: true,
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create payment order",
            error: error.message
        });
    }
};

/**
 * Verify Razorpay payment and create booking
 * @route POST /api/payment/verify
 */
export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            propertyId,
            userId,
            bookingDetails,
            userName,
            propertyTitle
        } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !propertyId || !userId || !bookingDetails) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields for payment verification"
            });
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed: Invalid signature"
            });
        }

        // Fetch payment details from Razorpay API
        const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET).toString('base64')
            }
        });

        if (!paymentResponse.ok) {
            throw new Error('Failed to fetch payment details from Razorpay');
        }

        const paymentDetails = await paymentResponse.json();
        const paymentMethod = paymentDetails.method;

        // Find the property
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        // Convert string dates to Date objects
        const checkInDate = new Date(bookingDetails.checkInDate);
        const checkOutDate = new Date(bookingDetails.checkOutDate);

        // Create booking with host ID from property and coupon details
        const booking = new Booking({
            property: propertyId,
            user: userId,
            host: property.host,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            totalPrice: bookingDetails.totalPrice,
            numberOfGuests: bookingDetails.guests,
            nights: bookingDetails.nights,
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentDetails: {
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                signature: razorpay_signature,
                paymentDate: new Date(),
                paymentMethod: paymentMethod
            },
            couponDetails: bookingDetails.couponApplied ? {
                code: bookingDetails.couponApplied.code,
                discount: bookingDetails.couponApplied.discount,
                originalPrice: bookingDetails.totalPrice + bookingDetails.couponApplied.discount
            } : null
        });

        // Save the booking
        const savedBooking = await booking.save();

        // Update property's booked dates
        property.bookedDates.push({
            checkIn: checkInDate,
            checkOut: checkOutDate,
            bookingId: savedBooking._id
        });

        // Save the updated property
        await property.save();

        // Send booking confirmation email
        try {
            // Populate the booking with user and property details
            const populatedBooking = await Booking.findById(savedBooking._id)
                .populate('user', 'firstName lastName email mobileNumber')
                .populate('property', 'title address.street address.city address.state address.postalCode');

            await sendBookingConfirmationEmail(populatedBooking);
        } catch (emailError) {
            console.error('Error sending booking confirmation email:', emailError);
            // Don't fail the request if email fails
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified and booking created successfully",
            paymentId: razorpay_payment_id,
            bookingId: savedBooking._id
        });
    } catch (error) {
        console.error("Error verifying payment:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify payment",
            error: error.message
        });
    }
}; 
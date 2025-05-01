import Booking from '../models/bookingsModel.js';
import Property from '../models/propertyModel.js';
import Refund from '../models/refundsModel.js';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const getBookings = async (req, res) => {
    try {
        // Get all bookings for the authenticated user with specific property details
        const bookings = await Booking.find({ user: req.jwt.id })
            .select('_id checkIn checkOut totalPrice paymentStatus status property host')
            .populate({
                path: 'property',
                select: '_id title mainImage additionalImages location'
            })
            .populate({
                path: 'host',
                select: 'fullName email phoneNumber'
            })
            .sort({ createdAt: -1 }); // Sort by newest first

        // Transform the response to match the desired format
        const formattedBookings = bookings.map(booking => {
            // Create a safe property details object
            const propertyDetails = booking.property ? {
                id: booking.property._id,
                title: booking.property.title,
                images: [
                    booking.property.mainImage,
                    ...(booking.property.additionalImages || [])
                ],
                location: booking.property.location
            } : null;

            // Create a safe host details object
            const hostDetails = booking.host ? {
                id: booking.host._id,
                name: booking.host.fullName,
                email: booking.host.email,
                phoneNumber: booking.host.phoneNumber
            } : null;

            return {
                id: booking._id,
                bookingDate: {
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut
                },
                propertyDetails,
                hostDetails,
                paymentStatus: booking.paymentStatus,
                status: booking.status,
                amountPaid: booking.totalPrice
            };
        });

        res.status(200).json({
            success: true,
            data: formattedBookings
        });
    } catch (error) {
        console.error('Get Bookings Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in fetching bookings',
            error: error.message
        });
    }
};

export const getAllBookings = async (req, res) => {
    try {
        // Get all bookings with populated data
        const bookings = await Booking.find({})
            .populate({
                path: 'property',
                select: 'title mainImage additionalImages location price'
            })
            .populate({
                path: 'user',
                select: 'firstName lastName email mobileNumber'
            })
            .populate({
                path: 'host',
                select: 'fullName email phoneNumber'
            })
            .sort({ createdAt: -1 }); // Sort by newest first

        // Format the response
        const formattedBookings = bookings.map(booking => {
            // Create property details with null check
            const propertyDetails = booking.property ? {
                id: booking.property._id,
                title: booking.property.title,
                images: [booking.property.mainImage, ...(booking.property.additionalImages || [])],
                location: booking.property.location
            } : null;

            // Create user details with null check
            const userDetails = booking.user ? {
                id: booking.user._id,
                name: `${booking.user.firstName} ${booking.user.lastName}`,
                email: booking.user.email,
                mobileNumber: booking.user.mobileNumber
            } : null;

            // Create host details with null check
            const hostDetails = booking.host ? {
                id: booking.host._id,
                name: booking.host.fullName,
                email: booking.host.email,
                phoneNumber: booking.host.phoneNumber
            } : null;

            return {
                id: booking._id,
                bookingDate: {
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut
                },
                propertyDetails,
                userDetails,
                hostDetails,
                numberOfGuests: booking.numberOfGuests,
                totalPrice: booking.totalPrice,
                status: booking.status,
                paymentStatus: booking.paymentStatus,
                paymentDetails: {
                    paymentId: booking.paymentDetails?.paymentId || null,
                    orderId: booking.paymentDetails?.orderId || null
                },
                createdAt: booking.createdAt
            };
        });

        res.status(200).json({
            success: true,
            count: formattedBookings.length,
            data: formattedBookings
        });
    } catch (error) {
        console.error('Get All Bookings Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in fetching all bookings',
            error: error.message
        });
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const { bookingId, refundAmount, cancellationFee } = req.body;

        // Find the booking and verify it belongs to the user
        const booking = await Booking.findOne({
            _id: bookingId,
            user: req.jwt.id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if booking is already cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        // Find the property associated with this booking
        const property = await Property.findById(booking.property);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        let refundResponse = null;
        let refundRecord = null;

        // Only process refund through Razorpay if refund amount is greater than zero
        if (refundAmount > 0) {
            try {
                refundResponse = await razorpay.payments.refund(booking.paymentDetails.paymentId, {
                    amount: refundAmount * 100, // Convert to paise
                    notes: {
                        bookingId: booking._id.toString(),
                        cancellationFee: cancellationFee,
                        reason: 'Booking cancelled by user'
                    }
                });

                console.log('Razorpay Refund Response:', refundResponse);

                // Set payment status to refunded
                booking.paymentStatus = 'refunded';

                // Create a refund record
                refundRecord = new Refund({
                    property: booking.property,
                    user: booking.user,
                    booking: booking._id,
                    refundId: refundResponse.id,
                    paymentId: refundResponse.payment_id,
                    amount: refundAmount,
                    currency: refundResponse.currency,
                    status: refundResponse.status,
                    notes: {
                        bookingId: booking._id.toString(),
                        cancellationFee: cancellationFee.toString(),
                        reason: 'Booking cancelled by user'
                    },
                    createdAt: new Date(refundResponse.created_at * 1000), // Convert Unix timestamp to Date
                    processedAt: refundResponse.processed_at ? new Date(refundResponse.processed_at * 1000) : null,
                    referenceId: refundResponse.receipt || undefined // Use undefined instead of null
                });

                await refundRecord.save();

            } catch (refundError) {
                console.error('Razorpay Refund Error:', refundError);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing refund',
                    error: refundError.message
                });
            }
        } else {
            // If refund amount is zero, set payment status to not eligible for refund
            booking.paymentStatus = 'not eligible for refund';
        }

        // Update booking status while preserving payment details
        booking.status = 'cancelled';

        // Ensure payment details are preserved
        if (!booking.paymentDetails) {
            booking.paymentDetails = {};
        }

        // Preserve the original payment method
        if (!booking.paymentDetails.paymentMethod) {
            booking.paymentDetails.paymentMethod = 'razorpay'; // Default to razorpay if not set
        }

        await booking.save();

        // Update property's bookedDates array to remove this booking
        await Property.findByIdAndUpdate(
            booking.property,
            {
                $pull: {
                    bookedDates: {
                        bookingId: booking._id
                    }
                }
            }
        );

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: {
                bookingId: booking._id,
                refundAmount,
                cancellationFee,
                paymentStatus: booking.paymentStatus,
                refundDetails: refundResponse,
                refundRecord: refundRecord ? refundRecord._id : null
            }
        });

    } catch (error) {
        console.error('Cancel Booking Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in cancelling booking',
            error: error.message
        });
    }
};

export const getHostPropertyBookings = async (req, res) => {
    try {
        const host = req.hostData;

        // Find all bookings for the host using the new host field
        const bookings = await Booking.find({
            host: host._id
        })
            .populate({
                path: 'property',
                select: 'title mainImage additionalImages location price'
            })
            .populate({
                path: 'user',
                select: 'firstName lastName email mobileNumber'
            })
            .sort({ createdAt: -1 });

        // Format the response similar to getAllBookings
        const formattedBookings = bookings.map(booking => {
            // Calculate the host's share (89% of total price)
            const hostShare = booking.totalPrice * 0.89;

            // Create property details with null check
            const propertyDetails = booking.property ? {
                id: booking.property._id,
                title: booking.property.title,
                images: [booking.property.mainImage, ...(booking.property.additionalImages || [])],
                location: booking.property.location
            } : null;

            // Create user details with null check
            const userDetails = booking.user ? {
                id: booking.user._id,
                name: `${booking.user.firstName} ${booking.user.lastName}`,
                email: booking.user.email,
                mobileNumber: booking.user.mobileNumber
            } : null;

            return {
                id: booking._id,
                bookingDate: {
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut
                },
                propertyDetails,
                userDetails,
                numberOfGuests: booking.numberOfGuests,
                yourShare: hostShare, // Use the reduced price (89% of original)
                // Keep the original price for reference
                status: booking.status,
                paymentStatus: booking.paymentStatus,
                createdAt: booking.createdAt
            };
        });

        res.status(200).json({
            success: true,
            count: formattedBookings.length,
            data: formattedBookings
        });
    } catch (error) {
        console.error('Get Host Property Bookings Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in fetching host property bookings',
            error: error.message
        });
    }
};


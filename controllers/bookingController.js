import Booking from '../models/bookingsModel.js';

export const getBookings = async (req, res) => {
    try {
        // Get all bookings for the authenticated user with specific property details
        const bookings = await Booking.find({ user: req.jwt.id })
            .select('_id checkIn checkOut totalPrice paymentStatus property')
            .populate({
                path: 'property',
                select: '_id title mainImage additionalImages location'
            })
            .sort({ createdAt: -1 }); // Sort by newest first

        // Transform the response to match the desired format
        const formattedBookings = bookings.map(booking => ({
            id: booking._id,
            bookingDate: {
                checkIn: booking.checkIn,
                checkOut: booking.checkOut
            },
            propertyDetails: {
                id: booking.property._id,
                title: booking.property.title,
                images: [booking.property.mainImage, ...booking.property.additionalImages],
                location: booking.property.location
            },
            paymentStatus: booking.paymentStatus,
            amountPaid: booking.totalPrice
        }));

        res.status(200).json({
            success: true,
            data: formattedBookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in fetching bookings',
            error: error.message
        });
    }
};


export const cancelBooking = async (req, res) => {}

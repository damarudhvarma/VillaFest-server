import Booking from '../models/bookingsModel.js';
import Property from '../models/propertyModel.js';
import Refund from '../models/refundsModel.js';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export const generateInvoice = async (req, res) => {
    try {
        const { bookingId } = req.params;
        console.log(bookingId);

        // Find the booking
        const booking = await Booking.findById(bookingId)
            .populate('user', 'firstName lastName email mobileNumber')
            .populate('property', 'title');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Get the current year
        const currentYear = new Date().getFullYear();

        // Get the total number of bookings and the position of this booking
        const totalBookings = await Booking.countDocuments();
        const bookingPosition = await Booking.countDocuments({
            createdAt: { $lt: booking.createdAt }
        }) + 1;

        // Generate invoice number using the booking's position
        const invoiceNumber = `VF/${currentYear}/${String(bookingPosition).padStart(4, '0')}`;
        // Create a safe filename by replacing slashes with underscores
        const safeFilename = `invoice_VF_${currentYear}_${String(bookingPosition).padStart(4, '0')}.pdf`;

        // Generate booking reference from payment ID
        const bookingRef = `VF-${booking.paymentDetails.paymentId.split('_')[1]}`;

        // Format the booking date
        const invoiceDate = booking.createdAt.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Load the template
        const templatePath = path.join(process.cwd(), 'public', 'letterhead_template.pdf');

        // Check if template file exists
        if (!fs.existsSync(templatePath)) {
            return res.status(500).json({
                success: false,
                message: 'Invoice template not found',
                error: 'Template file does not exist'
            });
        }

        // Read template file
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);

        // Get the first page of the template
        const pages = pdfDoc.getPages();
        const page = pages[0];

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Text Config
        const textOptions = { size: 12, color: rgb(0, 0, 0) };

        // --- ISSUED TO ---
        page.drawText('ISSUED TO:', { x: 50, y: 705, font, size: 11, color: rgb(0, 0, 0) });
        page.drawText(`${booking.user.firstName} ${booking.user.lastName}`, { x: 50, y: 690, font: boldFont, size: 12, color: rgb(0, 0, 0) });
        page.drawText(`Phone: ${booking.user.mobileNumber}`, { x: 50, y: 675, font, size: 11, color: rgb(0, 0, 0) });
        page.drawText(`Email: ${booking.user.email}`, { x: 50, y: 660, font, size: 11, color: rgb(0, 0, 0) });

        // --- Invoice No and Date ---
        page.drawText(`Invoice No: ${invoiceNumber}`, { x: 50, y: 625, font, size: 11, color: rgb(0, 0, 0) });
        page.drawText(`Date: ${invoiceDate}`, { x: 200, y: 625, font, size: 11, color: rgb(0, 0, 0) });

        // --- TABLE HEADER ---
        page.drawRectangle({ x: 50, y: 590, width: 470, height: 25, color: rgb(0, 0.6, 0.36) });
        page.drawText('DESCRIPTION', { x: 55, y: 597, font: boldFont, size: 11, color: rgb(1, 1, 1) });
        page.drawText('UNIT PRICE', { x: 270, y: 597, font: boldFont, size: 11, color: rgb(1, 1, 1) });
        page.drawText('QTY', { x: 370, y: 597, font: boldFont, size: 11, color: rgb(1, 1, 1) });
        page.drawText('TOTAL', { x: 430, y: 597, font: boldFont, size: 11, color: rgb(1, 1, 1) });

        // --- TABLE ROW ---
        page.drawRectangle({ x: 50, y: 565, width: 470, height: 25, color: rgb(1, 1, 1) });
        page.drawText(booking.property.title, { x: 55, y: 572, font, size: 11, color: rgb(0, 0, 0) });
        page.drawText(booking.totalPrice.toLocaleString('en-IN'), { x: 270, y: 572, font, size: 11, color: rgb(0, 0, 0) });
        page.drawText('1', { x: 380, y: 572, font, size: 11, color: rgb(0, 0, 0) });
        page.drawText(booking.totalPrice.toLocaleString('en-IN'), { x: 430, y: 572, font, size: 11, color: rgb(0, 0, 0) });

        // --- SUBTOTAL, TAX, TOTAL ---
        page.drawText('SUBTOTAL', { x: 55, y: 535, font: boldFont, size: 12, color: rgb(0, 0, 0) });
        page.drawText(booking.totalPrice.toLocaleString('en-IN'), { x: 430, y: 535, font: boldFont, size: 12, color: rgb(0, 0, 0) });
        page.drawText('Tax', { x: 55, y: 515, font, size: 12, color: rgb(0, 0, 0) });
        page.drawText('Included', { x: 430, y: 515, font, size: 12, color: rgb(0, 0, 0) });
        page.drawText('TOTAL', { x: 55, y: 495, font: boldFont, size: 12, color: rgb(0, 0, 0) });
        page.drawText(booking.totalPrice.toLocaleString('en-IN'), { x: 430, y: 495, font: boldFont, size: 12, color: rgb(0, 0, 0) });

        // --- BANK DETAILS ---
        page.drawText('BANK DETAILS:', { x: 55, y: 465, font: boldFont, size: 11, color: rgb(0, 0, 0) });
        page.drawText(`Payment Mode: ${booking.paymentDetails.paymentMethod.toUpperCase()}`, { x: 55, y: 450, font, size: 10, color: rgb(0, 0, 0) });
        page.drawText(`Booking Reference: ${bookingRef}`, { x: 55, y: 437, font, size: 10, color: rgb(0, 0, 0) });

        // --- NOTES ---
        page.drawText('NOTES:', { x: 55, y: 400, font: boldFont, size: 11, color: rgb(0, 0, 0) });
        page.drawText('- Villafest is a platform that facilitates villa bookings.', { x: 55, y: 387, font, size: 10, color: rgb(0, 0, 0) });
        page.drawText('- This invoice serves as a receipt for your payment.', { x: 55, y: 374, font, size: 10, color: rgb(0, 0, 0) });
        page.drawText('- The actual service is delivered by a third-party villa partner.', { x: 55, y: 361, font, size: 10, color: rgb(0, 0, 0) });
        page.drawText('- Cancellation/Refund Policy: Please refer to Villafest.in.', { x: 55, y: 348, font, size: 10, color: rgb(0, 0, 0) });
        page.drawText('- For any assistance, contact: info@villafest.in', { x: 55, y: 335, font, size: 10, color: rgb(0, 0, 0) });


        const pdfBytes = await pdfDoc.save();


        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);

        // Send the PDF
        res.end(Buffer.from(pdfBytes));


    } catch (error) {
        console.error('Generate Invoice Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating invoice',
            error: error.message
        });
    }
};
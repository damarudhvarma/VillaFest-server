import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Booking from '../models/bookingsModel.js';

dotenv.config();

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_ID,
        pass: process.env.APP_PASSWORD,
    },
});

/**
 * Send booking cancellation email
 * @param {Object} booking - The booking object with populated user and property details
 * @param {Object} refundDetails - Optional refund details if applicable
 * @returns {Promise<void>}
 */
export const sendBookingCancellationEmail = async (booking, refundDetails = null) => {
    try {
        // Format dates for email
        const startDate = new Date(booking.checkIn).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const endDate = new Date(booking.checkOut).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Create mail options
        const mailOptions = {
            from: `"Villafest" <${process.env.MAIL_ID}>`,
            to: booking.user.email,
            subject: `Your Villafest Booking Has Been Cancelled – ${booking._id}`,
            text: `
Dear ${booking.user.firstName},

We're writing to confirm that your booking with Villafest has been successfully cancelled.

Here are the details of your cancelled booking:

Booking ID: ${booking._id}
Villa/Farmhouse: ${booking.property.title}
Location: ${booking.property.address.street}, ${booking.property.address.city}, ${booking.property.address.state} - ${booking.property.address.postalCode}
Original Booking Dates: ${startDate} to ${endDate}
Guests: ${booking.numberOfGuests}

${refundDetails ? `Refund Details:
Amount: ₹${refundDetails.amount}
Status: ${refundDetails.status}
Reference ID: ${refundDetails.referenceId || 'N/A'}` : 'If any refund is applicable, it will be processed as per our cancellation policy. You will receive a separate confirmation once the refund (if eligible) is initiated.'}

We're sorry to see your plans change, but we hope to be a part of your future celebrations. If there's anything we can assist you with, feel free to reach out.

Need help?
Email: info@villafest.in
Phone/WhatsApp: +91 62817 42064

Warm regards,  
Team Villafest  
www.villafest.in  
Celebrate life.
            `,
            html: `
                <p>Dear ${booking.user.firstName},</p>
                <p>We're writing to confirm that your booking with <strong>Villafest</strong> has been successfully cancelled.</p>

                <p><strong>Here are the details of your cancelled booking:</strong></p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Villa/Farmhouse:</strong> ${booking.property.title}</li>
                    <li><strong>Location:</strong> ${booking.property.address.street}, ${booking.property.address.city}, ${booking.property.address.state} - ${booking.property.address.postalCode}</li>
                    <li><strong>Original Booking Dates:</strong> ${startDate} to ${endDate}</li>
                    <li><strong>Guests:</strong> ${booking.numberOfGuests}</li>
                </ul>

                ${refundDetails ? `
                <p><strong>Refund Details:</strong></p>
                <ul>
                    <li><strong>Amount:</strong> ₹${refundDetails.amount}</li>
                    <li><strong>Status:</strong> ${refundDetails.status}</li>
                    <li><strong>Reference ID:</strong> ${refundDetails.referenceId || 'N/A'}</li>
                </ul>
                ` : `
                <p>If any refund is applicable, it will be processed as per our cancellation policy. You will receive a separate confirmation once the refund (if eligible) is initiated.</p>
                `}

                <p>We're sorry to see your plans change, but we hope to be a part of your future celebrations. If there's anything we can assist you with, feel free to reach out.</p>

                <p><strong>Need help?</strong><br/>
                Email: <a href="mailto:info@villafest.in">info@villafest.in</a><br/>
                Phone/WhatsApp: <a href="tel:+916281742064">+91 62817 42064</a></p>

                <p>Warm regards,<br/>
                Team Villafest<br/>
                <a href="https://www.villafest.in">www.villafest.in</a><br/>
                <em>Celebrate life.</em></p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Booking cancellation email sent successfully');
    } catch (error) {
        console.error('Error sending booking cancellation email:', error);
        throw error;
    }
};


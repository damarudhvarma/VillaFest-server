import nodemailer from 'nodemailer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
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
 * Generate invoice PDF for a booking
 * @param {Object} booking - The booking object
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateInvoicePDF = async (booking) => {
    try {
        // Get the current year
        const currentYear = new Date().getFullYear();

        // Get the total number of bookings and the position of this booking
        const totalBookings = await Booking.countDocuments();
        const bookingPosition = await Booking.countDocuments({
            createdAt: { $lt: booking.createdAt }
        }) + 1;

        // Generate invoice number
        const invoiceNumber = `VF/${currentYear}/${String(bookingPosition).padStart(4, '0')}`;

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
        return Buffer.from(pdfBytes);
    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        throw error;
    }
};

/**
 * Send booking confirmation email with invoice
 * @param {Object} booking - The booking object
 * @returns {Promise<void>}
 */
export const sendBookingConfirmationEmail = async (booking) => {
    try {
        // Generate invoice PDF
        const pdfBuffer = await generateInvoicePDF(booking);

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
            subject: `Your Villafest Booking is Confirmed – ${booking._id}`,
            html: `
                <p>Dear ${booking.user.firstName} ${booking.user.lastName},</p>
                <p>Thank you for choosing <strong>Villafest</strong>! We're excited to confirm your booking.</p>

                <h3>Here are your booking details:</h3>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Villa/Farmhouse:</strong> ${booking.property.title}</li>
                    <li><strong>Location:</strong> ${booking.property.address.street}, ${booking.property.address.city}, ${booking.property.address.state} - ${booking.property.address.postalCode}</li>
                    <li><strong>Booking Date(s):</strong> ${startDate} to ${endDate}</li>
                    <li><strong>Guests:</strong> ${booking.numberOfGuests}</li>
                </ul>

                <h3>What's next?</h3>
                <ul>
                    <li>Obey the property rules.</li>
                    <li>Please carry a valid ID during check-in.</li>
                    <li>We hope you will have a great celebration!</li>
                    <li>For any assistance, our support team is just a call or email away.</li>
                </ul>

                <p><strong>Invoice Attached:</strong><br>Your invoice for the booking is attached with this email for your reference.</p>

                <p>If you have any questions or special requests, feel free to reply to this email or contact us:</p>
                <p>
                    Email: <a href="mailto:info@villafest.in">info@villafest.in</a><br>
                    Phone/WhatsApp: <a href="tel:+916281742064">+91 62817 42064</a>
                </p>

                <p>Warm regards,<br>Team Villafest<br><a href="https://www.villafest.in">www.villafest.in</a><br><em>Celebrate life.</em></p>
            `,
            attachments: [
                {
                    filename: `invoice_${booking._id}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Booking confirmation email sent successfully');
    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
        throw error;
    }
};

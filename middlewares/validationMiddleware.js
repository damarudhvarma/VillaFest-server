import { body, validationResult } from 'express-validator';

export const validateCancelBooking = [
    body('bookingId')
        .notEmpty()
        .withMessage('Booking ID is required')
        .isMongoId()
        .withMessage('Invalid booking ID format'),

    body('refundAmount')
        .notEmpty()
        .withMessage('Refund amount is required')
        .isFloat({ min: 0 })
        .withMessage('Refund amount must be a positive number'),

    body('cancellationFee')
        .notEmpty()
        .withMessage('Cancellation fee is required')
        .isFloat({ min: 0 })
        .withMessage('Cancellation fee must be a positive number')
];

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
}; 
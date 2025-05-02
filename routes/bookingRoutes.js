import { Router } from 'express';
import { authenticateHost, verifyToken } from '../middlewares/authMiddleware.js';
import { cancelBooking, generateInvoice, getAllBookings, getBookings, getHostPropertyBookings } from '../controllers/bookingController.js';
import { validateCancelBooking, validateRequest } from '../middlewares/validationMiddleware.js';

const bookingRouter = Router();

bookingRouter.get('/', verifyToken, getBookings);
bookingRouter.get('/all', verifyToken, getAllBookings);
bookingRouter.post('/cancel', verifyToken, validateCancelBooking, validateRequest, cancelBooking);
bookingRouter.get('/host-property', authenticateHost, getHostPropertyBookings);
bookingRouter.get('/:bookingId/invoice', verifyToken, generateInvoice);

export default bookingRouter;

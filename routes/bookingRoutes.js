import { Router } from 'express';
import { authenticateHost, verifyToken } from '../middlewares/authMiddleware.js';
import { cancelBooking, getAllBookings, getBookings, getHostPropertyBookings } from '../controllers/bookingController.js';


const bookingRouter = Router();

bookingRouter.get('/', verifyToken, getBookings);
bookingRouter.get('/all', verifyToken, getAllBookings);
bookingRouter.post('/cancel', verifyToken, cancelBooking);
bookingRouter.get('/host-property',authenticateHost,getHostPropertyBookings);


export default bookingRouter;

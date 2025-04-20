import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { cancelBooking, getAllBookings, getBookings } from '../controllers/bookingController.js';


const bookingRouter = Router();

bookingRouter.get('/', verifyToken, getBookings);
bookingRouter.get('/all', verifyToken, getAllBookings);
bookingRouter.post('/cancel', verifyToken, cancelBooking);



export default bookingRouter;

import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { cancelBooking, getBookings } from '../controllers/bookingController.js';


const bookingRouter = Router();

bookingRouter.get('/', verifyToken, getBookings);
bookingRouter.post('/cancel', verifyToken, cancelBooking);



export default bookingRouter;

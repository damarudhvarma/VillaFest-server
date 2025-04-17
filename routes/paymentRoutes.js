import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const paymentRouter = Router();

// Payment routes
paymentRouter.post('/order', verifyToken, createOrder);
paymentRouter.post('/verify', verifyToken, verifyPayment);

export default paymentRouter;

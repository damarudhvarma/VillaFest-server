import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();
import connectDB from './db/db.js';
import userRouter from './routes/userRoutes.js';

import cors from 'cors';
import morgan from 'morgan';
import categoryRouter from './routes/categoryRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import propertyRouter from './routes/propertyRoutes.js';
import amenityRouter from './routes/amenityRoutes.js';
import hostRouter from './routes/hostRoutes.js';
import hostPropertyRouter from './routes/hostPropertyRoutes.js';
import bannerRouter from './routes/bannerRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
const app = express();

// Configure CORS with specific origin
app.use(cors({
    origin: [process.env.USER_PRODUCTION_URL, process.env.ADMINPANEL_URL, process.env.UserSide_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

connectDB();

// Routes
app.use('/users', userRouter);
app.use('/admin', adminRouter);
app.use('/categories', categoryRouter);
app.use('/properties', propertyRouter);
app.use('/amenities', amenityRouter);
app.use('/hosts', hostRouter);
app.use('/host-properties', hostPropertyRouter);
app.use('/banners', bannerRouter);
app.use('/api/payment', paymentRouter);
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to VillaFest API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
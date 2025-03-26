import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();
import connectDB from './db/db.js';
import userRouter from './routes/userRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import cors from 'cors';
import morgan from 'morgan';
import categoryRouter from './routes/categoryRoutes.js';

const app = express();

app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Set up CORS middleware before defining routes
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Allow credentials (cookies, authorization headers)
    allowedHeaders: ['Content-Type', 'Authorization']
}));

connectDB();
app.use('/users', userRouter);
app.use('/admin', adminRouter);
app.use('/categories', categoryRouter);

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to VillaFest API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
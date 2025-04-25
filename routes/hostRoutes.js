import { Router } from 'express';
import {
    createHostController,
    loginHostController,
    getHostProfileController,
    updateHostProfileController,
    changePasswordController,
    getHostsController,
    approveHostController,
    rejectHostController,
    demoRequestController
} from '../controllers/hostController.js';


import { isAdmin, verifyToken, authenticateHost } from '../middlewares/authMiddleware.js';
import multer from "multer";
import path from "path";
import fs from "fs";

const hostRouter = Router();

// Ensure upload directory exists
const uploadDir = "public/host-enquiry";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create a default directory if property title is not available
        let dir = uploadDir;

        // If property title is available in the request body, use it to create a subdirectory
        if (req.body && req.body.propertyTitle) {
            const propertyTitle = req.body.propertyTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            dir = `${uploadDir}/${propertyTitle}`;
        } else {
            // Use a timestamp-based directory if property title is not available
            const timestamp = Date.now();
            dir = `${uploadDir}/property-${timestamp}`;
        }

        // Create directory if it doesn't exist
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `photo-${uniqueSuffix}${extension}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
});

// Public routes
hostRouter.post('/register', upload.array('propertyPhotos', 10), createHostController);
hostRouter.post('/login', loginHostController);
hostRouter.get('/', verifyToken, isAdmin, getHostsController);
hostRouter.put('/:hostId/approve', verifyToken, isAdmin, approveHostController);
hostRouter.put('/:hostId/reject', verifyToken, isAdmin, rejectHostController);
hostRouter.post('/demo-request', demoRequestController);

hostRouter.get('/profile', authenticateHost, getHostProfileController);

hostRouter.put('/change-password', authenticateHost, changePasswordController);

export default hostRouter;

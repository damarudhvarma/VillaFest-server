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
    firebaseRegisterController,
    firebaseLoginController,


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

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadDir;
        if (file.fieldname === 'propertyPhotos') {
            // For property photos
            const propertyTitle = req.body.propertyTitle?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'default';
            uploadDir = path.join('public', 'host-enquiry', propertyTitle);
        } else if (file.fieldname === 'governmentIdPhotos') {
            // For government ID photos
            uploadDir = path.join('public', 'host-enquiry', 'gov-id');
        }

        // Create directory if it doesn't exist
        fs.mkdirSync(uploadDir, { recursive: true });

        // Store the relative path for later use
        req.relativeUploadDir = uploadDir.split(path.sep).slice(1).join('/');

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure file filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and JPG are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Configure the fields
const uploadFields = upload.fields([
    { name: 'propertyPhotos', maxCount: 10 },
    { name: 'governmentIdPhotos', maxCount: 5 }
]);

// Public routes
hostRouter.post('/register', verifyToken, uploadFields, createHostController);
hostRouter.post('/login', loginHostController);
hostRouter.get('/', verifyToken, isAdmin, getHostsController);
hostRouter.put('/:hostId/approve', verifyToken, isAdmin, approveHostController);
hostRouter.delete('/:hostId/reject', verifyToken, isAdmin, rejectHostController);

hostRouter.get('/profile', authenticateHost, getHostProfileController);


hostRouter.put('/change-password', authenticateHost, changePasswordController);
hostRouter.post('/firebase-register', uploadFields, firebaseRegisterController);
hostRouter.post('/firebase-login', firebaseLoginController);

export default hostRouter;

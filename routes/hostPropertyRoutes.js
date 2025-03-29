import { Router } from 'express';
import { authenticateHost } from '../middlewares/authMiddleware.js';
import { createHostPropertyController, getHostPropertiesController } from '../controllers/host-propertyController.js';
import multer from "multer";
import path from "path";
import fs from "fs";

const hostPropertyRouter = Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create directory with property title if it doesn't exist
        const propertyTitle = req.body.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const dir = `public/host-properties/${propertyTitle}`;
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Set filename based on whether it's main image or additional image
        const isMainImage = file.fieldname === 'mainImage';
        const extension = path.extname(file.originalname);

        if (isMainImage) {
            cb(null, 'main' + extension);
        } else {
            // Get current count of additional images
            const propertyTitle = req.body.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            const dir = `public/host-properties/${propertyTitle}`;
            const existingFiles = fs.existsSync(dir)
                ? fs.readdirSync(dir).filter(f => f.startsWith('img-')).length
                : 0;
            cb(null, `img-${existingFiles + 1}${extension}`);
        }
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

// Route to create host property with file upload
hostPropertyRouter.post('/create-host-property',
    authenticateHost,
    upload.fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'additionalImages', maxCount: 6 }
    ]),
    createHostPropertyController
);
hostPropertyRouter.get('/get-host-properties', authenticateHost, getHostPropertiesController);

export default hostPropertyRouter;

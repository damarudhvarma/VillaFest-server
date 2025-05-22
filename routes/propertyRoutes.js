import { Router } from "express";
import { authenticateHost, isAdmin, verifyToken } from "../middlewares/authMiddleware.js";
import { blockDatesController, createPropertyController, getActiveHostPropertiesController, getAllPropertiesController, getBlockedDatesController, getCitiesController, getPropertyByCityController, getPropertyByIdController, getPropertyByStateController, searchPropertiesController } from "../controllers/propertyController.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const propertyRouter = Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create directory with property title if it doesn't exist
        const propertyTitle = req.body.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const dir = `public/properties/${propertyTitle}`;
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
            const dir = `public/properties/${propertyTitle}`;
            const existingFiles = fs.existsSync(dir)
                ? fs.readdirSync(dir).filter(f => f.startsWith('img-')).length
                : 0;
            cb(null, `img-${existingFiles + 1}${extension}`);
        }
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 250 * 1024 * 1024  }, // 250MB per file
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

// Update the route to handle file uploads
propertyRouter.post('/add-property',
    verifyToken,
    isAdmin,
    upload.fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'additionalImages', maxCount: 10 }
    ]),
    createPropertyController
);

propertyRouter.get('/get-properties', getAllPropertiesController);
propertyRouter.get('/get-properties/:id', getPropertyByIdController);
propertyRouter.post('/search-properties', searchPropertiesController);
propertyRouter.get('/get-cities', getCitiesController);
propertyRouter.post('/get-property-by-state', getPropertyByStateController);
propertyRouter.get('/active', authenticateHost, getActiveHostPropertiesController);
propertyRouter.post('/:id/block-dates', authenticateHost, blockDatesController);
propertyRouter.get('/blocked-dates', authenticateHost, getBlockedDatesController);


export default propertyRouter;

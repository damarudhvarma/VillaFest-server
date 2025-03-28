import { Router } from "express";
import { createAmenity, getAmenities, updateAmenity } from "../controllers/amenityController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const amenityRouter = Router();

// Create temp directory if it doesn't exist
const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Not an image! Please upload an image."), false);
        }
    },
});

// Routes
amenityRouter.post("/create", verifyToken, isAdmin, upload.single("icon"), createAmenity);
amenityRouter.get("/", verifyToken, isAdmin, getAmenities);
amenityRouter.put("/:id", verifyToken, isAdmin, upload.single("icon"), updateAmenity);

export default amenityRouter;


import { Router } from "express";
import { isAdmin, verifyToken } from "../middlewares/authMiddleware.js";
import { createBanner, getBanners, deleteBanner, editStatus } from "../controllers/bannerController.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const bannerRouter = Router();

// Ensure upload directory exists
const uploadDir = "public/banners";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// Get all banners - no auth required
bannerRouter.get("/", getBanners);

// Protected routes
bannerRouter.post(
    "/upload",
    verifyToken,
    isAdmin,
    upload.single("image"),
    createBanner
);

bannerRouter.delete('/:id', verifyToken, isAdmin, deleteBanner);    
bannerRouter.put('/:id', verifyToken, isAdmin, editStatus);

export default bannerRouter;
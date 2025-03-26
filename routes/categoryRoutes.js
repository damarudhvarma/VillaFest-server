import { Router } from "express";
import { createCategoryController, getCategoriesController } from "../controllers/categoryController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const categoryRouter = Router();

// Ensure upload directory exists
const uploadDir = "public/categories";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// Get all categories - no auth required
categoryRouter.get("/", getCategoriesController);

// Protected routes
categoryRouter.post(
    "/create",
    verifyToken,
    isAdmin,
    upload.single("image"),
    createCategoryController
);

export default categoryRouter;




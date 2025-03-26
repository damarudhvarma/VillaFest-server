import { Router } from "express";
import { createCategoryController } from "../controllers/categoryController.js";
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

categoryRouter.post(
    "/create",
    verifyToken,
    isAdmin,
    upload.single("image"),
    createCategoryController
);

export default categoryRouter;




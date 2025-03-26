import { Router } from "express";
import { isAdmin, verifyToken } from "../middlewares/authMiddleware.js";
import { createPropertyController, getAllPropertiesController } from "../controllers/propertyController.js";


const propertyRouter = Router();

propertyRouter.post('/add-property', verifyToken,isAdmin,createPropertyController); 
propertyRouter.get('/get-properties', verifyToken,isAdmin,getAllPropertiesController);

export default propertyRouter;

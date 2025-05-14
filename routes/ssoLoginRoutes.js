import { Router } from "express";
import { generateTokenController, validateTokenController } from "../controllers/ssoControllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const ssoRouter=Router();

ssoRouter.post('/sso/generate-token',verifyToken,generateTokenController);

ssoRouter.post('/sso/validate-token',validateTokenController);




export default ssoRouter;

import { Router } from 'express';
import { getAdminController, loginAdminController, logoutAdminController, registerAdminController } from '../controllers/adminControllers.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
const adminRouter = Router();

adminRouter.post('/register', registerAdminController);
adminRouter.post('/login', loginAdminController);
adminRouter.get('/profile',verifyToken, getAdminController);
adminRouter.get('/logiut',verifyToken, logoutAdminController);





export default adminRouter;
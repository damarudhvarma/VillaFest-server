import { Router } from 'express';
import {
    createHostController,
    loginHostController,
    getHostProfileController,
    updateHostProfileController,
    changePasswordController,
    getHostsController,
    approveHostController,
    rejectHostController
} from '../controllers/hostController.js';


import { isAdmin, verifyToken,authenticateHost } from '../middlewares/authMiddleware.js';

const hostRouter = Router();

// Public routes
hostRouter.post('/register', verifyToken,isAdmin, createHostController);
hostRouter.post('/login',  loginHostController);
hostRouter.get('/', verifyToken,isAdmin, getHostsController);
hostRouter.put('/:hostId/approve', verifyToken,isAdmin, approveHostController);
hostRouter.put('/:hostId/reject', verifyToken,isAdmin, rejectHostController);


hostRouter.get('/profile', authenticateHost, getHostProfileController);

hostRouter.put('/change-password', authenticateHost, changePasswordController);

export default hostRouter;

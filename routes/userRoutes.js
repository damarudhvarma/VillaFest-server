import { Router } from 'express';
import { getAllUsersController, loginUserController, registerUserController } from '../controllers/userController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';


const userRouter = Router();

userRouter.post('/register', registerUserController);
userRouter.post('/login', loginUserController);
userRouter.get('/get-all-users',verifyToken, getAllUsersController);




export default userRouter;
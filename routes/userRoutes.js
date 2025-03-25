import { Router } from 'express';
import { loginUserController, registerUserController } from '../controllers/userController.js';


const userRouter = Router();

userRouter.post('/register', registerUserController);
userRouter.post('/login', loginUserController);





export default userRouter;
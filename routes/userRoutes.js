import { Router } from 'express';
import { getAllUsersController, getUserByIdController, loginUserController, registerUserController, addToWishlistController, removeFromWishlistController, getWishlistController, updateUserProfileController, registerUserByFirebaseController, loginUserByFirebaseController, isHostController } from '../controllers/userController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';


const userRouter = Router();

userRouter.post('/register', registerUserController);
userRouter.post('/login', loginUserController);
userRouter.get('/get-all-users', verifyToken, getAllUsersController);
userRouter.get('/profile', verifyToken, getUserByIdController);
userRouter.put('/profile', verifyToken, updateUserProfileController);
userRouter.post('/add-to-wishlist', verifyToken, addToWishlistController);
userRouter.get('/wishlist', verifyToken, getWishlistController);
userRouter.delete('/wishlist/:propertyId', verifyToken, removeFromWishlistController);
userRouter.post('/firebase-register',registerUserByFirebaseController);
userRouter.post('/firebase-login',loginUserByFirebaseController);
userRouter.get('/is-host', verifyToken, isHostController);




export default userRouter;
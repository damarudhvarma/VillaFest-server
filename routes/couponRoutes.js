import { Router } from "express";
import { isAdmin, verifyToken } from "../middlewares/authMiddleware.js";
import { createCoupon, getAllCoupons } from "../controllers/couponController.js";


const couponRouter = Router();

couponRouter.post('/create-coupon',verifyToken,isAdmin,createCoupon);
couponRouter.get('/',verifyToken,isAdmin,getAllCoupons);



export default couponRouter;
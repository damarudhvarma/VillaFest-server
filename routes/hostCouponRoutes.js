import { Router } from "express";
import { createHostCoupon, getHostCoupons } from "../controllers/hostCouponController.js";
import { authenticateHost } from "../middlewares/authMiddleware.js";

const hostCouponRouter = Router();

hostCouponRouter.post('/create-coupon',authenticateHost, createHostCoupon);
hostCouponRouter.get('/get-coupons',authenticateHost, getHostCoupons);



export default hostCouponRouter;

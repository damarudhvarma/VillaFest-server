import { Router } from "express";
import { isAdmin, verifyToken } from "../middlewares/authMiddleware.js";
import { createCoupon, getAllCoupons, updateCoupon, deleteCoupon, applyCoupon } from "../controllers/couponController.js";


const couponRouter = Router();

couponRouter.post('/create-coupon', verifyToken, isAdmin, createCoupon);
couponRouter.get('/', verifyToken, getAllCoupons);
couponRouter.put('/:id', verifyToken, isAdmin, updateCoupon);
couponRouter.delete('/:id', verifyToken, isAdmin, deleteCoupon);
couponRouter.post('/apply-coupon', verifyToken, applyCoupon);



export default couponRouter;
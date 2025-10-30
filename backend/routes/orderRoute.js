// backend/routes/orderRoute.js
import express from 'express';
import { createOrder, getOrdersByUser, getAllOrders, getOrderById, updateOrderStatus } from '../controllers/orderController.js';
import verifyAuth from '../middlewares/verifyAuthMiddleware.js';
import verifyAdmin from '../middlewares/verifyAdminMiddleware.js';

const router = express.Router();

router.use(verifyAuth);

//user-only
router.post('/', createOrder);
router.get('/my-orders', getOrdersByUser);

// admin-only
router.get('/', verifyAdmin, getAllOrders);
router.put('/:orderId/status', verifyAdmin, updateOrderStatus);

router.get('/:orderId', getOrderById);

export default router;

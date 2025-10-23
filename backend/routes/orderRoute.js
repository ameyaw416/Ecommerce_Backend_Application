// routes/orderRoute.js
// import necessary modules and controllers
import { createOrder, getOrdersByUser,getAllOrders, getOrderById } from '../controllers/orderController.js';
import verifyAuth from '../middlewares/verifyAuthMiddleware.js';

import express from 'express';

const router = express.Router();
// Apply authentication middleware to all order routes
router.use(verifyAuth);

// Route to create a new order
router.post('/', createOrder);

// Route to get orders for a specific user
router.get('/my-orders', getOrdersByUser);

//Route to get all orders (admin) - Uncomment if needed
router.get('/', getAllOrders);

// Route to get a specific order by ID
router.get('/:orderId', getOrderById);


// export the router
export default router;

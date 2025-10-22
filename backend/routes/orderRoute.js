//import necessary modules and controllers
import { createOrder, getOrdersByUser } from '../controllers/orderController.js';



// Create orderRoute.js
import express from 'express';

import verifyAuth from '../middlewares/verifyAuth.js';

const router = express.Router();
// Apply authentication middleware to all order routes
router.use(verifyAuth);

// Route to create a new order
router.post('/', createOrder);

// Route to get orders for a specific user
router.get('/my-orders', getOrdersByUser);

// Route to get a specific order by id (must come after '/my-orders' to avoid route collisions)
//router.get('/:orderId', getOrderById);

export default router;
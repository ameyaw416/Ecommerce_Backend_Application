//creating cart route
import express from 'express';
import { addItemToCart, getCartItems, removeItemFromCart, updateCartItemQuantity } from '../controllers/cartController.js';
import verifyAuth from '../middlewares/verifyAuthMiddleware.js';

const router = express.Router();

// Apply verifyAuth middleware to all cart routes
router.use(verifyAuth);


// Route to get all items in the cart
router.get('/', getCartItems);

// Route to add an item to the cart
router.post('/add', addItemToCart);

// Route to update the quantity of an item in the cart
router.put('/update/:itemId', updateCartItemQuantity);

// Route to remove an item from the cart
router.delete('/remove/:itemId', removeItemFromCart);

export default router;
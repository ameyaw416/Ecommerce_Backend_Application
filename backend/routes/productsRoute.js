// creating productsRoute.js file
import express from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productsController.js';
import verifyAuth from '../middlewares/verifyAuthMiddleware.js';

const router = express.Router();

// Apply verifyAuth middleware to all product routes
router.use(verifyAuth);

// Define product routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
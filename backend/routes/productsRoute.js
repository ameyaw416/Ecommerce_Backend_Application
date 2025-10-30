// creating productsRoute.js file
import express from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, listProducts, createBulkProducts } from '../controllers/productsController.js';
import verifyAuth from '../middlewares/verifyAuthMiddleware.js';
import verifyAdmin from '../middlewares/verifyAdminMiddleware.js';

const router = express.Router();

// Apply verifyAuth middleware to all product routes
router.use(verifyAuth);

// Define product routes
router.get('/', getAllProducts, listProducts);
router.get('/:id', getProductById);
router.post('/', verifyAdmin, createProduct);
router.put('/:id', verifyAdmin, updateProduct);
router.delete('/:id', verifyAdmin, deleteProduct);
router.post('/bulk', verifyAdmin, createBulkProducts);

export default router;
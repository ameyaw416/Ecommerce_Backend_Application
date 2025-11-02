// backend/routes/adminInventoryRoute.js
import express from 'express';
import verifyAuth from '../middlewares/verifyAuthMiddleware.js';
import verifyAdmin from '../middlewares/verifyAdminMiddleware.js';
import { adminAdjustStock } from '../controllers/adminInventoryController.js';

const router = express.Router();

// Protect all admin inventory routes
router.use(verifyAuth, verifyAdmin);



// Change stock by delta
router.patch('/products/:id/stock', adminAdjustStock);

export default router;

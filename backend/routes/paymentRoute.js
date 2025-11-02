import express from 'express';
import verifyAuth from '../middlewares/verifyAuthMiddleware.js';
import verifyAdmin from '../middlewares/verifyAdminMiddleware.js';
import {createPaymentIntent,confirmMockPayment,getPaymentsForOrder,getPaymentsForUser,getAllPayments,} from '../controllers/paymentController.js';

const router = express.Router();

// Protect all payment routes
router.use(verifyAuth);

// Create a payment intent for an order
router.post('/intents', createPaymentIntent);

// Confirm a mock payment (testing only)
router.post('/mock/confirm', confirmMockPayment);

// List all payments for the authenticated user
router.get('/', getPaymentsForUser);

// Admin view: list every payment record
router.get('/admin/all', verifyAdmin, getAllPayments);

// List all payments for an order (for the owner)
router.get('/order/:orderId', getPaymentsForOrder);

export default router;

import express from 'express';
import verifyAuth from '../middlewares/verifyAuthMiddleware.js';
import verifyAdmin from '../middlewares/verifyAdminMiddleware.js';
import { adminGetUsers, adminUpdateUserRole } from '../controllers/adminUserController.js';

const router = express.Router();

// Protect all admin user routes
router.use(verifyAuth, verifyAdmin);

router.get('/users', adminGetUsers);
router.put('/users/:id/role', adminUpdateUserRole);

export default router;

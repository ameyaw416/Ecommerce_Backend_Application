import express from 'express';
import verifyAuth from '../middlewares/verifyAuthMiddleware.js';
import verifyAdmin from '../middlewares/verifyAdminMiddleware.js';
import { adminGetUsers, adminUpdateUserRole, adminGetUserRoleHistory } from '../controllers/adminUserController.js';

const router = express.Router();

// Protect all admin user routes
router.use(verifyAuth, verifyAdmin);

router.get('/users', adminGetUsers, adminGetUsers);
router.put('/users/:id/role', adminUpdateUserRole);
// GET /api/admin/users/:id/role-history
router.get('/users/:id/role-history', verifyAuth, verifyAdmin, adminGetUserRoleHistory);


export default router;

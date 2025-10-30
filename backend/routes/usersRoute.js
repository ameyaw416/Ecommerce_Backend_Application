//creating users routes

import express from 'express';
import verifyAuth from '../middlewares/verifyAuthMiddleware.js';
import verifyAdmin from '../middlewares/verifyAdminMiddleware.js';
import { getAllUsers, getUserById, updateUser, deleteUser, getMyProfile, updateMyProfile } from '../controllers/usersController.js';

const router = express.Router();

router.get('/', verifyAuth, verifyAdmin, getAllUsers); // Admin: list users
router.get('/profile/me', verifyAuth, getMyProfile); // User: own profile
router.put('/profile/me', verifyAuth, updateMyProfile); // User: update own profile
router.get('/:id', verifyAuth, verifyAdmin, getUserById); // Admin: get user by ID
router.put('/:id', verifyAuth, verifyAdmin, updateUser); // Admin: update user by ID
router.delete('/:id', verifyAuth, verifyAdmin, deleteUser); // Admin: delete user by ID


export default router;



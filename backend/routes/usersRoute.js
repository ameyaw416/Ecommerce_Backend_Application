//creating users routes

import express from 'express';
import verifyAuth from '../middlewares/verifyAuth.js';
import { getAllUsers, getUserById, updateUser, deleteUser, getMyProfile, updateMyProfile } from '../controllers/usersController.js';

const router = express.Router();

router.get('/', verifyAuth, getAllUsers); // Get all users
router.get('/profile/me', verifyAuth, getMyProfile);// Get my profile
router.put('/profile/me', verifyAuth, updateMyProfile);// Update my profile
router.get('/:id', verifyAuth, getUserById);// Get user by ID
router.put('/:id', verifyAuth, updateUser);// Update user by ID
router.delete('/:id', verifyAuth, deleteUser);// Delete user by ID


export default router;




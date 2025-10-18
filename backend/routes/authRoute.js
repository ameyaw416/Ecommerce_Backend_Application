// authentication routes
import express from 'express';
import { registerUser, loginUser, logoutUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
//router.post('/refresh', refreshToken); // cookie is sent automatically by browser (credentials)
router.post('/logout', logoutUser);

export default router;
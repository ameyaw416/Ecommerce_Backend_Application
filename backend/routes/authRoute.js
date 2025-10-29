// authentication routes
import express from 'express';
import { registerUser, loginUser, logoutUser, refreshToken, forgotPassword, resetPassword, changePassword} from '../controllers/authController.js';
import validateBody,{registerSchema, loginSchema} from '../middlewares/inputValidatorMiddleware.js';
import verifyAuth from '../middlewares/verifyAuthMiddleware.js';

const router = express.Router();

router.post('/register', validateBody(registerSchema), registerUser);
router.post('/login', validateBody(loginSchema), loginUser);
router.post('/refresh', refreshToken); // cookie is sent by browser automatically (credentials)
router.post('/logout', logoutUser);

// password flows
router.post('/forgot-password', forgotPassword);            // public
router.post('/reset-password', resetPassword);              // public
router.put('/change-password', verifyAuth, changePassword); // authenticated



export default router;
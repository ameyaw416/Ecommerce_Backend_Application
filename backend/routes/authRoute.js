// authentication routes
import express from 'express';
import { registerUser, loginUser, logoutUser, refreshToken,} from '../controllers/authController.js';
import validateBody,{registerSchema, loginSchema} from '../middlewares/inputValidatorMiddleware.js';

const router = express.Router();

router.post('/register', validateBody(registerSchema), registerUser);
router.post('/login', validateBody(loginSchema), loginUser);
router.post('/refresh', refreshToken); // cookie is sent by browser automatically (credentials)
router.post('/logout', logoutUser);


export default router;
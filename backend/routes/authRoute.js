// authentication routes
import express from 'express';
import { registerUser, loginUser, logoutUser, refreshToken} from '../controllers/authController.js';
import validateBody from '../middlewares/inputValidator.js';

const router = express.Router();

router.post('/register', validateBody, registerUser);
router.post('/login', validateBody, loginUser);
router.post('/refresh', refreshToken); // cookie is sent by browser automatically (credentials)
router.post('/logout', logoutUser);


export default router;
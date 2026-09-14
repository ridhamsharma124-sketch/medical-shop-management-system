import { Router } from 'express';
import { register, verifyOtp, resendOtp, login, logout,} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema,verifyOtpSchema,resendOtpSchema,loginSchema,} from '../validators/authValidator.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), resendOtp);
router.post('/login', validate(loginSchema), login);
router.post('/logout', protect, logout);

export default router;
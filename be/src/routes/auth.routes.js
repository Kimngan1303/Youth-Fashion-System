import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController,
  refreshController,
  verifyEmailController,
  resendVerificationOtpController,
} from '../controllers/auth.controller.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOtpSchema,
  validateBody,
} from '../validations/auth.validation.js';

const router = Router();

// POST /api/auth/register - Đăng ký Khách hàng (Customer) mới (sinh OTP)
router.post('/register', validateBody(registerSchema), registerController);

// POST /api/auth/verify-email - Xác thực Email bằng OTP 6 chữ số
router.post('/verify-email', validateBody(verifyEmailSchema), verifyEmailController);

// POST /api/auth/resend-verification-otp - Gửi lại mã xác thực OTP
router.post('/resend-verification-otp', validateBody(resendOtpSchema), resendVerificationOtpController);

// POST /api/auth/login - Đăng nhập (Customer hoặc Employee)
router.post('/login', validateBody(loginSchema), loginController);

// POST /api/auth/logout - Đăng xuất
router.post('/logout', logoutController);

// POST /api/auth/refresh - Cấp lại Access Token
router.post('/refresh', refreshController);

export default router;

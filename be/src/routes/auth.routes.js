import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController,
  refreshController,
} from '../controllers/auth.controller.js';
import { registerSchema, loginSchema, validateBody } from '../validations/auth.validation.js';

const router = Router();

// POST /api/auth/register - Đăng ký Khách hàng (Customer) mới
router.post('/register', validateBody(registerSchema), registerController);

// POST /api/auth/login - Đăng nhập (Customer hoặc Employee)
router.post('/login', validateBody(loginSchema), loginController);

// POST /api/auth/logout - Đăng xuất
router.post('/logout', logoutController);

// POST /api/auth/refresh - Cấp lại Access Token
router.post('/refresh', refreshController);

export default router;

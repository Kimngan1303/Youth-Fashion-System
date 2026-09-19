import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController,
  refreshController,
  updateProfileController,
  changePasswordController,
} from '../controllers/auth.controller.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema, validateBody } from '../validations/auth.validation.js';
import { verifyAccessToken } from '../helpers/jwt.helper.js';

const router = Router();

// Middleware xác thực không bắt buộc (nếu có token thì giải mã, không có thì vẫn tiếp tục)
const optionalAuthToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch (e) {
      // ignore
    }
  }
  next();
};

// POST /api/auth/register - Đăng ký Khách hàng (Customer) mới
router.post('/register', validateBody(registerSchema), registerController);

// POST /api/auth/login - Đăng nhập (Customer hoặc Employee)
router.post('/login', validateBody(loginSchema), loginController);

// POST /api/auth/logout - Đăng xuất
router.post('/logout', logoutController);

// POST /api/auth/refresh - Cấp lại Access Token
router.post('/refresh', refreshController);

// PUT /api/auth/profile - Cập nhật thông tin Hồ sơ cá nhân
router.put('/profile', optionalAuthToken, validateBody(updateProfileSchema), updateProfileController);

// PUT /api/auth/change-password - Đổi mật khẩu tài khoản
router.put('/change-password', optionalAuthToken, validateBody(changePasswordSchema), changePasswordController);

export default router;

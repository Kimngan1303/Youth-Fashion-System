import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Yêu cầu xác thực đăng nhập và quyền hạn ADMIN tối cao
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

// Lấy danh sách toàn bộ người dùng
router.get('/users', adminController.getAllUsers);

// Lấy các chỉ số thống kê tổng quan
router.get('/metrics', adminController.getAdminMetrics);

// Tạo tài khoản Quản trị viên (Admin / Manager) mới
router.post('/create-admin', adminController.createAdmin);

// Cập nhật trạng thái tài khoản (Khóa / Kích hoạt)
router.put('/users/:type/:id/status', adminController.updateUserStatus);

// Cập nhật phân quyền / vai trò
router.put('/users/:type/:id/role', adminController.updateUserRole);

// Xóa tài khoản
router.delete('/users/:type/:id', adminController.deleteUser);

export default router;

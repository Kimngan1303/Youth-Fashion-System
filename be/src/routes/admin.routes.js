import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Yêu cầu xác thực đăng nhập cho tất cả endpoint quản trị
router.use(authenticateToken);

// Lấy các chỉ số thống kê tổng quan (cho phép Admin và Manager xem ở trang Tổng Quan)
router.get('/metrics', authorizeRoles('ADMIN', 'MANAGER'), adminController.getAdminMetrics);

// Các thao tác quản lý người dùng bên dưới chỉ dành cho ADMIN duy nhất
router.use(authorizeRoles('ADMIN'));

// Lấy danh sách toàn bộ người dùng
router.get('/users', adminController.getAllUsers);

// Tạo tài khoản Quản trị viên (Admin / Manager) mới
router.post('/create-admin', adminController.createAdmin);

// Cập nhật trạng thái tài khoản (Khóa / Kích hoạt)
router.put('/users/:type/:id/status', adminController.updateUserStatus);

// Cập nhật phân quyền / vai trò
router.put('/users/:type/:id/role', adminController.updateUserRole);

// Xóa tài khoản
router.delete('/users/:type/:id', adminController.deleteUser);

export default router;

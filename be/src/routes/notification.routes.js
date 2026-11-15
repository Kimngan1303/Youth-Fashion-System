import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = Router();

// Bắt buộc xác thực đăng nhập cho toàn bộ thao tác thông báo
router.use(authenticateToken);

// Lấy danh sách thông báo của người dùng hiện tại
router.get('/', notificationController.getNotifications);

// Đánh dấu đọc tất cả
router.patch('/read-all', notificationController.markAllAsRead);

// Đánh dấu đọc 1 thông báo
router.patch('/:id/read', notificationController.markAsRead);

// Xóa tất cả thông báo
router.delete('/', notificationController.deleteAllNotifications);

// Xóa 1 thông báo
router.delete('/:id', notificationController.deleteNotification);

export default router;

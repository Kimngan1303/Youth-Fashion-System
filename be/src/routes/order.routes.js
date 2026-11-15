import { Router } from 'express';
import {
  authenticateToken,
  authorizeRoles,
  optionalAuthenticateToken,
} from '../middlewares/auth.middleware.js';
import * as orderController from '../controllers/order.controller.js';

const router = Router();

// ==========================================
// 1. SPECIFIC GET & PUBLIC / OPTIONAL AUTH ROUTES
// ==========================================

// Tạo đơn hàng mới (hỗ trợ cả khách đăng nhập và khách mua nhanh)
router.post('/', optionalAuthenticateToken, orderController.createOrder);

// Webhook tiếp nhận thông báo tự động từ PayOS
router.post('/payos-webhook', orderController.payosWebhook);

// Lấy danh sách đơn hàng của chính khách hàng đang đăng nhập (phải đặt trước /:orderNumber)
router.get('/my-orders', authenticateToken, orderController.getMyOrders);

// Kiểm tra trạng thái thanh toán PayOS theo orderCode (phải đặt trước /:orderNumber)
router.get('/check-payos/:orderCode', optionalAuthenticateToken, orderController.checkPayosStatus);

// Tra cứu thông tin đơn hàng theo mã đơn (cho khách vãng lai / trang OrderSuccess / chủ đơn)
router.get('/:orderNumber', optionalAuthenticateToken, orderController.getOrderByNumber);

// ==========================================
// 2. CUSTOMER AUTHENTICATED ROUTES
// ==========================================

// Khách hàng hủy đơn hàng của chính mình (chỉ cho phép khi đơn ở trạng thái PENDING)
router.patch('/customer/:id/cancel', authenticateToken, orderController.customerCancelOrder);
router.post('/customer/:id/cancel', authenticateToken, orderController.customerCancelOrder);

// Khách hàng gửi yêu cầu hoàn tiền / đổi trả (đơn PayOS bị shop hủy hoặc đơn đã nhận)
router.post('/customer/:id/refund-request', authenticateToken, orderController.customerRefundRequest);

// Khách hàng bấm "Đã nhận được hàng"
router.patch('/customer/:id/confirm-delivered', authenticateToken, orderController.customerConfirmDelivered);

// ==========================================
// 3. ADMIN / MANAGER AUTHORIZED ROUTES
// ==========================================

// Lấy tất cả đơn hàng hệ thống
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), orderController.getAllOrders);

// Cập nhật trạng thái đơn hàng theo quy trình tuần tự
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), orderController.updateOrderStatus);

// Quản trị viên hủy đơn hàng kèm lý do
router.patch('/:id/cancel', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), orderController.cancelOrder);
router.post('/:id/cancel', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), orderController.cancelOrder);

// Xóa toàn bộ đơn hàng (phải đặt trước /:id)
router.delete('/clear-all', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), orderController.clearAllOrders);

// Xóa đơn hàng cụ thể
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), orderController.deleteOrder);

// Gửi email thông báo đơn hàng trực tiếp
router.post('/notify-email', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), orderController.notifyOrderEmail);

export default router;

import { Router } from 'express';
import { verifyAccessToken } from '../helpers/jwt.helper.js';
import * as orderController from '../controllers/order.controller.js';

const router = Router();

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    } catch (e) {
      // Bỏ qua lỗi token để tiếp tục với tư cách khách vãng lai
    }
  }
  next();
};

// Tạo đơn hàng mới (hỗ trợ cả khách đăng nhập và khách mua nhanh)
router.post('/', optionalAuth, orderController.createOrder);

// Lấy tất cả đơn hàng (cho Manager / Admin)
router.get('/', optionalAuth, orderController.getAllOrders);

// Lấy danh sách đơn hàng của khách hàng hiện tại
router.get('/my-orders', optionalAuth, orderController.getMyOrders);

// Cập nhật trạng thái đơn hàng (cho Manager / Admin)
router.patch('/:id/status', optionalAuth, orderController.updateOrderStatus);

// Xóa toàn bộ đơn hàng (cho Manager / Admin)
router.delete('/clear-all', optionalAuth, orderController.clearAllOrders);

// Xóa đơn hàng (cho Manager / Admin)
router.delete('/:id', optionalAuth, orderController.deleteOrder);

// Hủy đơn hàng
router.patch('/:id/cancel', optionalAuth, orderController.cancelOrder);
router.post('/:id/cancel', optionalAuth, orderController.cancelOrder);

// Gửi email thông báo đơn hàng trực tiếp
router.post('/notify-email', optionalAuth, orderController.notifyOrderEmail);

// Tra cứu thông tin đơn hàng theo mã đơn
router.get('/:orderNumber', optionalAuth, orderController.getOrderByNumber);

// Kiểm tra trạng thái thanh toán PayOS theo orderCode
router.get('/check-payos/:orderCode', optionalAuth, orderController.checkPayosStatus);

// Webhook tiếp nhận thông báo tự động từ PayOS
router.post('/payos-webhook', orderController.payosWebhook);

export default router;


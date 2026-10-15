import { Router } from 'express';
import * as cartController from '../controllers/cart.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import {
  addToCartSchema,
  updateCartItemSchema,
  syncCartSchema,
  validateCartBody,
} from '../validations/cart.validation.js';

const router = Router();

// 🔒 Tất cả các route giỏ hàng yêu cầu Access Token của Khách hàng (CUSTOMER)
router.use(authenticateToken);
router.use(authorizeRoles('CUSTOMER'));

// GET /api/cart - Lấy thông tin giỏ hàng
router.get('/', cartController.getCart);

// DELETE /api/cart - Xóa sạch toàn bộ sản phẩm trong giỏ hàng
router.delete('/', cartController.clearCart);

// POST /api/cart/items - Thêm sản phẩm biến thể vào giỏ hàng
router.post('/items', validateCartBody(addToCartSchema), cartController.addItem);

// PATCH /api/cart/items/:id - Cập nhật số lượng sản phẩm trong giỏ hàng
router.patch('/items/:id', validateCartBody(updateCartItemSchema), cartController.updateItemQuantity);

// DELETE /api/cart/items/:id - Xóa 1 sản phẩm khỏi giỏ hàng
router.delete('/items/:id', cartController.deleteItem);

// POST /api/cart/sync - Đồng bộ giỏ hàng khách vãng lai sau khi đăng nhập
router.post('/sync', validateCartBody(syncCartSchema), cartController.syncCart);

export default router;

import { Router } from 'express';
import * as wishlistController from '../controllers/wishlist.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import {
  addToWishlistSchema,
  toggleWishlistSchema,
  syncWishlistSchema,
  validateWishlistBody,
} from '../validations/wishlist.validation.js';

const router = Router();

// 🔒 Tất cả các route yêu thích yêu cầu Access Token của Khách hàng (CUSTOMER)
router.use(authenticateToken);
router.use(authorizeRoles('CUSTOMER'));

// GET /api/wishlist - Lấy danh sách sản phẩm yêu thích
router.get('/', wishlistController.getWishlist);

// DELETE /api/wishlist - Xóa toàn bộ sản phẩm yêu thích
router.delete('/', wishlistController.clearWishlist);

// POST /api/wishlist - Thêm sản phẩm vào danh sách yêu thích
router.post('/', validateWishlistBody(addToWishlistSchema), wishlistController.addToWishlist);

// POST /api/wishlist/toggle - Thêm hoặc gỡ sản phẩm yêu thích (tiện lợi cho nút trái tim)
router.post('/toggle', validateWishlistBody(toggleWishlistSchema), wishlistController.toggleWishlist);

// POST /api/wishlist/sync - Đồng bộ danh sách yêu thích khi đăng nhập
router.post('/sync', validateWishlistBody(syncWishlistSchema), wishlistController.syncWishlist);

// GET /api/wishlist/check/:productId - Kiểm tra sản phẩm đã được thích chưa
router.get('/check/:productId', wishlistController.checkWishlistStatus);

// DELETE /api/wishlist/:productId - Xóa 1 sản phẩm khỏi danh sách yêu thích
router.delete('/:productId', wishlistController.removeFromWishlist);

export default router;


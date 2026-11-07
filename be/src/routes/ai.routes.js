import { Router } from 'express';
import {
  searchByTextController,
  searchByImageController,
  searchHybridController,
  getRecommendationsController,
  getZeroResultsAnalyticsController,
} from '../controllers/ai.controller.js';
import { upload } from '../middlewares/upload.middleware.js';
import { authenticateToken, authorizeRoles, optionalAuthenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// 1. Tìm kiếm bằng văn bản (Text Semantic Search)
router.post('/search/text', optionalAuthenticateToken, searchByTextController);

// 2. Tìm kiếm bằng hình ảnh (Visual Search)
router.post('/search/image', optionalAuthenticateToken, upload.single('image'), searchByImageController);

// 3. Tìm kiếm kết hợp Ảnh + Text (Hybrid Multimodal Search)
router.post('/search/hybrid', optionalAuthenticateToken, upload.single('image'), searchHybridController);

// 4. Gợi ý sản phẩm thông minh (AI Recommendations)
router.get('/recommendations', optionalAuthenticateToken, getRecommendationsController);

// 5. Thống kê từ khóa 0 kết quả (Dành cho Quản lý / Admin)
router.get(
  '/analytics/zero-results',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  getZeroResultsAnalyticsController
);

export default router;


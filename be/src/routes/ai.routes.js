import { Router } from 'express';
import {
  searchByTextController,
  searchByImageController,
  searchHybridController,
  getRecommendationsController,
  getZeroResultsAnalyticsController,
} from '../controllers/ai.controller.js';
import { uploadAiImage } from '../middlewares/upload.middleware.js';
import { aiSearchRateLimiter } from '../middlewares/rateLimit.middleware.js';
import { authenticateToken, authorizeRoles, optionalAuthenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// 1. Tìm kiếm bằng văn bản (Text Semantic Search) - Áp dụng Rate Limiter 20 req/phút
router.post('/search/text', aiSearchRateLimiter, optionalAuthenticateToken, searchByTextController);

// 2. Tìm kiếm bằng hình ảnh (Visual Search) - Áp dụng Rate Limiter + Validation Magic Bytes (ảnh bắt buộc)
router.post(
  '/search/image',
  aiSearchRateLimiter,
  optionalAuthenticateToken,
  uploadAiImage('image', true),
  searchByImageController
);

// 3. Tìm kiếm kết hợp Ảnh + Text (Hybrid Multimodal Search) - Áp dụng Rate Limiter + Validation Magic Bytes (ảnh tùy chọn)
router.post(
  '/search/hybrid',
  aiSearchRateLimiter,
  optionalAuthenticateToken,
  uploadAiImage('image', false),
  searchHybridController
);

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

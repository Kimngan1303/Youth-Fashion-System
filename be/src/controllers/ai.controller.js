import {
  searchByTextService,
  searchByImageService,
  searchHybridService,
  getPersonalizedRecommendationsService,
  getZeroResultAnalyticsService,
} from '../services/ai/aiSearch.service.js';
import { BaseResponse } from '../utils/baseResponse.js';

/**
 * Controller xử lý các Request liên quan đến AI Search & Recommendations
 */

/**
 * POST /api/ai/search/text
 * Tìm kiếm theo mô tả văn bản
 */
export async function searchByTextController(req, res, next) {
  try {
    const { query, top_k, threshold } = req.body;
    const customerId = req.user?.id || null;

    const data = await searchByTextService({
      queryText: query,
      topK: top_k ? parseInt(top_k, 10) : 10,
      minThreshold: threshold ? parseFloat(threshold) : 0.10,
      customerId,
    });

    return BaseResponse.success(res, 'Tìm kiếm sản phẩm thành công', data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/search/image
 * Tìm kiếm bằng hình ảnh (upload qua FormData)
 */
export async function searchByImageController(req, res, next) {
  try {
    const imageBuffer = req.file?.buffer;
    const { top_k, threshold } = req.body;
    const customerId = req.user?.id || null;

    const data = await searchByImageService({
      imageBuffer,
      topK: top_k ? parseInt(top_k, 10) : 10,
      minThreshold: threshold ? parseFloat(threshold) : 0.10,
      customerId,
    });

    return BaseResponse.success(res, 'Tìm kiếm bằng hình ảnh thành công', data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/search/hybrid
 * Tìm kiếm kết hợp Ảnh và Text
 */
export async function searchHybridController(req, res, next) {
  try {
    const imageBuffer = req.file?.buffer;
    const { query, top_k, threshold, image_weight, text_weight } = req.body;
    const customerId = req.user?.id || null;

    const data = await searchHybridService({
      imageBuffer,
      queryText: query,
      topK: top_k ? parseInt(top_k, 10) : 10,
      minThreshold: threshold ? parseFloat(threshold) : 0.10,
      customerId,
      imgWeight: image_weight ? parseFloat(image_weight) : 0.7,
      txtWeight: text_weight ? parseFloat(text_weight) : 0.3,
    });

    return BaseResponse.success(res, 'Tìm kiếm kết hợp thành công', data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ai/recommendations
 * Gợi ý sản phẩm cho Homepage Feed
 */
export async function getRecommendationsController(req, res, next) {
  try {
    const customerId = req.user?.id || null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 8;

    const data = await getPersonalizedRecommendationsService({
      customerId,
      limit,
    });

    return BaseResponse.success(res, 'Lấy danh sách gợi ý thành công', data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ai/analytics/zero-results
 * Danh sách từ khóa 0 kết quả cho Manager
 */
export async function getZeroResultsAnalyticsController(req, res, next) {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;

    const data = await getZeroResultAnalyticsService({ page, limit });
    return BaseResponse.success(res, 'Lấy báo cáo từ khóa 0 kết quả thành công', data);
  } catch (err) {
    next(err);
  }
}


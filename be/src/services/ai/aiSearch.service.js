import { createTextEmbedding, createImageEmbedding, createHybridEmbedding } from './embedding.service.js';
import { vectorSearchService } from './vectorSearch.service.js';
import { prisma } from '../../repositories/prisma.js';
import { uploadToCloudinary } from '../../config/cloudinary.js';

/**
 * Service xử lý các nghiệp vụ Tìm kiếm AI, Gợi ý Cá nhân hóa và Phân tích tìm kiếm
 */

/**
 * 1. Tìm kiếm bằng văn bản ngữ nghĩa (Semantic Text Search)
 */
export async function searchByTextService({ queryText, topK = 10, minThreshold = 0.10, customerId = null }) {
  if (!queryText || typeof queryText !== 'string' || queryText.trim() === '') {
    const error = new Error('Vui lòng nhập từ khóa hoặc câu mô tả sản phẩm cần tìm');
    error.statusCode = 400;
    throw error;
  }

  const cleanQuery = queryText.trim();
  const queryVec = await createTextEmbedding(cleanQuery);
  const results = vectorSearchService.searchSimilar(queryVec, topK, minThreshold);

  // Lưu vết lịch sử tìm kiếm vào MySQL
  try {
    await prisma.userSearchHistory.create({
      data: {
        customer_id: customerId ? BigInt(customerId) : null,
        search_type: 'TEXT',
        query_text: cleanQuery,
        results_count: results.length,
      },
    });
  } catch (err) {
    console.warn('[AI Search Log] Không thể ghi lịch sử tìm kiếm:', err.message);
  }

  return {
    query: cleanQuery,
    search_type: 'TEXT',
    total: results.length,
    products: results,
  };
}

/**
 * 2. Tìm kiếm bằng hình ảnh (Visual Search)
 */
export async function searchByImageService({ imageBuffer, topK = 10, minThreshold = 0.10, customerId = null }) {
  if (!imageBuffer) {
    const error = new Error('Vui lòng tải lên file hình ảnh cần tìm');
    error.statusCode = 400;
    throw error;
  }

  // 1. Tạo Image Embedding từ Buffer ảnh
  const imageVec = await createImageEmbedding(imageBuffer);
  const results = vectorSearchService.searchSimilar(imageVec, topK, minThreshold);

  // 2. Upload ảnh lên Cloudinary để lưu URL làm bằng chứng trong lịch sử tìm kiếm
  let searchImageUrl = null;
  try {
    const uploadResult = await uploadToCloudinary(imageBuffer, 'youthfashion/ai_searches');
    searchImageUrl = uploadResult.secure_url;
  } catch (uploadErr) {
    console.warn('[AI Search] Không thể upload ảnh tìm kiếm lên Cloudinary:', uploadErr.message);
  }

  // 3. Lưu vết lịch sử
  try {
    await prisma.userSearchHistory.create({
      data: {
        customer_id: customerId ? BigInt(customerId) : null,
        search_type: 'IMAGE',
        search_image_url: searchImageUrl,
        results_count: results.length,
      },
    });
  } catch (err) {
    console.warn('[AI Search Log] Không thể ghi lịch sử tìm kiếm ảnh:', err.message);
  }

  return {
    search_image_url: searchImageUrl,
    search_type: 'IMAGE',
    total: results.length,
    products: results,
  };
}

/**
 * 3. Tìm kiếm kết hợp Ảnh + Text (Hybrid / Multimodal Search)
 */
export async function searchHybridService({
  imageBuffer,
  queryText,
  topK = 10,
  minThreshold = 0.10,
  customerId = null,
  imgWeight = 0.7,
  txtWeight = 0.3,
}) {
  if (!imageBuffer && !queryText) {
    const error = new Error('Vui lòng cung cấp ít nhất hình ảnh hoặc câu mô tả văn bản');
    error.statusCode = 400;
    throw error;
  }

  let finalVec;
  let searchType = 'HYBRID';
  let searchImageUrl = null;

  // Nếu chỉ có ảnh
  if (imageBuffer && !queryText) {
    return searchByImageService({ imageBuffer, topK, minThreshold, customerId });
  }

  // Nếu chỉ có text
  if (!imageBuffer && queryText) {
    return searchByTextService({ queryText, topK, minThreshold, customerId });
  }

  // Nếu có cả 2: Tiến hành hòa trộn Hybrid
  const [imageVec, textVec] = await Promise.all([
    createImageEmbedding(imageBuffer),
    createTextEmbedding(queryText),
  ]);

  finalVec = createHybridEmbedding(imageVec, textVec, imgWeight, txtWeight);
  const results = vectorSearchService.searchSimilar(finalVec, topK, minThreshold);

  // Upload ảnh tìm kiếm
  try {
    const uploadResult = await uploadToCloudinary(imageBuffer, 'youthfashion/ai_searches');
    searchImageUrl = uploadResult.secure_url;
  } catch (uploadErr) {
    console.warn('[AI Search] Không thể upload ảnh hybrid lên Cloudinary:', uploadErr.message);
  }

  // Lưu vết lịch sử
  try {
    await prisma.userSearchHistory.create({
      data: {
        customer_id: customerId ? BigInt(customerId) : null,
        search_type: 'HYBRID',
        query_text: queryText,
        search_image_url: searchImageUrl,
        results_count: results.length,
      },
    });
  } catch (err) {
    console.warn('[AI Search Log] Không thể ghi lịch sử hybrid:', err.message);
  }

  return {
    query: queryText,
    search_image_url: searchImageUrl,
    search_type: 'HYBRID',
    weights: { image: imgWeight, text: txtWeight },
    total: results.length,
    products: results,
  };
}

/**
 * 4. Gợi ý sản phẩm thông minh (AI Recommendation System cho Homepage Feed)
 * Dựa trên lịch sử tìm kiếm gần nhất của customer_id
 */
export async function getPersonalizedRecommendationsService({ customerId, limit = 8 }) {
  if (customerId) {
    // Lấy 3 lịch sử tìm kiếm gần nhất của user này
    const histories = await prisma.userSearchHistory.findMany({
      where: { customer_id: BigInt(customerId) },
      orderBy: { created_at: 'desc' },
      take: 3,
    });

    // Nếu có lịch sử tìm kiếm bằng text hoặc ảnh
    const textQueries = histories.map((h) => h.query_text).filter(Boolean);
    if (textQueries.length > 0) {
      // Dùng query gần nhất để gợi ý
      const latestQuery = textQueries[0];
      const queryVec = await createTextEmbedding(latestQuery);
      const recommended = vectorSearchService.searchSimilar(queryVec, limit, 0.12);

      if (recommended.length > 0) {
        return {
          strategy: 'PERSONALIZED_HISTORY',
          based_on_query: latestQuery,
          products: recommended,
        };
      }
    }
  }

  // Fallback: Nếu là khách mới hoặc chưa có lịch sử tìm kiếm, gợi ý sản phẩm nổi bật
  const defaultProducts = vectorSearchService.vectorsCache.slice(0, limit).map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name,
    category_name: item.category_name,
    brand_name: item.brand_name,
    price: item.price,
    colors: item.colors,
    image_url: item.image_url,
  }));

  return {
    strategy: 'TRENDING_FALLBACK',
    based_on_query: null,
    products: defaultProducts,
  };
}

/**
 * 5. Phân tích truy vấn 0 kết quả (Zero-result queries) cho Manager
 */
export async function getZeroResultAnalyticsService({ page = 1, limit = 20 }) {
  const skip = (Math.max(1, page) - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.userSearchHistory.findMany({
      where: { results_count: 0 },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: {
        customer: {
          select: { full_name: true, email: true },
        },
      },
    }),
    prisma.userSearchHistory.count({
      where: { results_count: 0 },
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items: items.map((item) => ({
      search_id: String(item.search_id),
      customer_name: item.customer?.full_name || 'Khách vãng lai (Guest)',
      search_type: item.search_type,
      query_text: item.query_text,
      search_image_url: item.search_image_url,
      created_at: item.created_at,
    })),
  };
}


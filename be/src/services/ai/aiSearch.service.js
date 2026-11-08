import { createTextEmbedding, createImageEmbedding, createHybridEmbedding, cosineSimilarity } from './embedding.service.js';
import { vectorSearchService } from './vectorSearch.service.js';
import { vietnameseHybridSearchService } from './vietnameseHybridSearch.service.js';
import { correctVietnameseQuery } from './vietnameseSpellCorrector.js';
import { parseVietnameseQuery } from './vietnameseQueryParser.js';
import { getCategoryRelationship } from './categoryHierarchy.js';
import { prisma } from '../../repositories/prisma.js';
import { uploadToCloudinary } from '../../config/cloudinary.js';

/**
 * Service xử lý các nghiệp vụ Tìm kiếm AI, Gợi ý Cá nhân hóa và Phân tích tìm kiếm
 */

/**
 * 1. Tìm kiếm bằng văn bản ngữ nghĩa kết hợp (Vietnamese Hybrid Text Search)
 * Tích hợp Attribute Matching, Keyword Search và CLIP Semantic Translation Prompt
 */
export async function searchByTextService({ queryText, topK = 10, minThreshold = 0.10, customerId = null }) {
  return vietnameseHybridSearchService.search({
    queryText,
    topK,
    minThreshold,
    customerId,
  });
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
  // Bước 1: Tiền xử lý & Sửa lỗi chính tả queryText (nếu có)
  const spellResult = correctVietnameseQuery(queryText.trim());
  const effectiveQuery = spellResult.correctedQuery;
  const parsed = parseVietnameseQuery(effectiveQuery);

  // Sinh Semantic English Prompt để CLIP hiểu chuẩn xác nhất ngữ nghĩa trang phục tiếng Việt
  const textPrompt = (parsed.englishPrompt && parsed.englishPrompt.length > 2)
    ? parsed.englishPrompt
    : effectiveQuery;

  // Bước 2: Tạo đồng thời Image Embedding và Text Embedding từ CLIP
  const [imageVec, textVec] = await Promise.all([
    createImageEmbedding(imageBuffer),
    createTextEmbedding(textPrompt),
  ]);

  finalVec = createHybridEmbedding(imageVec, textVec, imgWeight, txtWeight);

  // Đảm bảo vector database đã được nạp
  if (!vectorSearchService.isLoaded) {
    vectorSearchService.loadVectors();
  }
  const allVectors = vectorSearchService.vectorsCache;

  // Tính toán hệ số nhân thông minh (Category Tier & Color Filter) cho từng sản phẩm
  const scoredProducts = allVectors.map((item) => {
    const rawSimilarity = cosineSimilarity(finalVec, item.embedding);

    // 1. Hệ số Phân loại Danh mục (Category & Broad Garment Multiplier)
    let categoryMultiplier = 1.0;
    if (parsed.category) {
      const rel = getCategoryRelationship(parsed.category, item.category_name);
      if (rel.type === 'EXACT') {
        categoryMultiplier = 1.0;
      } else if (rel.type === 'RELATED') {
        categoryMultiplier = 0.85;
      } else {
        // UNRELATED hoặc UNKNOWN (phạt nặng xuống 0.35)
        categoryMultiplier = 0.35;
      }
    } else if (parsed.broadCategory) {
      const cat = (item.category_name || '').toLowerCase();
      const name = (item.product_name || '').toLowerCase();

      if (parsed.broadCategory === 'TOPS') {
        const isTop =
          cat.includes('áo') ||
          cat.includes('sweater') ||
          cat.includes('hoodie') ||
          cat.includes('blazer') ||
          cat.includes('jacket') ||
          cat.includes('vest') ||
          cat.includes('polo') ||
          cat.includes('len') ||
          cat.includes('gilet') ||
          cat.includes('thể thao') ||
          name.includes('áo');
        categoryMultiplier = isTop ? 1.0 : 0.35;
      } else if (parsed.broadCategory === 'BOTTOMS') {
        const isBottom =
          cat.includes('quần') ||
          cat.includes('jean') ||
          cat.includes('short') ||
          cat.includes('jogger') ||
          cat.includes('kaki') ||
          cat.includes('chino') ||
          cat.includes('trouser') ||
          name.includes('quần');
        categoryMultiplier = isBottom ? 1.0 : 0.35;
      } else if (parsed.broadCategory === 'DRESSES_SKIRTS') {
        const isDress =
          cat.includes('váy') ||
          cat.includes('đầm') ||
          cat.includes('dạ hội') ||
          name.includes('váy') ||
          name.includes('đầm');
        categoryMultiplier = isDress ? 1.0 : 0.35;
      } else if (parsed.broadCategory === 'HEADWEAR') {
        const isHead = cat.includes('mũ') || cat.includes('nón') || name.includes('mũ') || name.includes('nón');
        categoryMultiplier = isHead ? 1.0 : 0.35;
      } else if (parsed.broadCategory === 'FOOTWEAR') {
        const isFoot =
          cat.includes('giày') ||
          cat.includes('sandal') ||
          cat.includes('dép') ||
          cat.includes('sneaker') ||
          name.includes('giày');
        categoryMultiplier = isFoot ? 1.0 : 0.35;
      } else if (parsed.broadCategory === 'BAGS') {
        const isBag = cat.includes('túi') || cat.includes('balo') || name.includes('túi') || name.includes('balo');
        categoryMultiplier = isBag ? 1.0 : 0.35;
      }
    }

    // 2. Hệ số Màu sắc (Color Multiplier)
    let colorMultiplier = 1.0;
    if (parsed.color) {
      const targetCol = parsed.color.toLowerCase();
      const targetColGroup = (parsed.colorGroup || parsed.color).toLowerCase();
      const hasKnownColors = Array.isArray(item.colors) && item.colors.filter(Boolean).length > 0;
      const prodName = (item.product_name || '').toLowerCase();

      if (hasKnownColors) {
        const hasColor = item.colors.some((c) => {
          const cl = (c || '').toLowerCase();
          return (
            cl === targetCol ||
            cl === targetColGroup ||
            cl.includes(targetColGroup) ||
            cl.includes(targetCol) ||
            targetCol.includes(cl)
          );
        });

        if (hasColor || prodName.includes(targetCol) || prodName.includes(targetColGroup)) {
          colorMultiplier = 1.05; // Khớp màu -> thưởng nhẹ 5%
        } else {
          colorMultiplier = 0.65; // Sai màu yêu cầu -> phạt 35%
        }
      } else if (prodName.includes(targetCol) || prodName.includes(targetColGroup)) {
        colorMultiplier = 1.05;
      }
    }

    // Điểm số tương đồng cuối cùng sau khi tinh chỉnh thông minh
    const finalSimilarity = Number(
      Math.min(1.0, Math.max(0.0, rawSimilarity * categoryMultiplier * colorMultiplier)).toFixed(4)
    );

    return {
      product_id: item.product_id,
      product_name: item.product_name,
      category_name: item.category_name,
      brand_name: item.brand_name,
      price: item.price,
      colors: item.colors,
      image_url: item.image_url,
      similarity: finalSimilarity,
      similarity_percent: `${(finalSimilarity * 100).toFixed(1)}%`,
    };
  });

  const parsedThreshold = parseFloat(minThreshold);
  const clampedThreshold = isNaN(parsedThreshold) ? 0.10 : Math.max(-1.0, Math.min(1.0, parsedThreshold));

  const results = scoredProducts
    .filter((item) => item.similarity >= clampedThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

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
    suggested_query: spellResult.wasCorrected ? spellResult.correctedQuery : null,
    was_corrected: spellResult.wasCorrected,
    spell_confidence: spellResult.wasCorrected ? spellResult.confidence : null,
    search_image_url: searchImageUrl,
    search_type: 'HYBRID',
    weights: { image: imgWeight, text: txtWeight },
    total: results.length,
    products: results,
  };
}

/**
 * 4. Lấy lịch sử tìm kiếm gần nhất của người dùng đã đăng nhập (Deduplicated theo từ khóa)
 */
export async function getUserSearchHistoryService({ customerId, limit = 15 }) {
  if (!customerId) return [];

  try {
    const rawHistories = await prisma.userSearchHistory.findMany({
      where: {
        customer_id: BigInt(customerId),
        search_type: 'TEXT',
        query_text: { not: null },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    const uniqueHistories = [];
    const seenQueries = new Set();

    for (const h of rawHistories) {
      const q = h.query_text?.trim();
      if (q && !seenQueries.has(q.toLowerCase())) {
        seenQueries.add(q.toLowerCase());
        uniqueHistories.push({
          search_id: h.search_id.toString(),
          query_text: q,
          created_at: h.created_at,
        });
        if (uniqueHistories.length >= limit) break;
      }
    }

    return uniqueHistories;
  } catch (err) {
    console.warn('[SearchHistory] Không thể đọc lịch sử tìm kiếm từ DB:', err.message);
    return [];
  }
}

/**
 * 5. Xóa toàn bộ hoặc một từ khóa lịch sử tìm kiếm của người dùng hiện tại
 */
export async function clearUserSearchHistoryService({ customerId, queryText = null }) {
  if (!customerId) return { deleted: 0 };

  try {
    const whereClause = {
      customer_id: BigInt(customerId),
      search_type: 'TEXT',
    };

    if (queryText && typeof queryText === 'string' && queryText.trim().length > 0) {
      whereClause.query_text = queryText.trim();
    }

    const deleteResult = await prisma.userSearchHistory.deleteMany({
      where: whereClause,
    });

    return {
      deleted: true,
      count: deleteResult.count,
    };
  } catch (err) {
    console.warn('[SearchHistory] Không thể xóa lịch sử tìm kiếm từ DB:', err.message);
    return { deleted: false, error: err.message };
  }
}

/**
 * 6. Gợi ý sản phẩm thông minh dựa trên lịch sử tìm kiếm (Dành cho trang Search & Homepage)
 * Hỗ trợ 4 kịch bản:
 * - Không có lịch sử: Trả về catalog trending nổi bật (không bao giờ để trống)
 * - Có lịch sử: Ưu tiên sản phẩm khớp các từ khóa gần đây
 * - Lịch sử ít/kết quả ít: Trả về sản phẩm khớp trước, sau đó bổ sung catalog không lặp lại
 * - Nhiều từ khóa: Phân bổ hợp lý giữa các từ khóa gần đây, không trùng sản phẩm
 */
export async function getPersonalizedRecommendationsService({
  customerId = null,
  clientKeywords = [],
  limit = 8,
}) {
  let targetKeywords = [];

  // Bước 1: Lấy từ khóa gần nhất từ CSDL nếu đã đăng nhập
  if (customerId) {
    try {
      const histories = await prisma.userSearchHistory.findMany({
        where: {
          customer_id: BigInt(customerId),
          search_type: 'TEXT',
          query_text: { not: null },
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      });

      const seen = new Set();
      for (const h of histories) {
        const q = h.query_text?.trim();
        if (q && !seen.has(q.toLowerCase())) {
          seen.add(q.toLowerCase());
          targetKeywords.push(q);
        }
      }
    } catch (dbErr) {
      console.warn('[Recommendations] Không thể đọc lịch sử từ DB:', dbErr.message);
    }
  }

  // Bước 2: Bổ sung từ khóa từ client (localStorage của guest hoặc fallback)
  if (targetKeywords.length === 0 && Array.isArray(clientKeywords) && clientKeywords.length > 0) {
    targetKeywords = clientKeywords
      .map((k) => (typeof k === 'string' ? k.trim() : ''))
      .filter((k) => k.length > 0)
      .slice(0, 5);
  }

  const selectedProducts = [];
  const selectedProductIds = new Set();

  // Đảm bảo vector cache đã sẵn sàng
  if (!vectorSearchService.isLoaded) {
    vectorSearchService.loadVectors();
  }
  const catalog = vectorSearchService.vectorsCache || [];

  // Bước 3: Tìm kiếm sản phẩm liên quan theo từng từ khóa lịch sử
  if (targetKeywords.length > 0) {
    for (const kw of targetKeywords.slice(0, 3)) {
      try {
        const spellResult = correctVietnameseQuery(kw);
        const parsed = parseVietnameseQuery(spellResult.correctedQuery);
        const prompt =
          parsed.englishPrompt && parsed.englishPrompt.length > 2
            ? parsed.englishPrompt
            : spellResult.correctedQuery;

        const queryVec = await createTextEmbedding(prompt);
        const matches = vectorSearchService.searchSimilar(queryVec, 4, 0.12);

        for (const m of matches) {
          if (!selectedProductIds.has(m.product_id) && selectedProducts.length < limit) {
            selectedProductIds.add(m.product_id);
            selectedProducts.push({
              ...m,
              recommendation_reason: `Khớp lịch sử tìm kiếm "${kw}"`,
            });
          }
        }
      } catch (embErr) {
        console.warn(`[Recommendations] Lỗi tạo embedding cho "${kw}":`, embErr.message);
      }

      if (selectedProducts.length >= limit) break;
    }
  }

  // Bước 4: Trường hợp kết quả chưa đủ `limit`, bổ sung sản phẩm từ Catalog (KHÔNG LẶP LẠI)
  if (selectedProducts.length < limit) {
    for (const item of catalog) {
      if (!selectedProductIds.has(item.product_id) && selectedProducts.length < limit) {
        selectedProductIds.add(item.product_id);
        selectedProducts.push({
          product_id: item.product_id,
          product_name: item.product_name,
          category_name: item.category_name,
          brand_name: item.brand_name,
          price: item.price,
          colors: item.colors,
          image_url: item.image_url,
          recommendation_reason:
            selectedProducts.length === 0 ? 'Sản phẩm nổi bật đề xuất' : 'Sản phẩm gợi ý bổ sung',
        });
      }
      if (selectedProducts.length >= limit) break;
    }
  }

  return {
    strategy: targetKeywords.length > 0 ? 'PERSONALIZED_HISTORY' : 'CATALOG_FALLBACK',
    based_on_queries: targetKeywords.slice(0, 3),
    total: selectedProducts.length,
    products: selectedProducts,
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


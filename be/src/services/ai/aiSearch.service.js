import { createTextEmbedding, createImageEmbedding, createHybridEmbedding, cosineSimilarity } from './embedding.service.js';
import { vectorSearchService } from './vectorSearch.service.js';
import { vietnameseHybridSearchService } from './vietnameseHybridSearch.service.js';
import { correctVietnameseQuery } from './vietnameseSpellCorrector.js';
import { parseVietnameseQuery } from './vietnameseQueryParser.js';
import { getCategoryRelationship } from './categoryHierarchy.js';
import { extractDominantColor, classifyGarmentType } from './visualAnalyzer.js';
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
 * Helper kiểm tra sản phẩm có thuộc nhóm ngành hàng lớn (TOPS, BOTTOMS, DRESSES, ...) hay không
 */
function isMatchingBroadCategory(broadCategory, categoryName, productName) {
  if (!broadCategory) return true;
  const cat = (categoryName || '').toLowerCase();
  const name = (productName || '').toLowerCase();

  if (broadCategory === 'TOPS') {
    return (
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
      name.includes('áo')
    );
  }
  if (broadCategory === 'BOTTOMS') {
    return (
      cat.includes('quần') ||
      cat.includes('jean') ||
      cat.includes('short') ||
      cat.includes('jogger') ||
      cat.includes('kaki') ||
      cat.includes('chino') ||
      cat.includes('trouser') ||
      name.includes('quần')
    );
  }
  if (broadCategory === 'DRESSES_SKIRTS') {
    return (
      cat.includes('váy') ||
      cat.includes('đầm') ||
      cat.includes('dạ hội') ||
      name.includes('váy') ||
      name.includes('đầm')
    );
  }
  if (broadCategory === 'HEADWEAR') {
    return cat.includes('mũ') || cat.includes('nón') || name.includes('mũ') || name.includes('nón');
  }
  if (broadCategory === 'FOOTWEAR') {
    return (
      cat.includes('giày') ||
      cat.includes('sandal') ||
      cat.includes('dép') ||
      cat.includes('sneaker') ||
      name.includes('giày')
    );
  }
  if (broadCategory === 'BAGS') {
    return cat.includes('túi') || cat.includes('balo') || name.includes('túi') || name.includes('balo');
  }
  return true;
}

/**
 * Helper tính toán hệ số thưởng/phạt màu sắc
 */
function calculateColorMultiplier(targetColor, itemColors, productName, matchBonus = 1.05, mismatchPenalty = 0.70) {
  if (!targetColor || targetColor === 'Khác') return 1.0;
  const target = targetColor.toLowerCase();
  const hasKnownColors = Array.isArray(itemColors) && itemColors.filter(Boolean).length > 0;
  const prodName = (productName || '').toLowerCase();

  if (hasKnownColors) {
    const hasColor = itemColors.some((c) => {
      const cl = (c || '').toLowerCase();
      return cl === target || cl.includes(target) || target.includes(cl);
    });

    if (hasColor || prodName.includes(target)) {
      return matchBonus; // Thưởng khi khớp màu
    } else {
      return mismatchPenalty; // Phạt khi lệch màu
    }
  } else if (prodName.includes(target)) {
    return matchBonus;
  }
  return 0.90;
}

/**
 * Chuẩn hóa điểm tương đồng thị giác ảnh (Image Cosine Similarity) về thang đo trực quan người dùng
 * Trong không gian CLIP, 2 bức ảnh trang phục khác nhau về bối cảnh nhưng cùng form dáng thường đạt cosine 0.55 - 0.85
 * Hàm này ánh xạ các kết quả khớp cao (>= 0.55) vào dải [0.80, 1.00] để đáp ứng ngưỡng hiển thị >= 80%
 */
export function calibrateVisualSimilarity(raw) {
  if (typeof raw !== 'number' || isNaN(raw) || raw <= 0) return 0;
  if (raw >= 0.55) {
    return Math.min(1.0, 0.80 + 0.20 * Math.min(1.0, (raw - 0.55) / 0.35));
  } else if (raw >= 0.40) {
    return 0.60 + 0.20 * ((raw - 0.40) / 0.15);
  } else {
    return Math.max(0.0, 0.60 * (raw / 0.40));
  }
}

/**
 * 2. Tìm kiếm bằng hình ảnh (Visual Search) kèm Phân tích Thị giác & Tái xếp hạng
 */
export async function searchByImageService({ imageBuffer, topK = 10, minThreshold = 0.80, customerId = null }) {
  if (!imageBuffer) {
    const error = new Error('Vui lòng tải lên file hình ảnh cần tìm');
    error.statusCode = 400;
    throw error;
  }

  // 1. Tạo Image Embedding từ Buffer ảnh và song song trích xuất màu sắc chủ đạo
  const [imageVec, visualColor] = await Promise.all([
    createImageEmbedding(imageBuffer),
    extractDominantColor(imageBuffer),
  ]);

  // Phân loại Zero-shot ngành hàng thời trang từ vector ảnh bằng CLIP
  const visualGarment = await classifyGarmentType(imageVec);
  const detectedBroadCategory = visualGarment?.broadCategory || null;
  const detectedColor = visualColor?.colorGroup && visualColor.colorGroup !== 'Khác' ? visualColor.colorGroup : null;

  if (!vectorSearchService.isLoaded) {
    vectorSearchService.loadVectors();
  }
  const allVectors = vectorSearchService.vectorsCache;

  // Tái xếp hạng thông minh dựa trên phân tích hình ảnh
  const scoredProducts = allVectors.map((item) => {
    const rawSimilarity = cosineSimilarity(imageVec, item.embedding);
    const visualSim = calibrateVisualSimilarity(rawSimilarity);

    // Hệ số ngành hàng: Phạt nặng nếu khác nhóm trang phục lớn (ví dụ: ảnh áo nhưng kết quả là mũ/giày)
    let categoryMultiplier = 1.0;
    if (detectedBroadCategory) {
      const isMatch = isMatchingBroadCategory(detectedBroadCategory, item.category_name, item.product_name);
      categoryMultiplier = isMatch ? 1.0 : 0.20;
    }

    // Hệ số màu sắc thị giác
    let colorMultiplier = 1.0;
    if (detectedColor) {
      colorMultiplier = calculateColorMultiplier(detectedColor, item.colors, item.product_name, 1.05, 0.70);
    }

    const finalSimilarity = Number(
      Math.min(1.0, Math.max(0.0, visualSim * categoryMultiplier * colorMultiplier)).toFixed(4)
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
  const clampedThreshold = isNaN(parsedThreshold) ? 0.80 : Math.max(0.80, parsedThreshold);

  const results = scoredProducts
    .filter((item) => item.similarity >= clampedThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, parseInt(topK, 10) || 10);

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
    detected_category: detectedBroadCategory,
    detected_color: detectedColor,
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
  minThreshold = 0.80,
  customerId = null,
  imgWeight = 0.7,
  txtWeight = 0.3,
}) {
  if (!imageBuffer && !queryText) {
    const error = new Error('Vui lòng cung cấp ít nhất hình ảnh hoặc câu mô tả văn bản');
    error.statusCode = 400;
    throw error;
  }

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

  // Bước 2: Tạo đồng thời Image Embedding, Text Embedding và phân tích thị giác
  const [imageVec, textVec, visualColor] = await Promise.all([
    createImageEmbedding(imageBuffer),
    createTextEmbedding(textPrompt),
    extractDominantColor(imageBuffer),
  ]);

  const visualGarment = await classifyGarmentType(imageVec);

  // Xác định ngành hàng và màu sắc ưu tiên (kết hợp cả Text lẫn Thị giác)
  const effectiveCategory = parsed.category || null;
  const effectiveBroadCategory = parsed.broadCategory || visualGarment?.broadCategory || null;
  const effectiveColor = parsed.color || (visualColor?.colorGroup !== 'Khác' ? visualColor?.colorGroup : null);

  // Đảm bảo vector database đã được nạp
  if (!vectorSearchService.isLoaded) {
    vectorSearchService.loadVectors();
  }
  const allVectors = vectorSearchService.vectorsCache;

  // Kiểm tra xem catalog có danh mục chính xác hay không
  let catalogHasExactCategory = false;
  if (effectiveCategory) {
    for (const item of allVectors) {
      const rel = getCategoryRelationship(effectiveCategory, item.category_name);
      if (rel.type === 'EXACT') {
        catalogHasExactCategory = true;
        break;
      }
    }
  }

  const qLower = (effectiveQuery || '').toLowerCase();

  // Tính toán điểm số đa phương thức cho từng sản phẩm
  const scoredProducts = allVectors.map((item) => {
    const pNameLower = (item.product_name || '').toLowerCase();
    const pCatLower = (item.category_name || '').toLowerCase();

    // 1. Kiểm tra loại trừ độc quyền danh mục trang phục
    // Ví dụ: tìm "áo sơ mi" thì chỉ hiện áo sơ mi, loại bỏ polo, thun, áo khoác...
    let isGarmentExcluded = false;
    if (qLower.includes('sơ mi') || qLower.includes('so mi')) {
      const isSomi = pNameLower.includes('sơ mi') || pCatLower.includes('sơ mi') || pNameLower.includes('shirt') || pNameLower.includes('oxford');
      if (!isSomi || pNameLower.includes('polo') || pNameLower.includes('áo thun') || pNameLower.includes('ao thun')) {
        isGarmentExcluded = true;
      }
    } else if (qLower.includes('polo')) {
      const isPolo = pNameLower.includes('polo') || pCatLower.includes('polo');
      if (!isPolo || pNameLower.includes('sơ mi') || pNameLower.includes('so mi')) {
        isGarmentExcluded = true;
      }
    } else if (qLower.includes('thun') || qLower.includes('áo phông') || qLower.includes('ao phong')) {
      const isThun = pNameLower.includes('thun') || pNameLower.includes('phông') || pCatLower.includes('thun');
      if (!isThun || pNameLower.includes('sơ mi') || pNameLower.includes('polo')) {
        isGarmentExcluded = true;
      }
    }

    if (isGarmentExcluded) {
      return {
        product_id: item.product_id,
        product_name: item.product_name,
        category_name: item.category_name,
        brand_name: item.brand_name,
        price: item.price,
        colors: item.colors,
        image_url: item.image_url,
        similarity: 0.0,
        similarity_percent: '0.0%',
      };
    }

    // 2. Hệ số Phân loại Danh mục (Category & Broad Garment Multiplier)
    let categoryMultiplier = 1.0;
    if (effectiveCategory) {
      const rel = getCategoryRelationship(effectiveCategory, item.category_name);
      if (catalogHasExactCategory) {
        if (rel.type === 'EXACT') {
          categoryMultiplier = 1.0;
        } else {
          // Khi query đã nêu rõ danh mục và catalog có danh mục đó,
          // cấm hoàn toàn các danh mục khác (như polo, thun khi tìm sơ mi)
          categoryMultiplier = 0.0;
        }
      } else {
        categoryMultiplier = rel.type === 'RELATED' ? 0.80 : 0.0;
      }
    } else if (effectiveBroadCategory) {
      const isMatch = isMatchingBroadCategory(effectiveBroadCategory, item.category_name, item.product_name);
      categoryMultiplier = isMatch ? 1.0 : 0.20;
    }

    if (categoryMultiplier === 0) {
      return {
        product_id: item.product_id,
        product_name: item.product_name,
        category_name: item.category_name,
        brand_name: item.brand_name,
        price: item.price,
        colors: item.colors,
        image_url: item.image_url,
        similarity: 0.0,
        similarity_percent: '0.0%',
      };
    }

    // 3. Tính điểm Thị giác (Image Score) từ visual embedding
    const rawImgSim = cosineSimilarity(imageVec, item.embedding);
    const normImgSim = calibrateVisualSimilarity(rawImgSim);

    // 4. Tính điểm Văn bản (Text Score) từ query parser & CLIP text
    const sAttr = vietnameseHybridSearchService.calculateAttributeScore(item, parsed);
    const sKw = vietnameseHybridSearchService.calculateKeywordScore(item, parsed);
    const rawTxtSim = cosineSimilarity(textVec, item.embedding);
    const sClip = vietnameseHybridSearchService.normalizeClipScore(rawTxtSim);
    const textQuality = (0.45 * sAttr) + (0.35 * sKw) + (0.20 * sClip);
    const normTxtSim = Math.min(1.0, 0.80 + 0.20 * textQuality);

    // 5. Kết hợp Đa phương thức (Multimodal Fusion)
    const totalW = (parseFloat(imgWeight) || 0.7) + (parseFloat(txtWeight) || 0.3);
    const wI = (parseFloat(imgWeight) || 0.7) / totalW;
    const wT = (parseFloat(txtWeight) || 0.3) / totalW;
    const combinedSim = wI * normImgSim + wT * normTxtSim;

    // 6. Hệ số Màu sắc
    let colorMultiplier = 1.0;
    if (effectiveColor) {
      colorMultiplier = calculateColorMultiplier(effectiveColor, item.colors, item.product_name, 1.05, 0.70);
    }

    // Điểm số tương đồng cuối cùng sau khi tinh chỉnh
    const finalSimilarity = Number(
      Math.min(1.0, Math.max(0.0, combinedSim * categoryMultiplier * colorMultiplier)).toFixed(4)
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
  const clampedThreshold = isNaN(parsedThreshold) ? 0.80 : Math.max(0.80, parsedThreshold);

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


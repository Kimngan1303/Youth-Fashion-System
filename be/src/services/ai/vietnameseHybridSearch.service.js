import { parseVietnameseQuery, normalizeVietnameseText, removeVietnameseTones } from './vietnameseQueryParser.js';
import { createTextEmbedding, cosineSimilarity } from './embedding.service.js';
import { vectorSearchService } from './vectorSearch.service.js';
import { prisma } from '../../repositories/prisma.js';
import { getCategoryRelationship } from './categoryHierarchy.js';
import { correctVietnameseQuery } from './vietnameseSpellCorrector.js';

/**
 * Vietnamese Hybrid Text Search Service
 * Tích hợp 3 nguồn truy xuất:
 * 1. Attribute Matching Engine (Category, Color, Gender, Fit, Material, Style)
 * 2. Keyword Search Engine (Exact phrase, token overlap, synonyms match)
 * 3. CLIP Semantic Search Engine (Prompt tiếng Anh chuẩn hóa qua CLIP Text Encoder 512D)
 * 4. Adaptive Ranking Engine (Tổng hợp điểm đa chiều chuẩn hóa)
 */

class VietnameseHybridSearchService {
  constructor() {
    this.descriptionsMap = new Map();
    this.isDescriptionsLoaded = false;
    this.lastLoadedAt = 0;
    this.cacheTtlMs = 10 * 60 * 1000; // TTL 10 phút
    this.loadPromise = null; // Deduplication chống Thundering Herd
    this.textEmbeddingFn = createTextEmbedding; // Injectable CLIP Text Embedding function
  }

  /**
   * Xóa cache mô tả sản phẩm để buộc nạp lại từ DB ở lần gọi tiếp theo
   */
  invalidateDescriptionsCache() {
    this.lastLoadedAt = 0;
    this.isDescriptionsLoaded = false;
    this.descriptionsMap.clear();
  }

  /**
   * Nạp trước mô tả sản phẩm từ MySQL vào RAM để tăng tốc độ so khớp từ khóa
   * Tích hợp TTL 10 phút, in-flight deduplication và fault-tolerant fallback
   */
  async loadDescriptions() {
    const now = Date.now();
    const isCacheFresh = this.isDescriptionsLoaded &&
      (now - this.lastLoadedAt < this.cacheTtlMs) &&
      this.descriptionsMap.size > 0;

    if (isCacheFresh) {
      return this.descriptionsMap;
    }

    // Deduplication: nếu đang có 1 promise nạp DB đang chạy, tái sử dụng nó
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        const products = await prisma.product.findMany({
          where: { status: 'ACTIVE' },
          select: { product_id: true, description: true },
        });

        const freshMap = new Map();
        for (const p of products) {
          freshMap.set(String(p.product_id), p.description || '');
        }
        this.descriptionsMap = freshMap;
        this.isDescriptionsLoaded = true;
        this.lastLoadedAt = Date.now();
      } catch (err) {
        console.warn('[HybridSearch] Không thể nạp mô tả từ DB (dùng metadata dự phòng):', err.message);
        // Fault-tolerance: Giữ lại cache cũ nếu có, không làm crash Text Search
        if (this.descriptionsMap.size > 0) {
          console.warn(`[HybridSearch] Giữ lại cache cũ (${this.descriptionsMap.size} sản phẩm) do DB reload lỗi.`);
        }
      } finally {
        this.loadPromise = null;
      }

      return this.descriptionsMap;
    })();

    return this.loadPromise;
  }

  /**
   * 1. ATTRIBUTE MATCHING ENGINE
   * Đánh giá mức độ khớp giữa các thuộc tính được trích xuất từ truy vấn và metadata sản phẩm
   * @param {object} product - Bản ghi sản phẩm trong catalog
   * @param {object} parsed - Kết quả bóc tách từ vietnameseQueryParser
   * @returns {number} Điểm thuộc tính trong khoảng [0.0, 1.0]
   */
  calculateAttributeScore(product, parsed) {
    let activeWeights = 0;
    let earnedScore = 0;

    const prodCategory = (product.category_name || '').toLowerCase();
    const prodColors = (product.colors || []).map((c) => (c || '').toLowerCase());
    const prodText = `${product.product_name} ${product.description || ''}`.toLowerCase();
    const prodTextRaw = removeVietnameseTones(prodText);

    // 1.1. Category Matching (Trọng số 0.45 nếu có, tích hợp Category Family Hierarchy)
    if (parsed.category) {
      activeWeights += 0.45;
      const rel = getCategoryRelationship(parsed.category, product.category_name);
      if (rel.type === 'EXACT') {
        earnedScore += 0.45 * 1.0; // Khớp chính xác danh mục
      } else if (rel.type === 'RELATED') {
        earnedScore += 0.45 * rel.weight; // Khớp cùng họ danh mục liên quan (nhận 70% điểm thuộc tính)
      } else {
        earnedScore += 0.0; // Không thuộc cùng họ danh mục
      }
    }

    // 1.2. Color Matching (Trọng số 0.30 nếu có và sản phẩm có metadata màu xác định)
    const hasKnownColors = Array.isArray(product.colors) && product.colors.filter(Boolean).length > 0;
    if (parsed.color && hasKnownColors) {
      activeWeights += 0.30;
      const targetCol = parsed.color.toLowerCase();
      const targetColGroup = (parsed.colorGroup || parsed.color).toLowerCase();

      let colorMatched = false;
      let partialMatched = false;

      for (const col of prodColors) {
        const colLower = col.toLowerCase();
        if (colLower === targetCol) {
          colorMatched = true;
          break;
        } else if (colLower === targetColGroup || colLower.includes(targetColGroup)) {
          partialMatched = true;
        }
      }

      if (colorMatched) {
        earnedScore += 0.30 * 1.0;
      } else if (partialMatched) {
        earnedScore += 0.30 * 0.80; // Khớp nhóm màu chung (VD: Xanh navy khớp Xanh)
      } else {
        earnedScore += 0.0;
      }
    }

    // 1.3. Gender Matching (Trọng số 0.15 nếu có)
    if (parsed.gender) {
      activeWeights += 0.15;
      const targetGen = parsed.gender.toLowerCase();

      if (targetGen === 'nam') {
        const isExplicitMale = prodText.includes('nam') || prodCategory.includes('nam');
        const isExplicitFemale = prodCategory.includes('váy') || prodCategory.includes('đầm') || prodText.includes('nữ');
        if (isExplicitMale) {
          earnedScore += 0.15 * 1.0;
        } else if (isExplicitFemale) {
          earnedScore += 0.0;
        } else {
          earnedScore += 0.15 * 0.70; // Đồ unisex / trung tính
        }
      } else if (targetGen === 'nữ') {
        const isExplicitFemale = prodCategory.includes('váy') || prodCategory.includes('đầm') || prodText.includes('nữ');
        const isExplicitMale = prodText.includes('nam') && !prodText.includes('unisex');
        if (isExplicitFemale) {
          earnedScore += 0.15 * 1.0;
        } else if (isExplicitMale) {
          earnedScore += 0.0;
        } else {
          earnedScore += 0.15 * 0.70;
        }
      } else if (targetGen === 'unisex') {
        if (prodText.includes('unisex')) {
          earnedScore += 0.15 * 1.0;
        } else {
          earnedScore += 0.15 * 0.50;
        }
      }
    }

    // 1.4. Fit Matching (Trọng số 0.10 nếu có)
    if (parsed.fit) {
      activeWeights += 0.10;
      const targetFit = parsed.fit.toLowerCase();
      const targetFitRaw = removeVietnameseTones(targetFit);

      if (prodText.includes(targetFit) || prodTextRaw.includes(targetFitRaw)) {
        earnedScore += 0.10 * 1.0;
      } else if (targetFit === 'oversize' && (prodText.includes('rộng') || prodTextRaw.includes('rong'))) {
        earnedScore += 0.10 * 0.85;
      } else {
        earnedScore += 0.0;
      }
    }

    // 1.5. Material Matching (Trọng số 0.10 nếu có)
    if (parsed.material) {
      activeWeights += 0.10;
      const targetMat = parsed.material.toLowerCase();
      const targetMatRaw = removeVietnameseTones(targetMat);

      if (prodText.includes(targetMat) || prodTextRaw.includes(targetMatRaw)) {
        earnedScore += 0.10 * 1.0;
      } else {
        earnedScore += 0.0;
      }
    }

    // 1.6. Style Matching (Trọng số 0.10 nếu có)
    if (parsed.style) {
      activeWeights += 0.10;
      const targetSty = parsed.style.toLowerCase();
      const targetStyRaw = removeVietnameseTones(targetSty);

      if (
        prodText.includes(targetSty) ||
        prodTextRaw.includes(targetStyRaw) ||
        prodCategory.includes(targetSty)
      ) {
        earnedScore += 0.10 * 1.0;
      } else if (
        (targetSty === 'dự tiệc' && prodCategory.includes('dạ hội')) ||
        (targetSty === 'thể thao' && (prodCategory.includes('thể thao') || prodCategory.includes('jogger'))) ||
        (targetSty === 'mùa đông' && (prodCategory.includes('đông') || prodCategory.includes('khoác') || prodCategory.includes('len')))
      ) {
        earnedScore += 0.10 * 0.90;
      } else {
        earnedScore += 0.0;
      }
    }

    // Nếu không có bất kỳ thuộc tính nào được yêu cầu trong query -> điểm trung tính
    if (activeWeights === 0) {
      return 0.50;
    }

    return Math.min(1.0, earnedScore / activeWeights);
  }

  /**
   * 2. KEYWORD SEARCH ENGINE
   * Đánh giá độ trùng khớp từ khóa có dấu và không dấu, từ đồng nghĩa và cụm từ
   * @param {object} product - Bản ghi sản phẩm
   * @param {object} parsed - Kết quả bóc tách từ vietnameseQueryParser
   * @returns {number} Điểm từ khóa trong khoảng [0.0, 1.0]
   */
  calculateKeywordScore(product, parsed) {
    const rawName = (product.product_name || '').toLowerCase();
    const rawCategory = (product.category_name || '').toLowerCase();
    const rawDesc = (product.description || '').toLowerCase();
    const rawBrand = (product.brand_name || '').toLowerCase();

    const nameNorm = normalizeVietnameseText(rawName);
    const catNorm = normalizeVietnameseText(rawCategory);
    const descNorm = normalizeVietnameseText(rawDesc);

    const nameRaw = removeVietnameseTones(nameNorm);
    const catRaw = removeVietnameseTones(catNorm);
    const descRaw = removeVietnameseTones(descNorm);

    const qNorm = parsed.normalizedQuery;
    const qRaw = removeVietnameseTones(qNorm);

    let score = 0;

    // 2.1. Exact Full Phrase Match (Trùng khớp nguyên cụm trong Tên sản phẩm)
    if (nameNorm.includes(qNorm) || (qRaw.length > 3 && nameRaw.includes(qRaw))) {
      return 1.0;
    }

    // 2.2. Synonyms Phrase Match (Khớp các từ khóa đồng nghĩa trong Tên sản phẩm)
    if (parsed.synonyms && parsed.synonyms.length > 0) {
      for (const syn of parsed.synonyms) {
        const synNorm = normalizeVietnameseText(syn);
        const synRaw = removeVietnameseTones(synNorm);
        if (nameNorm.includes(synNorm) || nameRaw.includes(synRaw)) {
          score = Math.max(score, 0.90);
          break;
        }
      }
    }

    // 2.3. Remaining Terms Match (Các từ khóa chi tiết như "kẻ sọc", "pinstripe", "oxford")
    if (parsed.remainingTerms && parsed.remainingTerms.length > 0) {
      let matchedTerms = 0;
      for (const term of parsed.remainingTerms) {
        const termNorm = normalizeVietnameseText(term);
        const termRaw = removeVietnameseTones(termNorm);
        if (
          nameNorm.includes(termNorm) ||
          nameRaw.includes(termRaw) ||
          descNorm.includes(termNorm) ||
          descRaw.includes(termRaw)
        ) {
          matchedTerms++;
        }
      }
      const termRatio = matchedTerms / parsed.remainingTerms.length;
      score = Math.max(score, 0.40 + 0.50 * termRatio);
    }

    // 2.4. Word Token Overlap Match (Tỷ lệ từ đơn xuất hiện trong Tên và Mô tả)
    const queryTokens = qNorm.split(' ').filter((w) => w.length > 1);
    if (queryTokens.length > 0) {
      let matchedCount = 0;
      for (const token of queryTokens) {
        const tokenRaw = removeVietnameseTones(token);
        if (nameNorm.includes(token) || nameRaw.includes(tokenRaw)) {
          matchedCount += 2; // Tên sản phẩm có trọng số gấp đôi
        } else if (catNorm.includes(token) || catRaw.includes(tokenRaw)) {
          matchedCount += 1.5;
        } else if (descNorm.includes(token) || descRaw.includes(tokenRaw)) {
          matchedCount += 1;
        }
      }
      const maxPossible = queryTokens.length * 2;
      const tokenScore = Math.min(1.0, matchedCount / maxPossible);
      score = Math.max(score, tokenScore * 0.80);
    }

    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * 3. CLIP SEMANTIC SEARCH ENGINE
   * Chuẩn hóa điểm Cosine Similarity của CLIP về dải [0.0, 1.0]
   * @param {number} rawSimilarity - Điểm tương đồng Cosine [-1.0, 1.0]
   * @returns {number} Điểm ngữ nghĩa chuẩn hóa [0.0, 1.0]
   */
  normalizeClipScore(rawSimilarity) {
    if (typeof rawSimilarity !== 'number' || isNaN(rawSimilarity)) return 0;
    // Dải điểm Cosine thực tế của CLIP giữa văn bản tiếng Anh và ảnh thường nằm trong [0.15, 0.35]
    const minSim = 0.15;
    const maxSim = 0.35;
    const clamped = Math.max(minSim, Math.min(maxSim, rawSimilarity));
    return (clamped - minSim) / (maxSim - minSim);
  }

  /**
   * 4. MAIN HYBRID SEARCH PIPELINE
   * Thực thi tìm kiếm đa nguồn và xếp hạng thông minh
   */
  async search({ queryText, topK = 10, minThreshold = 0.80, customerId = null }) {
    if (!queryText || typeof queryText !== 'string' || queryText.trim() === '') {
      const error = new Error('Vui lòng nhập từ khóa hoặc câu mô tả sản phẩm cần tìm');
      error.statusCode = 400;
      throw error;
    }

    const rawQuery = queryText.trim();

    // Bước 1: Tiền xử lý & Sửa lỗi chính tả tiếng Việt (Spell Correction & Normalization)
    const spellResult = correctVietnameseQuery(rawQuery);
    const effectiveQuery = spellResult.correctedQuery;

    // Bước 2: Phân tích truy vấn bằng Vietnamese Query Parser
    const parsed = parseVietnameseQuery(effectiveQuery);

    // Bước 3: Nạp dữ liệu sản phẩm và mô tả
    if (!vectorSearchService.isLoaded) {
      vectorSearchService.loadVectors();
    }
    const vectors = vectorSearchService.vectorsCache;
    if (!vectors || vectors.length === 0) {
      return {
        query: rawQuery,
        suggested_query: spellResult.wasCorrected ? spellResult.correctedQuery : null,
        was_corrected: spellResult.wasCorrected,
        spell_confidence: spellResult.wasCorrected ? spellResult.confidence : null,
        search_type: 'TEXT',
        total: 0,
        products: [],
      };
    }

    await this.loadDescriptions();

    // Bước 3: Sinh CLIP Vector từ Semantic English Prompt (nếu có)
    let clipSimMap = new Map();
    let isClipAvailable = false;

    if (parsed.englishPrompt && parsed.englishPrompt.length > 2) {
      try {
        const queryVec = await this.textEmbeddingFn(parsed.englishPrompt);
        if (queryVec && queryVec.length === 512) {
          isClipAvailable = true;
          for (const item of vectors) {
            const sim = cosineSimilarity(queryVec, item.embedding);
            clipSimMap.set(item.product_id, sim);
          }
        }
      } catch (clipErr) {
        console.warn('[HybridSearch] CLIP Prompt Embedding thất bại (tự động fallback sang Keyword + Attribute):', clipErr.message);
        isClipAvailable = false;
      }
    }

    // Bước 4: Kiểm tra xem Catalog có sản phẩm thuộc danh mục chính xác (EXACT) hoặc liên quan (RELATED) không
    let catalogHasExactCategory = false;
    let catalogHasRelatedCategory = false;

    if (parsed.category) {
      for (const item of vectors) {
        const rel = getCategoryRelationship(parsed.category, item.category_name);
        if (rel.type === 'EXACT') {
          catalogHasExactCategory = true;
        } else if (rel.type === 'RELATED') {
          catalogHasRelatedCategory = true;
        }
        if (catalogHasExactCategory && catalogHasRelatedCategory) break;
      }
    }

    // Bước 5: Tính điểm tổng hợp cho từng sản phẩm
    const scoredProducts = vectors.map((item) => {
      const description = this.descriptionsMap.get(item.product_id) || '';
      const prodItem = { ...item, description };

      // Nguồn 1: Attribute Score
      const sAttr = this.calculateAttributeScore(prodItem, parsed);

      // Nguồn 2: Keyword Score
      const sKw = this.calculateKeywordScore(prodItem, parsed);

      // Nguồn 3: CLIP Score
      const rawClipSim = clipSimMap.get(item.product_id) || 0;
      const sClip = isClipAvailable ? this.normalizeClipScore(rawClipSim) : 0.50;

      // Bước 5.1: Phân bổ trọng số động theo loại truy vấn (Adaptive Weights)
      let wAttr, wKw, wClip;

      if (parsed.category) {
        // Truy vấn xác định rõ danh mục
        wAttr = 0.45;
        wKw = 0.35;
        wClip = isClipAvailable ? 0.20 : 0.0;
      } else if (parsed.style) {
        // Truy vấn định hướng phong cách / hoàn cảnh
        wAttr = 0.35;
        wKw = 0.35;
        wClip = isClipAvailable ? 0.30 : 0.0;
      } else {
        // Truy vấn từ khóa tự do
        wAttr = 0.20;
        wKw = isClipAvailable ? 0.55 : 0.80;
        wClip = isClipAvailable ? 0.25 : 0.0;
      }

      // Chuẩn hóa tổng trọng số về 1.0
      const totalW = wAttr + wKw + wClip;
      wAttr /= totalW;
      wKw /= totalW;
      wClip /= totalW;

      const combinedScoreRaw = (wAttr * sAttr) + (wKw * sKw) + (wClip * sClip);

      // Bước 5.2: Phạt màu sắc nếu người dùng có yêu cầu màu cụ thể (Intra-item Color Factor)
      // MATCH (1.0x), UNKNOWN (1.0x trung tính - không phạt), MISMATCH (0.65x)
      // MULTI-COLOR: Nếu có bất kỳ màu nào khớp -> 1.0x (không phạt)
      let colorFactor = 1.0;
      if (parsed.color) {
        const hasKnownColors = Array.isArray(item.colors) && item.colors.filter(Boolean).length > 0;
        if (hasKnownColors) {
          const targetCol = parsed.color.toLowerCase();
          const targetColGroup = (parsed.colorGroup || parsed.color).toLowerCase();
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
          if (!hasColor) {
            colorFactor = 0.65; // Giảm 35% điểm nếu xác nhận khác màu yêu cầu (MISMATCH)
          }
        }
        // Nếu !hasKnownColors (UNKNOWN): Giữ nguyên colorFactor = 1.0
      }

      // Điểm chất lượng so khớp nội bộ trong nhóm [0.0, 1.0]
      const matchQuality = Math.min(1.0, Math.max(0.0, combinedScoreRaw * colorFactor));

      // Bước 5.3: Thứ tự ưu tiên Danh mục (Category Priority Tier Ranking)
      // Thiết kế phân dải điểm tất định bảo đảm toán học:
      // - Khi có Exact trong catalog: Mọi sản phẩm EXACT > Mọi sản phẩm RELATED > Mọi sản phẩm UNRELATED
      // - Khi không có Exact nhưng có Related: Mọi sản phẩm RELATED > Mọi sản phẩm UNRELATED
      // - Khi không có cả Exact lẫn Related: Áp dụng fallback có kiểm soát
      // Trong mỗi nhóm, thứ hạng được quyết định bởi Attribute + Keyword + CLIP + Color.
      // Tuyệt đối không giả định cận dưới giả tạo; Color Mismatch và CLIP fallback không thể phá vỡ thứ tự.
      let finalScore = 0;

      // Kiểm tra loại trừ phân nhóm trang phục cụ thể nếu người dùng tìm kiếm từ khóa mang tính độc quyền danh mục
      // Ví dụ: tìm "áo sơ mi" thì chỉ hiện áo sơ mi, nghiêm cấm "áo polo", "áo thun", "áo khoác"...
      const qLower = (rawQuery || '').toLowerCase();
      const pNameLower = (item.product_name || '').toLowerCase();
      const pCatLower = (item.category_name || '').toLowerCase();

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
        finalScore = 0.0;
      } else if (parsed.category) {
        const rel = getCategoryRelationship(parsed.category, item.category_name);

        if (catalogHasExactCategory) {
          // Ưu tiên cao nhất: EXACT. Khi catalog có danh mục chính xác, nghiêm cấm trả về danh mục khác
          if (rel.type === 'EXACT') {
            // Tier 1 (EXACT): Dải điểm [0.8000, 1.0000] - Đảm bảo tỷ lệ khớp trên 80%
            finalScore = 0.80 + 0.20 * matchQuality;
          } else {
            // Loại bỏ hoàn toàn các sản phẩm thuộc danh mục khác (như Áo Polo, Áo thun khi tìm Áo sơ mi)
            finalScore = 0.0;
          }
        } else if (catalogHasRelatedCategory) {
          if (rel.type === 'RELATED') {
            finalScore = 0.80 * matchQuality;
          } else {
            finalScore = 0.0;
          }
        } else {
          // Fallback có kiểm soát
          finalScore = 0.50 * matchQuality;
        }
      } else {
        // Truy vấn không xác định danh mục cụ thể (tìm theo màu sắc, phong cách...)
        finalScore = matchQuality;
      }

      const finalSimilarity = Number(Math.min(1.0, Math.max(0.0, finalScore)).toFixed(4));

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
        _debug: {
          sAttr: Number(sAttr.toFixed(3)),
          sKw: Number(sKw.toFixed(3)),
          sClip: Number(sClip.toFixed(3)),
          wAttr: Number(wAttr.toFixed(3)),
          wKw: Number(wKw.toFixed(3)),
          wClip: Number(wClip.toFixed(3)),
          colorFactor,
          matchQuality: Number(matchQuality.toFixed(4)),
        },
      };
    });

    // Bước 6: Giới hạn và chuẩn hóa tham số topK, minThreshold (tối thiểu 0.80)
    const parsedTopK = parseInt(topK, 10);
    const clampedTopK = isNaN(parsedTopK) ? 10 : Math.max(1, Math.min(50, parsedTopK));

    const parsedThreshold = parseFloat(minThreshold);
    const clampedThreshold = isNaN(parsedThreshold) ? 0.80 : Math.max(0.80, parsedThreshold);

    // Bước 7: Lọc và Sắp xếp giảm dần (Chỉ giữ lại các kết quả có tỷ lệ khớp >= 80%)
    const filteredResults = scoredProducts
      .filter((p) => p.similarity >= clampedThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, clampedTopK);

    // Bước 8: Lưu lịch sử tìm kiếm vào MySQL (Deduplicated theo customer_id & query_text)
    if (customerId && rawQuery && rawQuery.trim().length > 0) {
      try {
        const cleanQuery = rawQuery.trim();
        const existing = await prisma.userSearchHistory.findFirst({
          where: {
            customer_id: BigInt(customerId),
            search_type: 'TEXT',
            query_text: cleanQuery,
          },
        });

        if (existing) {
          await prisma.userSearchHistory.update({
            where: { search_id: existing.search_id },
            data: {
              created_at: new Date(),
              results_count: filteredResults.length,
            },
          });
        } else {
          await prisma.userSearchHistory.create({
            data: {
              customer_id: BigInt(customerId),
              search_type: 'TEXT',
              query_text: cleanQuery,
              results_count: filteredResults.length,
            },
          });
        }
      } catch (logErr) {
        console.warn('[HybridSearch Log] Không thể ghi lịch sử tìm kiếm:', logErr.message);
      }
    }

    // Loại bỏ trường _debug trước khi trả về để đảm bảo API contract nguyên vẹn 100%
    const finalProducts = filteredResults.map(({ _debug, ...rest }) => rest);

    return {
      query: rawQuery,
      suggested_query: spellResult.wasCorrected ? spellResult.correctedQuery : null,
      was_corrected: spellResult.wasCorrected,
      spell_confidence: spellResult.wasCorrected ? spellResult.confidence : null,
      search_type: 'TEXT',
      total: finalProducts.length,
      products: finalProducts,
    };
  }
}

export const vietnameseHybridSearchService = new VietnameseHybridSearchService();
export default vietnameseHybridSearchService;


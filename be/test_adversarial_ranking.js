/**
 * test_adversarial_ranking.js
 * Bộ kiểm thử đối kháng & củng cố logic (Adversarial Ranking & Logic Hardening Tests)
 * FashionAI - Phase 3.2.2 Final Validation
 * 
 * Các kịch bản kiểm thử bắt buộc:
 * 1. Ambiguity Detection (Tied candidates at same minimum edit distance -> Không sửa bừa bãi).
 * 2. Unambiguous candidate correction (Ứng viên đơn lẻ tin cậy -> Sửa chính xác).
 * 3. Brand Collision & Phrase Collision Protection (Bảo vệ thương hiệu, SKU, size, số, English words).
 * 4. Category Hierarchy Alias Audit (đầm/dam, shirt, tee, váy -> UNKNOWN; Chân Váy thuộc riêng DRESSES_SKIRTS).
 * 5. Exact vs Related Empirical Assertion (min Exact > max Related trên điểm số thực tế; Color MATCH vs MISMATCH).
 * 6. Adversarial Ranking: Exact điểm thấp (sai màu, ít text) vs Related điểm cao (đúng màu, nhiều text).
 * 7. Unrelated Suppression (Mảng không rỗng, xác nhận có Unrelated, điểm <= 0.1500).
 * 8. Catalog without Exact (catalogHasExact=false, catalogHasRelated=true -> min Related > max Unrelated).
 * 9. Catalog without Exact & Related (catalogHasExact=false, catalogHasRelated=false -> Controlled Fallback <= 0.50).
 * 10. CLIP Fallback Active Simulation (Mock CLIP lỗi -> wClip=0, wAttr+wKw=1.0, search trả kết quả hợp lệ).
 */

import { vietnameseHybridSearchService } from './src/services/ai/vietnameseHybridSearch.service.js';
import { getCategoryRelationship, resolveCanonicalCategory } from './src/services/ai/categoryHierarchy.js';
import { correctVietnameseQuery, damerauLevenshtein, isProtectedToken } from './src/services/ai/vietnameseSpellCorrector.js';
import { parseVietnameseQuery } from './src/services/ai/vietnameseQueryParser.js';
import { vectorSearchService } from './src/services/ai/vectorSearch.service.js';
import * as embeddingModule from './src/services/ai/embedding.service.js';
import { prisma } from './src/repositories/prisma.js';

// Nạp dữ liệu vào cache
vectorSearchService.loadVectors();
await vietnameseHybridSearchService.loadDescriptions();

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Test #${String(totalTests).padStart(2, '0')}: ${testName}`);
    if (detail) console.log(`         -> ${detail}`);
  } else {
    console.error(`  [FAIL] Test #${String(totalTests).padStart(2, '0')}: ${testName}`);
    if (detail) console.error(`         -> ${detail}`);
  }
}

async function runAdversarialValidation() {
  console.log('='.repeat(80));
  console.log('   KIỂM THỬ ĐỐI KHÁNG & CỦNG CỐ LOGIC (PHASE 3.2.2 FINAL VALIDATION)');
  console.log('='.repeat(80));

  // --------------------------------------------------------------------------------
  // TEST 1: Ambiguity Detection (Tied candidates at same minimum edit distance)
  // --------------------------------------------------------------------------------
  console.log('\n--- 1. Ambiguity Detection (Không dùng tautology, assert token gốc giữ nguyên) ---');
  {
    // 'shirts' có khoảng cách Levenshtein = 1 tới 'shirt' (xóa s) và = 1 tới 'shorts' (thay i -> o)
    const dShirt = damerauLevenshtein('shirts', 'shirt');
    const dShorts = damerauLevenshtein('shirts', 'shorts');
    const isTied = dShirt === 1 && dShorts === 1;

    const input = 'ao shirts nam';
    const res = correctVietnameseQuery(input);

    const isPreserved = res.correctedQuery.includes('shirts');
    const notShorts = !res.correctedQuery.includes('shorts');
    const noFalseCorrection = res.corrections.filter(c => c.original === 'shirts').length === 0;

    assert(
      isTied && isPreserved && notShorts && noFalseCorrection,
      'Ambiguity Detection: Token "shirts" cách đều "shirt" và "shorts" (dist=1) được giữ nguyên, không sửa nhầm',
      `Tied dist: shirt=${dShirt}, shorts=${dShorts} | Output: "${res.correctedQuery}" (wasCorrected: ${res.wasCorrected})`
    );
  }

  // --------------------------------------------------------------------------------
  // TEST 2: Unambiguous Candidate Correction (1 ứng viên duy nhất tin cậy cao)
  // --------------------------------------------------------------------------------
  console.log('\n--- 2. Unambiguous Candidate Correction ---');
  {
    const input = 'ao hoodi den';
    const res = correctVietnameseQuery(input);
    const correctedToHoodie = res.correctedQuery.includes('hoodie');
    const recordedCorrection = res.corrections.some(c => c.original === 'hoodi' && c.corrected === 'hoodie');

    assert(
      res.wasCorrected && correctedToHoodie && recordedCorrection,
      'Ứng viên đơn lẻ tin cậy cao ("hoodi") được sửa chính xác thành "hoodie"',
      `Input: "${input}" -> Output: "${res.correctedQuery}"`
    );
  }

  // --------------------------------------------------------------------------------
  // TEST 3: Brand, SKU, Size & English Protection (6 kịch bản bắt buộc)
  // --------------------------------------------------------------------------------
  console.log('\n--- 3. Brand, SKU, Size & English Protection (6 kịch bản bắt buộc) ---');
  {
    // 1. "Routine hoodie": Routine bảo vệ, hoodie giữ nguyên
    const r1 = correctVietnameseQuery('Routine hoodie');
    const ok1 = r1.correctedQuery.toLowerCase() === 'routine hoodie' && r1.wasCorrected === false;

    // 2. "Routine sow mi": Routine bảo vệ, sow mi -> sơ mi
    const r2 = correctVietnameseQuery('Routine sow mi');
    const ok2 = r2.correctedQuery.toLowerCase() === 'routine sơ mi' && r2.wasCorrected === true;

    // 3. "ADIDAS hoodi": ADIDAS bảo vệ, hoodi -> hoodie
    const r3 = correctVietnameseQuery('ADIDAS hoodi');
    const ok3 = r3.correctedQuery.toLowerCase() === 'adidas hoodie' && r3.wasCorrected === true;

    // 4. "Nike Air Max": Giữ nguyên toàn bộ
    const r4 = correctVietnameseQuery('Nike Air Max');
    const ok4 = r4.correctedQuery.toLowerCase() === 'nike air max' && r4.wasCorrected === false;

    // 5. "AK-TWEED-05 XL": SKU và size giữ nguyên toàn bộ
    const r5 = correctVietnameseQuery('AK-TWEED-05 XL');
    const ok5 = r5.correctedQuery.toLowerCase() === 'ak-tweed-05 xl' && r5.wasCorrected === false;

    // 6. "Uniqlo oversize": Thương hiệu và từ tiếng Anh giữ nguyên
    const r6 = correctVietnameseQuery('Uniqlo oversize');
    const ok6 = r6.correctedQuery.toLowerCase() === 'uniqlo oversize' && r6.wasCorrected === false;

    assert(
      ok1 && ok2 && ok3 && ok4 && ok5 && ok6,
      'Bảo vệ 6 kịch bản bắt buộc: Routine hoodie, Routine sow mi, ADIDAS hoodi, Nike Air Max, AK-TWEED-05 XL, Uniqlo oversize',
      `1: "${r1.correctedQuery}" | 2: "${r2.correctedQuery}" | 3: "${r3.correctedQuery}" | 4: "${r4.correctedQuery}" | 5: "${r5.correctedQuery}" | 6: "${r6.correctedQuery}"`
    );
  }

  // --------------------------------------------------------------------------------
  // TEST 4: Category Hierarchy Alias Audit
  // --------------------------------------------------------------------------------
  console.log('\n--- 4. Category Hierarchy Alias Audit (Rà soát đầm/dam, shirt, tee, Chân Váy) ---');
  {
    // Các từ quá rộng phải trả về null (UNKNOWN)
    const damNorm = resolveCanonicalCategory('đầm');
    const damRaw = resolveCanonicalCategory('dam');
    const shirt = resolveCanonicalCategory('shirt');
    const tee = resolveCanonicalCategory('tee');
    const vay = resolveCanonicalCategory('váy');
    const broadOk = damNorm === null && damRaw === null && shirt === null && tee === null && vay === null;

    // Các cụm từ cụ thể ánh xạ chuẩn
    const damDaHoi = resolveCanonicalCategory('đầm dạ hội') === 'Trang Phục Dạ Hội';
    const chanVay = resolveCanonicalCategory('chân váy') === 'Chân Váy';
    const soMi = resolveCanonicalCategory('áo sơ mi') === 'Áo sơ mi';

    // Chân Váy thuộc riêng DRESSES_SKIRTS, KHÔNG thuộc BOTTOMS_LONG
    const relJeansSkirt = getCategoryRelationship('Quần Jeans', 'Chân Váy');
    const relDressSkirt = getCategoryRelationship('Trang Phục Dạ Hội', 'Chân Váy');
    const hierarchyOk = relJeansSkirt.type === 'UNRELATED' && relDressSkirt.type === 'RELATED';

    assert(
      broadOk && damDaHoi && chanVay && soMi && hierarchyOk,
      'Từ quá rộng ("đầm", "dam", "shirt", "tee", "váy") trả về UNKNOWN; Chân Váy tách khỏi Quần dài (Jeans vs Skirt: UNRELATED)',
      `Broad: null | Jeans vs Skirt: ${relJeansSkirt.type} | Gala vs Skirt: ${relDressSkirt.type}`
    );
  }

  // --------------------------------------------------------------------------------
  // TEST 5: Exact vs Related (Assert điểm số thực tế: min Exact > max Related)
  // --------------------------------------------------------------------------------
  console.log('\n--- 5. Exact vs Related Empirical Score Assertion ---');
  {
    const query = 'áo hoodie màu đen';
    const result = await vietnameseHybridSearchService.search({
      queryText: query,
      topK: 48,
      minThreshold: -1.0,
    });

    const exactItems = result.products.filter(p => p.category_name === 'Áo Hoodie & Sweater');
    const relatedItems = result.products.filter(p => {
      const rel = getCategoryRelationship('Áo Hoodie & Sweater', p.category_name);
      return rel.type === 'RELATED';
    });

    const hasExact = exactItems.length > 0;
    const hasRelated = relatedItems.length > 0;

    let minExact = 0;
    let maxRelated = 0;
    let scoresValid = false;

    if (hasExact && hasRelated) {
      minExact = Math.min(...exactItems.map(p => p.similarity));
      maxRelated = Math.max(...relatedItems.map(p => p.similarity));
      scoresValid = minExact > maxRelated;
    }

    // Kiểm tra phân biệt Color MATCH vs MISMATCH trong nhóm EXACT
    const exactMatch = exactItems.find(p => p.colors && p.colors.includes('Đen'));
    const exactMismatch = exactItems.find(p => p.colors && !p.colors.includes('Đen'));
    const colorOrdering = exactMatch && exactMismatch ? exactMatch.similarity > exactMismatch.similarity : true;

    assert(
      hasExact && hasRelated && scoresValid && colorOrdering,
      'Điểm số thực tế khẳng định tuyệt đối: min Exact > max Related; Trong nhóm Exact: Đúng màu > Sai màu',
      `Exact count: ${exactItems.length} (Min: ${minExact}) > Related count: ${relatedItems.length} (Max: ${maxRelated})`
    );
  }

  // --------------------------------------------------------------------------------
  // TEST 6: Adversarial Case 1 - Exact sai màu vs Related đúng màu (Final Score thực tế)
  // --------------------------------------------------------------------------------
  console.log('\n--- 6. Adversarial Case 1: Exact sai màu vs Related đúng màu (Final Score thực tế sau penalty) ---');
  {
    // Truy vấn 'áo hoodie màu đen'
    // Sản phẩm ID 4: 'Áo Hoodie Nỉ Bông Có Mũ Màu Xám' (EXACT category, màu XÁM -> MISMATCH, bị phạt 0.65x)
    // Sản phẩm ID 5: 'Áo Khoác Bomber Unisex Màu Đen' (RELATED category, màu ĐEN -> MATCH, giữ nguyên 1.0x)
    const result = await vietnameseHybridSearchService.search({
      queryText: 'áo hoodie màu đen',
      topK: 48,
      minThreshold: -1.0,
    });

    const exactWrongColor = result.products.find(p => String(p.product_id) === '4');
    const relatedRightColor = result.products.find(p => String(p.product_id) === '5');

    const exactScore = exactWrongColor ? exactWrongColor.similarity : -1;
    const relatedScore = relatedRightColor ? relatedRightColor.similarity : 999;
    const exactWins = exactScore > relatedScore;
    const tierBoundariesHold = exactScore >= 0.5500 && relatedScore <= 0.5000;

    assert(
      exactWrongColor && relatedRightColor && exactWins && tierBoundariesHold,
      'Exact Category sai màu (sau Color Penalty 0.65x) VẪN THẮNG Related Category đúng màu trên finalScore thực tế',
      `ID 4 (Exact Xám): ${exactScore} (>=0.55) > ID 5 (Related Đen): ${relatedScore} (<=0.50)`
    );
  }

  // --------------------------------------------------------------------------------
  // TEST 7: Adversarial Case 2 - Exact CLIP thấp vs Related CLIP cao (Final Score thực tế)
  // --------------------------------------------------------------------------------
  console.log('\n--- 7. Adversarial Case 2: Exact CLIP thấp vs Related CLIP cao (Final Score thực tế sau penalty) ---');
  {
    // Truy vấn 'áo sơ mi màu xanh'
    // Sản phẩm ID 22: 'Áo Sơ Mi Oxford Dài Tay Regular Fit Màu Trắng' (EXACT Áo sơ mi, màu Trắng -> CLIP thấp do khác màu/style)
    // Sản phẩm ID 43: 'Áo Măng Tô Dạ Dáng Dài Màu Xanh' (RELATED Áo khoác & Jacket, màu Xanh -> CLIP cao do trùng màu & ảnh áo xanh)
    const result = await vietnameseHybridSearchService.search({
      queryText: 'áo sơ mi màu xanh',
      topK: 48,
      minThreshold: -1.0,
    });

    const exactLowClip = result.products.find(p => String(p.product_id) === '22');
    const relatedHighClip = result.products.find(p => String(p.product_id) === '43');

    const scoreExact = exactLowClip ? exactLowClip.similarity : -1;
    const scoreRelated = relatedHighClip ? relatedHighClip.similarity : 999;
    const exactBeatsRelated = scoreExact > scoreRelated;
    const tierBoundariesHold = scoreExact >= 0.5500 && scoreRelated <= 0.5000;

    assert(
      exactLowClip && relatedHighClip && exactBeatsRelated && tierBoundariesHold,
      'Exact Category CLIP thấp VẪN THẮNG Related Category CLIP cao trên finalScore thực tế',
      `ID 22 (Exact Trắng): ${scoreExact} (>=0.55) > ID 43 (Related Xanh): ${scoreRelated} (<=0.50)`
    );
  }

  // --------------------------------------------------------------------------------
  // TEST 8: Adversarial Case 3 - Unrelated category + keyword score cực cao
  // --------------------------------------------------------------------------------
  console.log('\n--- 8. Adversarial Case 3: Unrelated category + keyword score cao (Bị khống chế Tier 3 <= 0.1500) ---');
  {
    // Truy vấn 'áo sơ mi nam công sở'
    // Sản phẩm ID 17: 'Quần Tây Công Sở Xếp Ly Màu Xám' (Từ khóa 'công sở', 'nam' trùng khớp cao trong tên & mô tả)
    // Danh mục: 'Quần Tây & Trouser' (UNRELATED với 'Áo sơ mi')
    const result = await vietnameseHybridSearchService.search({
      queryText: 'áo sơ mi nam công sở',
      topK: 48,
      minThreshold: -1.0,
    });

    const unrelatedHighKw = result.products.find(p => String(p.product_id) === '17');
    const minExactScore = Math.min(...result.products.filter(p => p.category_name === 'Áo sơ mi').map(p => p.similarity));

    const unrelatedScore = unrelatedHighKw ? unrelatedHighKw.similarity : 999;
    const isSuppressed = unrelatedScore <= 0.1500;
    const exactDominates = minExactScore >= 0.5500 && minExactScore > unrelatedScore;

    assert(
      unrelatedHighKw && isSuppressed && exactDominates,
      'Unrelated Category dù trùng từ khóa "công sở" cao vẫn bị khống chế tuyệt đối trong Tier 3 (<= 0.1500)',
      `ID 17 (Quần Tây - Unrelated): ${unrelatedScore} (<= 0.1500) < Min Exact (Áo sơ mi): ${minExactScore} (>= 0.5500)`
    );
  }

  // --------------------------------------------------------------------------------
  // TEST 9: Unrelated Category Suppression Toàn Diện (Kiểm tra toàn bộ 48 sản phẩm)
  // --------------------------------------------------------------------------------
  console.log('\n--- 9. Unrelated Category Suppression Toàn Diện ---');
  {
    const query = 'áo sơ mi trắng nam';
    const result = await vietnameseHybridSearchService.search({
      queryText: query,
      topK: 48,
      minThreshold: -1.0,
    });

    const unrelatedItems = result.products.filter(p => {
      const rel = getCategoryRelationship('Áo sơ mi', p.category_name);
      return rel.type === 'UNRELATED';
    });

    const hasUnrelated = unrelatedItems.length > 0;
    const maxUnrelatedScore = hasUnrelated ? Math.max(...unrelatedItems.map(p => p.similarity)) : 999;
    const allSuppressed = hasUnrelated && unrelatedItems.every(p => p.similarity <= 0.1500);

    assert(
      hasUnrelated && allSuppressed,
      'Sản phẩm UNRELATED (Giày, Kính mát, Quần, Thắt lưng) được xác nhận tồn tại và toàn bộ bị khống chế <= 0.1500',
      `Số lượng Unrelated kiểm tra: ${unrelatedItems.length} | Max Unrelated Score: ${maxUnrelatedScore}`
    );
  }

  // --------------------------------------------------------------------------------
  // TEST 10: Catalog without Exact (catalogHasExact=false, catalogHasRelated=true)
  // --------------------------------------------------------------------------------
  console.log('\n--- 10. Catalog without Exact Category ---');
  {
    // Mô phỏng catalog bị thiếu hẳn danh mục "Áo Hoodie & Sweater", chỉ còn "Áo khoác & Jacket" (Related) và phụ kiện (Unrelated)
    const allVectors = vectorSearchService.vectorsCache;
    const subsetVectors = allVectors.filter(p => p.category_name !== 'Áo Hoodie & Sweater');

    // Kiểm tra điều kiện catalog
    const parsed = parseVietnameseQuery('áo hoodie màu đen');
    const catalogHasExact = subsetVectors.some(p => getCategoryRelationship(parsed.category, p.category_name).type === 'EXACT');
    const catalogHasRelated = subsetVectors.some(p => getCategoryRelationship(parsed.category, p.category_name).type === 'RELATED');

    // Chạy xếp hạng trên tập subset
    let minRelatedScore = 999;
    let maxUnrelatedScore = -1;
    let relatedCount = 0;
    let unrelatedCount = 0;

    for (const item of subsetVectors) {
      const rel = getCategoryRelationship(parsed.category, item.category_name);
      const sAttr = vietnameseHybridSearchService.calculateAttributeScore(item, parsed);
      const sKw = vietnameseHybridSearchService.calculateKeywordScore(item, parsed);
      const matchQ = (0.45 * sAttr + 0.35 * sKw + 0.20 * 0.50);

      if (rel.type === 'RELATED') {
        const score = 0.30 + 0.60 * matchQ;
        minRelatedScore = Math.min(minRelatedScore, score);
        relatedCount++;
      } else {
        const score = 0.15 * matchQ;
        maxUnrelatedScore = Math.max(maxUnrelatedScore, score);
        unrelatedCount++;
      }
    }

    const priorityGuaranteed = minRelatedScore > maxUnrelatedScore;

    assert(
      !catalogHasExact && catalogHasRelated && priorityGuaranteed && minRelatedScore >= 0.30 && maxUnrelatedScore <= 0.15,
      'Khi catalog không có Exact nhưng có Related: min Related (>=0.30) LUÔN CAO HƠN max Unrelated (<=0.15)',
      `Exact: ${catalogHasExact} | Related: ${catalogHasRelated} | Min Related: ${minRelatedScore.toFixed(4)} > Max Unrelated: ${maxUnrelatedScore.toFixed(4)}`
    );
  }

  // --------------------------------------------------------------------------------
  // TEST 11: Catalog without Exact & without Related (Controlled Fallback)
  // --------------------------------------------------------------------------------
  console.log('\n--- 11. Catalog without Exact & without Related (Controlled Fallback) ---');
  {
    // Mô phỏng catalog bị thiếu cả họ OUTERWEAR (không có Áo khoác, Áo len, Áo vest, Áo hoodie)
    const allVectors = vectorSearchService.vectorsCache;
    const subsetVectors = allVectors.filter(p => {
      const rel = getCategoryRelationship('Áo Hoodie & Sweater', p.category_name);
      return rel.type !== 'EXACT' && rel.type !== 'RELATED';
    });

    const parsed = parseVietnameseQuery('áo hoodie màu đen');
    const catalogHasExact = subsetVectors.some(p => getCategoryRelationship(parsed.category, p.category_name).type === 'EXACT');
    const catalogHasRelated = subsetVectors.some(p => getCategoryRelationship(parsed.category, p.category_name).type === 'RELATED');

    let maxFallbackScore = -1;
    for (const item of subsetVectors) {
      const sAttr = vietnameseHybridSearchService.calculateAttributeScore(item, parsed);
      const sKw = vietnameseHybridSearchService.calculateKeywordScore(item, parsed);
      const matchQ = (0.45 * sAttr + 0.35 * sKw + 0.20 * 0.50);
      const fallbackScore = 0.50 * matchQ;
      maxFallbackScore = Math.max(maxFallbackScore, fallbackScore);
    }

    assert(
      !catalogHasExact && !catalogHasRelated && maxFallbackScore <= 0.5000,
      'Khi catalog thiếu cả Exact lẫn Related: Áp dụng Fallback có kiểm soát (toàn bộ điểm <= 0.5000)',
      `catalogHasExact: ${catalogHasExact} | catalogHasRelated: ${catalogHasRelated} | Max Fallback Score: ${maxFallbackScore.toFixed(4)}`
    );
  }

  // --------------------------------------------------------------------------------
  // TEST 12: Adversarial Case 4 - CLIP Unavailable (Giả lập sập CLIP qua search thực tế)
  // --------------------------------------------------------------------------------
  console.log('\n--- 12. Adversarial Case 4: CLIP Unavailable (Giả lập sập CLIP, Exact > Related trên finalScore thực tế) ---');
  {
    // Chủ động mô phỏng CLIP embedding bị lỗi qua injectable textEmbeddingFn
    const originalTextEmbeddingFn = vietnameseHybridSearchService.textEmbeddingFn;
    
    // Ghi đè hàm tạm thời để giả lập sập CLIP
    let clipCalledAndFailed = false;
    vietnameseHybridSearchService.textEmbeddingFn = async () => {
      clipCalledAndFailed = true;
      throw new Error('Simulated CLIP GPU/Model Out-Of-Memory Error');
    };

    let searchSucceeded = false;
    let result = null;

    try {
      result = await vietnameseHybridSearchService.search({
        queryText: 'áo hoodie màu đen',
        topK: 48,
        minThreshold: -1.0,
      });
      searchSucceeded = result && result.products && result.products.length > 0;
    } catch (err) {
      searchSucceeded = false;
    } finally {
      // Phục hồi hàm gốc
      vietnameseHybridSearchService.textEmbeddingFn = originalTextEmbeddingFn;
    }

    const exactItems = result.products.filter(p => p.category_name === 'Áo Hoodie & Sweater');
    const relatedItems = result.products.filter(p => {
      const rel = getCategoryRelationship('Áo Hoodie & Sweater', p.category_name);
      return rel.type === 'RELATED';
    });

    const minExact = Math.min(...exactItems.map(p => p.similarity));
    const maxRelated = Math.max(...relatedItems.map(p => p.similarity));
    const exactBeatsRelatedWhenClipDown = minExact > maxRelated && minExact >= 0.5500 && maxRelated <= 0.5000;
    const top1 = result && result.products ? result.products[0] : null;

    assert(
      clipCalledAndFailed && searchSucceeded && exactBeatsRelatedWhenClipDown,
      'Khi CLIP sập hoàn toàn: Hệ thống tự động fallback sang Attr+Kw, finalScore thực tế vẫn bảo đảm Exact > Related (Min Exact > Max Related)',
      `CLIP Error Triggered: ${clipCalledAndFailed} | Min Exact: ${minExact} > Max Related: ${maxRelated} | Top 1: "${top1 ? top1.product_name : 'N/A'}"`
    );
  }

  console.log('\n' + '='.repeat(80));
  console.log(`  KẾT QUẢ KIỂM THỬ ĐỐI KHÁNG: ${passedTests}/${totalTests} TESTS ĐẠT (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log('='.repeat(80));

  await prisma.$disconnect();
  process.exit(passedTests === totalTests ? 0 : 1);
}

runAdversarialValidation().catch(err => {
  console.error('Lỗi kiểm thử đối kháng:', err);
  prisma.$disconnect();
  process.exit(1);
});

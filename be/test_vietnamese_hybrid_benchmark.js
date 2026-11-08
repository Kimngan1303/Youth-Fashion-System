import { vectorSearchService } from './src/services/ai/vectorSearch.service.js';
import { createTextEmbedding, cosineSimilarity } from './src/services/ai/embedding.service.js';
import { vietnameseHybridSearchService } from './src/services/ai/vietnameseHybridSearch.service.js';
import { parseVietnameseQuery } from './src/services/ai/vietnameseQueryParser.js';

// Đảm bảo vector được nạp
vectorSearchService.loadVectors();
await vietnameseHybridSearchService.loadDescriptions();

/**
 * Danh sách 30 truy vấn Benchmark đại diện cho 10 nhóm hành vi tìm kiếm
 * Ground Truth (relevantIds) được gắn nhãn thủ công khách quan dựa trên danh mục 48 sản phẩm thực tế
 */
const BENCHMARK_QUERIES = [
  // Nhóm 1: Tên sản phẩm chính xác
  { id: 1, group: 'Tên chính xác', q: 'Áo Hoodie Nỉ Trơn Màu Đen', relevantIds: ['10'] },
  { id: 2, group: 'Tên chính xác', q: 'Áo Măng Tô Dạ Dáng Dài Màu Xanh', relevantIds: ['43'] },
  { id: 3, group: 'Tên chính xác', q: 'Áo Sơ Mi Oxford Nam Màu Xanh', relevantIds: ['47'] },

  // Nhóm 2: Loại sản phẩm (Category)
  { id: 4, group: 'Loại sản phẩm', q: 'áo hoodie', relevantIds: ['4', '10', '23'] },
  { id: 5, group: 'Loại sản phẩm', q: 'quần jean', relevantIds: ['3', '39'] },
  { id: 6, group: 'Loại sản phẩm', q: 'váy đầm dạ hội', relevantIds: ['12', '36', '46'] },

  // Nhóm 3: Màu sắc sản phẩm
  { id: 7, group: 'Màu sắc', q: 'áo sơ mi màu xanh', relevantIds: ['47'] },
  { id: 8, group: 'Màu sắc', q: 'đầm màu đỏ', relevantIds: ['12', '46'] },
  { id: 9, group: 'Màu sắc', q: 'đồ màu vàng', relevantIds: ['15', '31', '37', '49'] },

  // Nhóm 4: Giới tính
  { id: 10, group: 'Giới tính', q: 'áo sơ mi nam', relevantIds: ['2', '22', '38', '47', '50'] },
  { id: 11, group: 'Giới tính', q: 'đầm nữ đi tiệc', relevantIds: ['12', '36', '46'] },
  { id: 12, group: 'Giới tính', q: 'áo thun unisex', relevantIds: ['1', '7', '21', '41', '42'] },

  // Nhóm 5: Chất liệu
  { id: 13, group: 'Chất liệu', q: 'áo khoác dạ', relevantIds: ['11', '13', '43'] },
  { id: 14, group: 'Chất liệu', q: 'áo hoodie nỉ', relevantIds: ['4', '10', '23'] },
  { id: 15, group: 'Chất liệu', q: 'đầm lụa satin', relevantIds: ['12', '46'] },

  // Nhóm 6: Kiểu dáng / Form dáng
  { id: 16, group: 'Kiểu dáng', q: 'áo form rộng', relevantIds: ['1', '4', '10', '21'] },
  { id: 17, group: 'Kiểu dáng', q: 'quần ống suông', relevantIds: ['3', '17', '45'] },
  { id: 18, group: 'Kiểu dáng', q: 'quần slimfit', relevantIds: ['16'] },

  // Nhóm 7: Phong cách & Dịp sử dụng
  { id: 19, group: 'Phong cách', q: 'đồ công sở lịch sự', relevantIds: ['2', '17', '22', '45', '47', '48', '50'] },
  { id: 20, group: 'Phong cách', q: 'đồ thể thao năng động', relevantIds: ['7', '18', '26', '33', '42', '49'] },
  { id: 21, group: 'Phong cách', q: 'trang phục đi dự tiệc cưới', relevantIds: ['12', '36', '46'] },

  // Nhóm 8: Từ đồng nghĩa
  { id: 22, group: 'Từ đồng nghĩa', q: 'áo phông', relevantIds: ['1', '7', '21', '41', '42'] },
  { id: 23, group: 'Từ đồng nghĩa', q: 'quần bò', relevantIds: ['3', '39'] },
  { id: 24, group: 'Từ đồng nghĩa', q: 'quần âu', relevantIds: ['17', '45', '48'] },

  // Nhóm 9: Tìm kiếm không dấu
  { id: 25, group: 'Không dấu', q: 'ao hoodie mau den', relevantIds: ['10'] },
  { id: 26, group: 'Không dấu', q: 'quan jean nam ong rong', relevantIds: ['3', '39'] },
  { id: 27, group: 'Không dấu', q: 'ao so mi trang', relevantIds: ['2', '22', '50'] },

  // Nhóm 10: Mô tả tự nhiên
  { id: 28, group: 'Mô tả tự nhiên', q: 'áo ấm để mặc vào mùa đông lạnh', relevantIds: ['4', '10', '11', '13', '20', '32', '43', '44'] },
  { id: 29, group: 'Mô tả tự nhiên', q: 'quần thoải mái để chạy bộ tập gym', relevantIds: ['18', '33', '49'] },
  { id: 30, group: 'Mô tả tự nhiên', q: 'set bộ nỉ thể thao màu vàng dạo phố', relevantIds: ['49'] },
];

/**
 * 1. Chạy Baseline: CLIP Text Search truyền thống
 */
async function runBaseline(query) {
  const start = Date.now();
  const queryVec = await createTextEmbedding(query);
  const results = vectorSearchService.searchSimilar(queryVec, 5, -1.0);
  const latency = Date.now() - start;
  return { results, latency };
}

/**
 * 2. Chạy Version A: Keyword + Attribute Search (Không dùng CLIP)
 */
async function runVersionA(query) {
  const start = Date.now();
  const parsed = parseVietnameseQuery(query);
  const vectors = vectorSearchService.vectorsCache;

  const scored = vectors.map((item) => {
    const desc = vietnameseHybridSearchService.descriptionsMap.get(item.product_id) || '';
    const prod = { ...item, description: desc };
    const sAttr = vietnameseHybridSearchService.calculateAttributeScore(prod, parsed);
    const sKw = vietnameseHybridSearchService.calculateKeywordScore(prod, parsed);
    let finalScore = (0.55 * sAttr) + (0.45 * sKw);

    if (parsed.category) {
      const targetCat = parsed.category.toLowerCase();
      const prodCat = (item.category_name || '').toLowerCase();
      if (prodCat !== targetCat) {
        finalScore *= 0.05;
      }
    }
    return { product_id: item.product_id, similarity: finalScore };
  });

  const sorted = scored.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  const latency = Date.now() - start;
  return { results: sorted, latency };
}

/**
 * 3. Chạy Version B: Full Hybrid Search (Keyword + Attribute + CLIP Prompt)
 */
async function runVersionB(query) {
  const start = Date.now();
  const res = await vietnameseHybridSearchService.search({ queryText: query, topK: 5, minThreshold: -1.0 });
  const latency = Date.now() - start;
  return { results: res.products, latency };
}

/**
 * Hàm đánh giá các chỉ số Information Retrieval
 */
function evaluateMetrics(results, relevantIds, topK = 5) {
  const topResultIds = results.slice(0, topK).map((r) => String(r.product_id));
  const relevantSet = new Set(relevantIds.map(String));

  // 1. Precision@K
  let hits = 0;
  for (const id of topResultIds) {
    if (relevantSet.has(id)) hits++;
  }
  const precision = hits / topK;

  // 2. Recall@K
  const recall = relevantIds.length > 0 ? hits / relevantIds.length : 0;

  // 3. Reciprocal Rank (RR) và Thứ hạng Rank của sản phẩm đúng đầu tiên
  let rank = -1;
  let rr = 0;
  for (let i = 0; i < topResultIds.length; i++) {
    if (relevantSet.has(topResultIds[i])) {
      rank = i + 1;
      rr = 1 / rank;
      break;
    }
  }

  // 4. Zero result (Không có sản phẩm phù hợp nào trong topK)
  const isZero = topResultIds.length === 0 || hits === 0;

  return { precision, recall, rr, rank, hits, isZero };
}

console.log('========================================================================================');
console.log('         CHẠY BENCHMARK ĐỐI ĐẦU 3 PHIÊN BẢN TRÊN 30 TRUY VẤN TIẾNG VIỆT');
console.log('         1. Baseline (Raw CLIP) vs 2. Version A (Attr+Kw) vs 3. Version B (Full Hybrid)');
console.log('========================================================================================\n');

const statsBaseline = { precisions: [], recalls: [], rrs: [], ranks: [], zeroHits: 0, latencies: [] };
const statsVersionA = { precisions: [], recalls: [], rrs: [], ranks: [], zeroHits: 0, latencies: [] };
const statsVersionB = { precisions: [], recalls: [], rrs: [], ranks: [], zeroHits: 0, latencies: [] };

console.log('| Q# | Truy vấn                              | Rel | Base Rk (RR) | VerA Rk (RR) | VerB Rk (RR) | VerB P@5 | VerB R@5 |');
console.log('|----|---------------------------------------|-----|--------------|--------------|--------------|----------|----------|');

for (const bq of BENCHMARK_QUERIES) {
  const baseRes = await runBaseline(bq.q);
  const verARes = await runVersionA(bq.q);
  const verBRes = await runVersionB(bq.q);

  const mBase = evaluateMetrics(baseRes.results, bq.relevantIds);
  const mVerA = evaluateMetrics(verARes.results, bq.relevantIds);
  const mVerB = evaluateMetrics(verBRes.results, bq.relevantIds);

  statsBaseline.precisions.push(mBase.precision);
  statsBaseline.recalls.push(mBase.recall);
  statsBaseline.rrs.push(mBase.rr);
  statsBaseline.ranks.push(mBase.rank);
  if (mBase.isZero) statsBaseline.zeroHits++;
  statsBaseline.latencies.push(baseRes.latency);

  statsVersionA.precisions.push(mVerA.precision);
  statsVersionA.recalls.push(mVerA.recall);
  statsVersionA.rrs.push(mVerA.rr);
  statsVersionA.ranks.push(mVerA.rank);
  if (mVerA.isZero) statsVersionA.zeroHits++;
  statsVersionA.latencies.push(verARes.latency);

  statsVersionB.precisions.push(mVerB.precision);
  statsVersionB.recalls.push(mVerB.recall);
  statsVersionB.rrs.push(mVerB.rr);
  statsVersionB.ranks.push(mVerB.rank);
  if (mVerB.isZero) statsVersionB.zeroHits++;
  statsVersionB.latencies.push(verBRes.latency);

  const fmtRk = (m) => (m.rank > 0 ? `Rank ${m.rank} (${m.rr.toFixed(2)})` : 'Not in top 5');
  const qPad = bq.q.padEnd(37, ' ').slice(0, 37);
  console.log(
    `| ${bq.id.toString().padStart(2, '0')} | ${qPad} | ${bq.relevantIds.length.toString().padStart(3, ' ')} | ` +
    `${fmtRk(mBase).padEnd(12, ' ')} | ${fmtRk(mVerA).padEnd(12, ' ')} | ${fmtRk(mVerB).padEnd(12, ' ')} | ` +
    `${(mVerB.precision * 100).toFixed(0).padStart(7, ' ')}% | ${(mVerB.recall * 100).toFixed(0).padStart(7, ' ')}% |`
  );
}

const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

// Tính trần toán học cho Precision@5
const maxPossibleHits = BENCHMARK_QUERIES.reduce((sum, q) => sum + Math.min(5, q.relevantIds.length), 0);
const theoreticalPrecisionCeiling = (maxPossibleHits / (BENCHMARK_QUERIES.length * 5)) * 100;

// Phân bố Rank
const getRankDistribution = (ranks) => {
  const r1 = ranks.filter((r) => r === 1).length;
  const r2 = ranks.filter((r) => r === 2).length;
  const r3 = ranks.filter((r) => r === 3).length;
  const r4_5 = ranks.filter((r) => r === 4 || r === 5).length;
  const rOut = ranks.filter((r) => r === -1).length;
  return { r1, r2, r3, r4_5, rOut };
};

const distBase = getRankDistribution(statsBaseline.ranks);
const distVerA = getRankDistribution(statsVersionA.ranks);
const distVerB = getRankDistribution(statsVersionB.ranks);

console.log('\n========================================================================================');
console.log('                          BẢNG TỔNG KẾT SO SÁNH BENCHMARK');
console.log('========================================================================================');
console.log('| Chỉ số đánh giá               | Baseline (Raw CLIP) | Version A (Attr+Kw) | Version B (Full Hybrid) |');
console.log('|-------------------------------|---------------------|---------------------|-------------------------|');
console.log(`| Precision@5                   | ${(avg(statsBaseline.precisions) * 100).toFixed(1)}%                | ${(avg(statsVersionA.precisions) * 100).toFixed(1)}%               | ${(avg(statsVersionB.precisions) * 100).toFixed(1)}%                   |`);
console.log(`| Recall@5                      | ${(avg(statsBaseline.recalls) * 100).toFixed(1)}%                | ${(avg(statsVersionA.recalls) * 100).toFixed(1)}%               | ${(avg(statsVersionB.recalls) * 100).toFixed(1)}%                   |`);
console.log(`| Mean Reciprocal Rank (MRR)    | ${avg(statsBaseline.rrs).toFixed(3)}               | ${avg(statsVersionA.rrs).toFixed(3)}              | ${avg(statsVersionB.rrs).toFixed(3)}                  |`);
console.log(`| Zero-Hit Rate (Top 1-5 trượt) | ${((statsBaseline.zeroHits / 30) * 100).toFixed(1)}% (${statsBaseline.zeroHits}/30)       | ${((statsVersionA.zeroHits / 30) * 100).toFixed(1)}% (${statsVersionA.zeroHits}/30)      | ${((statsVersionB.zeroHits / 30) * 100).toFixed(1)}% (${statsVersionB.zeroHits}/30)          |`);
console.log(`| Latency trung bình            | ${avg(statsBaseline.latencies).toFixed(1)}ms               | ${avg(statsVersionA.latencies).toFixed(1)}ms               | ${avg(statsVersionB.latencies).toFixed(1)}ms                  |`);
console.log('========================================================================================');

console.log('\n========================================================================================');
console.log('                   PHÂN BỐ THỨ HẠNG SẢN PHẨM PHÙ HỢP ĐẦU TIÊN (RANK)');
console.log('========================================================================================');
console.log('| Vị trí Rank                   | Baseline (Raw CLIP) | Version A (Attr+Kw) | Version B (Full Hybrid) |');
console.log('|-------------------------------|---------------------|---------------------|-------------------------|');
console.log(`| Rank 1 (RR = 1.0)             | ${distBase.r1.toString().padStart(2, ' ')}/30 (${((distBase.r1/30)*100).toFixed(1)}%)        | ${distVerA.r1.toString().padStart(2, ' ')}/30 (${((distVerA.r1/30)*100).toFixed(1)}%)       | ${distVerB.r1.toString().padStart(2, ' ')}/30 (${((distVerB.r1/30)*100).toFixed(1)}%)       |`);
console.log(`| Rank 2 (RR = 0.5)             | ${distBase.r2.toString().padStart(2, ' ')}/30 (${((distBase.r2/30)*100).toFixed(1)}%)        | ${distVerA.r2.toString().padStart(2, ' ')}/30 (${((distVerA.r2/30)*100).toFixed(1)}%)       | ${distVerB.r2.toString().padStart(2, ' ')}/30 (${((distVerB.r2/30)*100).toFixed(1)}%)       |`);
console.log(`| Rank 3 (RR = 0.33)            | ${distBase.r3.toString().padStart(2, ' ')}/30 (${((distBase.r3/30)*100).toFixed(1)}%)        | ${distVerA.r3.toString().padStart(2, ' ')}/30 (${((distVerA.r3/30)*100).toFixed(1)}%)       | ${distVerB.r3.toString().padStart(2, ' ')}/30 (${((distVerB.r3/30)*100).toFixed(1)}%)       |`);
console.log(`| Rank 4-5 (RR = 0.25 - 0.20)   | ${distBase.r4_5.toString().padStart(2, ' ')}/30 (${((distBase.r4_5/30)*100).toFixed(1)}%)        | ${distVerA.r4_5.toString().padStart(2, ' ')}/30 (${((distVerA.r4_5/30)*100).toFixed(1)}%)       | ${distVerB.r4_5.toString().padStart(2, ' ')}/30 (${((distVerB.r4_5/30)*100).toFixed(1)}%)       |`);
console.log(`| Không có trong Top 5 (RR = 0) | ${distBase.rOut.toString().padStart(2, ' ')}/30 (${((distBase.rOut/30)*100).toFixed(1)}%)        | ${distVerA.rOut.toString().padStart(2, ' ')}/30 (${((distVerA.rOut/30)*100).toFixed(1)}%)       | ${distVerB.rOut.toString().padStart(2, ' ')}/30 (${((distVerB.rOut/30)*100).toFixed(1)}%)       |`);
console.log('========================================================================================');
console.log(`\n(*) GIẢI THÍCH TRẦN TOÁN HỌC PRECISION@5:`);
console.log(`    - Tổng số sản phẩm phù hợp tối đa có thể chọn cho 30 truy vấn: ${maxPossibleHits} sản phẩm.`);
console.log(`    - Mẫu số Precision@5 cố định là 30 truy vấn * 5 kết quả = 150 vị trí.`);
console.log(`    - TRẦN TOÁN HỌC TỐI ĐA (Theoretical Precision Ceiling): ${maxPossibleHits}/150 = ${theoreticalPrecisionCeiling.toFixed(2)}%.`);
console.log(`    - Version B đạt ${(avg(statsVersionB.precisions) * 100).toFixed(1)}%, tương đương ${( (avg(statsVersionB.precisions)*100 / theoreticalPrecisionCeiling) * 100 ).toFixed(1)}% của trần tuyệt đối.\n`);

process.exit(0);


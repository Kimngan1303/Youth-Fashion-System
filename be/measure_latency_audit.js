/**
 * measure_latency_audit.js
 * Đo lường độ trễ chuẩn xác (Latency Measurement Audit) cho FashionAI Hybrid Text Search
 * Thực hiện đo 3 kịch bản:
 * 1. Cold Start (Khởi động lạnh, nạp vector và model từ disk).
 * 2. Warm Service Core (N >= 100 lần chạy trên In-memory service).
 * 3. HTTP End-to-End (N >= 100 lần chạy qua HTTP API).
 */

import http from 'http';
import { performance } from 'perf_hooks';
import { vectorSearchService } from './src/services/ai/vectorSearch.service.js';
import { vietnameseHybridSearchService } from './src/services/ai/vietnameseHybridSearch.service.js';
import app from './src/app.js';

function computePercentiles(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const n = sorted.length;
  const avg = sorted.reduce((a, b) => a + b, 0) / n;
  const p50 = sorted[Math.floor(n * 0.50)];
  const p90 = sorted[Math.floor(n * 0.90)];
  const p95 = sorted[Math.floor(n * 0.95)];
  return {
    n,
    avg: Number(avg.toFixed(2)),
    p50: Number(p50.toFixed(2)),
    p90: Number(p90.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    min: Number(sorted[0].toFixed(2)),
    max: Number(sorted[n - 1].toFixed(2)),
  };
}

async function runLatencyAudit() {
  console.log('='.repeat(80));
  console.log('   ĐO LƯỜNG ĐỘ TRỄ CHUẨN XÁC: COLD START, WARM CORE, HTTP END-TO-END');
  console.log('='.repeat(80));

  // --------------------------------------------------------------------------------
  // 1. ĐO LƯỜNG COLD START
  // --------------------------------------------------------------------------------
  console.log('\n--- 1. Đo lường Cold Start ---');
  const coldStartTimer = performance.now();
  // Nạp vector + mô tả + chạy truy vấn đầu tiên
  vectorSearchService.loadVectors();
  await vietnameseHybridSearchService.loadDescriptions();
  const coldQueryRes = await vietnameseHybridSearchService.search({
    queryText: 'áo hoodie nỉ trơn màu đen',
    topK: 5,
  });
  const coldDuration = performance.now() - coldStartTimer;
  console.log(`Cold Start Time: ${coldDuration.toFixed(2)}ms`);
  console.log(`Cold query returned: ${coldQueryRes.products.length} products (Top 1: ${coldQueryRes.products[0]?.product_name})`);

  // --------------------------------------------------------------------------------
  // 2. ĐO LƯỜNG WARM SERVICE CORE (N = 100)
  // --------------------------------------------------------------------------------
  console.log('\n--- 2. Đo lường Warm Service Core (N = 100 lần chạy) ---');
  const sampleQueries = [
    'áo hoodie nỉ trơn màu đen',
    'áo sơ mi oxford nam màu xanh',
    'quần jean ống rộng',
    'đầm dạ hội lụa đỏ',
    'áo khoác bomber mùa đông',
  ];

  // Khởi động warm-up 5 lần
  for (let i = 0; i < 5; i++) {
    await vietnameseHybridSearchService.search({ queryText: sampleQueries[i % sampleQueries.length], topK: 5 });
  }

  const warmCoreLatencies = [];
  const N_CORE = 100;

  for (let i = 0; i < N_CORE; i++) {
    const q = sampleQueries[i % sampleQueries.length];
    const t0 = performance.now();
    await vietnameseHybridSearchService.search({ queryText: q, topK: 5 });
    const t1 = performance.now();
    warmCoreLatencies.push(t1 - t0);
  }

  const coreStats = computePercentiles(warmCoreLatencies);
  console.log('Kết quả Warm Service Core:');
  console.log(`- N: ${coreStats.n}`);
  console.log(`- Average: ${coreStats.avg}ms`);
  console.log(`- Median (P50): ${coreStats.p50}ms`);
  console.log(`- P90: ${coreStats.p90}ms`);
  console.log(`- P95: ${coreStats.p95}ms`);
  console.log(`- Min: ${coreStats.min}ms | Max: ${coreStats.max}ms`);
  console.log(`- Cache State: RAM Cache Active (48 vectors, Model Loaded in RAM)`);
  console.log(`- Phương pháp đo: performance.now() đo thời gian thực thi hàm search() trong RAM.`);

  // --------------------------------------------------------------------------------
  // 3. ĐO LƯỜNG EXPRESS IN-PROCESS END-TO-END (N = 100)
  // --------------------------------------------------------------------------------
  console.log('\n--- 3. Đo lường Express In-Process End-to-End (N = 100 lần chạy) ---');
  
  // Sử dụng mock HTTP IncomingMessage & ServerResponse để đo toàn bộ Express Pipeline
  // (Bao gồm JSON body parsing, CORS, Middlewares, Controller, Service & JSON response serialization)
  // qua app.handle()
  function invokeExpressPipeline(method, path, body, ip) {
    return new Promise((resolve) => {
      const socket = new (http.IncomingMessage.prototype.constructor)({});
      const req = new http.IncomingMessage(socket);
      req.method = method;
      req.url = path;
      req.headers = {
        'content-type': 'application/json',
        'x-forwarded-for': ip,
      };
      req.body = body;

      const res = new http.ServerResponse(req);
      let outputData = '';
      res.write = (chunk) => {
        if (chunk) outputData += chunk.toString();
        return true;
      };
      res.end = (chunk) => {
        if (chunk) outputData += chunk.toString();
        let parsed = null;
        try { parsed = JSON.parse(outputData); } catch (_) {}
        resolve({ statusCode: res.statusCode, data: parsed });
      };

      app.handle(req, res);
    });
  }

  // Warm-up HTTP endpoint 5 lần
  for (let i = 0; i < 5; i++) {
    const q = sampleQueries[i % sampleQueries.length];
    await invokeExpressPipeline('POST', '/api/ai/search/text', { query: q, top_k: 5 }, `192.168.1.${i + 1}`);
  }

  const httpLatencies = [];
  const N_HTTP = 100;

  for (let i = 0; i < N_HTTP; i++) {
    const q = sampleQueries[i % sampleQueries.length];
    const ip = `10.0.${Math.floor(i / 10)}.${(i % 10) + 1}`;
    const t0 = performance.now();
    await invokeExpressPipeline('POST', '/api/ai/search/text', { query: q, top_k: 5 }, ip);
    const t1 = performance.now();
    httpLatencies.push(t1 - t0);
  }

  const httpStats = computePercentiles(httpLatencies);
  console.log('Kết quả Express In-Process End-to-End:');
  console.log(`- N: ${httpStats.n}`);
  console.log(`- Average: ${httpStats.avg}ms`);
  console.log(`- Median (P50): ${httpStats.p50}ms`);
  console.log(`- P90: ${httpStats.p90}ms`);
  console.log(`- P95: ${httpStats.p95}ms`);
  console.log(`- Min: ${httpStats.min}ms | Max: ${httpStats.max}ms`);
  console.log(`- Cache State: RAM Cache Active (Express Pipeline + Controller + Service + Serialization)`);
  console.log(`- Phương pháp đo: Mock HTTP Request/Response truyền qua app.handle(), đo thời gian từ lúc nhận request đến khi res.end() hoàn tất.`);

  console.log('\n' + '='.repeat(80));
  console.log('   BẢNG TỔNG HỢP ĐỘ TRỄ (LATENCY PROFILE)');
  console.log('='.repeat(80));
  console.log('| Kịch bản đo lường | N | Average | Median (P50) | P90 | P95 | Min - Max |');
  console.log('|:---|:---:|:---:|:---:|:---:|:---:|:---:|');
  console.log(`| Cold Start (N=1, tham khảo nạp model) | 1 | ${coldDuration.toFixed(2)}ms | - | - | - | ${coldDuration.toFixed(2)}ms |`);
  console.log(`| Warm Service Core | ${coreStats.n} | ${coreStats.avg}ms | ${coreStats.p50}ms | ${coreStats.p90}ms | ${coreStats.p95}ms | ${coreStats.min}ms - ${coreStats.max}ms |`);
  console.log(`| Express In-Process End-to-End | ${httpStats.n} | ${httpStats.avg}ms | ${httpStats.p50}ms | ${httpStats.p90}ms | ${httpStats.p95}ms | ${httpStats.min}ms - ${httpStats.max}ms |`);
  console.log('='.repeat(80));

  process.exit(0);
}

runLatencyAudit().catch((err) => {
  console.error('Lỗi đo lường độ trễ:', err);
  process.exit(1);
});

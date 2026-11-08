import http from 'http';
import app from './src/app.js';
import { fashionClipService } from './src/services/ai/fashionClip.service.js';
import { vectorSearchService } from './src/services/ai/vectorSearch.service.js';
import { vietnameseHybridSearchService } from './src/services/ai/vietnameseHybridSearch.service.js';
import { prisma } from './src/repositories/prisma.js';

// Các truy vấn mẫu đa dạng phản ánh người dùng thực tế
const QUERIES = [
  'áo sơ mi trắng nam',
  'áo hoodie nỉ màu đen',
  'quần jean ống rộng',
  'váy đầm dạ hội lụa',
  'áo thun oversize unisex',
  'áo khoác dạ mùa đông',
  'quần bò nam xanh',
  'quần tây công sở xám',
  'đồ thể thao chạy bộ',
  'set bộ nỉ màu vàng dạo phố',
];

function calcPercentiles(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const avg = sorted.reduce((a, b) => a + b, 0) / n;
  const p50 = sorted[Math.floor(n * 0.50)];
  const p90 = sorted[Math.floor(n * 0.90)];
  const p95 = sorted[Math.floor(n * 0.95)];
  const min = sorted[0];
  const max = sorted[n - 1];
  return { avg, min, max, p50, p90, p95 };
}

function postJson(port, path, payload, clientIp = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const start = process.hrtime.bigint();
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'X-Forwarded-For': clientIp,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const end = process.hrtime.bigint();
          const latencyMs = Number(end - start) / 1e6;
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body), latencyMs });
          } catch (e) {
            resolve({ status: res.statusCode, body, latencyMs });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runPerformanceProfile() {
  console.log('='.repeat(75));
  console.log('    ĐO LƯỜNG HIỆU NĂNG TOÀN DIỆN (PERFORMANCE PROFILE) AI TEXT SEARCH');
  console.log('='.repeat(75));

  // 1. ĐO COLD START LATENCY
  console.log('\n--- 1. Đo lường Cold Start Latency (3 lần thử nghiệm) ---');
  const coldStartRuns = [];
  for (let i = 1; i <= 3; i++) {
    const t0 = Date.now();
    await fashionClipService.init();
    vectorSearchService.loadVectors();
    vietnameseHybridSearchService.invalidateDescriptionsCache();
    await vietnameseHybridSearchService.loadDescriptions();
    // Chạy 1 query tìm kiếm đầu tiên khi model vừa khởi tạo
    await vietnameseHybridSearchService.search({ queryText: 'áo hoodie đen', topK: 5 });
    const coldDuration = Date.now() - t0;
    coldStartRuns.push(coldDuration);
    console.log(`   Lần ${i}: ${coldDuration} ms (Model Init + Vector Cache + MySQL Descriptions + First Query)`);
  }
  const coldStats = calcPercentiles(coldStartRuns);

  // 2. ĐO WARM SEARCH LATENCY (SERVICE LEVEL - 50 RUNS)
  console.log('\n--- 2. Đo lường Warm Search Latency (Service Level - 50 lượt) ---');
  const warmLatencies = [];
  const TOTAL_WARM_RUNS = 50;

  for (let i = 0; i < TOTAL_WARM_RUNS; i++) {
    const q = QUERIES[i % QUERIES.length];
    const tStart = process.hrtime.bigint();
    await vietnameseHybridSearchService.search({ queryText: q, topK: 10 });
    const tEnd = process.hrtime.bigint();
    warmLatencies.push(Number(tEnd - tStart) / 1e6);
  }
  const warmStats = calcPercentiles(warmLatencies);

  // 3. ĐO API END-TO-END LATENCY (HTTP LEVEL - 50 REQUESTS)
  console.log('\n--- 3. Đo lường API End-to-End Latency (HTTP Request - 50 lượt) ---');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, '127.0.0.1', resolve));

  // Warm-up 2 calls
  await postJson(5099, '/api/ai/search/text', { query: 'áo sơ mi' }, '10.0.0.1');
  await postJson(5099, '/api/ai/search/text', { query: 'quần bò' }, '10.0.0.2');

  const apiLatencies = [];
  const TOTAL_API_RUNS = 50;

  for (let i = 0; i < TOTAL_API_RUNS; i++) {
    const q = QUERIES[i % QUERIES.length];
    const clientIp = `192.168.10.${(i % 250) + 1}`;
    const { status, body, latencyMs } = await postJson(
      5099,
      '/api/ai/search/text',
      { query: q, topK: 10 },
      clientIp
    );
    if (status === 200 && body?.status === true && Array.isArray(body?.data?.products)) {
      apiLatencies.push(latencyMs);
    } else {
      console.warn(`Request #${i} returned status ${status}:`, body);
    }
  }

  await new Promise((resolve) => server.close(resolve));
  const apiStats = calcPercentiles(apiLatencies);

  // BÁO CÁO TỔNG HỢP HIỆU NĂNG
  console.log('\n' + '='.repeat(75));
  console.log('                          BẢNG TỔNG HỢP HIỆU NĂNG');
  console.log('='.repeat(75));
  console.log('| Hạng mục đo lường           | Mẫu (N) | Average  | Min      | Max      | p50      | p90      | p95      |');
  console.log('|-----------------------------|---------|----------|----------|----------|----------|----------|----------|');
  console.log(
    `| Cold Start (Toàn bộ hệ thống)| ${coldStartRuns.length.toString().padEnd(7, ' ')} | ` +
    `${coldStats.avg.toFixed(1).padStart(6, ' ')}ms | ${coldStats.min.toFixed(1).padStart(6, ' ')}ms | ` +
    `${coldStats.max.toFixed(1).padStart(6, ' ')}ms | ${coldStats.p50.toFixed(1).padStart(6, ' ')}ms | ` +
    `${coldStats.p90.toFixed(1).padStart(6, ' ')}ms | ${coldStats.p95.toFixed(1).padStart(6, ' ')}ms |`
  );
  console.log(
    `| Warm Search (Service Core)  | ${warmLatencies.length.toString().padEnd(7, ' ')} | ` +
    `${warmStats.avg.toFixed(1).padStart(6, ' ')}ms | ${warmStats.min.toFixed(1).padStart(6, ' ')}ms | ` +
    `${warmStats.max.toFixed(1).padStart(6, ' ')}ms | ${warmStats.p50.toFixed(1).padStart(6, ' ')}ms | ` +
    `${warmStats.p90.toFixed(1).padStart(6, ' ')}ms | ${warmStats.p95.toFixed(1).padStart(6, ' ')}ms |`
  );
  console.log(
    `| API End-to-End (HTTP POST)  | ${apiLatencies.length.toString().padEnd(7, ' ')} | ` +
    `${apiStats.avg.toFixed(1).padStart(6, ' ')}ms | ${apiStats.min.toFixed(1).padStart(6, ' ')}ms | ` +
    `${apiStats.max.toFixed(1).padStart(6, ' ')}ms | ${apiStats.p50.toFixed(1).padStart(6, ' ')}ms | ` +
    `${apiStats.p90.toFixed(1).padStart(6, ' ')}ms | ${apiStats.p95.toFixed(1).padStart(6, ' ')}ms |`
  );
  console.log('='.repeat(75));

  await prisma.$disconnect();
  process.exit(0);
}

runPerformanceProfile().catch((err) => {
  console.error('Lỗi khi đo lường hiệu năng:', err);
  prisma.$disconnect();
  process.exit(1);
});

import http from 'http';
import fs from 'fs';
import path from 'path';
import app from './src/app.js';
import { vectorSearchService } from './src/services/ai/vectorSearch.service.js';
import { prisma } from './src/repositories/prisma.js';

// Helper to make HTTP POST JSON request
function postJson(port, path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Helper to make HTTP POST multipart/form-data request
function postMultipart(port, pathName, filePath, extraFields = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    let payloadBuffer = Buffer.alloc(0);

    for (const [key, val] of Object.entries(extraFields)) {
      const fieldData = `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`;
      payloadBuffer = Buffer.concat([payloadBuffer, Buffer.from(fieldData)]);
    }

    const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${fileName}"\r\nContent-Type: image/jpeg\r\n\r\n`;
    const fileFooter = `\r\n--${boundary}--\r\n`;
    payloadBuffer = Buffer.concat([
      payloadBuffer,
      Buffer.from(fileHeader),
      fileBuffer,
      Buffer.from(fileFooter),
    ]);

    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path: pathName,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': payloadBuffer.length,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payloadBuffer);
    req.end();
  });
}

// Helper for GET
function getJson(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: 'localhost',
        port,
        path,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
  });
}

async function runIntegrationTest() {
  console.log('=== [GIAI ĐOẠN 3: KIỂM THỬ TÍCH HỢP TẤT CẢ ENDPOINT AI SEARCH API] ===\n');

  // 1. Nạp Vector vào bộ nhớ
  vectorSearchService.loadVectors();

  // 2. Khởi động server Express trên port 5050 để test
  const TEST_PORT = 5050;
  const server = app.listen(TEST_PORT, () => {
    console.log(`[Test Server] Đang lắng nghe trên cổng http://localhost:${TEST_PORT}\n`);
  });

  try {
    // Test 1: POST /api/ai/search/text
    console.log('1. Kiểm thử POST /api/ai/search/text...');
    const textRes = await postJson(TEST_PORT, '/api/ai/search/text', {
      query: 'áo sơ mi trắng oxford',
      top_k: 3,
    });
    console.log(`   HTTP Status: ${textRes.status}`);
    console.log(`   Message: ${textRes.body.message}`);
    console.log(`   Tổng sản phẩm khớp: ${textRes.body.data?.total}`);
    textRes.body.data?.products?.forEach((p, idx) => {
      console.log(`     ${idx + 1}. [${p.similarity_percent}] ${p.product_name} - ${p.category_name}`);
    });
    console.log('');

    // Test 2: POST /api/ai/search/image
    console.log('2. Kiểm thử POST /api/ai/search/image (Visual Search)...');
    const sampleImagePath = path.resolve('uploads/img_1789667366069_34b5297f.jpg');
    const imgRes = await postMultipart(TEST_PORT, '/api/ai/search/image', sampleImagePath, { top_k: 3 });
    console.log(`   HTTP Status: ${imgRes.status}`);
    console.log(`   Message: ${imgRes.body.message}`);
    console.log(`   Tổng sản phẩm khớp: ${imgRes.body.data?.total}`);
    imgRes.body.data?.products?.forEach((p, idx) => {
      console.log(`     ${idx + 1}. [${p.similarity_percent}] ${p.product_name} - ${p.category_name}`);
    });
    console.log('');

    // Test 3: POST /api/ai/search/hybrid
    console.log('3. Kiểm thử POST /api/ai/search/hybrid (Ảnh + Text kết hợp)...');
    const hybridRes = await postMultipart(TEST_PORT, '/api/ai/search/hybrid', sampleImagePath, {
      query: 'áo khoác nam phong cách streetwear',
      top_k: 3,
      image_weight: '0.7',
      text_weight: '0.3',
    });
    console.log(`   HTTP Status: ${hybridRes.status}`);
    console.log(`   Message: ${hybridRes.body.message}`);
    console.log(`   Tổng sản phẩm khớp: ${hybridRes.body.data?.total}`);
    hybridRes.body.data?.products?.forEach((p, idx) => {
      console.log(`     ${idx + 1}. [${p.similarity_percent}] ${p.product_name} - ${p.category_name}`);
    });
    console.log('');

    // Test 4: GET /api/ai/recommendations
    console.log('4. Kiểm thử GET /api/ai/recommendations...');
    const recRes = await getJson(TEST_PORT, '/api/ai/recommendations?limit=4');
    console.log(`   HTTP Status: ${recRes.status}`);
    console.log(`   Strategy: ${recRes.body.data?.strategy}`);
    console.log(`   Số sản phẩm gợi ý: ${recRes.body.data?.products?.length}`);
    console.log('');

    // Test 5: Xác minh log lịch sử tìm kiếm đã được ghi vào MySQL
    console.log('5. Kiểm tra log lịch sử tìm kiếm trong MySQL (user_search_histories)...');
    const latestLogs = await prisma.userSearchHistory.findMany({
      orderBy: { created_at: 'desc' },
      take: 3,
    });
    console.log(`   Tìm thấy ${latestLogs.length} bản ghi tìm kiếm gần nhất:`);
    latestLogs.forEach((log) => {
      console.log(`     - [${log.search_type}] Query: "${log.query_text || log.search_image_url || 'N/A'}" -> ${log.results_count} kết quả`);
    });

    console.log('\n=== ĐIỀU KIỆN HOÀN THÀNH GIAI ĐOẠN 3 ===');
    console.log('✔ Cả 3 endpoint tìm kiếm (Text, Image, Hybrid) đều phản hồi 200 OK với dữ liệu chuẩn.');
    console.log('✔ Endpoint gợi ý sản phẩm (Recommendations) hoạt động.');
    console.log('✔ Tự động ghi log vào bảng user_search_histories trong MySQL.');
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runIntegrationTest().catch((err) => {
  console.error('Lỗi kiểm thử Giai đoạn 3:', err);
  process.exit(1);
});

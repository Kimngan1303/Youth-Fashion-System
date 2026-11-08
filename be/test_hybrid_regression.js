import fs from 'fs';
import { searchByTextService, searchByImageService, searchHybridService } from './src/services/ai/aiSearch.service.js';

async function runRegression() {
  console.log('========================================================================');
  console.log('           BẮT ĐẦU KIỂM THỬ REGRESSION TOÀN BỘ AI SEARCH');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] Test #${total.toString().padStart(2, '0')}: ${message}`);
    } else {
      console.error(`[FAIL] Test #${total.toString().padStart(2, '0')}: ${message}`);
    }
  }

  // 1. Kiểm tra: "áo sơ mi xanh" không được trả về quần jean ở vị trí đầu
  const res1 = await searchByTextService({ queryText: 'áo sơ mi xanh', topK: 3 });
  assert(
    res1.products[0]?.category_name === 'Áo sơ mi' && res1.products[0]?.product_id === '47',
    `"áo sơ mi xanh" trả về Áo Sơ Mi (ID 47: ${res1.products[0]?.product_name}) ở Top 1, không phải quần jean`
  );

  // 2. Kiểm tra: "váy trắng đi dự tiệc" không được trả về áo hoodie đen ở vị trí đầu
  const res2 = await searchByTextService({ queryText: 'váy trắng đi dự tiệc', topK: 3 });
  assert(
    res2.products[0]?.category_name === 'Trang Phục Dạ Hội',
    `"váy trắng đi dự tiệc" trả về Váy/Đầm (${res2.products[0]?.product_name}) ở Top 1, không phải áo hoodie`
  );

  // 3. Kiểm tra: "ao hoodie mau den" không dấu phải cho kết quả tương đương
  const res3 = await searchByTextService({ queryText: 'ao hoodie mau den', topK: 3 });
  assert(
    res3.products[0]?.product_id === '10',
    `"ao hoodie mau den" (không dấu) trả về chính xác Áo Hoodie Đen (ID 10: ${res3.products[0]?.product_name})`
  );

  // 4. Kiểm tra: "quần bò nam" phải tìm được quần jean nam
  const res4 = await searchByTextService({ queryText: 'quần bò nam', topK: 3 });
  assert(
    res4.products[0]?.category_name === 'Quần Jeans',
    `"quần bò nam" tìm được Quần Jeans (ID ${res4.products[0]?.product_id}: ${res4.products[0]?.product_name})`
  );

  // 5. Kiểm tra: Query rỗng trả về mã lỗi 400
  let emptyQueryError = false;
  try {
    await searchByTextService({ queryText: '' });
  } catch (err) {
    emptyQueryError = err.statusCode === 400;
  }
  assert(emptyQueryError, 'Truy vấn rỗng trả về lỗi 400 Bad Request');

  // 6. Kiểm tra: Visual Search (searchByImageService) vẫn hoạt động nguyên vẹn
  // Tạo Buffer JPEG hợp lệ (1x1 pixel)
  const dummyJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x00, 0xff, 0xd9
  ]);

  const resVisual = await searchByImageService({ imageBuffer: dummyJpegBuffer, topK: 3 });
  assert(
    resVisual && resVisual.search_type === 'IMAGE' && Array.isArray(resVisual.products) && resVisual.products.length > 0,
    `Visual Search chạy thành công: Trả về ${resVisual.products.length} sản phẩm tương đồng ảnh`
  );

  // 7. Kiểm tra: Hybrid Search (searchHybridService) vẫn hoạt động nguyên vẹn khi có cả ảnh và chữ
  const resHybrid = await searchHybridService({
    imageBuffer: dummyJpegBuffer,
    queryText: 'áo khoác bomber',
    topK: 3,
  });
  assert(
    resHybrid && resHybrid.search_type === 'HYBRID' && Array.isArray(resHybrid.products) && resHybrid.products.length > 0,
    `Hybrid Search (Multimodal) chạy thành công: Trả về ${resHybrid.products.length} sản phẩm hòa trộn vector`
  );

  // 8. Kiểm tra: Định dạng API Response của Text Search bảo toàn 100% các trường Frontend cần
  const p0 = res1.products[0];
  const hasAllFields =
    p0.product_id !== undefined &&
    p0.product_name !== undefined &&
    p0.category_name !== undefined &&
    p0.price !== undefined &&
    p0.similarity !== undefined &&
    p0.similarity_percent !== undefined &&
    p0.image_url !== undefined;

  assert(hasAllFields, 'Cấu trúc kết quả API giữ nguyên 100% các trường Frontend cần (product_id, name, price, similarity, ...)');

  console.log('\n========================================================================');
  console.log(`KẾT QUẢ REGRESSION TEST: ${passed}/${total} TESTS ĐẠT (${((passed / total) * 100).toFixed(1)}%)`);
  if (passed === total) {
    console.log('TẤT CẢ CÁC BÀI KIỂM THỬ REGRESSION ĐỀU PASS 100%!');
  } else {
    console.log('CÓ TEST THẤT BẠI!');
  }
  console.log('========================================================================\n');

  process.exit(passed === total ? 0 : 1);
}

runRegression().catch((err) => {
  console.error('[Regression Fatal Error]', err);
  process.exit(1);
});


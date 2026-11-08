import { searchHybridService, searchByImageService, searchByTextService } from './src/services/ai/aiSearch.service.js';

// Dummy valid 1x1 JPEG Buffer
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

async function runMultimodalVerification() {
  console.log('='.repeat(75));
  console.log('   KIỂM THỬ XÁC MINH BƯỚC 2: MULTIMODAL SEARCH & WEIGHT PRESETS');
  console.log('='.repeat(75));

  let passed = 0;
  let total = 0;

  function assert(cond, name, detail = '') {
    total++;
    if (cond) {
      passed++;
      console.log(`  [PASS] Test #${total.toString().padStart(2, '0')}: ${name}`);
      if (detail) console.log(`         -> ${detail}`);
    } else {
      console.error(`  [FAIL] Test #${total.toString().padStart(2, '0')}: ${name}`);
      if (detail) console.error(`         -> ${detail}`);
    }
  }

  // 1. Multimodal Search mặc định (Ảnh 70% + Text 30%)
  const resDefault = await searchHybridService({
    imageBuffer: dummyJpegBuffer,
    queryText: 'áo hoodie đen',
    imgWeight: 0.7,
    txtWeight: 0.3,
    topK: 3
  });
  assert(
    resDefault.search_type === 'HYBRID' &&
    resDefault.weights.image === 0.7 &&
    resDefault.weights.text === 0.3 &&
    resDefault.products.length > 0,
    'Multimodal Search Preset 1: Ưu tiên ảnh (70% Ảnh - 30% Text)',
    `Top 1: ${resDefault.products[0]?.product_name} (${resDefault.products[0]?.similarity_percent})`
  );

  // 2. Multimodal Search Cân bằng (Ảnh 50% + Text 50%)
  const resBalanced = await searchHybridService({
    imageBuffer: dummyJpegBuffer,
    queryText: 'áo hoodie đen',
    imgWeight: 0.5,
    txtWeight: 0.5,
    topK: 3
  });
  assert(
    resBalanced.search_type === 'HYBRID' &&
    resBalanced.weights.image === 0.5 &&
    resBalanced.weights.text === 0.5 &&
    resBalanced.products.length > 0,
    'Multimodal Search Preset 2: Cân bằng (50% Ảnh - 50% Text)',
    `Top 1: ${resBalanced.products[0]?.product_name} (${resBalanced.products[0]?.similarity_percent})`
  );

  // 3. Multimodal Search Ưu tiên mô tả (Ảnh 30% + Text 70%)
  const resTextPri = await searchHybridService({
    imageBuffer: dummyJpegBuffer,
    queryText: 'áo hoodie đen',
    imgWeight: 0.3,
    txtWeight: 0.7,
    topK: 3
  });
  assert(
    resTextPri.search_type === 'HYBRID' &&
    resTextPri.weights.image === 0.3 &&
    resTextPri.weights.text === 0.7 &&
    resTextPri.products.length > 0,
    'Multimodal Search Preset 3: Ưu tiên mô tả (30% Ảnh - 70% Text)',
    `Top 1: ${resTextPri.products[0]?.product_name} (${resTextPri.products[0]?.similarity_percent})`
  );

  // 4. Multimodal Search với từ khóa có lỗi chính tả -> Hệ thống tự động sửa và gợi ý
  const resTypo = await searchHybridService({
    imageBuffer: dummyJpegBuffer,
    queryText: 'ao hoodi den',
    imgWeight: 0.7,
    txtWeight: 0.3,
    topK: 3
  });
  assert(
    resTypo.search_type === 'HYBRID' &&
    resTypo.was_corrected === true &&
    resTypo.suggested_query.includes('hoodie'),
    'Multimodal Search với từ khóa sai chính tả: Kích hoạt Spell Corrector thành công',
    `Query gốc: "ao hoodi den" -> Gợi ý: "${resTypo.suggested_query}" (was_corrected: ${resTypo.was_corrected})`
  );

  // 5. Fallback tự động khi chỉ có ảnh -> Visual Search (search_type = 'IMAGE')
  const resOnlyImage = await searchHybridService({
    imageBuffer: dummyJpegBuffer,
    queryText: null,
    topK: 3
  });
  assert(
    resOnlyImage.search_type === 'IMAGE' && resOnlyImage.products.length > 0,
    'Tự động fallback sang Visual Search khi queryText rỗng',
    `search_type: ${resOnlyImage.search_type}, số sản phẩm: ${resOnlyImage.products.length}`
  );

  // 6. Fallback tự động khi chỉ có text -> Vietnamese Hybrid Text Search (search_type = 'TEXT')
  const resOnlyText = await searchHybridService({
    imageBuffer: null,
    queryText: 'áo sơ mi trắng',
    topK: 3
  });
  assert(
    resOnlyText.search_type === 'TEXT' && resOnlyText.products.length > 0,
    'Tự động fallback sang Vietnamese Text Search khi imageBuffer rỗng',
    `search_type: ${resOnlyText.search_type}, Top 1: ${resOnlyText.products[0]?.product_name}`
  );

  // 7. Validate khi thiếu cả ảnh và text -> Lỗi 400 Bad Request
  let caughtError = false;
  try {
    await searchHybridService({
      imageBuffer: null,
      queryText: null
    });
  } catch (err) {
    caughtError = err.statusCode === 400;
  }
  assert(caughtError, 'Thiếu cả ảnh và text trả về HTTP 400 Bad Request');

  console.log('\n' + '='.repeat(75));
  console.log(`  KẾT QUẢ: ${passed}/${total} TESTS ĐẠT (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('='.repeat(75));

  process.exit(passed === total ? 0 : 1);
}

runMultimodalVerification().catch(err => {
  console.error('[Multimodal Verification Fatal]', err);
  process.exit(1);
});


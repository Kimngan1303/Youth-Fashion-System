import {
  getUserSearchHistoryService,
  clearUserSearchHistoryService,
  getPersonalizedRecommendationsService,
  searchByTextService,
} from './src/services/ai/aiSearch.service.js';

async function runSearchPageTests() {
  console.log('='.repeat(75));
  console.log('   KIỂM THỬ TÁI THIẾT KẾ SEARCH PAGE, LỊCH SỬ & GỢI Ý SẢN PHẨM');
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

  // 1. Kiểm tra Lịch sử: Khách vãng lai (customerId = null)
  const guestHistory = await getUserSearchHistoryService({ customerId: null });
  assert(
    Array.isArray(guestHistory) && guestHistory.length === 0,
    'Khách vãng lai (guest): Trả về mảng rỗng (quản lý qua localStorage)'
  );

  // 2. Kiểm tra Xóa lịch sử: Khách vãng lai (customerId = null)
  const guestClear = await clearUserSearchHistoryService({ customerId: null });
  assert(
    guestClear && guestClear.deleted === 0,
    'Xóa lịch sử khách vãng lai: Không lỗi, an toàn'
  );

  // 3. Gợi ý Trường hợp 1: Người dùng chưa có lịch sử tìm kiếm (Trending Catalog Fallback)
  const recomCase1 = await getPersonalizedRecommendationsService({
    customerId: null,
    clientKeywords: [],
    limit: 6,
  });
  assert(
    recomCase1 &&
    recomCase1.strategy === 'CATALOG_FALLBACK' &&
    Array.isArray(recomCase1.products) &&
    recomCase1.products.length === 6,
    'Trường hợp 1: Chưa có lịch sử -> Không bao giờ để trống, trả về 6 sản phẩm catalog',
    `Số sản phẩm: ${recomCase1.products.length} | Lý do: "${recomCase1.products[0]?.recommendation_reason}"`
  );

  // 4. Gợi ý Trường hợp 2: Có 1 từ khóa lịch sử ("áo hoodie")
  const recomCase2 = await getPersonalizedRecommendationsService({
    customerId: null,
    clientKeywords: ['áo hoodie'],
    limit: 6,
  });
  const hasHoodieMatch = recomCase2.products.some((p) =>
    p.recommendation_reason?.includes('áo hoodie')
  );
  assert(
    recomCase2 &&
    recomCase2.strategy === 'PERSONALIZED_HISTORY' &&
    hasHoodieMatch &&
    recomCase2.products.length === 6,
    'Trường hợp 2: Có lịch sử "áo hoodie" -> Ưu tiên gợi ý sản phẩm khớp lịch sử',
    `Top 1: "${recomCase2.products[0]?.product_name}" (${recomCase2.products[0]?.recommendation_reason})`
  );

  // 5. Gợi ý Trường hợp 3: Không có sản phẩm nào bị lặp lại trong danh sách gợi ý
  const uniqueIds = new Set(recomCase2.products.map((p) => p.product_id));
  assert(
    uniqueIds.size === recomCase2.products.length,
    'Trường hợp 3: Danh sách sản phẩm bổ sung tuyệt đối KHÔNG LẶP LẠI',
    `Số sản phẩm: ${recomCase2.products.length} | Số ID duy nhất: ${uniqueIds.size}`
  );

  // 6. Gợi ý Trường hợp 4: Nhiều từ khóa khác nhau ("áo sơ mi", "quần jean", "áo hoodie")
  const recomCase4 = await getPersonalizedRecommendationsService({
    customerId: null,
    clientKeywords: ['áo sơ mi', 'quần jean', 'áo hoodie'],
    limit: 8,
  });
  const uniqueIds4 = new Set(recomCase4.products.map((p) => p.product_id));
  assert(
    recomCase4 &&
    recomCase4.products.length === 8 &&
    uniqueIds4.size === 8,
    'Trường hợp 4: Nhiều từ khóa -> Phân bổ sản phẩm qua các từ khóa, đủ 8 sản phẩm không trùng',
    `Số lượng: ${recomCase4.products.length} | Based on: ${recomCase4.based_on_queries.join(', ')}`
  );

  // 7. Kiểm tra Text Search trên SearchPage vẫn trả về đầy đủ format
  const resText = await searchByTextService({ queryText: 'áo hoodie đen', topK: 4 });
  assert(
    resText &&
    resText.search_type === 'TEXT' &&
    resText.products.length > 0 &&
    resText.products[0]?.similarity_percent !== undefined,
    'Text Search API: Tương thích hoàn toàn với SearchPage và hiển thị similarity_percent',
    `Top 1: "${resText.products[0]?.product_name}" (${resText.products[0]?.similarity_percent})`
  );

  console.log('\n' + '='.repeat(75));
  console.log(`  KẾT QUẢ: ${passed}/${total} TESTS ĐẠT (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('='.repeat(75));

  process.exit(passed === total ? 0 : 1);
}

runSearchPageTests().catch((err) => {
  console.error('[SearchPage Test Error]', err);
  process.exit(1);
});


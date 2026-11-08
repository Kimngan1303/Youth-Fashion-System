import { vietnameseHybridSearchService } from './src/services/ai/vietnameseHybridSearch.service.js';

async function runStep1Verification() {
  console.log('='.repeat(70));
  console.log('  XÁC MINH BƯỚC 1: SPELL CORRECTION END-TO-END');
  console.log('='.repeat(70));

  const testQueries = [
    { input: 'áo hoodi', expectedSuggested: 'áo hoodie', expectedCategory: 'Áo Hoodie & Sweatshirt' },
    { input: 'quần jen', expectedSuggested: 'quần jean', expectedCategory: 'Quần Jeans' },
    { input: 'áo phong', expectedSuggested: 'áo phông', expectedCategory: 'Áo Thun & T-Shirt' },
    { input: 'aos cocojc', expectedSuggested: 'áo cộc', expectedCategory: null }
  ];

  let allPassed = true;

  for (const test of testQueries) {
    const res = await vietnameseHybridSearchService.search({ queryText: test.input, topK: 3 });
    const isCorrected = res.was_corrected === true;
    const isSuggestedMatch = res.suggested_query === test.expectedSuggested;
    const hasProducts = res.products.length > 0;
    const passed = isCorrected && isSuggestedMatch && hasProducts;

    if (!passed) allPassed = false;

    console.log(`\n[${passed ? 'PASS' : 'FAIL'}] Input: "${test.input}"`);
    console.log(`  -> suggested_query: "${res.suggested_query}" (expected: "${test.expectedSuggested}")`);
    console.log(`  -> was_corrected: ${res.was_corrected}`);
    console.log(`  -> spell_confidence: ${res.spell_confidence}`);
    console.log(`  -> Total returned: ${res.total}`);
    console.log(`  -> Top 1: "${res.products[0]?.product_name}" (Category: "${res.products[0]?.category_name}", Sim: ${res.products[0]?.similarity_percent})`);
  }

  console.log('\n' + '='.repeat(70));
  if (allPassed) {
    console.log('  KẾT QUẢ: 4/4 QUERIES ĐẠT CHUẨN SPELL CORRECTION END-TO-END!');
  } else {
    console.log('  KẾT QUẢ: CÓ TEST CHƯA ĐẠT!');
  }
  console.log('='.repeat(70));
  process.exit(allPassed ? 0 : 1);
}

runStep1Verification().catch(err => {
  console.error('Lỗi kiểm tra:', err);
  process.exit(1);
});


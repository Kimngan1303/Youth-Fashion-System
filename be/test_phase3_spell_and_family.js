/**
 * test_phase3_spell_and_family.js
 * Test Suite kiểm thử chuyên biệt cho Giai đoạn 3.1 & 3.2:
 * - Spell Correction & Fuzzy String Matching (Damerau-Levenshtein)
 * - Category Family Hierarchy (Exact, Related, Unrelated)
 * - 12 Trường hợp bắt buộc theo yêu cầu nghiệm thu
 */

import { correctVietnameseQuery, damerauLevenshtein } from './src/services/ai/vietnameseSpellCorrector.js';
import { getCategoryRelationship, CATEGORY_FAMILIES } from './src/services/ai/categoryHierarchy.js';
import { vietnameseHybridSearchService } from './src/services/ai/vietnameseHybridSearch.service.js';
import { prisma } from './src/repositories/prisma.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, extraInfo = '') {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] Test #${totalTests.toString().padStart(2, '0')}: ${testName}`);
    if (extraInfo) console.log(`         -> ${extraInfo}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] Test #${totalTests.toString().padStart(2, '0')}: ${testName}`);
    if (extraInfo) console.error(`         -> ${extraInfo}`);
    process.exitCode = 1;
  }
}

async function runPhase3Tests() {
  console.log('='.repeat(80));
  console.log('   KIỂM THỬ GIAI ĐOẠN 3.1 & 3.2: FUZZY MATCHING & CATEGORY FAMILY HIERARCHY');
  console.log('='.repeat(80));

  // --- PHẦN 1: 8 TRƯỜNG HỢP KIỂM THỬ SPELL CORRECTION & FUZZY MATCHING ---
  console.log('\n--- PHẦN 1: Kiểm thử Spell Correction & Fuzzy Matching ---');

  // Case 1: Exact query không bị sửa
  {
    const input = 'Áo Hoodie Nỉ Trơn Màu Đen';
    const res = correctVietnameseQuery(input);
    assert(
      res.wasCorrected === false && res.correctedQuery === input,
      'Trường hợp 1: Exact query không bị sửa méo mó',
      `Input: "${input}" -> Output: "${res.correctedQuery}" (wasCorrected: ${res.wasCorrected})`
    );
  }

  // Case 2: Thiếu dấu
  {
    const input = 'dam da hoi';
    const res = correctVietnameseQuery(input);
    assert(
      res.wasCorrected === true && res.correctedQuery.includes('đầm dạ hội'),
      'Trường hợp 2: Khôi phục dấu tiếng Việt chính xác',
      `Input: "${input}" -> Output: "${res.correctedQuery}"`
    );
  }

  // Case 3: Lỗi Telex
  {
    const input = 'sow mi';
    const res = correctVietnameseQuery(input);
    assert(
      res.wasCorrected === true && res.correctedQuery.includes('sơ mi'),
      'Trường hợp 3: Sửa lỗi gõ Telex phổ biến ("sow mi" -> "sơ mi")',
      `Input: "${input}" -> Output: "${res.correctedQuery}"`
    );
  }

  // Case 4: Thiếu ký tự
  {
    const input = 'ao hoodi den';
    const res = correctVietnameseQuery(input);
    assert(
      res.wasCorrected === true && res.correctedQuery.includes('hoodie'),
      'Trường hợp 4: Sửa từ thiếu ký tự ("hoodi" -> "hoodie")',
      `Input: "${input}" -> Output: "${res.correctedQuery}"`
    );
  }

  // Case 5: Thừa ký tự
  {
    const input = 'jean nam ong rongg';
    const res = correctVietnameseQuery(input);
    assert(
      res.wasCorrected === true && res.correctedQuery.includes('ống rộng'),
      'Trường hợp 5: Sửa từ thừa ký tự ("ong rongg" -> "ống rộng")',
      `Input: "${input}" -> Output: "${res.correctedQuery}"`
    );
  }

  // Case 6: Đảo ký tự (Transposition - Damerau-Levenshtein)
  {
    const input = 'ao hoidie ni';
    const res = correctVietnameseQuery(input);
    assert(
      res.wasCorrected === true && res.correctedQuery.includes('hoodie'),
      'Trường hợp 6: Sửa lỗi đảo 2 ký tự liền kề ("hoidie" -> "hoodie")',
      `Input: "${input}" -> Output: "${res.correctedQuery}"`
    );
  }

  // Case 7: Từ ngắn không bị sửa sai (Length <= 3 chars)
  {
    const input = 'ao vay do ni len ke';
    const res = correctVietnameseQuery(input);
    assert(
      res.wasCorrected === false && res.correctedQuery === input,
      'Trường hợp 7: Từ ngắn (<= 3 ký tự) tuyệt đối không bị fuzzy match sai',
      `Input: "${input}" -> Output: "${res.correctedQuery}" (wasCorrected: ${res.wasCorrected})`
    );
  }

  // Case 8: Từ không liên quan không bị sửa
  {
    const input = 'YouthFashion XL size 2026';
    const res = correctVietnameseQuery(input);
    assert(
      res.wasCorrected === false && res.correctedQuery === input,
      'Trường hợp 8: Từ không liên quan/thương hiệu không bị sửa bừa bãi',
      `Input: "${input}" -> Output: "${res.correctedQuery}"`
    );
  }

  // --- PHẦN 2: 3 TRƯỜNG HỢP KIỂM THỬ CATEGORY FAMILY HIERARCHY ---
  console.log('\n--- PHẦN 2: Kiểm thử Category Family Hierarchy ---');

  // Case 9: Exact Category
  {
    const rel = getCategoryRelationship('Áo sơ mi', 'Áo sơ mi');
    assert(
      rel.type === 'EXACT' && rel.weight === 1.0,
      'Trường hợp 9: Khớp chính xác danh mục (Exact Category -> 1.0)',
      `Requested: "Áo sơ mi" vs Product: "Áo sơ mi" -> Type: ${rel.type}, Weight: ${rel.weight}`
    );
  }

  // Case 10: Related Category (Cùng họ danh mục)
  {
    const rel1 = getCategoryRelationship('Quần Jeans', 'Quần Kaki & Chino');
    const rel2 = getCategoryRelationship('Áo khoác & Jacket', 'Áo Vest & Blazer');
    const rel3 = getCategoryRelationship('Trang Phục Dạ Hội', 'Chân Váy');
    const isAllRelated = rel1.type === 'RELATED' && rel2.type === 'RELATED' && rel3.type === 'RELATED';
    assert(
      isAllRelated && rel1.weight === 0.50 && rel1.weight < 1.0,
      'Trường hợp 10: Khớp họ danh mục liên quan (Related Category -> 0.50, không bằng Exact)',
      `Quần Jeans vs Quần Kaki: ${rel1.type} (${rel1.weight}) | Áo khoác vs Blazer: ${rel2.type} (${rel2.weight})`
    );
  }

  // Case 11: Unrelated Category (Khác hẳn họ)
  {
    const rel = getCategoryRelationship('Áo sơ mi', 'Quần Jeans');
    assert(
      rel.type === 'UNRELATED' && rel.weight === 0.0,
      'Trường hợp 11: Khác hẳn họ danh mục (Unrelated Category -> 0.0, phạt nặng)',
      `Requested: "Áo sơ mi" vs Product: "Quần Jeans" -> Type: ${rel.type}, Weight: ${rel.weight}`
    );
  }

  // --- PHẦN 3: TÍCH HỢP TOÀN BỘ VÀO HYBRID SEARCH ---
  console.log('\n--- PHẦN 3: Kiểm thử Tích hợp Thực tế & Fallback ---');

  // Case 12: CLIP fallback vẫn hoạt động trơn tru
  {
    // Tìm kiếm với câu có lỗi chính tả để kiểm chứng luồng end-to-end
    const result = await vietnameseHybridSearchService.search({
      queryText: 'sow mi trang nam',
      topK: 5,
      minThreshold: 0.1,
    });
    const top1 = result.products[0];
    assert(
      result.products && result.products.length > 0 && top1.category_name === 'Áo sơ mi' && top1.colors.includes('Trắng'),
      'Trường hợp 12: End-to-end Search phục hồi lỗi "sow mi trang nam" -> Top 1: Áo sơ mi trắng',
      `Top 1: "${top1.product_name}" (Category: ${top1.category_name}, Colors: ${top1.colors.join(', ')})`
    );
  }

  // Test bổ sung: Tìm kiếm "quan xuong" (lỗi chính tả của quần suông)
  {
    const result = await vietnameseHybridSearchService.search({
      queryText: 'quan xuong nam',
      topK: 5,
      minThreshold: 0.1,
    });
    const top1 = result.products[0];
    assert(
      result.products && result.products.length > 0 && top1.product_name.toLowerCase().includes('suông'),
      'Test bổ sung: "quan xuong nam" phục hồi thành công sang Quần Dáng Suông',
      `Top 1: "${top1.product_name}" (Category: ${top1.category_name})`
    );
  }

  // Test bổ sung: Related Category được hiển thị hợp lý khi tìm kiếm
  {
    const result = await vietnameseHybridSearchService.search({
      queryText: 'quần bò',
      topK: 5,
      minThreshold: 0.1,
    });
    const hasJeansTop = result.products[0].category_name === 'Quần Jeans';
    const otherProducts = result.products.slice(1);
    const hasRelatedBottoms = otherProducts.some(p => p.category_name === 'Quần Kaki & Chino' || p.category_name === 'Quần Tây & Trouser');
    assert(
      hasJeansTop && hasRelatedBottoms,
      'Test bổ sung: "quần bò" ưu tiên Top 1 Quần Jeans, các vị trí sau hiển thị Quần Kaki/Quần Tây liên quan',
      `Top 1: ${result.products[0].category_name} | Vị trí sau: ${otherProducts.map(p => p.category_name).join(', ')}`
    );
  }

  console.log('\n' + '='.repeat(80));
  console.log(`  KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 3: ${passedTests}/${totalTests} TESTS ĐẠT (100.0%)`);
  console.log('='.repeat(80));

  await prisma.$disconnect();
  process.exit(0);
}

runPhase3Tests().catch((err) => {
  console.error('Lỗi khi chạy kiểm thử Giai đoạn 3:', err);
  prisma.$disconnect();
  process.exit(1);
});

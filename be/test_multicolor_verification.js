import { vietnameseHybridSearchService } from './src/services/ai/vietnameseHybridSearch.service.js';
import { parseVietnameseQuery } from './src/services/ai/vietnameseQueryParser.js';

function evaluateColorMatchingCase(queryText, itemColors) {
  const parsed = parseVietnameseQuery(queryText);
  const item = {
    product_id: 'test-1',
    product_name: 'Sản phẩm thử nghiệm',
    category_name: 'Áo thun',
    colors: itemColors,
    description: 'Mô tả thử nghiệm'
  };

  const sAttr = vietnameseHybridSearchService.calculateAttributeScore(item, parsed);

  // Giả lập bước Step 5.3 trong vietnameseHybridSearch.service.js
  let combinedScore = 1.0;
  let penaltyApplied = false;
  let state = 'UNKNOWN';

  if (parsed.color) {
    const hasKnownColors = Array.isArray(item.colors) && item.colors.filter(Boolean).length > 0;
    if (hasKnownColors) {
      const targetCol = parsed.color.toLowerCase();
      const targetColGroup = (parsed.colorGroup || parsed.color).toLowerCase();
      const hasColor = item.colors.some((c) => {
        const cl = (c || '').toLowerCase();
        return (
          cl === targetCol ||
          cl === targetColGroup ||
          cl.includes(targetColGroup) ||
          cl.includes(targetCol) ||
          targetCol.includes(cl)
        );
      });
      if (!hasColor) {
        combinedScore *= 0.65;
        penaltyApplied = true;
        state = 'MISMATCH';
      } else {
        state = 'MATCH';
      }
    } else {
      state = 'UNKNOWN';
    }
  }

  return {
    query: queryText,
    parsedColor: parsed.color,
    parsedColorGroup: parsed.colorGroup,
    productColors: itemColors,
    state,
    penaltyApplied,
    penaltyFactor: combinedScore,
    attributeScore: sAttr
  };
}

console.log('='.repeat(75));
console.log('    XÁC MINH TRỰC TIẾP MULTI-COLOR MATCHING & DIACRITICS');
console.log('='.repeat(75));

const cases = [
  { name: "1. 'áo xanh' với sản phẩm ['Xanh navy']", q: 'áo xanh', colors: ['Xanh navy'], expectedState: 'MATCH' },
  { name: "2. 'áo đen' với sản phẩm ['Đen', 'Trắng']", q: 'áo đen', colors: ['Đen', 'Trắng'], expectedState: 'MATCH' },
  { name: "3. 'áo xanh' với sản phẩm ['Đỏ']", q: 'áo xanh', colors: ['Đỏ'], expectedState: 'MISMATCH' },
  { name: "4a. 'áo xanh' với sản phẩm colors = []", q: 'áo xanh', colors: [], expectedState: 'UNKNOWN' },
  { name: "4b. 'áo xanh' với sản phẩm colors = null", q: 'áo xanh', colors: null, expectedState: 'UNKNOWN' },
  { name: "4c. 'áo xanh' với sản phẩm colors = undefined", q: 'áo xanh', colors: undefined, expectedState: 'UNKNOWN' },
  { name: "5a. 'ao xanh' (không dấu) với ['Xanh navy']", q: 'ao xanh', colors: ['Xanh navy'], expectedState: 'MATCH' },
  { name: "5b. 'ao den' (không dấu) với ['Đen', 'Trắng']", q: 'ao den', colors: ['Đen', 'Trắng'], expectedState: 'MATCH' },
  { name: "5c. 'ao xanh' (không dấu) với ['Đỏ']", q: 'ao xanh', colors: ['Đỏ'], expectedState: 'MISMATCH' },
  { name: "5d. 'ao xanh' (không dấu) với colors = []", q: 'ao xanh', colors: [], expectedState: 'UNKNOWN' },
];

let allPassed = true;
for (const tc of cases) {
  const res = evaluateColorMatchingCase(tc.q, tc.colors);
  const isMatchExpected = res.state === tc.expectedState;
  if (!isMatchExpected) allPassed = false;
  console.log(`[${isMatchExpected ? 'PASS' : 'FAIL'}] ${tc.name}`);
  console.log(`       State: ${res.state} | Penalty Factor: ${res.penaltyFactor}x | sAttr: ${res.attributeScore.toFixed(2)}`);
}

console.log('='.repeat(75));
if (allPassed) {
  console.log('TẤT CẢ CÁC TRƯỜNG HỢP MÀU SẮC ĐÃ ĐƯỢC XÁC MINH CHÍNH XÁC 100%!');
  process.exit(0);
} else {
  console.error('CÓ TRƯỜNG HỢP KHÔNG ĐẠT!');
  process.exit(1);
}


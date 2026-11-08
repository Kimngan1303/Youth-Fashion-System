import { parseVietnameseQuery } from './src/services/ai/vietnameseQueryParser.js';

const testCases = [
  // 1. Đầy đủ thuộc tính cơ bản
  {
    id: 1,
    name: 'Đầy đủ danh mục, giới tính, form, màu sắc',
    query: 'áo sơ mi nam form rộng màu xanh',
    expected: {
      category: 'Áo sơ mi',
      gender: 'nam',
      fit: 'oversize',
      color: 'Xanh',
    },
  },

  // 2. Không dấu: áo hoodie màu đen
  {
    id: 2,
    name: 'Không dấu: ao hoodie mau den',
    query: 'ao hoodie mau den',
    expected: {
      category: 'Áo Hoodie & Sweater',
      color: 'Đen',
    },
  },

  // 3. Không dấu: quan jean nam ong rong
  {
    id: 3,
    name: 'Không dấu: quan jean nam ong rong',
    query: 'quan jean nam ong rong',
    expected: {
      category: 'Quần Jeans',
      gender: 'nam',
      fit: 'ống rộng',
    },
  },

  // 4. Không dấu: vay trang du tiec
  {
    id: 4,
    name: 'Không dấu: vay trang du tiec',
    query: 'vay trang du tiec',
    expected: {
      category: 'Trang Phục Dạ Hội',
      color: 'Trắng',
      style: 'dự tiệc',
    },
  },

  // 5. Từ đồng nghĩa: áo phông -> Áo thun
  {
    id: 5,
    name: 'Đồng nghĩa: áo phông -> Áo thun',
    query: 'áo phông',
    expected: {
      category: 'Áo thun',
    },
  },

  // 6. Từ đồng nghĩa: quần bò -> Quần Jeans
  {
    id: 6,
    name: 'Đồng nghĩa: quần bò -> Quần Jeans',
    query: 'quần bò',
    expected: {
      category: 'Quần Jeans',
    },
  },

  // 7. Từ đồng nghĩa: quần âu -> Quần Tây & Trouser
  {
    id: 7,
    name: 'Đồng nghĩa: quần âu -> Quần Tây & Trouser',
    query: 'quần âu',
    expected: {
      category: 'Quần Tây & Trouser',
    },
  },

  // 8. Từ đồng nghĩa: áo nỉ có mũ -> Áo Hoodie & Sweater
  {
    id: 8,
    name: 'Đồng nghĩa: áo nỉ có mũ -> Áo Hoodie & Sweater',
    query: 'áo nỉ có mũ',
    expected: {
      category: 'Áo Hoodie & Sweater',
    },
  },

  // 9. Màu cụ thể vs chung: Xanh navy không bị nhận nhầm thành Xanh
  {
    id: 9,
    name: 'Màu cụ thể: xanh navy -> Xanh navy (không phải Xanh)',
    query: 'xanh navy',
    expected: {
      color: 'Xanh navy',
    },
  },

  // 10. Danh mục + màu cụ thể: áo sơ mi xanh navy
  {
    id: 10,
    name: 'Danh mục + màu cụ thể: áo sơ mi xanh navy',
    query: 'áo sơ mi xanh navy',
    expected: {
      category: 'Áo sơ mi',
      color: 'Xanh navy',
    },
  },

  // 11. Màu cụ thể: Xanh lá không bị nhận nhầm thành Xanh
  {
    id: 11,
    name: 'Màu cụ thể: áo polo nam màu xanh lá',
    query: 'áo polo nam màu xanh lá',
    expected: {
      category: 'Áo Polo',
      gender: 'nam',
      color: 'Xanh lá',
    },
  },

  // 12. Màu cụ thể: Đỏ đô không bị nhận nhầm thành Đỏ
  {
    id: 12,
    name: 'Màu cụ thể: đầm lụa màu đỏ đô',
    query: 'đầm lụa màu đỏ đô',
    expected: {
      category: 'Trang Phục Dạ Hội',
      material: 'lụa',
      color: 'Đỏ đô',
    },
  },

  // 13. Áo sơ mi không bị nhận nhầm thành Áo thun hay Áo
  {
    id: 13,
    name: 'Không nhầm danh mục: áo sơ mi không bị thành áo thun',
    query: 'áo sơ mi',
    expected: {
      category: 'Áo sơ mi',
    },
  },

  // 14. "đồ nam" không được tự động hiểu là áo nam (category = null)
  {
    id: 14,
    name: 'Không gán bừa: đồ nam -> category null, gender nam',
    query: 'đồ nam',
    expected: {
      category: null,
      gender: 'nam',
    },
  },

  // 15. Truy vấn không có màu sắc -> color phải là null
  {
    id: 15,
    name: 'Không tự bịa màu: áo thun oversize unisex -> color null',
    query: 'áo thun oversize unisex',
    expected: {
      category: 'Áo thun',
      fit: 'oversize',
      gender: 'unisex',
      color: null,
    },
  },

  // 16. Áo măng tô dạ dáng dài màu nâu
  {
    id: 16,
    name: 'Áo măng tô dạ dáng dài màu nâu',
    query: 'áo măng tô dạ dáng dài màu nâu',
    expected: {
      category: 'Áo khoác & Jacket',
      material: 'dạ',
      color: 'Nâu',
    },
  },

  // 17. Váy đầm dạ hội lụa satin màu đỏ
  {
    id: 17,
    name: 'Váy đầm dạ hội lụa satin màu đỏ',
    query: 'váy đầm dạ hội lụa satin màu đỏ',
    expected: {
      category: 'Trang Phục Dạ Hội',
      material: 'lụa',
      color: 'Đỏ',
      style: 'dự tiệc',
    },
  },

  // 18. Áo khoác bomber unisex màu đen
  {
    id: 18,
    name: 'Áo khoác bomber unisex màu đen',
    query: 'áo khoác bomber unisex màu đen',
    expected: {
      category: 'Áo khoác & Jacket',
      gender: 'unisex',
      color: 'Đen',
    },
  },

  // 19. Quần jogger thể thao bo gấu màu đen
  {
    id: 19,
    name: 'Quần jogger thể thao bo gấu màu đen',
    query: 'quần jogger thể thao bo gấu màu đen',
    expected: {
      category: 'Quần Jogger & Thể thao',
      style: 'thể thao',
      color: 'Đen',
    },
  },

  // 20. Quần tây công sở xếp ly màu xám
  {
    id: 20,
    name: 'Quần tây công sở xếp ly màu xám',
    query: 'quần tây công sở xếp ly màu xám',
    expected: {
      category: 'Quần Tây & Trouser',
      style: 'công sở',
      color: 'Xám',
    },
  },

  // 21. Quần kaki chino slimfit màu đen
  {
    id: 21,
    name: 'Quần kaki chino slimfit màu đen',
    query: 'quần kaki chino slimfit màu đen',
    expected: {
      category: 'Quần Kaki & Chino',
      fit: 'slim fit',
      color: 'Đen',
    },
  },

  // 22. Quần short kaki túi hộp màu vàng
  {
    id: 22,
    name: 'Quần short kaki túi hộp màu vàng',
    query: 'quần short kaki túi hộp màu vàng',
    expected: {
      category: 'Quần Short',
      material: 'kaki',
      color: 'Vàng',
    },
  },

  // 23. Bộ đồ nỉ hoodie thể thao màu vàng
  {
    id: 23,
    name: 'Bộ đồ nỉ hoodie thể thao màu vàng',
    query: 'bộ đồ nỉ hoodie thể thao màu vàng',
    expected: {
      category: 'Bộ Đồ Thể Thao',
      color: 'Vàng',
      style: 'thể thao',
    },
  },

  // 24. Chân váy xếp ly màu be
  {
    id: 24,
    name: 'Chân váy xếp ly màu be',
    query: 'chân váy xếp ly màu be',
    expected: {
      category: 'Chân Váy',
      color: 'Be',
    },
  },

  // 25. Áo len cổ lọ dệt kim màu trắng
  {
    id: 25,
    name: 'Áo len cổ lọ dệt kim màu trắng',
    query: 'áo len cổ lọ dệt kim màu trắng',
    expected: {
      category: 'Đồ Đông & Áo Len',
      material: 'len',
      color: 'Trắng',
    },
  },

  // 26. Giày sneaker cổ điển màu trắng
  {
    id: 26,
    name: 'Giày sneaker cổ điển màu trắng',
    query: 'giày sneaker cổ điển màu trắng',
    expected: {
      category: 'Giày & Sandal',
      color: 'Trắng',
    },
  },

  // 27. Kính mát gọng kim loại
  {
    id: 27,
    name: 'Kính mát gọng kim loại',
    query: 'kính mát gọng kim loại',
    expected: {
      category: 'Kính Mát Thời Trang',
    },
  },

  // 28. Mũ beanie dệt kim màu đen
  {
    id: 28,
    name: 'Mũ beanie dệt kim màu đen',
    query: 'mũ beanie dệt kim màu đen',
    expected: {
      category: 'Mũ & Nón Thời Trang',
      material: 'len',
      color: 'Đen',
    },
  },

  // 29. Thắt lưng da bò
  {
    id: 29,
    name: 'Thắt lưng da bò',
    query: 'thắt lưng da bò',
    expected: {
      category: 'Thắt Lưng & Ví Da',
      material: 'da',
    },
  },

  // 30. Áo blazer kẻ sọc pinstripe (có remainingTerms)
  {
    id: 30,
    name: 'Áo blazer kẻ sọc pinstripe (kiểm tra remainingTerms)',
    query: 'áo blazer kẻ sọc pinstripe',
    expected: {
      category: 'Áo Vest & Blazer',
    },
    customCheck: (res) => res.remainingTerms.includes('kẻ') && res.remainingTerms.includes('sọc'),
  },

  // 31. Áo khoác giữ ấm mùa đông
  {
    id: 31,
    name: 'Áo khoác giữ ấm mùa đông',
    query: 'áo khoác giữ ấm mùa đông',
    expected: {
      category: 'Áo khoác & Jacket',
      style: 'mùa đông',
    },
  },

  // 32. Truy vấn chỉ có màu sắc: màu vàng
  {
    id: 32,
    name: 'Chỉ có màu sắc: màu vàng',
    query: 'màu vàng',
    expected: {
      category: null,
      color: 'Vàng',
    },
  },

  // 33. Truy vấn mơ hồ không có thuộc tính: tìm đồ đẹp giá rẻ
  {
    id: 33,
    name: 'Truy vấn mơ hồ: tìm đồ đẹp giá rẻ -> tất cả null',
    query: 'tìm đồ đẹp giá rẻ',
    expected: {
      category: null,
      color: null,
      gender: null,
      fit: null,
    },
  },

  // 34. Tiếng Anh kết hợp tiếng Việt: oversized t-shirt unisex
  {
    id: 34,
    name: 'Tiếng Anh + tiếng Việt: oversized t-shirt unisex',
    query: 'oversized t-shirt unisex',
    expected: {
      category: 'Áo thun',
      fit: 'oversize',
      gender: 'unisex',
    },
  },

  // 35. Quần bò nam ống rộng (không dấu kết hợp nhiều thuộc tính)
  {
    id: 35,
    name: 'Nhiều thuộc tính: quan bo nam ong rong',
    query: 'quan bo nam ong rong',
    expected: {
      category: 'Quần Jeans',
      gender: 'nam',
      fit: 'ống rộng',
    },
  },
];

console.log('========================================================================');
console.log('       KIỂM THỬ TOÀN DIỆN VIETNAMESE QUERY PARSER (35 TEST CASES)');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

for (const tc of testCases) {
  const result = parseVietnameseQuery(tc.query);

  let passed = true;
  const failureReasons = [];

  for (const [key, expectedVal] of Object.entries(tc.expected)) {
    if (result[key] !== expectedVal) {
      passed = false;
      failureReasons.push(`Field '${key}': Kỳ vọng [${expectedVal}], Thực tế [${result[key]}]`);
    }
  }

  if (tc.customCheck && !tc.customCheck(result)) {
    passed = false;
    failureReasons.push('Custom validation check thất bại');
  }

  if (passed) {
    passCount++;
    console.log(`[PASS] Test #${tc.id.toString().padStart(2, '0')}: "${tc.query}"`);
    console.log(`       -> Cat: ${result.category} | Col: ${result.color} | Gen: ${result.gender} | Fit: ${result.fit} | Mat: ${result.material} | Sty: ${result.style}`);
    console.log(`       -> Prompt TA: "${result.englishPrompt}"`);
  } else {
    failCount++;
    console.error(`[FAIL] Test #${tc.id.toString().padStart(2, '0')}: "${tc.query}"`);
    failureReasons.forEach((r) => console.error(`       -> ${r}`));
    console.error(`       -> Full Result:`, JSON.stringify(result, null, 2));
  }
}

console.log('\n========================================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${testCases.length} TESTS ĐẠT (${((passCount / testCases.length) * 100).toFixed(1)}%)`);
if (failCount === 0) {
  console.log('TẤT CẢ CÁC TEST CASES ĐÃ PASS 100%!');
} else {
  console.log(`CÓ ${failCount} TEST CASE BỊ LỖI.`);
}
console.log('========================================================================\n');

process.exit(failCount === 0 ? 0 : 1);


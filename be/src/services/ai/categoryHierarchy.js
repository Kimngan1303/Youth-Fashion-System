/**
 * categoryHierarchy.js
 * Cấu hình phân cấp và quan hệ gia đình danh mục thời trang (Category Family Hierarchy).
 * Hoạt động độc lập trong bộ nhớ, không can thiệp hay thay đổi Prisma Schema.
 * 
 * Nguyên tắc thiết kế:
 * 1. KHÔNG dùng includes() chuỗi con: Toàn bộ so khớp dựa trên từ điển ánh xạ danh mục chuẩn (CANONICAL_CATEGORY_MAP).
 * 2. Phân loại quan hệ tất định:
 *    - EXACT (Trọng số 1.0): Khớp danh mục chính xác hoặc biến thể định danh trực tiếp.
 *    - RELATED (Trọng số 0.50): Khớp khi 2 danh mục cùng chia sẻ ít nhất một họ danh mục (Shared Family).
 *    - UNRELATED (Trọng số 0.0): Khác hẳn họ danh mục (VD: Áo sơ mi vs Quần jean).
 *    - UNKNOWN (Trọng số 0.0): Khi đầu vào là từ quá chung chung ("áo", "quần") hoặc danh mục không tồn tại.
 * 3. Hỗ trợ Multi-Family: Một danh mục có thể thuộc nhiều họ khi dữ liệu thực tế chứng minh
 *    (VD: Quần Jogger thuộc cả BOTTOMS_LONG và SPORTSWEAR; Áo thun thuộc cả TOPS_CASUAL và SPORTSWEAR).
 */

import { normalizeVietnameseText } from './vietnameseQueryParser.js';

/**
 * Danh sách các họ danh mục (Category Families)
 */
export const CATEGORY_FAMILIES = {
  TOPS_CASUAL: {
    id: 'TOPS_CASUAL',
    name: 'Áo Nam Nữ & Sơ Mi Thường Ngày',
  },
  OUTERWEAR: {
    id: 'OUTERWEAR',
    name: 'Áo Khoác, Blazer & Đồ Đông',
  },
  BOTTOMS_LONG: {
    id: 'BOTTOMS_LONG',
    name: 'Quần Dài Các Loại',
  },
  BOTTOMS_SHORT: {
    id: 'BOTTOMS_SHORT',
    name: 'Quần Short & Ngắn',
  },
  DRESSES_SKIRTS: {
    id: 'DRESSES_SKIRTS',
    name: 'Váy & Đầm Thời Trang',
  },
  SPORTSWEAR: {
    id: 'SPORTSWEAR',
    name: 'Trang Phục Thể Thao & Vận Động',
  },
  LOUNGE_SWIM: {
    id: 'LOUNGE_SWIM',
    name: 'Đồ Mặc Nhà & Đồ Bơi',
  },
  ACCESSORIES: {
    id: 'ACCESSORIES',
    name: 'Phụ Kiện Thời Trang & Giày Dép',
  },
};

/**
 * Bảng ánh xạ tất định từ biến thể văn bản sang Danh mục Chuẩn (Canonical Category Name)
 * Tuyệt đối không dùng includes() hay substring tìm kiếm.
 */
export const CANONICAL_CATEGORY_MAP = {
  // Áo thun
  'áo thun': 'Áo thun',
  'ao thun': 'Áo thun',
  'áo phông': 'Áo thun',
  'ao phong': 'Áo thun',
  't-shirt': 'Áo thun',
  'tshirt': 'Áo thun',

  // Áo sơ mi
  'áo sơ mi': 'Áo sơ mi',
  'ao so mi': 'Áo sơ mi',
  'sơ mi': 'Áo sơ mi',
  'so mi': 'Áo sơ mi',
  'áo sơ mi oxford': 'Áo sơ mi',
  'ao so mi oxford': 'Áo sơ mi',
  'áo oxford': 'Áo sơ mi',
  'ao oxford': 'Áo sơ mi',
  'button down': 'Áo sơ mi',

  // Áo Polo
  'áo polo': 'Áo Polo',
  'ao polo': 'Áo Polo',
  'polo': 'Áo Polo',

  // Áo khoác & Jacket
  'áo khoác & jacket': 'Áo khoác & Jacket',
  'ao khoac & jacket': 'Áo khoác & Jacket',
  'áo khoác jacket': 'Áo khoác & Jacket',
  'ao khoac jacket': 'Áo khoác & Jacket',
  'áo khoác': 'Áo khoác & Jacket',
  'ao khoac': 'Áo khoác & Jacket',
  'jacket': 'Áo khoác & Jacket',
  'áo bomber': 'Áo khoác & Jacket',
  'ao bomber': 'Áo khoác & Jacket',
  'bomber': 'Áo khoác & Jacket',
  'áo măng tô': 'Áo khoác & Jacket',
  'ao mang to': 'Áo khoác & Jacket',
  'măng tô': 'Áo khoác & Jacket',
  'mang to': 'Áo khoác & Jacket',
  'overcoat': 'Áo khoác & Jacket',

  // Áo Vest & Blazer
  'áo vest & blazer': 'Áo Vest & Blazer',
  'ao vest & blazer': 'Áo Vest & Blazer',
  'áo vest blazer': 'Áo Vest & Blazer',
  'ao vest blazer': 'Áo Vest & Blazer',
  'áo vest & blazer atelier': 'Áo Vest & Blazer',
  'ao vest & blazer atelier': 'Áo Vest & Blazer',
  'áo vest blazer atelier': 'Áo Vest & Blazer',
  'ao vest blazer atelier': 'Áo Vest & Blazer',
  'áo vest': 'Áo Vest & Blazer',
  'ao vest': 'Áo Vest & Blazer',
  'vest': 'Áo Vest & Blazer',
  'áo blazer': 'Áo Vest & Blazer',
  'ao blazer': 'Áo Vest & Blazer',
  'blazer': 'Áo Vest & Blazer',
  'suit': 'Áo Vest & Blazer',

  // Áo Hoodie & Sweater
  'áo hoodie & sweater': 'Áo Hoodie & Sweater',
  'ao hoodie & sweater': 'Áo Hoodie & Sweater',
  'áo hoodie sweater': 'Áo Hoodie & Sweater',
  'ao hoodie sweater': 'Áo Hoodie & Sweater',
  'áo hoodie có mũ': 'Áo Hoodie & Sweater',
  'ao hoodie co mu': 'Áo Hoodie & Sweater',
  'áo hoodie co mu': 'Áo Hoodie & Sweater',
  'ao hoodie có mũ': 'Áo Hoodie & Sweater',
  'áo có mũ': 'Áo Hoodie & Sweater',
  'ao co mu': 'Áo Hoodie & Sweater',
  'áo co mu': 'Áo Hoodie & Sweater',
  'ao có mũ': 'Áo Hoodie & Sweater',
  'áo mũ': 'Áo Hoodie & Sweater',
  'ao mu': 'Áo Hoodie & Sweater',
  'áo mu': 'Áo Hoodie & Sweater',
  'ao mũ': 'Áo Hoodie & Sweater',
  'áo hoodie': 'Áo Hoodie & Sweater',
  'ao hoodie': 'Áo Hoodie & Sweater',
  'hoodie': 'Áo Hoodie & Sweater',
  'áo sweater': 'Áo Hoodie & Sweater',
  'ao sweater': 'Áo Hoodie & Sweater',
  'sweater': 'Áo Hoodie & Sweater',
  'áo nỉ có mũ': 'Áo Hoodie & Sweater',
  'ao ni co mu': 'Áo Hoodie & Sweater',
  'sweatshirt': 'Áo Hoodie & Sweater',

  // Đồ Đông & Áo Len
  'đồ đông & áo len': 'Đồ Đông & Áo Len',
  'do dong & ao len': 'Đồ Đông & Áo Len',
  'đồ đông áo len': 'Đồ Đông & Áo Len',
  'do dong ao len': 'Đồ Đông & Áo Len',
  'áo len': 'Đồ Đông & Áo Len',
  'ao len': 'Đồ Đông & Áo Len',
  'đồ đông': 'Đồ Đông & Áo Len',
  'do dong': 'Đồ Đông & Áo Len',

  // Quần Jeans
  'quần jeans': 'Quần Jeans',
  'quan jeans': 'Quần Jeans',
  'quần jean': 'Quần Jeans',
  'quan jean': 'Quần Jeans',
  'quần bò': 'Quần Jeans',
  'quan bo': 'Quần Jeans',
  'jeans': 'Quần Jeans',
  'jean': 'Quần Jeans',

  // Quần Kaki & Chino
  'quần kaki & chino': 'Quần Kaki & Chino',
  'quan kaki & chino': 'Quần Kaki & Chino',
  'quần kaki chino': 'Quần Kaki & Chino',
  'quan kaki chino': 'Quần Kaki & Chino',
  'quần kaki': 'Quần Kaki & Chino',
  'quan kaki': 'Quần Kaki & Chino',
  'kaki': 'Quần Kaki & Chino',
  'quần chino': 'Quần Kaki & Chino',
  'quan chino': 'Quần Kaki & Chino',
  'chino': 'Quần Kaki & Chino',

  // Quần Tây & Trouser
  'quần tây & trouser': 'Quần Tây & Trouser',
  'quan tay & trouser': 'Quần Tây & Trouser',
  'quần tây trouser': 'Quần Tây & Trouser',
  'quan tay trouser': 'Quần Tây & Trouser',
  'quần tây': 'Quần Tây & Trouser',
  'quan tay': 'Quần Tây & Trouser',
  'quần âu': 'Quần Tây & Trouser',
  'quan au': 'Quần Tây & Trouser',
  'trouser': 'Quần Tây & Trouser',
  'trousers': 'Quần Tây & Trouser',

  // Quần Jogger & Thể thao
  'quần jogger & thể thao': 'Quần Jogger & Thể thao',
  'quan jogger & the thao': 'Quần Jogger & Thể thao',
  'quần jogger thể thao': 'Quần Jogger & Thể thao',
  'quan jogger the thao': 'Quần Jogger & Thể thao',
  'quần jogger': 'Quần Jogger & Thể thao',
  'quan jogger': 'Quần Jogger & Thể thao',
  'jogger': 'Quần Jogger & Thể thao',

  // Quần Short
  'quần short': 'Quần Short',
  'quan short': 'Quần Short',
  'quần sooc': 'Quần Short',
  'quan sooc': 'Quần Short',
  'quần đùi': 'Quần Short',
  'quan dui': 'Quần Short',
  'shorts': 'Quần Short',

  // Trang Phục Dạ Hội
  'trang phục dạ hội': 'Trang Phục Dạ Hội',
  'trang phuc da hoi': 'Trang Phục Dạ Hội',
  'váy & đầm thiết kế': 'Trang Phục Dạ Hội',
  'vay & dam thiet ke': 'Trang Phục Dạ Hội',
  'váy đầm thiết kế': 'Trang Phục Dạ Hội',
  'vay dam thiet ke': 'Trang Phục Dạ Hội',
  'váy thiết kế & dạ hội': 'Trang Phục Dạ Hội',
  'vay thiet ke & da hoi': 'Trang Phục Dạ Hội',
  'váy thiết kế dạ hội': 'Trang Phục Dạ Hội',
  'vay thiet ke da hoi': 'Trang Phục Dạ Hội',
  'đầm dạ hội': 'Trang Phục Dạ Hội',
  'dam da hoi': 'Trang Phục Dạ Hội',
  'váy dạ hội': 'Trang Phục Dạ Hội',
  'vay da hoi': 'Trang Phục Dạ Hội',
  'đầm thiết kế': 'Trang Phục Dạ Hội',
  'dam thiet ke': 'Trang Phục Dạ Hội',

  // Chân Váy
  'chân váy': 'Chân Váy',
  'chan vay': 'Chân Váy',
  'skirt': 'Chân Váy',

  // Bộ Đồ Thể Thao
  'bộ đồ thể thao': 'Bộ Đồ Thể Thao',
  'bo do the thao': 'Bộ Đồ Thể Thao',
  'set thể thao': 'Bộ Đồ Thể Thao',
  'set the thao': 'Bộ Đồ Thể Thao',
  'tracksuit': 'Bộ Đồ Thể Thao',

  // Đồ Lót & Đồ Mặc Nhà
  'đồ lót & đồ mặc nhà': 'Đồ Lót & Đồ Mặc Nhà',
  'do lot & do mac nha': 'Đồ Lót & Đồ Mặc Nhà',
  'đồ lót đồ mặc nhà': 'Đồ Lót & Đồ Mặc Nhà',
  'do lot do mac nha': 'Đồ Lót & Đồ Mặc Nhà',
  'đồ lót': 'Đồ Lót & Đồ Mặc Nhà',
  'do lot': 'Đồ Lót & Đồ Mặc Nhà',
  'đồ mặc nhà': 'Đồ Lót & Đồ Mặc Nhà',
  'do mac nha': 'Đồ Lót & Đồ Mặc Nhà',

  // Đồ Bơi & Mùa Hè
  'đồ bơi & mùa hè': 'Đồ Bơi & Mùa Hè',
  'do boi & mua he': 'Đồ Bơi & Mùa Hè',
  'đồ bơi mùa hè': 'Đồ Bơi & Mùa Hè',
  'do boi mua he': 'Đồ Bơi & Mùa Hè',
  'bộ sưu tập mùa hè': 'Đồ Bơi & Mùa Hè',
  'bo suu tap mua he': 'Đồ Bơi & Mùa Hè',
  'đồ bơi': 'Đồ Bơi & Mùa Hè',
  'do boi': 'Đồ Bơi & Mùa Hè',

  // Phụ kiện & Giày dép
  'túi xách & balo': 'Túi Xách & Balo',
  'tui xach & balo': 'Túi Xách & Balo',
  'túi xách balo': 'Túi Xách & Balo',
  'tui xach balo': 'Túi Xách & Balo',
  'túi xách': 'Túi Xách & Balo',
  'tui xach': 'Túi Xách & Balo',
  'balo': 'Túi Xách & Balo',
  'giày & sandal': 'Giày & Sandal',
  'giay & sandal': 'Giày & Sandal',
  'giày sandal': 'Giày & Sandal',
  'giay sandal': 'Giày & Sandal',
  'giày': 'Giày & Sandal',
  'giay': 'Giày & Sandal',
  'sandal': 'Giày & Sandal',
  'mũ & nón thời trang': 'Mũ & Nón Thời Trang',
  'mu & non thoi trang': 'Mũ & Nón Thời Trang',
  'mũ nón thời trang': 'Mũ & Nón Thời Trang',
  'mu non thoi trang': 'Mũ & Nón Thời Trang',
  'mũ': 'Mũ & Nón Thời Trang',
  'mu': 'Mũ & Nón Thời Trang',
  'nón': 'Mũ & Nón Thời Trang',
  'non': 'Mũ & Nón Thời Trang',
  'thắt lưng & ví da': 'Thắt Lưng & Ví Da',
  'that lung & vi da': 'Thắt Lưng & Ví Da',
  'thắt lưng ví da': 'Thắt Lưng & Ví Da',
  'that lung vi da': 'Thắt Lưng & Ví Da',
  'thắt lưng': 'Thắt Lưng & Ví Da',
  'that lung': 'Thắt Lưng & Ví Da',
  'ví da': 'Thắt Lưng & Ví Da',
  'vi da': 'Thắt Lưng & Ví Da',
  'kính mát thời trang': 'Kính Mát Thời Trang',
  'kinh mat thoi trang': 'Kính Mát Thời Trang',
  'kính mát': 'Kính Mát Thời Trang',
  'kinh mat': 'Kính Mát Thời Trang',
  'khăn quàng & phụ kiện': 'Khăn Quàng & Phụ Kiện',
  'khan quang & phu kien': 'Khăn Quàng & Phụ Kiện',
  'khăn quàng phụ kiện': 'Khăn Quàng & Phụ Kiện',
  'khan quang phu kien': 'Khăn Quàng & Phụ Kiện',
  'phụ kiện thời trang': 'Khăn Quàng & Phụ Kiện',
  'phu kien thoi trang': 'Khăn Quàng & Phụ Kiện',
};

/**
 * Bảng ánh xạ Danh mục chuẩn -> Các họ danh mục tương ứng (Hỗ trợ Multi-Family)
 */
export const CATEGORY_TO_FAMILIES = {
  // Áo thun thuộc cả TOPS_CASUAL và SPORTSWEAR (được chứng minh bởi ID 7 Áo Thun Thể Thao Nam)
  'Áo thun': ['TOPS_CASUAL', 'SPORTSWEAR'],
  'Áo Polo': ['TOPS_CASUAL'],
  'Áo sơ mi': ['TOPS_CASUAL'],
  'Áo khoác & Jacket': ['OUTERWEAR'],
  'Áo Vest & Blazer': ['OUTERWEAR'],
  'Áo Hoodie & Sweater': ['OUTERWEAR'],
  'Đồ Đông & Áo Len': ['OUTERWEAR'],
  'Quần Jeans': ['BOTTOMS_LONG'],
  'Quần Kaki & Chino': ['BOTTOMS_LONG'],
  'Quần Tây & Trouser': ['BOTTOMS_LONG'],
  // Quần Jogger thuộc cả BOTTOMS_LONG và SPORTSWEAR (chứng minh bởi ID 18 Quần Jogger Nỉ Thể Thao)
  'Quần Jogger & Thể thao': ['BOTTOMS_LONG', 'SPORTSWEAR'],
  'Quần Short': ['BOTTOMS_SHORT'],
  'Trang Phục Dạ Hội': ['DRESSES_SKIRTS'],
  // Chân váy thuộc riêng họ DRESSES_SKIRTS (không gán vào BOTTOMS_LONG để tránh nhầm với quần dài)
  'Chân Váy': ['DRESSES_SKIRTS'],
  'Bộ Đồ Thể Thao': ['SPORTSWEAR'],
  'Đồ Lót & Đồ Mặc Nhà': ['LOUNGE_SWIM'],
  'Đồ Bơi & Mùa Hè': ['LOUNGE_SWIM'],
  'Túi Xách & Balo': ['ACCESSORIES'],
  'Giày & Sandal': ['ACCESSORIES'],
  'Mũ & Nón Thời Trang': ['ACCESSORIES'],
  'Thắt Lưng & Ví Da': ['ACCESSORIES'],
  'Kính Mát Thời Trang': ['ACCESSORIES'],
  'Khăn Quàng & Phụ Kiện': ['ACCESSORIES'],
};

/**
 * Hàm phân giải danh mục từ chuỗi sang Danh mục Chuẩn (Canonical)
 * @param {string} catName - Chuỗi tên danh mục đầu vào
 * @returns {string|null} - Tên danh mục chuẩn hoặc null nếu là từ chung ("áo", "quần") hoặc không tồn tại
 */
export function resolveCanonicalCategory(catName) {
  if (!catName || typeof catName !== 'string') return null;
  const rawLower = catName.toLowerCase().trim();
  if (CANONICAL_CATEGORY_MAP[rawLower]) {
    return CANONICAL_CATEGORY_MAP[rawLower];
  }
  const normalized = normalizeVietnameseText(catName).toLowerCase().trim();
  return CANONICAL_CATEGORY_MAP[normalized] || null;
}

/**
 * Đánh giá mức độ quan hệ giữa 2 danh mục bằng thuật toán so khớp từ điển tất định
 * TUYỆT ĐỐI KHÔNG SỬ DỤNG substring hay includes().
 * 
 * @param {string} requestedCategory - Danh mục người dùng tìm kiếm (từ Parser)
 * @param {string} productCategory - Danh mục của sản phẩm trong Catalog/DB
 * @returns {{
 *   type: 'EXACT' | 'RELATED' | 'UNRELATED' | 'UNKNOWN',
 *   weight: number,
 *   canonicalReq: string|null,
 *   canonicalProd: string|null,
 *   sharedFamily?: string,
 *   reason?: string
 * }}
 */
export function getCategoryRelationship(requestedCategory, productCategory) {
  const canonReq = resolveCanonicalCategory(requestedCategory);
  const canonProd = resolveCanonicalCategory(productCategory);

  // Trường hợp từ không xác định, từ quá chung chung ("áo", "quần") hoặc ngoài từ điển
  if (!canonReq || !canonProd) {
    return {
      type: 'UNKNOWN',
      weight: 0.0,
      canonicalReq: canonReq || null,
      canonicalProd: canonProd || null,
      reason: !canonReq ? 'unknown_requested_category' : 'unknown_product_category',
    };
  }

  // 1. EXACT MATCH: Cùng một danh mục chuẩn
  if (canonReq === canonProd) {
    return {
      type: 'EXACT',
      weight: 1.0,
      canonicalReq: canonReq,
      canonicalProd: canonProd,
    };
  }

  // 2. RELATED MATCH: Hai danh mục cùng chia sẻ ít nhất một họ danh mục (Shared Family)
  const familiesReq = CATEGORY_TO_FAMILIES[canonReq] || [];
  const familiesProd = CATEGORY_TO_FAMILIES[canonProd] || [];
  const sharedFamily = familiesReq.find((f) => familiesProd.includes(f));

  if (sharedFamily) {
    return {
      type: 'RELATED',
      weight: 0.50, // Trọng số thuộc tính danh mục liên quan là 50%
      canonicalReq: canonReq,
      canonicalProd: canonProd,
      sharedFamily,
    };
  }

  // 3. UNRELATED MATCH: Không chia sẻ bất kỳ họ danh mục nào
  return {
    type: 'UNRELATED',
    weight: 0.0,
    canonicalReq: canonReq,
    canonicalProd: canonProd,
  };
}

export default {
  CATEGORY_FAMILIES,
  CANONICAL_CATEGORY_MAP,
  CATEGORY_TO_FAMILIES,
  resolveCanonicalCategory,
  getCategoryRelationship,
};

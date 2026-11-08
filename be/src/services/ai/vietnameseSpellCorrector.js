/**
 * vietnameseSpellCorrector.js
 * Bộ sửa lỗi chính tả và so khớp mờ tiếng Việt cho thời trang (Vietnamese Fashion Spell Corrector).
 * Sử dụng thuật toán Damerau-Levenshtein 100% thuần JavaScript (Zero-dependency).
 * 
 * Tính năng & Tiêu chuẩn bảo vệ ngữ nghĩa:
 * 1. Damerau-Levenshtein: Hỗ trợ 4 thao tác chỉnh sửa (thêm, xóa, thay thế, đảo 2 ký tự liền kề).
 * 2. Phục hồi lỗi gõ Telex/VNI phổ biến (sow mi -> sơ mi, thunf -> thun, vaays -> váy).
 * 3. Khôi phục dấu tiếng Việt (dam da hoi -> đầm dạ hội, quan xuong -> quần suông).
 * 4. Kiểm soát ngưỡng khoảng cách sửa đổi theo độ dài từ:
 *    - Từ ngắn <= 3 ký tự (áo, váy, đồ, nỉ, len): Max distance = 0 (Tuyệt đối không fuzzy sai từ ngắn).
 *    - Từ trung bình 4-6 ký tự (hoodi, jean, suong): Max distance = 1.
 *    - Từ dài >= 7 ký tự (oversize, sweatshirt): Max distance = 2.
 * 5. Nguyên tắc bảo vệ dấu tiếng Việt (Diacritic Protection):
 *    - Từ đã có dấu chuẩn trong từ điển tiếng Việt (VD: công, sở, đông, năng, động, lạnh, ấm) TUYỆT ĐỐI không bị thay đổi.
 *    - So khớp mờ chỉ áp dụng khi từ sai chính tả hoặc không dấu.
 * 6. Giữ nguyên từ không thuộc từ điển thời trang (tên thương hiệu, mã số, size, từ không liên quan).
 * 7. Trả về đối tượng có cấu trúc: { originalQuery, correctedQuery, corrections, confidence, wasCorrected }.
 */

import { normalizeVietnameseText, removeVietnameseTones } from './vietnameseQueryParser.js';

/**
 * Thuật toán Damerau-Levenshtein Distance
 * Tính số thao tác tối thiểu: Insertion, Deletion, Substitution, Transposition
 */
export function damerauLevenshtein(a, b) {
  if (a === b) return 0;
  if (!a || !b) return (a || '').length + (b || '').length;

  const al = a.length;
  const bl = b.length;
  const matrix = [];

  for (let i = 0; i <= al; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,        // Deletion
        matrix[i][j - 1] + 1,        // Insertion
        matrix[i - 1][j - 1] + cost  // Substitution
      );

      // Transposition của 2 ký tự liền kề (VD: hoidie <-> hoodie)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[al][bl];
}

/**
 * Bảng ánh xạ cụm từ sai chính tả / lỗi Telex phổ biến (Phrase-level Typo Map)
 * Ưu tiên so khớp cụm từ trước để đạt độ chính xác ngữ cảnh cao nhất
 */
export const COMMON_PHRASE_TYPOS = [
  { pattern: 'sow mi', replacement: 'sơ mi', confidence: 0.98, type: 'telex' },
  { pattern: 'sowi', replacement: 'sơ mi', confidence: 0.95, type: 'telex' },
  { pattern: 'quan xuong', replacement: 'quần suông', confidence: 0.98, type: 'typo' },
  { pattern: 'quần xuông', replacement: 'quần suông', confidence: 0.98, type: 'typo' },
  { pattern: 'ong rongg', replacement: 'ống rộng', confidence: 0.95, type: 'typo' },
  { pattern: 'ong roong', replacement: 'ống rộng', confidence: 0.95, type: 'typo' },
  { pattern: 'dam da hoi', replacement: 'đầm dạ hội', confidence: 0.98, type: 'accent' },
  { pattern: 'vay da hoi', replacement: 'váy dạ hội', confidence: 0.98, type: 'accent' },
  { pattern: 'cọc tay', replacement: 'cộc tay', confidence: 0.95, type: 'typo' },
  { pattern: 'coc tay', replacement: 'cộc tay', confidence: 0.95, type: 'typo' },
  { pattern: 'ao phong', replacement: 'áo phông', confidence: 0.98, type: 'accent' },
  { pattern: 'ao thun', replacement: 'áo thun', confidence: 0.98, type: 'accent' },
  { pattern: 'quan bo', replacement: 'quần bò', confidence: 0.98, type: 'accent' },
  { pattern: 'quan jean', replacement: 'quần jean', confidence: 0.98, type: 'accent' },
  { pattern: 'quan au', replacement: 'quần âu', confidence: 0.98, type: 'accent' },
  { pattern: 'ao khoac', replacement: 'áo khoác', confidence: 0.98, type: 'accent' },
  { pattern: 'ao hoodie', replacement: 'áo hoodie', confidence: 0.98, type: 'accent' },
  { pattern: 'ao sweater', replacement: 'áo sweater', confidence: 0.98, type: 'accent' },
  { pattern: 'ao so mi', replacement: 'áo sơ mi', confidence: 0.98, type: 'accent' },
  { pattern: 'so mi', replacement: 'sơ mi', confidence: 0.98, type: 'accent' },
  { pattern: 'set the thao', replacement: 'set thể thao', confidence: 0.98, type: 'accent' },
  { pattern: 'bo the thao', replacement: 'bộ thể thao', confidence: 0.98, type: 'accent' },
  { pattern: 'bo ni', replacement: 'bộ nỉ', confidence: 0.98, type: 'accent' },
];

/**
 * Bảng ánh xạ token đơn lẻ bị lỗi gõ Telex/VNI hoặc gõ phím
 */
export const COMMON_TOKEN_TYPOS = {
  thunf: 'thun',
  quaanf: 'quần',
  quanf: 'quần',
  aof: 'áo',
  vaays: 'váy',
  daamf: 'đầm',
  khoacs: 'khoác',
  trangs: 'trắng',
  denf: 'đen',
  door: 'đỏ',
  xanhh: 'xanh',
  hoodi: 'hoodie',
  hoidie: 'hoodie',
  sweeter: 'sweater',
  blazre: 'blazer',
  blazzer: 'blazer',
  cardigann: 'cardigan',
  suongg: 'suông',
  xuong: 'suông',
  jen: 'jean',
  phong: 'phông',
  aos: 'áo',
  cocojc: 'cộc',
};

/**
 * Tập từ điển từ hợp lệ đầy đủ trong hệ thống thời trang FashionAI
 * (Bao gồm danh mục, sản phẩm, màu sắc, chất liệu, kiểu dáng, phong cách, dịp sử dụng)
 */
export const VALID_FASHION_WORDS = new Set([
  // Tên trang phục & Danh mục
  'áo', 'quần', 'váy', 'đầm', 'khoác', 'phông', 'thun', 'bò', 'âu', 'kaki', 'chino', 'jogger', 'short', 'shorts',
  'hoodie', 'sweater', 'sweatshirt', 'jacket', 'bomber', 'blazer', 'vest', 'cardigan', 'suit', 'polo', 'jeans', 'jean',
  'tracksuit', 'oxford', 'flannel', 'poplin', 'tweed', 'denim', 'cotton', 'satin', 'len', 'nỉ', 'lụa', 'dạ', 'da', 'đũi',
  'túi', 'xách', 'balo', 'giày', 'sandal', 'sneaker', 'mũ', 'nón', 'beanie', 'thắt', 'lưng', 'ví', 'kính', 'mát', 'khăn', 'quàng',
  // Màu sắc
  'đen', 'trắng', 'xanh', 'đỏ', 'vàng', 'xám', 'ghi', 'nâu', 'be', 'hồng', 'tím', 'cam', 'navy', 'pastel', 'kem', 'rêu', 'bơ',
  // Kiểu dáng & Thuộc tính
  'oversize', 'oversized', 'slimfit', 'slim', 'fit', 'regular', 'suông', 'rộng', 'ôm', 'dài', 'ngắn', 'cộc', 'unisex', 'nam', 'nữ',
  'crop', 'croptop', 'cargo', 'wide', 'basic', 'vintage', 'retro', 'streetwear', 'classic',
  'cổ', 'lọ', 'tròn', 'tàu', 'đức', 'bẻ', 'khoét', 'xếp', 'ly', 'túi', 'hộp', 'bo', 'gấu', 'kẻ', 'caro', 'sọc', 'trơn',
  // Phong cách & Dịp sử dụng & Tính từ thời trang
  'công', 'sở', 'thể', 'thao', 'dự', 'tiệc', 'dạ', 'hội', 'cưới', 'mùa', 'đông', 'hè', 'ấm', 'lạnh', 'lịch', 'sự', 'năng', 'động',
  'chạy', 'bộ', 'tập', 'gym', 'dạo', 'phố', 'đi', 'biển', 'bơi', 'ngủ', 'mặc', 'nhà', 'đẹp', 'rẻ', 'mát', 'sang', 'trọng', 'cao', 'cấp',
  'thoải', 'mái', 'set', 'bộ', 'đồ'
]);

/**
 * Danh sách thương hiệu thời trang phổ biến (Bảo vệ không bị sửa nhầm)
 */
export const KNOWN_BRANDS = new Set([
  'youthfashion', 'zara', 'uniqlo', 'gucci', 'nike', 'adidas', 'routine',
  'coolmate', 'canifa', 'yody', 'torano', 'owen', 'viettien', 'anphuoc',
  'chanel', 'dior', 'prada', 'hermes', 'louisvuitton', 'balenciaga', 'lacoste'
]);

/**
 * Danh sách kích cỡ / size chuẩn (Bảo vệ không bị sửa nhầm)
 */
export const KNOWN_SIZES = new Set([
  'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', '2xl', '3xl', '4xl', 'freesize', 'oversize'
]);

/**
 * Danh sách ứng viên cho Fuzzy Matching (các từ thời trang đặc thù từ 4 ký tự trở lên)
 */
export const FUZZY_CANDIDATES = [
  'hoodie', 'sweater', 'sweatshirt', 'jacket', 'bomber', 'blazer', 'cardigan',
  't-shirt', 'shirt', 'polo', 'jeans', 'chino', 'jogger', 'shorts', 'tracksuit',
  'oxford', 'flannel', 'poplin', 'tweed', 'denim', 'cotton', 'satin',
  'oversize', 'slimfit', 'regular', 'suông', 'rộng', 'trắng', 'đen', 'xanh',
  'thun', 'kaki'
];

/**
 * Kiểm tra xem token có phải là token định danh đặc thù cần bảo vệ hay không
 * (Bao gồm thương hiệu, size, SKU, mã số, PascalCase, từ viết hoa)
 * @param {string} token - Từ/token cần kiểm tra
 * @returns {boolean}
 */
export function isProtectedToken(token) {
  if (!token || typeof token !== 'string') return false;
  const tokenLower = token.toLowerCase();

  // 1. Thương hiệu hoặc kích cỡ chuẩn
  if (KNOWN_BRANDS.has(tokenLower) || KNOWN_SIZES.has(tokenLower)) {
    return true;
  }

  // 2. Chứa số (VD: 29, 30, 2XL, 100k, 05)
  if (/\d/.test(token)) {
    return true;
  }

  // 3. Chứa ký tự phân cách mã hàng / SKU (VD: AK-TWEED-05, SP_01, MT/2)
  if (/[_\-/]/.test(token)) {
    return true;
  }

  // 4. Định dạng PascalCase / camelCase (VD: YouthFashion, CoolMate, DailyWear)
  if (/[a-z][A-Z]/.test(token)) {
    return true;
  }

  // 5. Định dạng viết hoa toàn bộ từ 2 ký tự (VD: ZARA, SKU, VNXK)
  if (/^[A-Z0-9]+$/.test(token) && token.length >= 2) {
    return true;
  }

  return false;
}

/**
 * Kiểm tra xem chuỗi có chứa ký tự dấu tiếng Việt hay không
 */
function hasVietnameseDiacritic(str) {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(str);
}

/**
 * Hàm hiệu chỉnh và chuẩn hóa câu truy vấn thời trang tiếng Việt
 * @param {string} queryText - Câu truy vấn gốc của người dùng
 * @returns {{
 *   originalQuery: string,
 *   correctedQuery: string,
 *   corrections: Array<{ original: string, corrected: string, distance: number, confidence: number, type: string }>,
 *   confidence: number,
 *   wasCorrected: boolean
 * }}
 */
export function correctVietnameseQuery(queryText) {
  if (!queryText || typeof queryText !== 'string') {
    return {
      originalQuery: queryText || '',
      correctedQuery: queryText || '',
      corrections: [],
      confidence: 1.0,
      wasCorrected: false,
    };
  }

  const normalizedInput = normalizeVietnameseText(queryText).trim();
  let workingText = normalizedInput;
  const corrections = [];

  // Bước 1: Quét cụm từ phổ biến (Phrase-level Replacement)
  for (const phraseItem of COMMON_PHRASE_TYPOS) {
    const reg = new RegExp(`(?<=^|\\s)${phraseItem.pattern}(?=$|\\s)`, 'gi');
    if (reg.test(workingText)) {
      workingText = workingText.replace(reg, phraseItem.replacement);
      corrections.push({
        original: phraseItem.pattern,
        corrected: phraseItem.replacement,
        distance: damerauLevenshtein(phraseItem.pattern, phraseItem.replacement),
        confidence: phraseItem.confidence,
        type: phraseItem.type,
      });
    }
  }

  // Bước 2: Quét token đơn lẻ (Token-level Correction)
  const tokens = workingText.split(/\s+/).filter(Boolean);
  const correctedTokens = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tokenLower = token.toLowerCase();

    // 2.1. BẢO VỆ TOKEN ĐẶC TRƯNG ĐẦU TIÊN: Thương hiệu, Kích cỡ, SKU, Mã hàng, Số, PascalCase
    if (isProtectedToken(token)) {
      correctedTokens.push(token);
      continue;
    }

    // 2.2. Kiểm tra từ hợp lệ trong từ điển thời trang -> TUYỆT ĐỐI GIỮ NGUYÊN
    if (VALID_FASHION_WORDS.has(tokenLower)) {
      correctedTokens.push(token);
      continue;
    }

    // 2.3. Tra cứu nhanh bảng lỗi gõ phổ biến
    if (COMMON_TOKEN_TYPOS[tokenLower]) {
      const corrected = COMMON_TOKEN_TYPOS[tokenLower];
      correctedTokens.push(corrected);
      corrections.push({
        original: token,
        corrected: corrected,
        distance: damerauLevenshtein(tokenLower, corrected),
        confidence: 0.95,
        type: 'telex_token',
      });
      continue;
    }

    // 2.5. BẢO VỆ TỪ CÓ DẤU: Nếu token đã có dấu tiếng Việt hợp lệ nhưng không nằm trong typo list,
    // TUYỆT ĐỐI KHÔNG fuzzy match sang từ khác (tránh trường hợp công -> hồng, đông -> hồng, v.v.)
    if (hasVietnameseDiacritic(tokenLower)) {
      correctedTokens.push(token);
      continue;
    }

    // 2.6. BẢO VỆ TỪ NGẮN KHÔNG DẤU (Length <= 3 ký tự, VD: ao, do, ni, len, ke): Không fuzzy tự ý
    if (tokenLower.length <= 3) {
      correctedTokens.push(token);
      continue;
    }

    // 2.7. So khớp mờ Damerau-Levenshtein với từ điển ứng viên & Xử lý đa ứng viên (Ambiguity Detection)
    const tokenToneless = removeVietnameseTones(tokenLower);
    const maxAllowedDist = tokenLower.length >= 7 ? 2 : 1;
    let matchingCandidates = [];
    let minDistance = 999;

    for (const candidate of FUZZY_CANDIDATES) {
      if (candidate.length <= 3) continue;

      const distRaw = damerauLevenshtein(tokenLower, candidate.toLowerCase());
      const distToneless = damerauLevenshtein(tokenToneless, removeVietnameseTones(candidate.toLowerCase()));
      const effectiveDist = Math.min(distRaw, distToneless);

      if (effectiveDist <= maxAllowedDist) {
        if (effectiveDist < minDistance) {
          minDistance = effectiveDist;
          matchingCandidates = [candidate];
        } else if (effectiveDist === minDistance) {
          matchingCandidates.push(candidate);
        }
      }
    }

    // Nếu phát hiện nhiều hơn 1 ứng viên cùng khoảng cách tối thiểu (Ambiguity)
    // -> Không tùy tiện chọn ứng viên đầu tiên, giữ nguyên token gốc!
    if (matchingCandidates.length > 1) {
      correctedTokens.push(token);
      continue;
    }

    // Nếu tìm thấy đúng 1 ứng viên duy nhất tin cậy cao (confidence >= 0.82)
    if (matchingCandidates.length === 1 && minDistance <= maxAllowedDist) {
      const bestCandidate = matchingCandidates[0];
      const maxLen = Math.max(tokenLower.length, bestCandidate.length);
      const conf = Number((1.0 - minDistance / maxLen).toFixed(2));

      if (conf >= 0.82) {
        correctedTokens.push(bestCandidate);
        corrections.push({
          original: token,
          corrected: bestCandidate,
          distance: minDistance,
          confidence: conf,
          type: 'fuzzy_damerau',
        });
        continue;
      }
    }

    // 2.8. Không tìm thấy ứng viên tin cậy -> Giữ nguyên token gốc
    correctedTokens.push(token);
  }

  const finalCorrectedQuery = correctedTokens.join(' ');
  const wasCorrected = corrections.length > 0 && finalCorrectedQuery !== normalizedInput;

  let overallConfidence = 1.0;
  if (corrections.length > 0) {
    const sumConf = corrections.reduce((acc, c) => acc + c.confidence, 0);
    overallConfidence = Number((sumConf / corrections.length).toFixed(2));
  }

  return {
    originalQuery: queryText,
    correctedQuery: wasCorrected ? finalCorrectedQuery : queryText,
    corrections,
    confidence: overallConfidence,
    wasCorrected,
  };
}

export default correctVietnameseQuery;

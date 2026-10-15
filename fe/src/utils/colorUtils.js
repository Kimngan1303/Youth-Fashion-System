/**
 * colorUtils.js
 * Hệ thống ánh xạ màu sắc thời trang thông minh cho YOUTH FASHION.
 * Hỗ trợ nhận diện tên màu tiếng Việt (có dấu & không dấu), tiếng Anh, mã HEX,
 * và thuật toán sinh màu thông minh (Deterministic Hash Fallback) cho các màu mới.
 */

// Bảng từ điển ánh xạ màu sắc thời trang chuẩn
const FASHION_COLOR_PALETTE = {
  // Đen & Trắng
  'den': '#111111',
  'black': '#111111',
  'den tuyen': '#0A0A0A',
  'den nham': '#222222',
  'trang': '#FFFFFF',
  'white': '#FFFFFF',
  'trang tinh': '#FFFFFF',
  'trang kem': '#FDFBF7',
  'trang sua': '#FAF7F2',
  'trang nga': '#F6F3EB',
  'nga': '#F6F3EB',
  'ivory': '#FDFBF7',

  // Xám / Ghi
  'xam': '#6B7280',
  'ghi': '#6B7280',
  'gray': '#6B7280',
  'grey': '#6B7280',
  'xam khoi': '#4B5563',
  'xam tieu': '#374151',
  'than chi': '#374151',
  'charcoal': '#374151',
  'xam long chuot': '#4B5563',
  'xam nhat': '#D1D5DB',
  'ghi sang': '#D1D5DB',
  'bac': '#E5E7EB',
  'silver': '#E5E7EB',

  // Các sắc độ Xanh dương / Xanh biển
  'xanh bien': '#2563EB',
  'xanh duong': '#2563EB',
  'blue': '#2563EB',
  'ocean': '#2563EB',
  'xanh nuoc bien': '#2563EB',
  'xanh da troi': '#38BDF8',
  'sky': '#38BDF8',
  'xanh troi': '#38BDF8',
  'xanh baby': '#93C5FD',
  'xanh pastel': '#93C5FD',
  'xanh nhat': '#93C5FD',
  'light blue': '#93C5FD',
  'xanh navy': '#0F172A',
  'navy': '#0F172A',
  'xanh than': '#1E293B',
  'xanh den': '#0F172A',
  'dark blue': '#0F172A',
  'xanh coban': '#1D4ED8',
  'cobalt': '#1D4ED8',
  'royal blue': '#1D4ED8',
  'xanh hoang gia': '#1D4ED8',
  'xanh denim': '#436B95',
  'denim': '#436B95',
  'xanh ngoc': '#06B6D4',
  'xanh ngoc bich': '#0891B2',
  'cyan': '#06B6D4',
  'turquoise': '#0891B2',
  'xanh mint': '#6EE7B7',
  'mint': '#6EE7B7',
  'xanh bac ha': '#6EE7B7',

  // Các sắc độ Xanh lá / Xanh lục
  'xanh la': '#16A34A',
  'xanh luc': '#16A34A',
  'green': '#16A34A',
  'xanh reu': '#4D5C2E',
  'reu': '#4D5C2E',
  'moss': '#4D5C2E',
  'olive': '#556B2F',
  'xanh quan doi': '#4A5320',
  'xanh bo': '#65A30D',
  'avocado': '#65A30D',
  'xanh non chuoi': '#84CC16',
  'lime': '#84CC16',
  'xanh co': '#15803D',
  'xanh cay': '#15803D',
  'xanh ma': '#849688',
  'sage': '#849688',

  // Các sắc độ Đỏ
  'do': '#DC2626',
  'red': '#DC2626',
  'do tuoi': '#EF4444',
  'scarlet': '#EF4444',
  'do do': '#881337',
  'do ruou': '#881337',
  'do man': '#701A75',
  'burgundy': '#881337',
  'maroon': '#881337',
  'wine': '#881337',
  'do gach': '#B45309',
  'gach': '#B45309',
  'terracotta': '#B45309',
  'do cherry': '#9F1239',

  // Các sắc độ Hồng
  'hong': '#EC4899',
  'pink': '#EC4899',
  'hong pastel': '#FBCFE8',
  'hong phan': '#FBCFE8',
  'hong nhat': '#FBCFE8',
  'baby pink': '#FBCFE8',
  'hong sen': '#BE185D',
  'canh sen': '#BE185D',
  'magenta': '#BE185D',
  'fuchsia': '#D946EF',
  'hong cam': '#FB7185',
  'san ho': '#FB7185',
  'coral': '#FB7185',
  'hong dat': '#BE7C7E',
  'rose': '#F43F5E',

  // Các sắc độ Vàng & Cam
  'vang': '#EAB308',
  'yellow': '#EAB308',
  'vang tuoi': '#FACC15',
  'vang chanh': '#FDE047',
  'lemon': '#FDE047',
  'vang mu tat': '#CA8A04',
  'mustard': '#CA8A04',
  'vang bo': '#CA8A04',
  'vang nghe': '#D97706',
  'gold': '#EAB308',
  'cam': '#EA580C',
  'orange': '#EA580C',
  'cam tuoi': '#F97316',
  'cam chay': '#C2410C',
  'burnt orange': '#C2410C',
  'cam pastel': '#FDBA74',
  'dao': '#FDBA74',
  'peach': '#FDBA74',

  // Các sắc độ Tím
  'tim': '#7C3AED',
  'purple': '#7C3AED',
  'violet': '#7C3AED',
  'tim than': '#581C87',
  'dark purple': '#581C87',
  'tim hue': '#9333EA',
  'tim mon': '#9333EA',
  'khoai mon': '#A855F7',
  'taro': '#A855F7',
  'tim pastel': '#C084FC',
  'lavender': '#DDD6FE',
  'tim nhat': '#DDD6FE',

  // Các sắc độ Nâu & Be
  'nau': '#78350F',
  'brown': '#78350F',
  'nau dam': '#451A03',
  'nau socola': '#451A03',
  'chocolate': '#451A03',
  'nau tay': '#854D0E',
  'nau vang': '#92400E',
  'nau dat': '#78350F',
  'da bo': '#92400E',
  'caramel': '#A16207',
  'camel': '#C19A6B',
  'be': '#E7DEC8',
  'beige': '#E7DEC8',
  'kem': '#F5EBE1',
  'cream': '#F5EBE1',
  'khaki': '#A39B8B',
  'kaki': '#A39B8B',
  'hat de': '#854D0E',
  'ca phe': '#5C3D2E',
  'coffee': '#5C3D2E',
};

/**
 * Loại bỏ dấu tiếng Việt để tra cứu chuỗi không dấu
 */
export function removeVietnameseTones(str) {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, '');
  str = str.replace(/\u02C6|\u0306|\u031B/g, '');
  return str.trim();
}

/**
 * Sinh mã màu Hex nhất quán dựa trên tên chuỗi (Deterministic Hash to Color)
 * Khi gặp màu lạ chưa có trong từ điển, hàm sẽ sinh mã màu thời trang hài hòa
 */
function generateHashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const s = 65; // Độ bão hòa dễ chịu
  const l = 50; // Độ sáng vừa phải

  // Chuyển HSL sang Hex
  const lDecimal = l / 100;
  const a = (s * Math.min(lDecimal, 1 - lDecimal)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = lDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/**
 * Kiểm tra xem màu hex này có phải là màu sáng không (cần viền nhẹ để thấy rõ trên nền trắng)
 */
export function isLightColor(hex) {
  if (!hex || typeof hex !== 'string') return false;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return false;

  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  }

  // Công thức HSP Perceived Brightness
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return hsp > 200;
}

/**
 * Hàm lấy mã màu HEX chuẩn xác từ bất kỳ tên màu nào
 * @param {string} rawColor - Tên màu, ví dụ: "Xanh biển", "Đỏ đô", "#2563EB", "Navy Blue"
 * @param {string} defaultFallback - Màu mặc định nếu chuỗi rỗng
 * @returns {string} Mã Hex màu sắc (ví dụ: '#2563EB')
 */
export function getColorHex(rawColor, defaultFallback = '#111111') {
  if (!rawColor || typeof rawColor !== 'string') return defaultFallback;

  const rawTrimmed = rawColor.trim();

  // 1. Nếu người dùng nhập trực tiếp mã HEX (ví dụ: '#2563EB', '#fff')
  const hexMatch = rawTrimmed.match(/#([0-9a-fA-F]{3,6})/);
  if (hexMatch) {
    return hexMatch[0].toUpperCase();
  }

  // 2. Chuẩn hóa chuỗi tìm kiếm (xóa chữ "màu", "tone", "tong", khoảng trắng thừa)
  let normalized = removeVietnameseTones(rawTrimmed);
  normalized = normalized
    .replace(/^mau\s+/i, '')
    .replace(/^tong\s+/i, '')
    .replace(/^tone\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 3. Tra cứu khớp chính xác trong từ điển
  if (FASHION_COLOR_PALETTE[normalized]) {
    return FASHION_COLOR_PALETTE[normalized];
  }

  // 4. Tra cứu từ khóa bao hàm (Ưu tiên từ khóa dài và cụ thể trước)
  const sortedKeywords = Object.keys(FASHION_COLOR_PALETTE).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeywords) {
    if (normalized.includes(keyword)) {
      return FASHION_COLOR_PALETTE[keyword];
    }
  }

  // 5. Nếu là màu hoàn toàn mới lạ chưa từng có trong danh sách -> Sinh màu nhất quán bằng thuật toán Hash
  return generateHashColor(normalized);
}

export default getColorHex;

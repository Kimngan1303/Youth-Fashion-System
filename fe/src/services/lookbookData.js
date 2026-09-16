// Shared Lookbook Data Service for Manager & Client (User/Guest)
const STORAGE_KEY = 'youthfashion_lookbooks_v3'; // bumped key to support 'banner' position

export const getLookbookPositionValue = (pos) => {
  if (pos === 'banner' || pos === 'BANNER' || pos === 0) return 0;
  const n = Number(pos);
  return isNaN(n) ? 999 : n;
};

export const INITIAL_LOOKBOOK_ITEMS = [
  {
    id: 6,
    type: "hero",
    lookCode: "BANNER",
    sectionRole: "Banner (Ảnh trên cùng - Hero Cover đầu trang)",
    title: "Ảnh Bìa Hero Banner: L'Automne Éternel",
    code: "LB - HERO00",
    season: "CHIẾN DỊCH CHÍNH THỨC",
    badge: "HERO COVER",
    position: "banner",
    productCount: 1,
    status: "published",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1600",
    description: "Khúc xạ của thu vĩnh cửu giữa đại lộ Paris — Nơi phong cách hòa cùng nghệ thuật may đo thủ công Pháp.",
    campaignAudio: "Paris Autumn Symphony • 3:42 mins",
    conversionRate: "42%"
  },
  {
    id: 1,
    type: "look",
    lookCode: "LOOK 01",
    sectionRole: "Khối Look 01 (Áo Măng Tô Belted & Nổi Bật Trang Chủ)",
    title: "Áo Măng Tô Belted Dạ Camel Cashmere Quý Phái Thời Đại",
    code: "LB - LOOK01",
    season: "PHONG CÁCH THU ĐÔNG",
    badge: "SIGNATURE",
    position: 1,
    productCount: 3,
    status: "published",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000",
    description: "Cắt may thủ công từ 100% len lông cừu Merino pha Cashmere tự nhiên, cổ bẻ kinh điển cùng thắt lưng tôn dáng sang trọng.",
    price: "5.445.000₫",
    originalPrice: "6.050.000₫",
    ctaText: "Mua Trọn Bộ Phối Đồ (Tiết Kiệm 10%) • 5.445.000₫",
    conversionRate: "36%",
    products: [
      { name: "Áo Măng Tô Dạ Camel Cashmere", price: "3.850.000₫" },
      { name: "Áo Len Cổ Lọ Cream Knitwear", price: "950.000₫" },
      { name: "Quần Âu Ống Suông Wool Tencel", price: "1.250.000₫" }
    ],
    hotspots: [
      { top: "38%", left: "46%", label: "Áo Măng Tô Dạ Camel — 3.850.000₫" },
      { top: "82%", left: "54%", label: "Bốt Da Nappa Cổ Điển — 2.100.000₫" }
    ]
  },
  {
    id: 2,
    type: "look",
    lookCode: "LOOK 02",
    sectionRole: "Khối Look 02 (Đầm Dạ Tiệc & Haute Couture)",
    title: "Đầm Xếp Ly Emerald Lộng Lẫy Tơ Tằm Cao Cấp",
    code: "LB - LOOK02",
    season: "DẠ TIỆC & HAUTE COUTURE",
    badge: "PHIÊN BẢN GIỚI HẠN",
    position: 2,
    productCount: 1,
    status: "published",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000",
    description: "Chất tơ tằm dệt ánh ngọc lục bảo rực rỡ, đường xếp ly accordion tỉ mỉ tạo độ xòe bồng bềnh tựa dải sóng khi chuyển động.",
    quote: "Thiết kế được lựa chọn trình diễn tại Paris Fashion Week 2025, mang hơi thở quý phái vượt thời gian.",
    price: "2.950.000₫",
    stockInfo: "Chỉ còn 5 chiếc size S, M",
    ctaText: "ĐẶT MUA NGAY",
    conversionRate: "28%",
    products: [
      { name: "Đầm Lụa Emerald Pleated Gown", price: "2.950.000₫" }
    ]
  },
  {
    id: 3,
    type: "look",
    lookCode: "LOOK 03",
    sectionRole: "Khối Look 03 (Cột 1 Lưới: Set Parisian Chic)",
    title: "Set Áo Tweed Ivory & Quần Âu Cắt May Cổ Điển",
    code: "LB - LOOK03",
    season: "PARISIAN CHIC",
    badge: "BÁN CHẠY",
    position: 3,
    productCount: 2,
    status: "published",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800",
    description: "Sự tương phản kinh điển giữa trắng kem ngà và đen tuyền, nút kim loại mạ vàng chạm khắc thủ công.",
    price: "3.040.000₫",
    ctaText: "Mua Ngay",
    conversionRate: "24%",
    products: [
      { name: "Áo Khoác Tweed Ivory Cropped", price: "2.150.000₫" },
      { name: "Quần Tây Slim Fit Black", price: "890.000₫" }
    ]
  },
  {
    id: 4,
    type: "look",
    lookCode: "LOOK 04",
    sectionRole: "Khối Look 04 (Cột 2 Lưới: Modern Tailoring)",
    title: "Oversized Charcoal Blazer & Minimalist Shirt",
    code: "LB - LOOK04",
    season: "MODERN TAILORING",
    badge: "TRENDING",
    position: 4,
    productCount: 2,
    status: "published",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
    description: "Phong thái nữ quyền độc lập và tự do, phom dáng rộng thoải mái cùng đường may vai sắc nét chuẩn quý cô Paris.",
    price: "2.700.000₫",
    ctaText: "Mua Ngay",
    conversionRate: "21%",
    products: [
      { name: "Áo Blazer Kẻ Sọc Pinstripe", price: "1.950.000₫" },
      { name: "Sơ Mi Poplin Cotton Trắng", price: "750.000₫" }
    ]
  },
  {
    id: 5,
    type: "backstage",
    lookCode: "MỤC 05",
    sectionRole: "Khối Mục 05 (Hậu Trường Xưởng May Atelier No. 12)",
    title: "Hậu Trường & Kỷ Họa Ý Tưởng (Atelier No. 12)",
    code: "LB - ATELIER05",
    season: "NGHỆ THUẬT MAY ĐO BESPOKE",
    badge: "ATELIER",
    position: 5,
    productCount: 3,
    status: "published",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1000",
    description: "Mỗi tác phẩm trong tuyển tập Fall/Winter 2025 là kết tinh của hơn 180 giờ chế tác thủ công, tuyển chọn từ những thước vải tự nhiên thượng hạng nhất từ Ý và Pháp.",
    metrics: [
      { num: "180h", desc: "Thời gian may đo & thêu tay chuẩn Haute Couture" },
      { num: "100%", desc: "Sợi tự nhiên len cừu Merino & Cashmere Ý" },
      { num: "12+", desc: "Nghệ nhân may đo kinh nghiệm 20 năm tại xưởng" }
    ],
    conversionRate: "19%"
  }
];

export const getStoredLookbooks = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(item => item.position === 'banner')) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load lookbooks from storage', e);
  }
  // Initialize with the 6 structured items (Banner + 1,2,3,4,5)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOOKBOOK_ITEMS));
  } catch (e) {}
  return INITIAL_LOOKBOOK_ITEMS;
};

export const saveStoredLookbooks = (lookbooks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lookbooks));
    window.dispatchEvent(new Event('lookbook-updated'));
  } catch (e) {
    console.error('Failed to save lookbooks', e);
  }
};

export const resetToDefaultLookbooks = () => {
  saveStoredLookbooks(INITIAL_LOOKBOOK_ITEMS);
  return INITIAL_LOOKBOOK_ITEMS;
};

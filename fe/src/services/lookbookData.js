// Shared Lookbook Data Service for Manager & Client (User/Guest)
const STORAGE_KEY = 'youthfashion_lookbooks';

export const INITIAL_LOOKBOOK_ITEMS = [
  {
    id: 1,
    title: "Fall/Winter 2025: L'Automne Éternel",
    code: "LB - FW25 - 01",
    season: "Mùa Thu Đông",
    position: 1,
    productCount: 5,
    status: "published",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200",
    heroSubtitle: "Khúc xạ của thu vĩnh cửu giữa đại lộ Paris — Nơi phong cách hòa cùng nghệ thuật may đo thủ công Pháp.",
    campaignAudio: "Paris Autumn Symphony • 3:42 mins",
    conversionRate: "36%",
    outfits: [
      {
        id: "outfit-1",
        lookNumber: "LOOK 01",
        category: "PHONG CÁCH THU ĐÔNG",
        badge: "SIGNATURE",
        title: "Áo Măng Tô Belted Dạ Camel Cashmere Quý Phái Thời Đại",
        description: "Cắt may thủ công từ 100% len lông cừu Merino pha Cashmere tự nhiên, cổ bẻ kinh điển cùng thắt lưng tôn dáng sang trọng.",
        image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000",
        totalPrice: "6.050.000₫",
        discountPrice: "5.445.000₫",
        products: [
          { name: "Áo Măng Tô Dạ Camel Cashmere", price: "3.850.000₫", tag: "Coat" },
          { name: "Áo Len Cổ Lọ Cream Knitwear", price: "950.000₫", tag: "Knit" },
          { name: "Quần Âu Ống Suông Wool Tencel", price: "1.250.000₫", tag: "Pants" }
        ],
        hotspots: [
          { top: "35%", left: "48%", label: "Áo Măng Tô Dạ Camel - 3.850.000₫" },
          { top: "82%", left: "55%", label: "Bốt Da Nappa Cổ Điển - 2.100.000₫" }
        ]
      },
      {
        id: "outfit-2",
        lookNumber: "LOOK 02",
        category: "DẠ TIỆC & HAUTE COUTURE",
        badge: "PHIÊN BẢN GIỚI HẠN",
        title: "Đầm Xếp Ly Emerald Lộng Lẫy Tơ Tằm Cao Cấp",
        description: "Chất tơ tằm dệt ánh ngọc lục bảo rực rỡ, đường xếp ly accordion tỉ mỉ tạo độ xòe bồng bềnh tựa dải sóng khi chuyển động.",
        quote: "Thiết kế được lựa chọn trình diễn tại Paris Fashion Week 2025, mang hơi thở quý phái vượt thời gian.",
        image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000",
        price: "2.950.000₫",
        stockInfo: "Chỉ còn 5 chiếc size S, M",
        products: [
          { name: "Đầm Lụa Emerald Pleated Gown", price: "2.950.000₫", tag: "Gown" }
        ]
      },
      {
        id: "outfit-3",
        lookNumber: "LOOK 03",
        category: "PARISIAN CHIC",
        title: "Set Áo Tweed Ivory & Quần Âu Cắt May Cổ Điển",
        description: "Sự tương phản kinh điển giữa trắng kem ngà và đen tuyền, nút kim loại mạ vàng chạm khắc thủ công.",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800",
        totalPrice: "3.040.000₫",
        products: [
          { name: "Áo Khoác Tweed Ivory Cropped", price: "2.150.000₫" },
          { name: "Quần Tây Slim Fit Black", price: "890.000₫" }
        ]
      },
      {
        id: "outfit-4",
        lookNumber: "LOOK 04",
        category: "MODERN TAILORING",
        title: "Oversized Charcoal Blazer & Minimalist Shirt",
        description: "Phong thái nữ quyền độc lập và tự do, phom dáng rộng thoải mái cùng đường may vai sắc nét chuẩn quý cô Paris.",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
        totalPrice: "2.700.000₫",
        products: [
          { name: "Áo Blazer Kẻ Sọc Pinstripe", price: "1.950.000₫" },
          { name: "Sơ Mi Poplin Cotton Trắng", price: "750.000₫" }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "The Modern Tailoring & Parisian Chic",
    code: "LB - RTW25 - 02",
    season: "Ready-To-Wear",
    position: 2,
    productCount: 3,
    status: "published",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600",
    description: "Tôn vinh đường nét cắt may tối giản, kết hợp phong cách đường phố đương đại của giới trẻ Paris.",
    conversionRate: "28%",
    outfits: []
  },
  {
    id: 3,
    title: "Evening Gala & Haute Couture Atelier",
    code: "LB - GALA25 - 03",
    season: "Gala Dạ Tiệc",
    position: 3,
    productCount: 2,
    status: "published",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=600",
    description: "Những thiết kế đầm tiệc lộng lẫy điểm xuyết sequin và lụa tơ tằm thượng hạng cho đêm dạ vũ.",
    conversionRate: "24%",
    outfits: []
  },
  {
    id: 4,
    title: "Minimalist Silk & Cashmere Sensations",
    code: "LB - SILK25 - 04",
    season: "Phong cách Tối Giản",
    position: 4,
    productCount: 3,
    status: "published",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600",
    description: "Sự thăng hoa của cảm giác mượt mà trên làn da, phom dáng suông rộng thanh lịch vượt thời gian.",
    conversionRate: "21%",
    outfits: []
  },
  {
    id: 5,
    title: "Spring Essence: Whispers of Spring 2026",
    code: "LB - SS26 - 05",
    season: "Mùa Xuân Hè",
    position: 5,
    productCount: 1,
    status: "hidden",
    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=600",
    description: "Sắc màu tươi mới chuẩn bị ra mắt cho mùa lễ hội mùa xuân sắp tới.",
    conversionRate: "12%",
    outfits: []
  },
  {
    id: 6,
    title: "Heritage Wool & Bespoke Overcoats",
    code: "LB - WOOL25 - 06",
    season: "Áo Khoác & Len",
    position: 6,
    productCount: 2,
    status: "published",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600",
    description: "Dòng áo khoác mang tính di sản, sử dụng 100% len cừu nguyên chất từ Úc.",
    conversionRate: "19%",
    outfits: []
  }
];

export const getStoredLookbooks = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load lookbooks from storage', e);
  }
  // If not stored yet, seed initial items
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

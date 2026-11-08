/**
 * vietnameseQueryParser.js
 * Bộ phân tích và bóc tách thực thể truy vấn thời trang tiếng Việt (Vietnamese Fashion Query Parser).
 * 
 * Chức năng:
 * 1. Text Normalization: Chuẩn hóa Unicode NFC, khoảng trắng, chữ thường, hỗ trợ có dấu và không dấu.
 * 2. Category Extraction: Nhận diện danh mục thời trang dựa trên 23 Category thực tế của FashionAI.
 * 3. Color Extraction: Nhận diện màu sắc theo nguyên tắc Global Longest-Match-First (xanh navy > xanh).
 * 4. Attribute Extraction: Bóc tách Gender (nam/nữ/unisex), Fit (oversize, slim...), Material (nỉ, dạ...), Style (công sở, dự tiệc...).
 * 5. Synonym Expansion: Mở rộng từ đồng nghĩa phục vụ Keyword Search (áo phông <-> áo thun, quần bò <-> quần jean).
 * 6. CLIP English Prompt Mapping: Sinh prompt tiếng Anh chuẩn hóa để làm cầu nối ngữ nghĩa với CLIP Text Encoder.
 * 7. Non-destructive Token Tracking: Không nhận diện nhầm từ con (VD: "áo sơ mi" không bị nhận diện thành "áo thun", "đồ nam" không bị gán thành áo nam).
 */

/**
 * Bảng từ điển màu sắc thời trang
 */
export const FASHION_COLORS = [
  // Cụm màu phức hợp (Longest Match First)
  {
    canonical: 'Xanh navy',
    group: 'Xanh',
    hex: '#0F172A',
    en: 'navy blue',
    patterns: ['xanh navy', 'xanh than', 'xanh den', 'xanh đen', 'navy blue', 'dark blue', 'navy'],
  },
  {
    canonical: 'Xanh dương',
    group: 'Xanh',
    hex: '#2563EB',
    en: 'blue',
    patterns: ['xanh duong', 'xanh dương', 'xanh bien', 'xanh biển', 'xanh nuoc bien', 'xanh nước biển', 'xanh coban', 'cobalt', 'royal blue'],
  },
  {
    canonical: 'Xanh pastel',
    group: 'Xanh',
    hex: '#93C5FD',
    en: 'light blue',
    patterns: ['xanh pastel', 'xanh da troi', 'xanh da trời', 'xanh troi', 'xanh trời', 'xanh baby', 'xanh nhat', 'xanh nhạt', 'light blue', 'sky blue'],
  },
  {
    canonical: 'Xanh lá',
    group: 'Xanh lá',
    hex: '#16A34A',
    en: 'green',
    patterns: ['xanh la', 'xanh lá', 'xanh luc', 'xanh lục', 'xanh reu', 'xanh rêu', 'xanh bo', 'xanh bơ', 'olive', 'moss', 'reu', 'rêu', 'green'],
  },
  {
    canonical: 'Đỏ đô',
    group: 'Đỏ',
    hex: '#881337',
    en: 'burgundy red',
    patterns: ['do do', 'đỏ đô', 'do man', 'đỏ mận', 'do ruou', 'đỏ rượu', 'burgundy', 'maroon', 'wine'],
  },
  {
    canonical: 'Xám khói',
    group: 'Xám',
    hex: '#4B5563',
    en: 'charcoal grey',
    patterns: ['xam khoi', 'xám khói', 'xam tieu', 'xám tiêu', 'ghi dam', 'ghi đậm', 'than chi', 'than chì', 'charcoal'],
  },
  {
    canonical: 'Vàng tươi',
    group: 'Vàng',
    hex: '#FACC15',
    en: 'bright yellow',
    patterns: ['vang tuoi', 'vàng tươi', 'vang chanh', 'vàng chanh', 'vang mu tat', 'vàng mù tạt', 'mustard'],
  },
  {
    canonical: 'Hồng pastel',
    group: 'Hồng',
    hex: '#FBCFE8',
    en: 'pastel pink',
    patterns: ['hong pastel', 'hồng pastel', 'hong phan', 'hồng phấn', 'hong nhat', 'hồng nhạt', 'baby pink'],
  },
  {
    canonical: 'Trắng kem',
    group: 'Be',
    hex: '#FDFBF7',
    en: 'cream white',
    patterns: ['trang kem', 'trắng kem', 'trang sua', 'trắng sữa', 'trang nga', 'trắng ngà', 'ivory', 'cream'],
  },
  // Các màu đơn căn bản
  {
    canonical: 'Đen',
    group: 'Đen',
    hex: '#111111',
    en: 'black',
    patterns: ['den', 'đen', 'black', 'den tuyen', 'đen tuyền'],
  },
  {
    canonical: 'Trắng',
    group: 'Trắng',
    hex: '#FFFFFF',
    en: 'white',
    patterns: ['trang', 'trắng', 'white', 'trang tinh', 'trắng tinh'],
  },
  {
    canonical: 'Đỏ',
    group: 'Đỏ',
    hex: '#DC2626',
    en: 'red',
    patterns: ['do', 'đỏ', 'red', 'do tuoi', 'đỏ tươi'],
  },
  {
    canonical: 'Xanh',
    group: 'Xanh',
    hex: '#2563EB',
    en: 'blue',
    patterns: ['xanh', 'blue'],
  },
  {
    canonical: 'Vàng',
    group: 'Vàng',
    hex: '#EAB308',
    en: 'yellow',
    patterns: ['vang', 'vàng', 'yellow', 'gold'],
  },
  {
    canonical: 'Xám',
    group: 'Xám',
    hex: '#6B7280',
    en: 'grey',
    patterns: ['xam', 'xám', 'ghi', 'gray', 'grey'],
  },
  {
    canonical: 'Nâu',
    group: 'Nâu',
    hex: '#78350F',
    en: 'brown',
    patterns: ['nau dat', 'nâu đất', 'mau da bo', 'màu da bò', 'camel', 'nau', 'nâu', 'brown'],
  },
  {
    canonical: 'Be',
    group: 'Be',
    hex: '#E7DEC8',
    en: 'beige',
    patterns: ['be', 'beige', 'kem'],
  },
  {
    canonical: 'Hồng',
    group: 'Hồng',
    hex: '#EC4899',
    en: 'pink',
    patterns: ['hong', 'hồng', 'pink'],
  },
  {
    canonical: 'Tím',
    group: 'Tím',
    hex: '#7C3AED',
    en: 'purple',
    patterns: ['tim', 'tím', 'purple', 'violet', 'lavender'],
  },
  {
    canonical: 'Cam',
    group: 'Cam',
    hex: '#EA580C',
    en: 'orange',
    patterns: ['cam', 'orange'],
  },
];

/**
 * Bảng từ điển Danh mục thời trang khớp chuẩn 23 Category trong Database FashionAI
 */
export const FASHION_CATEGORIES = [
  {
    canonical: 'Bộ Đồ Thể Thao',
    dbCategory: 'Bộ Đồ Thể Thao',
    en: 'tracksuit athletic set',
    synonyms: ['bộ đồ thể thao', 'set thể thao', 'bộ nỉ hoodie', 'tracksuit'],
    autoStyle: 'thể thao',
    patterns: [
      'bo do the thao', 'bộ đồ thể thao',
      'bo do ni hoodie the thao', 'bộ đồ nỉ hoodie thể thao',
      'bo do ni the thao', 'bộ đồ nỉ thể thao',
      'set the thao', 'set thể thao',
      'bo ni the thao', 'bộ nỉ thể thao',
      'bo ni hoodie', 'bộ nỉ hoodie',
      'bo ni', 'bộ nỉ',
      'tracksuit',
    ],
  },
  {
    canonical: 'Áo Hoodie & Sweater',
    dbCategory: 'Áo Hoodie & Sweater',
    en: 'hoodie sweatshirt',
    synonyms: ['áo hoodie', 'hoodie', 'áo sweater', 'sweater', 'áo nỉ có mũ', 'áo có mũ', 'áo mũ', 'sweatshirt'],
    patterns: [
      'ao hoodie co mu', 'áo hoodie có mũ', 'áo hoodie co mu', 'ao hoodie có mũ',
      'ao hoodie', 'áo hoodie', 'hoodie',
      'ao sweater', 'áo sweater', 'sweater',
      'ao ni co mu', 'áo nỉ có mũ', 'áo nỉ co mu', 'ao ni có mũ',
      'ao co mu', 'áo có mũ', 'áo co mu', 'ao có mũ',
      'ao mu', 'áo mũ', 'áo mu', 'ao mũ',
      'ao ni chui dau', 'áo nỉ chui đầu',
      'sweatshirt',
    ],
  },
  {
    canonical: 'Áo thun',
    dbCategory: 'Áo thun',
    en: 't-shirt tee',
    synonyms: ['áo thun', 'áo phông', 't-shirt', 'tee'],
    patterns: [
      't-shirt', 't shirt', 'tshirt',
      'ao thun', 'áo thun',
      'ao phong', 'áo phông',
      'tee',
    ],
  },
  {
    canonical: 'Áo sơ mi',
    dbCategory: 'Áo sơ mi',
    en: 'button down shirt',
    synonyms: ['áo sơ mi', 'sơ mi', 'áo sơ mi oxford', 'shirt'],
    patterns: [
      'ao so mi oxford', 'áo sơ mi oxford',
      'ao so mi', 'áo sơ mi',
      'so mi', 'sơ mi',
      'ao oxford', 'áo oxford',
      'button down', 'shirt',
    ],
  },
  {
    canonical: 'Áo Polo',
    dbCategory: 'Áo Polo',
    en: 'polo shirt',
    synonyms: ['áo polo', 'polo'],
    patterns: ['ao polo', 'áo polo', 'polo'],
  },
  {
    canonical: 'Áo khoác & Jacket',
    dbCategory: 'Áo khoác & Jacket',
    en: 'jacket coat overcoat',
    synonyms: ['áo khoác', 'áo măng tô', 'jacket', 'bomber', 'overcoat'],
    patterns: [
      'ao mang to', 'áo măng tô', 'mang to', 'măng tô',
      'ao khoac da', 'áo khoác dạ',
      'ao bomber', 'áo bomber', 'bomber',
      'ao khoac', 'áo khoác', 'khoac', 'khoác',
      'overcoat', 'jacket', 'coat',
      'ao gio', 'áo gió',
    ],
  },
  {
    canonical: 'Áo Vest & Blazer',
    dbCategory: 'Áo Vest & Blazer',
    en: 'blazer suit jacket',
    synonyms: ['áo blazer', 'blazer', 'áo vest', 'suit'],
    patterns: [
      'ao blazer', 'áo blazer', 'blazer',
      'ao vest', 'áo vest', 'vest', 'suit',
    ],
  },
  {
    canonical: 'Quần Jeans',
    dbCategory: 'Quần Jeans',
    en: 'jeans denim pants',
    synonyms: ['quần jean', 'quần bò', 'quần denim', 'jeans'],
    patterns: [
      'quan jeans', 'quần jeans',
      'quan jean', 'quần jean',
      'quan bo', 'quần bò',
      'quan denim', 'quần denim',
      'denim pants', 'jeans', 'jean',
    ],
  },
  {
    canonical: 'Quần Tây & Trouser',
    dbCategory: 'Quần Tây & Trouser',
    en: 'tailored trousers dress pants',
    synonyms: ['quần tây', 'quần âu', 'quần công sở', 'trouser'],
    patterns: [
      'quan cong so', 'quần công sở',
      'quan tay', 'quần tây',
      'quan au', 'quần âu',
      'dress pants', 'trouser', 'trousers', 'slacks',
    ],
  },
  {
    canonical: 'Quần Jogger & Thể thao',
    dbCategory: 'Quần Jogger & Thể thao',
    en: 'joggers sweatpants',
    synonyms: ['quần jogger', 'quần nỉ bo gấu', 'sweatpants'],
    patterns: [
      'quan ni bo gau', 'quần nỉ bo gấu',
      'quan jogger', 'quần jogger', 'jogger',
      'sweatpants',
    ],
  },
  {
    canonical: 'Quần Kaki & Chino',
    dbCategory: 'Quần Kaki & Chino',
    en: 'chino khaki pants',
    synonyms: ['quần kaki', 'quần chino', 'chino'],
    patterns: [
      'quan chino', 'quần chino',
      'quan kaki', 'quần kaki',
      'khaki pants', 'chino',
    ],
  },
  {
    canonical: 'Quần Short',
    dbCategory: 'Quần Short',
    en: 'shorts',
    synonyms: ['quần short', 'quần đùi', 'quần soóc'],
    patterns: [
      'quan short', 'quần short',
      'quan dui', 'quần đùi',
      'quan sooc', 'quần soóc',
      'shorts',
    ],
  },
  {
    canonical: 'Chân Váy',
    dbCategory: 'Chân Váy',
    en: 'skirt',
    synonyms: ['chân váy', 'skirt'],
    patterns: ['chan vay', 'chân váy', 'skirt'],
  },
  {
    canonical: 'Trang Phục Dạ Hội',
    dbCategory: 'Trang Phục Dạ Hội',
    en: 'evening party dress gown',
    synonyms: ['váy dạ hội', 'đầm dạ hội', 'váy đầm', 'đầm', 'váy', 'dress'],
    autoStyle: 'dự tiệc',
    patterns: [
      'vay dam da hoi', 'váy đầm dạ hội',
      'dam da hoi', 'đầm dạ hội',
      'vay da hoi', 'váy dạ hội',
      'vay dam', 'váy đầm',
      'dam', 'đầm',
      'vay', 'váy',
      'gown', 'dress',
    ],
  },
  {
    canonical: 'Đồ Đông & Áo Len',
    dbCategory: 'Đồ Đông & Áo Len',
    en: 'sweater knitwear',
    synonyms: ['áo len', 'áo len cổ lọ', 'knitwear'],
    patterns: [
      'ao len co lo', 'áo len cổ lọ',
      'ao len', 'áo len',
      'gile len', 'gilê len',
      'knitwear',
    ],
  },
  {
    canonical: 'Giày & Sandal',
    dbCategory: 'Giày & Sandal',
    en: 'shoes sneakers sandals',
    synonyms: ['giày sneaker', 'giày thể thao', 'sandal', 'sneaker'],
    patterns: [
      'giay sneaker', 'giày sneaker',
      'giay the thao', 'giày thể thao',
      'giay', 'giày',
      'sandal', 'dép', 'dep',
      'sneaker', 'shoes',
    ],
  },
  {
    canonical: 'Mũ & Nón Thời Trang',
    dbCategory: 'Mũ & Nón Thời Trang',
    en: 'beanie cap hat',
    synonyms: ['mũ len', 'mũ beanie', 'mũ lưỡi trai', 'nón'],
    patterns: [
      'mu luoi trai', 'mũ lưỡi trai',
      'mu beanie', 'mũ beanie',
      'mu len', 'mũ len',
      'beanie', 'cap', 'hat',
      'mu', 'mũ', 'non', 'nón',
    ],
  },
  {
    canonical: 'Kính Mát Thời Trang',
    dbCategory: 'Kính Mát Thời Trang',
    en: 'sunglasses eyewear',
    synonyms: ['kính mát', 'kính râm', 'sunglasses'],
    patterns: [
      'kinh thoi trang', 'kính thời trang',
      'kinh mat', 'kính mát',
      'kinh ram', 'kính râm',
      'sunglasses',
    ],
  },
  {
    canonical: 'Túi Xách & Balo',
    dbCategory: 'Túi Xách & Balo',
    en: 'handbag backpack bag',
    synonyms: ['túi xách', 'balo', 'túi đeo chéo'],
    patterns: [
      'tui deo cheo', 'túi đeo chéo',
      'tui xach', 'túi xách',
      'backpack', 'handbag',
      'balo', 'ba lô',
    ],
  },
  {
    canonical: 'Thắt Lưng & Ví Da',
    dbCategory: 'Thắt Lưng & Ví Da',
    en: 'leather belt wallet',
    synonyms: ['thắt lưng', 'ví da', 'dây nịt'],
    patterns: [
      'that lung', 'thắt lưng',
      'day nit', 'dây nịt',
      'vi da', 'ví da',
      'wallet', 'belt',
    ],
  },
  {
    canonical: 'Khăn Quàng & Phụ Kiện',
    dbCategory: 'Khăn Quàng & Phụ Kiện',
    en: 'scarf accessories',
    synonyms: ['khăn quàng', 'khăn len', 'scarf'],
    patterns: [
      'khan quang', 'khăn quàng',
      'khan len', 'khăn len',
      'scarf',
    ],
  },
  {
    canonical: 'Đồ Lót & Đồ Mặc Nhà',
    dbCategory: 'Đồ Lót & Đồ Mặc Nhà',
    en: 'pyjama loungewear sleepwear',
    synonyms: ['đồ mặc nhà', 'pyjama', 'đồ ngủ'],
    patterns: [
      'do mac nha', 'đồ mặc nhà',
      'pyjama', 'pajama', 'pijama',
      'do ngu', 'đồ ngủ',
    ],
  },
  {
    canonical: 'Đồ Bơi & Mùa Hè',
    dbCategory: 'Đồ Bơi & Mùa Hè',
    en: 'swimwear bikini',
    synonyms: ['đồ bơi', 'bikini'],
    patterns: ['do boi', 'đồ bơi', 'bikini', 'swimwear'],
  },
];

/**
 * Bảng từ điển Thuộc tính mở rộng (Gender, Fit, Material, Style)
 */
export const FASHION_ATTRIBUTES = {
  // 1. Giới tính (Gender)
  gender: [
    {
      value: 'nam',
      en: 'men',
      patterns: ['dan ong', 'đàn ông', 'nam gioi', 'nam giới', 'cho nam', 'men', 'man', 'nam'],
    },
    {
      value: 'nữ',
      en: 'women',
      patterns: ['phu nu', 'phụ nữ', 'nu gioi', 'nữ giới', 'phai dep', 'phái đẹp', 'cho nu', 'cho nữ', 'women', 'woman', 'nu', 'nữ'],
    },
    {
      value: 'unisex',
      en: 'unisex',
      patterns: ['ca nam va nu', 'cả nam và nữ', 'nam nu', 'nam nữ', 'unisex'],
    },
  ],

  // 2. Kiểu dáng / Phom dáng (Fit)
  fit: [
    {
      value: 'oversize',
      en: 'oversized loose fit',
      patterns: [
        'thung thinh', 'thùng thình',
        'form rong', 'form rộng',
        'dang rong', 'dáng rộng',
        'phom rong', 'phom rộng',
        'rong rai', 'rộng rãi',
        'oversized', 'oversize',
      ],
    },
    {
      value: 'slim fit',
      en: 'slim fit',
      patterns: [
        'slim fit', 'slimfit',
        'om sat', 'ôm sát',
        'dang om', 'dáng ôm',
        'bo sat', 'bó sát',
        'body',
      ],
    },
    {
      value: 'regular fit',
      en: 'regular fit',
      patterns: [
        'regular fit', 'regularfit',
        'chuan form', 'chuẩn form',
        'vua van', 'vừa vặn',
      ],
    },
    {
      value: 'ống suông',
      en: 'straight leg',
      patterns: [
        'straight leg',
        'ong suong', 'ống suông',
        'dang suong', 'dáng suông',
        'suong', 'suông',
      ],
    },
    {
      value: 'ống rộng',
      en: 'wide leg',
      patterns: [
        'wide leg',
        'ong rong', 'ống rộng',
      ],
    },
    {
      value: 'croptop',
      en: 'croptop cropped',
      patterns: [
        'crop top', 'croptop',
        'dang lung', 'dáng lửng',
        'ngan lung', 'ngắn lưng',
        'cropped',
      ],
    },
  ],

  // 3. Chất liệu (Material)
  material: [
    {
      value: 'nỉ',
      en: 'fleece',
      patterns: [
        'ni chan cua', 'nỉ chân cua',
        'ni bong', 'nỉ bông',
        'chat ni', 'chất nỉ',
        'ni tron', 'nỉ trơn',
        'fleece', 'ni', 'nỉ',
      ],
    },
    {
      value: 'cotton',
      en: 'cotton',
      patterns: [
        'cotton compact',
        'cotton 100%', '100% cotton',
        'chat cotton', 'chất cotton',
        'cotton',
      ],
    },
    {
      value: 'denim',
      en: 'denim',
      patterns: [
        'chat denim', 'chất denim',
        'vai bo', 'vải bò',
        'denim',
      ],
    },
    {
      value: 'dạ',
      en: 'wool tweed',
      patterns: [
        'da tweed', 'dạ tweed',
        'chat da', 'chất dạ',
        'da ep', 'dạ ép',
        'tweed', 'wool', 'dạ',
      ],
    },
    {
      value: 'lụa',
      en: 'silk satin',
      patterns: [
        'to tam', 'tơ tằm',
        'lua satin', 'lụa satin',
        'chat lua', 'chất lụa',
        'satin', 'lua', 'lụa', 'silk',
      ],
    },
    {
      value: 'len',
      en: 'knit wool',
      patterns: [
        'det kim', 'dệt kim',
        'chat len', 'chất len',
        'cashmere', 'knit', 'len',
      ],
    },
    {
      value: 'da',
      en: 'leather',
      patterns: [
        'da bo', 'da bò',
        'da pu', 'chat da', 'chất da',
        'leather', 'da',
      ],
    },
    {
      value: 'kaki',
      en: 'khaki',
      patterns: ['vai kaki', 'vải kaki', 'chat kaki', 'chất kaki', 'khaki', 'kaki'],
    },
    {
      value: 'linen',
      en: 'linen',
      patterns: ['vai dui', 'vải đũi', 'linen', 'dui', 'đũi'],
    },
  ],

  // 4. Phong cách & Hoàn cảnh sử dụng (Style)
  style: [
    {
      value: 'công sở',
      en: 'office business elegant',
      patterns: [
        'thanh lich', 'thanh lịch',
        'lich lam', 'lịch lãm',
        'van phong', 'văn phòng',
        'cong so', 'công sở',
        'di lam', 'đi làm',
        'formal', 'office',
      ],
    },
    {
      value: 'thể thao',
      en: 'sporty athletic gym',
      patterns: [
        'tap gym', 'tập gym',
        'the thao', 'thể thao',
        'chay bo', 'chạy bộ',
        'sporty', 'active', 'gym',
      ],
    },
    {
      value: 'dạo phố',
      en: 'casual streetwear',
      patterns: [
        'streetwear', 'casual',
        'duong pho', 'đường phố',
        'dao pho', 'dạo phố',
        'di choi', 'đi chơi',
      ],
    },
    {
      value: 'dự tiệc',
      en: 'evening party luxury',
      patterns: [
        'tiec cuoi', 'tiệc cưới',
        'da hoi', 'dạ hội',
        'sang trong', 'sang trọng',
        'quy phai', 'quý phái',
        'du tiec', 'dự tiệc',
        'di tiec', 'đi tiệc',
        'party', 'evening', 'luxury',
      ],
    },
    {
      value: 'mùa đông',
      en: 'winter warm cold weather',
      patterns: [
        'mua dong', 'mùa đông',
        'troi lanh', 'trời lạnh',
        'mua lanh', 'mùa lạnh',
        'giu am', 'giữ ấm',
        'winter',
      ],
    },
    {
      value: 'mùa hè',
      en: 'summer cool breathable',
      patterns: [
        'thoang mat', 'thoáng mát',
        'mua he', 'mùa hè',
        'mat me', 'mát mẻ',
        'summer',
      ],
    },
  ],
};

/**
 * Danh sách Stop Words tiếng Việt thời trang
 */
const VIETNAMESE_STOP_WORDS = new Set([
  'mau', 'màu',
  'tone', 'tông',
  'loai', 'loại',
  'kieu', 'kiểu',
  'cai', 'cái',
  'chiec', 'chiếc',
  'bo', 'bộ',
  'do', 'đồ',
  'quan', 'ao',
  'cho', 'danh', 'dành',
  'de', 'để',
  'di', 'đi',
  'cua', 'của',
  'va', 'và',
  'voi', 'với',
  'co', 'có',
  'rat', 'rất',
  'cuc', 'cực',
  'dep', 'đẹp',
  'thoi', 'thời',
  'trang',
  'hang', 'hàng',
  'san', 'sản',
  'pham', 'phẩm',
  'gia', 'giá',
  're', 'rẻ',
  'tot', 'tốt',
  'xem', 'tìm', 'tim', 'mua',
  'can', 'cần',
]);

/**
 * Loại bỏ dấu tiếng Việt chuẩn hóa
 */
export function removeVietnameseTones(str) {
  if (!str || typeof str !== 'string') return '';
  let s = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
  return s;
}

/**
 * Chuẩn hóa chuỗi đầu vào cơ bản (Unicode NFC, lowercase, xóa khoảng trắng thừa)
 * Giữ nguyên dấu gạch nối giữa các từ ghép tiếng Anh (ví dụ t-shirt, slim-fit)
 */
export function normalizeVietnameseText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=_`~()?"'\[\]]/g, ' ') // Xóa dấu câu nhưng giữ dấu gạch ngang
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Thuật toán tách lọc an toàn (Safe Token Matcher)
 * Tìm và đánh dấu vùng văn bản đã khớp để tránh nhận diện trùng lặp/vỡ cụm từ
 */
class SpanMatcher {
  constructor(text) {
    this.text = text;
    this.consumedMask = new Array(text.length).fill(false);
  }

  /**
   * Kiểm tra và trích xuất một pattern trong văn bản
   * @param {string[]} patterns - Mảng các chuỗi cần so khớp
   * @returns {string|null} - Trả về pattern khớp thành công hoặc null
   */
  matchAndConsume(patterns) {
    const sorted = [...patterns].sort((a, b) => b.length - a.length);

    for (const p of sorted) {
      const pLen = p.length;
      let startIdx = 0;

      while ((startIdx = this.text.indexOf(p, startIdx)) !== -1) {
        const endIdx = startIdx + pLen;

        // Boundary check: Đầu từ và cuối từ phải là khoảng trắng hoặc biên chuỗi hoặc dấu gạch nối
        const prevChar = startIdx > 0 ? this.text[startIdx - 1] : ' ';
        const nextChar = endIdx < this.text.length ? this.text[endIdx] : ' ';
        const isWordBoundary = (prevChar === ' ' || prevChar === '-') && (nextChar === ' ' || nextChar === '-');

        if (isWordBoundary) {
          let isOverlapping = false;
          for (let i = startIdx; i < endIdx; i++) {
            if (this.consumedMask[i]) {
              isOverlapping = true;
              break;
            }
          }

          if (!isOverlapping) {
            for (let i = startIdx; i < endIdx; i++) {
              this.consumedMask[i] = true;
            }
            return p;
          }
        }

        startIdx++;
      }
    }
    return null;
  }

  /**
   * Tiêu thụ thêm các tiền tố phụ nếu chúng nằm ngay trước một đoạn đã consume
   */
  consumePrefixes(prefixes = ['mau ', 'màu ', 'tone ', 'tông ', 'chat ', 'chất ', 'dang ', 'dáng ']) {
    for (const prefix of prefixes) {
      let idx = 0;
      while ((idx = this.text.indexOf(prefix, idx)) !== -1) {
        const afterPrefix = idx + prefix.length;
        if (afterPrefix < this.text.length && this.consumedMask[afterPrefix]) {
          for (let i = idx; i < afterPrefix; i++) {
            this.consumedMask[i] = true;
          }
        }
        idx++;
      }
    }
  }

  /**
   * Lấy lại các từ chưa được bóc tách vào thuộc tính nào (Remaining Terms)
   */
  getRemainingTerms() {
    let unconsumed = '';
    for (let i = 0; i < this.text.length; i++) {
      unconsumed += this.consumedMask[i] ? ' ' : this.text[i];
    }

    const words = unconsumed
      .split(/\s+/)
      .map((w) => w.trim().replace(/^[-]+|[-]+$/g, ''))
      .filter((w) => w.length > 0 && !VIETNAMESE_STOP_WORDS.has(w));

    return words;
  }
}

/**
 * Tạo danh sách phẳng toàn bộ patterns của Category, sắp xếp theo độ dài giảm dần
 * Đảm bảo Longest-Match-First tuyệt đối giữa các Category (bộ đồ thể thao > hoodie, t-shirt > shirt)
 */
const GLOBAL_CATEGORY_PATTERNS = [];
for (const cat of FASHION_CATEGORIES) {
  for (const pat of cat.patterns) {
    GLOBAL_CATEGORY_PATTERNS.push({
      pattern: pat,
      length: pat.length,
      category: cat,
    });
  }
}
GLOBAL_CATEGORY_PATTERNS.sort((a, b) => b.length - a.length);

/**
 * Hàm phân tích truy vấn thời trang tiếng Việt toàn diện (Main Parser Function)
 * @param {string} rawQuery - Truy vấn gốc từ người dùng
 * @returns {object} - Object kết quả phân tích có cấu trúc
 */
export function parseVietnameseQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string' || rawQuery.trim() === '') {
    return {
      originalQuery: rawQuery || '',
      normalizedQuery: '',
      category: null,
      dbCategory: null,
      gender: null,
      color: null,
      colorHex: null,
      colorGroup: null,
      fit: null,
      material: null,
      style: null,
      synonyms: [],
      englishPrompt: '',
      remainingTerms: [],
    };
  }

  const originalQuery = rawQuery.trim();
  const normalizedQuery = normalizeVietnameseText(originalQuery);

  const matcher = new SpanMatcher(normalizedQuery);

  let detectedCategory = null;
  let dbCategory = null;
  let categoryEn = '';
  let synonyms = [];
  let autoStyleFromCat = null;

  let detectedColor = null;
  let colorHex = null;
  let colorGroup = null;
  let colorEn = '';

  let detectedGender = null;
  let genderEn = '';

  let detectedFit = null;
  let fitEn = '';

  let detectedMaterial = null;
  let materialEn = '';

  let detectedStyle = null;
  let styleEn = '';

  // 1. Nhận diện Category theo Global Longest-Match-First
  for (const item of GLOBAL_CATEGORY_PATTERNS) {
    const matched = matcher.matchAndConsume([item.pattern]);
    if (matched) {
      detectedCategory = item.category.canonical;
      dbCategory = item.category.dbCategory;
      categoryEn = item.category.en;
      synonyms = [...item.category.synonyms];
      if (item.category.autoStyle) {
        autoStyleFromCat = item.category.autoStyle;
      }
      break;
    }
  }

  // 2. Nhận diện Màu sắc (Longest Match First)
  for (const col of FASHION_COLORS) {
    const matched = matcher.matchAndConsume(col.patterns);
    if (matched) {
      detectedColor = col.canonical;
      colorHex = col.hex;
      colorGroup = col.group;
      colorEn = col.en;
      break;
    }
  }

  // 3. Nhận diện Giới tính (Gender)
  for (const gen of FASHION_ATTRIBUTES.gender) {
    const matched = matcher.matchAndConsume(gen.patterns);
    if (matched) {
      detectedGender = gen.value;
      genderEn = gen.en;
      break;
    }
  }

  // 4. Nhận diện Kiểu dáng / Phom dáng (Fit)
  for (const f of FASHION_ATTRIBUTES.fit) {
    const matched = matcher.matchAndConsume(f.patterns);
    if (matched) {
      detectedFit = f.value;
      fitEn = f.en;
      break;
    }
  }

  // 5. Nhận diện Chất liệu (Material)
  for (const mat of FASHION_ATTRIBUTES.material) {
    const matched = matcher.matchAndConsume(mat.patterns);
    if (matched) {
      detectedMaterial = mat.value;
      materialEn = mat.en;
      break;
    }
  }

  // 6. Nhận diện Phong cách & Hoàn cảnh (Style)
  for (const sty of FASHION_ATTRIBUTES.style) {
    const matched = matcher.matchAndConsume(sty.patterns);
    if (matched) {
      detectedStyle = sty.value;
      styleEn = sty.en;
      break;
    }
  }

  // Nếu chưa nhận diện được Style mà Category có autoStyle (ví dụ Trang Phục Dạ Hội) -> gán style phù hợp
  if (!detectedStyle && autoStyleFromCat) {
    detectedStyle = autoStyleFromCat;
  }

  // Tiêu thụ các từ tiền tố (như "màu", "chất", "dáng") nếu nằm liền kề
  matcher.consumePrefixes();

  // Trích xuất các từ còn lại chưa được gán vào thuộc tính nào
  const remainingTerms = matcher.getRemainingTerms();

  // 6.5. Nhận diện Dòng trang phục rộng (Broad Garment Type) khi chưa có Category cụ thể
  let broadCategory = null;
  let broadCategoryEn = '';

  if (!detectedCategory) {
    const qNorm = ` ${normalizedQuery} `;
    if (/(?:^|\s)(ao|áo|top|shirt)(?:\s|$)/i.test(qNorm)) {
      broadCategory = 'TOPS';
      broadCategoryEn = 'shirt top clothing';
    } else if (/(?:^|\s)(quan|quần|pants|trousers)(?:\s|$)/i.test(qNorm)) {
      broadCategory = 'BOTTOMS';
      broadCategoryEn = 'pants trousers clothing';
    } else if (/(?:^|\s)(vay|váy|dam|đầm|dress|skirt)(?:\s|$)/i.test(qNorm)) {
      broadCategory = 'DRESSES_SKIRTS';
      broadCategoryEn = 'dress skirt clothing';
    } else if (/(?:^|\s)(mu|mũ|non|nón|hat|cap)(?:\s|$)/i.test(qNorm)) {
      broadCategory = 'HEADWEAR';
      broadCategoryEn = 'hat cap headwear';
    } else if (/(?:^|\s)(giay|giày|dep|dép|shoes|footwear|sneakers)(?:\s|$)/i.test(qNorm)) {
      broadCategory = 'FOOTWEAR';
      broadCategoryEn = 'shoes footwear sneakers';
    } else if (/(?:^|\s)(tui|túi|balo|ba lô|bag|backpack)(?:\s|$)/i.test(qNorm)) {
      broadCategory = 'BAGS';
      broadCategoryEn = 'bag backpack';
    }
  }

  // 7. Tạo Semantic English Prompt phục vụ cầu nối CLIP Text Encoder
  const promptParts = [
    genderEn,
    fitEn,
    colorEn,
    materialEn,
    categoryEn || broadCategoryEn,
    styleEn,
    ...remainingTerms.filter((term) => term.length > 2 && term !== 'áo' && term !== 'ao' && term !== 'quần' && term !== 'quan'),
  ].filter(Boolean);

  const englishPrompt = promptParts.join(' ').trim();

  return {
    originalQuery,
    normalizedQuery,
    category: detectedCategory,
    dbCategory,
    broadCategory,
    gender: detectedGender,
    color: detectedColor,
    colorHex,
    colorGroup,
    fit: detectedFit,
    material: detectedMaterial,
    style: detectedStyle,
    synonyms,
    englishPrompt: englishPrompt || normalizedQuery,
    remainingTerms,
  };
}

export default parseVietnameseQuery;

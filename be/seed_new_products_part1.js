import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const productsCatalog = [
  // =========================================================================
  // 1. Áo Hoodie & Sweater
  // =========================================================================
  {
    product_name: "Áo Hoodie Nỉ Bông Phom Rộng Màu Xanh Nước Biển",
    description: "Áo hoodie nỉ bông cao cấp màu xanh nước biển tươi tắn trẻ trung, phom dáng oversize streetwear thời thượng. Mũ trùm hai lớp dày dặn, có dây rút tùy chỉnh và túi kangaroo tiện dụng trước bụng. Chất nỉ bông giữ ấm vượt trội trong mùa lạnh.",
    category_name: "Áo Hoodie & Sweater",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80", alt: "Áo Hoodie Nỉ Bông Màu Xanh Nước Biển", is_primary: true }],
    variants: [
      { sku: "HD-04-XNB-S", size: "S", color: "Xanh nước biển", price: 450000, stock: 40 },
      { sku: "HD-04-XNB-M", size: "M", color: "Xanh nước biển", price: 450000, stock: 50 },
      { sku: "HD-04-XNB-L", size: "L", color: "Xanh nước biển", price: 450000, stock: 35 }
    ]
  },
  {
    product_name: "Áo Sweater Dệt Kim Cổ Tròn Màu Trắng",
    description: "Áo sweater dệt kim màu trắng kem nhã nhặn, chất len dệt mềm mịn không ngứa xù. Thiết kế cổ tròn basic bo gấu nhẹ nhàng mang đậm phong cách tối giản thanh lịch, phù hợp mặc đi làm và dạo phố.",
    category_name: "Áo Hoodie & Sweater",
    brand_name: "Minimalist Line",
    images: [{ url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80", alt: "Áo Sweater Dệt Kim Màu Trắng", is_primary: true }],
    variants: [
      { sku: "SW-04-TRG-M", size: "M", color: "Trắng", price: 420000, stock: 45 },
      { sku: "SW-04-TRG-L", size: "L", color: "Trắng", price: 420000, stock: 30 }
    ]
  },
  {
    product_name: "Áo Hoodie Zip Khóa Kéo Nỉ Dày Màu Đen",
    description: "Áo khoác hoodie nỉ có khóa zip màu đen tuyền cá tính, khóa kéo kim loại chống kẹt mượt mà. Phom dáng suông phóng khoáng đậm chất thời trang đường phố, vải nỉ lót bông êm ái.",
    category_name: "Áo Hoodie & Sweater",
    brand_name: "Urban Streetwear",
    images: [{ url: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80", alt: "Áo Hoodie Zip Khóa Kéo Màu Đen", is_primary: true }],
    variants: [
      { sku: "HDZ-04-DEN-M", size: "M", color: "Đen", price: 490000, stock: 35 },
      { sku: "HDZ-04-DEN-L", size: "L", color: "Đen", price: 490000, stock: 40 }
    ]
  },
  {
    product_name: "Áo Sweater Nỉ Bo Gấu Thoải Mái Màu Xám",
    description: "Áo sweater nỉ màu xám tiêu phong cách học đường năng động, cổ áo và cổ tay phối dệt gân co giãn tốt. Chất nỉ chân cua bền đẹp, thoáng khí và giữ phom chuẩn mực.",
    category_name: "Áo Hoodie & Sweater",
    brand_name: "Casual Essentials",
    images: [{ url: "https://images.unsplash.com/photo-1636103983543-4b59893304fb?auto=format&fit=crop&w=800&q=80", alt: "Áo Sweater Nỉ Màu Xám", is_primary: true }],
    variants: [
      { sku: "SW-04-XAM-S", size: "S", color: "Xám", price: 390000, stock: 30 },
      { sku: "SW-04-XAM-M", size: "M", color: "Xám", price: 390000, stock: 40 }
    ]
  },
  {
    product_name: "Áo Hoodie Nỉ Bông Có Mũ Màu Đỏ",
    description: "Áo hoodie nỉ màu đỏ nổi bật đầy sức sống, chất liệu bông tự nhiên mềm mại giữ ấm hoàn hảo. Thiết kế mũ trùm thời thượng phối dây dệt bền bỉ, thích hợp cho các buổi dạo chơi ngoài trời.",
    category_name: "Áo Hoodie & Sweater",
    brand_name: "Tokyo Underground",
    images: [{ url: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80", alt: "Áo Hoodie Nỉ Bông Màu Đỏ", is_primary: true }],
    variants: [
      { sku: "HD-04-DO-M", size: "M", color: "Đỏ", price: 470000, stock: 30 },
      { sku: "HD-04-DO-L", size: "L", color: "Đỏ", price: 470000, stock: 25 }
    ]
  },
  {
    product_name: "Áo Sweater Len Dệt Thừng Mùa Đông Màu Be",
    description: "Áo sweater len dệt thừng màu be cổ điển, phom dáng vintage ấm áp chuẩn phong cách Bắc Âu. Sợi len cao cấp không bai nhão, giữ ấm tối đa khi thời tiết chuyển lạnh.",
    category_name: "Áo Hoodie & Sweater",
    brand_name: "Nordic Pure",
    images: [{ url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80", alt: "Áo Sweater Len Dệt Thừng Màu Be", is_primary: true }],
    variants: [
      { sku: "SW-04-BE-M", size: "M", color: "Be", price: 460000, stock: 35 },
      { sku: "SW-04-BE-L", size: "L", color: "Be", price: 460000, stock: 25 }
    ]
  },
  {
    product_name: "Áo Sweater Nỉ Cổ Tròn Dáng Rộng Màu Xanh Lá",
    description: "Áo sweater nỉ dáng rộng màu xanh lá mạ cá tính, chất vải nỉ da cá co giãn êm dịu, đường may trần đè tỉ mỉ tạo điểm nhấn trẻ trung ấn tượng.",
    category_name: "Áo Hoodie & Sweater",
    brand_name: "Eco Style Co.",
    images: [{ url: "https://images.unsplash.com/photo-1586363129094-d7a38564fae1?auto=format&fit=crop&w=800&q=80", alt: "Áo Sweater Nỉ Màu Xanh Lá", is_primary: true }],
    variants: [
      { sku: "SW-04-XL-M", size: "M", color: "Xanh lá", price: 430000, stock: 30 },
      { sku: "SW-04-XL-L", size: "L", color: "Xanh lá", price: 430000, stock: 35 }
    ]
  },

  // =========================================================================
  // 2. Áo khoác
  // =========================================================================
  {
    product_name: "Áo Khoác Gió Hai Lớp Chống Nước Màu Xanh Nước Biển",
    description: "Áo khoác gió thể thao màu xanh nước biển trẻ trung, công nghệ trượt nước kháng gió tối ưu cho thời tiết mưa phùn. Thiết kế khóa kéo kín cùng mũ gập tiện ích, lót lưới thông thoáng bên trong.",
    category_name: "Áo khoác",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80", alt: "Áo Khoác Gió Màu Xanh Nước Biển", is_primary: true }],
    variants: [
      { sku: "AK-05-XNB-M", size: "M", color: "Xanh nước biển", price: 520000, stock: 40 },
      { sku: "AK-05-XNB-L", size: "L", color: "Xanh nước biển", price: 520000, stock: 35 }
    ]
  },
  {
    product_name: "Áo Khoác Măng Tô Dạ Dáng Dài Thanh Lịch Màu Be",
    description: "Áo khoác măng tô màu be sang trọng dáng dài chuẩn phom Châu Âu, kèm đai thắt eo tôn dáng thanh thoát. Chất vải dạ ép 2 mặt ấm áp, đứng phom và không nhăn nhàu.",
    category_name: "Áo khoác",
    brand_name: "Minimalist Line",
    images: [{ url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80", alt: "Áo Khoác Măng Tô Màu Be", is_primary: true }],
    variants: [
      { sku: "AK-05-BE-M", size: "M", color: "Be", price: 890000, stock: 25 },
      { sku: "AK-05-BE-L", size: "L", color: "Be", price: 890000, stock: 20 }
    ]
  },
  {
    product_name: "Áo Khoác Phao Lông Vũ Dày Ấm Màu Đen",
    description: "Áo khoác phao màu đen tuyền cổ cao chắn gió, trần bông lông vũ siêu nhẹ giữ nhiệt tối đa dưới nhiệt độ thấp. Thiết kế túi khóa kéo hai bên an toàn tiện lợi.",
    category_name: "Áo khoác",
    brand_name: "Urban Streetwear",
    images: [{ url: "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80", alt: "Áo Khoác Phao Màu Đen", is_primary: true }],
    variants: [
      { sku: "AK-05-DEN-M", size: "M", color: "Đen", price: 790000, stock: 30 },
      { sku: "AK-05-DEN-L", size: "L", color: "Đen", price: 790000, stock: 25 }
    ]
  },
  {
    product_name: "Áo Khoác Dạ Mùa Đông Dáng Dài Cổ Bẻ Màu Nâu",
    description: "Áo khoác dạ màu nâu ấm áp, đường may may đo tinh xảo với hàng cúc sừng sang trọng. Phom dáng suông rộng rãi dễ dàng phối layer cùng áo len hay sơ mi bên trong.",
    category_name: "Áo khoác",
    brand_name: "Heritage Vintage",
    images: [{ url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80", alt: "Áo Khoác Dạ Dáng Dài Màu Nâu", is_primary: true }],
    variants: [
      { sku: "AK-05-NAU-M", size: "M", color: "Nâu", price: 850000, stock: 25 },
      { sku: "AK-05-NAU-L", size: "L", color: "Nâu", price: 850000, stock: 20 }
    ]
  },
  {
    product_name: "Áo Khoác Cardigan Len Dệt Kim Dáng Rộng Màu Xám",
    description: "Áo khoác cardigan len màu xám tiêu nhẹ nhàng, phong cách ulzzang dạo phố trẻ trung. Sợi len mềm thoáng, cúc cài tròn vintage dễ dàng khoác ngoài mọi trang phục.",
    category_name: "Áo khoác",
    brand_name: "Casual Essentials",
    images: [{ url: "https://images.unsplash.com/photo-1636103983543-4b59893304fb?auto=format&fit=crop&w=800&q=80", alt: "Áo Khoác Cardigan Len Màu Xám", is_primary: true }],
    variants: [
      { sku: "AK-05-XAM-S", size: "S", color: "Xám", price: 460000, stock: 35 },
      { sku: "AK-05-XAM-M", size: "M", color: "Xám", price: 460000, stock: 30 }
    ]
  },
  {
    product_name: "Áo Khoác Dù Mỏng Nhẹ Chống Nắng Màu Trắng",
    description: "Áo khoác dù siêu nhẹ màu trắng tinh khiết, sợi vải phủ lớp phản xạ tia cực tím UV protection bảo vệ da tối đa. Dáng áo phom suông thể thao gấp gọn bỏ túi tiện lợi.",
    category_name: "Áo khoác",
    brand_name: "Sporty Activewear",
    images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80", alt: "Áo Khoác Dù Chống Nắng Màu Trắng", is_primary: true }],
    variants: [
      { sku: "AK-05-TRG-M", size: "M", color: "Trắng", price: 380000, stock: 45 },
      { sku: "AK-05-TRG-L", size: "L", color: "Trắng", price: 380000, stock: 40 }
    ]
  },
  {
    product_name: "Áo Khoác Kaki Túi Hộp Safari Thời Trang Màu Xanh Rêu",
    description: "Áo khoác kaki màu xanh rêu phong cách quân đội safari bụi bặm, chất vải kaki cotton dày dặn đứng phom cùng 4 túi hộp tiện dụng ở thân trước.",
    category_name: "Áo khoác",
    brand_name: "Urban Streetwear",
    images: [{ url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80", alt: "Áo Khoác Kaki Safari Màu Xanh Rêu", is_primary: true }],
    variants: [
      { sku: "AK-05-XR-M", size: "M", color: "Xanh lá", price: 580000, stock: 30 },
      { sku: "AK-05-XR-L", size: "L", color: "Xanh lá", price: 580000, stock: 25 }
    ]
  },

  // =========================================================================
  // 3. Áo khoác & Jacket
  // =========================================================================
  {
    product_name: "Áo Khoác Denim Bò Cổ Bẻ Phong Cách Retro Màu Xanh Nước Biển",
    description: "Áo khoác denim màu xanh nước biển cổ điển wash nhẹ tự nhiên, chất liệu vải bò cotton 100% dày dặn bền bỉ. Hàng cúc kim loại mạ đồng vintage, hai túi nắp ngực chuẩn mực phong cách dạo phố.",
    category_name: "Áo khoác & Jacket",
    brand_name: "Denim Crafter",
    images: [{ url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80", alt: "Áo Khoác Denim Bò Màu Xanh Nước Biển", is_primary: true }],
    variants: [
      { sku: "JK-10-XNB-M", size: "M", color: "Xanh nước biển", price: 590000, stock: 40 },
      { sku: "JK-10-XNB-L", size: "L", color: "Xanh nước biển", price: 590000, stock: 35 }
    ]
  },
  {
    product_name: "Áo Khoác Da Biker Khóa Kéo Lệch Màu Đen",
    description: "Áo khoác da biker màu đen tuyền nam tính, chất liệu da PU cao cấp chống nứt nổ bề mặt bóng nhẹ sang trọng. Thiết kế ve áo đinh tán cổ điển cùng khóa kéo xéo thời thượng.",
    category_name: "Áo khoác & Jacket",
    brand_name: "Street Vibe Couture",
    images: [{ url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80", alt: "Áo Khoác Da Biker Màu Đen", is_primary: true }],
    variants: [
      { sku: "JK-10-DEN-M", size: "M", color: "Đen", price: 820000, stock: 25 },
      { sku: "JK-10-DEN-L", size: "L", color: "Đen", price: 820000, stock: 20 }
    ]
  },
  {
    product_name: "Áo Khoác Bomber Varsity Bóng Chày Màu Đỏ",
    description: "Áo bomber bóng chày varsity màu đỏ phối tay nổi bật, bo thun sọc thể thao ở cổ tay và gấu áo. Thêu huy hiệu cá tính ngực áo, lót chần bông giữ ấm thu đông hoàn hảo.",
    category_name: "Áo khoác & Jacket",
    brand_name: "Urban Streetwear",
    images: [{ url: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80", alt: "Áo Bomber Varsity Màu Đỏ", is_primary: true }],
    variants: [
      { sku: "JK-10-DO-M", size: "M", color: "Đỏ", price: 650000, stock: 30 },
      { sku: "JK-10-DO-L", size: "L", color: "Đỏ", price: 650000, stock: 25 }
    ]
  },
  {
    product_name: "Áo Khoác Jacket Da Lộn Suede Cổ Bẻ Màu Nâu",
    description: "Áo jacket da lộn màu nâu bò thanh lịch, chất vải da lộn nhân tạo mềm mịn không bám bụi. Phom dáng lửng tôn tỷ lệ cơ thể, dễ phối cùng áo cổ lọ và quần tây.",
    category_name: "Áo khoác & Jacket",
    brand_name: "Heritage Vintage",
    images: [{ url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80", alt: "Áo Jacket Da Lộn Màu Nâu", is_primary: true }],
    variants: [
      { sku: "JK-10-NAU-M", size: "M", color: "Nâu", price: 720000, stock: 30 },
      { sku: "JK-10-NAU-L", size: "L", color: "Nâu", price: 720000, stock: 20 }
    ]
  },
  {
    product_name: "Áo Khoác Bomber Gió Unisex Thể Thao Màu Trắng",
    description: "Áo khoác bomber màu trắng phối viền thể thao hiện đại, chất liệu vải dù gió cao cấp kháng bụi và chống nước nhẹ. Lót trong bằng lụa satin thoáng khí dễ chịu khi mặc cả ngày.",
    category_name: "Áo khoác & Jacket",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80", alt: "Áo Khoác Bomber Gió Màu Trắng", is_primary: true }],
    variants: [
      { sku: "JK-10-TRG-M", size: "M", color: "Trắng", price: 540000, stock: 35 },
      { sku: "JK-10-TRG-L", size: "L", color: "Trắng", price: 540000, stock: 30 }
    ]
  },
  {
    product_name: "Áo Khoác Jacket Da Cổ Trụ Ôm Dáng Màu Xám",
    description: "Áo jacket da phom slim fit màu xám khói hiện đại, cổ trụ bấm khuy bấm phong cách biker châu Âu. Khóa kéo túi chéo tạo điểm nhấn góc cạnh lịch lãm.",
    category_name: "Áo khoác & Jacket",
    brand_name: "Modern Luxe",
    images: [{ url: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80", alt: "Áo Jacket Da Cổ Trụ Màu Xám", is_primary: true }],
    variants: [
      { sku: "JK-10-XAM-M", size: "M", color: "Xám", price: 760000, stock: 25 },
      { sku: "JK-10-XAM-L", size: "L", color: "Xám", price: 760000, stock: 20 }
    ]
  },
  {
    product_name: "Áo Khoác Jacket Kaki Chống Gió Thời Trang Màu Xanh Lá",
    description: "Áo khoác jacket kaki màu xanh lá rêu dạo phố năng động, cổ bẻ phối ve áo may đúp dày dặn. Thân áo có túi chéo và bo gấu thun giữ nhiệt tốt.",
    category_name: "Áo khoác & Jacket",
    brand_name: "Tokyo Underground",
    images: [{ url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80", alt: "Áo Jacket Kaki Màu Xanh Lá", is_primary: true }],
    variants: [
      { sku: "JK-10-XL-M", size: "M", color: "Xanh lá", price: 580000, stock: 30 },
      { sku: "JK-10-XL-L", size: "L", color: "Xanh lá", price: 580000, stock: 25 }
    ]
  },

  // =========================================================================
  // 4. Áo Polo
  // =========================================================================
  {
    product_name: "Áo Polo Pique Cotton Phối Cổ Màu Xanh Nước Biển",
    description: "Áo polo màu xanh nước biển trẻ trung, chất liệu vải cá sấu pique 100% cotton chải kỹ thấm hút mồ hôi tuyệt hảo. Cổ áo dệt sợi bo viền tinh tế, nẹp áo 2 cúc sang trọng phù hợp cho cả đi làm và đi chơi.",
    category_name: "Áo Polo",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1622127739239-1905bbaa21b8?auto=format&fit=crop&w=800&q=80", alt: "Áo Polo Pique Màu Xanh Nước Biển", is_primary: true }],
    variants: [
      { sku: "PL-18-XNB-S", size: "S", color: "Xanh nước biển", price: 340000, stock: 45 },
      { sku: "PL-18-XNB-M", size: "M", color: "Xanh nước biển", price: 340000, stock: 50 },
      { sku: "PL-18-XNB-L", size: "L", color: "Xanh nước biển", price: 340000, stock: 35 }
    ]
  },
  {
    product_name: "Áo Polo Nam Dệt Kim Cổ Bẻ Lịch Lãm Màu Trắng",
    description: "Áo polo dệt kim màu trắng kem cao cấp, phom dáng slim fit tôn ngực và vai nam tính. Sợi dệt kim thoáng mát không nhăn, cổ bẻ thanh lịch cho môi trường công sở hiện đại.",
    category_name: "Áo Polo",
    brand_name: "Minimalist Line",
    images: [{ url: "https://images.unsplash.com/photo-1622622016645-7b7065e7c129?auto=format&fit=crop&w=800&q=80", alt: "Áo Polo Dệt Kim Màu Trắng", is_primary: true }],
    variants: [
      { sku: "PL-18-TRG-M", size: "M", color: "Trắng", price: 360000, stock: 40 },
      { sku: "PL-18-TRG-L", size: "L", color: "Trắng", price: 360000, stock: 35 }
    ]
  },
  {
    product_name: "Áo Polo Nam Slimfit Co Giãn Màu Đen",
    description: "Áo polo màu đen tuyền nam tính mạnh mẽ, chất vải cotton pha sợi spandex co giãn 4 chiều linh hoạt. Bề mặt vải mịn mượt không xù lông sau nhiều lần giặt.",
    category_name: "Áo Polo",
    brand_name: "Casual Essentials",
    images: [{ url: "https://images.unsplash.com/photo-1589514721620-87cad05b04e6?auto=format&fit=crop&w=800&q=80", alt: "Áo Polo Slimfit Màu Đen", is_primary: true }],
    variants: [
      { sku: "PL-18-DEN-M", size: "M", color: "Đen", price: 330000, stock: 50 },
      { sku: "PL-18-DEN-L", size: "L", color: "Đen", price: 330000, stock: 40 }
    ]
  },
  {
    product_name: "Áo Polo Thể Thao Năng Động Màu Xám",
    description: "Áo polo thể thao màu xám ghi thoáng khí, công nghệ dry-fit thoát mồ hôi nhanh giữ cơ thể luôn khô ráo. Đường chỉ trần tỉ mỉ chống cọ xát khi vận động.",
    category_name: "Áo Polo",
    brand_name: "Sporty Activewear",
    images: [{ url: "https://images.unsplash.com/photo-1611608822772-43a28a830759?auto=format&fit=crop&w=800&q=80", alt: "Áo Polo Thể Thao Màu Xám", is_primary: true }],
    variants: [
      { sku: "PL-18-XAM-M", size: "M", color: "Xám", price: 320000, stock: 35 },
      { sku: "PL-18-XAM-L", size: "L", color: "Xám", price: 320000, stock: 30 }
    ]
  },
  {
    product_name: "Áo Polo Cotton Thoáng Khí Màu Đỏ",
    description: "Áo polo cotton màu đỏ tươi trẻ năng động, nẹp cổ dệt sợi chắc chắn giữ phom cổ bẻ đứng thẳng lịch lãm. Vải dệt tổ ong thoáng khí tuyệt đối cho ngày hè.",
    category_name: "Áo Polo",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80", alt: "Áo Polo Cotton Màu Đỏ", is_primary: true }],
    variants: [
      { sku: "PL-18-DO-M", size: "M", color: "Đỏ", price: 350000, stock: 35 },
      { sku: "PL-18-DO-L", size: "L", color: "Đỏ", price: 350000, stock: 30 }
    ]
  },
  {
    product_name: "Áo Polo Phom Rộng Dạo Phố Màu Vàng",
    description: "Áo polo màu vàng mù tạt thời thượng, phom suông rộng oversize cá tính dạo phố. Chất vải dệt kim dày dặn mềm rủ tự nhiên, tạo điểm nhấn phong cách ấn tượng.",
    category_name: "Áo Polo",
    brand_name: "Tokyo Underground",
    images: [{ url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80", alt: "Áo Polo Phom Rộng Màu Vàng", is_primary: true }],
    variants: [
      { sku: "PL-18-VANG-M", size: "M", color: "Vàng", price: 350000, stock: 25 },
      { sku: "PL-18-VANG-L", size: "L", color: "Vàng", price: 350000, stock: 20 }
    ]
  },
  {
    product_name: "Áo Polo Cổ Dệt Phối Bo Tay Màu Xanh Lá",
    description: "Áo polo màu xanh lá rêu phong cách thanh lịch, cổ bẻ và viền tay áo phối dệt sắc sảo. Chất cotton cao cấp mềm mại đem lại cảm giác tự tin suốt ngày dài.",
    category_name: "Áo Polo",
    brand_name: "Eco Style Co.",
    images: [{ url: "https://images.unsplash.com/photo-1586363129094-d7a38564fae1?auto=format&fit=crop&w=800&q=80", alt: "Áo Polo Màu Xanh Lá", is_primary: true }],
    variants: [
      { sku: "PL-18-XL-M", size: "M", color: "Xanh lá", price: 340000, stock: 30 },
      { sku: "PL-18-XL-L", size: "L", color: "Xanh lá", price: 340000, stock: 25 }
    ]
  },

  // =========================================================================
  // 5. Áo sơ mi
  // =========================================================================
  {
    product_name: "Áo Sơ Mi Oxford Dài Tay Màu Xanh Nước Biển",
    description: "Áo sơ mi oxford màu xanh nước biển nhạt thanh lịch, chất vải dệt chéo Oxford 100% sợi bông tự nhiên chống nhăn nhẹ và giữ phom chuẩn mực. Cổ bẻ cài cúc button-down cổ điển, chuẩn mực cho công sở và dạo phố.",
    category_name: "Áo sơ mi",
    brand_name: "Minimalist Line",
    images: [{ url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80", alt: "Áo Sơ Mi Oxford Màu Xanh Nước Biển", is_primary: true }],
    variants: [
      { sku: "SM-02-XNB-M", size: "M", color: "Xanh nước biển", price: 380000, stock: 45 },
      { sku: "SM-02-XNB-L", size: "L", color: "Xanh nước biển", price: 380000, stock: 40 }
    ]
  },
  {
    product_name: "Áo Sơ Mi Lụa Cổ Cuba Mùa Hè Màu Đen",
    description: "Áo sơ mi lụa ngắn tay cổ Cuba màu đen tuyền phong trần quyến rũ, chất lụa nhân tạo mềm rủ bay bổng. Cổ áo mở phóng khoáng thích hợp cho các chuyến du lịch biển và tiệc tối ngoài trời.",
    category_name: "Áo sơ mi",
    brand_name: "Urban Streetwear",
    images: [{ url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80", alt: "Áo Sơ Mi Cổ Cuba Màu Đen", is_primary: true }],
    variants: [
      { sku: "SM-02-DEN-M", size: "M", color: "Đen", price: 360000, stock: 35 },
      { sku: "SM-02-DEN-L", size: "L", color: "Đen", price: 360000, stock: 30 }
    ]
  },
  {
    product_name: "Áo Sơ Mi Linen Đũi Mát Dạo Phố Màu Be",
    description: "Áo sơ mi đũi linen tự nhiên màu be sáng tinh tế, sợi vải thoáng khí hút ẩm cao mang lại cảm giác mát mẻ trong ngày oi bức. Thiết kế phom suông casual thoải mái.",
    category_name: "Áo sơ mi",
    brand_name: "Eco Style Co.",
    images: [{ url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80", alt: "Áo Sơ Mi Linen Màu Be", is_primary: true }],
    variants: [
      { sku: "SM-02-BE-M", size: "M", color: "Be", price: 390000, stock: 30 },
      { sku: "SM-02-BE-L", size: "L", color: "Be", price: 390000, stock: 25 }
    ]
  },
  {
    product_name: "Áo Sơ Mi Flannel Kẻ Caro Dày Dặn Màu Đỏ",
    description: "Áo sơ mi flannel kẻ ca-rô đỏ đen phong cách bụi bặm, chất vải nỉ dạ chải bề mặt xù mềm giữ nhiệt ấm áp. Thích hợp mặc khoác ngoài áo thun phong cách layer cá tính.",
    category_name: "Áo sơ mi",
    brand_name: "Heritage Vintage",
    images: [{ url: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80", alt: "Áo Sơ Mi Flannel Kẻ Caro Màu Đỏ", is_primary: true }],
    variants: [
      { sku: "SM-02-DO-M", size: "M", color: "Đỏ", price: 420000, stock: 35 },
      { sku: "SM-02-DO-L", size: "L", color: "Đỏ", price: 420000, stock: 30 }
    ]
  },
  {
    product_name: "Áo Sơ Mi Công Sở Kháng Nhăn Màu Xám",
    description: "Áo sơ mi nam công sở màu xám nhạt đứng phom sang trọng, công nghệ easy-care chống nhăn hiệu quả sau khi giặt. Đường may nách và vai chuẩn xác tôn dáng người mặc.",
    category_name: "Áo sơ mi",
    brand_name: "Modern Luxe",
    images: [{ url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80", alt: "Áo Sơ Mi Công Sở Màu Xám", is_primary: true }],
    variants: [
      { sku: "SM-02-XAM-M", size: "M", color: "Xám", price: 370000, stock: 40 },
      { sku: "SM-02-XAM-L", size: "L", color: "Xám", price: 370000, stock: 35 }
    ]
  },
  {
    product_name: "Áo Sơ Mi Poplin Cổ Đức Dài Tay Màu Trắng",
    description: "Áo sơ mi poplin màu trắng tinh khiết, mật độ sợi vải dệt cao tạo độ mịn mượt và độ bóng mờ sang trọng. Chiếc áo cơ bản thiết yếu trong tủ đồ của mọi quý ông và quý cô.",
    category_name: "Áo sơ mi",
    brand_name: "Casual Essentials",
    images: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80", alt: "Áo Sơ Mi Poplin Màu Trắng", is_primary: true }],
    variants: [
      { sku: "SM-02-TRG-M", size: "M", color: "Trắng", price: 380000, stock: 50 },
      { sku: "SM-02-TRG-L", size: "L", color: "Trắng", price: 380000, stock: 45 }
    ]
  },
  {
    product_name: "Áo Sơ Mi Lụa Tay Bồng Nữ Tính Màu Hồng",
    description: "Áo sơ mi lụa màu hồng pastel ngọt ngào, tay áo bồng nhẹ chiết cổ tay xếp nếp duyên dáng. Chất lụa cát bay bổng tạo nét thanh lịch nhẹ nhàng khi diện đến nơi làm việc.",
    category_name: "Áo sơ mi",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80", alt: "Áo Sơ Mi Lụa Màu Hồng", is_primary: true }],
    variants: [
      { sku: "SM-02-HONG-S", size: "S", color: "Hồng", price: 360000, stock: 30 },
      { sku: "SM-02-HONG-M", size: "M", color: "Hồng", price: 360000, stock: 35 }
    ]
  },

  // =========================================================================
  // 6. Áo thun
  // =========================================================================
  {
    product_name: "Áo Thun Cổ Tròn Cotton 100% Màu Xanh Nước Biển",
    description: "Áo thun basic màu xanh nước biển trẻ trung tươi mát, chất liệu 100% Cotton chải kỹ định lượng 250gsm dày dặn đứng phom nhưng vẫn vô cùng thoáng mát. Cổ tròn dệt bo chắc chắn không bai nhão.",
    category_name: "Áo thun",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1622127739239-1905bbaa21b8?auto=format&fit=crop&w=800&q=80", alt: "Áo Thun Cổ Tròn Màu Xanh Nước Biển", is_primary: true }],
    variants: [
      { sku: "AT-01-XNB-S", size: "S", color: "Xanh nước biển", price: 240000, stock: 50 },
      { sku: "AT-01-XNB-M", size: "M", color: "Xanh nước biển", price: 240000, stock: 60 },
      { sku: "AT-01-XNB-L", size: "L", color: "Xanh nước biển", price: 240000, stock: 45 }
    ]
  },
  {
    product_name: "Áo Thun Basic Trơn Dáng Suông Màu Trắng",
    description: "Áo thun trơn màu trắng tinh giản, chất vải cotton co giãn 4 chiều mềm mịn nâng niu làn da. Item quốc dân dễ dàng phối với mọi kiểu quần và áo khoác dạo phố.",
    category_name: "Áo thun",
    brand_name: "Minimalist Line",
    images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80", alt: "Áo Thun Trơn Màu Trắng", is_primary: true }],
    variants: [
      { sku: "AT-01-TRG-S", size: "S", color: "Trắng", price: 220000, stock: 60 },
      { sku: "AT-01-TRG-M", size: "M", color: "Trắng", price: 220000, stock: 70 },
      { sku: "AT-01-TRG-L", size: "L", color: "Trắng", price: 220000, stock: 50 }
    ]
  },
  {
    product_name: "Áo Thun Oversize Streetwear Cá Tính Màu Đen",
    description: "Áo thun phom rộng oversize màu đen tuyền phong cách hip-hop đường phố, vai trễ phóng khoáng. Chất vải cotton dày mịn hút mồ hôi tối ưu cho bạn tự do vận động.",
    category_name: "Áo thun",
    brand_name: "Urban Streetwear",
    images: [{ url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80", alt: "Áo Thun Oversize Màu Đen", is_primary: true }],
    variants: [
      { sku: "AT-01-DEN-M", size: "M", color: "Đen", price: 260000, stock: 55 },
      { sku: "AT-01-DEN-L", size: "L", color: "Đen", price: 260000, stock: 45 }
    ]
  },
  {
    product_name: "Áo Thun Thể Thao Co Giãn Thoáng Khí Màu Đỏ",
    description: "Áo thun thể thao màu đỏ tươi khỏe khoắn, chất vải dệt hạt mè thoáng khí giúp tản nhiệt tức thì khi luyện tập gym hay chạy bộ ngoài trời.",
    category_name: "Áo thun",
    brand_name: "Sporty Activewear",
    images: [{ url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80", alt: "Áo Thun Thể Thao Màu Đỏ", is_primary: true }],
    variants: [
      { sku: "AT-01-DO-M", size: "M", color: "Đỏ", price: 230000, stock: 40 },
      { sku: "AT-01-DO-L", size: "L", color: "Đỏ", price: 230000, stock: 35 }
    ]
  },
  {
    product_name: "Áo Thun Cổ Tròn Melange Dệt Sợi Màu Xám",
    description: "Áo thun màu xám tiêu melange tự nhiên, sợi vải mềm mượt không bám dính. Kiểu dáng vừa vặn ôm nhẹ cơ thể, mang lại nét lịch thiệp nhẹ nhàng khi kết hợp cùng quần âu.",
    category_name: "Áo thun",
    brand_name: "Casual Essentials",
    images: [{ url: "https://images.unsplash.com/photo-1611608822772-43a28a830759?auto=format&fit=crop&w=800&q=80", alt: "Áo Thun Melange Màu Xám", is_primary: true }],
    variants: [
      { sku: "AT-01-XAM-M", size: "M", color: "Xám", price: 240000, stock: 45 },
      { sku: "AT-01-XAM-L", size: "L", color: "Xám", price: 240000, stock: 40 }
    ]
  },
  {
    product_name: "Áo Thun Năng Động Mùa Hè Màu Vàng",
    description: "Áo thun cotton màu vàng tươi rạng rỡ, phom suông trẻ trung tạo điểm nhấn tươi mới cho ngày hè. Công nghệ nhuộm hoạt tính giữ màu bền lâu không phai bạc.",
    category_name: "Áo thun",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80", alt: "Áo Thun Mùa Hè Màu Vàng", is_primary: true }],
    variants: [
      { sku: "AT-01-VANG-S", size: "S", color: "Vàng", price: 230000, stock: 35 },
      { sku: "AT-01-VANG-M", size: "M", color: "Vàng", price: 230000, stock: 40 }
    ]
  },
  {
    product_name: "Áo Thun Hữu Cơ Thân Thiện Môi Trường Màu Xanh Lá",
    description: "Áo thun màu xanh lá mạ tươi mát dệt từ 100% Organic Cotton không hóa chất độc hại, thân thiện với làn da nhạy cảm và bảo vệ môi trường sinh thái.",
    category_name: "Áo thun",
    brand_name: "Eco Style Co.",
    images: [{ url: "https://images.unsplash.com/photo-1586363129094-d7a38564fae1?auto=format&fit=crop&w=800&q=80", alt: "Áo Thun Hữu Cơ Màu Xanh Lá", is_primary: true }],
    variants: [
      { sku: "AT-01-XL-M", size: "M", color: "Xanh lá", price: 250000, stock: 35 },
      { sku: "AT-01-XL-L", size: "L", color: "Xanh lá", price: 250000, stock: 30 }
    ]
  },

  // =========================================================================
  // 7. Áo Vest & Blazer
  // =========================================================================
  {
    product_name: "Áo Blazer Suông Oversize Thanh Lịch Màu Xanh Nước Biển",
    description: "Áo blazer phom suông rộng màu xanh nước biển hiện đại phong cách Hàn Quốc, ve cổ chữ K chuẩn mực cùng đệm vai tự nhiên tôn phom thẳng thớm. Vải tuyết mưa cao cấp chống nhăn tuyệt đối.",
    category_name: "Áo Vest & Blazer",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1592878956815-2feeac767f7b?auto=format&fit=crop&w=800&q=80", alt: "Áo Blazer Màu Xanh Nước Biển", is_primary: true }],
    variants: [
      { sku: "BZ-11-XNB-S", size: "S", color: "Xanh nước biển", price: 680000, stock: 30 },
      { sku: "BZ-11-XNB-M", size: "M", color: "Xanh nước biển", price: 680000, stock: 35 },
      { sku: "BZ-11-XNB-L", size: "L", color: "Xanh nước biển", price: 680000, stock: 25 }
    ]
  },
  {
    product_name: "Áo Blazer Nam Hai Hàng Khuy Cổ Điển Màu Đen",
    description: "Áo blazer đen 2 hàng cúc double-breasted quyền lực và sang trọng, chất vải dạ pha lụa đứng phom. Đường may ve áo sắc sảo thích hợp cho các buổi hội họp và sự kiện quan trọng.",
    category_name: "Áo Vest & Blazer",
    brand_name: "Minimalist Line",
    images: [{ url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80", alt: "Áo Blazer Hai Hàng Khuy Màu Đen", is_primary: true }],
    variants: [
      { sku: "BZ-11-DEN-M", size: "M", color: "Đen", price: 790000, stock: 30 },
      { sku: "BZ-11-DEN-L", size: "L", color: "Đen", price: 790000, stock: 25 }
    ]
  },
  {
    product_name: "Áo Blazer Dạ Tweed Tiểu Thư Sang Trọng Màu Trắng",
    description: "Áo khoác blazer dạ tweed màu trắng dệt sợi ánh kim lấp lánh, đính cúc ngọc trai viền vàng tinh xảo. Thiết kế cổ tròn không ve tôn nét quý phái dịu dàng cho phái đẹp.",
    category_name: "Áo Vest & Blazer",
    brand_name: "Atelier Elegance",
    images: [{ url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80", alt: "Áo Blazer Dạ Tweed Màu Trắng", is_primary: true }],
    variants: [
      { sku: "BZ-11-TRG-S", size: "S", color: "Trắng", price: 750000, stock: 25 },
      { sku: "BZ-11-TRG-M", size: "M", color: "Trắng", price: 750000, stock: 30 }
    ]
  },
  {
    product_name: "Áo Vest Công Sở Form Suông Chuẩn Mực Màu Xám",
    description: "Áo vest nam công sở màu xám than lịch lãm, phom dáng slim fit vừa vặn thân người. Lớp lót lụa mềm mại bên trong tạo cảm giác thông thoáng khi khoác suốt ngày dài.",
    category_name: "Áo Vest & Blazer",
    brand_name: "Modern Luxe",
    images: [{ url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80", alt: "Áo Vest Công Sở Màu Xám", is_primary: true }],
    variants: [
      { sku: "BZ-11-XAM-M", size: "M", color: "Xám", price: 720000, stock: 35 },
      { sku: "BZ-11-XAM-L", size: "L", color: "Xám", price: 720000, stock: 25 }
    ]
  },
  {
    product_name: "Áo Blazer Kẻ Sọc Caro Phong Cách Retro Màu Nâu",
    description: "Áo blazer họa tiết kẻ ô caro màu nâu vintage, may đo từ chất liệu len dạ pha thoáng khí. Phù hợp phối đồ phong cách vintage dạo phố mùa thu lãng mạn.",
    category_name: "Áo Vest & Blazer",
    brand_name: "Heritage Vintage",
    images: [{ url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80", alt: "Áo Blazer Kẻ Caro Màu Nâu", is_primary: true }],
    variants: [
      { sku: "BZ-11-NAU-M", size: "M", color: "Nâu", price: 760000, stock: 25 },
      { sku: "BZ-11-NAU-L", size: "L", color: "Nâu", price: 760000, stock: 20 }
    ]
  },
  {
    product_name: "Áo Blazer Linen Thoáng Mát Mùa Hè Màu Be",
    description: "Áo blazer vải đũi linen màu be thanh thoát nhẹ nhàng, thiết kế 1 cúc cài tối giản không gò bó. Mang lại vẻ ngoài chỉn chu nhưng phóng khoáng trong những ngày hè oi ả.",
    category_name: "Áo Vest & Blazer",
    brand_name: "Minimalist Line",
    images: [{ url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80", alt: "Áo Blazer Linen Màu Be", is_primary: true }],
    variants: [
      { sku: "BZ-11-BE-M", size: "M", color: "Be", price: 690000, stock: 30 },
      { sku: "BZ-11-BE-L", size: "L", color: "Be", price: 690000, stock: 25 }
    ]
  },
  {
    product_name: "Áo Blazer Dáng Lửng Croptop Thời Thượng Màu Hồng",
    description: "Áo blazer dáng lửng croptop màu hồng pastel ngọt ngào, tôn trọn vòng eo thon gọn và kéo dài đôi chân. Rất thích hợp phối cùng quần cạp cao hoặc chân váy chữ A.",
    category_name: "Áo Vest & Blazer",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80", alt: "Áo Blazer Dáng Lửng Màu Hồng", is_primary: true }],
    variants: [
      { sku: "BZ-11-HONG-S", size: "S", color: "Hồng", price: 640000, stock: 30 },
      { sku: "BZ-11-HONG-M", size: "M", color: "Hồng", price: 640000, stock: 25 }
    ]
  },

  // =========================================================================
  // 8. Áo Vest & Blazer Atelier
  // =========================================================================
  {
    product_name: "Áo Tuxedo Atelier May Đo Dạ Tiệc Màu Xanh Nước Biển",
    description: "Áo vest Tuxedo cao cấp thuộc dòng Atelier độc bản màu xanh nước biển đậm sang trọng, ve áo phối lụa satin bóng bẩy thủ công tinh tế. Đường cắt may bespoke chuẩn xác theo chuẩn haute couture Pháp.",
    category_name: "Áo Vest & Blazer Atelier",
    brand_name: "Atelier Elegance",
    images: [{ url: "https://images.unsplash.com/photo-1592878956815-2feeac767f7b?auto=format&fit=crop&w=800&q=80", alt: "Áo Tuxedo Atelier Màu Xanh Nước Biển", is_primary: true }],
    variants: [
      { sku: "ATEL-07-XNB-M", size: "M", color: "Xanh nước biển", price: 1850000, stock: 15 },
      { sku: "ATEL-07-XNB-L", size: "L", color: "Xanh nước biển", price: 1850000, stock: 12 }
    ]
  },
  {
    product_name: "Áo Vest Smoking May Đo Thủ Công Màu Đen",
    description: "Áo vest smoking đen tuyền dòng may đo cao cấp Atelier, ve cổ lụa sam đen tuyền bóng mờ quý phái. Đính khuy bọc vải lụa thủ công từng chi tiết, tạo khí chất quý ông lịch lãm đỉnh cao.",
    category_name: "Áo Vest & Blazer Atelier",
    brand_name: "Signature Atelier",
    images: [{ url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80", alt: "Áo Smoking Atelier Màu Đen", is_primary: true }],
    variants: [
      { sku: "ATEL-07-DEN-M", size: "M", color: "Đen", price: 2100000, stock: 15 },
      { sku: "ATEL-07-DEN-L", size: "L", color: "Đen", price: 2100000, stock: 10 }
    ]
  },
  {
    product_name: "Áo Blazer Lụa Satin Cao Cấp Atelier Màu Trắng",
    description: "Áo blazer dạ tiệc lụa satin màu trắng thượng lưu, bề mặt vải bắt sáng lộng lẫy dưới ánh đèn đêm tiệc. Phom dáng quyền uy với đệm vai dựng tay thủ công tỉ mỉ.",
    category_name: "Áo Vest & Blazer Atelier",
    brand_name: "Atelier Elegance",
    images: [{ url: "https://images.unsplash.com/photo-1654866227848-5f9fced66fe1?auto=format&fit=crop&w=800&q=80", alt: "Áo Blazer Lụa Satin Màu Trắng", is_primary: true }],
    variants: [
      { sku: "ATEL-07-TRG-M", size: "M", color: "Trắng", price: 1950000, stock: 12 },
      { sku: "ATEL-07-TRG-L", size: "L", color: "Trắng", price: 1950000, stock: 10 }
    ]
  },
  {
    product_name: "Áo Vest Dạ Lông Cừu May Tay Atelier Màu Xám",
    description: "Áo vest nam chế tác từ len dạ lông cừu Merino nguyên chất màu xám than, cúc sừng tự nhiên khắc laser thương hiệu. Giữ ấm tuyệt hảo và toát lên phong thái chuyên nghiệp đỉnh cao.",
    category_name: "Áo Vest & Blazer Atelier",
    brand_name: "Signature Atelier",
    images: [{ url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80", alt: "Áo Vest Dạ Lông Cừu Màu Xám", is_primary: true }],
    variants: [
      { sku: "ATEL-07-XAM-M", size: "M", color: "Xám", price: 1750000, stock: 15 },
      { sku: "ATEL-07-XAM-L", size: "L", color: "Xám", price: 1750000, stock: 10 }
    ]
  },
  {
    product_name: "Áo Blazer Nhung Tuyết Đính Kết Tinh Xảo Màu Đỏ",
    description: "Áo blazer nhung tuyết cao cấp màu đỏ rượu vang quyền quý, chất nhung óng ánh mềm mại. Ve áo và nắp túi đính đá pha lê tinh xảo tạo điểm nhấn lộng lẫy cho các buổi tiệc dạ hội.",
    category_name: "Áo Vest & Blazer Atelier",
    brand_name: "Atelier Elegance",
    images: [{ url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80", alt: "Áo Blazer Nhung Tuyết Màu Đỏ", is_primary: true }],
    variants: [
      { sku: "ATEL-07-DO-S", size: "S", color: "Đỏ", price: 1980000, stock: 10 },
      { sku: "ATEL-07-DO-M", size: "M", color: "Đỏ", price: 1980000, stock: 12 }
    ]
  },
  {
    product_name: "Áo Vest Khuy Mạ Vàng Quý Tộc Màu Be",
    description: "Áo vest may đo giới hạn màu be quý tộc đính khuy đồng mạ vàng 18K chạm khắc hoa văn cổ điển, chất vải wool pha cashmere thượng hạng ấm mịn.",
    category_name: "Áo Vest & Blazer Atelier",
    brand_name: "Signature Atelier",
    images: [{ url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80", alt: "Áo Vest Khuy Mạ Vàng Màu Be", is_primary: true }],
    variants: [
      { sku: "ATEL-07-BE-M", size: "M", color: "Be", price: 1850000, stock: 12 },
      { sku: "ATEL-07-BE-L", size: "L", color: "Be", price: 1850000, stock: 8 }
    ]
  },
  {
    product_name: "Áo Blazer Gấm Thêu Chỉ Nổi Sang Trọng Màu Vàng",
    description: "Áo blazer may đo vải gấm tơ tằm thêu hoa văn chỉ ánh kim màu vàng đồng vương giả, thiết kế vạt chéo ve nhọn ôm trọn tỷ lệ cơ thể hoàn mỹ.",
    category_name: "Áo Vest & Blazer Atelier",
    brand_name: "Atelier Elegance",
    images: [{ url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80", alt: "Áo Blazer Gấm Màu Vàng", is_primary: true }],
    variants: [
      { sku: "ATEL-07-VANG-M", size: "M", color: "Vàng", price: 2200000, stock: 10 },
      { sku: "ATEL-07-VANG-L", size: "L", color: "Vàng", price: 2200000, stock: 8 }
    ]
  },

  // =========================================================================
  // 9. Bộ Đồ Thể Thao
  // =========================================================================
  {
    product_name: "Set Tracksuit Thể Thao Khóa Kéo Năng Động Màu Xanh Nước Biển",
    description: "Set đồ thể thao tracksuit màu xanh nước biển khỏe khoắn gồm áo khoác kéo khóa và quần jogger bo gấu. Chất liệu thun nỉ thể thao co giãn 4 chiều mềm mại, giữ ấm tốt và thấm hút mồ hôi tối ưu khi chạy bộ hay tập luyện.",
    category_name: "Bộ Đồ Thể Thao",
    brand_name: "Sporty Activewear",
    images: [{ url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80", alt: "Set Tracksuit Màu Xanh Nước Biển", is_primary: true }],
    variants: [
      { sku: "SP-20-XNB-S", size: "S", color: "Xanh nước biển", price: 580000, stock: 35 },
      { sku: "SP-20-XNB-M", size: "M", color: "Xanh nước biển", price: 580000, stock: 40 },
      { sku: "SP-20-XNB-L", size: "L", color: "Xanh nước biển", price: 580000, stock: 30 }
    ]
  },
  {
    product_name: "Bộ Đồ Thể Thao Thun Lạnh Chạy Bộ Màu Đen",
    description: "Bộ quần áo thể thao thun lạnh màu đen tuyền nam tính, sợi vải dệt kim thoáng khí tản nhiệt nhanh chóng. Quần có túi khóa kéo an toàn để điện thoại khi tập gym và chạy bộ.",
    category_name: "Bộ Đồ Thể Thao",
    brand_name: "Sporty Activewear",
    images: [{ url: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80", alt: "Bộ Đồ Thể Thao Màu Đen", is_primary: true }],
    variants: [
      { sku: "SP-20-DEN-M", size: "M", color: "Đen", price: 520000, stock: 45 },
      { sku: "SP-20-DEN-L", size: "L", color: "Đen", price: 520000, stock: 40 }
    ]
  },
  {
    product_name: "Set Nỉ Thể Thao Hoodie Kèm Quần Jogger Màu Xám",
    description: "Set đồ nỉ bông thể thao màu xám tiêu gồm áo hoodie có mũ và quần nỉ dây rút thoải mái. Phom dáng rộng rãi chuẩn phong cách athleisure năng động ngày se lạnh.",
    category_name: "Bộ Đồ Thể Thao",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1636103983543-4b59893304fb?auto=format&fit=crop&w=800&q=80", alt: "Set Nỉ Thể Thao Màu Xám", is_primary: true }],
    variants: [
      { sku: "SP-20-XAM-M", size: "M", color: "Xám", price: 620000, stock: 35 },
      { sku: "SP-20-XAM-L", size: "L", color: "Xám", price: 620000, stock: 30 }
    ]
  },
  {
    product_name: "Set Đồ Tập Yoga Gym Co Giãn 4 Chiều Màu Xanh Lá",
    description: "Set đồ tập gym yoga nữ màu xanh lá cây mát mắt gồm áo bra thể thao nâng đỡ tối đa và quần legging cạp cao ôm trọn cơ thể, chất vải dệt liền không đường may chống hằn da.",
    category_name: "Bộ Đồ Thể Thao",
    brand_name: "Sporty Activewear",
    images: [{ url: "https://images.unsplash.com/photo-1586363129094-d7a38564fae1?auto=format&fit=crop&w=800&q=80", alt: "Set Đồ Tập Yoga Màu Xanh Lá", is_primary: true }],
    variants: [
      { sku: "SP-20-XL-S", size: "S", color: "Xanh lá", price: 490000, stock: 30 },
      { sku: "SP-20-XL-M", size: "M", color: "Xanh lá", price: 490000, stock: 35 }
    ]
  },
  {
    product_name: "Bộ Đồ Tập Thể Dục Nữ Trẻ Trung Màu Trắng",
    description: "Bộ thể thao nữ màu trắng tinh tế phối viền sọc khỏe khoắn, chất thun co giãn êm ái thoáng mồ hôi cho bạn tự tin thực hiện mọi động tác kéo giãn.",
    category_name: "Bộ Đồ Thể Thao",
    brand_name: "Sporty Activewear",
    images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80", alt: "Bộ Đồ Thể Dục Màu Trắng", is_primary: true }],
    variants: [
      { sku: "SP-20-TRG-S", size: "S", color: "Trắng", price: 480000, stock: 35 },
      { sku: "SP-20-TRG-M", size: "M", color: "Trắng", price: 480000, stock: 30 }
    ]
  },
  {
    product_name: "Set Bộ Gió Thể Thao Hai Lớp Kháng Nước Màu Đỏ",
    description: "Set áo quần vải dù gió màu đỏ phối đen thể thao, công nghệ trượt nước giữ cơ thể luôn khô ráo ấm áp khi chạy bộ tập luyện dưới sương sớm.",
    category_name: "Bộ Đồ Thể Thao",
    brand_name: "Urban Streetwear",
    images: [{ url: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80", alt: "Set Bộ Gió Thể Thao Màu Đỏ", is_primary: true }],
    variants: [
      { sku: "SP-20-DO-M", size: "M", color: "Đỏ", price: 640000, stock: 30 },
      { sku: "SP-20-DO-L", size: "L", color: "Đỏ", price: 640000, stock: 25 }
    ]
  },
  {
    product_name: "Bộ Nỉ Thể Thao Mặc Nhà Thoải Mái Màu Be",
    description: "Bộ nỉ thể thao màu be nhã nhặn chất nỉ thun mềm xốp, thiết kế phom rộng phong cách Hàn Quốc mang lại sự thoải mái tuyệt đối cho cả vận động lẫn nghỉ ngơi.",
    category_name: "Bộ Đồ Thể Thao",
    brand_name: "Casual Essentials",
    images: [{ url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80", alt: "Bộ Nỉ Thể Thao Màu Be", is_primary: true }],
    variants: [
      { sku: "SP-20-BE-M", size: "M", color: "Be", price: 540000, stock: 35 },
      { sku: "SP-20-BE-L", size: "L", color: "Be", price: 540000, stock: 30 }
    ]
  },

  // =========================================================================
  // 10. Chân Váy
  // =========================================================================
  {
    product_name: "Chân Váy Jean Dáng Dài Xẻ Tà Màu Xanh Nước Biển",
    description: "Chân váy denim màu xanh nước biển wash nhẹ phong cách vintage, dáng suông dài qua gối xẻ tà trước tôn chân thon dài. Chất vải bò mềm mại co giãn nhẹ tạo sự thoải mái khi di chuyển.",
    category_name: "Chân Váy",
    brand_name: "Denim Crafter",
    images: [{ url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80", alt: "Chân Váy Jean Màu Xanh Nước Biển", is_primary: true }],
    variants: [
      { sku: "CV-17-XNB-S", size: "S", color: "Xanh nước biển", price: 380000, stock: 40 },
      { sku: "CV-17-XNB-M", size: "M", color: "Xanh nước biển", price: 380000, stock: 45 }
    ]
  },
  {
    product_name: "Chân Váy Xếp Ly Tennis Năng Động Màu Đen",
    description: "Chân váy tennis xếp ly đều đặn màu đen tuyền phong cách trẻ trung năng động, có quần bảo hộ may liền bên trong an toàn kín đáo khi vận động.",
    category_name: "Chân Váy",
    brand_name: "YouthFashion Studio",
    images: [{ url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80", alt: "Chân Váy Tennis Màu Đen", is_primary: true }],
    variants: [
      { sku: "CV-17-DEN-S", size: "S", color: "Đen", price: 290000, stock: 50 },
      { sku: "CV-17-DEN-M", size: "M", color: "Đen", price: 290000, stock: 45 }
    ]
  },
  {
    product_name: "Chân Váy Chữ A Công Sở Dáng Midi Màu Be",
    description: "Chân váy chữ A midi màu be thanh lịch, cạp cao đính khuy tròn trang nhã. Vải tuyết mưa đứng phom tạo vẻ ngoài chỉn chu khi diện cùng sơ mi công sở.",
    category_name: "Chân Váy",
    brand_name: "Minimalist Line",
    images: [{ url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80", alt: "Chân Váy Chữ A Màu Be", is_primary: true }],
    variants: [
      { sku: "CV-17-BE-S", size: "S", color: "Be", price: 340000, stock: 40 },
      { sku: "CV-17-BE-M", size: "M", color: "Be", price: 340000, stock: 35 }
    ]
  },
  {
    product_name: "Chân Váy Xếp Tầng Điệu Đà Mềm Rủ Màu Xám",
    description: "Chân váy voan xếp tầng bồng bềnh màu xám khói, cạp chun co giãn thoải mái dễ chịu. Thiết kế bay bổng nữ tính cho các buổi hẹn hò cà phê cuối tuần.",
    category_name: "Chân Váy",
    brand_name: "Casual Essentials",
    images: [{ url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80", alt: "Chân Váy Xếp Tầng Màu Xám", is_primary: true }],
    variants: [
      { sku: "CV-17-XAM-S", size: "S", color: "Xám", price: 320000, stock: 30 },
      { sku: "CV-17-XAM-M", size: "M", color: "Xám", price: 320000, stock: 35 }
    ]
  },
  {
    product_name: "Chân Váy Da PU Ôm Dáng Xẻ Sau Quyến Rũ Màu Đỏ",
    description: "Chân váy da nhân tạo màu đỏ đô thời thượng, ôm trọn đường cong cơ thể quyến rũ. Bề mặt da bóng mịn mềm êm, xẻ sau tinh tế thuận tiện khi bước đi.",
    category_name: "Chân Váy",
    brand_name: "Urban Streetwear",
    images: [{ url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80", alt: "Chân Váy Da Ôm Màu Đỏ", is_primary: true }],
    variants: [
      { sku: "CV-17-DO-S", size: "S", color: "Đỏ", price: 360000, stock: 30 },
      { sku: "CV-17-DO-M", size: "M", color: "Đỏ", price: 360000, stock: 25 }
    ]
  },
  {
    product_name: "Chân Váy Xếp Ly Dáng Xòe Tiểu Thư Màu Trắng",
    description: "Chân váy xếp ly dài qua gối màu trắng tinh khôi, chất vải voan lót lụa mềm mại tạo từng nhịp sóng bay bổng khi sải bước. Dễ dàng mix-match phong cách vintage.",
    category_name: "Chân Váy",
    brand_name: "Atelier Elegance",
    images: [{ url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80", alt: "Chân Váy Xếp Ly Màu Trắng", is_primary: true }],
    variants: [
      { sku: "CV-17-TRG-S", size: "S", color: "Trắng", price: 350000, stock: 35 },
      { sku: "CV-17-TRG-M", size: "M", color: "Trắng", price: 350000, stock: 40 }
    ]
  },
  {
    product_name: "Chân Váy Bút Chì Công Sở Tôn Dáng Màu Xanh Lá",
    description: "Chân váy bút chì công sở màu xanh lá rêu sang trọng, đường cắt may ôm sát tôn trọn vòng ba gợi cảm. Vải co giãn cao cấp giúp ngồi làm việc thoải mái không bị kích gò.",
    category_name: "Chân Váy",
    brand_name: "Modern Luxe",
    images: [{ url: "https://images.unsplash.com/photo-1586363129094-d7a38564fae1?auto=format&fit=crop&w=800&q=80", alt: "Chân Váy Bút Chì Màu Xanh Lá", is_primary: true }],
    variants: [
      { sku: "CV-17-XL-S", size: "S", color: "Xanh lá", price: 360000, stock: 30 },
      { sku: "CV-17-XL-M", size: "M", color: "Xanh lá", price: 360000, stock: 35 }
    ]
  }
];

console.log(`Loaded ${productsCatalog.length} sample products for validation.`);


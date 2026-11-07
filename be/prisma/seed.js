import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 --- Đang khởi tạo dữ liệu mẫu (Seed Data) phong phú cho YouthFashion ---');

  const defaultPassword = '123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 1. Tạo tài khoản Manager & Admin mẫu
  const manager = await prisma.employee.upsert({
    where: { email: 'mana@gmail.com' },
    update: {
      password_hash: hashedPassword,
      employee_role: 'MANAGER',
      status: 'ACTIVE',
    },
    create: {
      employee_code: 'EMP_MANA_01',
      full_name: 'Quản Lý Youth Fashion',
      email: 'mana@gmail.com',
      phone: null,
      password_hash: hashedPassword,
      employee_role: 'MANAGER',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Manager: ${manager.email} (Pass: ${defaultPassword})`);

  const admin = await prisma.employee.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password_hash: hashedPassword,
      employee_role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      employee_code: 'EMP_ADMIN_01',
      full_name: 'Admin Youth Fashion',
      email: 'admin@gmail.com',
      phone: null,
      password_hash: hashedPassword,
      employee_role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Admin: ${admin.email} (Pass: ${defaultPassword})`);

  // 2. Seed Categories (24 Danh mục sản phẩm - Đủ 3+ trang)
  console.log('\n📂 --- Tạo Danh mục sản phẩm phong phú (~24 danh mục) ---');
  const categoriesData = [
    { category_name: 'Áo thun', description: 'Áo thun phong cách trẻ trung, thoáng mát, chất liệu 100% cotton cao cấp', status: 'ACTIVE' },
    { category_name: 'Áo sơ mi', description: 'Áo sơ mi thanh lịch, hiện đại dành cho công sở và dạo phố', status: 'ACTIVE' },
    { category_name: 'Áo khoác & Jacket', description: 'Áo khoác thời trang chống nắng, bomber, măng tô giữ ấm tốt', status: 'ACTIVE' },
    { category_name: 'Áo Hoodie & Sweater', description: 'Áo hoodie nỉ bông ấm áp, sweater phong cách streetwear năng động', status: 'ACTIVE' },
    { category_name: 'Áo Vest & Blazer', description: 'Áo vest và blazer thời thượng chuẩn phom phong cách Châu Âu', status: 'ACTIVE' },
    { category_name: 'Quần Jeans', description: 'Quần jeans chất liệu bền đẹp, chuẩn phom suông và đứng dáng', status: 'ACTIVE' },
    { category_name: 'Quần Short', description: 'Quần short ngắn năng động, thoải mái cho các hoạt động ngoài trời', status: 'ACTIVE' },
    { category_name: 'Quần Kaki & Chino', description: 'Quần kaki chino lịch lãm, dễ phối đồ cho nam và nữ', status: 'ACTIVE' },
    { category_name: 'Quần Tây & Trouser', description: 'Quần tây công sở xếp ly cao cấp tôn dáng sang trọng', status: 'ACTIVE' },
    { category_name: 'Quần Jogger & Thể thao', description: 'Quần jogger bo gấu thể thao cá tính, vải thun co giãn 4 chiều', status: 'ACTIVE' },
    { category_name: 'Váy & Đầm Thiết Kế', description: 'Váy đầm thiết kế độc quyền tôn dáng thanh lịch và quyến rũ', status: 'ACTIVE' },
    { category_name: 'Chân Váy', description: 'Chân váy chữ A, xếp ly, dáng midi thời trang phong cách Hàn Quốc', status: 'ACTIVE' },
    { category_name: 'Áo Polo', description: 'Áo polo dệt kim thanh lịch, năng động phù hợp mọi hoàn cảnh', status: 'ACTIVE' },
    { category_name: 'Đồ Lót & Đồ Mặc Nhà', description: 'Trang phục mặc nhà lụa silk và đồ lót co giãn êm ái', status: 'ACTIVE' },
    { category_name: 'Bộ Đồ Thể Thao', description: 'Set đồ tập gym, yoga và thể thao năng động co giãn cực tốt', status: 'ACTIVE' },
    { category_name: 'Túi Xách & Balo', description: 'Balo laptop canvas, túi xách da thêu thời thượng cao cấp', status: 'ACTIVE' },
    { category_name: 'Giày & Sandal', description: 'Sneaker retro, sandal đế trấu thời trang phong cách hiện đại', status: 'ACTIVE' },
    { category_name: 'Mũ & Nón Thời Trang', description: 'Mũ beanie dệt kim, nón lưỡi trai lưỡi cong vintage cá tính', status: 'ACTIVE' },
    { category_name: 'Thắt Lưng & Ví Da', description: 'Thắt lưng da bò thật, ví da nam nữ khóa kim sang trọng', status: 'ACTIVE' },
    { category_name: 'Kính Mát Thời Trang', description: 'Kính mát gọng kim loại chống tia UV bảo vệ mắt tối ưu', status: 'ACTIVE' },
    { category_name: 'Khăn Quàng & Phụ Kiện', description: 'Khăn quàng cashmere, phụ kiện phối đồ thời trang mùa đông', status: 'ACTIVE' },
    { category_name: 'Đồ Đông & Áo Len', description: 'Áo len cổ lọ dệt kim mềm mịn giữ ấm thu đông hiệu quả', status: 'ACTIVE' },
    { category_name: 'Đồ Bơi & Mùa Hè', description: 'Bộ bơi bikini 2 mảnh rực rỡ cho kỳ nghỉ biển mùa hè', status: 'ACTIVE' },
    { category_name: 'Trang Phục Dạ Hội', description: 'Đầm dạ hội dạ tiệc sang trọng đính đá thủ công tinh xảo', status: 'ACTIVE' },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { category_name: cat.category_name },
      update: { description: cat.description, status: cat.status },
      create: cat,
    });
    categories[cat.category_name] = created;
  }
  console.log(`✅ Đã tạo ${Object.keys(categories).length} danh mục.`);

  // 3. Seed Brands (14 Thương hiệu)
  console.log('\n🏷️ --- Tạo Thương hiệu (~14 thương hiệu) ---');
  const brandsData = [
    { brand_name: 'YouthFashion Studio', description: 'Thương hiệu thời trang giới trẻ hàng đầu, phong cách hiện đại độc quyền', status: 'ACTIVE' },
    { brand_name: 'Urban Streetwear', description: 'Thời trang dạo phố cá tính, trẻ trung và cá tính tự do', status: 'ACTIVE' },
    { brand_name: 'Minimalist Line', description: 'Phong cách thiết kế tối giản, tinh tế từng đường kim mũi chỉ', status: 'ACTIVE' },
    { brand_name: 'Atelier Elegance', description: 'Dòng sản phẩm cao cấp, trang phục dạ hội và blazer sang trọng', status: 'ACTIVE' },
    { brand_name: 'Denim Crafter', description: 'Chuyên các dòng sản phẩm chất liệu Denim & Jeans siêu bền chuẩn phom', status: 'ACTIVE' },
    { brand_name: 'Eco Style Co.', description: 'Thương hiệu thời trang bền vững từ chất liệu hữu cơ bảo vệ môi trường', status: 'ACTIVE' },
    { brand_name: 'Sporty Activewear', description: 'Trang phục thể thao năng động và phụ kiện tập luyện thời thượng', status: 'ACTIVE' },
    { brand_name: 'Heritage Vintage', description: 'Bộ sưu tập phong cách cổ điển hoài niệm đậm chất thập niên 90s', status: 'ACTIVE' },
    { brand_name: 'Modern Luxe', description: 'Thiết kế sang trọng đón đầu xu hướng thời trang đương đại', status: 'ACTIVE' },
    { brand_name: 'Casual Essentials', description: 'Trang phục cơ bản thiết yếu cho nhu cầu hàng ngày', status: 'ACTIVE' },
    { brand_name: 'Signature Atelier', description: 'Dòng sản phẩm thiết kế giới hạn mang dấu ấn nghệ thuật riêng', status: 'ACTIVE' },
    { brand_name: 'Tokyo Underground', description: 'Thời trang đường phố phong cách Harajuku Tokyo phá cách', status: 'ACTIVE' },
    { brand_name: 'Nordic Pure', description: 'Phong cách Bắc Âu ấm áp, thanh lịch và ấm áp cho mùa lạnh', status: 'ACTIVE' },
    { brand_name: 'Street Vibe Couture', description: 'Sự kết hợp giữa thời trang đường phố và may đo cao cấp', status: 'ACTIVE' },
  ];

  const brands = {};
  for (const b of brandsData) {
    const created = await prisma.brand.upsert({
      where: { brand_name: b.brand_name },
      update: { description: b.description, status: b.status },
      create: b,
    });
    brands[b.brand_name] = created;
  }
  console.log(`✅ Đã tạo ${Object.keys(brands).length} thương hiệu.`);

  // 4. Seed Products cùng Variants và Images (36 Sản phẩm - Đủ 3+ trang)
  console.log('\n👕 --- Tạo Sản phẩm, Biến thể & Hình ảnh mẫu (36 sản phẩm) ---');

  const productsData = [
  {
    "product_name": "Áo Thun Oversize Unisex Màu Đen",
    "description": "Áo thun màu đen chất liệu 100% Cotton định lượng cao cấp, thoáng mát, phom dáng oversize dạo phố trẻ trung năng động.",
    "category_name": "Áo thun",
    "brand_name": "YouthFashion Studio",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
        "is_primary": true,
        "alt": "Áo Thun Oversize Unisex Màu Đen"
      },
      {
        "url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
        "is_primary": false,
        "alt": "Áo thun oversize cận cảnh vải"
      }
    ],
    "variants": [
      {
        "sku": "AT-YOUTH-01-S-DEN",
        "size": "S",
        "color": "Đen",
        "price": 250000,
        "stock": 50
      },
      {
        "sku": "AT-YOUTH-01-M-DEN",
        "size": "M",
        "color": "Đen",
        "price": 250000,
        "stock": 45
      },
      {
        "sku": "AT-YOUTH-01-L-DEN",
        "size": "L",
        "color": "Đen",
        "price": 250000,
        "stock": 30
      }
    ]
  },
  {
    "product_name": "Áo Sơ Mi Oxford Dài Tay Màu Trắng",
    "description": "Áo sơ mi màu trắng tinh tế, chất liệu vải Oxford cao cấp chống nhăn, phom dáng hiện đại thanh lịch cho công sở và dạo phố.",
    "category_name": "Áo sơ mi",
    "brand_name": "Minimalist Line",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
        "is_primary": true,
        "alt": "Áo Sơ Mi Oxford Dài Tay Màu Trắng"
      },
      {
        "url": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
        "is_primary": false,
        "alt": "Áo sơ mi Oxford xanh navy"
      }
    ],
    "variants": [
      {
        "sku": "SM-OXFORD-M-TRANG",
        "size": "M",
        "color": "Trắng",
        "price": 350000,
        "stock": 30
      },
      {
        "sku": "SM-OXFORD-L-TRANG",
        "size": "L",
        "color": "Trắng",
        "price": 350000,
        "stock": 25
      }
    ]
  },
  {
    "product_name": "Quần Jeans Dáng Suông Màu Xanh",
    "description": "Quần jeans màu xanh denim cổ điển, chất liệu vải bò dày dặn bền đẹp, phom dáng suông thẳng tôn dáng và dễ phối đồ.",
    "category_name": "Quần Jeans",
    "brand_name": "Urban Streetwear",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
        "is_primary": true,
        "alt": "Quần Jeans Dáng Suông Màu Xanh"
      },
      {
        "url": "https://images.unsplash.com/photo-1542272604-780c36856d61?w=800",
        "is_primary": false,
        "alt": "Chi tiết túi quần jeans"
      }
    ],
    "variants": [
      {
        "sku": "QJ-VINTAGE-29-XANH",
        "size": "29",
        "color": "Xanh",
        "price": 420000,
        "stock": 20
      },
      {
        "sku": "QJ-VINTAGE-30-XANH",
        "size": "30",
        "color": "Xanh",
        "price": 420000,
        "stock": 35
      },
      {
        "sku": "QJ-VINTAGE-31-XANH",
        "size": "31",
        "color": "Xanh",
        "price": 420000,
        "stock": 15
      }
    ]
  },
  {
    "product_name": "Áo Hoodie Nỉ Bông Có Mũ Màu Xám",
    "description": "Áo hoodie màu xám phong cách streetwear, chất liệu nỉ bông dày dặn ấm áp, có mũ trùm và túi khóa zip tiện lợi.",
    "category_name": "Áo Hoodie & Sweater",
    "brand_name": "Urban Streetwear",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800",
        "is_primary": true,
        "alt": "Áo Hoodie Nỉ Bông Có Mũ Màu Xám"
      },
      {
        "url": "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800",
        "is_primary": false,
        "alt": "Áo hoodie streetwear đen"
      }
    ],
    "variants": [
      {
        "sku": "HD-STREET-M-XAM",
        "size": "M",
        "color": "Xám",
        "price": 490000,
        "stock": 25
      },
      {
        "sku": "HD-STREET-L-XAM",
        "size": "L",
        "color": "Xám",
        "price": 490000,
        "stock": 30
      }
    ]
  },
  {
    "product_name": "Áo Khoác Bomber Unisex Màu Đen",
    "description": "Áo khoác bomber màu đen phong cách thể thao khỏe khoắn, chất vải dù cao cấp chống gió và trượt nước tốt.",
    "category_name": "Áo khoác & Jacket",
    "brand_name": "YouthFashion Studio",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800",
        "is_primary": true,
        "alt": "Áo Khoác Bomber Unisex Màu Đen"
      }
    ],
    "variants": [
      {
        "sku": "JK-BOMBER-M-DEN",
        "size": "M",
        "color": "Đen",
        "price": 550000,
        "stock": 20
      },
      {
        "sku": "JK-BOMBER-L-DEN",
        "size": "L",
        "color": "Đen",
        "price": 550000,
        "stock": 15
      }
    ]
  },
  {
    "product_name": "Áo Thun Thể Thao Màu Đen",
    "description": "Áo thun thể thao màu đen chất liệu thun mè thể thao thoáng khí, co giãn tốt cho vận động.",
    "category_name": "Áo thun",
    "brand_name": "Urban Streetwear",
    "images": [
      {
        "url": "https://res.cloudinary.com/dpjpdeql3/image/upload/v1789672398/youthfashion/products/x3mygtcqlcszwckdbrda.png",
        "is_primary": true,
        "alt": "Áo Thun Thể Thao Màu Đen"
      }
    ],
    "variants": [
      {
        "sku": "YOUTH-7644-S",
        "size": "S",
        "color": "Đen",
        "price": 250000,
        "stock": 50
      },
      {
        "sku": "YOUTH-7644-M",
        "size": "M",
        "color": "Đen",
        "price": 250000,
        "stock": 50
      }
    ]
  },
  {
    "product_name": "Áo Hoodie Nỉ Trơn Màu Đen",
    "description": "Áo hoodie màu đen chất liệu nỉ bông ấm áp, phom rộng cá tính dạo phố phong cách đường phố.",
    "category_name": "Áo Hoodie & Sweater",
    "brand_name": "Urban Streetwear",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1570570134010-818fa41ebfeb?w=800",
        "is_primary": true,
        "alt": "Áo Hoodie Nỉ Trơn Màu Đen"
      },
      {
        "url": "https://images.unsplash.com/photo-1570570134010-818fa41ebfeb?w=800",
        "is_primary": false,
        "alt": "Áo Hoodie Nỉ Trơn Màu Đen"
      }
    ],
    "variants": [
      {
        "sku": "HD-STREET-04-M-XAM",
        "size": "M",
        "color": "Đen",
        "price": 680000,
        "stock": 25
      },
      {
        "sku": "HD-STREET-04-L-DEN",
        "size": "L",
        "color": "Đen",
        "price": 680000,
        "stock": 40
      }
    ]
  },
  {
    "product_name": "Áo Măng Tô Dạ Dáng Dài Màu Nâu",
    "description": "Áo măng tô dạ màu nâu dáng dài sang trọng, giữ ấm mùa đông tuyệt đối, đường may tinh xảo chuẩn phong cách Hàn Quốc.",
    "category_name": "Áo khoác & Jacket",
    "brand_name": "Atelier Elegance",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1579000915039-b91be9e0cbe4?w=800",
        "is_primary": true,
        "alt": "Áo Măng Tô Dạ Dáng Dài Màu Nâu"
      },
      {
        "url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
        "is_primary": false,
        "alt": "Áo vest lịch lãm"
      }
    ],
    "variants": [
      {
        "sku": "VZ-EURO-06-M-CARO",
        "size": "M",
        "color": "Nâu",
        "price": 1850000,
        "stock": 12
      },
      {
        "sku": "VZ-EURO-06-L-CARO",
        "size": "L",
        "color": "Nâu",
        "price": 1850000,
        "stock": 10
      }
    ]
  },
  {
    "product_name": "Váy Đầm Dạ Hội Lụa Satin Màu Đỏ",
    "description": "Đầm dạ hội màu đỏ quyến rũ chất liệu lụa satin cao cấp, thiết kế cổ chữ V xếp ly tôn dáng thanh lịch.",
    "category_name": "Trang Phục Dạ Hội",
    "brand_name": "Modern Luxe",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
        "is_primary": true,
        "alt": "Váy Đầm Dạ Hội Lụa Satin Màu Đỏ"
      }
    ],
    "variants": [
      {
        "sku": "VD-LUA-07-S-RED",
        "size": "S",
        "color": "Đỏ",
        "price": 1450000,
        "stock": 15
      },
      {
        "sku": "VD-LUA-07-M-RED",
        "size": "M",
        "color": "Đỏ",
        "price": 1450000,
        "stock": 18
      }
    ]
  },
  {
    "product_name": "Áo Khoác Dạ Dáng Dài Màu Be",
    "description": "Áo khoác dạ màu be thanh lịch, phom suông dài phong cách tối giản giữ ấm mùa thu đông hiệu quả.",
    "category_name": "Áo khoác & Jacket",
    "brand_name": "Heritage Vintage",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1544441893-675973e31985?w=800",
        "is_primary": true,
        "alt": "Áo Khoác Dạ Dáng Dài Màu Be"
      }
    ],
    "variants": [
      {
        "sku": "MT-DA-08-M-BE",
        "size": "M",
        "color": "Be",
        "price": 2200000,
        "stock": 8
      },
      {
        "sku": "MT-DA-08-L-BE",
        "size": "L",
        "color": "Be",
        "price": 2200000,
        "stock": 10
      }
    ]
  },
  {
    "product_name": "Áo Polo Nam Cổ Bẻ Màu Xanh Lá",
    "description": "Áo polo màu xanh lá chất liệu dệt kim co giãn thoáng mát, cổ bẻ lịch sự cho nam giới.",
    "category_name": "Áo Polo",
    "brand_name": "Casual Essentials",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800",
        "is_primary": true,
        "alt": "Áo Polo Nam Cổ Bẻ Màu Xanh Lá"
      }
    ],
    "variants": [
      {
        "sku": "PL-DETKIM-09-M-RUE",
        "size": "M",
        "color": "Xanh lá",
        "price": 390000,
        "stock": 35
      },
      {
        "sku": "PL-DETKIM-09-L-RUE",
        "size": "L",
        "color": "Xanh lá",
        "price": 390000,
        "stock": 30
      }
    ]
  },
  {
    "product_name": "Quần Short Kaki Túi Hộp Màu Vàng",
    "description": "Quần short màu vàng phong cách cargo túi hộp năng động, chất kaki dày dặn bền đẹp.",
    "category_name": "Quần Short",
    "brand_name": "Urban Streetwear",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800",
        "is_primary": true,
        "alt": "Quần Short Kaki Túi Hộp Màu Vàng"
      }
    ],
    "variants": [
      {
        "sku": "QS-CARGO-10-M-KHOAN",
        "size": "M",
        "color": "Vàng",
        "price": 350000,
        "stock": 25
      },
      {
        "sku": "QS-CARGO-10-L-KHOAN",
        "size": "L",
        "color": "Vàng",
        "price": 350000,
        "stock": 20
      }
    ]
  },
  {
    "product_name": "Quần Kaki Chino Slimfit Màu Đen",
    "description": "Quần kaki màu đen phom ôm vừa vặn, lịch sự, dễ phối cùng áo sơ mi và áo polo.",
    "category_name": "Quần Kaki & Chino",
    "brand_name": "Minimalist Line",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800",
        "is_primary": true,
        "alt": "Quần Kaki Chino Slimfit Màu Đen"
      }
    ],
    "variants": [
      {
        "sku": "QK-CHINO-11-30-DEN",
        "size": "30",
        "color": "Đen",
        "price": 480000,
        "stock": 40
      },
      {
        "sku": "QK-CHINO-11-31-DEN",
        "size": "31",
        "color": "Đen",
        "price": 480000,
        "stock": 30
      }
    ]
  },
  {
    "product_name": "Quần Tây Công Sở Xếp Ly Màu Xám",
    "description": "Quần tây màu xám cạp cao xếp ly, chất vải tuyết mưa đứng phom sang trọng.",
    "category_name": "Quần Tây & Trouser",
    "brand_name": "Atelier Elegance",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800",
        "is_primary": true,
        "alt": "Quần Tây Công Sở Xếp Ly Màu Xám"
      }
    ],
    "variants": [
      {
        "sku": "QT-TROUSER-12-M-XAM",
        "size": "M",
        "color": "Xám",
        "price": 520000,
        "stock": 22
      },
      {
        "sku": "QT-TROUSER-12-L-XAM",
        "size": "L",
        "color": "Xám",
        "price": 520000,
        "stock": 18
      }
    ]
  },
  {
    "product_name": "Quần Jogger Thể Thao Bo Gấu Màu Đen",
    "description": "Quần jogger thể thao màu đen bo gấu khỏe khoắn, chất thun nỉ co giãn thoải mái khi tập luyện.",
    "category_name": "Quần Jogger & Thể thao",
    "brand_name": "Sporty Activewear",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800",
        "is_primary": true,
        "alt": "Quần Jogger Thể Thao Bo Gấu Màu Đen"
      }
    ],
    "variants": [
      {
        "sku": "QJ-JOGGER-13-M-DEN",
        "size": "M",
        "color": "Đen",
        "price": 410000,
        "stock": 50
      },
      {
        "sku": "QJ-JOGGER-13-L-DEN",
        "size": "L",
        "color": "Đen",
        "price": 410000,
        "stock": 45
      }
    ]
  },
  {
    "product_name": "Chân Váy Xếp Ly Dáng Dài Màu Trắng",
    "description": "Chân váy midi màu trắng xếp ly nhẹ nhàng, nữ tính, dễ dàng kết hợp cùng áo len hoặc sơ mi.",
    "category_name": "Chân Váy",
    "brand_name": "Signature Atelier",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800",
        "is_primary": true,
        "alt": "Chân Váy Xếp Ly Dáng Dài Màu Trắng"
      }
    ],
    "variants": [
      {
        "sku": "CV-MIDI-14-S-BE",
        "size": "S",
        "color": "Trắng",
        "price": 420000,
        "stock": 20
      },
      {
        "sku": "CV-MIDI-14-M-BE",
        "size": "M",
        "color": "Trắng",
        "price": 420000,
        "stock": 25
      }
    ]
  },
  {
    "product_name": "Áo Len Dệt Kim Cổ Lọ Màu Nâu",
    "description": "Áo len cổ lọ màu nâu ấm áp, sợi dệt mềm mại không xù lông, giữ ấm tối ưu cho ngày lạnh.",
    "category_name": "Đồ Đông & Áo Len",
    "brand_name": "Nordic Pure",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800",
        "is_primary": true,
        "alt": "Áo Len Dệt Kim Cổ Lọ Màu Nâu"
      }
    ],
    "variants": [
      {
        "sku": "AL-COLO-15-M-NAU",
        "size": "M",
        "color": "Nâu",
        "price": 650000,
        "stock": 15
      },
      {
        "sku": "AL-COLO-15-L-NAU",
        "size": "L",
        "color": "Nâu",
        "price": 650000,
        "stock": 12
      }
    ]
  },
  {
    "product_name": "Áo Thun Unisex Loang Màu Xám",
    "description": "Áo thun màu xám hiệu ứng acid wash cá tính, chất cotton 100% thoáng mát phong cách dạo phố.",
    "category_name": "Áo thun",
    "brand_name": "Tokyo Underground",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
        "is_primary": true,
        "alt": "Áo Thun Unisex Loang Màu Xám"
      }
    ],
    "variants": [
      {
        "sku": "AT-ACID-16-M-XAM",
        "size": "M",
        "color": "Xám",
        "price": 320000,
        "stock": 30
      },
      {
        "sku": "AT-ACID-16-L-XAM",
        "size": "L",
        "color": "Xám",
        "price": 320000,
        "stock": 28
      }
    ]
  },
  {
    "product_name": "Áo Sơ Mi Vải Đũi Cổ Tàu Màu Trắng",
    "description": "Áo sơ mi cổ tàu màu trắng chất liệu đũi linen tự nhiên, thấm hút mồ hôi và thoáng mát mùa hè.",
    "category_name": "Áo sơ mi",
    "brand_name": "Eco Style Co.",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800",
        "is_primary": true,
        "alt": "Áo Sơ Mi Vải Đũi Cổ Tàu Màu Trắng"
      }
    ],
    "variants": [
      {
        "sku": "SM-LINEN-17-M-TRANG",
        "size": "M",
        "color": "Trắng",
        "price": 490000,
        "stock": 20
      },
      {
        "sku": "SM-LINEN-17-L-TRANG",
        "size": "L",
        "color": "Trắng",
        "price": 490000,
        "stock": 18
      }
    ]
  },
  {
    "product_name": "Áo Sweater Nỉ Cổ Tròn Màu Xanh Lá",
    "description": "Áo sweater màu xanh lá chất liệu nỉ bông mềm mịn, in chữ typography tối giản năng động.",
    "category_name": "Áo Hoodie & Sweater",
    "brand_name": "Street Vibe Couture",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800",
        "is_primary": true,
        "alt": "Áo Sweater Nỉ Cổ Tròn Màu Xanh Lá"
      }
    ],
    "variants": [
      {
        "sku": "SW-TYPO-18-M-REU",
        "size": "M",
        "color": "Xanh lá",
        "price": 550000,
        "stock": 24
      },
      {
        "sku": "SW-TYPO-18-L-REU",
        "size": "L",
        "color": "Xanh lá",
        "price": 550000,
        "stock": 22
      }
    ]
  },
  {
    "product_name": "Balo Vải Canvas Laptop Màu Nâu",
    "description": "Balo màu nâu chất liệu vải canvas chống thấm nước, nhiều ngăn chứa laptop 15.6 inch tiện dụng.",
    "category_name": "Túi Xách & Balo",
    "brand_name": "Heritage Vintage",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
        "is_primary": true,
        "alt": "Balo Vải Canvas Laptop Màu Nâu"
      }
    ],
    "variants": [
      {
        "sku": "BL-CANVAS-19-FREE-BO",
        "size": "FreeSize",
        "color": "Nâu",
        "price": 620000,
        "stock": 15
      }
    ]
  },
  {
    "product_name": "Túi Xách Nữ Da Pu Màu Đen",
    "description": "Túi xách tay nữ màu đen chất da PU cao cấp, phom cứng cáp sang trọng phù hợp đi làm và dự tiệc.",
    "category_name": "Túi Xách & Balo",
    "brand_name": "Modern Luxe",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800",
        "is_primary": true,
        "alt": "Túi Xách Nữ Da Pu Màu Đen"
      }
    ],
    "variants": [
      {
        "sku": "TX-DA-20-FREE-DEN",
        "size": "FreeSize",
        "color": "Đen",
        "price": 890000,
        "stock": 10
      }
    ]
  },
  {
    "product_name": "Giày Sneaker Thể Thao Cổ Thấp Màu Trắng",
    "description": "Giày sneaker màu trắng thiết kế retro thể thao, đế cao su êm ái chống trơn trượt.",
    "category_name": "Giày & Sandal",
    "brand_name": "Sporty Activewear",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
        "is_primary": true,
        "alt": "Giày Sneaker Thể Thao Cổ Thấp Màu Trắng"
      }
    ],
    "variants": [
      {
        "sku": "SN-RETRO-21-40-TRANG",
        "size": "40",
        "color": "Trắng",
        "price": 1150000,
        "stock": 14
      },
      {
        "sku": "SN-RETRO-21-41-TRANG",
        "size": "41",
        "color": "Trắng",
        "price": 1150000,
        "stock": 12
      }
    ]
  },
  {
    "product_name": "Dép Sandal Da Quai Ngang Màu Nâu",
    "description": "Sandal màu nâu đế trấu tự nhiên, quai da bền chắc êm chân khi di chuyển ngoài trời.",
    "category_name": "Giày & Sandal",
    "brand_name": "Eco Style Co.",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800",
        "is_primary": true,
        "alt": "Dép Sandal Da Quai Ngang Màu Nâu"
      }
    ],
    "variants": [
      {
        "sku": "SD-TRAU-22-39-NAU",
        "size": "39",
        "color": "Nâu",
        "price": 580000,
        "stock": 20
      },
      {
        "sku": "SD-TRAU-22-40-NAU",
        "size": "40",
        "color": "Nâu",
        "price": 580000,
        "stock": 18
      }
    ]
  },
  {
    "product_name": "Mũ Len Beanie Dệt Kim Màu Đen",
    "description": "Mũ len beanie màu đen dệt kim co giãn, giữ ấm đầu phong cách tối giản.",
    "category_name": "Mũ & Nón Thời Trang",
    "brand_name": "Minimalist Line",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800",
        "is_primary": true,
        "alt": "Mũ Len Beanie Dệt Kim Màu Đen"
      }
    ],
    "variants": [
      {
        "sku": "MB-LEN-23-FREE-DEN",
        "size": "FreeSize",
        "color": "Đen",
        "price": 190000,
        "stock": 50
      }
    ]
  },
  {
    "product_name": "Mũ Lưỡi Trai Nón Kết Màu Xanh",
    "description": "Nón lưỡi trai màu xanh chất liệu kaki cotton thoáng mát, thêu logo nổi bật.",
    "category_name": "Mũ & Nón Thời Trang",
    "brand_name": "Urban Streetwear",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800",
        "is_primary": true,
        "alt": "Mũ Lưỡi Trai Nón Kết Màu Xanh"
      }
    ],
    "variants": [
      {
        "sku": "MC-VINTAGE-24-FREE-NAVY",
        "size": "FreeSize",
        "color": "Xanh",
        "price": 220000,
        "stock": 40
      }
    ]
  },
  {
    "product_name": "Thắt Lưng Da Nam Mặt Kim Màu Đen",
    "description": "Thắt lưng nam màu đen chất da bò cao cấp, khóa kim kim loại chống gỉ tinh tế.",
    "category_name": "Thắt Lưng & Ví Da",
    "brand_name": "Signature Atelier",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800",
        "is_primary": true,
        "alt": "Thắt Lưng Da Nam Mặt Kim Màu Đen"
      }
    ],
    "variants": [
      {
        "sku": "TL-DABO-25-FREE-DEN",
        "size": "FreeSize",
        "color": "Đen",
        "price": 380000,
        "stock": 30
      }
    ]
  },
  {
    "product_name": "Kính Mát Gọng Kim Loại Màu Vàng",
    "description": "Kính râm thời trang gọng mạ màu vàng, tròng kính polarized chống lóa và chống tia UV400.",
    "category_name": "Kính Mát Thời Trang",
    "brand_name": "Modern Luxe",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800",
        "is_primary": true,
        "alt": "Kính Mát Gọng Kim Loại Màu Vàng"
      }
    ],
    "variants": [
      {
        "sku": "KM-TITAN-26-FREE-VANG",
        "size": "FreeSize",
        "color": "Vàng",
        "price": 450000,
        "stock": 25
      }
    ]
  },
  {
    "product_name": "Khăn Quàng Cổ Len Mùa Đông Màu Xám",
    "description": "Khăn quàng cổ màu xám chất liệu len cashmere mềm mại, giữ ấm cơ thể trong mùa đông giá lạnh.",
    "category_name": "Khăn Quàng & Phụ Kiện",
    "brand_name": "Nordic Pure",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800",
        "is_primary": true,
        "alt": "Khăn Quàng Cổ Len Mùa Đông Màu Xám"
      }
    ],
    "variants": [
      {
        "sku": "KQ-CASHMERE-27-FREE-XAM",
        "size": "FreeSize",
        "color": "Xám",
        "price": 340000,
        "stock": 30
      }
    ]
  },
  {
    "product_name": "Bộ Đồ Tập Gym Yoga Nữ Màu Hồng",
    "description": "Set đồ tập gym yoga nữ màu hồng gồm áo bra thể thao và quần legging co giãn 4 chiều.",
    "category_name": "Bộ Đồ Thể Thao",
    "brand_name": "Sporty Activewear",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800",
        "is_primary": true,
        "alt": "Bộ Đồ Tập Gym Yoga Nữ Màu Hồng"
      }
    ],
    "variants": [
      {
        "sku": "BD-GYM-28-S-HONG",
        "size": "S",
        "color": "Hồng",
        "price": 690000,
        "stock": 20
      },
      {
        "sku": "BD-GYM-28-M-HONG",
        "size": "M",
        "color": "Hồng",
        "price": 690000,
        "stock": 18
      }
    ]
  },
  {
    "product_name": "Bộ Đồ Mặc Nhà Lụa Pyjama Màu Xanh",
    "description": "Bộ pyjama mặc nhà màu xanh chất lụa satin bóng mượt, thoáng mát và mềm mại trên làn da.",
    "category_name": "Đồ Lót & Đồ Mặc Nhà",
    "brand_name": "Atelier Elegance",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800",
        "is_primary": true,
        "alt": "Bộ Đồ Mặc Nhà Lụa Pyjama Màu Xanh"
      }
    ],
    "variants": [
      {
        "sku": "PJ-SILK-29-M-XANH",
        "size": "M",
        "color": "Xanh",
        "price": 750000,
        "stock": 15
      },
      {
        "sku": "PJ-SILK-29-L-XANH",
        "size": "L",
        "color": "Xanh",
        "price": 750000,
        "stock": 12
      }
    ]
  },
  {
    "product_name": "Áo Khoác Denim Bò Cổ Bẻ Màu Xanh",
    "description": "Áo khoác bò denim màu xanh wash cổ điển, chất vải jean dày dặn phong cách bụi bặm.",
    "category_name": "Áo khoác & Jacket",
    "brand_name": "Denim Crafter",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800",
        "is_primary": true,
        "alt": "Áo Khoác Denim Bò Cổ Bẻ Màu Xanh"
      }
    ],
    "variants": [
      {
        "sku": "JK-DENIM-30-M-XANHDAM",
        "size": "M",
        "color": "Xanh",
        "price": 820000,
        "stock": 20
      },
      {
        "sku": "JK-DENIM-30-L-XANHDAM",
        "size": "L",
        "color": "Xanh",
        "price": 820000,
        "stock": 15
      }
    ]
  },
  {
    "product_name": "Đầm Dạ Hội Dáng Dài Màu Đen",
    "description": "Đầm dạ hội màu đen xẻ tà sang trọng, đính đá viền cổ nổi bật trong các buổi dạ tiệc.",
    "category_name": "Trang Phục Dạ Hội",
    "brand_name": "Atelier Elegance",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800",
        "is_primary": true,
        "alt": "Đầm Dạ Hội Dáng Dài Màu Đen"
      }
    ],
    "variants": [
      {
        "sku": "DH-DINHDA-31-S-DEN",
        "size": "S",
        "color": "Đen",
        "price": 2800000,
        "stock": 5
      },
      {
        "sku": "DH-DINHDA-31-M-DEN",
        "size": "M",
        "color": "Đen",
        "price": 2800000,
        "stock": 7
      }
    ]
  },
  {
    "product_name": "Bộ Đồ Bơi Đi Biển 2 Mảnh Màu Vàng",
    "description": "Bộ đồ bơi bikini 2 mảnh màu vàng tươi tắn, chất liệu thun bơi chống nước co giãn ôm dáng.",
    "category_name": "Đồ Bơi & Mùa Hè",
    "brand_name": "YouthFashion Studio",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
        "is_primary": true,
        "alt": "Bộ Đồ Bơi Đi Biển 2 Mảnh Màu Vàng"
      }
    ],
    "variants": [
      {
        "sku": "BK-SUMMER-32-S-VANG",
        "size": "S",
        "color": "Vàng",
        "price": 490000,
        "stock": 15
      },
      {
        "sku": "BK-SUMMER-32-M-VANG",
        "size": "M",
        "color": "Vàng",
        "price": 490000,
        "stock": 20
      }
    ]
  },
  {
    "product_name": "Áo Sơ Mi Flannel Kẻ Caro Màu Đỏ",
    "description": "Áo sơ mi flannel dạ kẻ caro màu đỏ phối đen, phom rộng phong cách grunge đường phố.",
    "category_name": "Áo sơ mi",
    "brand_name": "Urban Streetwear",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800",
        "is_primary": true,
        "alt": "Áo Sơ Mi Flannel Kẻ Caro Màu Đỏ"
      }
    ],
    "variants": [
      {
        "sku": "SM-FLANNEL-33-M-DO",
        "size": "M",
        "color": "Đỏ",
        "price": 460000,
        "stock": 25
      },
      {
        "sku": "SM-FLANNEL-33-L-DO",
        "size": "L",
        "color": "Đỏ",
        "price": 460000,
        "stock": 30
      }
    ]
  },
  {
    "product_name": "Quần Jeans Rách Gối Màu Xanh",
    "description": "Quần jeans màu xanh nhạt rách gối cá tính, chất denim cao cấp chuẩn phong cách Hàn Quốc.",
    "category_name": "Quần Jeans",
    "brand_name": "Tokyo Underground",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800",
        "is_primary": true,
        "alt": "Quần Jeans Rách Gối Màu Xanh"
      }
    ],
    "variants": [
      {
        "sku": "QJ-KOREAN-34-29-XANH",
        "size": "29",
        "color": "Xanh",
        "price": 560000,
        "stock": 18
      },
      {
        "sku": "QJ-KOREAN-34-30-XANH",
        "size": "30",
        "color": "Xanh",
        "price": 560000,
        "stock": 22
      }
    ]
  },
  {
    "product_name": "Áo Gilet Len Không Tay Màu Trắng",
    "description": "Áo gilet len không tay màu trắng cổ tim, thích hợp phối layer cùng áo sơ mi phong cách preppy.",
    "category_name": "Áo Vest & Blazer",
    "brand_name": "Minimalist Line",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=800",
        "is_primary": true,
        "alt": "Áo Gilet Len Không Tay Màu Trắng"
      }
    ],
    "variants": [
      {
        "sku": "GL-PREPPY-35-M-KEM",
        "size": "M",
        "color": "Trắng",
        "price": 430000,
        "stock": 20
      },
      {
        "sku": "GL-PREPPY-35-L-KEM",
        "size": "L",
        "color": "Trắng",
        "price": 430000,
        "stock": 15
      }
    ]
  },
  {
    "product_name": "Áo Thun Ba Lỗ Ôm Dáng Màu Trắng",
    "description": "Áo thun ba lỗ màu trắng chất liệu vải tăm co giãn ôm dáng, thoáng mát và quyến rũ.",
    "category_name": "Áo thun",
    "brand_name": "Casual Essentials",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1627225924765-552d49cf47ad?w=800",
        "is_primary": true,
        "alt": "Áo Thun Ba Lỗ Ôm Dáng Màu Trắng"
      }
    ],
    "variants": [
      {
        "sku": "AT-TANK-36-M-TRANG",
        "size": "M",
        "color": "Trắng",
        "price": 180000,
        "stock": 60
      },
      {
        "sku": "AT-TANK-36-L-TRANG",
        "size": "L",
        "color": "Trắng",
        "price": 180000,
        "stock": 50
      }
    ]
  },
  {
    "product_name": "Áo Thun Thể Thao In Họa Tiết Màu Đen",
    "description": "Áo thun thể thao màu đen in logo sắc nét, chất thun lạnh thấm hút mồ hôi tối ưu.",
    "category_name": "Áo thun",
    "brand_name": "Atelier Elegance",
    "images": [
      {
        "url": "https://res.cloudinary.com/dpjpdeql3/image/upload/v1791886580/youthfashion/products/orqxrcz1ccnldzjesfvr.jpg",
        "is_primary": true,
        "alt": "Áo Thun Thể Thao In Họa Tiết Màu Đen"
      },
      {
        "url": "https://res.cloudinary.com/dpjpdeql3/image/upload/v1791886580/youthfashion/products/stzz03uzrhcc2wdlva9k.jpg",
        "is_primary": false,
        "alt": "Áo MU - 2"
      },
      {
        "url": "https://res.cloudinary.com/dpjpdeql3/image/upload/v1791886581/youthfashion/products/abiqswaxuiiktl2glzn2.png",
        "is_primary": false,
        "alt": "Áo MU - 3"
      }
    ],
    "variants": [
      {
        "sku": "YOUTH-7370-S",
        "size": "S",
        "color": "Đen",
        "price": 250000,
        "stock": 50
      },
      {
        "sku": "YOUTH-7370-M",
        "size": "M",
        "color": "Đen",
        "price": 250000,
        "stock": 50
      },
      {
        "sku": "SKU-9058",
        "size": "L",
        "color": "Đen",
        "price": 290000,
        "stock": 20
      }
    ]
  },
  {
    "product_name": "Áo Măng Tô Dạ Dáng Dài Màu Xanh",
    "description": "Áo măng tô dạ dáng dài màu xanh pastel trang nhã thanh lịch, chất dạ cao cấp giữ ấm chuẩn phong cách Châu Âu.",
    "category_name": "Áo khoác & Jacket",
    "brand_name": "Atelier Elegance",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000",
        "is_primary": true,
        "alt": "Áo Măng Tô Dạ Dáng Dài Màu Xanh"
      }
    ],
    "variants": [
      {
        "sku": "MT-CAMEL-01-S",
        "size": "S",
        "color": "Xanh",
        "price": 3850000,
        "stock": 20
      },
      {
        "sku": "MT-CAMEL-01-M",
        "size": "M",
        "color": "Xanh",
        "price": 3850000,
        "stock": 25
      },
      {
        "sku": "MT-CAMEL-01-L",
        "size": "L",
        "color": "Xanh",
        "price": 3850000,
        "stock": 15
      }
    ]
  },
  {
    "product_name": "Áo Len Cổ Lọ Dệt Kim Màu Trắng",
    "description": "Áo len dệt kim màu trắng kem cổ lọ cao, giữ ấm tuyệt đối và dễ phối cùng chân váy hay quần tây.",
    "category_name": "Đồ Đông & Áo Len",
    "brand_name": "Nordic Pure",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=800",
        "is_primary": true,
        "alt": "Áo Len Cổ Lọ Dệt Kim Màu Trắng"
      }
    ],
    "variants": [
      {
        "sku": "AL-CREAM-02-S",
        "size": "S",
        "color": "Trắng",
        "price": 950000,
        "stock": 30
      },
      {
        "sku": "AL-CREAM-02-M",
        "size": "M",
        "color": "Trắng",
        "price": 950000,
        "stock": 35
      },
      {
        "sku": "AL-CREAM-02-L",
        "size": "L",
        "color": "Trắng",
        "price": 950000,
        "stock": 20
      }
    ]
  },
  {
    "product_name": "Quần Âu Nam Ống Suông Màu Xám",
    "description": "Quần âu nam màu xám ống suông chất vải tuyết mưa đứng dáng, cạp may tỉ mỉ sang trọng.",
    "category_name": "Quần Tây & Trouser",
    "brand_name": "Atelier Elegance",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=800",
        "is_primary": true,
        "alt": "Quần Âu Nam Ống Suông Màu Xám"
      }
    ],
    "variants": [
      {
        "sku": "QA-SUONG-03-29",
        "size": "29",
        "color": "Xám",
        "price": 1250000,
        "stock": 15
      },
      {
        "sku": "QA-SUONG-03-30",
        "size": "30",
        "color": "Xám",
        "price": 1250000,
        "stock": 20
      },
      {
        "sku": "QA-SUONG-03-31",
        "size": "31",
        "color": "Xám",
        "price": 1250000,
        "stock": 18
      }
    ]
  },
  {
    "product_name": "Đầm Lụa Dạ Hội Xếp Ly Màu Đỏ",
    "description": "Đầm lụa dạ tiệc màu đỏ xếp ly quý phái, chất liệu satin bóng bẩy tôn vinh vẻ đẹp kiêu sa.",
    "category_name": "Trang Phục Dạ Hội",
    "brand_name": "Modern Luxe",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000",
        "is_primary": true,
        "alt": "Đầm Lụa Dạ Hội Xếp Ly Màu Đỏ"
      }
    ],
    "variants": [
      {
        "sku": "DL-EMERALD-04-S",
        "size": "S",
        "color": "Đỏ",
        "price": 2950000,
        "stock": 10
      },
      {
        "sku": "DL-EMERALD-04-M",
        "size": "M",
        "color": "Đỏ",
        "price": 2950000,
        "stock": 15
      },
      {
        "sku": "DL-EMERALD-04-L",
        "size": "L",
        "color": "Đỏ",
        "price": 2950000,
        "stock": 8
      }
    ]
  },
  {
    "product_name": "Áo Sơ Mi Oxford Nam Màu Xanh",
    "description": "Áo sơ mi nam màu xanh chất liệu cotton Oxford bền đẹp, phom dáng regular fit lịch lãm.",
    "category_name": "Áo sơ mi",
    "brand_name": "Atelier Elegance",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800",
        "is_primary": true,
        "alt": "Áo Sơ Mi Oxford Nam Màu Xanh"
      }
    ],
    "variants": [
      {
        "sku": "AK-TWEED-05-S",
        "size": "S",
        "color": "Xanh",
        "price": 2150000,
        "stock": 18
      },
      {
        "sku": "AK-TWEED-05-M",
        "size": "M",
        "color": "Xanh",
        "price": 2150000,
        "stock": 22
      }
    ]
  },
  {
    "product_name": "Quần Tây Công Sở Nam Màu Đen",
    "description": "Quần tây màu đen phom đứng dáng thanh lịch, cạp êm ái thích hợp cho môi trường văn phòng.",
    "category_name": "Quần Tây & Trouser",
    "brand_name": "Minimalist Line",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800",
        "is_primary": true,
        "alt": "Quần Tây Công Sở Nam Màu Đen"
      }
    ],
    "variants": [
      {
        "sku": "QT-SLIM-06-29",
        "size": "29",
        "color": "Đen",
        "price": 890000,
        "stock": 25
      },
      {
        "sku": "QT-SLIM-06-30",
        "size": "30",
        "color": "Đen",
        "price": 890000,
        "stock": 30
      },
      {
        "sku": "QT-SLIM-06-31",
        "size": "31",
        "color": "Đen",
        "price": 890000,
        "stock": 20
      }
    ]
  },
  {
    "product_name": "Bộ Đồ Nỉ Hoodie Thể Thao Màu Vàng",
    "description": "Set bộ nỉ hoodie dáng croptop kèm quần jogger màu vàng tươi trẻ trung, năng động, phong cách thời trang thể thao đường phố streetwear.",
    "category_name": "Bộ Đồ Thể Thao",
    "brand_name": "Signature Atelier",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
        "is_primary": true,
        "alt": "Bộ Đồ Nỉ Hoodie Thể Thao Màu Vàng"
      }
    ],
    "variants": [
      {
        "sku": "BL-STRIPE-07-M",
        "size": "M",
        "color": "Vàng",
        "price": 1950000,
        "stock": 15
      },
      {
        "sku": "BL-STRIPE-07-L",
        "size": "L",
        "color": "Vàng",
        "price": 1950000,
        "stock": 12
      }
    ]
  },
  {
    "product_name": "Áo Sơ Mi Poplin Dài Tay Màu Trắng",
    "description": "Áo sơ mi màu trắng chất liệu poplin cotton thoáng khí, chống nhăn, phom dáng chuẩn mực công sở.",
    "category_name": "Áo sơ mi",
    "brand_name": "Casual Essentials",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
        "is_primary": true,
        "alt": "Áo Sơ Mi Poplin Dài Tay Màu Trắng"
      }
    ],
    "variants": [
      {
        "sku": "SM-POPLIN-08-S",
        "size": "S",
        "color": "Trắng",
        "price": 750000,
        "stock": 30
      },
      {
        "sku": "SM-POPLIN-08-M",
        "size": "M",
        "color": "Trắng",
        "price": 750000,
        "stock": 40
      },
      {
        "sku": "SM-POPLIN-08-L",
        "size": "L",
        "color": "Trắng",
        "price": 750000,
        "stock": 25
      }
    ]
  },
  {
    "product_name": "Giày Sneaker Cổ Điển Màu Trắng",
    "description": "Giày sneaker thể thao màu trắng phom dáng cổ điển retro, lót giày êm ái chống sốc tốt.",
    "category_name": "Giày & Sandal",
    "brand_name": "Modern Luxe",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
        "is_primary": true,
        "alt": "Giày Sneaker Cổ Điển Màu Trắng"
      }
    ],
    "variants": [
      {
        "sku": "BT-NAPPA-09-37",
        "size": "37",
        "color": "Trắng",
        "price": 2100000,
        "stock": 10
      },
      {
        "sku": "BT-NAPPA-09-38",
        "size": "38",
        "color": "Trắng",
        "price": 2100000,
        "stock": 14
      },
      {
        "sku": "BT-NAPPA-09-39",
        "size": "39",
        "color": "Trắng",
        "price": 2100000,
        "stock": 8
      }
    ]
  }
];

  const createdProductsMap = {};

  for (const item of productsData) {
    const category = categories[item.category_name];
    const brand = brands[item.brand_name];

    if (!category || !brand) {
      console.warn(`⚠️ Không tìm thấy danh mục [${item.category_name}] hoặc thương hiệu [${item.brand_name}]`);
      continue;
    }

    let existingProduct = await prisma.product.findFirst({
      where: { product_name: item.product_name },
      include: { variants: true, images: true, category: true, brand: true }
    });

    if (!existingProduct) {
      existingProduct = await prisma.product.create({
        data: {
          product_name: item.product_name,
          description: item.description,
          category_id: category.category_id,
          brand_id: brand.brand_id,
          status: 'ACTIVE',
          images: {
            create: item.images.map((img, idx) => ({
              image_url: img.url,
              alt_text: img.alt,
              is_primary: img.is_primary,
              display_order: idx + 1,
            })),
          },
          variants: {
            create: item.variants.map((v) => ({
              sku: v.sku,
              size: v.size,
              color: v.color,
              price: v.price,
              stock: v.stock,
              status: 'ACTIVE',
            })),
          },
        },
        include: { variants: true, images: true, category: true, brand: true }
      });
      console.log(`  ➕ Đã thêm sản phẩm: ${existingProduct.product_name}`);
    } else {
      console.log(`  ℹ️ Sản phẩm đã tồn tại: ${existingProduct.product_name}`);
    }
    createdProductsMap[item.product_name] = existingProduct;
  }

  // Helper để map thông tin sản phẩm vào lookbook
  const buildTaggedProduct = (productName) => {
    const p = createdProductsMap[productName];
    if (!p) return null;
    const primaryImg = p.images?.find(i => i.is_primary)?.image_url || p.images?.[0]?.image_url || '';
    const priceVal = p.variants?.[0]?.price ? Number(p.variants[0].price) : 0;
    return {
      product_id: String(p.product_id),
      name: p.product_name,
      price: priceVal > 0 ? priceVal.toLocaleString('vi-VN') + '₫' : 'Liên hệ',
      price_num: priceVal,
      image: primaryImg,
      category_name: p.category?.category_name || '',
      sku: p.variants?.[0]?.sku || `YF-${p.product_id}`
    };
  };

  // 5. Seed Lookbooks (5 Tuyển tập Lookbook mẫu)
  console.log('\n📖 --- Tạo Danh sách Lookbook mẫu (5 bộ sưu tập) ---');
  const lookbooksData = [
    {
      type: 'hero',
      look_code: 'BANNER',
      section_role: "Banner (Ảnh trên cùng - Hero Cover đầu trang)",
      title: "Ảnh Bìa Hero Banner: L'Automne Éternel",
      code: 'LB - HERO00',
      season: 'CHIẾN DỊCH CHÍNH THỨC',
      badge: 'HERO COVER',
      position: 'banner',
      product_count: 0,
      status: 'PUBLISHED',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1600',
      description: 'Khúc xạ của thu vĩnh cửu giữa đại lộ Paris — Nơi phong cách hòa cùng nghệ thuật may đo thủ công Pháp.',
      campaign_audio: 'Paris Autumn Symphony • 3:42 mins',
      conversion_rate: '42%',
      products: [],
    },
    {
      type: 'look',
      look_code: 'LOOK 01',
      section_role: 'Khối Look 01 (Áo Măng Tô Belted & Nổi Bật Trang Chủ)',
      title: 'Áo Măng Tô Belted Dạ Camel Cashmere Quý Phái Thời Đại',
      code: 'LB - LOOK01',
      season: 'PHONG CÁCH THU ĐÔNG',
      badge: 'SIGNATURE',
      position: '1',
      product_count: 3,
      status: 'PUBLISHED',
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000',
      description: 'Cắt may thủ công từ 100% len lông cừu Merino pha Cashmere tự nhiên, cổ bẻ kinh điển cùng thắt lưng tôn dáng sang trọng.',
      price: '5.445.000₫',
      original_price: '6.050.000₫',
      cta_text: 'Mua Trọn Bộ Phối Đồ (Tiết Kiệm 10%) • 5.445.000₫',
      conversion_rate: '36%',
      products: [
        buildTaggedProduct('Áo Măng Tô Dạ Camel Cashmere'),
        buildTaggedProduct('Áo Len Cổ Lọ Cream Knitwear'),
        buildTaggedProduct('Quần Âu Ống Suông Wool Tencel'),
      ].filter(Boolean),
      hotspots: [
        { top: '38%', left: '46%', label: 'Áo Măng Tô Dạ Camel — 3.850.000₫' },
        { top: '82%', left: '54%', label: 'Bốt Da Nappa Cổ Điển — 2.100.000₫' },
      ],
    },
    {
      type: 'look',
      look_code: 'LOOK 02',
      section_role: 'Khối Look 02 (Đầm Dạ Tiệc & Haute Couture)',
      title: 'Đầm Xếp Ly Emerald Lộng Lẫy Tơ Tằm Cao Cấp',
      code: 'LB - LOOK02',
      season: 'DẠ TIỆC & HAUTE COUTURE',
      badge: 'PHIÊN BẢN GIỚI HẠN',
      position: '2',
      product_count: 1,
      status: 'PUBLISHED',
      image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000',
      description: 'Chất tơ tằm dệt ánh ngọc lục bảo rực rỡ, đường xếp ly accordion tỉ mỉ tạo độ xòe bồng bềnh tựa dải sóng khi chuyển động.',
      quote: 'Thiết kế được lựa chọn trình diễn tại Paris Fashion Week 2025, mang hơi thở quý phái vượt thời gian.',
      price: '2.950.000₫',
      stock_info: 'Chỉ còn 5 chiếc size S, M',
      cta_text: 'ĐẶT MUA NGAY',
      conversion_rate: '28%',
      products: [
        buildTaggedProduct('Đầm Lụa Emerald Pleated Gown'),
      ].filter(Boolean),
    },
    {
      type: 'look',
      look_code: 'LOOK 03',
      section_role: 'Khối Look 03 (Cột 1 Lưới: Set Parisian Chic)',
      title: 'Set Áo Tweed Ivory & Quần Âu Cắt May Cổ Điển',
      code: 'LB - LOOK03',
      season: 'PARISIAN CHIC',
      badge: 'BÁN CHẠY',
      position: '3',
      product_count: 2,
      status: 'PUBLISHED',
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800',
      description: 'Sự tương phản kinh điển giữa trắng kem ngà và đen tuyền, nút kim loại mạ vàng chạm khắc thủ công.',
      price: '3.040.000₫',
      cta_text: 'Mua Ngay',
      conversion_rate: '24%',
      products: [
        buildTaggedProduct('Áo Khoác Tweed Ivory Cropped'),
        buildTaggedProduct('Quần Tây Slim Fit Black'),
      ].filter(Boolean),
    },
    {
      type: 'look',
      look_code: 'LOOK 04',
      section_role: 'Khối Look 04 (Cột 2 Lưới: Modern Tailoring)',
      title: 'Oversized Charcoal Blazer & Minimalist Shirt',
      code: 'LB - LOOK04',
      season: 'MODERN TAILORING',
      badge: 'TRENDING',
      position: '4',
      product_count: 2,
      status: 'PUBLISHED',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
      description: 'Phong thái nữ quyền độc lập và tự do, phom dáng rộng thoải mái cùng đường may vai sắc nét chuẩn quý cô Paris.',
      price: '2.700.000₫',
      cta_text: 'Mua Ngay',
      conversion_rate: '21%',
      products: [
        buildTaggedProduct('Áo Blazer Kẻ Sọc Pinstripe'),
        buildTaggedProduct('Sơ Mi Poplin Cotton Trắng'),
      ].filter(Boolean),
    },
  ];

  try {
    for (const lb of lookbooksData) {
      const existing = await prisma.lookbook.findFirst({
        where: { code: lb.code },
      });
      if (!existing) {
        await prisma.lookbook.create({
          data: lb,
        });
        console.log(`  ➕ Đã thêm Lookbook: ${lb.title}`);
      } else {
        await prisma.lookbook.update({
          where: { lookbook_id: existing.lookbook_id },
          data: {
            products: lb.products,
            price: lb.price,
            product_count: lb.products?.length || lb.product_count,
            image: lb.image,
            description: lb.description,
            season: lb.season,
            badge: lb.badge,
          }
        });
        console.log(`  🔄 Đã cập nhật Lookbook & gắn tag CSDL: ${existing.title}`);
      }
    }
    console.log(`✅ Đã đồng bộ ${lookbooksData.length} lookbook với CSDL sản phẩm.`);
  } catch (err) {
    console.log('ℹ️ Lỗi khi cập nhật Lookbook:', err.message);
  }

  // 6. Seed Vouchers mẫu
  console.log('\n🎟️ --- Tạo Mã Giảm Giá (Vouchers) mẫu ---');
  const defaultVouchers = [
    {
      code: 'YOUTH-VIP10',
      name: 'Chiết khấu 10% Đặc Quyền VIP',
      discount_type: 'percent',
      discount_percent: 10,
      discount_amount: 0,
      min_order: 0,
      max_discount: 0,
      used_count: 142,
      total_limit: 500,
      end_date: new Date('2026-12-31T23:59:59Z'),
      category_limit: 'Áp dụng mọi đơn hàng',
      status: 'ACTIVE',
      badge_type: 'gold',
    },
    {
      code: 'ATELIER-500K',
      name: 'Giảm 500.000đ cho đơn từ 3.000.000đ',
      discount_type: 'fixed',
      discount_percent: 0,
      discount_amount: 500000,
      min_order: 3000000,
      max_discount: 500000,
      used_count: 88,
      total_limit: 300,
      end_date: new Date('2026-12-31T23:59:59Z'),
      category_limit: 'BST Fall/Winter Atelier mới nhất',
      status: 'ACTIVE',
      badge_type: 'dark',
    },
    {
      code: 'BDAY-2026',
      name: 'Quà Tặng Sinh Nhật 1.000.000đ',
      discount_type: 'fixed',
      discount_percent: 0,
      discount_amount: 1000000,
      min_order: 2000000,
      max_discount: 1000000,
      used_count: 35,
      total_limit: 100,
      end_date: new Date('2026-12-31T23:59:59Z'),
      category_limit: 'Áp dụng trong tháng sinh nhật',
      status: 'ACTIVE',
      badge_type: 'purple',
    },
    {
      code: 'FREESHIP-PREMIUM',
      name: 'Miễn Phí Vận Chuyển Hỏa Tốc',
      discount_type: 'shipping',
      discount_percent: 0,
      discount_amount: 50000,
      min_order: 0,
      max_discount: 50000,
      used_count: 290,
      total_limit: 1000,
      end_date: new Date('2026-12-31T23:59:59Z'),
      category_limit: 'Áp dụng toàn bộ đơn hàng',
      status: 'ACTIVE',
      badge_type: 'blue',
    },
  ];

  for (const v of defaultVouchers) {
    await prisma.voucher.upsert({
      where: { code: v.code },
      update: v,
      create: v,
    });
    console.log(`  🎟️ Đã đồng bộ Voucher: ${v.code} (${v.name})`);
  }
  console.log(`✅ Đã đồng bộ ${defaultVouchers.length} vouchers với CSDL.`);

  console.log('\n🎉 --- Hoàn thành Khởi tạo Dữ liệu Mẫu thành công! ---');
}


main()
  .catch((e) => {
    console.error('❌ Lỗi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

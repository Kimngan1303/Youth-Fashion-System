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
      phone: '0988777666',
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
      phone: '0999888777',
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
      product_name: 'Áo Thun Oversize Youth Graphic Cotton 100%',
      description: 'Áo thun chất liệu 100% Cotton định hình cao cấp, thoáng mát, in hình dạo phố sắc nét.',
      category_name: 'Áo thun',
      brand_name: 'YouthFashion Studio',
      images: [
        { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800', is_primary: true, alt: 'Áo thun oversize mặt trước' },
        { url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800', is_primary: false, alt: 'Áo thun oversize cận cảnh vải' },
      ],
      variants: [
        { sku: 'AT-YOUTH-01-S-DEN', size: 'S', color: 'Đen', price: 290000, stock: 50 },
        { sku: 'AT-YOUTH-01-M-DEN', size: 'M', color: 'Đen', price: 290000, stock: 45 },
        { sku: 'AT-YOUTH-01-L-DEN', size: 'L', color: 'Đen', price: 290000, stock: 30 },
        { sku: 'AT-YOUTH-01-M-TRANG', size: 'M', color: 'Trắng', price: 290000, stock: 60 },
      ],
    },
    {
      product_name: 'Áo Sơ Mi Oxford Form Rộng Minimalist',
      description: 'Áo sơ mi Oxford chuẩn phom, vải mềm mịn chống nhăn, phù hợp đi học đi làm.',
      category_name: 'Áo sơ mi',
      brand_name: 'Minimalist Line',
      images: [
        { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800', is_primary: true, alt: 'Áo sơ mi Oxford màu trắng' },
        { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800', is_primary: false, alt: 'Áo sơ mi Oxford xanh navy' },
      ],
      variants: [
        { sku: 'SM-OXFORD-02-M-TRANG', size: 'M', color: 'Trắng', price: 450000, stock: 30 },
        { sku: 'SM-OXFORD-02-L-TRANG', size: 'L', color: 'Trắng', price: 450000, stock: 25 },
        { sku: 'SM-OXFORD-02-M-NAVY', size: 'M', color: 'Xanh Navy', price: 450000, stock: 20 },
      ],
    },
    {
      product_name: 'Quần Jeans Straight Fit Dáng Suông Vintage',
      description: 'Quần jeans dáng suông phong cách Hàn Quốc, phom đứng hiện đại, vải denim cao cấp.',
      category_name: 'Quần Jeans',
      brand_name: 'Denim Crafter',
      images: [
        { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800', is_primary: true, alt: 'Quần jeans straight fit' },
        { url: 'https://images.unsplash.com/photo-1542272604-780c36856d61?w=800', is_primary: false, alt: 'Chi tiết túi quần jeans' },
      ],
      variants: [
        { sku: 'QJ-VINTAGE-03-29-XANH', size: '29', color: 'Xanh Nhạt', price: 590000, stock: 20 },
        { sku: 'QJ-VINTAGE-03-30-XANH', size: '30', color: 'Xanh Nhạt', price: 590000, stock: 35 },
        { sku: 'QJ-VINTAGE-03-31-XANH', size: '31', color: 'Xanh Nhạt', price: 590000, stock: 15 },
      ],
    },
    {
      product_name: 'Áo Hoodie Streetwear Zip Pocket Nỉ Thêu',
      description: 'Áo hoodie chất vải nỉ bông dày dặn, giữ ấm cực tốt, mũ trùm 2 lớp có dây rút.',
      category_name: 'Áo Hoodie & Sweater',
      brand_name: 'Urban Streetwear',
      images: [
        { url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800', is_primary: true, alt: 'Áo hoodie streetwear màu xám' },
        { url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800', is_primary: false, alt: 'Áo hoodie streetwear đen' },
      ],
      variants: [
        { sku: 'HD-STREET-04-M-XAM', size: 'M', color: 'Xám', price: 680000, stock: 25 },
        { sku: 'HD-STREET-04-L-XAM', size: 'L', color: 'Xám', price: 680000, stock: 30 },
        { sku: 'HD-STREET-04-L-DEN', size: 'L', color: 'Đen', price: 680000, stock: 40 },
      ],
    },
    {
      product_name: 'Áo Khoác Bomber Unisex Water-Resistant',
      description: 'Áo khoác bomber chất liệu dù 2 lớp chống nước nhẹ, thời trang cá tính.',
      category_name: 'Áo khoác & Jacket',
      brand_name: 'YouthFashion Studio',
      images: [
        { url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800', is_primary: true, alt: 'Áo khoác bomber mặt trước' },
      ],
      variants: [
        { sku: 'JK-BOMBER-05-M-DEN', size: 'M', color: 'Đen', price: 790000, stock: 20 },
        { sku: 'JK-BOMBER-05-L-DEN', size: 'L', color: 'Đen', price: 790000, stock: 15 },
      ],
    },
    {
      product_name: 'Áo Vest & Blazer European Fit Ca Rô',
      description: 'Áo blazer chuẩn phom phong cách Châu Âu, vải lót lụa mềm mịn sang trọng.',
      category_name: 'Áo Vest & Blazer',
      brand_name: 'Atelier Elegance',
      images: [
        { url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800', is_primary: true, alt: 'Áo blazer ca rô' },
        { url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800', is_primary: false, alt: 'Áo vest lịch lãm' },
      ],
      variants: [
        { sku: 'VZ-EURO-06-M-CARO', size: 'M', color: 'Ghi Ca Rô', price: 1850000, stock: 12 },
        { sku: 'VZ-EURO-06-L-CARO', size: 'L', color: 'Ghi Ca Rô', price: 1850000, stock: 10 },
      ],
    },
    {
      product_name: 'Váy Đầm Lụa Satin Cổ V Xếp Ly Sang Trọng',
      description: 'Váy đầm lụa cao cấp, đường may tinh xảo tôn vinh vóc dáng người mặc.',
      category_name: 'Váy & Đầm Thiết Kế',
      brand_name: 'Modern Luxe',
      images: [
        { url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800', is_primary: true, alt: 'Đầm lụa xếp ly' },
      ],
      variants: [
        { sku: 'VD-LUA-07-S-RED', size: 'S', color: 'Đỏ Rượu', price: 1450000, stock: 15 },
        { sku: 'VD-LUA-07-M-RED', size: 'M', color: 'Đỏ Rượu', price: 1450000, stock: 18 },
      ],
    },
    {
      product_name: 'Áo Măng Tô Dạ Tuyết Dáng Dài Thu Đông',
      description: 'Áo măng tô chất liệu dạ ép 2 lớp cực ấm, phom chuẩn Châu Âu quý phái.',
      category_name: 'Áo khoác & Jacket',
      brand_name: 'Heritage Vintage',
      images: [
        { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', is_primary: true, alt: 'Áo măng tô dạ' },
      ],
      variants: [
        { sku: 'MT-DA-08-M-BE', size: 'M', color: 'Beige', price: 2200000, stock: 8 },
        { sku: 'MT-DA-08-L-BE', size: 'L', color: 'Beige', price: 2200000, stock: 10 },
      ],
    },
    {
      product_name: 'Áo Polo Dệt Kim Co Giãn Thoáng Khí',
      description: 'Áo polo dệt kim mềm mại, cổ gập thanh lịch phù hợp mặc dạo phố hay chơi thể thao.',
      category_name: 'Áo Polo',
      brand_name: 'Casual Essentials',
      images: [
        { url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800', is_primary: true, alt: 'Áo polo dệt kim' },
      ],
      variants: [
        { sku: 'PL-DETKIM-09-M-RUE', size: 'M', color: 'Xanh Rêu', price: 390000, stock: 35 },
        { sku: 'PL-DETKIM-09-L-RUE', size: 'L', color: 'Xanh Rêu', price: 390000, stock: 30 },
      ],
    },
    {
      product_name: 'Quần Short Cargo Hàn Quốc Nhiều Túi',
      description: 'Quần short kiểu dáng cargo bụi bặm, vải khaki túi hộp tiện dụng cá tính.',
      category_name: 'Quần Short',
      brand_name: 'Urban Streetwear',
      images: [
        { url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800', is_primary: true, alt: 'Quần short cargo' },
      ],
      variants: [
        { sku: 'QS-CARGO-10-M-KHOAN', size: 'M', color: 'Vàng Cát', price: 350000, stock: 25 },
        { sku: 'QS-CARGO-10-L-KHOAN', size: 'L', color: 'Vàng Cát', price: 350000, stock: 20 },
      ],
    },
    {
      product_name: 'Quần Kaki Chino Form Slimfit Công Sở',
      description: 'Quần kaki chino phom ôm nhẹ tôn dáng, co giãn nhẹ giúp bạn thoải mái cả ngày.',
      category_name: 'Quần Kaki & Chino',
      brand_name: 'Minimalist Line',
      images: [
        { url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800', is_primary: true, alt: 'Quần kaki chino' },
      ],
      variants: [
        { sku: 'QK-CHINO-11-30-DEN', size: '30', color: 'Đen', price: 480000, stock: 40 },
        { sku: 'QK-CHINO-11-31-DEN', size: '31', color: 'Đen', price: 480000, stock: 30 },
      ],
    },
    {
      product_name: 'Quần Tây Trouser Xếp Ly Lưng Cao',
      description: 'Quần tây xếp ly cổ điển, chất vải tuýt si đứng phom chống nhăn cao cấp.',
      category_name: 'Quần Tây & Trouser',
      brand_name: 'Atelier Elegance',
      images: [
        { url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800', is_primary: true, alt: 'Quần tây trouser' },
      ],
      variants: [
        { sku: 'QT-TROUSER-12-M-XAM', size: 'M', color: 'Xám Ghi', price: 520000, stock: 22 },
        { sku: 'QT-TROUSER-12-L-XAM', size: 'L', color: 'Xám Ghi', price: 520000, stock: 18 },
      ],
    },
    {
      product_name: 'Quần Jogger Thể Thao Bo Gấu Năng Động',
      description: 'Quần jogger thun cotton 4 chiều mềm mại, thích hợp cho tập luyện và vận động.',
      category_name: 'Quần Jogger & Thể thao',
      brand_name: 'Sporty Activewear',
      images: [
        { url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800', is_primary: true, alt: 'Quần jogger thể thao' },
      ],
      variants: [
        { sku: 'QJ-JOGGER-13-M-DEN', size: 'M', color: 'Đen', price: 410000, stock: 50 },
        { sku: 'QJ-JOGGER-13-L-DEN', size: 'L', color: 'Đen', price: 410000, stock: 45 },
      ],
    },
    {
      product_name: 'Chân Váy Xếp Ly Dáng A Midi Công Sở',
      description: 'Chân váy Midi xếp ly dài thanh lịch, dễ dàng kết hợp với áo sơ mi hay áo thun.',
      category_name: 'Chân Váy',
      brand_name: 'Signature Atelier',
      images: [
        { url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800', is_primary: true, alt: 'Chân váy midi' },
      ],
      variants: [
        { sku: 'CV-MIDI-14-S-BE', size: 'S', color: 'Kem Be', price: 420000, stock: 20 },
        { sku: 'CV-MIDI-14-M-BE', size: 'M', color: 'Kem Be', price: 420000, stock: 25 },
      ],
    },
    {
      product_name: 'Áo Len Cổ Lọ Wool Mềm Mịn Thu Đông',
      description: 'Áo len cổ cao sợi Wool chọn lọc giữ ấm vượt trội, mặt vải mịn màng không gây ngứa.',
      category_name: 'Đồ Đông & Áo Len',
      brand_name: 'Nordic Pure',
      images: [
        { url: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800', is_primary: true, alt: 'Áo len cổ lọ' },
      ],
      variants: [
        { sku: 'AL-COLO-15-M-NAU', size: 'M', color: 'Nâu Đất', price: 650000, stock: 15 },
        { sku: 'AL-COLO-15-L-NAU', size: 'L', color: 'Nâu Đất', price: 650000, stock: 12 },
      ],
    },
    {
      product_name: 'Áo Thun Unisex Acid Wash Streetwear',
      description: 'Áo thun công nghệ nhuộm Acid Wash tạo hiệu ứng màu loang phá cách bụi bặm.',
      category_name: 'Áo thun',
      brand_name: 'Tokyo Underground',
      images: [
        { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800', is_primary: true, alt: 'Áo thun acid wash' },
      ],
      variants: [
        { sku: 'AT-ACID-16-M-XAM', size: 'M', color: 'Xám Loang', price: 320000, stock: 30 },
        { sku: 'AT-ACID-16-L-XAM', size: 'L', color: 'Xám Loang', price: 320000, stock: 28 },
      ],
    },
    {
      product_name: 'Áo Sơ Mi Linen Cổ Tàu Thoáng Mát',
      description: 'Áo sơ mi chất liệu 100% Linen tự nhiên, thiết kế cổ tàu hiện đại mộc mạc.',
      category_name: 'Áo sơ mi',
      brand_name: 'Eco Style Co.',
      images: [
        { url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800', is_primary: true, alt: 'Áo sơ mi linen cổ tàu' },
      ],
      variants: [
        { sku: 'SM-LINEN-17-M-TRANG', size: 'M', color: 'Trắng Ngà', price: 490000, stock: 20 },
        { sku: 'SM-LINEN-17-L-TRANG', size: 'L', color: 'Trắng Ngà', price: 490000, stock: 18 },
      ],
    },
    {
      product_name: 'Áo Sweater Nỉ Bông In Chữ Typography',
      description: 'Áo sweater cổ tròn vải nỉ chần bông êm ái, họa tiết in nổi thêu tinh tế.',
      category_name: 'Áo Hoodie & Sweater',
      brand_name: 'Street Vibe Couture',
      images: [
        { url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800', is_primary: true, alt: 'Áo sweater nỉ bông' },
      ],
      variants: [
        { sku: 'SW-TYPO-18-M-REU', size: 'M', color: 'Xanh Rêu', price: 550000, stock: 25 },
        { sku: 'SW-TYPO-18-L-REU', size: 'L', color: 'Xanh Rêu', price: 550000, stock: 22 },
      ],
    },
    {
      product_name: 'Balo Canvas Vintage Chống Nước Chứa Laptop',
      description: 'Balo bằng chất liệu vải Canvas cao cấp kết hợp chi tiết da thật, chống thấm nước tốt.',
      category_name: 'Túi Xách & Balo',
      brand_name: 'Heritage Vintage',
      images: [
        { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', is_primary: true, alt: 'Balo canvas vintage' },
      ],
      variants: [
        { sku: 'BL-CANVAS-19-FREE-BO', size: 'FreeSize', color: 'Nâu Bò', price: 620000, stock: 15 },
      ],
    },
    {
      product_name: 'Túi Xách Da Pu Thêu Họa Tiết Cao Cấp',
      description: 'Túi xách tay da cao cấp mềm mịn, thiết kế phom dáng vuông vắn tinh tế.',
      category_name: 'Túi Xách & Balo',
      brand_name: 'Modern Luxe',
      images: [
        { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800', is_primary: true, alt: 'Túi xách da' },
      ],
      variants: [
        { sku: 'TX-DA-20-FREE-DEN', size: 'FreeSize', color: 'Đen Tuyển', price: 890000, stock: 10 },
      ],
    },
    {
      product_name: 'Giày Sneaker Retro Leather Phối Màu',
      description: 'Giày thể thao da tự nhiên phối màu cổ điển retro, đế cao su chống trơn trượt.',
      category_name: 'Giày & Sandal',
      brand_name: 'Sporty Activewear',
      images: [
        { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800', is_primary: true, alt: 'Giày sneaker retro' },
      ],
      variants: [
        { sku: 'SN-RETRO-21-40-TRANG', size: '40', color: 'Trắng Phối Đỏ', price: 1150000, stock: 14 },
        { sku: 'SN-RETRO-21-41-TRANG', size: '41', color: 'Trắng Phối Đỏ', price: 1150000, stock: 12 },
      ],
    },
    {
      product_name: 'Sandal Da Quai Ngang Đế Trấu Tự Nhiên',
      description: 'Dép sandal thiết kế quai da thật đế gỗ trấu tự nhiên ôm chân thông thoáng.',
      category_name: 'Giày & Sandal',
      brand_name: 'Eco Style Co.',
      images: [
        { url: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800', is_primary: true, alt: 'Sandal đế trấu' },
      ],
      variants: [
        { sku: 'SD-TRAU-22-39-NAU', size: '39', color: 'Nâu Da', price: 580000, stock: 20 },
        { sku: 'SD-TRAU-22-40-NAU', size: '40', color: 'Nâu Da', price: 580000, stock: 18 },
      ],
    },
    {
      product_name: 'Mũ Beanie Dệt Kim Phong Cách Minimalist',
      description: 'Nón len beanie giữ ấm tai mùa lạnh, vải dệt kim mềm mịn co giãn tốt.',
      category_name: 'Mũ & Nón Thời Trang',
      brand_name: 'Minimalist Line',
      images: [
        { url: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800', is_primary: true, alt: 'Mũ beanie len' },
      ],
      variants: [
        { sku: 'MB-LEN-23-FREE-DEN', size: 'FreeSize', color: 'Đen', price: 190000, stock: 50 },
      ],
    },
    {
      product_name: 'Mũ Cap Lưỡi Trai Thêu Logo Vintage',
      description: 'Nón lưỡi trai phom unisex chuẩn đẹp, nấc cài kim loại chỉnh size linh hoạt.',
      category_name: 'Mũ & Nón Thời Trang',
      brand_name: 'Urban Streetwear',
      images: [
        { url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800', is_primary: true, alt: 'Mũ lưỡi trai vintage' },
      ],
      variants: [
        { sku: 'MC-VINTAGE-24-FREE-NAVY', size: 'FreeSize', color: 'Xanh Navy', price: 220000, stock: 40 },
      ],
    },
    {
      product_name: 'Thắt Lưng Da Bò Thật Khóa Kim Tinh Tế',
      description: 'Thắt lưng da nguyên tấm bền đẹp theo thời gian, đầu khóa hợp kim không gỉ.',
      category_name: 'Thắt Lưng & Ví Da',
      brand_name: 'Signature Atelier',
      images: [
        { url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800', is_primary: true, alt: 'Thắt lưng da bò' },
      ],
      variants: [
        { sku: 'TL-DABO-25-FREE-DEN', size: 'FreeSize', color: 'Đen', price: 380000, stock: 30 },
      ],
    },
    {
      product_name: 'Kính Mát Chống Tia UV Gọng Kim Loại',
      description: 'Kính mát chống lóa mắt chống tia UV400, gọng kim loại mạ titan siêu nhẹ.',
      category_name: 'Kính Mát Thời Trang',
      brand_name: 'Modern Luxe',
      images: [
        { url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800', is_primary: true, alt: 'Kính mát gọng titan' },
      ],
      variants: [
        { sku: 'KM-TITAN-26-FREE-VANG', size: 'FreeSize', color: 'Gọng Vàng Tráng Gương', price: 450000, stock: 25 },
      ],
    },
    {
      product_name: 'Khăn Quàng Len Cashmere Ấm Áp Mùa Đông',
      description: 'Khăn quàng cổ chất liệu Cashmere siêu nhẹ giữ nhiệt tối đa, phối tua rua duyên dáng.',
      category_name: 'Khăn Quàng & Phụ Kiện',
      brand_name: 'Nordic Pure',
      images: [
        { url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800', is_primary: true, alt: 'Khăn quàng cashmere' },
      ],
      variants: [
        { sku: 'KQ-CASHMERE-27-FREE-XAM', size: 'FreeSize', color: 'Xám Ghi', price: 340000, stock: 30 },
      ],
    },
    {
      product_name: 'Bộ Đồ Tập Gym Yoga Co Giãn 4 Chiều',
      description: 'Set trang phục thể thao bao gồm áo bra định hình và quần legging cạp cao tôn dáng.',
      category_name: 'Bộ Đồ Thể Thao',
      brand_name: 'Sporty Activewear',
      images: [
        { url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800', is_primary: true, alt: 'Bộ đồ tập gym yoga' },
      ],
      variants: [
        { sku: 'BD-GYM-28-S-HONG', size: 'S', color: 'Hồng Đất', price: 690000, stock: 20 },
        { sku: 'BD-GYM-28-M-HONG', size: 'M', color: 'Hồng Đất', price: 690000, stock: 18 },
      ],
    },
    {
      product_name: 'Bộ Đồ Mặc Nhà Silk Pyjama Cao Cấp',
      description: 'Bộ lụa mặc nhà tay dài quần dài, chất lụa lướt trên da mềm mịn quý phái.',
      category_name: 'Đồ Lót & Đồ Mặc Nhà',
      brand_name: 'Atelier Elegance',
      images: [
        { url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800', is_primary: true, alt: 'Bộ lụa pyjama' },
      ],
      variants: [
        { sku: 'PJ-SILK-29-M-XANH', size: 'M', color: 'Xanh Ngọc', price: 750000, stock: 15 },
        { sku: 'PJ-SILK-29-L-XANH', size: 'L', color: 'Xanh Ngọc', price: 750000, stock: 12 },
      ],
    },
    {
      product_name: 'Áo Khoác Denim Vintage Oversize Unisex',
      description: 'Áo khoác chất denim xắt dày dặn, xử lý wash mài retro cá tính mạnh mẽ.',
      category_name: 'Áo khoác & Jacket',
      brand_name: 'Denim Crafter',
      images: [
        { url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800', is_primary: true, alt: 'Áo khoác denim' },
      ],
      variants: [
        { sku: 'JK-DENIM-30-M-XANHDAM', size: 'M', color: 'Xanh Đậm Wash', price: 820000, stock: 20 },
        { sku: 'JK-DENIM-30-L-XANHDAM', size: 'L', color: 'Xanh Đậm Wash', price: 820000, stock: 15 },
      ],
    },
    {
      product_name: 'Đầm Dạ Hội Cổ Lệch Đính Đá Điệu Đà',
      description: 'Đầm dạ hội đuôi cá quyến rũ, chất đính đá may tay công phu cho các buổi tiệc đêm.',
      category_name: 'Trang Phục Dạ Hội',
      brand_name: 'Atelier Elegance',
      images: [
        { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', is_primary: true, alt: 'Đầm dạ hội đính đá' },
      ],
      variants: [
        { sku: 'DH-DINHDA-31-S-DEN', size: 'S', color: 'Đen Huyền Bí', price: 2800000, stock: 5 },
        { sku: 'DH-DINHDA-31-M-DEN', size: 'M', color: 'Đen Huyền Bí', price: 2800000, stock: 7 },
      ],
    },
    {
      product_name: 'Áo Bơi Bikini 2 Mảnh Mùa Hè Rực Rỡ',
      description: 'Bộ đồ bơi 2 mảnh chất thun bơi chống tia UV, mau khô, sắc màu hè nhiệt đới.',
      category_name: 'Đồ Bơi & Mùa Hè',
      brand_name: 'YouthFashion Studio',
      images: [
        { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', is_primary: true, alt: 'Bộ bơi bikini' },
      ],
      variants: [
        { sku: 'BK-SUMMER-32-S-VANG', size: 'S', color: 'Vàng Rực Rỡ', price: 490000, stock: 15 },
        { sku: 'BK-SUMMER-32-M-VANG', size: 'M', color: 'Vàng Rực Rỡ', price: 490000, stock: 20 },
      ],
    },
    {
      product_name: 'Áo sơ mi Flannel Kẻ Caro Phong Cách Grunge',
      description: 'Áo sơ mi dạ flannel kẻ ô caro cá tính, khoác ngoài hay mặc đơn đều đẹp.',
      category_name: 'Áo sơ mi',
      brand_name: 'Urban Streetwear',
      images: [
        { url: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800', is_primary: true, alt: 'Áo sơ mi flannel' },
      ],
      variants: [
        { sku: 'SM-FLANNEL-33-M-DO', size: 'M', color: 'Đen Đỏ Caro', price: 460000, stock: 25 },
        { sku: 'SM-FLANNEL-33-L-DO', size: 'L', color: 'Đen Đỏ Caro', price: 460000, stock: 30 },
      ],
    },
    {
      product_name: 'Quần Jeans Rách Gối Korean Street Style',
      description: 'Quần denim may phom cạp cao phá cách rách gối nhẹ bụi bặm cá tính.',
      category_name: 'Quần Jeans',
      brand_name: 'Tokyo Underground',
      images: [
        { url: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800', is_primary: true, alt: 'Quần jeans rách gối' },
      ],
      variants: [
        { sku: 'QJ-KOREAN-34-29-XANH', size: '29', color: 'Xanh Phấn', price: 560000, stock: 18 },
        { sku: 'QJ-KOREAN-34-30-XANH', size: '30', color: 'Xanh Phấn', price: 560000, stock: 22 },
      ],
    },
    {
      product_name: 'Áo Gilet Vest Không Tay Phong Cách Preppy',
      description: 'Áo gilet khoác ngoài sơ mi mang đến diện mạo tri thức, trẻ trung cuốn hút.',
      category_name: 'Áo Vest & Blazer',
      brand_name: 'Minimalist Line',
      images: [
        { url: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=800', is_primary: true, alt: 'Áo gilet vest' },
      ],
      variants: [
        { sku: 'GL-PREPPY-35-M-KEM', size: 'M', color: 'Kem Sữa', price: 430000, stock: 20 },
        { sku: 'GL-PREPPY-35-L-KEM', size: 'L', color: 'Kem Sữa', price: 430000, stock: 15 },
      ],
    },
    {
      product_name: 'Áo Thun Ba Lỗ Ribbed Tank Top Ôm Dáng',
      description: 'Áo thun gân gân ôm nhẹ đường nét cơ thể, thấm hút mồ hôi cực tốt.',
      category_name: 'Áo thun',
      brand_name: 'Casual Essentials',
      images: [
        { url: 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?w=800', is_primary: true, alt: 'Áo thun ba lỗ' },
      ],
      variants: [
        { sku: 'AT-TANK-36-M-TRANG', size: 'M', color: 'Trắng', price: 180000, stock: 60 },
        { sku: 'AT-TANK-36-L-TRANG', size: 'L', color: 'Trắng', price: 180000, stock: 50 },
      ],
    },
  ];

  for (const item of productsData) {
    const category = categories[item.category_name];
    const brand = brands[item.brand_name];

    if (!category || !brand) {
      console.warn(`⚠️ Không tìm thấy danh mục [${item.category_name}] hoặc thương hiệu [${item.brand_name}]`);
      continue;
    }

    const existingProduct = await prisma.product.findFirst({
      where: { product_name: item.product_name },
    });

    if (!existingProduct) {
      const createdProd = await prisma.product.create({
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
      });
      console.log(`  ➕ Đã thêm sản phẩm: ${createdProd.product_name}`);
    } else {
      console.log(`  ℹ️ Sản phẩm đã tồn tại: ${existingProduct.product_name}`);
    }
  }

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

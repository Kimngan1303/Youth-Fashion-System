import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 --- Đang khởi tạo dữ liệu mẫu (Seed Data) cho YouthFashion ---');

  const defaultPassword = '123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 1. Tạo tài khoản Manager & Admin
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

  // 2. Seed Categories (Danh mục sản phẩm)
  console.log('\n📂 --- Tạo Danh mục sản phẩm ---');
  const categoriesData = [
    { category_name: 'Áo thun', description: 'Áo thun phong cách trẻ trung, thoáng mát, chất liệu 100% cotton', status: 'ACTIVE' },
    { category_name: 'Áo sơ mi', description: 'Áo sơ mi thanh lịch, hiện đại dành cho công sở và dạo phố', status: 'ACTIVE' },
    { category_name: 'Quần Jeans', description: 'Quần jeans chất liệu bền đẹp, chuẩn phom dáng', status: 'ACTIVE' },
    { category_name: 'Áo Hoodie & Sweater', description: 'Áo hoodie ấm áp, phong cách streetwear năng động', status: 'ACTIVE' },
    { category_name: 'Áo khoác', description: 'Áo khoác thời trang chống nắng, giữ ấm chống nước nhẹ', status: 'ACTIVE' },
    { category_name: 'Váy Thiết Kế & Dạ Hội', description: 'Váy đầm thiết kế độc quyền tôn dáng thanh lịch', status: 'ACTIVE' },
    { category_name: 'Áo Vest & Blazer Atelier', description: 'Áo vest và blazer thời thượng chuẩn phom phong cách Châu Âu', status: 'ACTIVE' },
    { category_name: 'Bộ Sưu Tập Mùa Hè', description: 'Trang phục mùa hè rực rỡ (Tạm ẩn lưu trữ nội bộ)', status: 'INACTIVE' },
    { category_name: 'Phụ Kiện Thời Trang', description: 'Mũ, túi xách, khăn quàng và phụ kiện phối đồ thời thượng', status: 'ACTIVE' },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { category_name: cat.category_name },
      update: {},
      create: cat,
    });
    categories[cat.category_name] = created;
  }
  console.log(`✅ Đã tạo ${Object.keys(categories).length} danh mục.`);

  // 3. Seed Brands (Thương hiệu)
  console.log('\n🏷️ --- Tạo Thương hiệu ---');
  const brandsData = [
    { brand_name: 'YouthFashion Studio', description: 'Thương hiệu thời trang giới trẻ hàng đầu, phong cách hiện đại độc quyền', status: 'ACTIVE' },
    { brand_name: 'Urban Streetwear', description: 'Thời trang dạo phố cá tính, trẻ trung và cá tính tự do', status: 'ACTIVE' },
    { brand_name: 'Minimalist Line', description: 'Phong cách thiết kế tối giản, tinh tế từng đường kim mũi chỉ', status: 'ACTIVE' },
    { brand_name: 'Atelier Elegance', description: 'Dòng sản phẩm cao cấp, trang phục dạ hội và blazer sang trọng', status: 'ACTIVE' },
    { brand_name: 'Denim Crafter', description: 'Chuyên các dòng sản phẩm chất liệu Denim & Jeans siêu bền chuẩn phom', status: 'ACTIVE' },
    { brand_name: 'Eco Style', description: 'Thương hiệu thời trang bền vững từ chất liệu hữu cơ bảo vệ môi trường', status: 'ACTIVE' },
    { brand_name: 'Vintage Retro Co.', description: 'Bộ sưu tập phong cách cổ điển thập niên 90s (Tạm ẩn)', status: 'INACTIVE' },
    { brand_name: 'Sporty Active', description: 'Trang phục thể thao năng động và phụ kiện tập luyện thời thượng', status: 'ACTIVE' },
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

  // 4. Seed Products cùng Variants và Images
  console.log('\n👕 --- Tạo Sản phẩm, Biến thể & Hình ảnh mẫu ---');

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
        { sku: 'AT-YOUTH-01-S-DEN', size: 'S', color: 'Đen', price: 250000, stock: 50 },
        { sku: 'AT-YOUTH-01-M-DEN', size: 'M', color: 'Đen', price: 250000, stock: 45 },
        { sku: 'AT-YOUTH-01-L-DEN', size: 'L', color: 'Đen', price: 250000, stock: 30 },
        { sku: 'AT-YOUTH-01-M-TRANG', size: 'M', color: 'Trắng', price: 250000, stock: 60 },
        { sku: 'AT-YOUTH-01-L-TRANG', size: 'L', color: 'Trắng', price: 250000, stock: 40 },
      ],
    },
    {
      product_name: 'Áo Sơ Mi Oxford Form Rộng Minimalist',
      description: 'Áo sơ miOxford chuẩn phom, vải mềm mịn chống nhăn, phù hợp đi học đi làm.',
      category_name: 'Áo sơ mi',
      brand_name: 'Minimalist Line',
      images: [
        { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800', is_primary: true, alt: 'Áo sơ mi Oxford màu trắng' },
        { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800', is_primary: false, alt: 'Áo sơ mi Oxford xanh navy' },
      ],
      variants: [
        { sku: 'SM-OXFORD-M-TRANG', size: 'M', color: 'Trắng', price: 350000, stock: 30 },
        { sku: 'SM-OXFORD-L-TRANG', size: 'L', color: 'Trắng', price: 350000, stock: 25 },
        { sku: 'SM-OXFORD-M-NAVY', size: 'M', color: 'Xanh Navy', price: 350000, stock: 20 },
      ],
    },
    {
      product_name: 'Quần Jeans Straight Fit Dáng Suông Vintage',
      description: 'Quần jeans dáng suông phong cách Hàn Quốc, phom đứng hiện đại, vải denim cao cấp.',
      category_name: 'Quần Jeans',
      brand_name: 'Urban Streetwear',
      images: [
        { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800', is_primary: true, alt: 'Quần jeans straight fit' },
        { url: 'https://images.unsplash.com/photo-1542272604-780c36856d61?w=800', is_primary: false, alt: 'Chi tiết túi quần jeans' },
      ],
      variants: [
        { sku: 'QJ-VINTAGE-29-XANH', size: '29', color: 'Xanh Nhạt', price: 420000, stock: 20 },
        { sku: 'QJ-VINTAGE-30-XANH', size: '30', color: 'Xanh Nhạt', price: 420000, stock: 35 },
        { sku: 'QJ-VINTAGE-31-XANH', size: '31', color: 'Xanh Nhạt', price: 420000, stock: 15 },
      ],
    },
    {
      product_name: 'Áo Hoodie Streetwear Zip Pocket Nỉ Thêu Logo',
      description: 'Áo hoodie chất vải nỉ bông dày dặn, giữ ấm cực tốt, mũ trùm 2 lớp có dây rút.',
      category_name: 'Áo Hoodie & Sweater',
      brand_name: 'Urban Streetwear',
      images: [
        { url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800', is_primary: true, alt: 'Áo hoodie streetwear màu xám' },
        { url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800', is_primary: false, alt: 'Áo hoodie streetwear đen' },
      ],
      variants: [
        { sku: 'HD-STREET-M-XAM', size: 'M', color: 'Xám', price: 490000, stock: 25 },
        { sku: 'HD-STREET-L-XAM', size: 'L', color: 'Xám', price: 490000, stock: 30 },
        { sku: 'HD-STREET-L-DEN', size: 'L', color: 'Đen', price: 490000, stock: 40 },
      ],
    },
    {
      product_name: 'Áo Khoác Bomber Unisex Water-Resistant',
      description: 'Áo khoác bomber chất liệu dù 2 lớp chống nước nhẹ, thời trang cá tính.',
      category_name: 'Áo khoác',
      brand_name: 'YouthFashion Studio',
      images: [
        { url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800', is_primary: true, alt: 'Áo khoác bomber mặt trước' },
      ],
      variants: [
        { sku: 'JK-BOMBER-M-DEN', size: 'M', color: 'Đen', price: 550000, stock: 20 },
        { sku: 'JK-BOMBER-L-DEN', size: 'L', color: 'Đen', price: 550000, stock: 15 },
      ],
    },
  ];

  for (const item of productsData) {
    const category = categories[item.category_name];
    const brand = brands[item.brand_name];

    // Tạo hoặc cập nhật Product theo tên
    const existingProduct = await prisma.product.findFirst({
      where: { product_name: item.product_name },
    });

    let product;
    if (!existingProduct) {
      product = await prisma.product.create({
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
      console.log(`  ➕ Đã thêm sản phẩm: ${product.product_name}`);
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


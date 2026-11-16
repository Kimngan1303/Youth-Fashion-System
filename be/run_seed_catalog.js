import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { productsCatalog as part1 } from './seed_new_products_part1.js';
import { productsCatalogPart2 as part2 } from './seed_new_products_part2.js';
import { productsCatalogPart3 as part3 } from './seed_new_products_part3.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 --- BẮT ĐẦU NẠP 182 SẢN PHẨM MẪU CHUẨN ĐẸP CHO 26 DANH MỤC ---');

  const allProducts = [...part1, ...part2, ...part3];
  console.log(`📦 Tổng số sản phẩm cần nạp: ${allProducts.length}`);

  // 1. Kiểm tra danh mục trong DB
  const categoriesInDb = await prisma.category.findMany();
  const categoryMap = {};
  categoriesInDb.forEach(c => {
    categoryMap[c.category_name] = c;
  });

  // 2. Kiểm tra thương hiệu trong DB
  const brandsInDb = await prisma.brand.findMany();
  const brandMap = {};
  brandsInDb.forEach(b => {
    brandMap[b.brand_name] = b;
  });

  // Kiểm tra tính hợp lệ trước khi nạp
  const missingCategories = new Set();
  const missingBrands = new Set();
  const byCategoryCount = {};

  for (const p of allProducts) {
    if (!categoryMap[p.category_name]) {
      missingCategories.add(p.category_name);
    }
    if (!brandMap[p.brand_name]) {
      missingBrands.add(p.brand_name);
    }
    byCategoryCount[p.category_name] = (byCategoryCount[p.category_name] || 0) + 1;
  }

  if (missingCategories.size > 0) {
    console.error('❌ Các danh mục chưa có trong DB:', Array.from(missingCategories));
    process.exit(1);
  }
  if (missingBrands.size > 0) {
    console.error('❌ Các thương hiệu chưa có trong DB:', Array.from(missingBrands));
    process.exit(1);
  }

  console.log(`✅ Toàn bộ 26 danh mục đều hợp lệ. Mỗi danh mục gồm:`);
  Object.entries(byCategoryCount).forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count} sản phẩm`);
  });

  // 3. Tiến hành thêm sản phẩm vào Database
  console.log('\n🔄 Đang lưu sản phẩm, biến thể và hình ảnh vào MySQL...');
  let addedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < allProducts.length; i++) {
    const item = allProducts[i];
    const category = categoryMap[item.category_name];
    const brand = brandMap[item.brand_name];

    // Kiểm tra xem sản phẩm đã tồn tại theo tên chưa
    const existing = await prisma.product.findFirst({
      where: { product_name: item.product_name }
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    // Tạo sản phẩm mới kèm hình ảnh và biến thể
    await prisma.product.create({
      data: {
        product_name: item.product_name,
        description: item.description,
        category_id: category.category_id,
        brand_id: brand.brand_id,
        status: 'ACTIVE',
        images: {
          create: item.images.map((img, idx) => ({
            image_url: img.url,
            alt_text: img.alt || item.product_name,
            is_primary: img.is_primary ?? (idx === 0),
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
      }
    });

    addedCount++;
    if (addedCount % 10 === 0 || i === allProducts.length - 1) {
      process.stdout.write(`Đã thêm: ${addedCount}/${allProducts.length} sản phẩm...\r`);
    }
  }

  console.log(`\n\n🎉 KẾT QUẢ THÀNH CÔNG:`);
  console.log(`- Đã thêm mới: ${addedCount} sản phẩm.`);
  console.log(`- Đã có sẵn trước đó: ${skippedCount} sản phẩm.`);

  // 4. Thống kê tổng số lượng sản phẩm theo từng danh mục sau khi nạp
  const finalCats = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { category_name: 'asc' }
  });

  console.log('\n📊 THỐNG KÊ SỐ LƯỢNG SẢN PHẨM MỖI DANH MỤC SAU KHI THÊM:');
  finalCats.forEach(c => {
    console.log(`- ${c.category_name}: ${c._count.products} sản phẩm`);
  });

  const totalProds = await prisma.product.count();
  console.log(`\n🔥 TỔNG SỐ LƯỢNG SẢN PHẨM TOÀN BỘ WEBSITE: ${totalProds}`);
}

main()
  .catch((e) => {
    console.error('Lỗi nạp sản phẩm:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


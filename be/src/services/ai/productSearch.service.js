import { prisma } from '../../repositories/prisma.js';

/**
 * Lấy danh sách toàn bộ sản phẩm từ MySQL để phục vụ việc đánh chỉ mục AI (Vector Indexing)
 * Bao gồm: ID, Tên, Mô tả, Danh mục, Thương hiệu, Màu sắc từ variants, và URL ảnh chính
 */
export async function getProductsForIndexing() {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      category: {
        select: { category_name: true },
      },
      brand: {
        select: { brand_name: true },
      },
      images: {
        orderBy: [{ is_primary: 'desc' }, { display_order: 'asc' }],
        take: 1, // Lấy ảnh chính đại diện
      },
      variants: {
        select: {
          color: true,
          price: true,
          stock: true,
        },
      },
    },
  });

  return products.map((p) => {
    // Thu thập các màu sắc không trùng lặp
    const uniqueColors = [...new Set(p.variants.map((v) => v.color).filter(Boolean))];
    // Tìm giá nhỏ nhất
    const prices = p.variants.map((v) => Number(v.price)).filter((price) => !isNaN(price));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    // URL ảnh đại diện
    const primaryImage = p.images && p.images.length > 0 ? p.images[0].image_url : null;
    const primaryImageId = p.images && p.images.length > 0 ? p.images[0].image_id : null;

    return {
      product_id: String(p.product_id),
      product_name: p.product_name,
      description: p.description || '',
      category_name: p.category?.category_name || 'Thời trang',
      brand_name: p.brand?.brand_name || 'YouthFashion',
      colors: uniqueColors,
      price: minPrice,
      image_id: primaryImageId ? String(primaryImageId) : null,
      image_url: primaryImage,
      updated_at: p.updated_at.toISOString(),
    };
  });
}

/**
 * Lấy thông tin chi tiết các sản phẩm theo mảng ID
 * @param {string[]} productIds - Mảng ID sản phẩm
 */
export async function getProductsByIds(productIds) {
  if (!productIds || productIds.length === 0) return [];

  const bigIntIds = productIds.map((id) => BigInt(id));

  const products = await prisma.product.findMany({
    where: {
      product_id: { in: bigIntIds },
      status: 'ACTIVE',
    },
    include: {
      category: true,
      brand: true,
      images: {
        orderBy: [{ is_primary: 'desc' }, { display_order: 'asc' }],
      },
      variants: true,
    },
  });

  return products.map((p) => {
    const prices = p.variants.map((v) => Number(v.price)).filter((price) => !isNaN(price));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

    return {
      product_id: String(p.product_id),
      product_name: p.product_name,
      description: p.description,
      category_name: p.category?.category_name,
      brand_name: p.brand?.brand_name,
      price: minPrice,
      image_url: p.images?.[0]?.image_url || null,
      images: p.images.map((img) => ({
        image_id: String(img.image_id),
        image_url: img.image_url,
        is_primary: img.is_primary,
      })),
      variants: p.variants.map((v) => ({
        variant_id: String(v.variant_id),
        size: v.size,
        color: v.color,
        price: Number(v.price),
        stock: v.stock,
      })),
    };
  });
}


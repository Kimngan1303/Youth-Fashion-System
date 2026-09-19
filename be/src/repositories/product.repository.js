import { prisma } from './prisma.js';

/**
 * Repository layer xử lý các câu lệnh CSDL Prisma cho sản phẩm, biến thể và hình ảnh
 */

/**
 * Tìm danh sách sản phẩm có phân trang, lọc theo danh mục, tìm kiếm theo tên
 */
export const findProducts = async ({ page = 1, limit = 10, category_id, brand_id, search_name, status }) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (category_id) {
    where.category_id = BigInt(category_id);
  }

  if (brand_id) {
    where.brand_id = BigInt(brand_id);
  }

  if (search_name) {
    where.product_name = {
      contains: search_name,
    };
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: { display_order: 'asc' },
        },
        variants: {
          orderBy: { variant_id: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total };
};

/**
 * Tìm sản phẩm theo ID kèm đầy đủ biến thể và hình ảnh
 */
export const findProductById = async (product_id) => {
  return await prisma.product.findUnique({
    where: { product_id: BigInt(product_id) },
    include: {
      category: true,
      brand: true,
      images: {
        orderBy: { display_order: 'asc' },
      },
      variants: {
        orderBy: { variant_id: 'asc' },
      },
    },
  });
};

/**
 * Tạo sản phẩm mới kèm danh sách biến thể và hình ảnh trong 1 Transaction
 */
export const createProduct = async ({ product_name, description, category_id, brand_id, status = 'ACTIVE', variants = [], images = [] }) => {
  return await prisma.product.create({
    data: {
      product_name,
      description,
      category_id: BigInt(category_id),
      brand_id: BigInt(brand_id),
      status,
      variants: {
        create: variants.map((v) => ({
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          stock: Number(v.stock),
          status: v.status || 'ACTIVE',
        })),
      },
      images: {
        create: images.map((img, idx) => ({
          image_url: img.image_url,
          alt_text: img.alt_text || product_name,
          is_primary: img.is_primary ?? idx === 0,
          display_order: img.display_order ?? idx + 1,
        })),
      },
    },
    include: {
      category: true,
      brand: true,
      images: true,
      variants: true,
    },
  });
};

/**
 * Cập nhật sản phẩm
 */
export const updateProduct = async (product_id, { product_name, description, category_id, brand_id, status, variants }) => {
  const updateData = {};
  if (product_name !== undefined) updateData.product_name = product_name;
  if (description !== undefined) updateData.description = description;
  if (category_id !== undefined) updateData.category_id = BigInt(category_id);
  if (brand_id !== undefined) updateData.brand_id = BigInt(brand_id);
  if (status !== undefined) updateData.status = status;

  return await prisma.$transaction(async (tx) => {
    // 1. Cập nhật thông tin chính sản phẩm
    const product = await tx.product.update({
      where: { product_id: BigInt(product_id) },
      data: updateData,
    });

    // 2. Nếu có danh sách biến thể mới truyền lên
    if (variants && Array.isArray(variants)) {
      for (const v of variants) {
        if (v.variant_id) {
          // Update biến thể đã có
          await tx.productVariant.update({
            where: { variant_id: BigInt(v.variant_id) },
            data: {
              sku: v.sku,
              size: v.size,
              color: v.color,
              price: v.price,
              stock: Number(v.stock),
              status: v.status || 'ACTIVE',
            },
          });
        } else {
          // Tạo biến thể mới
          await tx.productVariant.create({
            data: {
              product_id: BigInt(product_id),
              sku: v.sku,
              size: v.size,
              color: v.color,
              price: v.price,
              stock: Number(v.stock),
              status: v.status || 'ACTIVE',
            },
          });
        }
      }
    }

    return await tx.product.findUnique({
      where: { product_id: BigInt(product_id) },
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
      },
    });
  });
};

/**
 * Xóa sản phẩm theo ID (Tự động xóa variants và images liên quan nhờ Cascade)
 */
export const deleteProduct = async (product_id) => {
  return await prisma.product.delete({
    where: { product_id: BigInt(product_id) },
  });
};

/**
 * Thêm 1 hình ảnh mới cho sản phẩm
 */
export const addProductImage = async (product_id, { image_url, alt_text, is_primary = false, display_order = 0 }) => {
  return await prisma.$transaction(async (tx) => {
    if (is_primary) {
      // Đặt tất cả ảnh hiện tại của sản phẩm này thành is_primary = false
      await tx.productImage.updateMany({
        where: { product_id: BigInt(product_id) },
        data: { is_primary: false },
      });
    }

    return await tx.productImage.create({
      data: {
        product_id: BigInt(product_id),
        image_url,
        alt_text: alt_text || null,
        is_primary,
        display_order: Number(display_order),
      },
    });
  });
};

/**
 * Xóa hình ảnh của sản phẩm theo image_id
 */
export const deleteProductImage = async (image_id) => {
  return await prisma.productImage.delete({
    where: { image_id: BigInt(image_id) },
  });
};

/**
 * Đặt một hình ảnh làm ảnh chính (Primary Image) cho sản phẩm
 */
export const setPrimaryProductImage = async (product_id, image_id) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Chuyển tất cả ảnh của sản phẩm này thành is_primary = false
    await tx.productImage.updateMany({
      where: { product_id: BigInt(product_id) },
      data: { is_primary: false },
    });

    // 2. Chuyển ảnh được chọn thành is_primary = true
    return await tx.productImage.update({
      where: { image_id: BigInt(image_id) },
      data: { is_primary: true },
    });
  });
};

/**
 * Lấy tất cả danh mục sản phẩm (Categories)
 */
export const findAllCategories = async () => {
  return await prisma.category.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { category_name: 'asc' },
  });
};

/**
 * Lấy tất cả thương hiệu (Brands)
 */
export const findAllBrands = async () => {
  return await prisma.brand.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { brand_name: 'asc' },
  });
};

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lấy danh sách danh mục kèm số lượng sản phẩm liên quan
 */
export const findCategories = async ({ search, status }) => {
  const where = {};

  if (search) {
    where.OR = [
      { category_name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  const categories = await prisma.category.findMany({
    where,
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return categories;
};

export const findCategoryById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { category_id: BigInt(id) },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
  return category;
};

export const findCategoryByName = async (category_name) => {
  const category = await prisma.category.findUnique({
    where: { category_name },
  });
  return category;
};

export const createCategory = async (data) => {
  const newCategory = await prisma.category.create({
    data: {
      category_name: data.category_name,
      description: data.description || null,
      status: data.status || 'ACTIVE',
    },
  });
  return newCategory;
};

export const updateCategory = async (id, data) => {
  const updated = await prisma.category.update({
    where: { category_id: BigInt(id) },
    data: {
      ...(data.category_name && { category_name: data.category_name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status }),
    },
  });
  return updated;
};

/**
 * Xóa danh mục và cascade xóa sạch toàn bộ sản phẩm bên trong an toàn trong transaction
 */
export const deleteCategory = async (id) => {
  const catId = BigInt(id);
  return await prisma.$transaction(async (tx) => {
    // 1. Tìm tất cả sản phẩm thuộc danh mục này
    const products = await tx.product.findMany({
      where: { category_id: catId },
      select: { product_id: true },
    });
    const productIds = products.map((p) => p.product_id);

    if (productIds.length > 0) {
      // 2. Tìm tất cả variants của các sản phẩm này
      const variants = await tx.productVariant.findMany({
        where: { product_id: { in: productIds } },
        select: { variant_id: true },
      });
      const variantIds = variants.map((v) => v.variant_id);

      // 3. Xóa CartItems và OrderItems của các variants này
      if (variantIds.length > 0) {
        await tx.cartItem.deleteMany({
          where: { variant_id: { in: variantIds } },
        });

        await tx.orderItem.deleteMany({
          where: { variant_id: { in: variantIds } },
        });
      }

      // 4. Dọn dẹp các đơn hàng trống (nếu có đơn hàng nào không còn sản phẩm nào)
      const emptyOrders = await tx.order.findMany({
        where: {
          order_items: {
            none: {},
          },
        },
        select: { order_id: true },
      });
      if (emptyOrders.length > 0) {
        await tx.order.deleteMany({
          where: {
            order_id: { in: emptyOrders.map((o) => o.order_id) },
          },
        });
      }

      // 4. Xóa Wishlists
      await tx.wishlist.deleteMany({
        where: { product_id: { in: productIds } },
      });

      // 5. Xóa ProductEmbeddings
      await tx.productEmbedding.deleteMany({
        where: { product_id: { in: productIds } },
      });

      // 6. Xóa ProductImages
      await tx.productImage.deleteMany({
        where: { product_id: { in: productIds } },
      });

      // 7. Xóa ProductVariants
      if (variantIds.length > 0) {
        await tx.productVariant.deleteMany({
          where: { variant_id: { in: variantIds } },
        });
      }

      // 8. Xóa Products
      await tx.product.deleteMany({
        where: { product_id: { in: productIds } },
      });
    }

    // 9. Xóa Category
    const deleted = await tx.category.delete({
      where: { category_id: catId },
    });

    return { deleted, deletedProductIds: productIds.map(String) };
  });
};

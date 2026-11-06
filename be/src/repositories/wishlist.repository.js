import { prisma } from './prisma.js';

const productInclude = {
  category: true,
  brand: true,
  images: {
    orderBy: { display_order: 'asc' },
  },
  variants: {
    where: { status: 'ACTIVE' },
    orderBy: { price: 'asc' },
  },
};

/**
 * Tìm tất cả sản phẩm trong danh sách yêu thích của khách hàng
 */
export const findWishlistByCustomerId = async (customerId) => {
  return await prisma.wishlist.findMany({
    where: { customer_id: BigInt(customerId) },
    include: {
      product: {
        include: productInclude,
      },
    },
    orderBy: { created_at: 'desc' },
  });
};

/**
 * Tìm một mục yêu thích cụ thể theo customer_id và product_id
 */
export const findWishlistItem = async (customerId, productId) => {
  return await prisma.wishlist.findUnique({
    where: {
      uq_customer_product_wishlist: {
        customer_id: BigInt(customerId),
        product_id: BigInt(productId),
      },
    },
    include: {
      product: {
        include: productInclude,
      },
    },
  });
};

/**
 * Kiểm tra sản phẩm tồn tại
 */
export const findProductById = async (productId) => {
  return await prisma.product.findUnique({
    where: { product_id: BigInt(productId) },
    include: productInclude,
  });
};

/**
 * Thêm sản phẩm vào danh sách yêu thích
 */
export const addToWishlist = async (customerId, productId) => {
  return await prisma.wishlist.create({
    data: {
      customer_id: BigInt(customerId),
      product_id: BigInt(productId),
    },
    include: {
      product: {
        include: productInclude,
      },
    },
  });
};

/**
 * Xóa một sản phẩm khỏi danh sách yêu thích
 */
export const removeFromWishlist = async (customerId, productId) => {
  return await prisma.wishlist.deleteMany({
    where: {
      customer_id: BigInt(customerId),
      product_id: BigInt(productId),
    },
  });
};

/**
 * Xóa toàn bộ sản phẩm yêu thích của khách hàng
 */
export const clearWishlist = async (customerId) => {
  return await prisma.wishlist.deleteMany({
    where: {
      customer_id: BigInt(customerId),
    },
  });
};


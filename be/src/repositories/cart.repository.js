import { prisma } from './prisma.js';

const cartItemInclude = {
  variant: {
    include: {
      product: {
        include: {
          images: {
            orderBy: { display_order: 'asc' },
          },
          category: true,
          brand: true,
        },
      },
    },
  },
};

/**
 * Tìm giỏ hàng theo customer_id hoặc tạo mới nếu chưa có
 */
export const findOrCreateCart = async (customerId) => {
  const customerBigInt = BigInt(customerId);
  let cart = await prisma.cart.findUnique({
    where: { customer_id: customerBigInt },
    include: {
      cart_items: {
        include: cartItemInclude,
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        customer_id: customerBigInt,
      },
      include: {
        cart_items: {
          include: cartItemInclude,
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  return cart;
};

/**
 * Lấy giỏ hàng chi tiết theo customer_id
 */
export const findCartByCustomerId = async (customerId) => {
  return await prisma.cart.findUnique({
    where: { customer_id: BigInt(customerId) },
    include: {
      cart_items: {
        include: cartItemInclude,
        orderBy: { created_at: 'desc' },
      },
    },
  });
};

/**
 * Tìm biến thể sản phẩm theo variant_id
 */
export const findVariantById = async (variantId) => {
  return await prisma.productVariant.findUnique({
    where: { variant_id: BigInt(variantId) },
    include: {
      product: {
        include: {
          images: {
            orderBy: { display_order: 'asc' },
          },
          category: true,
          brand: true,
        },
      },
    },
  });
};

/**
 * Tìm mục giỏ hàng cụ thể theo cart_id và variant_id
 */
export const findCartItem = async (cartId, variantId) => {
  return await prisma.cartItem.findUnique({
    where: {
      cart_id_variant_id: {
        cart_id: BigInt(cartId),
        variant_id: BigInt(variantId),
      },
    },
    include: cartItemInclude,
  });
};

/**
 * Thêm hoặc cộng dồn số lượng sản phẩm vào giỏ hàng
 */
export const addOrIncrementCartItem = async (cartId, variantId, quantity) => {
  const cartBigInt = BigInt(cartId);
  const variantBigInt = BigInt(variantId);

  const existing = await prisma.cartItem.findUnique({
    where: {
      cart_id_variant_id: {
        cart_id: cartBigInt,
        variant_id: variantBigInt,
      },
    },
  });

  if (existing) {
    return await prisma.cartItem.update({
      where: {
        cart_id_variant_id: {
          cart_id: cartBigInt,
          variant_id: variantBigInt,
        },
      },
      data: {
        quantity: existing.quantity + quantity,
      },
      include: cartItemInclude,
    });
  }

  return await prisma.cartItem.create({
    data: {
      cart_id: cartBigInt,
      variant_id: variantBigInt,
      quantity,
    },
    include: cartItemInclude,
  });
};

/**
 * Cập nhật số lượng của mục giỏ hàng
 */
export const updateCartItemQuantity = async (cartId, variantId, quantity) => {
  return await prisma.cartItem.update({
    where: {
      cart_id_variant_id: {
        cart_id: BigInt(cartId),
        variant_id: BigInt(variantId),
      },
    },
    data: {
      quantity,
    },
    include: cartItemInclude,
  });
};

/**
 * Xóa một mục khỏi giỏ hàng
 */
export const deleteCartItem = async (cartId, variantId) => {
  return await prisma.cartItem.delete({
    where: {
      cart_id_variant_id: {
        cart_id: BigInt(cartId),
        variant_id: BigInt(variantId),
      },
    },
  });
};

/**
 * Xóa sạch tất cả các mục trong giỏ hàng
 */
export const clearCartItems = async (cartId) => {
  return await prisma.cartItem.deleteMany({
    where: {
      cart_id: BigInt(cartId),
    },
  });
};

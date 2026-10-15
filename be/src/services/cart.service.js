import * as cartRepo from '../repositories/cart.repository.js';

/**
 * Format thông tin 1 dòng sản phẩm trong giỏ hàng
 */
export const formatCartItem = (item) => {
  const v = item.variant;
  const p = v?.product;
  const primaryImg =
    p?.images?.find((img) => img.is_primary)?.image_url ||
    p?.images?.[0]?.image_url ||
    null;

  const priceNum = Number(v?.price || 0);
  const qty = Number(item.quantity || 1);
  const subtotal = priceNum * qty;

  return {
    cart_item_id: item.variant_id.toString(),
    variant_id: item.variant_id.toString(),
    product_id: p ? p.product_id.toString() : null,
    product_name: p ? p.product_name : 'Sản phẩm',
    sku: v?.sku || '',
    color: v?.color || '',
    size: v?.size || '',
    price: priceNum,
    quantity: qty,
    stock: Number(v?.stock || 0),
    subtotal,
    image: primaryImg,
    category_name: p?.category?.category_name || null,
    brand_name: p?.brand?.brand_name || null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};

/**
 * Format thông tin giỏ hàng hoàn chỉnh kèm tổng tiền
 */
export const formatCart = (cart) => {
  if (!cart) {
    return {
      cart_id: null,
      items: [],
      total_items: 0,
      total_amount: 0,
    };
  }

  const items = (cart.cart_items || []).map(formatCartItem);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart_id: cart.cart_id.toString(),
    customer_id: cart.customer_id.toString(),
    items,
    total_items: totalItems,
    total_amount: totalAmount,
    created_at: cart.created_at,
    updated_at: cart.updated_at,
  };
};

/**
 * Lấy giỏ hàng của khách hàng (nếu chưa có tự động tạo mới)
 */
export const getCartService = async (customerId) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  const cart = await cartRepo.findOrCreateCart(customerId);
  return formatCart(cart);
};

/**
 * Thêm sản phẩm biến thể vào giỏ hàng
 */
export const addItemToCartService = async (customerId, { variant_id, quantity = 1 }) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  // 1. Kiểm tra biến thể sản phẩm có tồn tại và đang hoạt động không
  const variant = await cartRepo.findVariantById(variant_id);
  if (!variant) {
    const error = new Error('Biến thể sản phẩm không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (variant.status !== 'ACTIVE') {
    const error = new Error('Biến thể sản phẩm này hiện đã ngừng kinh doanh');
    error.statusCode = 400;
    throw error;
  }

  // 2. Lấy hoặc tạo giỏ hàng của khách hàng
  const cart = await cartRepo.findOrCreateCart(customerId);

  // 3. Kiểm tra số lượng tồn kho
  const existingItem = await cartRepo.findCartItem(cart.cart_id, variant_id);
  const currentQtyInCart = existingItem ? existingItem.quantity : 0;
  const newTotalQty = currentQtyInCart + qty;

  if (newTotalQty > variant.stock) {
    const error = new Error(
      `Sản phẩm "${variant.product.product_name}" (${variant.color} - ${variant.size}) chỉ còn ${variant.stock} sản phẩm trong kho`
    );
    error.statusCode = 400;
    throw error;
  }

  // 4. Lưu vào database
  await cartRepo.addOrIncrementCartItem(cart.cart_id, variant_id, qty);

  // 5. Trả về giỏ hàng mới nhất
  const updatedCart = await cartRepo.findCartByCustomerId(customerId);
  return formatCart(updatedCart);
};

/**
 * Cập nhật số lượng của 1 mục trong giỏ hàng
 */
export const updateCartItemQuantityService = async (customerId, variantId, quantity) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  const cart = await cartRepo.findOrCreateCart(customerId);
  const targetQty = parseInt(quantity, 10);

  // Nếu số lượng = 0 thì xóa khỏi giỏ hàng
  if (targetQty <= 0) {
    return await deleteCartItemService(customerId, variantId);
  }

  // Kiểm tra mục có trong giỏ hàng không
  const existingItem = await cartRepo.findCartItem(cart.cart_id, variantId);
  if (!existingItem) {
    const error = new Error('Sản phẩm không có trong giỏ hàng');
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra tồn kho
  const variant = existingItem.variant;
  if (targetQty > variant.stock) {
    const error = new Error(
      `Số lượng yêu cầu vượt quá tồn kho (chỉ còn ${variant.stock} sản phẩm)`
    );
    error.statusCode = 400;
    throw error;
  }

  await cartRepo.updateCartItemQuantity(cart.cart_id, variantId, targetQty);

  const updatedCart = await cartRepo.findCartByCustomerId(customerId);
  return formatCart(updatedCart);
};

/**
 * Xóa một mục khỏi giỏ hàng
 */
export const deleteCartItemService = async (customerId, variantId) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  const cart = await cartRepo.findOrCreateCart(customerId);

  const existingItem = await cartRepo.findCartItem(cart.cart_id, variantId);
  if (existingItem) {
    await cartRepo.deleteCartItem(cart.cart_id, variantId);
  }

  const updatedCart = await cartRepo.findCartByCustomerId(customerId);
  return formatCart(updatedCart);
};

/**
 * Xóa toàn bộ giỏ hàng
 */
export const clearCartService = async (customerId) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  const cart = await cartRepo.findOrCreateCart(customerId);
  await cartRepo.clearCartItems(cart.cart_id);

  return {
    cart_id: cart.cart_id.toString(),
    customer_id: customerId.toString(),
    items: [],
    total_items: 0,
    total_amount: 0,
  };
};

/**
 * Đồng bộ giỏ hàng từ khách vãng lai (Guest) sau khi đăng nhập
 */
export const syncCartService = async (customerId, items = []) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  const cart = await cartRepo.findOrCreateCart(customerId);

  if (Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      if (!item.variant_id) continue;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const variant = await cartRepo.findVariantById(item.variant_id);
      if (variant && variant.status === 'ACTIVE') {
        const existing = await cartRepo.findCartItem(cart.cart_id, item.variant_id);
        const currQty = existing ? existing.quantity : 0;
        const addQty = Math.min(qty, Math.max(0, variant.stock - currQty));
        if (addQty > 0) {
          await cartRepo.addOrIncrementCartItem(cart.cart_id, item.variant_id, addQty);
        }
      }
    }
  }

  const updatedCart = await cartRepo.findCartByCustomerId(customerId);
  return formatCart(updatedCart);
};

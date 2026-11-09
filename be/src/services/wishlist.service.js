import * as wishlistRepo from '../repositories/wishlist.repository.js';

/**
 * Định dạng một mục sản phẩm yêu thích trả về client
 */
export const formatWishlistItem = (item) => {
  const p = item.product;
  const primaryImg =
    p?.images?.find((img) => img.is_primary)?.image_url ||
    p?.images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800';

  const variants = p?.variants || [];
  const prices = variants.map((v) => Number(v.price || 0)).filter((pr) => pr > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);

  const availableSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const availableColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  return {
    wishlist_id: item.wishlist_id.toString(),
    id: p ? p.product_id.toString() : null,
    product_id: p ? p.product_id.toString() : null,
    name: p ? p.product_name : 'Sản phẩm',
    title: p ? p.product_name : 'Sản phẩm',
    product_name: p ? p.product_name : 'Sản phẩm',
    sku: variants[0]?.sku || (p ? `YF-${p.product_id}` : ''),
    category: p?.category?.category_name || 'Thời Trang',
    categoryName: p?.category?.category_name || 'Thời Trang',
    category_id: p?.category_id ? p.category_id.toString() : null,
    brand_name: p?.brand?.brand_name || null,
    brand_id: p?.brand_id ? p.brand_id.toString() : null,
    price: minPrice,
    originalPrice: null,
    image: primaryImg,
    images: (p?.images || []).map((img) => ({
      image_id: img.image_id.toString(),
      image_url: img.image_url,
      is_primary: img.is_primary,
    })),
    availableSizes: availableSizes.length > 0 ? availableSizes : ['S', 'M', 'L'],
    colors: availableColors,
    selectedSize: availableSizes[0] || 'M',
    inStock: totalStock > 0 || variants.length === 0,
    status: totalStock > 0 ? 'CÒN HÀNG' : 'HẾT HÀNG',
    statusColor: totalStock > 0 ? 'green' : 'red',
    created_at: item.created_at,
  };
};

/**
 * Lấy danh sách sản phẩm yêu thích của khách hàng
 */
export const getWishlistService = async (customerId) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  const items = await wishlistRepo.findWishlistByCustomerId(customerId);
  const formattedItems = items.map(formatWishlistItem);

  return {
    items: formattedItems,
    total_items: formattedItems.length,
  };
};

/**
 * Thêm sản phẩm vào danh sách yêu thích
 */
export const addToWishlistService = async (customerId, productId) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  const product = await wishlistRepo.findProductById(productId);
  if (!product) {
    const error = new Error('Sản phẩm không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const existing = await wishlistRepo.findWishlistItem(customerId, productId);
  if (existing) {
    return {
      message: 'Sản phẩm đã có trong danh sách yêu thích',
      item: formatWishlistItem(existing),
      already_exists: true,
    };
  }

  const created = await wishlistRepo.addToWishlist(customerId, productId);
  return {
    message: 'Đã thêm sản phẩm vào danh sách yêu thích',
    item: formatWishlistItem(created),
    already_exists: false,
  };
};

/**
 * Toggle (thêm nếu chưa có, xóa nếu đã có) sản phẩm yêu thích
 */
export const toggleWishlistService = async (customerId, productId) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  const product = await wishlistRepo.findProductById(productId);
  if (!product) {
    const error = new Error('Sản phẩm không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const existing = await wishlistRepo.findWishlistItem(customerId, productId);
  if (existing) {
    await wishlistRepo.removeFromWishlist(customerId, productId);
    return {
      added: false,
      product_id: String(productId),
      message: 'Đã xóa sản phẩm khỏi danh sách yêu thích',
    };
  }

  const created = await wishlistRepo.addToWishlist(customerId, productId);
  return {
    added: true,
    product_id: String(productId),
    item: formatWishlistItem(created),
    message: 'Đã thêm sản phẩm vào danh sách yêu thích',
  };
};

/**
 * Xóa một sản phẩm khỏi danh sách yêu thích
 */
export const removeFromWishlistService = async (customerId, productId) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  await wishlistRepo.removeFromWishlist(customerId, productId);
  return {
    product_id: String(productId),
    message: 'Đã xóa sản phẩm khỏi danh sách yêu thích',
  };
};

/**
 * Xóa toàn bộ sản phẩm yêu thích của khách hàng
 */
export const clearWishlistService = async (customerId) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  await wishlistRepo.clearWishlist(customerId);
  return {
    message: 'Đã làm trống danh sách yêu thích thành công',
  };
};

/**
 * Kiểm tra xem một sản phẩm có nằm trong danh sách yêu thích không
 */
export const checkWishlistStatusService = async (customerId, productId) => {
  if (!customerId) {
    return { is_favorited: false };
  }
  const item = await wishlistRepo.findWishlistItem(customerId, productId);
  return {
    is_favorited: Boolean(item),
    product_id: String(productId),
  };
};

/**
 * Đồng bộ danh sách yêu thích từ localStorage của khách vãng lai khi đăng nhập
 */
export const syncWishlistService = async (customerId, { product_ids = [], items = [] }) => {
  if (!customerId) {
    const error = new Error('Yêu cầu thông tin khách hàng');
    error.statusCode = 401;
    throw error;
  }

  // Thu thập tất cả product_id từ cả 2 dạng body
  const ids = new Set();
  product_ids.forEach((id) => ids.add(Number(id)));
  items.forEach((it) => {
    const pid = it.product_id || it.id;
    if (pid) ids.add(Number(pid));
  });

  for (const pid of ids) {
    if (!pid || isNaN(pid)) continue;
    try {
      const exists = await wishlistRepo.findWishlistItem(customerId, pid);
      if (!exists) {
        const prod = await wishlistRepo.findProductById(pid);
        if (prod) {
          await wishlistRepo.addToWishlist(customerId, pid);
        }
      }
    } catch (err) {
      // Bỏ qua lỗi duplicate hoặc id không hợp lệ
    }
  }

  return await getWishlistService(customerId);
};


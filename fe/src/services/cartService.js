import axiosClient from './axiosClient';

/**
 * Service giao tiếp với API Giỏ hàng Backend (/api/cart)
 */
export const cartService = {
  /**
   * Lấy giỏ hàng của tài khoản đang đăng nhập
   */
  getCart: async () => {
    try {
      const res = await axiosClient.get('/cart');
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Thêm sản phẩm biến thể vào giỏ hàng
   * @param {Number|String} variantId 
   * @param {Number} quantity 
   */
  addToCart: async (variantId, quantity = 1) => {
    try {
      const res = await axiosClient.post('/cart/items', {
        variant_id: Number(variantId),
        quantity: Number(quantity),
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Cập nhật số lượng của mục giỏ hàng
   * @param {Number|String} variantId 
   * @param {Number} quantity 
   */
  updateQuantity: async (variantId, quantity) => {
    try {
      const res = await axiosClient.patch(`/cart/items/${variantId}`, {
        quantity: Number(quantity),
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Xóa một mục khỏi giỏ hàng
   * @param {Number|String} variantId 
   */
  removeFromCart: async (variantId) => {
    try {
      const res = await axiosClient.delete(`/cart/items/${variantId}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Xóa toàn bộ sản phẩm trong giỏ hàng
   */
  clearCart: async () => {
    try {
      const res = await axiosClient.delete('/cart');
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Đồng bộ giỏ hàng từ khách vãng lai (Guest) vào database sau khi đăng nhập
   * @param {Array<{variant_id: number, quantity: number}>} items 
   */
  syncCart: async (items = []) => {
    try {
      const res = await axiosClient.post('/cart/sync', { items });
      return res.data;
    } catch (err) {
      throw err;
    }
  },
};

import axiosClient from './axiosClient';

/**
 * Service giao tiếp với API Danh sách yêu thích Backend (/api/wishlist)
 */
export const wishlistService = {
  /**
   * Lấy danh sách sản phẩm yêu thích của khách hàng
   */
  getWishlist: async () => {
    try {
      const res = await axiosClient.get('/wishlist');
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Thêm sản phẩm vào danh sách yêu thích
   * @param {Number|String} productId
   */
  addToWishlist: async (productId) => {
    try {
      const res = await axiosClient.post('/wishlist', {
        product_id: Number(productId),
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Toggle (thêm nếu chưa có, xóa nếu đã có) sản phẩm yêu thích
   * @param {Number|String} productId
   */
  toggleWishlist: async (productId) => {
    try {
      const res = await axiosClient.post('/wishlist/toggle', {
        product_id: Number(productId),
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Kiểm tra xem sản phẩm đã có trong wishlist chưa
   * @param {Number|String} productId
   */
  checkWishlistStatus: async (productId) => {
    try {
      const res = await axiosClient.get(`/wishlist/check/${productId}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Xóa một sản phẩm khỏi danh sách yêu thích
   * @param {Number|String} productId
   */
  removeFromWishlist: async (productId) => {
    try {
      const res = await axiosClient.delete(`/wishlist/${productId}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Xóa toàn bộ sản phẩm khỏi danh sách yêu thích
   */
  clearWishlist: async () => {
    try {
      const res = await axiosClient.delete('/wishlist');
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Đồng bộ danh sách yêu thích từ khách vãng lai sau khi đăng nhập
   * @param {Array<Number|String>} productIds
   */
  syncWishlist: async (productIds = []) => {
    try {
      const res = await axiosClient.post('/wishlist/sync', {
        product_ids: productIds.map(Number),
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  },
};


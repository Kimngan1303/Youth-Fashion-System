import axiosClient from './axiosClient';

export const orderService = {
  /**
   * Tạo đơn hàng mới (Hỗ trợ COD hoặc PayOS)
   */
  createOrder: async (orderData) => {
    try {
      const res = await axiosClient.post('/orders', orderData);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Tra cứu chi tiết đơn hàng
   */
  getOrderByNumber: async (orderNumber) => {
    try {
      const res = await axiosClient.get(`/orders/${orderNumber}`);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy danh sách lịch sử đơn hàng của tài khoản hiện tại
   */
  getMyOrders: async (email) => {
    try {
      const url = email ? `/orders/my-orders?email=${encodeURIComponent(email)}` : '/orders/my-orders';
      const res = await axiosClient.get(url);
      return res.data;
    } catch (error) {
      return { status: false, data: [] };
    }
  },

  /**
   * Kiểm tra trạng thái thanh toán PayOS theo mã orderCode
   */
  checkPayosStatus: async (orderCode) => {
    try {
      const res = await axiosClient.get(`/orders/check-payos/${orderCode}`);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Hủy đơn hàng trực tuyến
   */
  cancelOrder: async (orderIdOrNumber, reason) => {
    try {
      const res = await axiosClient.patch(`/orders/${orderIdOrNumber}/cancel`, { reason });
      return res.data;
    } catch (error) {
      try {
        const res = await axiosClient.post(`/orders/${orderIdOrNumber}/cancel`, { reason });
        return res.data;
      } catch (err) {
        return { status: false };
      }
    }
  },

  /**
   * Lấy danh sách toàn bộ đơn hàng (Dành cho Quản trị viên & Quản lý)
   */
  getAllOrders: async () => {
    try {
      const res = await axiosClient.get('/orders');
      return res.data;
    } catch (error) {
      return { status: false, data: [] };
    }
  },

  /**
   * Cập nhật trạng thái đơn hàng (Dành cho Quản trị viên & Quản lý)
   */
  updateOrderStatus: async (orderId, status, note) => {
    try {
      const res = await axiosClient.patch(`/orders/${orderId}/status`, { status, note });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Xóa đơn hàng (Dành cho Quản trị viên & Quản lý)
   */
  deleteOrder: async (orderId) => {
    try {
      const res = await axiosClient.delete(`/orders/${orderId}`);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Xóa toàn bộ đơn hàng của tất cả tài khoản
   */
  clearAllOrders: async () => {
    try {
      const res = await axiosClient.delete('/orders/clear-all');
      return res.data;
    } catch (error) {
      return { status: false };
    }
  },
};


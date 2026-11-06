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
};


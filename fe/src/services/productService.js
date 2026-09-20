import axiosClient from './axiosClient';

/**
 * Product Service kết nối Frontend tới các endpoint Backend /api/products
 */
export const productService = {
  /**
   * Lấy danh sách sản phẩm với phân trang, tìm kiếm, lọc danh mục
   */
  getProducts: async (params = {}) => {
    const response = await axiosClient.get('/products', { params });
    return response.data;
  },

  /**
   * Lấy chi tiết sản phẩm theo ID
   */
  getProductById: async (id) => {
    const response = await axiosClient.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Lấy danh sách Categories và Brands cho bộ lọc dropdown
   */
  getMeta: async () => {
    const response = await axiosClient.get('/products/meta');
    return response.data;
  },

  /**
   * Tạo mới sản phẩm (Manager / Admin)
   * @param {FormData|Object} data
   */
  createProduct: async (data) => {
    const isFormData = data instanceof FormData;
    const response = await axiosClient.post('/products', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  /**
   * Cập nhật sản phẩm (Manager / Admin)
   */
  updateProduct: async (id, data) => {
    const isFormData = data instanceof FormData;
    const response = await axiosClient.put(`/products/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  /**
   * Xóa sản phẩm theo ID (Manager / Admin)
   */
  deleteProduct: async (id) => {
    const response = await axiosClient.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Upload ảnh mới cho sản phẩm
   */
  addProductImage: async (productId, formData) => {
    const response = await axiosClient.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Xóa ảnh sản phẩm
   */
  deleteProductImage: async (imageId) => {
    const response = await axiosClient.delete(`/products/images/${imageId}`);
    return response.data;
  },

  /**
   * Đặt ảnh làm ảnh đại diện chính (Primary Image)
   */
  setPrimaryProductImage: async (productId, imageId) => {
    const response = await axiosClient.patch(`/products/${productId}/images/${imageId}/primary`);
    return response.data;
  },
};

import axiosClient from './axiosClient';

export const categoryService = {
  // Lấy danh sách danh mục (hỗ trợ search và lọc theo status)
  getCategories: async (params = {}) => {
    const response = await axiosClient.get('/categories', { params });
    return response.data;
  },

  // Lấy chi tiết danh mục theo ID
  getCategoryById: async (id) => {
    const response = await axiosClient.get(`/categories/${id}`);
    return response.data;
  },

  // Tạo mới danh mục
  createCategory: async (data) => {
    const response = await axiosClient.post('/categories', data);
    return response.data;
  },

  // Cập nhật danh mục
  updateCategory: async (id, data) => {
    const response = await axiosClient.put(`/categories/${id}`, data);
    return response.data;
  },

  // Xóa danh mục
  deleteCategory: async (id) => {
    const response = await axiosClient.delete(`/categories/${id}`);
    return response.data;
  },
};

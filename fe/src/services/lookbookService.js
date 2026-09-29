import axiosClient from './axiosClient';

export const lookbookService = {
  // Lấy tất cả lookbook (hỗ trợ search, status)
  getLookbooks: async (params = {}) => {
    const response = await axiosClient.get('/lookbooks', { params });
    return response.data;
  },

  // Lấy chi tiết lookbook theo ID
  getLookbookById: async (id) => {
    const response = await axiosClient.get(`/lookbooks/${id}`);
    return response.data;
  },

  // Tạo mới lookbook
  createLookbook: async (data) => {
    const response = await axiosClient.post('/lookbooks', data);
    return response.data;
  },

  // Cập nhật lookbook
  updateLookbook: async (id, data) => {
    const response = await axiosClient.put(`/lookbooks/${id}`, data);
    return response.data;
  },

  // Xóa lookbook
  deleteLookbook: async (id) => {
    const response = await axiosClient.delete(`/lookbooks/${id}`);
    return response.data;
  },
};

import axiosClient from './axiosClient';

export const brandService = {
  // Lấy danh sách thương hiệu (hỗ trợ search và lọc theo status)
  getBrands: async (params = {}) => {
    const response = await axiosClient.get('/brands', { params });
    return response.data;
  },

  // Lấy chi tiết thương hiệu theo ID
  getBrandById: async (id) => {
    const response = await axiosClient.get(`/brands/${id}`);
    return response.data;
  },

  // Tạo mới thương hiệu
  createBrand: async (data) => {
    const response = await axiosClient.post('/brands', data);
    return response.data;
  },

  // Cập nhật thương hiệu
  updateBrand: async (id, data) => {
    const response = await axiosClient.put(`/brands/${id}`, data);
    return response.data;
  },

  // Xóa thương hiệu
  deleteBrand: async (id) => {
    const response = await axiosClient.delete(`/brands/${id}`);
    return response.data;
  },
};

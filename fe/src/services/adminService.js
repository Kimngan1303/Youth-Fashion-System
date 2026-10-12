import axiosClient from './axiosClient';

export const adminService = {
  // Lấy danh sách toàn bộ người dùng
  getUsers: async (params = {}) => {
    const response = await axiosClient.get('/admin/users', { params });
    return response.data;
  },

  // Lấy các chỉ số KPI thống kê người dùng
  getMetrics: async () => {
    const response = await axiosClient.get('/admin/metrics');
    return response.data;
  },

  // Tạo tài khoản Quản trị viên (Admin / Manager) mới
  createAdmin: async (data) => {
    const response = await axiosClient.post('/admin/create-admin', data);
    return response.data;
  },

  // Cập nhật trạng thái tài khoản (Khóa / Mở khóa)
  updateUserStatus: async (type, id, status) => {
    const response = await axiosClient.put(`/admin/users/${type}/${id}/status`, { status });
    return response.data;
  },

  // Cập nhật vai trò / phân quyền
  updateUserRole: async (type, id, role) => {
    const response = await axiosClient.put(`/admin/users/${type}/${id}/role`, { role });
    return response.data;
  },

  // Xóa người dùng
  deleteUser: async (type, id) => {
    const response = await axiosClient.delete(`/admin/users/${type}/${id}`);
    return response.data;
  },
};

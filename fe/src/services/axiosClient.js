import axios from 'axios';

const axiosClient = axios.create({
  // URL gốc của Backend API
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    // Lấy Access Token từ bộ nhớ trình duyệt nếu có
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Đính kèm Token vào Header Authorization chuẩn Bearer
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true; // Đánh dấu để tránh vòng lặp vô tận

      try {
        // Gửi yêu cầu cấp lại token mới lên backend
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (newAccessToken) {
          // Lưu token mới vào localStorage
          localStorage.setItem('accessToken', newAccessToken);

          // Cập nhật Header Authorization cho request cũ bằng token mới
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Thực hiện gửi lại request ban đầu với token mới và trả kết quả về cho component
          return axiosClient(originalRequest);
        }
      } catch (refreshErr) {
        // Nếu Refresh Token cũng đã hết hạn hoặc bị thu hồi (hết phiên 7 ngày)
        // Dọn dẹp sạch thông tin phiên đăng nhập khỏi trình duyệt
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        // Phát sự kiện toàn cục thông báo đăng xuất để AuthContext chuyển hướng người dùng về trang login
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;

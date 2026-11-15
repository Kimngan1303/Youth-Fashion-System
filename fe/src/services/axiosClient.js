import axios from 'axios';

/**
 * Axios Client instance configured for Youth Fashion API
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for receiving and sending HTTP-Only refresh token cookies
});

// Request Interceptor: Attach Access Token if present in localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Silent Token Refresh & 403 Account Locked
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Xử lý khi tài khoản bị khóa (403 với code ACCOUNT_LOCKED hoặc thông báo tài khoản bị khóa)
    if (
      error.response?.status === 403 &&
      (error.response?.data?.code === 'ACCOUNT_LOCKED' ||
       error.response?.data?.message?.includes('tạm khóa') ||
       error.response?.data?.message?.includes('bị khóa'))
    ) {
      window.dispatchEvent(
        new CustomEvent('auth:account_locked', {
          detail: {
            message: error.response?.data?.message || 'Tài khoản của bạn đã bị Quản trị viên tạm khóa. Mọi thao tác tiếp theo đã bị vô hiệu hóa!',
          },
        })
      );
      return Promise.reject(error);
    }

    // If Access Token expired (401) and request wasn't already retried
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;

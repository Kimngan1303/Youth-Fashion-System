import axiosClient from './axiosClient';

/**
 * Auth Service connecting Frontend to Backend /api/auth Endpoints
 */
export const authService = {
  /**
   * Login user (Customer or Employee)
   * @param {Object} credentials - { email, password, loginType }
   */
  login: async ({ email, password, user_type = 'CUSTOMER' }) => {
    const response = await axiosClient.post('/auth/login', {
      email,
      password,
      user_type,
    });
    return response.data;
  },

  /**
   * Register new customer
   * @param {Object} userData - { full_name, email, password, phone_number, gender, address }
   */
  register: async (userData) => {
    const response = await axiosClient.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Logout user and clear session cookie
   */
  logout: async () => {
    const response = await axiosClient.post('/auth/logout');
    return response.data;
  },

  /**
   * Request new access token via refresh token cookie
   */
  refreshToken: async () => {
    const response = await axiosClient.post('/auth/refresh');
    return response.data;
  },

  /**
   * Update customer profile in database
   */
  updateProfile: async (profileData) => {
    const response = await axiosClient.put('/auth/profile', profileData);
    return response.data;
  },

  /**
   * Change customer password in database
   */
  changePassword: async (passwordData) => {
    const response = await axiosClient.put('/auth/change-password', passwordData);
    return response.data;
  },
};


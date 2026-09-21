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
   * Register new customer (sends verification OTP)
   * @param {Object} userData - { full_name, email, password, phone }
   */
  register: async (userData) => {
    const response = await axiosClient.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Verify email using 6-digit OTP
   * @param {Object} data - { email, otp }
   */
  verifyEmail: async ({ email, otp }) => {
    const response = await axiosClient.post('/auth/verify-email', { email, otp });
    return response.data;
  },

  /**
   * Resend verification OTP
   * @param {Object} data - { email }
   */
  resendVerificationOTP: async ({ email }) => {
    const response = await axiosClient.post('/auth/resend-verification-otp', { email });
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
};

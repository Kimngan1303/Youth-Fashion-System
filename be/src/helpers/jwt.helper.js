import jwt from 'jsonwebtoken';

/**
 * Helper quản lý sinh và kiểm tra mã JSON Web Token (JWT)
 */

/**
 * Tạo Access Token (mặc định 15 phút)
 * @param {Object} payload - Dữ liệu đính kèm (userId, email, role, userType)
 * @returns {String} JWT Token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'dung_cham_vao_toi',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

/**
 * Tạo Refresh Token (mặc định 7 ngày)
 * @param {Object} payload - Dữ liệu đính kèm (userId, userType)
 * @returns {String} JWT Refresh Token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'dung_dong_vao_toi',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * Giải mã và xác thực Access Token
 * @param {String} token - Chuỗi JWT Token
 * @returns {Object} Payload được giải mã
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'dung_cham_vao_toi');
};

/**
 * Giải mã và xác thực Refresh Token
 * @param {String} token - Chuỗi Refresh Token
 * @returns {Object} Payload được giải mã
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'dung_dong_vao_toi');
};

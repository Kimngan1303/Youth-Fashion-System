import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  findCustomerByEmail,
  findCustomerByPhone,
  findEmployeeByEmail,
  createCustomer,
  saveRefreshToken,
  deleteRefreshTokenByHash,
  findRefreshTokenByHash,
} from '../repositories/auth.repository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../helpers/jwt.helper.js';

/**
 * Service layer chứa toàn bộ Business Logic cho tính năng Đăng ký, Đăng nhập, Đăng xuất, Refresh Token
 */

/**
 * Xử lý nghiệp vụ Đăng ký tài khoản Khách hàng (Customer)
 * @param {Object} param0 { email, password, full_name, phone }
 */
export const registerService = async ({ email, password, full_name, phone }) => {
  // 1. Kiểm tra xem email đã được sử dụng chưa
  const existingCustomer = await findCustomerByEmail(email);
  if (existingCustomer) {
    throw { statusCode: 400, message: 'Email này đã được sử dụng' };
  }

  const existingEmployee = await findEmployeeByEmail(email);
  if (existingEmployee) {
    throw { statusCode: 400, message: 'Email này đã được sử dụng trong hệ thống' };
  }

  // 2. Kiểm tra số điện thoại (nếu có)
  if (phone) {
    const existingPhone = await findCustomerByPhone(phone);
    if (existingPhone) {
      throw { statusCode: 400, message: 'Số điện thoại này đã được sử dụng' };
    }
  }

  // 3. Mã hóa mật khẩu bằng bcrypt (10 rounds)
  const password_hash = await bcrypt.hash(password, 10);

  // 4. Lưu Khách hàng mới vào CSDL
  const newCustomer = await createCustomer({
    email,
    password_hash,
    full_name,
    phone,
  });

  return {
    customer_id: newCustomer.customer_id.toString(),
    email: newCustomer.email,
    full_name: newCustomer.full_name,
    phone: newCustomer.phone,
    status: newCustomer.status,
    created_at: newCustomer.created_at,
  };
};

/**
 * Xử lý nghiệp vụ Đăng nhập
 * @param {Object} param0 { email, password, user_type }
 */
export const loginService = async ({ email, password, user_type }) => {
  let user = null;
  let role = 'CUSTOMER';

  // 1. Kiểm tra tài khoản dựa trên loại người dùng (CUSTOMER hoặc EMPLOYEE)
  if (user_type === 'CUSTOMER') {
    user = await findCustomerByEmail(email);
    if (!user) {
      throw { statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' };
    }
    if (user.status !== 'ACTIVE') {
      throw { statusCode: 403, message: 'Tài khoản khách hàng đang bị khóa hoặc ngưng hoạt động' };
    }
    role = 'CUSTOMER';
  } else if (user_type === 'EMPLOYEE') {
    user = await findEmployeeByEmail(email);
    if (!user) {
      throw { statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' };
    }
    if (user.status !== 'ACTIVE') {
      throw { statusCode: 403, message: 'Tài khoản nhân viên đang bị khóa hoặc ngưng hoạt động' };
    }
    role = user.employee_role; // MANAGER hoặc ADMIN
  }

  // 2. Kiểm tra mật khẩu Bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' };
  }

  // 3. Sinh cặp Token (Access Token & Refresh Token)
  const userId = user_type === 'CUSTOMER' ? user.customer_id : user.employee_id;
  const tokenPayload = {
    id: userId.toString(),
    email: user.email,
    role,
    user_type,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ id: userId.toString(), user_type });

  // 4. Băm mã Refresh Token để lưu an toàn vào CSDL
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

  await saveRefreshToken({
    customer_id: user_type === 'CUSTOMER' ? userId : null,
    employee_id: user_type === 'EMPLOYEE' ? userId : null,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: userId.toString(),
      email: user.email,
      full_name: user.full_name,
      role,
      user_type,
    },
  };
};

/**
 * Xử lý nghiệp vụ Đăng xuất (Thu hồi Refresh Token)
 * @param {String} refreshToken
 */
export const logoutService = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await deleteRefreshTokenByHash(tokenHash);
};

/**
 * Xử lý cấp lại Access Token mới khi hết hạn
 * @param {String} refreshToken
 */
export const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw { statusCode: 401, message: 'Refresh token không được tìm thấy' };
  }

  // 1. Kiểm tra tính hợp lệ JWT của Refresh Token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw { statusCode: 401, message: 'Refresh token không hợp lệ hoặc đã hết hạn' };
  }

  // 2. Kiểm tra token hash trong CSDL
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (!storedToken || storedToken.expires_at < new Date() || storedToken.revoked_at) {
    throw { statusCode: 401, message: 'Refresh token đã bị thu hồi hoặc hết hạn' };
  }

  // 3. Sinh Access Token mới
  const newAccessToken = generateAccessToken({
    id: decoded.id,
    user_type: decoded.user_type,
  });

  return { accessToken: newAccessToken };
};

import { registerService, loginService, logoutService, refreshAccessTokenService, updateProfileService, changePasswordService } from '../services/auth.service.js';
import { BaseResponse } from '../utils/baseResponse.js';

/**
 * Controller layer xử lý tiếp nhận HTTP Request & gửi Response cho Auth API
 */

/**
 * Endpoint Đăng ký tài khoản Khách hàng (POST /api/auth/register)
 */
export const registerController = async (req, res, next) => {
  try {
    const { email, password, full_name, phone } = req.body;

    const result = await registerService({ email, password, full_name, phone });

    return BaseResponse.success(
      res,
      'Đăng ký tài khoản thành công. Vui lòng đăng nhập.',
      result,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint Đăng nhập (POST /api/auth/login)
 */
export const loginController = async (req, res, next) => {
  try {
    const { email, password, user_type } = req.body;

    const result = await loginService({ email, password, user_type });

    // Lưu Refresh Token vào Cookie HTTP-Only bảo mật
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    return BaseResponse.success(res, 'Đăng nhập thành công', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint Đăng xuất (POST /api/auth/logout)
 */
export const logoutController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    await logoutService(refreshToken);

    res.clearCookie('refreshToken');

    return BaseResponse.success(res, 'Đăng xuất thành công', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint Cấp lại Access Token mới (POST /api/auth/refresh)
 */
export const refreshController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    const result = await refreshAccessTokenService(refreshToken);

    return BaseResponse.success(res, 'Cấp lại Access Token thành công', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint Cập nhật hồ sơ cá nhân (PUT /api/auth/profile)
 */
export const updateProfileController = async (req, res, next) => {
  try {
    const customer_id = req.user?.id || req.body.customer_id || req.body.id;
    const { full_name, phone, avatar_url, gender, dob } = req.body;

    if (!customer_id) {
      return BaseResponse.error(res, 'Không tìm thấy ID người dùng', [], 400);
    }

    const result = await updateProfileService({ customer_id, full_name, phone, avatar_url, gender, dob });

    return BaseResponse.success(res, 'Cập nhật thông tin hồ sơ thành công', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint Đổi mật khẩu (PUT /api/auth/change-password)
 */
export const changePasswordController = async (req, res, next) => {
  try {
    const customer_id = req.user?.id || req.body.customer_id || req.body.id;
    const email = req.user?.email || req.body.email;
    const { current_password, new_password } = req.body;

    const result = await changePasswordService({
      customer_id,
      email,
      current_password,
      new_password,
    });

    return BaseResponse.success(res, 'Đổi mật khẩu thành công', result, 200);
  } catch (error) {
    next(error);
  }
};

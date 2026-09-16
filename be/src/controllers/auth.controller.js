import { registerService, loginService, logoutService, refreshAccessTokenService } from '../services/auth.service.js';
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

    // Thiết lập HTTP-Only Cookie cho Refresh Token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    return BaseResponse.success(
      res,
      'Đăng nhập thành công',
      {
        accessToken: result.accessToken,
        user: result.user,
      },
      200
    );
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

    // Xóa cookie refreshToken phía Client
    res.clearCookie('refreshToken');

    return BaseResponse.success(res, 'Đăng xuất thành công', {}, 200);
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

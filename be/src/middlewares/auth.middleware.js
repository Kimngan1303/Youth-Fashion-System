import { verifyAccessToken } from '../helpers/jwt.helper.js';
import { BaseResponse } from '../utils/baseResponse.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return BaseResponse.error(res, 'Yêu cầu Access Token trong Authorization Header', [], 401);
  }

  try {
    // Xác thực token bằng secret key
    const decoded = verifyAccessToken(token);

    // Đính kèm payload người dùng (id, email, role, ...) vào Request object
    req.user = decoded;
    next(); // Cho phép đi tiếp tới Controller xử lý nghiệp vụ
  } catch (err) {
    return BaseResponse.error(res, 'Access Token không hợp lệ hoặc đã hết hạn', [], 401);
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return BaseResponse.error(res, 'Bạn không có quyền truy cập tài nguyên này', [], 403);
    }
    next();
  };
};

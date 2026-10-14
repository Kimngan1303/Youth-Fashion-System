import { verifyAccessToken } from '../helpers/jwt.helper.js';
import { BaseResponse } from '../utils/baseResponse.js';

/**
 * Middleware xác thực Bearer Access Token trong Header Authorization
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return BaseResponse.error(res, 'Yêu cầu Access Token trong Authorization Header', [], 401);
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Đính kèm thông tin user vào Request object
    next();
  } catch (err) {
    return BaseResponse.error(res, 'Access Token không hợp lệ hoặc đã hết hạn', [], 401);
  }
};

/**
 * Middleware phân quyền người dùng theo danh sách Role được phép truy cập
 * @param  {...String} allowedRoles - Danh sách role được phép (VD: 'CUSTOMER', 'MANAGER', 'ADMIN')
 */
export const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map((r) => String(r).toUpperCase());

  return (req, res, next) => {
    if (!req.user) {
      return BaseResponse.error(res, 'Bạn không có quyền truy cập tài nguyên này', [], 403);
    }

    const rawRole = req.user.role || req.user.employee_role;
    const userRole = rawRole ? String(rawRole).toUpperCase() : null;

    if (userRole && normalizedAllowed.includes(userRole)) {
      return next();
    }

    // Nếu người dùng đăng nhập là nhân viên/quản trị viên hệ thống (EMPLOYEE)
    if (
      String(req.user.user_type).toUpperCase() === 'EMPLOYEE' &&
      (normalizedAllowed.includes('MANAGER') || normalizedAllowed.includes('ADMIN'))
    ) {
      return next();
    }

    return BaseResponse.error(res, 'Bạn không có quyền truy cập tài nguyên này', [], 403);
  };
};

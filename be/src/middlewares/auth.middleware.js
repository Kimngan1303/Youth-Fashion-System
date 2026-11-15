import { verifyAccessToken } from '../helpers/jwt.helper.js';
import { BaseResponse } from '../utils/baseResponse.js';
import prisma from '../repositories/prisma.js';

/**
 * Middleware xác thực Bearer Access Token trong Header Authorization
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return BaseResponse.error(res, 'Yêu cầu Access Token trong Authorization Header', [], 401);
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Đính kèm thông tin user vào Request object

    // Kiểm tra trạng thái tài khoản thời gian thực trong CSDL (chặn ngay lập tức khi bị admin khóa)
    const email = (decoded.email || '').toLowerCase().trim();
    if (email) {
      // 1. Kiểm tra trong bảng employee
      const emp = await prisma.employee.findUnique({
        where: { email },
        select: { status: true, employee_role: true },
      });
      if (emp) {
        if (emp.status !== 'ACTIVE') {
          return res.status(403).json({
            status: false,
            code: 'ACCOUNT_LOCKED',
            message: 'Tài khoản của bạn đã bị Quản trị viên tạm khóa. Mọi thao tác tiếp theo đã bị vô hiệu hóa!',
          });
        }
      } else {
        // 2. Kiểm tra trong bảng customer
        const cust = await prisma.customer.findUnique({
          where: { email },
          select: { status: true },
        });
        if (cust && cust.status !== 'ACTIVE') {
          return res.status(403).json({
            status: false,
            code: 'ACCOUNT_LOCKED',
            message: 'Tài khoản của bạn đã bị Quản trị viên tạm khóa. Mọi thao tác tiếp theo đã bị vô hiệu hóa!',
          });
        }
      }
    }

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

  return async (req, res, next) => {
    if (!req.user) {
      return BaseResponse.error(res, 'Bạn không có quyền truy cập tài nguyên này', [], 403);
    }

    const email = (req.user.email || '').toLowerCase().trim();
    const rawRole = req.user.role || req.user.employee_role;
    let userRole = rawRole ? String(rawRole).toUpperCase() : null;

    // Kiểm tra realtime với CSDL nếu route yêu cầu quyền quản trị (ADMIN / MANAGER)
    if (normalizedAllowed.includes('MANAGER') || normalizedAllowed.includes('ADMIN')) {
      if (email) {
        try {
          const activeEmp = await prisma.employee.findFirst({
            where: { email, status: 'ACTIVE' },
          });
          if (!activeEmp) {
            return BaseResponse.error(res, 'Quyền quản lý của bạn đã bị thu hồi hoặc tài khoản không có quyền truy cập', [], 403);
          }
          userRole = String(activeEmp.employee_role).toUpperCase();
        } catch (e) {}
      }
    }

    if (userRole && normalizedAllowed.includes(userRole)) {
      return next();
    }

    // Nếu người dùng đăng nhập là nhân viên/quản trị viên hệ thống (EMPLOYEE) nhưng chưa có userRole cụ thể
    if (
      String(req.user.user_type).toUpperCase() === 'EMPLOYEE' &&
      !userRole &&
      (normalizedAllowed.includes('MANAGER') || normalizedAllowed.includes('ADMIN'))
    ) {
      return next();
    }

    return BaseResponse.error(res, 'Bạn không có quyền truy cập tài nguyên này', [], 403);
  };
};

/**
 * Middleware tùy chọn: Nếu có Access Token thì giải mã gắn vào req.user, nếu không thì vẫn cho qua tiếp tục (cho khách vãng lai)
 */
export const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};


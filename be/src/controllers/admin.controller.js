import * as adminService from '../services/admin.service.js';
import { BaseResponse } from '../utils/baseResponse.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const data = await adminService.getAllUsersService({ search, role, status });
    return BaseResponse.success(res, 'Lấy danh sách người dùng thành công', data, 200);
  } catch (error) {
    next(error);
  }
};

export const getAdminMetrics = async (req, res, next) => {
  try {
    const data = await adminService.getAdminMetricsService();
    return BaseResponse.success(res, 'Lấy chỉ số hệ thống thành công', data, 200);
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req, res, next) => {
  try {
    const { employee_code, full_name, email, phone, password, employee_role } = req.body;
    if (!full_name || !email || !password) {
      return BaseResponse.error(res, 'Họ tên, email và mật khẩu là bắt buộc', [], 400);
    }
    const data = await adminService.createAdminService({
      employee_code,
      full_name,
      email,
      phone,
      password,
      employee_role,
    });
    return BaseResponse.success(res, 'Tạo tài khoản quản trị thành công', data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;
    const data = await adminService.updateUserStatusService({ type, id, status });
    return BaseResponse.success(res, 'Cập nhật trạng thái người dùng thành công', data, 200);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { role } = req.body;
    const data = await adminService.updateUserRoleService({ type, id, role });
    return BaseResponse.success(res, 'Cập nhật vai trò người dùng thành công', data, 200);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const data = await adminService.deleteUserService({ type, id });
    return BaseResponse.success(res, 'Xóa người dùng thành công', data, 200);
  } catch (error) {
    next(error);
  }
};

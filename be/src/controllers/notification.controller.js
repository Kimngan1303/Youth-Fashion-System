import { BaseResponse } from '../utils/baseResponse.js';
import * as notificationService from '../services/notification.service.js';

const getUserContext = (req) => {
  const isEmployee = req.user && String(req.user.user_type || '').toUpperCase() === 'EMPLOYEE';
  return {
    customerId: !isEmployee ? (req.user?.id || req.user?.customer_id) : null,
    employeeId: isEmployee ? (req.user?.id || req.user?.employee_id) : null,
  };
};

export const getNotifications = async (req, res, next) => {
  try {
    const ctx = getUserContext(req);
    const notifications = await notificationService.getNotificationsService(ctx);
    return BaseResponse.success(res, 'Lấy danh sách thông báo thành công', notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ctx = getUserContext(req);
    await notificationService.markNotificationReadService(id, ctx);
    return BaseResponse.success(res, 'Đánh dấu thông báo đã đọc thành công');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const ctx = getUserContext(req);
    await notificationService.markAllNotificationsReadService(ctx);
    return BaseResponse.success(res, 'Đánh dấu tất cả thông báo đã đọc thành công');
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ctx = getUserContext(req);
    await notificationService.deleteNotificationService(id, ctx);
    return BaseResponse.success(res, 'Xóa thông báo thành công');
  } catch (error) {
    next(error);
  }
};

export const deleteAllNotifications = async (req, res, next) => {
  try {
    const ctx = getUserContext(req);
    await notificationService.deleteAllNotificationsService(ctx);
    return BaseResponse.success(res, 'Xóa tất cả thông báo thành công');
  } catch (error) {
    next(error);
  }
};

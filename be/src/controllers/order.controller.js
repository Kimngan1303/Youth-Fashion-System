import { BaseResponse } from '../utils/baseResponse.js';
import * as orderService from '../services/order.service.js';

export const createOrder = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.body.customerId || null;
    const clientOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
    const {
      recipientName,
      recipientPhone,
      recipientEmail,
      shippingAddressLine,
      shippingWard,
      shippingDistrict,
      shippingCity,
      shippingMethod,
      paymentMethod,
      note,
      items,
      voucherCode,
      discountAmount,
    } = req.body;

    const result = await orderService.createOrderService({
      customerId,
      clientOrigin,
      recipientName,
      recipientPhone,
      recipientEmail,
      shippingAddressLine,
      shippingWard,
      shippingDistrict,
      shippingCity,
      shippingMethod,
      paymentMethod,
      note,
      items,
      voucherCode,
      discountAmount,
    });

    return BaseResponse.success(res, 'Tạo đơn hàng thành công', result, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const customerId = req.user?.id;
    const email = req.user?.email || req.query?.email;
    if (!customerId && !email) {
      return BaseResponse.success(res, 'Lấy danh sách đơn hàng thành công', []);
    }
    const orders = await orderService.getMyOrdersService({ customerId, email });
    return BaseResponse.success(res, 'Lấy danh sách đơn hàng thành công', orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderByNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const order = await orderService.getOrderByNumberService(orderNumber);
    return BaseResponse.success(res, 'Lấy thông tin đơn hàng thành công', order);
  } catch (error) {
    next(error);
  }
};

export const checkPayosStatus = async (req, res, next) => {
  try {
    const { orderCode } = req.params;
    const result = await orderService.checkPayosStatusService(orderCode);
    return BaseResponse.success(res, 'Kiểm tra trạng thái PayOS thành công', result);
  } catch (error) {
    next(error);
  }
};

export const payosWebhook = async (req, res, next) => {
  try {
    await orderService.handlePayosWebhookService(req.body);
    return res.status(200).json({ success: true, message: 'Webhook đã được xử lý' });
  } catch (error) {
    console.error('❌ Lỗi xử lý Webhook PayOS:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const result = await orderService.cancelOrderService(id, reason);
    return BaseResponse.success(res, 'Hủy đơn hàng thành công', result);
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getAllOrdersService();
    return BaseResponse.success(res, 'Lấy danh sách tất cả đơn hàng thành công', orders);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, returnRequest } = req.body || {};
    const isEmployee = req.user && String(req.user.user_type || '').toUpperCase() === 'EMPLOYEE';
    const employeeId = isEmployee ? (req.user.id || req.user.employee_id || null) : null;

    const result = await orderService.updateOrderStatusService(id, status, note, {
      employeeId,
      returnRequestData: returnRequest,
    });
    return BaseResponse.success(res, 'Cập nhật trạng thái đơn hàng thành công', result);
  } catch (error) {
    next(error);
  }
};

export const clearAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.clearAllOrdersService();
    return BaseResponse.success(res, 'Đã xóa tất cả đơn hàng thành công', result);
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await orderService.deleteOrderService(id);
    return BaseResponse.success(res, 'Xóa đơn hàng thành công', result);
  } catch (error) {
    next(error);
  }
};


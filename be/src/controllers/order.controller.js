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


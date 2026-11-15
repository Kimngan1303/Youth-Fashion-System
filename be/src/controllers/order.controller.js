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

    const user = req.user;
    const isStaff = user && ['ADMIN', 'MANAGER', 'STAFF'].includes(user.role?.toUpperCase());
    const isOwner = user && (
      (order.customer_id && String(user.id) === String(order.customer_id)) ||
      (order.recipient_email && user.email && order.recipient_email.toLowerCase() === user.email.toLowerCase()) ||
      (order.customer?.email && user.email && order.customer.email.toLowerCase() === user.email.toLowerCase())
    );

    if (!isStaff && !isOwner) {
      // Khách vãng lai thì ẩn địa chỉ và SĐT để bảo mật thông tin
      const maskedOrder = {
        ...order,
        recipient_phone: order.recipient_phone ? order.recipient_phone.replace(/(\d{3})\d+(\d{2})/, '$1****$2') : '***',
        shipping_address_line: '*** (Đã ẩn vì lý do bảo mật)',
        shipping_ward: '***',
        shipping_district: '***',
        shipping_city: '***',
      };
      return BaseResponse.success(res, 'Lấy thông tin đơn hàng thành công', maskedOrder);
    }

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

export const customerCancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const customerId = req.user?.id || req.user?.customer_id;
    const result = await orderService.customerCancelOrderService(id, customerId, reason);
    return BaseResponse.success(res, 'Hủy đơn hàng thành công', result);
  } catch (error) {
    next(error);
  }
};

export const customerRefundRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      reason,
      bank_info,
      images,
      refund_amount,
      return_items,
      items,
      selected_items,
      customerEmail,
      recipientEmail,
    } = req.body || {};
    const customerId = req.user?.id || req.user?.customer_id;
    const resolvedItems = return_items || items || selected_items;
    const result = await orderService.customerRefundRequestService(id, customerId, {
      reason,
      bank_info,
      images,
      refund_amount,
      return_items: resolvedItems,
      selected_items: resolvedItems,
      customerEmail: customerEmail || req.user?.email,
      recipientEmail: recipientEmail || req.user?.email,
    });
    return BaseResponse.success(res, 'Gửi yêu cầu hoàn tiền thành công', result);
  } catch (error) {
    next(error);
  }
};

export const customerConfirmDelivered = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customerId = req.user?.id || req.user?.customer_id;
    const result = await orderService.customerConfirmDeliveredService(id, customerId);
    return BaseResponse.success(res, 'Xác nhận đã nhận hàng thành công', result);
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
    const { status, note, returnRequest, ...extraData } = req.body || {};
    const isEmployee = req.user && String(req.user.user_type || '').toUpperCase() === 'EMPLOYEE';
    const employeeId = isEmployee ? (req.user.id || req.user.employee_id || null) : null;

    const result = await orderService.updateOrderStatusService(id, status, note, {
      employeeId,
      returnRequestData: returnRequest,
      ...extraData,
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

export const notifyOrderEmail = async (req, res, next) => {
  try {
    const { orderId, orderNumber, recipientEmail, newStatus, extraData } = req.body;
    const result = await orderService.notifyOrderEmailService({
      orderId,
      orderNumber,
      recipientEmail,
      newStatus,
      extraData,
    });
    return BaseResponse.success(res, 'Gửi email thông báo đơn hàng thành công', result);
  } catch (error) {
    next(error);
  }
};



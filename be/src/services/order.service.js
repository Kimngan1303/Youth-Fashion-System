import * as orderRepo from '../repositories/order.repository.js';
import * as payosService from './payos.service.js';
import { prisma } from '../repositories/prisma.js';
import { sendOrderNotificationEmail } from './email.service.js';

/**
 * Service xử lý toàn bộ luồng nghiệp vụ tạo đơn hàng, tính tiền, và kết nối cổng PayOS
 */

export const createOrderService = async ({
  customerId,
  clientOrigin = null,
  recipientName,
  recipientPhone,
  recipientEmail,
  shippingAddressLine,
  shippingWard,
  shippingDistrict,
  shippingCity,
  shippingMethod = 'EXPRESS',
  paymentMethod = 'COD',
  note = '',
  items = [],
  voucherCode = null,
  discountAmount = 0,
}) => {
  if (!items || items.length === 0) {
    const error = new Error('Đơn hàng không có sản phẩm nào để thanh toán');
    error.statusCode = 400;
    throw error;
  }

  if (!recipientName || !recipientPhone || !shippingCity) {
    const error = new Error('Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ giao hàng');
    error.statusCode = 400;
    throw error;
  }

  const cleanPhone = recipientPhone.replace(/[\s.\-()]/g, '');
  const vnPhoneRegex = /^(?:(?:\+84|84|0))(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;
  if (!vnPhoneRegex.test(cleanPhone)) {
    const error = new Error('Số điện thoại nhận hàng không hợp lệ (yêu cầu 10 số thuộc các mạng di động Việt Nam)');
    error.statusCode = 400;
    throw error;
  }

  // 1. Tính toán giá trị đơn hàng
  const itemsData = items.map((item) => {
    const unitPrice = Number(item.price || item.unit_price || 0);
    const quantity = Number(item.quantity || 1);
    const subtotal = unitPrice * quantity;

    return {
      variant_id: item.variant_id || item.id,
      product_id: item.product_id || item.productId || (typeof item.id === 'string' ? item.id.split('-')[0] : item.id),
      product_name: item.title || item.product_name || item.name || 'Sản phẩm',
      sku: item.sku || `SKU-${item.variant_id || item.id}`,
      size: item.size || 'M',
      color: item.color || item.colorName || 'Mặc định',
      unit_price: unitPrice,
      quantity,
      subtotal,
    };
  });

  const rawSubtotal = itemsData.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = Math.min(rawSubtotal, Math.max(0, Number(discountAmount || 0)));
  const totalAmount = Math.max(0, rawSubtotal - discount);

  // 2. Sinh mã đơn hàng và mã PayOS OrderCode (Số nguyên an toàn)
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900));
  const orderNumber = `YF-${orderCode}`;

  const normalizedPaymentMethod = paymentMethod === 'PAYOS' ? 'PAYOS' : 'COD';

  // 3. Thực thi Transaction lưu Order, OrderItem, Payment
  const createdOrder = await orderRepo.createOrderTransaction({
    orderData: {
      order_number: orderNumber,
      recipient_name: recipientName.trim(),
      recipient_phone: recipientPhone.trim(),
      recipient_email: recipientEmail ? recipientEmail.trim() : null,
      shipping_address_line: shippingAddressLine ? shippingAddressLine.trim() : '',
      shipping_ward: shippingWard ? shippingWard.trim() : '',
      shipping_district: shippingDistrict ? shippingDistrict.trim() : '',
      shipping_city: shippingCity.trim(),
      total_amount: totalAmount,
      order_status: 'PENDING',
      note: note ? note.trim() : null,
    },
    itemsData,
    paymentData: {
      payment_method: normalizedPaymentMethod,
      payment_status: 'PENDING',
    },
    customerId,
    voucherCode,
  });

  // 4. Xử lý cổng thanh toán PayOS nếu chọn PAYOS
  if (normalizedPaymentMethod === 'PAYOS') {
    const clientUrl = clientOrigin || process.env.CLIENT_URL || 'http://localhost:3000';
    // Theo chuẩn PayOS, returnUrl và cancelUrl là URL gốc, PayOS sẽ tự động nối các query params
    const returnUrl = `${clientUrl}/order-success`;
    const cancelUrl = `${clientUrl}/checkout`;

    try {
      const payosLink = await payosService.createPaymentLink({
        orderCode,
        amount: totalAmount,
        description: `Thanh toan ${orderNumber}`.slice(0, 25),
        items: itemsData.map((i) => ({
          name: i.product_name,
          quantity: i.quantity,
          price: i.unit_price,
        })),
        returnUrl,
        cancelUrl,
      });

      // Lưu mã liên kết thanh toán vào Payment
      if (payosLink.paymentLinkId) {
        await prisma.payment.updateMany({
          where: { order_id: createdOrder.order_id },
          data: { provider_payment_id: String(payosLink.paymentLinkId) },
        });
      }

      return {
        order: createdOrder,
        orderCode,
        orderNumber,
        checkoutUrl: payosLink.checkoutUrl,
        isSimulation: payosLink.isSimulation || false,
        paymentMethod: 'PAYOS',
      };
    } catch (payosError) {
      console.error('❌ Lỗi khi khởi tạo liên kết PayOS:', payosError.message);
      throw new Error(`Khởi tạo thanh toán PayOS thất bại: ${payosError.message}`);
    }
  }

  // Với phương thức COD:
  // Tự động gửi email thông báo đặt hàng thành công đến Gmail của khách
  if (recipientEmail) {
    sendOrderNotificationEmail({
      toEmail: recipientEmail,
      order: createdOrder,
      status: 'ORDER_CREATED',
    }).catch((emailErr) => {
      console.error('Lỗi khi gửi email xác nhận đặt hàng COD:', emailErr.message);
    });
  }

  return {
    order: createdOrder,
    orderCode,
    orderNumber,
    checkoutUrl: null,
    paymentMethod: 'COD',
  };
};

/**
 * Lấy danh sách đơn hàng thực tế của khách hàng theo customerId hoặc email
 */
export const getMyOrdersService = async (params) => {
  if (typeof params === 'object' && params !== null) {
    return await orderRepo.findOrdersByCustomer(params);
  }
  return await orderRepo.findOrdersByCustomer({ customerId: params });
};

/**
 * Lấy thông tin đơn hàng theo order_number
 */
export const getOrderByNumberService = async (orderNumber) => {
  const order = await orderRepo.findOrderByNumber(orderNumber);
  if (!order) {
    const error = new Error('Không tìm thấy đơn hàng');
    error.statusCode = 404;
    throw error;
  }
  return order;
};

/**
 * Kiểm tra trạng thái thanh toán từ PayOS và cập nhật đơn hàng
 */
export const checkPayosStatusService = async (orderCode) => {
  const orderNumber = `YF-${orderCode}`;
  const order = await orderRepo.findOrderByNumber(orderNumber);

  if (!order) {
    const error = new Error('Không tìm thấy đơn hàng với mã tương ứng');
    error.statusCode = 404;
    throw error;
  }

  // Truy vấn trực tiếp từ cổng PayOS
  const payosInfo = await payosService.getPaymentInformation(orderCode);

  if (payosInfo && (payosInfo.status === 'PAID' || payosInfo.isSimulation)) {
    await orderRepo.updateOrderStatus(order.order_id, 'CONFIRMED');
    await orderRepo.updatePaymentStatus(order.order_id, 'SUCCESS', {
      transactionId: payosInfo.reference || `TXN_${orderCode}`,
    });

    // Gửi email xác nhận thanh toán thành công về Gmail của khách
    const targetEmail = order.recipient_email || order.customer?.email;
    if (targetEmail) {
      sendOrderNotificationEmail({
        toEmail: targetEmail,
        order,
        status: 'CONFIRMED',
      }).catch((emailErr) => {
        console.error('Lỗi khi gửi email xác nhận thanh toán PayOS:', emailErr.message);
      });
    }

    // Xóa các sản phẩm đã thanh toán khỏi giỏ hàng MySQL của khách
    if (order.customer_id && order.order_items?.length > 0) {
      const customerCart = await prisma.cart.findUnique({
        where: { customer_id: order.customer_id },
      });
      if (customerCart) {
        const variantIds = order.order_items.map((i) => i.variant_id);
        await prisma.cartItem.deleteMany({
          where: {
            cart_id: customerCart.cart_id,
            variant_id: { in: variantIds },
          },
        });
      }
    }

    return {
      orderNumber,
      orderCode,
      status: 'PAID',
      message: 'Đơn hàng đã được thanh toán thành công qua PayOS',
    };
  }

  return {
    orderNumber,
    orderCode,
    status: payosInfo?.status || 'PENDING',
    message: 'Đơn hàng đang chờ thanh toán',
  };
};

/**
 * Nhận Webhook từ máy chủ PayOS khi người dùng chuyển khoản quét mã VietQR thành công
 */
export const handlePayosWebhookService = async (webhookBody) => {
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim();
  const { data, signature } = webhookBody;

  if (!data || !signature) {
    throw new Error('Dữ liệu Webhook không hợp lệ');
  }

  // Xác thực chữ ký
  const isValid = payosService.verifyWebhookSignature(data, signature, checksumKey);
  if (!isValid && checksumKey) {
    console.warn('⚠️ Webhook signature không khớp!');
    throw new Error('Chữ ký Webhook không hợp lệ');
  }

  const { orderCode, reference } = data;
  const orderNumber = `YF-${orderCode}`;
  const order = await orderRepo.findOrderByNumber(orderNumber);

  if (order) {
    await orderRepo.updateOrderStatus(order.order_id, 'CONFIRMED');
    await orderRepo.updatePaymentStatus(order.order_id, 'SUCCESS', {
      transactionId: reference,
    });

    // Gửi email thông báo thanh toán thành công qua Webhook
    const targetEmail = order.recipient_email || order.customer?.email;
    if (targetEmail) {
      sendOrderNotificationEmail({
        toEmail: targetEmail,
        order,
        status: 'CONFIRMED',
      }).catch((emailErr) => {
        console.error('Lỗi khi gửi email webhook PayOS:', emailErr.message);
      });
    }

    if (order.customer_id && order.order_items?.length > 0) {
      const customerCart = await prisma.cart.findUnique({
        where: { customer_id: order.customer_id },
      });
      if (customerCart) {
        const variantIds = order.order_items.map((i) => i.variant_id);
        await prisma.cartItem.deleteMany({
          where: {
            cart_id: customerCart.cart_id,
            variant_id: { in: variantIds },
          },
        });
      }
    }

    console.log(`✅ [PayOS Webhook] Đã xác nhận thanh toán thành công cho đơn ${orderNumber}`);
  }

  return { success: true };
};

/**
 * Hủy đơn hàng và lưu lý do hủy, đồng thời gửi email thông báo
 */
export const cancelOrderService = async (orderIdOrNumber, reason) => {
  const result = await orderRepo.cancelOrder(orderIdOrNumber, reason);

  // Gửi email thông báo hủy đơn đến người nhận
  try {
    const fullOrder = await orderRepo.findOrderAny(orderIdOrNumber);
    const targetEmail = fullOrder?.recipient_email || fullOrder?.customer?.email;
    if (targetEmail) {
      sendOrderNotificationEmail({
        toEmail: targetEmail,
        order: fullOrder,
        status: 'CANCELLED',
        extraData: { reason, note: reason },
      }).catch((emailErr) => {
        console.error('Lỗi gửi email thông báo hủy đơn hàng:', emailErr.message);
      });
    }
  } catch (err) {
    console.error('Lỗi tìm kiếm đơn để gửi email hủy đơn:', err.message);
  }

  return result;
};

/**
 * Lấy tất cả đơn hàng cho khu vực Quản trị Manager/Admin
 */
export const getAllOrdersService = async () => {
  return await orderRepo.findAllOrders();
};

/**
 * Cập nhật trạng thái đơn hàng từ trang Quản trị và gửi email thông báo đến người mua
 */
export const updateOrderStatusService = async (orderId, status, note) => {
  let mappedStatus = 'PENDING';
  const s = String(status || '').toUpperCase();
  if (['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(s)) {
    mappedStatus = 'DELIVERED';
  } else if (['SHIPPING', 'DELIVERING', 'SHIPPED', 'IN_TRANSIT'].includes(s)) {
    mappedStatus = 'SHIPPED';
  } else if (['PROCESSING', 'PREPARING'].includes(s)) {
    mappedStatus = 'PROCESSING';
  } else if (['CONFIRMED'].includes(s)) {
    mappedStatus = 'CONFIRMED';
  } else if (['RETURNED', 'REFUNDED', 'EXCHANGE'].includes(s)) {
    mappedStatus = 'RETURNED';
  } else if (['CANCELLED', 'FAILED'].includes(s)) {
    mappedStatus = 'CANCELLED';
  }

  const result = await orderRepo.updateOrderStatus(orderId, mappedStatus, note);

  // Tự động gửi email thông báo cập nhật trạng thái đơn hàng
  try {
    const fullOrder = await orderRepo.findOrderAny(orderId);
    const targetEmail = fullOrder?.recipient_email || fullOrder?.customer?.email;
    if (targetEmail) {
      sendOrderNotificationEmail({
        toEmail: targetEmail,
        order: fullOrder,
        status: mappedStatus,
        extraData: { note, reason: note },
      }).catch((emailErr) => {
        console.error('Lỗi khi gửi email cập nhật trạng thái đơn hàng:', emailErr.message);
      });
    }
  } catch (err) {
    console.error('Lỗi tìm kiếm đơn hàng để gửi email thông báo:', err.message);
  }

  return result;
};

/**
 * Service xử lý gửi email thông báo đơn hàng trực tiếp theo yêu cầu từ Controller/Frontend
 */
export const notifyOrderEmailService = async ({
  orderId,
  orderNumber,
  recipientEmail,
  newStatus,
  extraData = {},
}) => {
  const targetId = orderNumber || orderId;
  let fullOrder = null;
  if (targetId) {
    fullOrder = await orderRepo.findOrderAny(targetId);
  }

  const emailToUse = (
    recipientEmail ||
    fullOrder?.recipient_email ||
    fullOrder?.customer?.email ||
    extraData?.recipientEmail ||
    ''
  ).trim();

  if (!emailToUse || !emailToUse.includes('@')) {
    return { success: false, message: 'Không tìm thấy địa chỉ email hợp lệ để gửi thông báo' };
  }

  const orderPayload = fullOrder || {
    order_id: orderId,
    order_number: orderNumber || `YF-${orderId}`,
    recipient_email: emailToUse,
    recipient_name: extraData?.recipientName || 'Quý khách',
    recipient_phone: extraData?.recipientPhone || '',
    shipping_address_line: extraData?.shippingAddress || '',
    total_amount: extraData?.totalAmount || 0,
    order_status: newStatus,
    order_items: extraData?.items || [],
  };

  const emailResult = await sendOrderNotificationEmail({
    toEmail: emailToUse,
    order: orderPayload,
    status: newStatus,
    extraData,
  });

  return emailResult;
};

/**
 * Xóa toàn bộ đơn hàng
 */
export const clearAllOrdersService = async () => {
  return await orderRepo.clearAllOrders();
};

/**
 * Xóa đơn hàng từ trang Quản trị hoặc khi khách hủy thanh toán PayOS
 */
export const deleteOrderService = async (orderId) => {
  try {
    const digitsOnly = String(orderId || '').replace(/\D/g, '');
    if (digitsOnly) {
      await payosService.cancelPaymentLink(digitsOnly).catch(() => {});
    }
  } catch (e) {}
  return await orderRepo.deleteOrderById(orderId);
};

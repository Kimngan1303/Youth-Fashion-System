import * as orderRepo from '../repositories/order.repository.js';
import * as payosService from './payos.service.js';
import { prisma } from '../repositories/prisma.js';
import { sendOrderNotificationEmail } from './email.service.js';

/**
 * Helper tạo Error kèm HTTP statusCode chuẩn mà không gây cảnh báo kiểu trên IDE
 */
const createServiceError = (message, statusCode = 400) => {
  return Object.assign(new Error(message), { statusCode });
};

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
  paymentMethod = 'COD',
  note = '',
  items = [],
  voucherCode = null,
  discountAmount = 0,
}) => {
  if (!items || items.length === 0) {
    throw createServiceError('Đơn hàng không có sản phẩm nào để thanh toán', 400);
  }

  if (!recipientName || !recipientPhone || !shippingCity) {
    throw createServiceError('Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ giao hàng', 400);
  }

  const cleanPhone = String(recipientPhone).replace(/[\s.\-()]/g, '');
  const vnPhoneRegex = /^(?:(?:\+84|84|0))(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;
  if (!vnPhoneRegex.test(cleanPhone)) {
    throw createServiceError('Số điện thoại nhận hàng không hợp lệ (yêu cầu 10 số thuộc các mạng di động Việt Nam)', 400);
  }

  // 1. Tính toán giá trị đơn hàng
  const itemsData = items.map((item) => {
    const unitPrice = Number(item.price || item.unit_price || 0);
    const quantity = Number(item.quantity || 1);
    const subtotal = unitPrice * quantity;

    return {
      variant_id: item.variant_id || item.variantId || item.id,
      product_id: item.product_id || item.productId || (typeof item.id === 'string' ? item.id.split('-')[0] : item.id),
      product_name: item.title || item.product_name || item.name || 'Sản phẩm',
      sku: item.sku || `SKU-${item.variant_id || item.variantId || item.id}`,
      size: item.size || 'M',
      color: item.color || item.colorName || 'Mặc định',
      unit_price: unitPrice,
      quantity,
      subtotal,
    };
  });

  const rawSubtotal = itemsData.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = Math.min(rawSubtotal, Math.max(0, Number(discountAmount || 0)));
  const totalAmount = Math.round(Math.max(0, rawSubtotal - discount));

  // 2. Sinh mã đơn hàng và mã PayOS OrderCode (Số nguyên an toàn)
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

    // Giới hạn thời gian thanh toán: đúng 5 phút (300 giây) theo yêu cầu
    const expiredAt = Math.floor(Date.now() / 1000) + 5 * 60;

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
        expiredAt,
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
        expiredAt,
        qrCode: payosLink.qrCode,
        accountNumber: payosLink.accountNumber,
        accountName: payosLink.accountName,
        bin: payosLink.bin,
        amount: totalAmount,
        description: `Thanh toan ${orderNumber}`.slice(0, 25),
      };
    } catch (payosError) {
      console.error('❌ Lỗi khi khởi tạo liên kết PayOS:', payosError.message);
      throw createServiceError(`Khởi tạo thanh toán PayOS thất bại: ${payosError.message}`, 502);
    }
  }

  // Với phương thức COD:
  // Xóa các sản phẩm đã đặt khỏi giỏ hàng MySQL của khách hàng
  if (customerId && itemsData?.length > 0) {
    try {
      const customerCart = await prisma.cart.findUnique({
        where: { customer_id: BigInt(customerId) },
      });
      if (customerCart) {
        const variantIds = itemsData
          .map((i) => i.variant_id)
          .filter((v) => v !== null && v !== undefined && !isNaN(Number(v)))
          .map((v) => BigInt(v));
        if (variantIds.length > 0) {
          await prisma.cartItem.deleteMany({
            where: {
              cart_id: customerCart.cart_id,
              variant_id: { in: variantIds },
            },
          });
        }
      }
    } catch (cartDelErr) {
      console.warn('Lỗi xóa sản phẩm đã đặt khỏi giỏ hàng MySQL COD:', cartDelErr.message);
    }
  }

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
    throw createServiceError('Không tìm thấy đơn hàng', 404);
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
    throw createServiceError('Không tìm thấy đơn hàng với mã tương ứng', 404);
  }

  // 1. Nếu đơn hàng trong DB đã được ghi nhận thanh toán thành công (ví dụ từ webhook hoặc kiểm tra trước đó)
  const isAlreadyPaid = order.payments?.some((p) => p.payment_status === 'SUCCESS' || p.payment_status === 'PAID');
  if (isAlreadyPaid) {
    return {
      orderNumber,
      orderCode,
      status: 'PAID',
      message: 'Đơn hàng đã được thanh toán thành công qua PayOS',
    };
  }

  // 2. Truy vấn trực tiếp từ cổng PayOS
  const payosInfo = await payosService.getPaymentInformation(orderCode);

  if (payosInfo && (payosInfo.status === 'PAID' || payosInfo.isSimulation)) {
    if (!isAlreadyPaid) {
      // Khi thanh toán thành công: payment_status = SUCCESS nhưng đơn VẪN Ở PENDING để Manager duyệt
      await orderRepo.updatePaymentStatus(order.order_id, 'SUCCESS', {
        transactionId: payosInfo.reference || `TXN_${orderCode}`,
      });

      // Tăng lượt sử dụng voucher nếu đơn có mã voucher
      if (order.voucher_code) {
        await prisma.voucher.updateMany({
          where: { code: String(order.voucher_code).toUpperCase().trim() },
          data: { used_count: { increment: 1 } },
        });
      }

      await prisma.orderStatusHistory.create({
        data: {
          order_id: order.order_id,
          from_status: order.order_status,
          to_status: 'PENDING',
          note: `Thanh toán PayOS thành công (Mã GD: ${payosInfo.reference || orderCode}). Chờ quản lý duyệt đơn.`,
        },
      });

      if (order.customer_id) {
        const digits = String(order.order_number).replace(/\D/g, '') || String(order.order_id);
        await prisma.notification.create({
          data: {
            customer_id: order.customer_id,
            notification_type: 'PAYMENT',
            title: 'Thanh toán đơn hàng thành công',
            message: `Đơn hàng #${order.order_number} đã được thanh toán thành công và đang chờ Shop duyệt.`,
            reference_id: order.order_id,
            link: `/profile?tab=orders&order=${digits}`,
            data: {
              order_number: order.order_number,
              status: 'PENDING',
              badge: 'CHỜ XÁC NHẬN',
            },
          },
        });
      }

      // Gửi đúng 1 email xác nhận thanh toán thành công về Gmail của khách
      const targetEmail = order.recipient_email || order.customer?.email;
      if (targetEmail) {
        sendOrderNotificationEmail({
          toEmail: targetEmail,
          order,
          status: 'PENDING',
          extraData: {
            note: `Thanh toán thành công qua PayOS (Mã GD: ${payosInfo.reference || orderCode}). Đơn hàng đang chờ quản lý xác nhận.`,
          },
        }).catch((emailErr) => {
          console.error('Lỗi khi gửi email xác nhận thanh toán PayOS:', emailErr.message);
        });
      }
    }

    // Xóa các sản phẩm đã thanh toán khỏi giỏ hàng MySQL của khách
    if (order.customer_id && order.order_items?.length > 0) {
      try {
        const customerCart = await prisma.cart.findUnique({
          where: { customer_id: BigInt(order.customer_id) },
        });
        if (customerCart) {
          const variantIds = order.order_items
            .map((i) => i.variant_id)
            .filter((v) => v !== null && v !== undefined && !isNaN(Number(v)))
            .map((v) => BigInt(v));
          if (variantIds.length > 0) {
            await prisma.cartItem.deleteMany({
              where: {
                cart_id: customerCart.cart_id,
                variant_id: { in: variantIds },
              },
            });
          }
        }
      } catch (cartDelErr) {
        console.warn('Lỗi xóa sản phẩm khỏi giỏ hàng MySQL PayOS status:', cartDelErr.message);
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
  const { data, signature } = webhookBody || {};

  if (!data || !signature) {
    throw createServiceError('Dữ liệu Webhook không hợp lệ', 400);
  }

  // Chữ ký sai phải bị từ chối kể cả khi thiếu PAYOS_CHECKSUM_KEY (khi đó log cảnh báo và từ chối)
  if (!checksumKey) {
    console.warn('⚠️ [PayOS Webhook] PAYOS_CHECKSUM_KEY chưa được cấu hình!');
    throw createServiceError('Chưa cấu hình khóa kiểm tra PayOS', 400);
  }

  // Xác thực chữ ký
  const isValid = payosService.verifyWebhookSignature(data, signature, checksumKey);
  if (!isValid) {
    console.warn('⚠️ Webhook signature không khớp!');
    throw createServiceError('Chữ ký Webhook không hợp lệ', 400);
  }

  const { orderCode, reference } = data;
  const orderNumber = `YF-${orderCode}`;
  const order = await orderRepo.findOrderByNumber(orderNumber);

  if (!order) {
    throw createServiceError('Không tìm thấy đơn hàng tương ứng với webhook', 404);
  }

  // Idempotent: gọi lại nhiều lần không được gửi email lặp hoặc xử lý lại
  const isAlreadyPaid = order.payments?.some((p) => p.payment_status === 'SUCCESS' || p.payment_status === 'PAID');
  if (isAlreadyPaid) {
    console.log(`ℹ️ [PayOS Webhook] Đơn hàng ${orderNumber} đã thanh toán thành công trước đó (bỏ qua).`);
    return { success: true, alreadyProcessed: true };
  }

  // Cập nhật payment_status = SUCCESS nhưng đơn VẪN Ở PENDING để Manager duyệt
  await orderRepo.updatePaymentStatus(order.order_id, 'SUCCESS', {
    transactionId: reference,
  });

  if (order.voucher_code) {
    await prisma.voucher.updateMany({
      where: { code: String(order.voucher_code).toUpperCase().trim() },
      data: { used_count: { increment: 1 } },
    });
  }

  await prisma.orderStatusHistory.create({
    data: {
      order_id: order.order_id,
      from_status: order.order_status,
      to_status: 'PENDING',
      note: `Thanh toán PayOS thành công (Mã GD: ${reference || orderCode}). Chờ quản lý duyệt đơn.`,
    },
  });

  if (order.customer_id) {
    const digits = String(order.order_number).replace(/\D/g, '') || String(order.order_id);
    await prisma.notification.create({
      data: {
        customer_id: order.customer_id,
        notification_type: 'PAYMENT',
        title: 'Thanh toán đơn hàng thành công',
        message: `Đơn hàng #${order.order_number} đã được thanh toán thành công qua PayOS và đang chờ Shop duyệt.`,
        reference_id: order.order_id,
        link: `/profile?tab=orders&order=${digits}`,
        data: {
          order_number: order.order_number,
          status: 'PENDING',
          badge: 'CHỜ XÁC NHẬN',
        },
      },
    });
  }

  // Gửi đúng 1 email thông báo thanh toán thành công
  const targetEmail = order.recipient_email || order.customer?.email;
  if (targetEmail) {
    sendOrderNotificationEmail({
      toEmail: targetEmail,
      order,
      status: 'PENDING',
      extraData: {
        note: `Thanh toán thành công qua PayOS (Mã GD: ${reference || orderCode}). Đơn hàng đang chờ quản lý duyệt.`,
      },
    }).catch((emailErr) => {
      console.error('Lỗi khi gửi email webhook PayOS:', emailErr.message);
    });
  }

  if (order.customer_id && order.order_items?.length > 0) {
    try {
      const customerCart = await prisma.cart.findUnique({
        where: { customer_id: BigInt(order.customer_id) },
      });
      if (customerCart) {
        const variantIds = order.order_items
          .map((i) => i.variant_id)
          .filter((v) => v !== null && v !== undefined && !isNaN(Number(v)))
          .map((v) => BigInt(v));
        if (variantIds.length > 0) {
          await prisma.cartItem.deleteMany({
            where: {
              cart_id: customerCart.cart_id,
              variant_id: { in: variantIds },
            },
          });
        }
      }
    } catch (cartDelErr) {
      console.warn('Lỗi xóa sản phẩm khỏi giỏ hàng MySQL PayOS webhook:', cartDelErr.message);
    }
  }

  console.log(`✅ [PayOS Webhook] Đã xác nhận thanh toán thành công cho đơn ${orderNumber} (giữ nguyên PENDING chờ duyệt).`);
  return { success: true };
};

/**
 * Quy tắc chuyển trạng thái đơn hàng hợp lệ (Order State Machine)
 * Ngăn chặn việc chuyển nhảy cóc sai quy trình (ví dụ: từ PENDING nhảy thẳng sang DELIVERED)
 */
export const VALID_ORDER_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED'],
  SHIPPED: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERY_FAILED: ['SHIPPED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  CANCELLED: ['RETURNED'],
  COMPLETED: [],
  RETURNED: [],
};

/**
 * Hủy đơn hàng và lưu lý do hủy, đồng thời gửi email thông báo
 */
export const cancelOrderService = async (orderIdOrNumber, reason = undefined) => {
  const existingOrder = await orderRepo.findOrderByIdOrNumber(orderIdOrNumber);
  if (existingOrder) {
    const allowedNext = VALID_ORDER_STATUS_TRANSITIONS[existingOrder.order_status] || [];
    if (!allowedNext.includes('CANCELLED') && existingOrder.order_status !== 'CANCELLED') {
      throw createServiceError(`Không thể hủy đơn hàng đang ở trạng thái "${existingOrder.order_status}".`, 400);
    }
  }
  const result = await orderRepo.cancelOrder(orderIdOrNumber, reason, {
    isShopCancelled: true,
    cancelledBy: 'SHOP',
  });

  // Gửi email thông báo hủy đơn đến người nhận
  try {
    const fullOrder = await orderRepo.findOrderAny(orderIdOrNumber);
    const targetEmail = fullOrder?.recipient_email || fullOrder?.customer?.email;
    if (targetEmail) {
      sendOrderNotificationEmail({
        toEmail: targetEmail,
        order: fullOrder,
        status: 'CANCELLED',
        extraData: { reason, note: reason, isShopCancelled: true, cancelledBy: 'SHOP' },
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
 * Khách hàng hủy đơn hàng của chính mình (chỉ áp dụng khi đơn PENDING)
 */
export const customerCancelOrderService = async (orderIdOrNumber, customerId, reason = 'Khách yêu cầu hủy đơn') => {
  const existingOrder = await orderRepo.findOrderByIdOrNumber(orderIdOrNumber);
  if (!existingOrder) {
    throw createServiceError('Không tìm thấy đơn hàng', 404);
  }

  if (String(existingOrder.customer_id) !== String(customerId)) {
    throw createServiceError('Bạn không có quyền thao tác trên đơn hàng của khách hàng khác', 403);
  }

  if (existingOrder.order_status !== 'PENDING') {
    throw createServiceError('Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xác nhận', 400);
  }

  const cancelReason = reason ? String(reason).trim() : 'Khách yêu cầu hủy đơn';
  const result = await orderRepo.cancelOrder(existingOrder.order_id, cancelReason, {
    cancelledBy: 'CUSTOMER',
    isShopCancelled: false,
  });

  const targetEmail = existingOrder.recipient_email || existingOrder.customer?.email;
  if (targetEmail) {
    sendOrderNotificationEmail({
      toEmail: targetEmail,
      order: existingOrder,
      status: 'CANCELLED',
      extraData: { reason: cancelReason, cancelledBy: 'CUSTOMER', isShopCancelled: false },
    }).catch((e) => console.warn('Lỗi gửi email khách hủy đơn:', e.message));
  }

  return result;
};

/**
 * Khách hàng yêu cầu hoàn tiền cho đơn PayOS bị shop hủy hoặc đổi trả đơn đã giao
 */
export const customerRefundRequestService = async (orderIdOrNumber, customerId, { reason, bank_info, images, refund_amount, return_items } = {}) => {
  const existingOrder = await orderRepo.findOrderByIdOrNumber(orderIdOrNumber);
  if (!existingOrder) {
    throw createServiceError('Không tìm thấy đơn hàng', 404);
  }

  if (String(existingOrder.customer_id) !== String(customerId)) {
    throw createServiceError('Bạn không có quyền thao tác trên đơn hàng của khách hàng khác', 403);
  }

  const isPayos = existingOrder.payments?.some((p) => p.payment_method === 'PAYOS') || existingOrder.payment_method === 'PAYOS';

  if (existingOrder.order_status === 'CANCELLED') {
    if (!isPayos) {
      throw createServiceError('Chỉ đơn hàng PayOS mới được yêu cầu hoàn tiền khi shop hủy', 400);
    }
  } else if (!['DELIVERED', 'COMPLETED'].includes(existingOrder.order_status)) {
    throw createServiceError('Chỉ đơn hàng đã giao, đơn đã hoàn thành hoặc đơn PayOS bị shop hủy mới có thể yêu cầu đổi trả / hoàn tiền', 400);
  }

  const refundReason = reason ? String(reason).trim() : 'Khách yêu cầu hoàn tiền';

  // Tính toán số tiền hoàn dự kiến dựa trên các sản phẩm đã chọn
  let calculatedAmount = 0;
  let itemsSummary = '';
  const parsedItems = Array.isArray(return_items) ? return_items : [];

  if (parsedItems.length > 0) {
    calculatedAmount = parsedItems.reduce((sum, item) => {
      const p = Number(item.price || item.unit_price || 0);
      const q = Number(item.quantity || 1);
      return sum + (p * q);
    }, 0);
    itemsSummary = parsedItems
      .map((it) => `${it.name || it.product_name} (x${it.quantity || 1})`)
      .join(', ');
  }

  const finalRefundAmount = (refund_amount !== undefined && Number(refund_amount) > 0)
    ? Number(refund_amount)
    : (calculatedAmount > 0 ? calculatedAmount : Number(existingOrder.total_amount || 0));

  const itemsTag = itemsSummary ? ` [Sản phẩm hoàn: ${itemsSummary}]` : '';
  const updatedNote = `[Yêu cầu hoàn tiền]: ${refundReason}${itemsTag} | Số tiền hoàn: ${Number(finalRefundAmount).toLocaleString('vi-VN')}₫${bank_info ? ` | STK: ${bank_info}` : ''}`;

  const payloadImages = {
    ...(typeof images === 'object' && images !== null && !Array.isArray(images) ? images : { images: Array.isArray(images) ? images : [] }),
    return_items: parsedItems,
    refund_amount: finalRefundAmount,
  };

  return await prisma.$transaction(async (tx) => {
    // 1. Tạo ReturnRequest
    const rr = await tx.returnRequest.create({
      data: {
        order_id: existingOrder.order_id,
        reason: refundReason,
        type: 'REFUND',
        status: 'PENDING',
        refund_amount: finalRefundAmount,
        bank_info: bank_info || null,
        images: payloadImages,
      },
    });

    // 2. Chuyển trạng thái Order sang RETURNED
    const updatedOrder = await tx.order.update({
      where: { order_id: existingOrder.order_id },
      data: {
        order_status: 'RETURNED',
        note: updatedNote.slice(0, 500),
      },
    });

    // 3. Ghi OrderStatusHistory
    await tx.orderStatusHistory.create({
      data: {
        order_id: existingOrder.order_id,
        from_status: existingOrder.order_status,
        to_status: 'RETURNED',
        note: updatedNote.slice(0, 500),
      },
    });

    // 4. Tạo Notification cho khách hàng
    const digits = String(existingOrder.order_number).replace(/\D/g, '') || String(existingOrder.order_id);
    await tx.notification.create({
      data: {
        customer_id: existingOrder.customer_id,
        notification_type: 'ORDER',
        title: 'Đã gửi yêu cầu hoàn tiền',
        message: `Yêu cầu hoàn tiền (${Number(finalRefundAmount).toLocaleString('vi-VN')}₫) cho đơn hàng #${existingOrder.order_number} đã được gửi đến Shop và đang chờ xử lý.`,
        reference_id: existingOrder.order_id,
        link: `/profile?tab=orders&order=${digits}`,
        data: {
          order_number: existingOrder.order_number,
          status: 'RETURNED',
          badge: 'CHỜ HOÀN TIỀN',
          refund_amount: finalRefundAmount,
          return_items: parsedItems,
        },
      },
    });

    // 5. Gửi đúng 1 email xác nhận yêu cầu hoàn tiền
    const targetEmail = existingOrder.recipient_email || existingOrder.customer?.email;
    if (targetEmail) {
      sendOrderNotificationEmail({
        toEmail: targetEmail,
        order: existingOrder,
        status: 'RETURNED',
        extraData: { reason: refundReason, bank_info, refund_amount: finalRefundAmount, return_items: parsedItems },
      }).catch((e) => console.warn('Lỗi gửi email yêu cầu hoàn tiền:', e.message));
    }

    return { ...updatedOrder, return_request: rr, return_items: parsedItems, refund_amount: finalRefundAmount };
  });
};

/**
 * Khách hàng bấm "Đã nhận được hàng"
 */
export const customerConfirmDeliveredService = async (orderIdOrNumber, customerId) => {
  const existingOrder = await orderRepo.findOrderByIdOrNumber(orderIdOrNumber);
  if (!existingOrder) {
    throw createServiceError('Không tìm thấy đơn hàng', 404);
  }

  if (String(existingOrder.customer_id) !== String(customerId)) {
    throw createServiceError('Bạn không có quyền thao tác trên đơn hàng của khách hàng khác', 403);
  }

  if (existingOrder.order_status !== 'DELIVERED') {
    throw createServiceError('Chỉ có thể xác nhận nhận hàng khi đơn hàng đang ở trạng thái Đã giao', 400);
  }

  const now = new Date();

  // 1. Cập nhật trạng thái đơn hàng sang COMPLETED, ghi nhận customer_received_at và completed_at
  await prisma.order.update({
    where: { order_id: existingOrder.order_id },
    data: {
      customer_received_at: now,
      completed_at: now,
      order_status: 'COMPLETED',
    },
  });

  // 2. Nếu đơn COD chưa đánh dấu thanh toán, cập nhật payment sang SUCCESS/PAID
  try {
    const codPayment = existingOrder.payments?.find(p => p.payment_method === 'COD');
    if (codPayment && codPayment.payment_status === 'PENDING') {
      await prisma.payment.update({
        where: { payment_id: codPayment.payment_id },
        data: {
          payment_status: 'SUCCESS',
          paid_at: now,
        },
      });
    }
  } catch (payErr) {}

  // 3. Ghi nhận lịch sử OrderStatusHistory
  try {
    await prisma.orderStatusHistory.create({
      data: {
        order_id: existingOrder.order_id,
        from_status: 'DELIVERED',
        to_status: 'COMPLETED',
        note: 'Khách hàng xác nhận đã nhận được hàng - Đơn hàng hoàn thành',
      },
    });
  } catch (hErr) {}

  // 4. Tạo bản ghi thông báo Web cho khách hàng
  try {
    await prisma.notification.create({
      data: {
        customer_id: existingOrder.customer_id,
        notification_type: 'ORDER',
        title: 'Đơn hàng đã hoàn tất',
        message: `Đơn hàng #${existingOrder.order_number} đã hoàn tất thành công. Cảm ơn Quý khách đã mua sắm tại Youth Fashion!`,
        badge_text: 'HOÀN TẤT',
        link_url: `/profile?tab=orders&highlight=${existingOrder.order_id}`,
      },
    });
  } catch (nErr) {}

  // 5. Gửi email xác nhận đơn hàng hoàn thành
  try {
    const fullOrder = await orderRepo.findOrderAny(existingOrder.order_id);
    let targetEmail = null;
    if (fullOrder?.recipient_email && fullOrder.recipient_email.includes('@')) {
      targetEmail = fullOrder.recipient_email.trim();
    } else if (fullOrder?.customer?.email && fullOrder.customer.email.includes('@')) {
      targetEmail = fullOrder.customer.email.trim();
    }
    if (targetEmail) {
      sendOrderNotificationEmail({
        toEmail: targetEmail,
        order: fullOrder,
        status: 'COMPLETED',
        extraData: { note: 'Khách hàng xác nhận đã nhận hàng - Đơn hàng hoàn tất thành công' },
      }).catch((emailErr) => {
        console.error('Lỗi khi gửi email thông báo hoàn thành đơn hàng:', emailErr.message);
      });
    }
  } catch (eErr) {}

  const result = await orderRepo.findOrderByIdOrNumber(existingOrder.order_id);
  return result;
};

/**
 * Lấy tất cả đơn hàng cho khu vực Quản trị Manager/Admin
 */
export const getAllOrdersService = async () => {
  return await orderRepo.findAllOrders();
};

/**
 * Cập nhật trạng thái đơn hàng từ trang Quản trị (có kiểm tra quy tắc chuyển trạng thái) và gửi email thông báo
 */
export const updateOrderStatusService = async (orderId, status, note = null, options = {}) => {
  const s = String(status || '').trim().toUpperCase();
  let mappedStatus = null;
  if (['PENDING'].includes(s)) {
    mappedStatus = 'PENDING';
  } else if (s === 'COMPLETED') {
    mappedStatus = 'COMPLETED';
  } else if (['DELIVERY_FAILED', 'FAILED_DELIVERY'].includes(s)) {
    mappedStatus = 'DELIVERY_FAILED';
  } else if (['DELIVERED', 'SUCCESS'].includes(s)) {
    mappedStatus = 'DELIVERED';
  } else if (['SHIPPING', 'DELIVERING', 'SHIPPED', 'IN_TRANSIT'].includes(s)) {
    mappedStatus = 'SHIPPED';
  } else if (['CONFIRMED'].includes(s)) {
    mappedStatus = 'CONFIRMED';
  } else if (['RETURNED', 'REFUNDED', 'EXCHANGE', 'APPROVED', 'REJECTED'].includes(s)) {
    mappedStatus = 'RETURNED';
  } else if (['CANCELLED', 'FAILED'].includes(s)) {
    mappedStatus = 'CANCELLED';
  }

  if (!mappedStatus) {
    throw createServiceError(`Trạng thái đơn hàng "${status}" không hợp lệ.`, 400);
  }

  const existingOrder = await orderRepo.findOrderByIdOrNumber(orderId);
  if (!existingOrder) {
    throw createServiceError('Không tìm thấy đơn hàng để cập nhật trạng thái', 404);
  }

  const currentStatus = existingOrder.order_status;
  // Cho phép giữ nguyên trạng thái để cập nhật ghi chú hoặc quyết định xử lý đổi trả
  if (currentStatus !== mappedStatus) {
    const allowedNext = VALID_ORDER_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(mappedStatus)) {
      throw createServiceError(
        `Không thể chuyển trạng thái đơn hàng từ "${currentStatus}" sang "${mappedStatus}". Các trạng thái hợp lệ tiếp theo: ${
          allowedNext.length > 0 ? allowedNext.join(', ') : 'Không thể chuyển tiếp (Trạng thái cuối)'
        }`,
        400
      );
    }

    // CANCELLED -> RETURNED: Chỉ áp dụng khi đơn PayOS đã thanh toán thành công
    if (currentStatus === 'CANCELLED' && mappedStatus === 'RETURNED') {
      const isPayos = existingOrder.payments?.some((p) => p.payment_method === 'PAYOS');
      const isPaid = existingOrder.payments?.some((p) => p.payment_status === 'SUCCESS' || p.payment_status === 'PAID');
      if (!isPayos || !isPaid) {
        throw createServiceError('Chỉ đơn hàng PayOS đã thanh toán thành công mới được yêu cầu hoàn tiền / đổi trả khi đã hủy', 400);
      }
    }

    // DELIVERED -> COMPLETED: Chỉ hoàn thành khi khách đã xác nhận nhận hàng hoặc đã quá hạn ORDER_AUTO_COMPLETE_DAYS (mặc định 3)
    if (mappedStatus === 'COMPLETED') {
      const days = Math.max(1, Number(process.env.ORDER_AUTO_COMPLETE_DAYS) || 3);
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const hasCustomerConfirmed = Boolean(existingOrder.customer_received_at);
      const isDeliveredPastDays = existingOrder.delivered_at
        ? existingOrder.delivered_at <= cutoff
        : existingOrder.updated_at <= cutoff;

      if (!hasCustomerConfirmed && !isDeliveredPastDays) {
        throw createServiceError(
          `Chỉ có thể bấm 'Hoàn thành' khi khách hàng đã bấm 'Đã nhận được hàng' hoặc đơn hàng đã giao quá ${days} ngày!`,
          400
        );
      }
    }
  }

  const result = await orderRepo.updateOrderStatus(orderId, mappedStatus, note, options);

  // Tự động gửi email thông báo cập nhật trạng thái đơn hàng
  try {
    const fullOrder = await orderRepo.findOrderAny(orderId);
    // Mỗi lần đổi trạng thái chỉ gửi đúng 1 email (ưu tiên recipient_email, không có thì dùng email tài khoản)
    let targetEmail = null;
    if (fullOrder?.recipient_email && fullOrder.recipient_email.includes('@')) {
      targetEmail = fullOrder.recipient_email.trim();
    } else if (fullOrder?.customer?.email && fullOrder.customer.email.includes('@')) {
      targetEmail = fullOrder.customer.email.trim();
    } else if (options?.recipientEmail && options.recipientEmail.includes('@')) {
      targetEmail = options.recipientEmail.trim();
    } else if (options?.userEmail && options.userEmail.includes('@')) {
      targetEmail = options.userEmail.trim();
    }

    const cancelReason = options?.cancelReason || options?.reason || note;
    const isShopCanc = options?.isShopCancelled ?? (mappedStatus === 'CANCELLED');
    const cancBy = options?.cancelledBy || (mappedStatus === 'CANCELLED' ? 'SHOP' : undefined);

    const isRejectRefund = options?.refund_decision === 'REJECTED' ||
                           options?.returnRequest?.status === 'REJECTED' ||
                           s === 'REJECTED' ||
                           String(options?.reason || note || '').toLowerCase().includes('từ chối hoàn tiền');
    const isApproveRefund = options?.refund_decision === 'APPROVED' ||
                            options?.returnRequest?.status === 'APPROVED' ||
                            s === 'APPROVED' ||
                            String(options?.reason || note || '').toLowerCase().includes('đã hoàn tiền') ||
                            String(options?.reason || note || '').toLowerCase().includes('đã xác nhận hoàn tiền');
    const emailStatus = isRejectRefund ? 'REJECTED' : (isApproveRefund ? 'APPROVED' : mappedStatus);

    if (targetEmail) {
      sendOrderNotificationEmail({
        toEmail: targetEmail,
        order: fullOrder,
        status: emailStatus,
        extraData: {
          note,
          reason: cancelReason,
          cancelledBy: cancBy,
          isShopCancelled: isShopCanc,
          ...options,
        },
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

  let targetEmail = null;
  if (recipientEmail && recipientEmail.includes('@')) targetEmail = recipientEmail.trim();
  else if (fullOrder?.recipient_email && fullOrder.recipient_email.includes('@')) targetEmail = fullOrder.recipient_email.trim();
  else if (fullOrder?.customer?.email && fullOrder.customer.email.includes('@')) targetEmail = fullOrder.customer.email.trim();
  else if (extraData?.recipientEmail && extraData.recipientEmail.includes('@')) targetEmail = extraData.recipientEmail.trim();
  else if (extraData?.customerEmail && extraData.customerEmail.includes('@')) targetEmail = extraData.customerEmail.trim();
  else if (extraData?.userEmail && extraData.userEmail.includes('@')) targetEmail = extraData.userEmail.trim();

  if (!targetEmail) {
    return { success: false, message: 'Không tìm thấy địa chỉ email hợp lệ để gửi thông báo' };
  }

  const orderPayload = fullOrder || {
    order_id: orderId,
    order_number: orderNumber || `YF-${orderId}`,
    recipient_email: targetEmail,
    recipient_name: extraData?.recipientName || 'Quý khách',
    recipient_phone: extraData?.recipientPhone || '',
    shipping_address_line: extraData?.shippingAddress || '',
    total_amount: extraData?.totalAmount || 0,
    order_status: newStatus,
    order_items: extraData?.items || [],
  };

  const lastResult = await sendOrderNotificationEmail({
    toEmail: targetEmail,
    order: { ...orderPayload, recipient_email: targetEmail },
    status: newStatus,
    extraData,
  });

  return lastResult || { success: true };
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
  } catch {
    // Bỏ qua lỗi PayOS khi xóa đơn
  }
  return await orderRepo.deleteOrderById(orderId);
};
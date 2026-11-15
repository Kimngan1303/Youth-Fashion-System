import { prisma } from './prisma.js';

/**
 * Repository xử lý các thao tác cơ sở dữ liệu liên quan đến Đơn hàng (Orders) và Thanh toán (Payments)
 */

export const createOrderTransaction = async ({
  orderData,
  itemsData,
  paymentData,
  customerId,
  voucherCode,
}) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Tạo bản ghi Đơn hàng chính (Order)
    const order = await tx.order.create({
      data: {
        order_number: orderData.order_number,
        customer_id: customerId ? BigInt(customerId) : null,
        recipient_name: orderData.recipient_name,
        recipient_phone: orderData.recipient_phone,
        recipient_email: orderData.recipient_email || null,
        shipping_address_line: orderData.shipping_address_line,
        shipping_ward: orderData.shipping_ward || null,
        shipping_district: orderData.shipping_district || null,
        shipping_city: orderData.shipping_city,
        total_amount: orderData.total_amount,
        order_status: orderData.order_status || 'PENDING',
        note: orderData.note || null,
        voucher_code: voucherCode ? String(voucherCode).toUpperCase().trim() : null,
      },
    });

    // 1b. Ghi lại lịch sử trạng thái khởi tạo đơn hàng
    if (tx.orderStatusHistory?.create) {
      await tx.orderStatusHistory.create({
        data: {
          order_id: order.order_id,
          from_status: null,
          to_status: order.order_status,
          note: 'Khởi tạo đơn hàng mới',
        },
      });
    }

    // Lấy biến thể dự phòng đầu tiên trong CSDL để đảm bảo không bao giờ bị lỗi khóa ngoại
    const defaultVariant = await tx.productVariant.findFirst({
      select: { variant_id: true, stock: true },
    });

    const resolvedVariantIdsForCart = [];

    // 2. Tạo các chi tiết sản phẩm đơn hàng (OrderItem)
    for (const item of itemsData) {
      let resolvedVariantId = null;

      // Bước 2.1: Nếu item.variant_id là số hợp lệ
      if (item.variant_id && !isNaN(Number(item.variant_id)) && !String(item.variant_id).includes('-')) {
        const check = await tx.productVariant.findUnique({
          where: { variant_id: BigInt(item.variant_id) },
          select: { variant_id: true },
        });
        if (check) {
          resolvedVariantId = check.variant_id;
        }
      }

      // Bước 2.2: Nếu chưa có variant_id, tìm theo product_id và size (xử lý chuỗi như "40-S")
      if (!resolvedVariantId) {
        const rawProdId =
          item.product_id ||
          (typeof item.variant_id === 'string' ? item.variant_id.split('-')[0] : null);

        if (rawProdId && !isNaN(Number(rawProdId))) {
          const match =
            (await tx.productVariant.findFirst({
              where: {
                product_id: BigInt(rawProdId),
                ...(item.size ? { size: item.size } : {}),
              },
              select: { variant_id: true },
            })) ||
            (await tx.productVariant.findFirst({
              where: { product_id: BigInt(rawProdId) },
              select: { variant_id: true },
            }));

          if (match) {
            resolvedVariantId = match.variant_id;
          }
        }
      }

      // Bước 2.3: Nếu chưa tìm thấy, tìm theo tên sản phẩm
      if (!resolvedVariantId && item.product_name) {
        try {
          const prodMatch = await tx.product.findFirst({
            where: {
              product_name: {
                contains: String(item.product_name).trim().slice(0, 30),
              },
            },
            include: { variants: true },
          });
          if (prodMatch?.variants?.length > 0) {
            resolvedVariantId = prodMatch.variants[0].variant_id;
          }
        } catch (e) {}
      }

      // Bước 2.4: Fallback an toàn tuyệt đối
      if (!resolvedVariantId) {
        resolvedVariantId = defaultVariant?.variant_id;
      }

      if (!resolvedVariantId) {
        throw new Error('Chưa có dữ liệu biến thể sản phẩm trong hệ thống CSDL MySQL.');
      }

      resolvedVariantIdsForCart.push(resolvedVariantId);

      await tx.orderItem.create({
        data: {
          order_id: order.order_id,
          variant_id: resolvedVariantId,
          product_name: item.product_name,
          sku: item.sku || '',
          size: item.size || 'M',
          color: item.color || '',
          unit_price: item.unit_price,
          quantity: Number(item.quantity || 1),
          subtotal: item.subtotal,
        },
      });

      // Trừ tồn kho nếu variant còn tồn kho
      await tx.productVariant.updateMany({
        where: {
          variant_id: resolvedVariantId,
          stock: { gte: Number(item.quantity || 1) },
        },
        data: {
          stock: { decrement: Number(item.quantity || 1) },
        },
      });
    }

    // 3. Tạo thông tin thanh toán (Payment)
    const payment = await tx.payment.create({
      data: {
        order_id: order.order_id,
        payment_method: paymentData.payment_method, // 'PAYOS' hoặc 'COD'
        payment_status: paymentData.payment_status || 'PENDING',
        amount: orderData.total_amount,
        provider_payment_id: paymentData.provider_payment_id || null,
      },
    });

    // 4. Nếu có áp dụng voucher: Với COD tăng used_count ngay, với PAYOS chỉ tăng khi thanh toán thành công
    if (voucherCode && paymentData.payment_method === 'COD') {
      await tx.voucher.updateMany({
        where: { code: voucherCode.toUpperCase().trim() },
        data: { used_count: { increment: 1 } },
      });
    }

    // 5. Nếu phương thức thanh toán là COD, xóa các sản phẩm vừa mua ra khỏi giỏ hàng
    if (customerId && paymentData.payment_method === 'COD') {
      const customerCart = await tx.cart.findUnique({
        where: { customer_id: BigInt(customerId) },
      });

      if (customerCart) {
        await tx.cartItem.deleteMany({
          where: {
            cart_id: customerCart.cart_id,
            variant_id: { in: resolvedVariantIdsForCart },
          },
        });
      }
    }

    return {
      ...order,
      order_items: itemsData,
      payment,
    };
  });
};

export const findOrderByNumber = async (orderNumber) => {
  return await prisma.order.findUnique({
    where: { order_number: orderNumber },
    include: {
      order_items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: true,
                  category: true,
                  brand: true,
                },
              },
            },
          },
        },
      },
      payments: true,
      status_history: {
        orderBy: { created_at: 'asc' },
      },
      return_requests: {
        orderBy: { created_at: 'desc' },
      },
      customer: {
        select: {
          customer_id: true,
          full_name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
};

export const findOrderByIdOrNumber = async (orderIdOrNumber) => {
  const rawStr = String(orderIdOrNumber || '').trim();
  if (!rawStr) return null;

  const conditions = [{ order_number: rawStr }];
  if (rawStr.startsWith('YF-')) {
    const withoutPrefix = rawStr.replace(/^YF-/, '');
    if (withoutPrefix) conditions.push({ order_number: withoutPrefix });
  } else {
    conditions.push({ order_number: `YF-${rawStr}` });
  }

  if (!isNaN(Number(rawStr)) && /^\d+$/.test(rawStr)) {
    try {
      conditions.push({ order_id: BigInt(rawStr) });
    } catch (e) {}
  }

  return await prisma.order.findFirst({
    where: { OR: conditions },
    include: {
      status_history: { orderBy: { created_at: 'asc' } },
      return_requests: { orderBy: { created_at: 'desc' } },
      order_items: true,
      payments: true,
      customer: true,
    },
  });
};

export const findOrdersByCustomer = async ({ customerId, email } = {}) => {
  const conditions = [];
  if (customerId && !isNaN(Number(customerId))) {
    try {
      conditions.push({ customer_id: BigInt(customerId) });
    } catch (e) {}
  }
  if (email && typeof email === 'string' && email.trim()) {
    conditions.push({ recipient_email: email.trim() });
  }

  if (conditions.length === 0) return [];

  const orders = await prisma.order.findMany({
    where: {
      OR: conditions,
    },
    orderBy: { created_at: 'desc' },
    include: {
      order_items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: true,
                  category: true,
                },
              },
            },
          },
        },
      },
      payments: true,
      status_history: {
        orderBy: { created_at: 'asc' },
      },
      return_requests: {
        orderBy: { created_at: 'desc' },
      },
    },
  });

  // Lọc bỏ đơn PayOS nháp đang ở PENDING nhưng chưa thanh toán qua PayOS (chưa hoàn tất bước quét mã QR)
  return orders.filter((o) => {
    const isPayos = o.payments?.some((p) => p.payment_method === 'PAYOS');
    if (isPayos) {
      const isPaid = o.payments?.some((p) => p.payment_status === 'SUCCESS' || p.payment_status === 'PAID');
      if (o.order_status === 'PENDING' && !isPaid) {
        return false;
      }
    }
    return true;
  });
};

export const findAllOrders = async () => {
  const orders = await prisma.order.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      customer: {
        select: {
          customer_id: true,
          full_name: true,
          phone: true,
          email: true,
        },
      },
      order_items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: true,
                  category: true,
                },
              },
            },
          },
        },
      },
      payments: true,
      status_history: {
        orderBy: { created_at: 'asc' },
      },
      return_requests: {
        orderBy: { created_at: 'desc' },
      },
    },
  });

  // Lọc bỏ đơn PayOS nháp đang ở PENDING nhưng chưa thanh toán qua PayOS (chưa hoàn tất bước quét mã QR)
  return orders.filter((o) => {
    const isPayos = o.payments?.some((p) => p.payment_method === 'PAYOS');
    if (isPayos) {
      const isPaid = o.payments?.some((p) => p.payment_status === 'SUCCESS' || p.payment_status === 'PAID');
      if (o.order_status === 'PENDING' && !isPaid) {
        return false;
      }
    }
    return true;
  });
};

export const findOrdersByCustomerId = async (customerId) => {
  return await findOrdersByCustomer({ customerId });
};

export const clearAllOrders = async () => {
  try {
    await prisma.returnRequest.deleteMany({});
  } catch (e) {}
  try {
    await prisma.orderStatusHistory.deleteMany({});
  } catch (e) {}
  try {
    await prisma.payment.deleteMany({});
  } catch (e) {}
  try {
    await prisma.orderItem.deleteMany({});
  } catch (e) {}
  try {
    return await prisma.order.deleteMany({});
  } catch (e) {}
  return { count: 0 };
};

export const deleteOrderById = async (orderIdOrNumber) => {
  try {
    const rawStr = String(orderIdOrNumber || '').trim();
    if (!rawStr) return { count: 0 };

    const conditions = [{ order_number: rawStr }];
    if (rawStr.startsWith('YF-')) {
      const withoutPrefix = rawStr.replace(/^YF-/, '');
      if (withoutPrefix) conditions.push({ order_number: withoutPrefix });
    } else {
      conditions.push({ order_number: `YF-${rawStr}` });
    }
    if (!isNaN(Number(rawStr)) && /^\d+$/.test(rawStr)) {
      try {
        conditions.push({ order_id: BigInt(rawStr) });
      } catch (e) {}
    }

    const foundOrders = await prisma.order.findMany({
      where: { OR: conditions },
      include: { order_items: true },
    });

    for (const ord of foundOrders) {
      if (ord.order_items && ord.order_items.length > 0) {
        for (const it of ord.order_items) {
          if (it.variant_id) {
            await prisma.productVariant.updateMany({
              where: { variant_id: it.variant_id },
              data: { stock: { increment: Number(it.quantity || 1) } },
            }).catch(() => {});
          }
        }
      }
    }

    const ids = foundOrders.map((o) => o.order_id);
    if (ids.length > 0) {
      await prisma.returnRequest.deleteMany({ where: { order_id: { in: ids } } });
      await prisma.orderStatusHistory.deleteMany({ where: { order_id: { in: ids } } });
      await prisma.payment.deleteMany({ where: { order_id: { in: ids } } });
      await prisma.orderItem.deleteMany({ where: { order_id: { in: ids } } });
      return await prisma.order.deleteMany({ where: { order_id: { in: ids } } });
    }
  } catch (e) {
    console.error('Error deleting order in DB:', e.message);
  }
  return { count: 0 };
};

export const updateOrderStatus = async (orderIdOrNumber, status, note = null, options = {}) => {
  try {
    const existingOrder = await findOrderByIdOrNumber(orderIdOrNumber);
    if (!existingOrder) return null;

    // Ánh xạ trạng thái an toàn sang Enum OrderStatus của Prisma CSDL MySQL
    let prismaStatus = 'PENDING';
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED') {
      prismaStatus = 'COMPLETED';
    } else if (s === 'DELIVERY_FAILED' || s === 'FAILED_DELIVERY') {
      prismaStatus = 'DELIVERY_FAILED';
    } else if (['DELIVERED', 'SUCCESS'].includes(s)) {
      prismaStatus = 'DELIVERED';
    } else if (['SHIPPING', 'DELIVERING', 'SHIPPED', 'IN_TRANSIT'].includes(s)) {
      prismaStatus = 'SHIPPED';
    } else if (['PROCESSING', 'PREPARING'].includes(s)) {
      prismaStatus = 'PROCESSING';
    } else if (['CONFIRMED'].includes(s)) {
      prismaStatus = 'CONFIRMED';
    } else if (['RETURNED', 'REFUNDED', 'EXCHANGE'].includes(s)) {
      prismaStatus = 'RETURNED';
    } else if (['CANCELLED', 'FAILED'].includes(s)) {
      prismaStatus = 'CANCELLED';
    }

    if (prismaStatus === 'CANCELLED') {
      return await cancelOrder(existingOrder.order_id, note || 'Shop hủy đơn hàng', options);
    }

    const employeeId = options?.employeeId ? BigInt(options.employeeId) : null;
    const returnData = {
      ...(options?.returnRequestData || {}),
      ...(options?.returnRequest || {}),
    };
    if (options?.refund_decision === 'REJECTED' || options?.refund_decision === 'APPROVED') {
      returnData.status = options.refund_decision === 'REJECTED' ? 'REJECTED' : 'COMPLETED';
    }
    if (options?.reject_reason || options?.rejectReason) {
      returnData.reject_reason = options?.reject_reason || options?.rejectReason;
    }

    return await prisma.$transaction(async (tx) => {
      const updateData = { order_status: prismaStatus };
      if (note !== undefined && note !== null && String(note).trim() !== '') {
        updateData.note = String(note).slice(0, 500);
      }
      if (employeeId) {
        updateData.managed_by_employee_id = employeeId;
      }
      if (prismaStatus === 'DELIVERED') {
        updateData.delivered_at = new Date();
      } else if (prismaStatus === 'COMPLETED') {
        updateData.completed_at = new Date();
      } else if (prismaStatus === 'DELIVERY_FAILED') {
        updateData.delivery_attempts = { increment: 1 };
      }

      const updatedOrder = await tx.order.update({
        where: { order_id: existingOrder.order_id },
        data: updateData,
      });

      // Ghi nhận lịch sử thay đổi trạng thái vào bảng order_status_history
      if (tx.orderStatusHistory?.create) {
        await tx.orderStatusHistory.create({
          data: {
            order_id: existingOrder.order_id,
            from_status: existingOrder.order_status,
            to_status: prismaStatus,
            changed_by_employee_id: employeeId,
            note: note ? String(note).slice(0, 500) : `Chuyển trạng thái từ ${existingOrder.order_status} sang ${prismaStatus}`,
          },
        });
      }

      // Tạo thông báo Web trong bảng notifications cho khách hàng
      if (existingOrder.customer_id) {
        let notifTitle = 'Cập nhật đơn hàng';
        let notifMsg = `Đơn hàng #${existingOrder.order_number} vừa được cập nhật trạng thái mới.`;
        let notifBadge = 'CẬP NHẬT';

        if (prismaStatus === 'CONFIRMED') {
          notifTitle = 'Đơn hàng đã được xác nhận';
          notifMsg = `Đơn hàng #${existingOrder.order_number} đã được Shop xác nhận thành công và đang chuyển sang khâu đóng gói.`;
          notifBadge = 'ĐÃ XÁC NHẬN';
        } else if (prismaStatus === 'SHIPPED') {
          notifTitle = 'Đơn hàng đang được vận chuyển';
          notifMsg = `Đơn hàng #${existingOrder.order_number} đang trên đường giao tới bạn. Shipper sẽ liên hệ trước khi phát.`;
          notifBadge = 'ĐANG VẬN CHUYỂN';
        } else if (prismaStatus === 'DELIVERY_FAILED') {
          notifTitle = 'Giao hàng chưa thành công';
          notifMsg = `Đơn hàng #${existingOrder.order_number} giao chưa thành công. Shipper hoặc Shop sẽ liên hệ lại với bạn.`;
          notifBadge = 'GIAO THẤT BẠI';
        } else if (prismaStatus === 'DELIVERED') {
          notifTitle = 'Đơn hàng đã giao thành công';
          notifMsg = `Đơn hàng #${existingOrder.order_number} đã được giao tận tay bạn. Vui lòng kiểm tra và xác nhận đã nhận hàng.`;
          notifBadge = 'ĐÃ GIAO';
        } else if (prismaStatus === 'COMPLETED') {
          notifTitle = 'Đơn hàng đã hoàn tất';
          notifMsg = `Đơn hàng #${existingOrder.order_number} đã hoàn tất thành công. Cảm ơn Quý khách đã mua sắm tại Youth Fashion!`;
          notifBadge = 'HOÀN TẤT';
        } else if (prismaStatus === 'RETURNED') {
          const isRej = options?.refund_decision === 'REJECTED' || String(note || '').toLowerCase().includes('từ chối hoàn');
          const isApp = !isRej && (options?.refund_decision === 'APPROVED' || String(note || '').toLowerCase().includes('đã hoàn tiền') || String(note || '').toLowerCase().includes('đã xác nhận hoàn tiền'));
          if (isRej) {
            notifTitle = 'Từ chối hoàn tiền';
            notifMsg = `Shop đã từ chối yêu cầu hoàn tiền cho đơn hàng #${existingOrder.order_number}.`;
            notifBadge = 'TỪ CHỐI HOÀN';
          } else if (isApp) {
            notifTitle = 'Hoàn tiền thành công';
            notifMsg = `Shop đã phê duyệt yêu cầu đổi trả và hoàn tiền cho đơn hàng #${existingOrder.order_number}.`;
            notifBadge = 'ĐÃ HOÀN TIỀN';
          } else {
            notifTitle = 'Đã tiếp nhận yêu cầu đổi trả';
            notifMsg = `Shop đã tiếp nhận yêu cầu đổi trả & hoàn tiền cho đơn hàng #${existingOrder.order_number}.`;
            notifBadge = 'CHỜ HOÀN TIỀN';
          }
        }

        const digits = String(existingOrder.order_number).replace(/\D/g, '') || String(existingOrder.order_id);
        await tx.notification.create({
          data: {
            customer_id: existingOrder.customer_id,
            notification_type: 'ORDER',
            title: notifTitle,
            message: notifMsg,
            reference_id: existingOrder.order_id,
            link: `/profile?tab=orders&order=${digits}`,
            data: {
              order_number: existingOrder.order_number,
              status: prismaStatus,
              badge: notifBadge,
            },
          },
        });
      }

      // Nếu chuyển sang RETURNED -> Tự động đồng bộ vào bảng chuẩn hóa return_requests
      if (prismaStatus === 'RETURNED') {
        const noteStr = String(note || existingOrder.note || '');
        const noteLow = noteStr.toLowerCase();

        // Phân tích trạng thái yêu cầu hoàn/đổi từ dữ liệu truyền vào hoặc chuỗi note
        let reqStatus = returnData.status || 'PENDING';
        if (!returnData.status) {
          if (noteLow.includes('đã xác nhận hoàn tiền') || noteLow.includes('đã hoàn tiền')) {
            reqStatus = 'COMPLETED';
          } else if (noteLow.includes('từ chối hoàn')) {
            reqStatus = 'REJECTED';
          } else if (noteLow.includes('đã duyệt')) {
            reqStatus = 'APPROVED';
          }
        }

        let bankInfo = returnData.bank_info || null;
        if (!bankInfo && noteStr.includes('STK:')) {
          bankInfo = noteStr.split('STK:')[1]?.trim() || null;
        }

        let rejectReason = returnData.reject_reason || null;
        if (!rejectReason && noteStr.includes('Từ chối hoàn tiền:')) {
          rejectReason = noteStr.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim() || null;
        }

        let reasonText = returnData.reason || null;
        if (!reasonText) {
          if (noteStr.includes('Khách yêu cầu hoàn tiền:')) {
            reasonText = noteStr.replace('Khách yêu cầu hoàn tiền:', '').split('STK:')[0].replace('|', '').trim();
          } else if (noteStr.includes('Lý do khách gửi:')) {
            reasonText = noteStr.split('Lý do khách gửi:')[1]?.trim();
          } else {
            reasonText = noteStr || 'Khách hàng yêu cầu đổi trả / hoàn tiền';
          }
        }

        const reqType = returnData.type === 'EXCHANGE' || s === 'EXCHANGE' ? 'EXCHANGE' : 'REFUND';
        const refundAmt = returnData.refund_amount !== undefined
          ? Number(returnData.refund_amount)
          : Number(existingOrder.total_amount || 0);

        if (tx.returnRequest) {
          const existingReturn = await tx.returnRequest.findFirst({
            where: { order_id: existingOrder.order_id },
            orderBy: { created_at: 'desc' },
          });

          if (existingReturn) {
            await tx.returnRequest.update({
              where: { return_request_id: existingReturn.return_request_id },
              data: {
                status: reqStatus,
                ...(returnData.refund_amount !== undefined ? { refund_amount: refundAmt } : {}),
                ...(bankInfo ? { bank_info: bankInfo.slice(0, 500) } : {}),
                reject_reason: reqStatus === 'REJECTED' ? (rejectReason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop').slice(0, 500) : null,
                ...(employeeId ? { processed_by_employee_id: employeeId } : {}),
                ...(returnData.images ? { images: returnData.images } : {}),
              },
            });
          } else if (tx.returnRequest?.create) {
            await tx.returnRequest.create({
              data: {
                order_id: existingOrder.order_id,
                reason: reasonText || 'Yêu cầu đổi trả',
                type: reqType,
                status: reqStatus,
                refund_amount: refundAmt,
                bank_info: bankInfo ? bankInfo.slice(0, 500) : null,
                images: returnData.images || null,
                reject_reason: rejectReason ? rejectReason.slice(0, 500) : null,
                processed_by_employee_id: employeeId,
              },
            });
          }
        }

        // Cập nhật trạng thái thanh toán sang REFUNDED khi hoàn tiền thành công, hoặc hoàn về SUCCESS khi từ chối hoàn
        if (reqStatus === 'REJECTED' || noteLow.includes('từ chối hoàn')) {
          if (tx.payment?.updateMany) {
            await tx.payment.updateMany({
              where: { order_id: existingOrder.order_id },
              data: { payment_status: 'SUCCESS' },
            });
          }
        } else if (reqStatus === 'COMPLETED' || reqStatus === 'APPROVED' || noteLow.includes('đã xác nhận hoàn tiền') || noteLow.includes('đã hoàn tiền')) {
          if (tx.payment?.updateMany) {
            await tx.payment.updateMany({
              where: { order_id: existingOrder.order_id },
              data: { payment_status: 'REFUNDED' },
            });
          }
        }
      }

      return updatedOrder;
    });
  } catch (e) {
    console.error('Error updating order status in DB:', e.message);
  }
  return null;
};

export const cancelOrder = async (orderIdOrNumber, reason = 'Khách hàng yêu cầu hủy đơn', options = {}) => {
  const cancelText = reason ? String(reason).trim() : 'Khách hàng yêu cầu hủy đơn';
  const isShop = options?.isShopCancelled || options?.cancelledBy === 'SHOP';
  const cancelNote = isShop
    ? (cancelText.startsWith('Shop hủy đơn:') ? cancelText : `Shop hủy đơn: ${cancelText}`)
    : (cancelText.startsWith('Khách hủy đơn:') ? cancelText : `Khách hủy đơn: ${cancelText}`);

  const existingOrder = await findOrderByIdOrNumber(orderIdOrNumber);
  if (!existingOrder) return null;

  return await prisma.$transaction(async (tx) => {
    // 1. Kiểm tra trạng thái hiện tại trong transaction để tránh hoàn kho / voucher 2 lần
    const freshOrder = await tx.order.findUnique({
      where: { order_id: existingOrder.order_id },
      include: { order_items: true, payments: true },
    });

    if (!freshOrder || freshOrder.order_status === 'CANCELLED') {
      return freshOrder || existingOrder;
    }

    // 2. Cập nhật Order sang CANCELLED
    const updated = await tx.order.update({
      where: { order_id: existingOrder.order_id },
      data: {
        order_status: 'CANCELLED',
        note: cancelNote.slice(0, 500),
      },
    });

    // 3. Cập nhật Payment sang CANCELLED nếu đang PENDING
    await tx.payment.updateMany({
      where: {
        order_id: existingOrder.order_id,
        payment_status: 'PENDING',
      },
      data: {
        payment_status: 'CANCELLED',
        failure_reason: cancelNote.slice(0, 500),
      },
    });

    // 4. Hoàn lại tồn kho cho các biến thể sản phẩm (đảm bảo atomic)
    if (freshOrder.order_items && freshOrder.order_items.length > 0) {
      for (const it of freshOrder.order_items) {
        if (it.variant_id) {
          await tx.productVariant.updateMany({
            where: { variant_id: it.variant_id },
            data: { stock: { increment: Number(it.quantity || 1) } },
          });
        }
      }
    }

    // 5. Hoàn lượt voucher nếu đơn đã áp dụng (COD hoặc PayOS đã thanh toán)
    const hasPaidPayos = freshOrder.payments?.some((p) => p.payment_method === 'PAYOS' && (p.payment_status === 'SUCCESS' || p.payment_status === 'PAID'));
    const isCod = freshOrder.payments?.some((p) => p.payment_method === 'COD');
    if (freshOrder.voucher_code && (isCod || hasPaidPayos)) {
      await tx.voucher.updateMany({
        where: {
          code: String(freshOrder.voucher_code).toUpperCase().trim(),
          used_count: { gt: 0 },
        },
        data: {
          used_count: { decrement: 1 },
        },
      });
    }

    // 6. Ghi nhật ký lịch sử OrderStatusHistory
    await tx.orderStatusHistory.create({
      data: {
        order_id: existingOrder.order_id,
        from_status: freshOrder.order_status,
        to_status: 'CANCELLED',
        changed_by_employee_id: options?.employeeId ? BigInt(options.employeeId) : null,
        note: cancelNote.slice(0, 500),
      },
    });

    // 7. Tạo thông báo trong CSDL cho khách hàng
    if (existingOrder.customer_id) {
      const digits = String(existingOrder.order_number).replace(/\D/g, '') || String(existingOrder.order_id);
      await tx.notification.create({
        data: {
          customer_id: existingOrder.customer_id,
          notification_type: 'ORDER',
          title: isShop ? 'Shop đã hủy đơn hàng' : 'Đơn hàng đã được hủy',
          message: isShop
            ? `Shop đã hủy đơn hàng #${existingOrder.order_number}. Lý do: "${cancelText}".`
            : `Đơn hàng #${existingOrder.order_number} đã được hủy theo yêu cầu của bạn.`,
          reference_id: existingOrder.order_id,
          link: `/profile?tab=orders&order=${digits}`,
          data: {
            order_number: existingOrder.order_number,
            status: 'CANCELLED',
            badge: isShop ? 'SHOP HỦY ĐƠN' : 'ĐÃ HỦY ĐƠN',
            reason: cancelText,
            cancelled_by: isShop ? 'SHOP' : 'CUSTOMER',
          },
        },
      });
    }

    return updated;
  });
};

export const updatePaymentStatus = async (orderId, paymentStatus, extra = {}) => {
  return await prisma.payment.updateMany({
    where: { order_id: BigInt(orderId) },
    data: {
      payment_status: paymentStatus,
      paid_at: paymentStatus === 'SUCCESS' ? new Date() : null,
      provider_transaction_id: extra.transactionId || null,
      provider_payment_id: extra.paymentLinkId || undefined,
    },
  });
};

/**
 * Tra cứu đơn hàng linh hoạt theo orderId hoặc orderNumber
 */
export const findOrderAny = async (orderIdOrNumber) => {
  if (!orderIdOrNumber) return null;
  const rawStr = String(orderIdOrNumber).trim();
  if (!rawStr) return null;

  const conditions = [{ order_number: rawStr }];
  if (rawStr.startsWith('YF-')) {
    const withoutPrefix = rawStr.replace(/^YF-/, '');
    if (withoutPrefix) conditions.push({ order_number: withoutPrefix });
  } else {
    conditions.push({ order_number: `YF-${rawStr}` });
  }

  if (!isNaN(Number(rawStr)) && /^\d+$/.test(rawStr)) {
    try {
      conditions.push({ order_id: BigInt(rawStr) });
    } catch (e) {}
  }

  try {
    return await prisma.order.findFirst({
      where: { OR: conditions },
      include: {
        order_items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: true,
                    category: true,
                    brand: true,
                  },
                },
              },
            },
          },
        },
        payments: true,
        customer: true,
        status_history: { orderBy: { created_at: 'asc' } },
        return_requests: { orderBy: { created_at: 'desc' } },
      },
    });
  } catch (e) {
    console.error('Lỗi khi tra cứu đơn hàng linh hoạt:', e.message);
    return null;
  }
};


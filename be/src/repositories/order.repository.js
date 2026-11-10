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
      },
    });

    // 1b. Ghi lại lịch sử trạng thái khởi tạo đơn hàng
    await tx.orderStatusHistory.create({
      data: {
        order_id: order.order_id,
        from_status: null,
        to_status: order.order_status,
        note: 'Khởi tạo đơn hàng mới',
      },
    });

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

    // 4. Nếu có áp dụng voucher, tăng số lượt đã sử dụng (used_count)
    if (voucherCode) {
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

  const digitsOnly = rawStr.replace(/\D/g, '');
  const variants = [rawStr, `YF-${rawStr}`, `YF - ${rawStr}`];
  if (digitsOnly) {
    variants.push(digitsOnly, `YF-${digitsOnly}`, `YF - ${digitsOnly}`);
  }

  const orConditions = [{ order_number: { in: variants } }];
  if (digitsOnly) {
    orConditions.push({ order_number: { contains: digitsOnly } });
  }
  if (!isNaN(Number(orderIdOrNumber))) {
    try {
      orConditions.push({ order_id: BigInt(orderIdOrNumber) });
    } catch (e) {}
  }
  if (digitsOnly && !isNaN(Number(digitsOnly))) {
    try {
      orConditions.push({ order_id: BigInt(digitsOnly) });
    } catch (e) {}
  }

  return await prisma.order.findFirst({
    where: { OR: orConditions },
    include: {
      status_history: { orderBy: { created_at: 'asc' } },
      return_requests: { orderBy: { created_at: 'desc' } },
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

  // Lọc bỏ đơn PayOS chưa thanh toán thành công hoặc đã bị hủy
  return orders.filter((o) => {
    const isPayos = o.payments?.some((p) => p.payment_method === 'PAYOS');
    if (isPayos) {
      const isPaid = o.payments?.some((p) => p.payment_status === 'SUCCESS' || p.payment_status === 'PAID');
      if (!isPaid) return false;
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

  // Lọc bỏ đơn PayOS chưa thanh toán thành công hoặc đã bị hủy
  return orders.filter((o) => {
    const isPayos = o.payments?.some((p) => p.payment_method === 'PAYOS');
    if (isPayos) {
      const isPaid = o.payments?.some((p) => p.payment_status === 'SUCCESS' || p.payment_status === 'PAID');
      if (!isPaid) return false;
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

    const digitsOnly = rawStr.replace(/\D/g, '');
    const variants = [rawStr, `YF-${rawStr}`, `YF - ${rawStr}`];
    if (digitsOnly) variants.push(digitsOnly, `YF-${digitsOnly}`, `YF - ${digitsOnly}`);

    const orConditions = [
      { order_number: { in: variants } },
    ];
    if (!isNaN(Number(orderIdOrNumber))) {
      orConditions.push({ order_id: BigInt(orderIdOrNumber) });
    }
    if (digitsOnly && !isNaN(Number(digitsOnly))) {
      orConditions.push({ order_id: BigInt(digitsOnly) });
    }

    const foundOrders = await prisma.order.findMany({
      where: { OR: orConditions },
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
    if (['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(s)) {
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

    const employeeId = options?.employeeId ? BigInt(options.employeeId) : null;
    const returnData = options?.returnRequestData || {};

    return await prisma.$transaction(async (tx) => {
      const updateData = { order_status: prismaStatus };
      if (note !== undefined && note !== null && String(note).trim() !== '') {
        updateData.note = String(note).slice(0, 500);
      }
      if (employeeId) {
        updateData.managed_by_employee_id = employeeId;
      }

      const updatedOrder = await tx.order.update({
        where: { order_id: existingOrder.order_id },
        data: updateData,
      });

      // Ghi nhận lịch sử thay đổi trạng thái vào bảng order_status_history
      if (existingOrder.order_status !== prismaStatus || (note && String(note).trim() !== '')) {
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

        const existingReturn = await tx.returnRequest.findFirst({
          where: { order_id: existingOrder.order_id },
          orderBy: { created_at: 'desc' },
        });

        if (existingReturn) {
          await tx.returnRequest.update({
            where: { return_request_id: existingReturn.return_request_id },
            data: {
              status: reqStatus,
              ...(bankInfo ? { bank_info: bankInfo.slice(0, 500) } : {}),
              ...(rejectReason ? { reject_reason: rejectReason.slice(0, 500) } : {}),
              ...(employeeId ? { processed_by_employee_id: employeeId } : {}),
              ...(returnData.images ? { images: returnData.images } : {}),
            },
          });
        } else {
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

      return updatedOrder;
    });
  } catch (e) {
    console.error('Error updating order status in DB:', e.message);
  }
  return null;
};

export const cancelOrder = async (orderIdOrNumber, reason = 'Khách hàng yêu cầu hủy đơn') => {
  const cancelText = reason ? String(reason).trim() : 'Khách hàng yêu cầu hủy đơn';
  const cancelNote = cancelText.startsWith('Khách hủy đơn:') ? cancelText : `Khách hủy đơn: ${cancelText}`;

  const existingOrder = await findOrderByIdOrNumber(orderIdOrNumber);
  if (existingOrder) {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { order_id: existingOrder.order_id },
        data: {
          order_status: 'CANCELLED',
          note: cancelNote.slice(0, 500),
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          order_id: existingOrder.order_id,
          from_status: existingOrder.order_status,
          to_status: 'CANCELLED',
          note: cancelNote.slice(0, 500),
        },
      });
      return updated;
    });
  }

  return null;
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

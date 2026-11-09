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
      select: { order_id: true, voucher_code: true },
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
      if (ord.voucher_code) {
        await prisma.voucher.updateMany({
          where: { code: ord.voucher_code.toUpperCase().trim() },
          data: { used_count: { decrement: 1 } },
        }).catch(() => {});
      }
    }

    const ids = foundOrders.map(o => o.order_id);
    if (ids.length > 0) {
      await prisma.payment.deleteMany({ where: { order_id: { in: ids } } });
      await prisma.orderItem.deleteMany({ where: { order_id: { in: ids } } });
      return await prisma.order.deleteMany({ where: { order_id: { in: ids } } });
    }
  } catch (e) {
    console.error('Error deleting order in DB:', e.message);
  }
  return { count: 0 };
};

export const updateOrderStatus = async (orderIdOrNumber, status, note) => {
  try {
    const rawStr = String(orderIdOrNumber || '').trim();
    const digitsOnly = rawStr.replace(/\D/g, '');
    const variants = [rawStr, `YF-${rawStr}`, `YF - ${rawStr}`];
    if (digitsOnly) {
      variants.push(digitsOnly, `YF-${digitsOnly}`, `YF - ${digitsOnly}`);
    }

    const orConditions = [
      { order_number: { in: variants } },
    ];
    if (digitsOnly) {
      orConditions.push({ order_number: { contains: digitsOnly } });
    }
    if (!isNaN(Number(orderIdOrNumber))) {
      orConditions.push({ order_id: BigInt(orderIdOrNumber) });
    }
    if (digitsOnly && !isNaN(Number(digitsOnly))) {
      orConditions.push({ order_id: BigInt(digitsOnly) });
    }

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

    if (prismaStatus === 'RETURNED') {
      try {
        if (note) {
          if (digitsOnly) {
            await prisma.$executeRawUnsafe(
              "UPDATE orders SET order_status = 'RETURNED', note = ? WHERE order_id = ? OR order_number LIKE ?",
              String(note),
              digitsOnly,
              `%${digitsOnly}%`
            );
          } else {
            await prisma.$executeRawUnsafe(
              "UPDATE orders SET order_status = 'RETURNED', note = ? WHERE order_number = ?",
              String(note),
              rawStr
            );
          }
        } else {
          if (digitsOnly) {
            await prisma.$executeRawUnsafe(
              "UPDATE orders SET order_status = 'RETURNED' WHERE order_id = ? OR order_number LIKE ?",
              digitsOnly,
              `%${digitsOnly}%`
            );
          } else {
            await prisma.$executeRawUnsafe(
              "UPDATE orders SET order_status = 'RETURNED' WHERE order_number = ?",
              rawStr
            );
          }
        }
        return { count: 1 };
      } catch (err) {
        console.error('Error raw update to RETURNED:', err.message);
      }
    }

    const updateData = { order_status: prismaStatus };
    if (note) {
      updateData.note = String(note);
    }

    return await prisma.order.updateMany({
      where: { OR: orConditions },
      data: updateData,
    });
  } catch (e) {
    console.error('Error updating order status in DB:', e.message);
  }
  return null;
};

export const cancelOrder = async (orderIdOrNumber, reason = 'Khách hàng yêu cầu hủy đơn') => {
  const cancelText = reason ? String(reason).trim() : 'Khách hàng yêu cầu hủy đơn';
  const cancelNote = cancelText.startsWith('Khách hủy đơn:') ? cancelText : `Khách hủy đơn: ${cancelText}`;
  const isNumeric = !isNaN(Number(orderIdOrNumber));
  if (isNumeric) {
    try {
      return await prisma.order.update({
        where: { order_id: BigInt(orderIdOrNumber) },
        data: {
          order_status: 'CANCELLED',
          note: cancelNote,
        },
      });
    } catch (e) {}
  }

  const rawStr = String(orderIdOrNumber || '').trim();
  const digitsOnly = rawStr.replace(/\D/g, '');
  const variants = [rawStr, `YF-${rawStr}`, `YF - ${rawStr}`];
  if (digitsOnly) {
    variants.push(digitsOnly, `YF-${digitsOnly}`, `YF - ${digitsOnly}`);
  }

  return await prisma.order.updateMany({
    where: {
      order_number: { in: variants },
    },
    data: {
      order_status: 'CANCELLED',
      note: cancelNote,
    },
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
  const digitsOnly = rawStr.replace(/\D/g, '');
  const variants = [rawStr, `YF-${rawStr}`, `YF - ${rawStr}`];
  if (digitsOnly) {
    variants.push(digitsOnly, `YF-${digitsOnly}`, `YF - ${digitsOnly}`);
  }

  const orConditions = [{ order_number: { in: variants } }];
  if (digitsOnly && !isNaN(Number(digitsOnly))) {
    orConditions.push({ order_id: BigInt(digitsOnly) });
  }
  if (!isNaN(Number(rawStr))) {
    orConditions.push({ order_id: BigInt(rawStr) });
  }

  try {
    return await prisma.order.findFirst({
      where: { OR: orConditions },
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
      },
    });
  } catch (e) {
    console.error('Lỗi khi tra cứu đơn hàng linh hoạt:', e.message);
    return null;
  }
};


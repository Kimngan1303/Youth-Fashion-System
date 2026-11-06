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

      // Bước 2.3: Fallback an toàn tuyệt đối
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

  return await prisma.order.findMany({
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
};

export const findOrdersByCustomerId = async (customerId) => {
  return await findOrdersByCustomer({ customerId });
};

export const updateOrderStatus = async (orderId, status) => {
  return await prisma.order.update({
    where: { order_id: BigInt(orderId) },
    data: { order_status: status },
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

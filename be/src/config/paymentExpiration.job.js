import { prisma } from '../repositories/prisma.js';
import { sendOrderNotificationEmail } from '../services/email.service.js';
import * as payosService from '../services/payos.service.js';

/**
 * Background job to check and auto-cancel orders whose PayOS payment deadline has expired (5-minute rule).
 * COD orders are strictly preserved in PENDING state for shop management review.
 */
export async function processExpiredPayosOrders(now = new Date()) {
  try {
    const expiredCutoff = new Date(now.getTime() - 5 * 60 * 1000);

    // Tìm các đơn hàng PAYOS đang PENDING quá 5 phút
    const expiredOrders = await prisma.order.findMany({
      where: {
        order_status: 'PENDING',
        created_at: { lt: expiredCutoff },
        payments: {
          some: {
            payment_method: 'PAYOS',
            payment_status: 'PENDING',
          },
        },
      },
      include: {
        order_items: true,
        payments: true,
        customer: true,
      },
    });

    for (const ord of expiredOrders) {
      // Bỏ qua đơn nếu có phương thức COD
      const hasCod = ord.payments?.some((p) => p.payment_method === 'COD');
      const isPaid = ord.payments?.some((p) => p.payment_status === 'SUCCESS' || p.payment_status === 'PAID');
      if (hasCod || isPaid) continue;

      // Kiểm tra với cổng PayOS trước khi hủy đơn: Nếu khách đã thanh toán thành công trên PayOS thì cập nhật SUCCESS, KHÔNG hủy đơn
      try {
        const orderDigits = String(ord.order_number).replace(/\D/g, '') || String(ord.order_id);
        const payosInfo = await payosService.getPaymentInformation(orderDigits);
        if (payosInfo && (payosInfo.status === 'PAID' || payosInfo.isSimulation)) {
          await prisma.payment.updateMany({
            where: {
              order_id: ord.order_id,
              payment_method: 'PAYOS',
            },
            data: {
              payment_status: 'SUCCESS',
              provider_transaction_id: payosInfo.reference || `TXN_${orderDigits}`,
              paid_at: new Date(),
            },
          });
          await prisma.orderStatusHistory.create({
            data: {
              order_id: ord.order_id,
              from_status: ord.order_status,
              to_status: 'PENDING',
              note: `Thanh toán PayOS thành công (Mã GD: ${payosInfo.reference || orderDigits}). Chờ quản lý duyệt đơn.`,
            },
          });
          console.log(`[Job] Đơn hàng PayOS #${ord.order_number} đã thanh toán thành công, bỏ qua bước hủy.`);
          continue;
        }
      } catch (payosCheckErr) {
        console.warn('Lỗi kiểm tra trạng thái PayOS trong job:', payosCheckErr.message);
      }

      try {
        await prisma.$transaction(async (tx) => {
          const freshOrder = await tx.order.findUnique({
            where: { order_id: ord.order_id },
            select: { order_status: true, voucher_code: true },
          });

          if (!freshOrder || freshOrder.order_status !== 'PENDING') {
            return;
          }

          // 1. Cập nhật trạng thái đơn sang CANCELLED
          await tx.order.update({
            where: { order_id: ord.order_id },
            data: {
              order_status: 'CANCELLED',
              note: 'Hết thời gian thanh toán PayOS (quá 5 phút)',
            },
          });

          // 2. Cập nhật trạng thái thanh toán sang CANCELLED
          await tx.payment.updateMany({
            where: {
              order_id: ord.order_id,
              payment_method: 'PAYOS',
              payment_status: 'PENDING',
            },
            data: {
              payment_status: 'CANCELLED',
              failure_reason: 'Hết hạn thanh toán 5 phút',
            },
          });

          // 3. Hoàn lại tồn kho cho các biến thể sản phẩm
          if (ord.order_items && ord.order_items.length > 0) {
            for (const item of ord.order_items) {
              if (item.variant_id) {
                await tx.productVariant.updateMany({
                  where: { variant_id: item.variant_id },
                  data: { stock: { increment: Number(item.quantity || 1) } },
                });
              }
            }
          }

          // 4. Hoàn lượt voucher nếu đơn có dùng voucher
          const vCode = freshOrder.voucher_code || ord.voucher_code;
          if (vCode) {
            await tx.voucher.updateMany({
              where: {
                code: String(vCode).toUpperCase().trim(),
                used_count: { gt: 0 },
              },
              data: {
                used_count: { decrement: 1 },
              },
            });
          }

          // 5. Ghi nhật ký lịch sử trạng thái OrderStatusHistory
          await tx.orderStatusHistory.create({
            data: {
              order_id: ord.order_id,
              from_status: 'PENDING',
              to_status: 'CANCELLED',
              note: 'Hết thời gian thanh toán PayOS (quá 5 phút)',
            },
          });

          // 6. Tạo thông báo trong cơ sở dữ liệu nếu có khách hàng
          if (ord.customer_id) {
            const digits = String(ord.order_number).replace(/\D/g, '') || String(ord.order_id);
            await tx.notification.create({
              data: {
                customer_id: ord.customer_id,
                notification_type: 'ORDER',
                title: 'Đơn hàng đã tự động hủy',
                message: `Đơn hàng #${ord.order_number} đã tự động hủy do hết hạn thanh toán PayOS (quá 5 phút).`,
                reference_id: ord.order_id,
                link: `/profile?tab=orders&order=${digits}`,
                data: {
                  order_number: ord.order_number,
                  status: 'CANCELLED',
                  badge: 'ĐÃ HỦY ĐƠN',
                  reason: 'Hết thời gian thanh toán PayOS (quá 5 phút)',
                },
              },
            });
          }
        });

        // 7. Gửi email thông báo hủy đơn
        const recipientEmail = ord.recipient_email || ord.customer?.email;
        if (recipientEmail) {
          sendOrderNotificationEmail({
            toEmail: recipientEmail,
            order: ord,
            status: 'CANCELLED',
            extraData: {
              cancelledBy: 'SYSTEM',
              isShopCancelled: true,
              reason: 'Hết thời gian thanh toán PayOS (quá 5 phút)',
            },
          }).catch((e) => console.warn('Lỗi gửi email hủy đơn hết hạn:', e.message));
        }

        console.log(`[Job] Đã tự động hủy đơn hết hạn PayOS: ${ord.order_number}`);
      } catch (err) {
        console.error(`[Job Error] Lỗi khi xử lý đơn hết hạn ${ord.order_number}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[Job Error] Failed to auto-cancel expired PayOS orders:', error.message);
  }
}

/**
 * Background job to check and auto-complete orders that have been DELIVERED
 * for longer than ORDER_AUTO_COMPLETE_DAYS (default 3 days) or confirmed by customer.
 */
export async function processAutoCompleteOrders(now = new Date()) {
  try {
    const days = Math.max(1, Number(process.env.ORDER_AUTO_COMPLETE_DAYS) || 3);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const eligibleOrders = await prisma.order.findMany({
      where: {
        order_status: 'DELIVERED',
        OR: [
          { customer_received_at: { not: null } },
          { delivered_at: { lte: cutoff } },
          {
            AND: [
              { delivered_at: null },
              { updated_at: { lte: cutoff } },
            ],
          },
        ],
      },
      include: {
        order_items: true,
        customer: true,
      },
    });

    for (const ord of eligibleOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          const fresh = await tx.order.findUnique({
            where: { order_id: ord.order_id },
            select: { order_status: true },
          });

          if (!fresh || fresh.order_status !== 'DELIVERED') return;

          await tx.order.update({
            where: { order_id: ord.order_id },
            data: {
              order_status: 'COMPLETED',
              completed_at: new Date(),
            },
          });

          await tx.orderStatusHistory.create({
            data: {
              order_id: ord.order_id,
              from_status: 'DELIVERED',
              to_status: 'COMPLETED',
              note: 'Hệ thống tự động hoàn tất đơn hàng sau thời gian quy định',
            },
          });

          if (ord.customer_id) {
            const digits = String(ord.order_number).replace(/\D/g, '') || String(ord.order_id);
            await tx.notification.create({
              data: {
                customer_id: ord.customer_id,
                notification_type: 'ORDER',
                title: 'Đơn hàng đã hoàn tất',
                message: `Đơn hàng #${ord.order_number} đã được hoàn tất thành công. Cảm ơn Quý khách đã mua sắm tại Youth Fashion!`,
                reference_id: ord.order_id,
                link: `/profile?tab=orders&order=${digits}`,
                data: {
                  order_number: ord.order_number,
                  status: 'COMPLETED',
                  badge: 'HOÀN TẤT',
                },
              },
            });
          }
        });

        const recipientEmail = ord.recipient_email || ord.customer?.email;
        if (recipientEmail) {
          sendOrderNotificationEmail({
            toEmail: recipientEmail,
            order: ord,
            status: 'COMPLETED',
          }).catch((e) => console.warn('Lỗi gửi email hoàn tất đơn hàng:', e.message));
        }

        console.log(`[Job] Đã tự động hoàn tất đơn hàng: ${ord.order_number}`);
      } catch (err) {
        console.error(`[Job Error] Lỗi khi hoàn tất đơn ${ord.order_number}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[Job Error] Failed to auto-complete delivered orders:', error.message);
  }
}

export function autoCancelExpiredOrders() {
  // Chạy ngay 1 lần khi khởi động
  processExpiredPayosOrders().catch(() => {});
  processAutoCompleteOrders().catch(() => {});

  // Lặp lại mỗi 60 giây
  setInterval(async () => {
    await processExpiredPayosOrders();
    await processAutoCompleteOrders();
  }, 60000);
}

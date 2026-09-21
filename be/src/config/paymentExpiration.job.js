import { prisma } from '../repositories/prisma.js';

export function autoCancelExpiredOrders() {
  setInterval(async () => {
    try {
      const now = new Date();

      // Update expired pending orders to CANCELLED
      const updatedOrders = await prisma.order.updateMany({
        where: {
          order_status: 'PENDING',
          created_at: {
            // Cancel orders older than 5 minutes
            lt: new Date(now.getTime() - 5 * 60 * 1000)
          }
        },
        data: {
          order_status: 'CANCELLED'
        }
      });

      if (updatedOrders.count > 0) {
        console.log(`[Job] Auto-cancelled ${updatedOrders.count} expired order(s).`);
      }
    } catch (error) {
      console.error('[Job Error] Failed to auto-cancel expired orders:', error.message);
    }
  }, 60000); // Check every minute
}

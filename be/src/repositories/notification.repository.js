import { prisma } from './prisma.js';

export const findNotificationsByUser = async ({ customerId, employeeId }) => {
  const where = {};
  if (employeeId) {
    where.employee_id = BigInt(employeeId);
  } else if (customerId) {
    where.customer_id = BigInt(customerId);
  } else {
    return [];
  }

  return await prisma.notification.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });
};

export const markAsRead = async (notificationId, { customerId, employeeId }) => {
  const where = {
    notification_id: BigInt(notificationId),
  };
  if (employeeId) {
    where.employee_id = BigInt(employeeId);
  } else if (customerId) {
    where.customer_id = BigInt(customerId);
  }

  return await prisma.notification.updateMany({
    where,
    data: { is_read: true },
  });
};

export const markAllAsRead = async ({ customerId, employeeId }) => {
  const where = {};
  if (employeeId) {
    where.employee_id = BigInt(employeeId);
  } else if (customerId) {
    where.customer_id = BigInt(customerId);
  }

  return await prisma.notification.updateMany({
    where,
    data: { is_read: true },
  });
};

export const deleteNotification = async (notificationId, { customerId, employeeId }) => {
  const where = {
    notification_id: BigInt(notificationId),
  };
  if (employeeId) {
    where.employee_id = BigInt(employeeId);
  } else if (customerId) {
    where.customer_id = BigInt(customerId);
  }

  return await prisma.notification.deleteMany({
    where,
  });
};

export const deleteAllNotifications = async ({ customerId, employeeId }) => {
  const where = {};
  if (employeeId) {
    where.employee_id = BigInt(employeeId);
  } else if (customerId) {
    where.customer_id = BigInt(customerId);
  }

  return await prisma.notification.deleteMany({
    where,
  });
};

export const createNotification = async (data) => {
  return await prisma.notification.create({
    data: {
      customer_id: data.customer_id ? BigInt(data.customer_id) : null,
      employee_id: data.employee_id ? BigInt(data.employee_id) : null,
      notification_type: data.notification_type || 'ORDER',
      title: data.title,
      message: data.message,
      reference_id: data.reference_id ? BigInt(data.reference_id) : null,
      link: data.link || null,
      data: data.data || null,
      is_read: false,
    },
  });
};

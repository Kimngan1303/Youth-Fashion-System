import * as notificationRepo from '../repositories/notification.repository.js';

const formatNotification = (notif) => {
  const extra = notif.data || {};
  return {
    id: String(notif.notification_id),
    notification_id: String(notif.notification_id),
    customer_id: notif.customer_id ? String(notif.customer_id) : null,
    employee_id: notif.employee_id ? String(notif.employee_id) : null,
    title: notif.title,
    message: notif.message,
    order_id: notif.reference_id ? String(notif.reference_id) : null,
    order_number: extra.order_number || (notif.reference_id ? `YF-${notif.reference_id}` : ''),
    order_digits: extra.order_number ? String(extra.order_number).replace(/\D/g, '') : (notif.reference_id ? String(notif.reference_id) : ''),
    status: extra.status || 'INFO',
    badge: extra.badge || 'THÔNG BÁO',
    type: notif.notification_type || 'ORDER',
    link: notif.link || (notif.reference_id ? `/profile?tab=orders&order=${String(notif.reference_id)}` : '/profile?tab=orders'),
    is_read: Boolean(notif.is_read),
    created_at: notif.created_at ? notif.created_at.toISOString() : new Date().toISOString(),
    timestamp: notif.created_at ? notif.created_at.getTime() : Date.now(),
  };
};

export const getNotificationsService = async ({ customerId, employeeId }) => {
  const list = await notificationRepo.findNotificationsByUser({ customerId, employeeId });
  return list.map(formatNotification);
};

export const markNotificationReadService = async (id, { customerId, employeeId }) => {
  return await notificationRepo.markAsRead(id, { customerId, employeeId });
};

export const markAllNotificationsReadService = async ({ customerId, employeeId }) => {
  return await notificationRepo.markAllAsRead({ customerId, employeeId });
};

export const deleteNotificationService = async (id, { customerId, employeeId }) => {
  return await notificationRepo.deleteNotification(id, { customerId, employeeId });
};

export const deleteAllNotificationsService = async ({ customerId, employeeId }) => {
  return await notificationRepo.deleteAllNotifications({ customerId, employeeId });
};

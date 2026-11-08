/**
 * notificationService.js
 * Quản lý và đồng bộ thông báo đơn hàng theo thời gian thực cho người mua
 */

// Định dạng thời gian tương đối thân thiện bằng tiếng Việt
export const formatNotificationTime = (timestampOrIso) => {
  if (!timestampOrIso) return 'Vừa xong';
  const date = new Date(timestampOrIso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 45) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay === 1) return 'Hôm qua';
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Tạo nội dung thông báo dựa trên trạng thái đơn hàng
export const buildNotificationContent = (order, newStatus, extraData = {}) => {
  const code = order.order_number || order.order_code || order.order_id || 'Đơn hàng';
  const s = String(newStatus || '').toUpperCase();
  const reason = extraData.reason || order.cancel_reason || '';
  const rejectReason = extraData.rejectReason || order.reject_reason || '';

  switch (s) {
    case 'CONFIRMED':
      return {
        type: 'ORDER_CONFIRMED',
        title: `Đơn hàng #${code} đã được xác nhận`,
        message: `Đơn hàng #${code} của bạn đã được Quản trị viên Shop xác nhận thành công và chuyển sang khâu đóng gói Haute Couture.`,
        badge: 'ĐÃ XÁC NHẬN',
        badgeColor: '#0369A1',
        badgeBg: '#E0F2FE',
      };
    case 'SHIPPING':
      return {
        type: 'ORDER_SHIPPING',
        title: `Đơn hàng #${code} đang được vận chuyển`,
        message: `Đơn hàng #${code} đã hoàn tất đóng gói và bàn giao cho đơn vị vận chuyển Giao Hàng Nhanh (Express VIP). Kiện hàng đang trên đường giao tới bạn.`,
        badge: 'ĐANG VẬN CHUYỂN',
        badgeColor: '#1D4ED8',
        badgeBg: '#DBEAFE',
      };
    case 'COMPLETED':
      return {
        type: 'ORDER_COMPLETED',
        title: `Đơn hàng #${code} đã giao thành công`,
        message: `Đơn hàng #${code} đã được giao tận tay bạn thành công. Cảm ơn quý khách đã tin tưởng mua sắm tại Youth Fashion!`,
        badge: 'ĐÃ GIAO HÀNG',
        badgeColor: '#15803D',
        badgeBg: '#DCFCE7',
      };
    case 'CANCELLED':
      if (extraData.cancelledBy === 'SHOP' || extraData.isShopCancelled) {
        return {
          type: 'ORDER_CANCELLED_BY_SHOP',
          title: `Shop đã hủy đơn hàng #${code}`,
          message: `Đơn hàng #${code} đã được phía Shop hủy. Lý do từ Shop: "${reason || 'Sản phẩm tạm thời hết hàng trong kho'}". Quý khách vui lòng liên hệ hotline/chat nếu cần hỗ trợ thêm.`,
          badge: 'SHOP HỦY ĐƠN',
          badgeColor: '#B91C1C',
          badgeBg: '#FEE2E2',
        };
      }
      return {
        type: 'ORDER_CANCELLED',
        title: `Đơn hàng #${code} đã hủy thành công`,
        message: `Đơn hàng #${code} đã được hủy theo yêu cầu của bạn. Lý do: "${reason || 'Khách yêu cầu hủy đơn'}".`,
        badge: 'ĐÃ HỦY',
        badgeColor: '#B91C1C',
        badgeBg: '#FEE2E2',
      };
    case 'APPROVED':
      return {
        type: 'REFUND_APPROVED',
        title: `Shop đã hoàn tiền đơn hàng #${code}`,
        message: `Shop đã đồng ý yêu cầu đổi trả và hoàn tất chuyển tiền hoàn trả về tài khoản ngân hàng của bạn cho đơn hàng #${code}. Quý khách vui lòng kiểm tra biến động số dư.`,
        badge: 'ĐÃ HOÀN TIỀN',
        badgeColor: '#15803D',
        badgeBg: '#DCFCE7',
      };
    case 'REJECTED':
      return {
        type: 'REFUND_REJECTED',
        title: `Shop đã từ chối yêu cầu hoàn tiền #${code}`,
        message: `Shop đã từ chối yêu cầu đổi trả & hoàn tiền cho đơn hàng #${code}. Lý do từ Shop: "${rejectReason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop'}".`,
        badge: 'TỪ CHỐI HOÀN',
        badgeColor: '#B91C1C',
        badgeBg: '#FEE2E2',
      };
    case 'RETURNED':
      return {
        type: 'ORDER_RETURNED',
        title: `Yêu cầu đổi trả #${code} đang được xử lý`,
        message: `Shop đã tiếp nhận yêu cầu đổi trả & hoàn tiền của bạn cho đơn hàng #${code} và đang tiến hành kiểm tra xét duyệt.`,
        badge: 'CHỜ XỬ LÝ HOÀN',
        badgeColor: '#7E22CE',
        badgeBg: '#F3E8FF',
      };
    default:
      return {
        type: 'ORDER_STATUS_CHANGED',
        title: `Cập nhật trạng thái đơn hàng #${code}`,
        message: `Đơn hàng #${code} của bạn đã được cập nhật sang trạng thái "${extraData.newStatusLabel || newStatus}".`,
        badge: extraData.newStatusLabel || 'CẬP NHẬT',
        badgeColor: '#4B5563',
        badgeBg: '#F3F4F6',
      };
  }
};

// Gửi thông báo trạng thái đơn hàng đến người mua
export const sendOrderStatusNotification = (order, newStatus, extraData = {}) => {
  if (!order) return null;

  const content = buildNotificationContent(order, newStatus, extraData);
  const orderId = String(order.order_id || '').trim();
  const orderNumber = String(order.order_number || order.order_code || '').trim();
  const orderDigits = (orderNumber || orderId).replace(/\D/g, '');

  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    order_id: orderId,
    order_number: orderNumber || `YF-${orderDigits}`,
    order_digits: orderDigits,
    title: content.title,
    message: content.message,
    badge: content.badge,
    badgeColor: content.badgeColor,
    badgeBg: content.badgeBg,
    status: newStatus,
    type: content.type,
    time: 'Vừa xong',
    created_at: new Date().toISOString(),
    timestamp: Date.now(),
    is_read: false,
    link: `/profile?tab=orders&order=${orderDigits}`,
    // Thông tin định danh người mua để lọc chính xác
    customer_id: order.customer_id || order.customer?.customer_id || order.customer?.id || order.user_id || '',
    customer_email: order.recipient_email || order.customer?.email || order.email || '',
    customer_phone: order.recipient_phone || order.customer?.phone || order.phone || '',
  };

  // 1. Lưu vào danh sách các khóa liên quan trong localStorage
  const keysToUpdate = new Set(['yf_customer_notifications', 'yf_all_notifications']);
  if (newNotif.customer_id) keysToUpdate.add(`yf_notifications_${newNotif.customer_id}`);
  if (newNotif.customer_email) keysToUpdate.add(`yf_notifications_${newNotif.customer_email.toLowerCase()}`);
  if (newNotif.customer_phone) keysToUpdate.add(`yf_notifications_${newNotif.customer_phone.replace(/\D/g, '')}`);

  // Tìm các key yf_customer_orders_* để gắn cùng key tương ứng
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('yf_customer_orders_')) {
      const suffix = k.replace('yf_customer_orders_', '');
      keysToUpdate.add(`yf_notifications_${suffix}`);
    }
  }

  keysToUpdate.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      const list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list)) {
        list.unshift(newNotif);
        // Giữ tối đa 50 thông báo gần nhất
        localStorage.setItem(k, JSON.stringify(list.slice(0, 50)));
      }
    } catch (e) {}
  });

  // 2. Phát sự kiện toàn cục đa tab và nội bộ tab
  try {
    localStorage.setItem('yf_last_notification_event', JSON.stringify(newNotif));
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('yf_notification_added', { detail: newNotif }));
  window.dispatchEvent(new CustomEvent('yf_notifications_updated', { detail: { notif: newNotif } }));

  try {
    const bc = new BroadcastChannel('yf_orders_sync_channel');
    bc.postMessage({ type: 'NEW_NOTIFICATION', notif: newNotif });
    bc.close();
  } catch (e) {}

  return newNotif;
};

// Lấy danh sách thông báo dành riêng cho người dùng hiện tại
export const getNotificationsForUser = (user = null) => {
  const aggregated = [];
  const seenIds = new Set();

  const keysToCheck = ['yf_customer_notifications'];
  if (user) {
    if (user.customer_id) keysToCheck.push(`yf_notifications_${user.customer_id}`);
    if (user.id) keysToCheck.push(`yf_notifications_${user.id}`);
    if (user.email) keysToCheck.push(`yf_notifications_${user.email.toLowerCase()}`);
    if (user.phone) keysToCheck.push(`yf_notifications_${user.phone.replace(/\D/g, '')}`);
  }

  keysToCheck.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(item => {
            if (item && item.id && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              aggregated.push({
                ...item,
                time: formatNotificationTime(item.created_at || item.timestamp)
              });
            }
          });
        }
      }
    } catch (e) {}
  });

  // Sắp xếp thông báo mới nhất lên đầu
  aggregated.sort((a, b) => (b.timestamp || new Date(b.created_at).getTime() || 0) - (a.timestamp || new Date(a.created_at).getTime() || 0));

  return aggregated;
};

// Đánh dấu 1 thông báo đã đọc
export const markNotificationAsRead = (notifId, user = null) => {
  if (!notifId) return;
  const keysToCheck = ['yf_customer_notifications'];
  if (user) {
    if (user.customer_id) keysToCheck.push(`yf_notifications_${user.customer_id}`);
    if (user.id) keysToCheck.push(`yf_notifications_${user.id}`);
    if (user.email) keysToCheck.push(`yf_notifications_${user.email.toLowerCase()}`);
    if (user.phone) keysToCheck.push(`yf_notifications_${user.phone.replace(/\D/g, '')}`);
  }

  keysToCheck.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const updated = list.map(n => n.id === notifId ? { ...n, is_read: true } : n);
          localStorage.setItem(k, JSON.stringify(updated));
        }
      }
    } catch (e) {}
  });

  window.dispatchEvent(new CustomEvent('yf_notifications_updated', { detail: { notifId, is_read: true } }));
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllNotificationsAsRead = (user = null) => {
  const keysToCheck = ['yf_customer_notifications'];
  if (user) {
    if (user.customer_id) keysToCheck.push(`yf_notifications_${user.customer_id}`);
    if (user.id) keysToCheck.push(`yf_notifications_${user.id}`);
    if (user.email) keysToCheck.push(`yf_notifications_${user.email.toLowerCase()}`);
    if (user.phone) keysToCheck.push(`yf_notifications_${user.phone.replace(/\D/g, '')}`);
  }

  keysToCheck.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const updated = list.map(n => ({ ...n, is_read: true }));
          localStorage.setItem(k, JSON.stringify(updated));
        }
      }
    } catch (e) {}
  });

  window.dispatchEvent(new CustomEvent('yf_notifications_updated', { detail: { allRead: true } }));
};

// Xóa toàn bộ thông báo
export const clearAllNotifications = (user = null) => {
  const keysToCheck = ['yf_customer_notifications'];
  if (user) {
    if (user.customer_id) keysToCheck.push(`yf_notifications_${user.customer_id}`);
    if (user.id) keysToCheck.push(`yf_notifications_${user.id}`);
    if (user.email) keysToCheck.push(`yf_notifications_${user.email.toLowerCase()}`);
    if (user.phone) keysToCheck.push(`yf_notifications_${user.phone.replace(/\D/g, '')}`);
  }

  keysToCheck.forEach(k => {
    try {
      localStorage.setItem(k, JSON.stringify([]));
    } catch (e) {}
  });

  window.dispatchEvent(new CustomEvent('yf_notifications_updated', { detail: { cleared: true } }));
};


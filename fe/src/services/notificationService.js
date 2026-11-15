/**
 * notificationService.js
 * Quản lý và đồng bộ thông báo đơn hàng theo thời gian thực cho người mua
 */
import axiosClient from './axiosClient';

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
  const rawCode = order.order_number || order.order_code || order.order_id || 'Đơn hàng';
  const cleanDigits = String(rawCode).replace(/\D/g, '');
  const displayCode = cleanDigits ? `#YF-${cleanDigits}` : `#${String(rawCode).replace(/^#+/, '')}`;
  const s = String(newStatus || '').toUpperCase();
  const reason = extraData.reason || order.cancel_reason || '';
  const rejectReason = extraData.rejectReason || order.reject_reason || '';

  switch (s) {
    case 'PENDING':
    case 'ORDER_CREATED':
      return {
        type: 'ORDER_CREATED',
        title: `Đơn hàng ${displayCode} đã được tiếp nhận`,
        message: `Đơn hàng ${displayCode} của bạn đã được hệ thống ghi nhận thành công và đang chờ Quản trị viên Shop xác nhận.`,
        badge: 'CHỜ XÁC NHẬN',
        badgeColor: '#0369A1',
        badgeBg: '#E0F2FE',
      };
    case 'CONFIRMED':
      return {
        type: 'ORDER_CONFIRMED',
        title: `Đơn hàng ${displayCode} đã được xác nhận`,
        message: `Đơn hàng ${displayCode} của bạn đã được Quản trị viên Shop xác nhận thành công và chuyển sang khâu đóng gói Haute Couture.`,
        badge: 'ĐÃ XÁC NHẬN',
        badgeColor: '#0369A1',
        badgeBg: '#E0F2FE',
      };
    case 'SHIPPING':
      return {
        type: 'ORDER_SHIPPING',
        title: `Đơn hàng ${displayCode} đang được vận chuyển`,
        message: `Đơn hàng ${displayCode} đã hoàn tất đóng gói và bàn giao cho đơn vị vận chuyển Giao Hàng Nhanh (Express VIP). Kiện hàng đang trên đường giao tới bạn.`,
        badge: 'ĐANG VẬN CHUYỂN',
        badgeColor: '#1D4ED8',
        badgeBg: '#DBEAFE',
      };
    case 'COMPLETED':
      return {
        type: 'ORDER_COMPLETED',
        title: `Đơn hàng ${displayCode} đã giao thành công`,
        message: `Đơn hàng ${displayCode} đã được giao tận tay bạn thành công. Cảm ơn quý khách đã tin tưởng mua sắm tại Youth Fashion!`,
        badge: 'ĐÃ GIAO HÀNG',
        badgeColor: '#15803D',
        badgeBg: '#DCFCE7',
      };
    case 'CANCELLED':
      if (extraData.cancelledBy === 'SHOP' || extraData.isShopCancelled) {
        return {
          type: 'ORDER_CANCELLED_BY_SHOP',
          title: `Shop đã hủy đơn hàng ${displayCode}`,
          message: `Đơn hàng ${displayCode} đã được phía Shop hủy. Lý do từ Shop: "${reason || 'Sản phẩm tạm thời hết hàng trong kho'}". Quý khách vui lòng liên hệ hotline/chat nếu cần hỗ trợ thêm.`,
          badge: 'SHOP HỦY ĐƠN',
          badgeColor: '#B91C1C',
          badgeBg: '#FEE2E2',
        };
      }
      return {
        type: 'ORDER_CANCELLED',
        title: `Đơn hàng ${displayCode} đã hủy thành công`,
        message: `Đơn hàng ${displayCode} đã được hủy theo yêu cầu của bạn. Lý do: "${reason || 'Khách yêu cầu hủy đơn'}".`,
        badge: 'ĐÃ HỦY',
        badgeColor: '#B91C1C',
        badgeBg: '#FEE2E2',
      };
    case 'APPROVED':
      return {
        type: 'REFUND_APPROVED',
        title: `Shop đã hoàn tiền đơn hàng ${displayCode}`,
        message: `Shop đã đồng ý yêu cầu đổi trả và hoàn tất chuyển tiền hoàn trả về tài khoản ngân hàng của bạn cho đơn hàng ${displayCode}. Quý khách vui lòng kiểm tra biến động số dư.`,
        badge: 'ĐÃ HOÀN TIỀN',
        badgeColor: '#15803D',
        badgeBg: '#DCFCE7',
      };
    case 'REJECTED':
      return {
        type: 'REFUND_REJECTED',
        title: `Shop đã từ chối yêu cầu hoàn tiền ${displayCode}`,
        message: `Shop đã từ chối yêu cầu đổi trả & hoàn tiền cho đơn hàng ${displayCode}. Lý do từ Shop: "${rejectReason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop'}".`,
        badge: 'TỪ CHỐI HOÀN',
        badgeColor: '#B91C1C',
        badgeBg: '#FEE2E2',
      };
    case 'RETURNED':
      return {
        type: 'ORDER_RETURNED',
        title: `Yêu cầu đổi trả ${displayCode} đang được xử lý`,
        message: `Shop đã tiếp nhận yêu cầu đổi trả & hoàn tiền của bạn cho đơn hàng ${displayCode} và đang tiến hành kiểm tra xét duyệt.`,
        badge: 'CHỜ XỬ LÝ HOÀN',
        badgeColor: '#7E22CE',
        badgeBg: '#F3E8FF',
      };
    case 'DELIVERY_FAILED':
    case 'FAILED_DELIVERY':
      if (extraData.willRetry || extraData.retryDate) {
        const formattedDate = extraData.retryDate ? new Date(extraData.retryDate).toLocaleDateString('vi-VN') : 'ngày tiếp theo';
        return {
          type: 'ORDER_DELIVERY_FAILED_RETRY',
          title: `Giao hàng chưa thành công ${displayCode} - Hẹn giao lại`,
          message: `Đơn vị vận chuyển đã cố gắng phát đơn hàng ${displayCode} nhưng chưa thành công. Lý do: "${reason || 'Không liên lạc được với người nhận'}". Đơn vị sẽ giao lại vào ${formattedDate}. Vui lòng chú ý điện thoại.`,
          badge: 'HẸN GIAO LẠI',
          badgeColor: '#D97706',
          badgeBg: '#FEF3C7',
        };
      }
      return {
        type: 'ORDER_DELIVERY_FAILED',
        title: `Giao hàng không thành công ${displayCode}`,
        message: `Đơn hàng ${displayCode} giao không thành công. Lý do: "${reason || 'Không thể liên lạc hoặc khách từ chối nhận'}". Đơn hàng sẽ được chuyển hoàn về kho.`,
        badge: 'GIAO THẤT BẠI',
        badgeColor: '#B91C1C',
        badgeBg: '#FEE2E2',
      };
    default:
      return {
        type: 'ORDER_STATUS_CHANGED',
        title: `Cập nhật trạng thái đơn hàng ${displayCode}`,
        message: `Đơn hàng ${displayCode} của bạn đã được cập nhật sang trạng thái "${extraData.newStatusLabel || newStatus}".`,
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

  // Tra cứu thông tin định danh người mua chính xác từ nhiều nguồn lưu trữ
  let customerEmail = (
    order.recipient_email ||
    order.customer?.email ||
    order.email ||
    extraData?.recipientEmail ||
    extraData?.customerEmail ||
    ''
  ).toLowerCase().trim();

  let customerId = order.customer_id || order.customer?.customer_id || order.customer?.id || order.user_id || extraData?.customerId || '';
  let customerPhone = (order.recipient_phone || order.customer?.phone || order.phone || extraData?.recipientPhone || '').trim();
  let customerName = order.recipient_name || order.customer?.full_name || order.customer?.name || extraData?.recipientName || '';

  // Nếu thiếu email hoặc là email mẫu, quét tìm trong kho dữ liệu cục bộ theo mã đơn
  if (!customerEmail || customerEmail.endsWith('@example.com') || !customerId) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('yf_customer_orders') || k === 'yf_manager_orders' || k.startsWith('yf_notifications_'))) {
          try {
            const rawList = localStorage.getItem(k);
            if (rawList) {
              const list = JSON.parse(rawList);
              if (Array.isArray(list)) {
                const match = list.find(item => {
                  if (!item) return false;
                  const iId = String(item.order_id || '').trim();
                  const iNum = String(item.order_number || item.order_code || '').trim();
                  const iDig = (iNum || iId).replace(/\D/g, '');
                  return (orderId && (iId === orderId || iNum === orderId)) ||
                         (orderNumber && (iId === orderNumber || iNum === orderNumber)) ||
                         (orderDigits && iDig && orderDigits === iDig);
                });
                if (match) {
                  const mEmail = (match.recipient_email || match.customer?.email || match.email || match.customer_email || '').toLowerCase().trim();
                  if (mEmail && mEmail.includes('@') && !mEmail.endsWith('@example.com')) {
                    customerEmail = mEmail;
                  }
                  if (!customerId) {
                    customerId = match.customer_id || match.customer?.customer_id || match.customer?.id || match.user_id || '';
                  }
                  if (!customerPhone) {
                    customerPhone = match.recipient_phone || match.customer?.phone || match.phone || match.customer_phone || '';
                  }
                  if (!customerName) {
                    customerName = match.recipient_name || match.customer?.full_name || match.customer?.name || '';
                  }
                }
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

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
    customer_id: customerId,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    customer_name: customerName,
  };

  // 1. Lưu vào danh sách các khóa liên quan trong localStorage
  const keysToUpdate = new Set(['yf_customer_notifications', 'yf_all_notifications']);
  if (customerId) keysToUpdate.add(`yf_notifications_${customerId}`);
  if (customerEmail) keysToUpdate.add(`yf_notifications_${customerEmail}`);
  if (customerPhone) keysToUpdate.add(`yf_notifications_${customerPhone.replace(/\D/g, '')}`);

  // Thêm các key của tài khoản đang đăng nhập hiện tại nếu có
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const activeUser = JSON.parse(rawUser);
      if (activeUser?.customer_id) keysToUpdate.add(`yf_notifications_${activeUser.customer_id}`);
      if (activeUser?.id) keysToUpdate.add(`yf_notifications_${activeUser.id}`);
      if (activeUser?.email) keysToUpdate.add(`yf_notifications_${activeUser.email.toLowerCase()}`);
      if (activeUser?.phone) keysToUpdate.add(`yf_notifications_${activeUser.phone.replace(/\D/g, '')}`);
    }
  } catch (e) {}

  // Tìm các key yf_customer_orders_* để gắn cùng key thông báo tương ứng
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
        // Tránh trùng lặp thông báo cùng sự kiện trong khoảng thời gian ngắn (5s)
        const isDuplicate = list.some(item =>
          item.order_digits === newNotif.order_digits &&
          item.type === newNotif.type &&
          Math.abs((item.timestamp || 0) - newNotif.timestamp) < 5000
        );
        if (!isDuplicate) {
          list.unshift(newNotif);
          // Giữ tối đa 50 thông báo gần nhất
          localStorage.setItem(k, JSON.stringify(list.slice(0, 50)));
        }
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

  let effectiveUser = user;
  if (!effectiveUser) {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) effectiveUser = JSON.parse(rawUser);
    } catch (e) {}
  }

  const deletedIds = new Set(getDeletedNotificationIds());
  const keysToCheck = new Set(['yf_customer_notifications']);
  if (effectiveUser) {
    if (effectiveUser.customer_id) keysToCheck.add(`yf_notifications_${effectiveUser.customer_id}`);
    if (effectiveUser.id) keysToCheck.add(`yf_notifications_${effectiveUser.id}`);
  }

  keysToCheck.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(item => {
            const notifKey = String(item?.id || item?.notification_id || '');
            if (item && notifKey && !seenIds.has(notifKey) && !deletedIds.has(notifKey)) {
              // Đảm bảo thông báo thuộc về chính user hiện tại nếu có customer_id
              if (item.customer_id && effectiveUser?.id && String(item.customer_id) !== String(effectiveUser.id) && String(item.customer_id) !== String(effectiveUser.customer_id)) {
                return;
              }
              seenIds.add(notifKey);
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

// Lấy danh sách ID thông báo đã bị xóa
export const getDeletedNotificationIds = () => {
  try {
    const raw = localStorage.getItem('yf_deleted_notification_ids');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// Ghi nhận ID thông báo đã xóa để không bao giờ hiển thị lại sau khi reload
export const addDeletedNotificationId = (id) => {
  if (!id) return;
  try {
    const list = getDeletedNotificationIds();
    const idStr = String(id);
    if (!list.includes(idStr)) {
      list.push(idStr);
      localStorage.setItem('yf_deleted_notification_ids', JSON.stringify(list));
    }
  } catch (e) {}
};

// Tải thông báo mới nhất từ API backend và cập nhật bộ nhớ tạm
export const fetchNotificationsFromApi = async () => {
  try {
    const res = await axiosClient.get('/notifications');
    if (res.data?.data && Array.isArray(res.data.data)) {
      const deletedIds = new Set(getDeletedNotificationIds());
      const apiList = res.data.data
        .filter(n => !deletedIds.has(String(n.id || n.notification_id)))
        .map(n => ({
          ...n,
          time: formatNotificationTime(n.created_at || n.timestamp)
        }));
      localStorage.setItem('yf_customer_notifications', JSON.stringify(apiList));
      return apiList;
    }
  } catch (e) {
    // Không làm gián đoạn UI nếu chưa đăng nhập hoặc mạng offline
  }
  return null;
};

// Đánh dấu 1 thông báo đã đọc
export const markNotificationAsRead = async (notifId, user = null) => {
  if (!notifId) return;
  const keysToCheck = ['yf_customer_notifications'];
  if (user) {
    if (user.customer_id) keysToCheck.push(`yf_notifications_${user.customer_id}`);
    if (user.id) keysToCheck.push(`yf_notifications_${user.id}`);
  }

  keysToCheck.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const updated = list.map(n => String(n.id) === String(notifId) || String(n.notification_id) === String(notifId) ? { ...n, is_read: true } : n);
          localStorage.setItem(k, JSON.stringify(updated));
        }
      }
    } catch (e) {}
  });

  try {
    await axiosClient.patch(`/notifications/${notifId}/read`);
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('yf_notifications_updated', { detail: { notifId, is_read: true } }));
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllNotificationsAsRead = async (user = null) => {
  const keysToCheck = ['yf_customer_notifications'];
  if (user) {
    if (user.customer_id) keysToCheck.push(`yf_notifications_${user.customer_id}`);
    if (user.id) keysToCheck.push(`yf_notifications_${user.id}`);
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

  try {
    await axiosClient.patch('/notifications/read-all');
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('yf_notifications_updated', { detail: { allRead: true } }));
};

// Xóa 1 thông báo (cả API backend và bộ nhớ tạm)
export const deleteNotification = async (notifId, user = null) => {
  if (!notifId) return;
  addDeletedNotificationId(notifId);

  const keysToCheck = ['yf_customer_notifications'];
  if (user) {
    if (user.customer_id) keysToCheck.push(`yf_notifications_${user.customer_id}`);
    if (user.id) keysToCheck.push(`yf_notifications_${user.id}`);
  }

  keysToCheck.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const updated = list.filter(n => String(n.id) !== String(notifId) && String(n.notification_id) !== String(notifId));
          localStorage.setItem(k, JSON.stringify(updated));
        }
      }
    } catch (e) {}
  });

  try {
    await axiosClient.delete(`/notifications/${notifId}`);
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('yf_notifications_updated', { detail: { deletedId: notifId } }));
};

// Xóa toàn bộ thông báo (cả API backend và bộ nhớ tạm)
export const clearAllNotifications = async (user = null) => {
  const keysToCheck = ['yf_customer_notifications'];
  if (user) {
    if (user.customer_id) keysToCheck.push(`yf_notifications_${user.customer_id}`);
    if (user.id) keysToCheck.push(`yf_notifications_${user.id}`);
  }

  keysToCheck.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(n => {
            if (n.id) addDeletedNotificationId(n.id);
            if (n.notification_id) addDeletedNotificationId(n.notification_id);
          });
        }
      }
      localStorage.setItem(k, JSON.stringify([]));
    } catch (e) {}
  });

  try {
    await axiosClient.delete('/notifications');
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('yf_notifications_updated', { detail: { cleared: true } }));
};


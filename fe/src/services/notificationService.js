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

  // 3. Đồng bộ gửi thông báo về Gmail của khách hàng qua Backend API
  try {
    const recipientEmail = (customerEmail && customerEmail.includes('@') && !customerEmail.endsWith('@example.com'))
      ? customerEmail
      : (order.recipient_email || order.customer?.email || extraData?.recipientEmail || '');

    axiosClient
      .post('/orders/notify-email', {
        orderId: newNotif.order_id,
        orderNumber: newNotif.order_number,
        recipientEmail: recipientEmail || undefined,
        newStatus,
        extraData: {
          ...extraData,
          customerEmail,
          recipientEmail,
          recipientName: customerName || order.recipient_name || order.customer?.full_name || order.customer?.name,
          recipientPhone: customerPhone || order.recipient_phone || order.customer?.phone || order.phone,
          refund_decision: newStatus === 'REJECTED' ? 'REJECTED' : (newStatus === 'APPROVED' ? 'APPROVED' : extraData?.refund_decision),
          rejectReason: extraData?.rejectReason || order.reject_reason || '',
          reason: extraData?.rejectReason || extraData?.reason || order.reject_reason || order.cancel_reason || '',
          shippingAddress: [
            order.shipping_address_line,
            order.shipping_ward,
            order.shipping_district,
            order.shipping_city,
          ]
            .filter(Boolean)
            .join(', '),
          totalAmount: order.total_amount,
          items: order.order_items || order.items || [],
        },
      })
      .catch((err) => {
        console.warn('Lỗi khi gửi email thông báo tự động:', err?.message);
      });
  } catch (e) {
    console.warn('Lỗi kích hoạt gửi email thông báo:', e);
  }

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

  const keysToCheck = new Set(['yf_customer_notifications', 'yf_all_notifications']);
  if (effectiveUser) {
    if (effectiveUser.customer_id) keysToCheck.add(`yf_notifications_${effectiveUser.customer_id}`);
    if (effectiveUser.id) keysToCheck.add(`yf_notifications_${effectiveUser.id}`);
    if (effectiveUser.email) keysToCheck.add(`yf_notifications_${effectiveUser.email.toLowerCase()}`);
    if (effectiveUser.phone) keysToCheck.add(`yf_notifications_${effectiveUser.phone.replace(/\D/g, '')}`);
  }

  // Quét qua tất cả các key thông báo người dùng có trong localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('yf_notifications_')) {
      keysToCheck.add(k);
    }
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

  // TỰ ĐỘNG ĐỐI SOÁT & BỔ SUNG THÔNG BÁO CHO MỌI ĐƠN HÀNG VÀ MỌI TRẠNG THÁI
  try {
    const rawOverrides = localStorage.getItem('yf_order_status_overrides');
    const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
    const trackableOrders = [];

    // Quét overrides
    Object.keys(overrides).forEach(key => {
      const entry = overrides[key];
      if (entry && (entry.status || entry.order_status)) {
        const digits = key.replace(/\D/g, '');
        if (digits && !trackableOrders.some(c => c.digits === digits)) {
          trackableOrders.push({
            digits,
            order_id: entry.order_id || digits,
            order_number: entry.order_number || `YF-${digits}`,
            status: entry.status || entry.order_status,
            status_label: entry.status_label || entry.status_label_customer || '',
            refund_decision: entry.refund_decision,
            reject_reason: entry.reject_reason,
            refund_reason: entry.refund_reason,
            cancel_reason: entry.cancel_reason,
            cancelled_by: entry.cancelled_by,
            note: entry.note,
            updated_at: entry.updated_at || Date.now()
          });
        }
      }
    });

    ['yf_customer_orders', 'yf_manager_orders'].forEach(storageKey => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list.forEach(ord => {
              const s = String(ord.status || ord.order_status || 'PENDING').toUpperCase();
              const digits = String(ord.order_number || ord.order_code || ord.order_id || '').replace(/\D/g, '');
              if (digits && !trackableOrders.some(c => c.digits === digits)) {
                trackableOrders.push({
                  digits,
                  order_id: ord.order_id || digits,
                  order_number: ord.order_number || `YF-${digits}`,
                  status: s,
                  status_label: ord.status_label || '',
                  refund_decision: ord.refund_decision,
                  reject_reason: ord.reject_reason,
                  refund_reason: ord.refund_reason,
                  cancel_reason: ord.cancel_reason,
                  cancelled_by: ord.cancelled_by,
                  note: ord.note,
                  updated_at: ord.updated_at || (ord.created_date ? new Date(ord.created_date).getTime() : Date.now())
                });
              }
            });
          }
        }
      } catch (e) {}
    });

    trackableOrders.forEach(trackOrd => {
      let targetStatus = trackOrd.status;
      if (trackOrd.status === 'RETURNED' || trackOrd.refund_decision) {
        const isRej = trackOrd.refund_decision === 'REJECTED' ||
                      String(trackOrd.status_label || '').toUpperCase().includes('TỪ CHỐI') ||
                      String(trackOrd.note || '').toLowerCase().includes('từ chối hoàn tiền') ||
                      String(trackOrd.note || '').toLowerCase().includes('từ chối hoàn');
        const isApp = trackOrd.refund_decision === 'APPROVED' ||
                      String(trackOrd.status_label || '').toUpperCase().includes('ĐÃ HOÀN') ||
                      String(trackOrd.note || '').toLowerCase().includes('đã hoàn tiền') ||
                      String(trackOrd.note || '').toLowerCase().includes('đã xác nhận hoàn tiền');
        if (isApp) targetStatus = 'APPROVED';
        else if (isRej) targetStatus = 'REJECTED';
        else targetStatus = 'RETURNED';
      }

      const hasNotif = aggregated.some(n =>
        (n.order_digits === trackOrd.digits || String(n.order_number || '').replace(/\D/g, '') === trackOrd.digits) &&
        (n.status === targetStatus || n.type?.includes(targetStatus) || (targetStatus === 'REJECTED' && (n.badge === 'TỪ CHỐI HOÀN' || n.type === 'REFUND_REJECTED')))
      );

      if (!hasNotif) {
        const fakeOrder = {
          order_id: trackOrd.order_id,
          order_number: trackOrd.order_number,
          cancel_reason: trackOrd.cancel_reason,
          reject_reason: trackOrd.reject_reason,
          customer_id: effectiveUser?.customer_id || effectiveUser?.id,
          recipient_email: effectiveUser?.email,
          recipient_phone: effectiveUser?.phone
        };
        const cleanStatus = String(targetStatus || 'PENDING').toUpperCase();
        const content = buildNotificationContent(fakeOrder, cleanStatus, {
          reason: trackOrd.cancel_reason || trackOrd.refund_reason || trackOrd.note,
          rejectReason: trackOrd.reject_reason,
          cancelledBy: trackOrd.cancelled_by,
          isShopCancelled: trackOrd.cancelled_by === 'SHOP'
        });
        const safeIsoDate = (() => {
          if (!trackOrd.updated_at) return new Date().toISOString();
          const d = new Date(trackOrd.updated_at);
          return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        })();
        const safeTimestamp = (() => {
          if (!trackOrd.updated_at) return Date.now();
          const t = typeof trackOrd.updated_at === 'number' ? trackOrd.updated_at : new Date(trackOrd.updated_at).getTime();
          return isNaN(t) ? Date.now() : t;
        })();
        const autoNotif = {
          id: `notif_auto_${cleanStatus.toLowerCase()}_${trackOrd.digits}`,
          order_id: trackOrd.order_id,
          order_number: trackOrd.order_number,
          order_digits: trackOrd.digits,
          title: content.title,
          message: content.message,
          badge: content.badge,
          badgeColor: content.badgeColor,
          badgeBg: content.badgeBg,
          status: cleanStatus,
          type: content.type,
          time: formatNotificationTime(safeTimestamp),
          created_at: safeIsoDate,
          timestamp: safeTimestamp,
          is_read: false,
          link: `/profile?tab=orders&order=${trackOrd.digits}`,
          customer_id: effectiveUser?.customer_id || effectiveUser?.id || '',
          customer_email: effectiveUser?.email || '',
          customer_phone: effectiveUser?.phone || ''
        };
        aggregated.push(autoNotif);
        seenIds.add(autoNotif.id);
      }
    });
  } catch (e) {
    console.warn('Lỗi tự động đối soát thông báo hủy đơn:', e);
  }

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


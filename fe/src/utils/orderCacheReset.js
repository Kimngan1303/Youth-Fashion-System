const RESET_FLAG_KEY = 'yf_orders_reset_all_v4';

/**
 * Xóa một lần toàn bộ cache đơn hàng cũ lưu trong localStorage/sessionStorage của trình duyệt
 * sau khi làm sạch bảng đơn hàng trên CSDL, đồng thời không xóa nhầm các đơn tạo mới về sau.
 */
export const ensureOrderCacheReset = () => {
  try {
    if (localStorage.getItem(RESET_FLAG_KEY) === 'true') {
      return false;
    }

    const explicitKeys = [
      'yf_manager_orders',
      'yf_customer_orders',
      'yf_deleted_order_ids',
      'yf_order_status_overrides',
      'yf_last_status_event',
      'orders',
    ];
    explicitKeys.forEach((key) => localStorage.removeItem(key));

    const dynamicKeys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith('yf_customer_orders') ||
          k.startsWith('yf_orders_reset_') ||
          k === 'yf_manager_orders')
      ) {
        dynamicKeys.push(k);
      }
    }
    dynamicKeys.forEach((k) => localStorage.removeItem(k));

    sessionStorage.removeItem('yf_last_completed_order');

    localStorage.setItem('yf_orders_reset_all_v3', 'true');
    localStorage.setItem(RESET_FLAG_KEY, 'true');

    window.dispatchEvent(new CustomEvent('yf_order_status_changed', { detail: { action: 'CLEAR_ALL' } }));
    window.dispatchEvent(new Event('order_status_updated'));
    return true;
  } catch {
    return false;
  }
};


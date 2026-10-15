/**
 * ==============================================================================
 * DỊCH VỤ DỮ LIỆU & QUẢN LÝ VOUCHER DÙNG CHUNG (VOUCHER SERVICE)
 * ==============================================================================
 * Cung cấp:
 * 1. Đồng bộ 2 chiều trực tiếp với Cơ sở dữ liệu MySQL thông qua Backend API (/api/vouchers)
 * 2. Lưu trữ đệm (cache) tại localStorage giúp hiển thị tức thì, không bị nháy giao diện
 * 3. Đồng bộ thời gian thực giữa Quản lý (Manager), Ví Voucher Khách (ProfilePage) và Giỏ hàng (CartPage)
 * ==============================================================================
 */

import axiosClient from './axiosClient';

const STORAGE_KEY = 'youth_fashion_vouchers_list';
const UPDATED_EVENT = 'youth_fashion_vouchers_updated';

// Danh sách voucher khởi tạo rỗng, luôn đồng bộ trực tiếp từ Database MySQL qua API
export const DEFAULT_VOUCHERS = [];

/**
 * Phát sự kiện thông báo cập nhật Voucher giữa các tab và component
 */
export const notifyVouchersUpdated = () => {
  try {
    localStorage.setItem('vouchers_updated_at', Date.now().toString());
    window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
  } catch (e) {
    console.error('Error notifying vouchers updated:', e);
  }
};

export const voucherService = {
  // Lấy toàn bộ danh sách voucher từ bộ nhớ đệm (đồng bộ ngay lập tức)
  getVouchers: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading vouchers from localStorage:', e);
    }
    return DEFAULT_VOUCHERS;
  },

  // Lưu danh sách voucher vào localStorage và phát sự kiện
  saveVouchers: (vouchers) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
      notifyVouchersUpdated();
    } catch (e) {
      console.error('Error saving vouchers to localStorage:', e);
    }
  },

  // Tải danh sách Voucher từ Database MySQL qua API
  fetchVouchers: async (params = {}) => {
    try {
      const res = await axiosClient.get('/vouchers', { params });
      if (res.data?.status && Array.isArray(res.data?.data)) {
        const serverVouchers = res.data.data;
        voucherService.saveVouchers(serverVouchers);
        return serverVouchers;
      }
    } catch (err) {
      console.warn('Không thể tải voucher từ server, sử dụng dữ liệu cục bộ:', err.message);
    }
    return voucherService.getVouchers();
  },

  // Tạo mới voucher - LƯU TRỰC TIẾP VÀO DATABASE MYSQL
  createVoucher: async (newVoucher) => {
    const payload = {
      code: String(newVoucher.code || '').trim().toUpperCase(),
      name: String(newVoucher.name || '').trim(),
      discount_type: newVoucher.discountType || 'percent',
      discount_percent: Number(newVoucher.discountPercent) || 0,
      discount_amount: Number(newVoucher.discountAmount) || 0,
      min_order: Number(newVoucher.minOrder) || 0,
      max_discount: Number(newVoucher.maxDiscount) || 0,
      total_limit: Number(newVoucher.totalLimit) || 500,
      start_date: newVoucher.startDate || null,
      end_date: newVoucher.endDate || null,
      category_limit: newVoucher.categoryLimit || newVoucher.conditionSub || null,
      status: (newVoucher.statusTab === 'expired' ? 'EXPIRED' : (newVoucher.statusTab === 'inactive' ? 'INACTIVE' : 'ACTIVE')),
      badge_type: newVoucher.badgeType || 'dark',
    };

    try {
      // 1. Gửi request tạo và lưu vào CSDL MySQL
      const res = await axiosClient.post('/vouchers', payload);
      if (res.data?.status && res.data?.data) {
        const createdFromDB = res.data.data;
        const currentList = voucherService.getVouchers();
        const updatedList = [createdFromDB, ...currentList.filter(v => v.code !== createdFromDB.code)];
        voucherService.saveVouchers(updatedList);
        return createdFromDB;
      }
    } catch (err) {
      console.error('Lỗi khi lưu voucher vào database:', err);
      throw err;
    }

    // Dự phòng cục bộ nếu không có response
    const fallback = {
      ...newVoucher,
      id: newVoucher.id || `v_${Date.now()}`,
      created_at: newVoucher.created_at || new Date().toISOString(),
    };
    const currentList = voucherService.getVouchers();
    voucherService.saveVouchers([fallback, ...currentList]);
    return fallback;
  },

  // Xóa voucher - XÓA KHỎI CSDL MYSQL
  deleteVoucher: async (id) => {
    try {
      await axiosClient.delete(`/vouchers/${id}`);
    } catch (err) {
      console.error('Lỗi khi xóa voucher từ database:', err);
      throw err;
    }
    const list = voucherService.getVouchers();
    const updatedList = list.filter((v) => String(v.id) !== String(id) && String(v.voucher_id) !== String(id));
    voucherService.saveVouchers(updatedList);
    return updatedList;
  },

  // Xóa nhiều voucher - XÓA HÀNG LOẠT KHỎI CSDL MYSQL
  bulkDeleteVouchers: async (ids = []) => {
    try {
      await axiosClient.post('/vouchers/bulk-delete', { ids });
    } catch (err) {
      console.error('Lỗi khi xóa hàng loạt voucher từ database:', err);
      throw err;
    }
    const idSet = new Set(ids.map(String));
    const list = voucherService.getVouchers();
    const updatedList = list.filter((v) => !idSet.has(String(v.id)) && !idSet.has(String(v.voucher_id)));
    voucherService.saveVouchers(updatedList);
    return updatedList;
  },

  // Áp dụng mã voucher vào đơn hàng qua API backend (tính toán chiết khấu chính xác)
  applyVoucherApi: async (code, subtotal) => {
    try {
      const res = await axiosClient.post('/vouchers/apply', { code, subtotal });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Lấy danh sách Voucher đang kích hoạt hiển thị trong Ví Khách hàng (Trang cá nhân)
  getCustomerVouchers: () => {
    const all = voucherService.getVouchers();
    const activeVouchers = all.filter((v) => v.statusTab === 'active' || !v.statusTab || v.status === 'ACTIVE');

    return activeVouchers.map((v) => ({
      id: String(v.id || v.voucher_id),
      code: v.code,
      title: v.name || v.title,
      desc: v.conditionSub
        ? `${v.conditionDisplay || 'Điều kiện'} • ${v.conditionSub}`
        : v.conditionDisplay || v.desc || 'Áp dụng cho mọi đơn hàng',
      expiry: v.validityDisplay
        ? (v.validityDisplay.startsWith('Hạn dùng:') ? v.validityDisplay : `Hạn dùng: ${v.validityDisplay}`)
        : (v.expiry || 'Hạn dùng: 31/12/2026'),
      badgeLine1: v.badgeLine1 || v.badgeTop || 'ƯU ĐÃI',
      badgeLine2: v.badgeLine2 !== undefined ? v.badgeLine2 : (v.badgeBottom || 'HOT'),
      badgeType: v.badgeType || 'dark',
      badgeIcon: v.badgeIcon || null,
      raw: v,
    }));
  },

  // Tìm voucher theo mã code (dùng cho Giỏ hàng)
  findVoucherByCode: (inputCode) => {
    if (!inputCode) return null;
    const clean = String(inputCode).trim().toUpperCase().replace(/\s+/g, '');
    const all = voucherService.getVouchers();

    return all.find((v) => {
      const vClean = String(v.code || '').trim().toUpperCase().replace(/\s+/g, '');
      return vClean === clean;
    });
  },

  // Đăng ký nhận cập nhật khi Quản lý tạo/xóa voucher
  subscribe: (callback) => {
    const handler = () => {
      if (typeof callback === 'function') {
        callback(voucherService.getVouchers());
      }
    };
    window.addEventListener(UPDATED_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(UPDATED_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  },
};

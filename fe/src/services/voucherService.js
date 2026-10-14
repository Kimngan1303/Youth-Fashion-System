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

// 4 Voucher chuẩn hệ thống mặc định (dùng khi chưa kết nối CSDL hoặc khởi tạo)
export const DEFAULT_VOUCHERS = [
  {
    id: '1',
    voucher_id: '1',
    code: 'YOUTH-VIP10',
    name: 'Chiết khấu 10% Đặc Quyền VIP',
    badgeType: 'gold',
    badgeTop: '10%',
    badgeBottom: 'VIP',
    badgeLine1: 'Đặc quyền',
    badgeLine2: 'VIP',
    discountType: 'percent',
    discountPercent: 10,
    discountAmount: 0,
    discountDisplay: 'Giảm 10%',
    discountSub: 'Đặc Quyền Hội Viên VIP',
    conditionDisplay: 'Thời trang nguyên giá',
    conditionSub: 'Áp dụng mọi đơn hàng',
    minOrder: 0,
    maxDiscount: 0,
    usedCount: 142,
    totalLimit: 500,
    progressPercent: (142 / 500) * 100,
    progressColor: '#111111',
    validityDisplay: '31/12/2026',
    statusText: 'Đang áp dụng',
    statusColor: '#059669',
    statusTab: 'active',
  },
  {
    id: '2',
    voucher_id: '2',
    code: 'ATELIER-500K',
    name: 'Giảm 500.000đ cho đơn từ 3.000.000đ',
    badgeType: 'dark',
    badgeTop: '500K',
    badgeBottom: 'NEW',
    badgeLine1: 'Bộ Sưu Tập',
    badgeLine2: 'Mới',
    discountType: 'fixed',
    discountAmount: 500000,
    discountPercent: 0,
    discountDisplay: 'Giảm 500.000₫',
    discountSub: 'Trừ trực tiếp vào hóa đơn',
    conditionDisplay: 'Đơn từ 3.000.000₫',
    conditionSub: 'BST Fall/Winter Atelier mới nhất',
    minOrder: 3000000,
    maxDiscount: 500000,
    usedCount: 88,
    totalLimit: 300,
    progressPercent: (88 / 300) * 100,
    progressColor: '#111111',
    validityDisplay: '31/12/2026',
    statusText: 'Đang áp dụng',
    statusColor: '#059669',
    statusTab: 'active',
  },
  {
    id: '3',
    voucher_id: '3',
    code: 'BDAY-2026',
    name: 'Quà Tặng Sinh Nhật 1.000.000đ',
    badgeType: 'purple',
    badgeTop: '1.000K',
    badgeBottom: 'BDAY',
    badgeLine1: 'Sinh Nhật',
    badgeLine2: 'VIP',
    discountType: 'fixed',
    discountAmount: 1000000,
    discountPercent: 0,
    discountDisplay: 'Giảm 1.000.000₫',
    discountSub: 'Quà tặng thành viên VIP',
    conditionDisplay: 'Đơn từ 2.000.000₫',
    conditionSub: 'Áp dụng trong tháng sinh nhật',
    minOrder: 2000000,
    maxDiscount: 1000000,
    usedCount: 35,
    totalLimit: 100,
    progressPercent: (35 / 100) * 100,
    progressColor: '#9333EA',
    validityDisplay: '31/12/2026',
    statusText: 'Đang áp dụng',
    statusColor: '#059669',
    statusTab: 'active',
  },
  {
    id: '4',
    voucher_id: '4',
    code: 'FREESHIP-PREMIUM',
    name: 'Miễn Phí Vận Chuyển Hỏa Tốc',
    badgeType: 'blue',
    badgeTop: 'FREE',
    badgeBottom: 'FREE',
    badgeLine1: 'Vận Chuyển',
    badgeLine2: null,
    discountType: 'shipping',
    discountAmount: 50000,
    discountPercent: 0,
    discountDisplay: 'Miễn Phí Vận Chuyển',
    discountSub: 'Giao hỏa tốc 2-4 giờ nội thành',
    conditionDisplay: 'Không giới hạn giá trị',
    conditionSub: 'Áp dụng toàn bộ đơn hàng',
    minOrder: 0,
    maxDiscount: 50000,
    usedCount: 290,
    totalLimit: 1000,
    progressPercent: (290 / 1000) * 100,
    progressColor: '#2563EB',
    validityDisplay: 'Vô thời hạn',
    statusText: 'Đang áp dụng',
    statusColor: '#059669',
    statusTab: 'active',
  },
];

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

/**
 * ==============================================================================
 * DỊCH VỤ DỮ LIỆU & QUẢN LÝ VOUCHER DÙNG CHUNG (VOUCHER SERVICE)
 * ==============================================================================
 * Cung cấp:
 * 1. Lưu trữ và đồng bộ 2 chiều qua localStorage giữa Quản lý (Manager),
 *    Ví Voucher Khách hàng (ProfilePage) và Giỏ hàng (CartPage).
 * 2. Tự động phát sự kiện đồng bộ theo thời gian thực (CustomEvent & Storage).
 * ==============================================================================
 */

const STORAGE_KEY = 'youth_fashion_vouchers_list';
const UPDATED_EVENT = 'youth_fashion_vouchers_updated';

// 4 Voucher chuẩn hệ thống
export const DEFAULT_VOUCHERS = [
  {
    id: 'v1',
    code: 'YOUTH-VIP10',
    name: 'Chiết khấu 10% Đặc Quyền VIP',
    badgeType: 'gold',
    badgeTop: '10%',
    badgeBottom: 'VIP',
    badgeLine1: 'Đặc quyền',
    badgeLine2: 'VIP',
    discountType: 'percent',
    discountPercent: 10,
    discountDisplay: 'Giảm 10%',
    discountSub: 'Đặc Quyền Hội Viên VIP',
    conditionDisplay: 'Thời trang nguyên giá',
    conditionSub: 'Áp dụng mọi đơn hàng',
    minOrder: 0,
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
    id: 'v2',
    code: 'ATELIER-500K',
    name: 'Giảm 500.000đ cho đơn từ 3.000.000đ',
    badgeType: 'dark',
    badgeTop: '500K',
    badgeBottom: 'NEW',
    badgeLine1: 'Bộ Sưu Tập',
    badgeLine2: 'Mới',
    discountType: 'fixed',
    discountAmount: 500000,
    discountDisplay: 'Giảm 500.000₫',
    discountSub: 'Trừ trực tiếp vào hóa đơn',
    conditionDisplay: 'Đơn từ 3.000.000₫',
    conditionSub: 'BST Fall/Winter Atelier mới nhất',
    minOrder: 3000000,
    usedCount: 88,
    totalLimit: 300,
    progressPercent: (88 / 300) * 100,
    progressColor: '#111111',
    validityDisplay: '15/10/2026',
    statusText: 'Đang áp dụng',
    statusColor: '#059669',
    statusTab: 'active',
  },
  {
    id: 'v3',
    code: 'BDAY-2026',
    name: 'Quà Tặng Sinh Nhật 1.000.000đ',
    badgeType: 'purple',
    badgeTop: '1.000K',
    badgeBottom: 'BDAY',
    badgeLine1: 'Sinh Nhật',
    badgeLine2: 'VIP',
    discountType: 'fixed',
    discountAmount: 1000000,
    discountDisplay: 'Giảm 1.000.000₫',
    discountSub: 'Quà tặng thành viên VIP',
    conditionDisplay: 'Đơn từ 2.000.000₫',
    conditionSub: 'Áp dụng trong tháng sinh nhật',
    minOrder: 2000000,
    usedCount: 35,
    totalLimit: 100,
    progressPercent: (35 / 100) * 100,
    progressColor: '#9333EA',
    validityDisplay: 'Tháng sinh nhật năm 2026',
    statusText: 'Đang áp dụng',
    statusColor: '#059669',
    statusTab: 'active',
  },
  {
    id: 'v4',
    code: 'FREESHIP-PREMIUM',
    name: 'Miễn Phí Vận Chuyển Hỏa Tốc',
    badgeType: 'blue',
    badgeIcon: 'truck',
    badgeBottom: 'FREE',
    badgeLine1: 'Vận Chuyển',
    badgeLine2: null,
    discountType: 'shipping',
    discountAmount: 50000,
    discountDisplay: 'Miễn Phí Vận Chuyển',
    discountSub: 'Giao hỏa tốc 2-4 giờ nội thành',
    conditionDisplay: 'Không giới hạn giá trị',
    conditionSub: 'Áp dụng toàn bộ đơn hàng',
    minOrder: 0,
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
  // Lấy toàn bộ danh sách voucher (bao gồm cả các voucher do Quản lý tạo mới)
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
    // Mặc định lưu danh sách khởi tạo
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VOUCHERS));
    } catch (e) {}
    return DEFAULT_VOUCHERS;
  },

  // Lưu danh sách voucher vào localStorage
  saveVouchers: (vouchers) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
      notifyVouchersUpdated();
    } catch (e) {
      console.error('Error saving vouchers to localStorage:', e);
    }
  },

  // Tạo mới voucher từ phía Quản lý (Manager)
  createVoucher: (newVoucher) => {
    const list = voucherService.getVouchers();
    const created = {
      ...newVoucher,
      id: newVoucher.id || `v_${Date.now()}`,
      created_at: newVoucher.created_at || new Date().toISOString(),
    };
    const updatedList = [created, ...list];
    voucherService.saveVouchers(updatedList);
    return created;
  },

  // Xóa voucher
  deleteVoucher: (id) => {
    const list = voucherService.getVouchers();
    const updatedList = list.filter((v) => v.id !== id);
    voucherService.saveVouchers(updatedList);
    return updatedList;
  },

  // Xóa nhiều voucher
  bulkDeleteVouchers: (ids = []) => {
    const idSet = new Set(ids);
    const list = voucherService.getVouchers();
    const updatedList = list.filter((v) => !idSet.has(v.id));
    voucherService.saveVouchers(updatedList);
    return updatedList;
  },

  // Lấy danh sách Voucher đang kích hoạt hiển thị trong Ví Khách hàng (Trang cá nhân)
  getCustomerVouchers: () => {
    const all = voucherService.getVouchers();
    // Chỉ hiển thị các voucher đang kích hoạt (active) cho khách hàng
    const activeVouchers = all.filter((v) => v.statusTab === 'active' || !v.statusTab);

    return activeVouchers.map((v) => ({
      id: v.id,
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

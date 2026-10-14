import * as voucherRepo from '../repositories/voucher.repository.js';

/**
 * Format Voucher để chuẩn hóa giao tiếp API và tương thích cả Manager & Customer
 */
export const formatVoucher = (v) => {
  if (!v) return null;

  const idStr = String(v.voucher_id);
  const minOrderNum = Number(v.min_order) || 0;
  const maxDiscountNum = Number(v.max_discount) || 0;
  const discountAmountNum = Number(v.discount_amount) || 0;
  const discountPercentNum = Number(v.discount_percent) || 0;
  const usedCountNum = Number(v.used_count) || 0;
  const totalLimitNum = Number(v.total_limit) || 500;

  // Tính statusTab dựa trên thời gian và trạng thái
  const now = new Date();
  let statusTab = 'active';
  let statusText = 'Đang áp dụng';
  let statusColor = '#059669';

  if (v.status === 'INACTIVE') {
    statusTab = 'inactive';
    statusText = 'Tạm ngưng';
    statusColor = '#DC2626';
  } else if (v.end_date && new Date(v.end_date) < now) {
    statusTab = 'expired';
    statusText = 'Đã hết hạn';
    statusColor = '#9CA3AF';
  } else if (v.start_date && new Date(v.start_date) > now) {
    statusTab = 'upcoming';
    statusText = 'Sắp diễn ra';
    statusColor = '#D97706';
  }

  // Format nhãn hiển thị giảm giá
  let discountDisplay = '';
  let discountSub = '';
  if (v.discount_type === 'percent') {
    discountDisplay = `Giảm ${discountPercentNum}%`;
    discountSub = maxDiscountNum > 0 ? `Tối đa ${maxDiscountNum.toLocaleString('vi-VN')}₫` : 'Áp dụng mọi đơn hàng';
  } else if (v.discount_type === 'shipping') {
    discountDisplay = 'Miễn Phí Vận Chuyển';
    discountSub = 'Giao hỏa tốc 2-4 giờ nội thành';
  } else {
    discountDisplay = `Giảm ${discountAmountNum.toLocaleString('vi-VN')}₫`;
    discountSub = 'Trừ trực tiếp vào hóa đơn';
  }

  // Format điều kiện
  const conditionDisplay = minOrderNum > 0 ? `Đơn từ ${minOrderNum.toLocaleString('vi-VN')}₫` : 'Không giới hạn';
  const conditionSub = v.category_limit || 'Áp dụng toàn bộ kho';

  // Format hạn dùng
  let validityDisplay = 'Vô thời hạn';
  if (v.start_date && v.end_date) {
    validityDisplay = `${new Date(v.start_date).toLocaleDateString('vi-VN')} - ${new Date(v.end_date).toLocaleDateString('vi-VN')}`;
  } else if (v.end_date) {
    validityDisplay = `Hạn dùng: ${new Date(v.end_date).toLocaleDateString('vi-VN')}`;
  }

  const badgeType = v.badge_type || (v.discount_type === 'percent' ? 'dark' : v.discount_type === 'fixed' ? 'gold' : 'blue');

  return {
    id: idStr,
    voucher_id: idStr,
    code: v.code,
    name: v.name,
    badgeType,
    badgeTop: v.discount_type === 'percent'
      ? `${discountPercentNum}%`
      : (discountAmountNum >= 1000 ? `${Math.round(discountAmountNum / 1000)}K` : 'HOT'),
    badgeBottom: v.discount_type === 'shipping' ? 'FREE' : (v.discount_type === 'percent' ? 'VIP' : 'SALE'),
    badgeLine1: v.discount_type === 'percent'
      ? `${discountPercentNum}%`
      : (discountAmountNum >= 1000 ? `${Math.round(discountAmountNum / 1000)}K` : 'ƯU ĐÃI'),
    badgeLine2: v.discount_type === 'shipping' ? null : (v.discount_type === 'percent' ? 'VIP' : 'HOT'),
    discountType: v.discount_type,
    discountPercent: discountPercentNum,
    discountAmount: discountAmountNum,
    discountDisplay,
    discountSub,
    conditionDisplay,
    conditionSub,
    minOrder: minOrderNum,
    maxDiscount: maxDiscountNum,
    usedCount: usedCountNum,
    totalLimit: totalLimitNum,
    progressPercent: totalLimitNum > 0 ? Math.min(100, (usedCountNum / totalLimitNum) * 100) : 0,
    progressColor: v.discount_type === 'percent' ? '#111111' : (v.discount_type === 'shipping' ? '#2563EB' : '#9333EA'),
    validityDisplay,
    startDate: v.start_date ? v.start_date.toISOString().split('T')[0] : null,
    endDate: v.end_date ? v.end_date.toISOString().split('T')[0] : null,
    statusText,
    statusColor,
    statusTab,
    status: v.status,
    categoryLimit: v.category_limit,
    created_at: v.created_at,
    updated_at: v.updated_at,
  };
};

export const getVouchersService = async (query = {}) => {
  const vouchers = await voucherRepo.findVouchers(query);
  return vouchers.map(formatVoucher);
};

export const getVoucherByIdService = async (id) => {
  const voucher = await voucherRepo.findVoucherById(id);
  if (!voucher) {
    const error = new Error('Không tìm thấy voucher');
    error.statusCode = 404;
    throw error;
  }
  return formatVoucher(voucher);
};

export const getVoucherByCodeService = async (code) => {
  const voucher = await voucherRepo.findVoucherByCode(code);
  if (!voucher) {
    const error = new Error('Mã giảm giá không tồn tại');
    error.statusCode = 404;
    throw error;
  }
  return formatVoucher(voucher);
};

export const createVoucherService = async (data) => {
  const cleanCode = String(data.code || '').trim().toUpperCase();
  const existing = await voucherRepo.findVoucherByCode(cleanCode);
  if (existing) {
    const error = new Error(`Mã voucher "${cleanCode}" đã tồn tại trên hệ thống`);
    error.statusCode = 400;
    throw error;
  }

  const created = await voucherRepo.createVoucher(data);
  return formatVoucher(created);
};

export const updateVoucherService = async (id, data) => {
  const existing = await voucherRepo.findVoucherById(id);
  if (!existing) {
    const error = new Error('Không tìm thấy mã voucher để cập nhật');
    error.statusCode = 404;
    throw error;
  }

  if (data.code) {
    const cleanCode = String(data.code).trim().toUpperCase();
    if (cleanCode !== existing.code) {
      const duplicate = await voucherRepo.findVoucherByCode(cleanCode);
      if (duplicate) {
        const error = new Error(`Mã voucher "${cleanCode}" đã tồn tại`);
        error.statusCode = 400;
        throw error;
      }
    }
  }

  const updated = await voucherRepo.updateVoucher(id, data);
  return formatVoucher(updated);
};

export const deleteVoucherService = async (id) => {
  const existing = await voucherRepo.findVoucherById(id);
  if (!existing) {
    const error = new Error('Không tìm thấy mã voucher để xóa');
    error.statusCode = 404;
    throw error;
  }
  const deleted = await voucherRepo.deleteVoucher(id);
  return formatVoucher(deleted);
};

export const bulkDeleteVouchersService = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { count: 0 };
  }
  return await voucherRepo.bulkDeleteVouchers(ids);
};

/**
 * Áp dụng mã voucher vào đơn hàng và tính toán số tiền giảm
 */
export const applyVoucherService = async ({ code, subtotal = 0 }) => {
  if (!code) {
    const error = new Error('Vui lòng cung cấp mã voucher');
    error.statusCode = 400;
    throw error;
  }

  const voucher = await voucherRepo.findVoucherByCode(code);
  if (!voucher) {
    const error = new Error('Mã giảm giá không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (voucher.status !== 'ACTIVE') {
    const error = new Error('Mã giảm giá này hiện không còn hiệu lực');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (voucher.start_date && new Date(voucher.start_date) > now) {
    const error = new Error('Chương trình ưu đãi chưa tới thời gian áp dụng');
    error.statusCode = 400;
    throw error;
  }

  if (voucher.end_date && new Date(voucher.end_date) < now) {
    const error = new Error('Mã ưu đãi đã hết thời hạn sử dụng');
    error.statusCode = 400;
    throw error;
  }

  if (voucher.total_limit > 0 && voucher.used_count >= voucher.total_limit) {
    const error = new Error('Mã giảm giá đã hết số lượt sử dụng');
    error.statusCode = 400;
    throw error;
  }

  const minOrderNum = Number(voucher.min_order) || 0;
  if (subtotal < minOrderNum) {
    const error = new Error(`Mã giảm giá chỉ áp dụng cho đơn hàng từ ${minOrderNum.toLocaleString('vi-VN')}₫`);
    error.statusCode = 400;
    throw error;
  }

  // Tính số tiền được giảm
  let discountAmount = 0;
  if (voucher.discount_type === 'percent') {
    discountAmount = Math.round((subtotal * (Number(voucher.discount_percent) || 0)) / 100);
    const maxDiscountNum = Number(voucher.max_discount) || 0;
    if (maxDiscountNum > 0 && discountAmount > maxDiscountNum) {
      discountAmount = maxDiscountNum;
    }
  } else if (voucher.discount_type === 'shipping') {
    discountAmount = Number(voucher.discount_amount) || 50000;
  } else {
    discountAmount = Number(voucher.discount_amount) || 0;
  }

  // Số tiền giảm không được vượt quá subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  return {
    voucher: formatVoucher(voucher),
    discountAmount,
    finalTotal: Math.max(0, subtotal - discountAmount),
  };
};

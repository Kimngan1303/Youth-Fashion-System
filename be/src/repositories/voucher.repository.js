import { prisma } from './prisma.js';

/**
 * Lấy danh sách voucher kèm tìm kiếm và bộ lọc
 */
export const findVouchers = async ({ search, status, discount_type } = {}) => {
  const where = {};

  if (search) {
    where.OR = [
      { code: { contains: search } },
      { name: { contains: search } },
    ];
  }

  if (status && status !== 'all' && status !== 'ALL') {
    where.status = status.toUpperCase();
  }

  if (discount_type && discount_type !== 'all' && discount_type !== 'ALL') {
    where.discount_type = discount_type;
  }

  return await prisma.voucher.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });
};

/**
 * Lấy chi tiết voucher theo ID
 */
export const findVoucherById = async (id) => {
  return await prisma.voucher.findUnique({
    where: { voucher_id: BigInt(id) },
  });
};

/**
 * Lấy voucher theo mã Code (không phân biệt chữ hoa/thường)
 */
export const findVoucherByCode = async (code) => {
  if (!code) return null;
  const cleanCode = String(code).trim();
  return await prisma.voucher.findFirst({
    where: {
      code: {
        equals: cleanCode,
      },
    },
  });
};

/**
 * Tạo mới voucher
 */
export const createVoucher = async (data) => {
  return await prisma.voucher.create({
    data: {
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      discount_type: data.discount_type || 'percent',
      discount_percent: Number(data.discount_percent) || 0,
      discount_amount: data.discount_amount || 0,
      min_order: data.min_order || 0,
      max_discount: data.max_discount || 0,
      used_count: Number(data.used_count) || 0,
      total_limit: Number(data.total_limit) || 500,
      start_date: data.start_date ? new Date(data.start_date) : null,
      end_date: data.end_date ? new Date(data.end_date) : null,
      category_limit: data.category_limit || null,
      status: (data.status || 'ACTIVE').toUpperCase(),
      badge_type: data.badge_type || 'dark',
    },
  });
};

/**
 * Cập nhật voucher
 */
export const updateVoucher = async (id, data) => {
  const updateData = {};
  if (data.code !== undefined) updateData.code = data.code.toUpperCase().trim();
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.discount_type !== undefined) updateData.discount_type = data.discount_type;
  if (data.discount_percent !== undefined) updateData.discount_percent = Number(data.discount_percent);
  if (data.discount_amount !== undefined) updateData.discount_amount = data.discount_amount;
  if (data.min_order !== undefined) updateData.min_order = data.min_order;
  if (data.max_discount !== undefined) updateData.max_discount = data.max_discount;
  if (data.used_count !== undefined) updateData.used_count = Number(data.used_count);
  if (data.total_limit !== undefined) updateData.total_limit = Number(data.total_limit);
  if (data.start_date !== undefined) updateData.start_date = data.start_date ? new Date(data.start_date) : null;
  if (data.end_date !== undefined) updateData.end_date = data.end_date ? new Date(data.end_date) : null;
  if (data.category_limit !== undefined) updateData.category_limit = data.category_limit;
  if (data.status !== undefined) updateData.status = data.status.toUpperCase();
  if (data.badge_type !== undefined) updateData.badge_type = data.badge_type;

  return await prisma.voucher.update({
    where: { voucher_id: BigInt(id) },
    data: updateData,
  });
};

/**
 * Xóa voucher
 */
export const deleteVoucher = async (id) => {
  return await prisma.voucher.delete({
    where: { voucher_id: BigInt(id) },
  });
};

/**
 * Xóa nhiều voucher
 */
export const bulkDeleteVouchers = async (ids = []) => {
  const bigIntIds = ids.map((id) => BigInt(String(id).replace(/^v_/, '')));
  return await prisma.voucher.deleteMany({
    where: {
      voucher_id: { in: bigIntIds },
    },
  });
};

/**
 * Tăng lượt sử dụng
 */
export const incrementVoucherUsage = async (voucherId) => {
  return await prisma.voucher.update({
    where: { voucher_id: BigInt(voucherId) },
    data: {
      used_count: { increment: 1 },
    },
  });
};

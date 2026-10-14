import * as voucherService from '../services/voucher.service.js';

export const getVouchers = async (req, res, next) => {
  try {
    const { search, status, discount_type } = req.query;
    const data = await voucherService.getVouchersService({ search, status, discount_type });
    return res.status(200).json({
      status: true,
      message: 'Lấy danh sách mã giảm giá thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getVoucherById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await voucherService.getVoucherByIdService(id);
    return res.status(200).json({
      status: true,
      message: 'Lấy thông tin voucher thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getVoucherByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const data = await voucherService.getVoucherByCodeService(code);
    return res.status(200).json({
      status: true,
      message: 'Tìm thấy mã voucher',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createVoucher = async (req, res, next) => {
  try {
    const data = await voucherService.createVoucherService(req.body);
    return res.status(201).json({
      status: true,
      message: 'Tạo mã voucher thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await voucherService.updateVoucherService(id, req.body);
    return res.status(200).json({
      status: true,
      message: 'Cập nhật mã voucher thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await voucherService.deleteVoucherService(id);
    return res.status(200).json({
      status: true,
      message: 'Xóa mã voucher thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteVouchers = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const result = await voucherService.bulkDeleteVouchersService(ids);
    return res.status(200).json({
      status: true,
      message: 'Xóa các mã voucher đã chọn thành công',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const applyVoucher = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const data = await voucherService.applyVoucherService({ code, subtotal });
    return res.status(200).json({
      status: true,
      message: 'Áp dụng mã giảm giá thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

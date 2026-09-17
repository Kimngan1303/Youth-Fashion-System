import * as brandService from '../services/brand.service.js';

export const getBrands = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const data = await brandService.getBrandsService({ search, status });
    return res.status(200).json({
      status: true,
      message: 'Lấy danh sách thương hiệu thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getBrandById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await brandService.getBrandByIdService(id);
    return res.status(200).json({
      status: true,
      message: 'Lấy chi tiết thương hiệu thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req, res, next) => {
  try {
    const data = await brandService.createBrandService(req.body);
    return res.status(201).json({
      status: true,
      message: 'Tạo mới thương hiệu thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await brandService.updateBrandService(id, req.body);
    return res.status(200).json({
      status: true,
      message: 'Cập nhật thương hiệu thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await brandService.deleteBrandService(id);
    return res.status(200).json({
      status: true,
      message: 'Xóa thương hiệu thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

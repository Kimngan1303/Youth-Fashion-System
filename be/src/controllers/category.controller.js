import * as categoryService from '../services/category.service.js';

export const getCategories = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const data = await categoryService.getCategoriesService({ search, status });
    return res.status(200).json({
      status: true,
      message: 'Lấy danh sách danh mục thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await categoryService.getCategoryByIdService(id);
    return res.status(200).json({
      status: true,
      message: 'Lấy chi tiết danh mục thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const data = await categoryService.createCategoryService(req.body);
    return res.status(201).json({
      status: true,
      message: 'Tạo mới danh mục thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await categoryService.updateCategoryService(id, req.body);
    return res.status(200).json({
      status: true,
      message: 'Cập nhật danh mục thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await categoryService.deleteCategoryService(id);
    return res.status(200).json({
      status: true,
      message: 'Xóa danh mục thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

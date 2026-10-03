import * as lookbookService from '../services/lookbook.service.js';

export const getLookbooks = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const data = await lookbookService.getAllLookbooksService({ search, status });
    return res.status(200).json({
      status: true,
      message: 'Lấy danh sách lookbook thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getLookbookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await lookbookService.getLookbookByIdService(id);
    return res.status(200).json({
      status: true,
      message: 'Lấy chi tiết lookbook thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createLookbook = async (req, res, next) => {
  try {
    const file = req.file;
    const data = await lookbookService.createLookbookService(req.body, file);
    return res.status(201).json({
      status: true,
      message: 'Tạo mới lookbook thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLookbook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = req.file;
    const data = await lookbookService.updateLookbookService(id, req.body, file);
    return res.status(200).json({
      status: true,
      message: 'Cập nhật lookbook thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLookbook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await lookbookService.deleteLookbookService(id);
    return res.status(200).json({
      status: true,
      message: 'Xóa lookbook thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const swapPositions = async (req, res, next) => {
  try {
    const { id1, id2 } = req.body;
    const data = await lookbookService.swapLookbookPositionsService(id1, id2);
    return res.status(200).json({
      status: true,
      message: 'Đổi vị trí lookbook thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

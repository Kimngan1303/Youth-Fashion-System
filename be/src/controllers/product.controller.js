import { BaseResponse } from '../utils/baseResponse.js';
import * as productService from '../services/product.service.js';

/**
 * Controller layer xử lý HTTP Request / Response cho Sản phẩm
 */

export const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProductsService(req.query);
    return BaseResponse.success(res, 'Lấy danh sách sản phẩm thành công', result);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductByIdService(req.params.id);
    return BaseResponse.success(res, 'Lấy chi tiết sản phẩm thành công', product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const files = req.files || [];
    const newProduct = await productService.createProductService(req.body, files);
    return BaseResponse.success(res, 'Tạo sản phẩm thành công', newProduct, 201);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const files = req.files || [];
    const updatedProduct = await productService.updateProductService(req.params.id, req.body, files);
    return BaseResponse.success(res, 'Cập nhật sản phẩm thành công', updatedProduct);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProductService(req.params.id);
    return BaseResponse.success(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

export const addProductImage = async (req, res, next) => {
  try {
    const file = req.file;
    const isPrimary = req.body.is_primary;
    const newImage = await productService.addProductImageService(req.params.id, file, isPrimary);
    return BaseResponse.success(res, 'Tải ảnh lên thành công', newImage, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteProductImage = async (req, res, next) => {
  try {
    const result = await productService.deleteProductImageService(req.params.imageId);
    return BaseResponse.success(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

export const setPrimaryProductImage = async (req, res, next) => {
  try {
    const result = await productService.setPrimaryProductImageService(req.params.id, req.params.imageId);
    return BaseResponse.success(res, 'Đã đặt làm ảnh chính', result);
  } catch (error) {
    next(error);
  }
};

export const getCategoriesAndBrands = async (req, res, next) => {
  try {
    const data = await productService.getCategoriesAndBrandsService();
    return BaseResponse.success(res, 'Lấy danh mục và thương hiệu thành công', data);
  } catch (error) {
    next(error);
  }
};

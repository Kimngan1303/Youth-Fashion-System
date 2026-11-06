import { BaseResponse } from '../utils/baseResponse.js';
import * as wishlistService from '../services/wishlist.service.js';

/**
 * Lấy danh sách sản phẩm yêu thích của khách hàng
 * GET /api/wishlist
 */
export const getWishlist = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.user?.customer_id;
    const wishlist = await wishlistService.getWishlistService(customerId);
    return BaseResponse.success(res, 'Lấy danh sách yêu thích thành công', wishlist);
  } catch (error) {
    next(error);
  }
};

/**
 * Thêm sản phẩm vào danh sách yêu thích
 * POST /api/wishlist
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.user?.customer_id;
    const { product_id } = req.validatedBody || req.body;
    const result = await wishlistService.addToWishlistService(customerId, product_id);
    return BaseResponse.success(res, result.message, result.item, result.already_exists ? 200 : 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle sản phẩm trong danh sách yêu thích
 * POST /api/wishlist/toggle
 */
export const toggleWishlist = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.user?.customer_id;
    const { product_id } = req.validatedBody || req.body;
    const result = await wishlistService.toggleWishlistService(customerId, product_id);
    return BaseResponse.success(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa một sản phẩm khỏi danh sách yêu thích
 * DELETE /api/wishlist/:productId
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.user?.customer_id;
    const productId = req.params.productId;
    const result = await wishlistService.removeFromWishlistService(customerId, productId);
    return BaseResponse.success(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa toàn bộ danh sách yêu thích
 * DELETE /api/wishlist
 */
export const clearWishlist = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.user?.customer_id;
    const result = await wishlistService.clearWishlistService(customerId);
    return BaseResponse.success(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra xem một sản phẩm có nằm trong danh sách yêu thích không
 * GET /api/wishlist/check/:productId
 */
export const checkWishlistStatus = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.user?.customer_id;
    const productId = req.params.productId;
    const result = await wishlistService.checkWishlistStatusService(customerId, productId);
    return BaseResponse.success(res, 'Kiểm tra trạng thái yêu thích thành công', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Đồng bộ danh sách yêu thích sau khi đăng nhập
 * POST /api/wishlist/sync
 */
export const syncWishlist = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.user?.customer_id;
    const body = req.validatedBody || req.body;
    const wishlist = await wishlistService.syncWishlistService(customerId, body);
    return BaseResponse.success(res, 'Đồng bộ danh sách yêu thích thành công', wishlist);
  } catch (error) {
    next(error);
  }
};

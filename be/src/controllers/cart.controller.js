import { BaseResponse } from '../utils/baseResponse.js';
import * as cartService from '../services/cart.service.js';

/**
 * Lấy giỏ hàng của khách hàng hiện tại
 * GET /api/cart
 */
export const getCart = async (req, res, next) => {
  try {
    const customerId = req.user?.id;
    const cart = await cartService.getCartService(customerId);
    return BaseResponse.success(res, 'Lấy thông tin giỏ hàng thành công', cart);
  } catch (error) {
    next(error);
  }
};

/**
 * Thêm sản phẩm biến thể vào giỏ hàng
 * POST /api/cart/items
 */
export const addItem = async (req, res, next) => {
  try {
    const customerId = req.user?.id;
    const body = req.validatedBody || req.body;
    const cart = await cartService.addItemToCartService(customerId, body);
    return BaseResponse.success(res, 'Đã thêm sản phẩm vào giỏ hàng', cart, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ hàng
 * PATCH /api/cart/items/:id
 */
export const updateItemQuantity = async (req, res, next) => {
  try {
    const customerId = req.user?.id;
    const variantId = req.params.id;
    const { quantity } = req.validatedBody || req.body;
    const cart = await cartService.updateCartItemQuantityService(customerId, variantId, quantity);
    return BaseResponse.success(res, 'Cập nhật số lượng thành công', cart);
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa một sản phẩm khỏi giỏ hàng
 * DELETE /api/cart/items/:id
 */
export const deleteItem = async (req, res, next) => {
  try {
    const customerId = req.user?.id;
    const variantId = req.params.id;
    const cart = await cartService.deleteCartItemService(customerId, variantId);
    return BaseResponse.success(res, 'Đã xóa sản phẩm khỏi giỏ hàng', cart);
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa sạch toàn bộ sản phẩm trong giỏ hàng
 * DELETE /api/cart
 */
export const clearCart = async (req, res, next) => {
  try {
    const customerId = req.user?.id;
    const cart = await cartService.clearCartService(customerId);
    return BaseResponse.success(res, 'Đã làm trống giỏ hàng thành công', cart);
  } catch (error) {
    next(error);
  }
};

/**
 * Đồng bộ giỏ hàng từ khách vãng lai (Guest) khi vừa đăng nhập
 * POST /api/cart/sync
 */
export const syncCart = async (req, res, next) => {
  try {
    const customerId = req.user?.id;
    const { items } = req.validatedBody || req.body;
    const cart = await cartService.syncCartService(customerId, items);
    return BaseResponse.success(res, 'Đồng bộ giỏ hàng thành công', cart);
  } catch (error) {
    next(error);
  }
};

import express from 'express';
import * as voucherController from '../controllers/voucher.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import {
  createVoucherSchema,
  updateVoucherSchema,
  applyVoucherSchema,
  validateVoucherBody,
} from '../validations/voucher.validation.js';

const router = express.Router();

/**
 * Public Routes (Khách hàng & Giỏ hàng xem & áp dụng mã giảm giá)
 */
router.get('/', voucherController.getVouchers);
router.get('/code/:code', voucherController.getVoucherByCode);
router.get('/:id', voucherController.getVoucherById);
router.post('/apply', validateVoucherBody(applyVoucherSchema), voucherController.applyVoucher);

/**
 * Protected Routes (Quản lý Voucher - MANAGER & ADMIN)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  validateVoucherBody(createVoucherSchema),
  voucherController.createVoucher
);

router.post(
  '/bulk-delete',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  voucherController.bulkDeleteVouchers
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  validateVoucherBody(updateVoucherSchema),
  voucherController.updateVoucher
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  voucherController.deleteVoucher
);

export default router;

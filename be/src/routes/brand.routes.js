import express from 'express';
import * as brandController from '../controllers/brand.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { createBrandSchema, updateBrandSchema, validateBrandBody } from '../validations/brand.validation.js';

const router = express.Router();

/**
 * Public Routes
 */
router.get('/', brandController.getBrands);
router.get('/:id', brandController.getBrandById);

/**
 * Protected Routes (Chỉ dành cho MANAGER và ADMIN)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  validateBrandBody(createBrandSchema),
  brandController.createBrand
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  validateBrandBody(updateBrandSchema),
  brandController.updateBrand
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  brandController.deleteBrand
);

export default router;

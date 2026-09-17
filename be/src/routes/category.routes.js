import express from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { createCategorySchema, updateCategorySchema, validateCategoryBody } from '../validations/category.validation.js';

const router = express.Router();

/**
 * Public Routes
 */
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

/**
 * Protected Routes (Chỉ dành cho MANAGER và ADMIN)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  validateCategoryBody(createCategorySchema),
  categoryController.createCategory
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  validateCategoryBody(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  categoryController.deleteCategory
);

export default router;

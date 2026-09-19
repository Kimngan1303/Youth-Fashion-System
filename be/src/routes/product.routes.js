import express from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { createProductSchema, updateProductSchema, validateProductBody } from '../validations/product.validation.js';

const router = express.Router();

/**
 * Public Routes (Ai cũng có thể xem, tìm kiếm, lọc)
 */
router.get('/meta', productController.getCategoriesAndBrands);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

/**
 * Protected Routes (Chỉ dành cho MANAGER và ADMIN)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  upload.array('images', 5),
  validateProductBody(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  upload.array('images', 5),
  validateProductBody(updateProductSchema),
  productController.updateProduct
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  productController.deleteProduct
);

router.post(
  '/:id/images',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  upload.single('image'),
  productController.addProductImage
);

router.delete(
  '/images/:imageId',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  productController.deleteProductImage
);

router.patch(
  '/:id/images/:imageId/primary',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  productController.setPrimaryProductImage
);

export default router;

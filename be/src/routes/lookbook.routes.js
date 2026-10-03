import express from 'express';
import * as lookbookController from '../controllers/lookbook.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

/**
 * Public Routes (Xem danh sách lookbook)
 */
router.get('/', lookbookController.getLookbooks);
router.get('/:id', lookbookController.getLookbookById);

/**
 * Protected Routes (Quản lý sáng tạo / chỉnh sửa - MANAGER & ADMIN)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  upload.single('image'),
  lookbookController.createLookbook
);

router.put(
  '/swap-positions',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  lookbookController.swapPositions
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  upload.single('image'),
  lookbookController.updateLookbook
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('MANAGER', 'ADMIN'),
  lookbookController.deleteLookbook
);

export default router;

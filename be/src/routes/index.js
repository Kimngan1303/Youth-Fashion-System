import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import brandRoutes from './brand.routes.js';
import lookbookRoutes from './lookbook.routes.js';
import conversationRoutes from './conversation.routes.js';
import adminRoutes from './admin.routes.js';
import voucherRoutes from './voucher.routes.js';

const router = Router();

// Health Check API
router.get('/health', (req, res) => {
  res.json({ status: true, message: 'YouthFashion Backend API is running' });
});

// Auth Routes
router.use('/auth', authRoutes);

// Product Routes
router.use('/products', productRoutes);

// Category Routes
router.use('/categories', categoryRoutes);

// Brand Routes
router.use('/brands', brandRoutes);

router.use('/lookbooks', lookbookRoutes);

router.use('/conversations', conversationRoutes);

// Voucher Routes
router.use('/vouchers', voucherRoutes);

// Admin Routes (Users & System Configuration)
router.use('/admin', adminRoutes);

export default router;


import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import brandRoutes from './brand.routes.js';

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

export default router;

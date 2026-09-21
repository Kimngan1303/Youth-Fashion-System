import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import brandRoutes from './brand.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: true, message: 'YouthFashion Backend API is running' });
});

router.use('/auth', authRoutes);

router.use('/products', productRoutes);

router.use('/categories', categoryRoutes);

router.use('/brands', brandRoutes);

export default router;

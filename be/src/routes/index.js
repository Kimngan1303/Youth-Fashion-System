import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

// Health Check API
router.get('/health', (req, res) => {
  res.json({ status: true, message: 'YouthFashion Backend API is running' });
});

// Auth Routes
router.use('/auth', authRoutes);

export default router;

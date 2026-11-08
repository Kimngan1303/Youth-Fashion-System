import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { prisma } from './repositories/prisma.js';
import connectDB from './config/connectDB.js';
import routes from './routes/index.js';
import { autoCancelExpiredOrders } from './config/paymentExpiration.job.js';
import { vectorSearchService } from './services/ai/vectorSearch.service.js';
import { fashionClipService } from './services/ai/fashionClip.service.js';

dotenv.config();

// BigInt JSON Serialization Fix cho các trường MySQL BIGINT
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Root route
app.get('/', (req, res) => {
  return res.json({
    message: 'ok',
    metadata: { message: 'YouthFashion Backend API is running' },
  });
});

// Health check endpoint với trạng thái CSDL Prisma và AI Search
app.get('/healthz', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      message: 'Server and Database are healthy',
      databaseState: 'Connected',
      aiState: {
        modelReady: fashionClipService.isReady,
        modelLoading: fashionClipService.isLoading,
        vectorIndexLoaded: vectorSearchService.isLoaded,
        indexedVectors: vectorSearchService.vectorsCache.length,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Database is not connected',
      error: err.message,
    });
  }
});

// API Routes
app.use('/api', routes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  });
});

// Start Server and Jobs
const startServer = async () => {
  await connectDB();

  // 1. Nạp 48 vector sản phẩm vào bộ nhớ RAM cho AI Search
  vectorSearchService.loadVectors();

  // 2. Chạy cronjob tự động hủy đơn hết hạn
  autoCancelExpiredOrders();

  // 3. Khởi động HTTP Server lắng nghe request
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    // 4. Pre-warming mô hình CLIP ngay khi server bật để loại bỏ Cold-start
    fashionClipService
      .init()
      .then(() => {
        console.log('🚀 [AI Engine] Pre-warming hoàn tất: AI Search đã sẵn sàng phục vụ với độ trễ tối thiểu!');
      })
      .catch((err) => {
        console.warn('⚠️ [AI Engine] Pre-warming thất bại (AI Search sẽ tự động thử lại khi có request):', err.message);
      });
  });
};

startServer();

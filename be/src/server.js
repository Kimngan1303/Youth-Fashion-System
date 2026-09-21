import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { prisma } from './repositories/prisma.js';
import connectDB from './config/connectDB.js';
import routes from './routes/index.js';
import { autoCancelExpiredOrders } from './config/paymentExpiration.job.js';

// Nạp các biến cấu hình từ tệp .env vào môi trường thực thi của Node.js
dotenv.config();

BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Khởi tạo ứng dụng Express & HTTP Server
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Phân tích dữ liệu JSON gửi lên từ Request body (application/json)
app.use(express.json());

// Phân tích dữ liệu gửi từ form hoặc urlencoded (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Phân tích cookie gửi kèm trong header của HTTP Request (cần thiết để đọc Refresh Token)
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
      // Cho phép nếu request không có origin hoặc origin nằm trong danh sách trắng
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true, // Cho phép truyền nhận Cookie (Refresh Token) an toàn giữa Client và Server
  })
);

// Endpoint gốc kiểm tra Backend có đang chạy hay không
app.get('/', (req, res) => {
  return res.json({
    message: 'ok',
    metadata: { message: 'YouthFashion Backend API is running' },
  });
});

app.get('/healthz', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      message: 'Server and Database are healthy',
      databaseState: 'Connected',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Database is not connected',
      error: err.message,
    });
  }
});

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  });
});

const startServer = async () => {
  await connectDB();

  autoCancelExpiredOrders();

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();

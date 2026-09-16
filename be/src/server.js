import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { prisma } from './repositories/prisma.js';
import connectDB from './config/connectDB.js';
import routes from './routes/index.js';
import { autoCancelExpiredOrders } from './config/paymentExpiration.job.js';

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
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

// Health check endpoint với trạng thái CSDL Prisma
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

  autoCancelExpiredOrders();

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();

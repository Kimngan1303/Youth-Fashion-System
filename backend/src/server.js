import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route & Health Check
app.get('/', (req, res) => {
  res.json({
    message: 'Youth Fashion API Server is running!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Khởi chạy Server và kết nối MySQL
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Backend API Server đang chạy tại: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.warn(`⚠️ Khởi động server với chế độ chờ kết nối CSDL: ${error.message}`);
    app.listen(PORT, () => {
      console.log(`🚀 Backend API Server đang chạy tại: http://localhost:${PORT} (Chưa kết nối MySQL)`);
    });
  }
}

startServer();

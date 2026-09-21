import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true // Cho phép truyền nhận cookie chứa token bảo mật
}));

// Phân tích dữ liệu JSON và form urlencoded trong Request Body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phân tích Cookie gửi từ trình duyệt Client
app.use(cookieParser());

app.use('/api', apiRouter);

app.use(errorHandler);

export default app;

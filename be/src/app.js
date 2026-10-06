import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

// BigInt JSON Serialization Fix for MySQL BIGINT fields
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;

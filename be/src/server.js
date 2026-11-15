import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/connectDB.js';
import { autoCancelExpiredOrders } from './config/paymentExpiration.job.js';
import { vectorSearchService } from './services/ai/vectorSearch.service.js';
import { fashionClipService } from './services/ai/fashionClip.service.js';

dotenv.config();

const server = http.createServer(app);
const port = process.env.PORT || 5000;

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

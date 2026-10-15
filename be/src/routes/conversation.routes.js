import { Router } from 'express';
import {
  getConversationsController,
  getMessagesController,
  sendMessageController,
  createConversationController,
  updateConversationStatusController,
  streamConversationEventsController,
} from '../controllers/conversation.controller.js';
import { verifyAccessToken } from '../helpers/jwt.helper.js';

const router = Router();

// Middleware xác thực: Nếu có gửi Token mà token lỗi hoặc hết hạn thì trả về 401 để AxiosClient refresh
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch (e) {
      if (e.name === 'TokenExpiredError' || e.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: false,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng làm mới token.',
          code: 'TOKEN_EXPIRED',
        });
      }
    }
  }
  next();
};

// GET /api/conversations/stream - Server-Sent Events (SSE) Realtime Stream cho Quản lý & Khách
router.get('/stream', streamConversationEventsController);

// GET /api/conversations - Lấy danh sách hội thoại
router.get('/', optionalAuth, getConversationsController);

// POST /api/conversations - Tạo hội thoại mới
router.post('/', optionalAuth, createConversationController);

// GET /api/conversations/:conversation_id/messages - Lấy tin nhắn của hội thoại
router.get('/:conversation_id/messages', optionalAuth, getMessagesController);

// POST /api/conversations/:conversation_id/messages - Gửi tin nhắn mới
router.post('/:conversation_id/messages', optionalAuth, sendMessageController);

// PUT /api/conversations/:conversation_id/status - Cập nhật trạng thái hội thoại
router.put('/:conversation_id/status', optionalAuth, updateConversationStatusController);

export default router;

import { Router } from 'express';
import {
  getConversationsController,
  getMessagesController,
  sendMessageController,
} from '../controllers/conversation.controller.js';
import { verifyAccessToken } from '../helpers/jwt.helper.js';

const router = Router();

// Middleware xác thực tùy chọn (nếu có Bearer token thì gán req.user, nếu không có vẫn tiếp tục cho khách)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch (e) {
      // ignore
    }
  }
  next();
};

// GET /api/conversations - Lấy danh sách hội thoại
router.get('/', optionalAuth, getConversationsController);

// GET /api/conversations/:conversation_id/messages - Lấy tin nhắn của hội thoại
router.get('/:conversation_id/messages', optionalAuth, getMessagesController);

// POST /api/conversations/:conversation_id/messages - Gửi tin nhắn mới
router.post('/:conversation_id/messages', optionalAuth, sendMessageController);

export default router;

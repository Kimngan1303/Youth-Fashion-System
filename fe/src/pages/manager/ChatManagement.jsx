import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';
import { conversationService, getInitials } from '../../services/conversation.service';
import {
  MessageSquare,
  Send,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Package,
  ShoppingBag,
  RotateCcw,
  RefreshCw,
  User,
  Phone,
  Mail,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

const managerChatStyles = `
  .manager-chat-layout {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    width: 100%;
    min-height: 100vh;
    background: #F7F6F3;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    box-sizing: border-box;
  }

  .manager-chat-main-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: 100vh;
    overflow-y: auto;
  }

  .manager-chat-content-container {
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
  }

  /* Page Title Bar */
  .manager-page-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .manager-page-heading {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 24px;
    font-weight: 700;
    color: #111111;
    margin: 0;
  }

  .manager-page-subtext {
    font-size: 13px;
    color: #78716C;
    margin-top: 4px;
  }

  /* KPI Summary Cards */
  .manager-kpi-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .manager-kpi-card {
    background: #FFFFFF;
    border: 1px solid #EAE7DF;
    border-radius: 10px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .manager-kpi-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .manager-kpi-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #8C857B;
  }

  .manager-kpi-val {
    font-size: 22px;
    font-weight: 700;
    color: #111111;
  }

  .manager-kpi-badge-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Chat Workspace Frame */
  .manager-chat-frame {
    background: #FFFFFF;
    border: 1px solid #EAE7DF;
    border-radius: 14px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    display: grid;
    grid-template-columns: 360px 1fr;
    height: 640px;
    overflow: hidden;
  }

  /* Left Column: Customer List */
  .manager-conv-list-pane {
    border-right: 1px solid #ECE7E1;
    display: flex;
    flex-direction: column;
    background: #FFFFFF;
    height: 100%;
    overflow: hidden;
  }

  .manager-list-header {
    padding: 16px;
    border-bottom: 1px solid #F0EEE9;
  }

  .manager-search-box {
    position: relative;
    margin-bottom: 12px;
  }

  .manager-search-input {
    width: 100%;
    background: #F7F6F2;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 8px 12px 8px 34px;
    font-size: 12.5px;
    color: #111111;
    outline: none;
    box-sizing: border-box;
  }

  .manager-search-input:focus {
    border-color: #111111;
    background: #FFFFFF;
  }

  .manager-filter-pills {
    display: flex;
    gap: 6px;
  }

  .manager-filter-pill {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 16px;
    color: #57534E;
    background: #F5F4EF;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
  }

  .manager-filter-pill:hover {
    color: #111111;
  }

  .manager-filter-pill.active {
    background: #111111;
    color: #FFFFFF;
  }

  .manager-items-stream {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .manager-conv-item {
    display: flex;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
    margin-bottom: 4px;
    border: 1px solid transparent;
  }

  .manager-conv-item:hover {
    background: #F9F8F5;
  }

  .manager-conv-item.active {
    background: #F4F1EA;
    border-color: #E2DDD5;
  }

  .customer-avatar-box {
    position: relative;
    flex-shrink: 0;
  }

  .customer-avatar-img {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    background: #111111;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
  }

  .manager-conv-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .manager-conv-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .customer-name-heading {
    font-size: 13px;
    font-weight: 700;
    color: #111111;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .manager-conv-time {
    font-size: 10.5px;
    color: #8C857B;
    flex-shrink: 0;
  }

  .manager-topic-title {
    font-size: 12px;
    font-weight: 600;
    color: #44403C;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .manager-status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2px;
  }

  .manager-status-badge {
    font-size: 9.5px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
  }

  .manager-status-badge.open {
    background: #ECFDF5;
    color: #065F46;
  }

  .manager-status-badge.processing {
    background: #EFF6FF;
    color: #1E40AF;
  }

  .manager-status-badge.closed {
    background: #F3F4F6;
    color: #4B5563;
  }

  /* Right Column: Chat Workspace */
  .manager-active-chat-pane {
    display: flex;
    flex-direction: column;
    background: #FAFAF9;
    height: 100%;
    overflow: hidden;
  }

  .manager-chat-top-bar {
    background: #FFFFFF;
    border-bottom: 1px solid #ECE7E1;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .manager-client-details {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .manager-client-name {
    font-size: 15px;
    font-weight: 700;
    color: #111111;
  }

  .manager-client-contact {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 11.5px;
    color: #78716C;
    margin-top: 2px;
  }

  .manager-actions-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .status-select-dropdown {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    color: #111111;
    cursor: pointer;
    outline: none;
  }

  /* Context Bar */
  .manager-context-strip {
    background: #F4F1EA;
    border-bottom: 1px solid #E2DDD5;
    padding: 8px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    flex-shrink: 0;
  }

  /* Message Stream */
  .manager-messages-stream {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .manager-msg-item {
    display: flex;
    flex-direction: column;
    max-width: 76%;
  }

  .manager-msg-item.from-customer {
    align-self: flex-start;
  }

  .manager-msg-item.from-staff {
    align-self: flex-end;
    align-items: flex-end;
  }

  .manager-msg-meta {
    font-size: 11px;
    color: #9CA3AF;
    margin-bottom: 3px;
  }

  .manager-bubble {
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.5;
    word-break: break-word;
  }

  .manager-msg-item.from-customer .manager-bubble {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    color: #111111;
    border-top-left-radius: 4px;
  }

  .manager-msg-item.from-staff .manager-bubble {
    background: #111111;
    color: #FFFFFF;
    border: none;
    border-top-right-radius: 4px;
  }

  /* Bubble Product Attachment Card */
  .manager-bubble-product-card {
    background: #FFFFFF;
    border: 1px solid #ECE7E1;
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 8px;
    max-width: 440px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    text-align: left;
  }

  .manager-product-thumb {
    width: 64px;
    height: 64px;
    border-radius: 6px;
    object-fit: cover;
    border: 1px solid #E5E7EB;
    flex-shrink: 0;
  }

  .manager-product-details {
    flex: 1;
    min-width: 0;
  }

  .manager-product-badge {
    font-size: 9.5px;
    font-weight: 700;
    color: #B45309;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .manager-product-name {
    font-size: 13px;
    font-weight: 700;
    color: #111111;
    margin-top: 1px;
  }

  .manager-product-price {
    font-size: 12px;
    font-weight: 600;
    color: #16A34A;
    margin-top: 2px;
  }

  .manager-product-desc {
    font-size: 11.5px;
    color: #57534E;
    margin-top: 4px;
    line-height: 1.4;
    white-space: normal;
  }

  .manager-product-link {
    display: inline-block;
    margin-top: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #111111;
    text-decoration: underline;
  }

  /* Quick Replies Bar */
  .manager-quick-replies-bar {
    background: #FAF8F5;
    border-top: 1px solid #ECE7E1;
    padding: 8px 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .quick-reply-chip {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 16px;
    padding: 4px 10px;
    font-size: 11.5px;
    color: #4B5563;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .quick-reply-chip:hover {
    background: #111111;
    color: #FFFFFF;
    border-color: #111111;
  }

  /* Input Footer */
  .manager-chat-footer {
    background: #FFFFFF;
    border-top: 1px solid #ECE7E1;
    padding: 12px 24px;
    flex-shrink: 0;
  }

  .manager-input-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #F7F6F2;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    padding: 8px 12px 8px 16px;
  }

  .manager-input-row:focus-within {
    border-color: #111111;
    background: #FFFFFF;
  }

  .manager-textarea {
    flex: 1;
    background: transparent;
    border: none;
    font-size: 13.5px;
    color: #111111;
    outline: none;
    resize: none;
    font-family: inherit;
    line-height: 1.4;
    max-height: 80px;
  }

  .manager-send-btn {
    background: #111111;
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
  }

  .manager-send-btn:hover:not(:disabled) {
    background: #27272A;
    transform: scale(1.03);
  }

  .manager-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .manager-empty-state {
    margin: auto;
    text-align: center;
    padding: 40px;
    color: #78716C;
  }

  /* Realtime Floating Notification Banner */
  .manager-incoming-toast {
    position: fixed;
    top: 24px;
    right: 28px;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: #111111;
    color: #FFFFFF;
    border: 1px solid #374151;
    border-radius: 14px;
    padding: 14px 18px;
    box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12);
    min-width: 380px;
    max-width: 460px;
    animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes toastSlideIn {
    from {
      opacity: 0;
      transform: translateY(-24px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .toast-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .toast-icon-pulse {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: #16A34A;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 12px rgba(22, 163, 74, 0.5);
    animation: pulseIcon 1.5s infinite;
  }

  @keyframes pulseIcon {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
  }

  .toast-text-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .toast-title {
    font-size: 13px;
    color: #ECE7E1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .toast-title strong {
    color: #FFFFFF;
    font-weight: 700;
  }

  .toast-snippet {
    font-size: 12px;
    color: #9CA3AF;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 210px;
  }

  .toast-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .btn-toast-view {
    background: #FFFFFF;
    color: #111111;
    border: none;
    border-radius: 8px;
    padding: 7px 12px;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-toast-view:hover {
    background: #F3F4F6;
    transform: translateY(-1px);
  }

  .btn-toast-close {
    background: transparent;
    border: none;
    color: #9CA3AF;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 4px;
    line-height: 1;
  }

  .btn-toast-close:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const QUICK_TEMPLATES = [
  'Dạ Youth Fashion xin chào bạn! Em có thể hỗ trợ gì cho mình ạ?',
  'Dạ mẫu này bên em hiện còn sẵn size M và L tại cửa hàng ạ.',
  'Dạ Youth Fashion hỗ trợ đổi size miễn phí tận nhà trong 30 ngày ạ.',
  'Em đã kiểm tra đơn hàng, bưu tá sẽ giao đến bạn trong chiều nay ạ.',
  'Dạ bạn có thể cung cấp chiều cao và cân nặng để em chọn size vừa vặn nhất nhé!',
];

export default function ChatManagement() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [incomingNotification, setIncomingNotification] = useState(null);

  const messagesScrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Âm thanh thông báo nhẹ nhàng, thanh lịch chuẩn thời trang cao cấp bằng Web Audio API
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio playback info:', e);
    }
  };

  // Tự động đóng banner thông báo sau 8 giây nếu Quản lý chưa click
  useEffect(() => {
    if (!incomingNotification) return;
    const t = setTimeout(() => {
      setIncomingNotification(null);
    }, 8000);
    return () => clearTimeout(t);
  }, [incomingNotification]);

  // 1. Initial Load of all Customer Conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await conversationService.getManagerConversations(user);
      const list = res.data || [];
      setConversations(list);

      if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0].conversation_id);
        await loadMessages(list[0].conversation_id);
      }
    } catch (err) {
      console.error('Error fetching manager conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Lắng nghe Realtime Server-Sent Events (SSE) và Polling dự phòng
  useEffect(() => {
    // Xin quyền Desktop Notification
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const unsubscribe = conversationService.subscribeToChatStream(
      (newMsg) => {
        // Chỉ xử lý tin nhắn từ Khách Hàng gửi tới
        if (newMsg.sender_type === 'CUSTOMER') {
          playNotificationSound();

          // Hiển thị Banner Toast thông báo trên giao diện
          setIncomingNotification({
            customerName: newMsg.sender_name || 'Khách Hàng',
            content: newMsg.content || (newMsg.attachment_url ? '[Hình ảnh đính kèm]' : 'Đã gửi tin nhắn'),
            conversationId: newMsg.conversation_id,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          });

          // Hiển thị Desktop Notification nếu tab đang chạy ngầm / minimize
          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            new Notification('Youth Fashion - Tin nhắn khách hàng mới', {
              body: `${newMsg.sender_name || 'Khách hàng'}: ${newMsg.content || 'Đã gửi một tin nhắn mới'}`,
              icon: '/logo.png',
            });
          }

          // Cập nhật tin nhắn vào khung chat nếu đang mở đúng cuộc trò chuyện
          setActiveConversationId((currentId) => {
            if (String(currentId) === String(newMsg.conversation_id)) {
              setMessages((prev) => {
                if (prev.some((m) => String(m.id) === String(newMsg.message_id))) return prev;
                return [
                  ...prev,
                  {
                    id: String(newMsg.message_id),
                    sender: 'CUSTOMER',
                    authorName: newMsg.sender_name || 'Khách Hàng',
                    text: newMsg.content || '',
                    attachment_url: newMsg.attachment_url || null,
                    product_card: newMsg.product_card || null,
                    time: new Date(newMsg.created_at || Date.now()).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    created_at: newMsg.created_at || new Date().toISOString(),
                  },
                ];
              });
            }
            return currentId;
          });

          // Cập nhật danh sách hội thoại: đẩy lên đầu & tăng badge chưa đọc
          setConversations((prev) => {
            const list = [...prev];
            const idx = list.findIndex((c) => String(c.conversation_id) === String(newMsg.conversation_id));
            if (idx >= 0) {
              const target = { ...list[idx] };
              target.last_message = newMsg.content || '[Hình ảnh đính kèm]';
              target.last_message_at = newMsg.created_at || new Date().toISOString();
              target.unread_count = (target.unread_count || 0) + 1;
              target.status = 'OPEN';
              list.splice(idx, 1);
              return [target, ...list];
            } else {
              const newConvItem = {
                conversation_id: String(newMsg.conversation_id),
                type: 'PRODUCT_INQUIRY',
                title: `Tư vấn khách hàng: ${newMsg.sender_name || 'Khách Hàng'}`,
                customer_name: newMsg.sender_name || 'Khách Hàng',
                customer_email: newMsg.sender_email || 'khachhang@youthfashion.vn',
                customer_phone: '0988 123 456',
                status: 'OPEN',
                unread_count: 1,
                last_message: newMsg.content || '[Tin nhắn mới]',
                last_message_at: new Date().toISOString(),
              };
              return [newConvItem, ...list];
            }
          });
        }
      }
    );

    // Short-polling dự phòng mỗi 3.5 giây để luôn đồng bộ tức thì
    const pollTimer = setInterval(async () => {
      try {
        const res = await conversationService.getManagerConversations(user);
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setConversations((prev) => {
            const unreadMap = new Map(prev.map((c) => [String(c.conversation_id), c.unread_count || 0]));
            return res.data.map((c) => ({
              ...c,
              unread_count: unreadMap.get(String(c.conversation_id)) || c.unread_count || 0,
            }));
          });
        }
      } catch (e) {}
    }, 3500);

    return () => {
      unsubscribe();
      clearInterval(pollTimer);
    };
  }, [user]);

  // Load messages for a specific conversation
  const loadMessages = async (convId) => {
    try {
      const res = await conversationService.getMessages(convId, user);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  // Switch conversation: KHÔNG tự động trượt xuống dưới, reset lên đầu trang để Quản lý đọc từ đầu
  const handleSelectConversation = async (convId) => {
    setActiveConversationId(convId);
    await loadMessages(convId);
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = 0;
    }
  };

  // Manager Send Message
  const handleSendMessage = async (e, customText = null) => {
    e?.preventDefault();
    const textToSend = customText !== null ? customText : inputText.trim();
    if (!textToSend || !activeConversationId) return;

    setInputText('');
    setSending(true);

    try {
      const res = await conversationService.managerSendMessage(
        activeConversationId,
        { content: textToSend },
        user
      );

      const savedMsg = res.data;
      // Cập nhật tin nhắn vào danh sách, giữ vị trí cố định không tự động trượt xuống
      setMessages((prev) => [...prev, savedMsg]);

      // Cập nhật preview trong danh sách hội thoại
      setConversations((prev) =>
        prev.map((c) =>
          String(c.conversation_id) === String(activeConversationId)
            ? { ...c, last_message: textToSend, last_message_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error('Error sending manager message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Active Conversation
  const activeConv = conversations.find(
    (c) => String(c.conversation_id) === String(activeConversationId)
  );

  // Filters & Search
  const filteredConversations = conversations.filter((c) => {
    return (
      (c.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.last_message || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalCount = conversations.length;

  return (
    <div className="manager-chat-layout">
      <style>{managerChatStyles}</style>

      {/* Realtime Floating Notification Toast cho Quản Lý */}
      {incomingNotification && (
        <div className="manager-incoming-toast">
          <div className="toast-left">
            <div className="toast-icon-pulse">
              <MessageSquare size={18} color="#FFFFFF" />
            </div>
            <div className="toast-text-group">
              <div className="toast-title">
                <span>Khách hàng</span> <strong>{incomingNotification.customerName}</strong> <span>vừa nhắn:</span>
              </div>
              <div className="toast-snippet">{incomingNotification.content}</div>
            </div>
          </div>
          <div className="toast-actions">
            <button
              type="button"
              className="btn-toast-view"
              onClick={() => {
                handleSelectConversation(incomingNotification.conversationId);
                setIncomingNotification(null);
              }}
            >
              Mở chat ngay
            </button>
            <button
              type="button"
              className="btn-toast-close"
              onClick={() => setIncomingNotification(null)}
              title="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Sidebar quản trị */}
      <ManagerSidebar activeMenu="support" />

      {/* Khung nội dung chính */}
      <div className="manager-chat-main-wrapper">
        <ManagerHeader
          showSearch={false}
          userName={user?.full_name || 'Quản Lý Youth Fashion'}
          userRole="Ban Quản Lý & CSKH"
        />

        <div className="manager-chat-content-container">
          {/* Header Title Bar */}
          <div className="manager-page-title-row">
            <div>
              <h1 className="manager-page-heading">Tư Vấn &amp; Chăm Sóc Khách Hàng</h1>
              <p className="manager-page-subtext">
                Tiếp nhận, xử lý thắc mắc và hỗ trợ trực tiếp các yêu cầu của khách hàng toàn hệ thống
              </p>
            </div>
            <button
              type="button"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={fetchConversations}
            >
              <RefreshCw size={14} />
              <span>Đồng bộ tin nhắn</span>
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="manager-kpi-row">
            <div className="manager-kpi-card">
              <div className="manager-kpi-info">
                <span className="manager-kpi-label">Tổng Cuộc Trò Chuyện Khách Hàng</span>
                <span className="manager-kpi-val">{totalCount}</span>
              </div>
              <div className="manager-kpi-badge-icon" style={{ background: '#F5F4EF', color: '#111' }}>
                <MessageSquare size={18} />
              </div>
            </div>

            <div className="manager-kpi-card">
              <div className="manager-kpi-info">
                <span className="manager-kpi-label">Trạng Thái Kết Nối Realtime</span>
                <span className="manager-kpi-val" style={{ fontSize: '15px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }}></span>
                  Hệ Thống Sẵn Sàng
                </span>
              </div>
              <div className="manager-kpi-badge-icon" style={{ background: '#ECFDF5', color: '#16A34A' }}>
                <Sparkles size={18} />
              </div>
            </div>
          </div>

          {/* Unified Chat Workspace */}
          <div className="manager-chat-frame">
            {/* Cột trái: Danh sách hội thoại của khách */}
            <aside className="manager-conv-list-pane">
              <div className="manager-list-header">
                <div className="manager-search-box" style={{ marginBottom: 0 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input
                    type="text"
                    placeholder="Tìm theo khách hàng, email, nội dung..."
                    className="manager-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="manager-items-stream">
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 30, color: '#9CA3AF' }}>
                    Đang tải danh sách...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: '#9CA3AF' }}>
                    Không có cuộc trò chuyện nào
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isActive = String(conv.conversation_id) === String(activeConversationId);
                    return (
                      <div
                        key={conv.conversation_id}
                        className={`manager-conv-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(conv.conversation_id)}
                      >
                        <div className="customer-avatar-box">
                          <div className="customer-avatar-img">
                            {getInitials(conv.customer_name || 'Khách Hàng')}
                          </div>
                        </div>

                        <div className="manager-conv-info">
                          <div className="manager-conv-top">
                            <span className="customer-name-heading">
                              {conv.customer_name || 'Khách Hàng'}
                            </span>
                            <span className="manager-conv-time">
                              {conv.last_message_at
                                ? new Date(conv.last_message_at).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Vừa xong'}
                            </span>
                          </div>

                          <span className="manager-topic-title">
                            {conv.title || 'Hỗ trợ khách hàng'}
                          </span>

                          <div style={{ marginTop: 2 }}>
                            <span
                              style={{
                                fontSize: 11,
                                color: '#78716C',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {conv.last_message || 'Chưa có tin nhắn...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Cột phải: Khung làm việc tiếp nhận & phản hồi */}
            <main className="manager-active-chat-pane">
              {activeConv ? (
                <>
                  {/* Header cuộc trò chuyện */}
                  <div className="manager-chat-top-bar">
                    <div className="manager-client-details">
                      <div className="customer-avatar-img" style={{ width: 44, height: 44 }}>
                        {getInitials(activeConv.customer_name || 'Khách Hàng')}
                      </div>
                      <div>
                        <div className="manager-client-name">
                          {activeConv.customer_name || 'Khách Hàng'}
                        </div>
                        <div className="manager-client-contact">
                          <span>
                            <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {activeConv.customer_email || 'khachhang@youthfashion.vn'}
                          </span>
                          <span>&bull;</span>
                          <span>Chủ đề: <strong>{activeConv.title}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Context Bar nếu có sản phẩm hoặc đơn hàng */}
                  {activeConv.attached_product && (
                    <div className="manager-context-strip">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                          src={activeConv.attached_product.image}
                          alt=""
                          style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', border: '1px solid #ECE7E1', flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ fontSize: 13, color: '#111827' }}>
                            Mã hàng: <strong>{activeConv.attached_product.sku || `YF-${activeConv.attached_product.id}`}</strong> &bull;{' '}
                            <strong>{activeConv.attached_product.name}</strong> &bull; Giá:{' '}
                            <strong style={{ color: '#16A34A' }}>{Number(activeConv.attached_product.price).toLocaleString('vi-VN')}₫</strong>
                          </div>
                          {activeConv.attached_product.description && (
                            <div style={{ fontSize: 11.5, color: '#57534E', marginTop: 3, lineHeight: 1.4, maxWidth: 560 }}>
                              {activeConv.attached_product.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <a
                        href={`/products/${activeConv.attached_product.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#111', fontWeight: 600, textDecoration: 'underline', flexShrink: 0 }}
                      >
                        Xem sản phẩm ↗
                      </a>
                    </div>
                  )}

                  {activeConv.attached_order && (
                    <div className="manager-context-strip">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={16} color="#1E40AF" />
                        <span>
                          Đơn hàng liên quan: <strong>{activeConv.attached_order.order_number}</strong> &bull; Trạng thái:{' '}
                          <strong>{activeConv.attached_order.status}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Vùng tin nhắn: ref để cuộn lên đầu khi chuyển đoạn chat */}
                  <div className="manager-messages-stream" ref={messagesScrollRef}>
                    {messages.length === 0 ? (
                      <div style={{ margin: 'auto', textAlign: 'center', color: '#9CA3AF' }}>
                        Chưa có lịch sử tin nhắn trong cuộc trò chuyện này.
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isFromCustomer = m.sender === 'CUSTOMER';
                        return (
                          <div
                            key={m.id}
                            className={`manager-msg-item ${isFromCustomer ? 'from-customer' : 'from-staff'}`}
                          >
                            <span className="manager-msg-meta">
                              {isFromCustomer
                                ? `${activeConv.customer_name || 'Khách hàng'} • ${m.time || 'Gần đây'}`
                                : `Bạn (Quản lý) • ${m.time || 'Gần đây'}`}
                            </span>
                            <div className="manager-bubble">
                              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                              {/* Thẻ mã hàng kèm hình ảnh và mô tả sản phẩm */}
                              {m.product_card && (
                                <div className="manager-bubble-product-card">
                                  <img
                                    src={m.product_card.image}
                                    alt={m.product_card.name}
                                    className="manager-product-thumb"
                                  />
                                  <div className="manager-product-details">
                                    <div className="manager-product-badge">
                                      MÃ HÀNG: {m.product_card.sku || `YF-${m.product_card.id}`}
                                    </div>
                                    <div className="manager-product-name">{m.product_card.name}</div>
                                    <div className="manager-product-price">
                                      {Number(m.product_card.price).toLocaleString('vi-VN')}₫
                                    </div>
                                    {m.product_card.description && (
                                      <div className="manager-product-desc">
                                        {m.product_card.description}
                                      </div>
                                    )}
                                    <a
                                      href={`/products/${m.product_card.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="manager-product-link"
                                    >
                                      Xem sản phẩm chi tiết ↗
                                    </a>
                                  </div>
                                </div>
                              )}

                              {m.attachment_url && (
                                <img
                                  src={m.attachment_url}
                                  alt="Attachment"
                                  style={{ maxWidth: 220, maxHeight: 160, borderRadius: 8, marginTop: 8 }}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Thanh mẫu câu trả lời nhanh */}
                  <div className="manager-quick-replies-bar">
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8C857B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={12} />
                      Mẫu trả lời:
                    </span>
                    {QUICK_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="quick-reply-chip"
                        onClick={() => handleSendMessage(null, tmpl)}
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>

                  {/* Thanh nhập tin nhắn phản hồi của Quản lý */}
                  <div className="manager-chat-footer">
                    <form onSubmit={handleSendMessage} className="manager-input-row">
                      <textarea
                        rows={1}
                        placeholder="Nhập câu trả lời cho khách hàng (Enter để gửi)..."
                        className="manager-textarea"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        className="manager-send-btn"
                        disabled={!inputText.trim() || sending}
                        title="Gửi câu trả lời (Enter)"
                      >
                        <Send size={15} />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="manager-empty-state">
                  <MessageSquare size={36} style={{ marginBottom: 10, color: '#A8A29E' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>
                    Chọn một cuộc trò chuyện
                  </h3>
                  <p style={{ fontSize: 13, margin: 0 }}>
                    Chọn khách hàng từ danh sách bên trái để xem nội dung và gửi câu trả lời.
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

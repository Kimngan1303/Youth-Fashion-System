import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { conversationService } from '../services/conversation.service';
import {
  Phone,
  Bookmark,
  Image as ImageIcon,
  Send,
  Star,
  Feather,
  RefreshCw,
  Headphones,
  MessageSquare,
  Lock,
} from 'lucide-react';

const chatPageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Montserrat:wght@500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  .chat-page-root {
    background-color: #FAF8F5;
    min-height: calc(100vh - 120px);
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1C1917;
    padding: 0 0 60px 0;
  }

  /* 1. Breadcrumb Bar giống hệt thanh liên hệ */
  .chat-breadcrumb-bar {
    background-color: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    padding: 14px 0;
    margin-bottom: 32px;
    width: 100%;
  }

  .chat-breadcrumb-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #6b7280;
  }

  .bc-link {
    color: #6b7280;
    text-decoration: none;
    transition: color 0.15s;
  }

  .bc-link:hover {
    color: #111827;
  }

  .bc-sep {
    color: #d1d5db;
    font-size: 10px;
  }

  .bc-current {
    color: #111827;
    font-weight: 700;
  }

  .chat-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }

  .chat-main-title {
    font-family: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
    font-size: 42px;
    font-weight: 400;
    line-height: 48px;
    letter-spacing: -0.8px;
    color: #1C1917;
    margin: 0 0 28px 0;
  }

  /* Chat Grid Layout */
  .chat-layout-grid {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 24px;
    align-items: start;
    margin-bottom: 50px;
  }

  /* Left Sidebar */
  .chat-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Status Card */
  .online-status-card {
    background: #FFFFFF;
    border: 1px solid #ECE7E1;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  }

  .online-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #B45309;
    margin-bottom: 4px;
  }

  .online-dot {
    width: 6.5px;
    height: 6.5px;
    background-color: #F59E0B;
    border-radius: 9999px;
    box-shadow: 0 0 6px #F59E0B;
  }

  .status-brand-title {
    font-size: 15px;
    font-weight: 700;
    color: #1C1917;
    margin: 0;
    letter-spacing: -0.2px;
  }

  /* Channels List Card */
  .channels-card {
    background: #FFFFFF;
    border: 1px solid #ECE7E1;
    border-radius: 12px;
    padding: 20px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  }

  .channels-header-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #78716C;
    margin: 0 0 14px 4px;
  }

  .channel-item {
    display: flex;
    flex-direction: column;
    padding: 12px 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 6px;
    border: 1px solid transparent;
  }

  .channel-item:last-child {
    margin-bottom: 0;
  }

  .channel-item:hover {
    background-color: #F8F7F4;
  }

  .channel-item.active {
    background-color: #F2EFEB;
    border-color: #E5DFD6;
  }

  .channel-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .channel-name {
    font-size: 12px;
    font-weight: 700;
    color: #1C1917;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .channel-dot-active {
    width: 6px;
    height: 6px;
    background-color: #16A34A;
    border-radius: 9999px;
  }

  .channel-time {
    font-size: 11px;
    color: #A8A29E;
  }

  .channel-snippet {
    font-size: 11.5px;
    color: #78716C;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 16px;
  }

  /* Right Main Chat Panel */
  .chat-main-card {
    background: #FFFFFF;
    border: 1px solid #ECE7E1;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 640px;
  }

  /* Chat Header */
  .chat-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 24px;
    border-bottom: 1px solid #F0EEE9;
    background: #FFFFFF;
  }

  .consultant-profile {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .consultant-avatar {
    width: 38px;
    height: 38px;
    border-radius: 9999px;
    object-fit: cover;
    border: 1px solid #E7E5E4;
  }

  .consultant-info-col {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .consultant-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 17px;
    font-weight: 600;
    color: #1C1917;
    letter-spacing: -0.3px;
  }

  .cskh-badge {
    background: #111111;
    color: #FFFFFF;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 4px;
  }

  .chat-header-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    color: #57534E;
  }

  .header-action-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #57534E;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .header-action-btn:hover {
    color: #111111;
    background: #F5F4F0;
  }

  /* Chat Messages Stream Area */
  .chat-body-stream {
    flex: 1;
    background-color: #FAFAF9;
    padding: 24px 28px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .date-separator-pill {
    align-self: center;
    background: #EBEAE5;
    color: #57534E;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 9999px;
    margin-bottom: 4px;
  }

  /* Message Rows */
  .msg-row {
    display: flex;
    flex-direction: column;
    max-width: 76%;
  }

  .msg-row.staff {
    align-self: flex-start;
  }

  .msg-row.customer {
    align-self: flex-end;
    align-items: flex-end;
  }

  .msg-meta-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .msg-staff-avatar {
    width: 22px;
    height: 22px;
    background: #111111;
    color: #FFFFFF;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    font-family: 'Playfair Display', serif;
  }

  .msg-author-label {
    font-size: 11.5px;
    color: #78716C;
    font-weight: 500;
  }

  .msg-bubble {
    padding: 16px 20px;
    border-radius: 16px;
    font-size: 13.5px;
    line-height: 22px;
    position: relative;
    box-sizing: border-box;
  }

  .msg-row.staff .msg-bubble {
    background: #FFFFFF;
    color: #292524;
    border: 1px solid #EAE7E1;
    border-top-left-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  }

  .msg-row.customer .msg-bubble {
    background: #111111;
    color: #FFFFFF;
    border-top-right-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  /* Attached Product Card (in Customer message) */
  .attached-product-card {
    background: #FFFFFF;
    border: 1px solid #ECE7E1;
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 10px;
    width: 100%;
    box-sizing: border-box;
    text-decoration: none;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .attached-product-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  }

  .product-thumb-img {
    width: 54px;
    height: 54px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .product-info-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .product-attachment-tag {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #B45309;
  }

  .product-attachment-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 14px;
    font-weight: 600;
    color: #1C1917;
    margin: 0;
  }

  .product-attachment-price {
    font-size: 12px;
    color: #78716C;
  }

  /* Empty Chat State */
  .empty-chat-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 40px 20px;
    text-align: center;
    color: #78716C;
  }

  .empty-chat-icon {
    width: 54px;
    height: 54px;
    border-radius: 9999px;
    background: #F2EFEB;
    border: 1px solid #E5DFD6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #44403C;
    margin-bottom: 16px;
  }

  .empty-chat-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 20px;
    color: #1C1917;
    margin: 0 0 8px 0;
    font-weight: 500;
  }

  .empty-chat-desc {
    font-size: 13px;
    line-height: 20px;
    max-width: 380px;
    margin: 0;
    color: #78716C;
  }

  /* Not Logged In State */
  .not-logged-in-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 40px 20px;
    text-align: center;
  }

  .not-logged-in-badge {
    width: 60px;
    height: 60px;
    border-radius: 9999px;
    background: #F5F4F0;
    border: 1px solid #E7E5E4;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1C1917;
    margin-bottom: 18px;
  }

  .not-logged-in-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 22px;
    color: #1C1917;
    margin: 0 0 10px 0;
  }

  .not-logged-in-desc {
    font-size: 13.5px;
    line-height: 22px;
    color: #78716C;
    max-width: 420px;
    margin: 0 0 24px 0;
  }

  .btn-login-to-chat {
    background: #111111;
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 12px 28px;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-login-to-chat:hover {
    background: #262626;
    transform: translateY(-1px);
  }

  /* Chat Input Area */
  .chat-input-bar-area {
    background: #FFFFFF;
    border-top: 1px solid #F0EEE9;
    padding: 16px 24px 14px 24px;
  }

  .input-inner-shell {
    display: flex;
    align-items: center;
    background: #F5F4F0;
    border: 1px solid #EBE8E1;
    border-radius: 10px;
    padding: 6px 8px 6px 16px;
    transition: border-color 0.2s;
  }

  .input-inner-shell:focus-within {
    border-color: #111111;
    background: #FAF9F6;
  }

  .chat-text-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 13.5px;
    color: #1C1917;
    font-family: inherit;
    outline: none;
    padding: 4px 8px 4px 0;
  }

  .chat-text-input::placeholder {
    color: #A8A29E;
  }

  .input-action-btn {
    background: transparent;
    border: none;
    color: #78716C;
    cursor: pointer;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: color 0.2s;
  }

  .input-action-btn:hover {
    color: #111111;
  }

  .btn-send-message {
    width: 34px;
    height: 34px;
    background: #111111;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 6px;
  }

  .btn-send-message:hover:not(:disabled) {
    background: #262626;
    transform: scale(1.03);
  }

  .btn-send-message:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Input Helper Row */
  .chat-input-helper-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    font-size: 11px;
    color: #78716C;
  }

  .kbd-key-badge {
    background: #EAE8E3;
    border: 1px solid #D6D3CD;
    border-radius: 4px;
    padding: 1px 5px;
    font-size: 9.5px;
    font-family: monospace;
    color: #44403C;
  }

  .security-notice {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #78716C;
  }

  .security-notice-dot {
    width: 5px;
    height: 5px;
    background-color: #B45309;
    border-radius: 9999px;
  }

  /* Value Proposition 4 Features */
  .value-propositions-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    padding: 40px 0 20px 0;
    border-top: 1px solid #ECE7E1;
  }

  .val-prop-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .val-prop-icon-box {
    width: 38px;
    height: 38px;
    border-radius: 9999px;
    border: 1px solid #E7E5E4;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1C1917;
    background: #FFFFFF;
    flex-shrink: 0;
  }

  .val-prop-content h4 {
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: #1C1917;
    margin: 0 0 4px 0;
  }

  .val-prop-content p {
    font-size: 12px;
    line-height: 18px;
    color: #78716C;
    margin: 0;
  }

  @media (max-width: 960px) {
    .chat-layout-grid {
      grid-template-columns: 1fr;
    }

    .value-propositions-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .value-propositions-row {
      grid-template-columns: 1fr;
    }
    
    .msg-row {
      max-width: 90%;
    }
  }
`;

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]); // Khởi tạo rỗng, không tạo tin nhắn mẫu
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const streamEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations khi người dùng đã đăng nhập tài khoản thật
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) {
        setConversations([]);
        setMessages([]);
        setActiveConversationId(null);
        return;
      }

      try {
        setLoading(true);
        const res = await conversationService.getConversations();
        const convList = res.data || [];
        setConversations(convList);

        if (convList.length > 0) {
          const firstConv = convList[0];
          setActiveConversationId(firstConv.conversation_id);
          // Load tin nhắn thật từ CSDL
          await loadMessages(firstConv.conversation_id);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  // Hàm load tin nhắn thực tế từ CSDL
  const loadMessages = async (convId) => {
    try {
      const res = await conversationService.getMessages(convId);
      const rawMessages = res.data || [];
      const mapped = rawMessages.map((m) => {
        const isCustomer = m.sender_type === 'CUSTOMER';
        return {
          id: m.message_id,
          sender: m.sender_type,
          authorName: isCustomer ? (user?.full_name || 'Quý khách') : 'Youth Fashion',
          time: new Date(m.created_at).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          text: m.content,
          attachmentUrl: m.attachment_url,
        };
      });
      setMessages(mapped);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Chọn conversation khác
  const handleSelectConversation = async (convId) => {
    setActiveConversationId(convId);
    await loadMessages(convId);
  };

  // Gửi tin nhắn thực tế vào CSDL
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    if (!user) {
      navigate('/login');
      return;
    }

    const contentToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      if (activeConversationId) {
        const res = await conversationService.sendMessage(activeConversationId, {
          content: contentToSend,
        });

        const newSavedMsg = res.data;
        const mapped = {
          id: newSavedMsg.message_id,
          sender: newSavedMsg.sender_type,
          authorName: user.full_name || 'Quý khách',
          time: new Date(newSavedMsg.created_at).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          text: newSavedMsg.content,
        };

        setMessages((prev) => [...prev, mapped]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
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

  const activeConv = conversations.find((c) => c.conversation_id === activeConversationId);

  return (
    <div className="chat-page-root">
      <style>{chatPageStyles}</style>

      {/* 1. Breadcrumbs Bar */}
      <div className="chat-breadcrumb-bar">
        <div className="container chat-breadcrumb-content">
          <Link to="/" className="bc-link">TRANG CHỦ</Link>
          <span className="bc-sep">&gt;</span>
          <span className="bc-current">CHAT</span>
        </div>
      </div>

      <div className="chat-container">
        {/* Title */}
        <h1 className="chat-main-title">Chat Message</h1>

        {/* Grid: Left Channels Sidebar + Right Chat Panel */}
        <div className="chat-layout-grid">
          {/* Left Column */}
          <aside className="chat-sidebar">
            {/* Status Card */}
            <div className="online-status-card">
              <div className="online-indicator">
                <span className="online-dot" />
                <span>ĐANG TRỰC TUYẾN</span>
              </div>
              <h3 className="status-brand-title">Youth Fashion</h3>
            </div>

            {/* Channels Card */}
            <div className="channels-card">
              <div className="channels-header-label">KÊNH HỖ TRỢ &amp; TƯ VẤN</div>

              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    className={`channel-item ${activeConversationId === conv.conversation_id ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conv.conversation_id)}
                  >
                    <div className="channel-top-row">
                      <span className="channel-name">
                        {conv.manager_name || 'HOÀNG THẢO LY'}
                      </span>
                      <span className="channel-dot-active" />
                    </div>
                    <span className="channel-snippet">
                      {conv.last_message || 'Bắt đầu cuộc trò chuyện...'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="channel-item active">
                  <div className="channel-top-row">
                    <span className="channel-name">HOÀNG THẢO LY</span>
                    <span className="channel-dot-active" />
                  </div>
                  <span className="channel-snippet">Chuyên viên tư vấn phong cách</span>
                </div>
              )}
            </div>
          </aside>

          {/* Right Column: Main Chat Window */}
          <main className="chat-main-card">
            {/* Chat Top Header */}
            <div className="chat-header-bar">
              <div className="consultant-profile">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80"
                  alt="Hoàng Thảo Ly"
                  className="consultant-avatar"
                />
                <div className="consultant-info-col">
                  <span className="consultant-name">
                    {activeConv?.manager_name || 'Hoàng Thảo Ly'}
                  </span>
                  <span className="cskh-badge">CSKH</span>
                </div>
              </div>

              <div className="chat-header-actions">
                <button type="button" className="header-action-btn" title="Gọi hỗ trợ trực tiếp">
                  <Phone size={17} />
                </button>
                <button type="button" className="header-action-btn" title="Lưu cuộc trò chuyện">
                  <Bookmark size={17} />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="chat-body-stream">
              {!user ? (
                // Trạng thái Chưa đăng nhập: Yêu cầu đăng nhập tài khoản thật
                <div className="not-logged-in-state">
                  <div className="not-logged-in-badge">
                    <Lock size={26} />
                  </div>
                  <h3 className="not-logged-in-title">Đăng Nhập Để Trò Chuyện</h3>
                  <p className="not-logged-in-desc">
                    Vui lòng đăng nhập tài khoản Youth Fashion của quý khách để kết nối trực tiếp với chuyên viên tư vấn phong cách và lưu trữ toàn bộ lịch sử trao đổi.
                  </p>
                  <Link to="/login" className="btn-login-to-chat">
                    ĐĂNG NHẬP NGAY &rarr;
                  </Link>
                </div>
              ) : messages.length === 0 ? (
                // Trạng thái đã đăng nhập nhưng chưa có tin nhắn nào được gửi
                <div className="empty-chat-state">
                  <div className="empty-chat-icon">
                    <MessageSquare size={24} />
                  </div>
                  <h4 className="empty-chat-title">Chưa Có Tin Nhắn Nào</h4>
                  <p className="empty-chat-desc">
                    Hãy nhập câu hỏi hoặc yêu cầu tư vấn bên dưới để bắt đầu cuộc trò chuyện trực tiếp cùng chuyên viên phong cách.
                  </p>
                </div>
              ) : (
                // Hiển thị tin nhắn thực tế từ tài khoản
                <>
                  <div className="date-separator-pill">HÔM NAY</div>

                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`msg-row ${msg.sender === 'CUSTOMER' ? 'customer' : 'staff'}`}
                    >
                      <div className="msg-meta-header">
                        {msg.sender === 'EMPLOYEE' && (
                          <span className="msg-staff-avatar">YF</span>
                        )}
                        <span className="msg-author-label">
                          {msg.authorName} &bull; {msg.time}
                        </span>
                      </div>

                      <div className="msg-bubble">
                        <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div ref={streamEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="chat-input-bar-area">
              <form onSubmit={handleSendMessage} className="input-inner-shell">
                <input
                  type="text"
                  className="chat-text-input"
                  placeholder={
                    user
                      ? 'Nhập câu hỏi hoặc yêu cầu...'
                      : 'Vui lòng đăng nhập để gửi tin nhắn...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!user || sending}
                />
                <button
                  type="button"
                  className="input-action-btn"
                  title="Đính kèm hình ảnh"
                  disabled={!user}
                >
                  <ImageIcon size={19} />
                </button>
                <button
                  type="submit"
                  className="btn-send-message"
                  disabled={!user || !inputText.trim() || sending}
                  title="Gửi tin nhắn"
                >
                  <Send size={15} />
                </button>
              </form>

              <div className="chat-input-helper-row">
                <span>
                  Nhấn <kbd className="kbd-key-badge">Enter</kbd> để gửi tin nhắn
                </span>
                <span className="security-notice">
                  <span className="security-notice-dot" />
                  Mã hóa bảo mật thông tin riêng tư
                </span>
              </div>
            </div>
          </main>
        </div>

        {/* 4 Brand Pillars (Bottom Value Propositions) */}
        <div className="value-propositions-row">
          <div className="val-prop-item">
            <div className="val-prop-icon-box">
              <Star size={18} strokeWidth={1.7} />
            </div>
            <div className="val-prop-content">
              <h4>CHẤT LƯỢNG THƯỢNG HẠNG</h4>
              <p>Chất liệu cao cấp &amp; tay nghề thủ công tỉ mỉ từng chi tiết.</p>
            </div>
          </div>

          <div className="val-prop-item">
            <div className="val-prop-icon-box">
              <Feather size={18} strokeWidth={1.7} />
            </div>
            <div className="val-prop-content">
              <h4>THIẾT KẾ ĐỘC BẢN</h4>
              <p>Độc quyền sáng tạo bởi chuyên gia thiết kế hàng đầu.</p>
            </div>
          </div>

          <div className="val-prop-item">
            <div className="val-prop-icon-box">
              <RefreshCw size={18} strokeWidth={1.7} />
            </div>
            <div className="val-prop-content">
              <h4>THỜI TRANG BỀN VỮNG</h4>
              <p>Cam kết quy trình bền vững và có trách nhiệm vì tương lai.</p>
            </div>
          </div>

          <div className="val-prop-item">
            <div className="val-prop-icon-box">
              <Headphones size={18} strokeWidth={1.7} />
            </div>
            <div className="val-prop-content">
              <h4>ĐỒNG HÀNH CÙNG KHÁCH HÀNG</h4>
              <p>Dịch vụ cá nhân hóa &amp; chăm sóc khách hàng tận tâm 24/7.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

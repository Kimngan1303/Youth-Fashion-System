import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { conversationService } from '../services/conversation.service';
import { playNotificationSound } from '../utils/notificationSound';

export default function CustomerChatNotification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState(null);
  const timerRef = useRef(null);

  // Chỉ kích hoạt thông báo cho tài khoản Khách Hàng (CUSTOMER)
  const isCustomer = user && user.role !== 'MANAGER' && user.role !== 'ADMIN' && user.user_type !== 'EMPLOYEE';

  useEffect(() => {
    if (!isCustomer) return;

    // Xin quyền Desktop Notification
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const unsubscribe = conversationService.subscribeToChatStream((newMsg) => {
      // Chỉ nhận thông báo khi có phản hồi từ nhân viên / quản lý (EMPLOYEE)
      if (newMsg.sender_type === 'EMPLOYEE') {
        // Kiểm tra xem tin nhắn có thuộc về khách hàng này không
        if (newMsg.customer_id && String(newMsg.customer_id) !== String(user.id)) {
          return;
        }

        // 1. Phát âm thanh thông báo du dương
        playNotificationSound();

        // Nếu người dùng đang mở trang /chat và đang xem chính cuộc trò chuyện này,
        // tin nhắn đã hiển thị trực tiếp trong khung chat, không cần hiển thị popup toast
        const activeChatConv = sessionStorage.getItem('active_chat_conv_id');
        const isViewingThis =
          location.pathname === '/chat' &&
          (String(activeChatConv) === String(newMsg.conversation_id) ||
            new URLSearchParams(location.search).get('convId') === String(newMsg.conversation_id));

        if (isViewingThis) {
          return;
        }

        // 2. Định dạng nội dung tin nhắn hiển thị
        let displayContent = newMsg.content || '';
        if (displayContent.startsWith('{') && displayContent.endsWith('}')) {
          try {
            const p = JSON.parse(displayContent);
            displayContent = p.text || (p.product_card ? `Gửi thẻ sản phẩm: ${p.product_card.name}` : displayContent);
          } catch (e) {}
        }
        if (newMsg.attachment_url && !displayContent) {
          displayContent = '[Hình ảnh đính kèm]';
        }

        const rawMgrName = (newMsg.sender_name || 'Quản Lý Youth Fashion').trim();
        const cleanMgrName = rawMgrName.replace(/^Quản\s*lý\s*/i, '').trim() || rawMgrName;

        // 3. Hiển thị Popup Toast trên giao diện
        if (timerRef.current) clearTimeout(timerRef.current);
        setNotification({
          managerName: cleanMgrName,
          content: displayContent,
          conversationId: newMsg.conversation_id,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        });

        timerRef.current = setTimeout(() => {
          setNotification(null);
        }, 7000);

        // 4. Desktop Notification nếu tab đang chạy ngầm
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification('Youth Fashion - Tin nhắn từ quản lý', {
            body: `${managerName}: ${displayContent}`,
            icon: '/logo.png',
          });
        }
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isCustomer, user?.id]);

  if (!notification) return null;

  const handleOpenChat = () => {
    const targetConvId = notification.conversationId;
    setNotification(null);
    if (location.pathname === '/chat') {
      window.dispatchEvent(new CustomEvent('chat:select_conversation', { detail: { conversationId: targetConvId } }));
    } else {
      navigate(`/chat?convId=${targetConvId}`, {
        state: {
          focusConversationId: targetConvId,
        },
      });
    }
  };

  return (
    <>
      <style>{`
        .customer-incoming-toast {
          position: fixed;
          top: 24px;
          right: 28px;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #111111;
          color: #FFFFFF;
          border: 1px solid #374151;
          border-radius: 14px;
          padding: 14px 18px;
          box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.12);
          min-width: 360px;
          max-width: 460px;
          animation: customerToastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        @keyframes customerToastIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .customer-toast-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .customer-toast-icon-pulse {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #16A34A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 12px rgba(22, 163, 74, 0.5);
          animation: customerPulseIcon 1.5s infinite;
        }

        @keyframes customerPulseIcon {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }

        .customer-toast-text-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .customer-toast-title {
          font-size: 13px;
          color: #E5E7EB;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .customer-toast-title strong {
          color: #FFFFFF;
          font-weight: 700;
        }

        .customer-toast-snippet {
          font-size: 12px;
          color: #9CA3AF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 210px;
        }

        .customer-toast-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn-customer-toast-view {
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

        .btn-customer-toast-view:hover {
          background: #F3F4F6;
          transform: translateY(-1px);
        }

        .btn-customer-toast-close {
          background: transparent;
          border: none;
          color: #9CA3AF;
          font-size: 16px;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
          line-height: 1;
        }

        .btn-customer-toast-close:hover {
          color: #FFFFFF;
        }
      `}</style>

      <div className="customer-incoming-toast">
        <div className="customer-toast-left">
          <div className="customer-toast-icon-pulse">
            <MessageSquare size={18} color="#FFFFFF" />
          </div>
          <div className="customer-toast-text-group">
            <div className="customer-toast-title">
              <span>Quản lý</span> <strong>{notification.managerName}</strong> <span>vừa nhắn:</span>
            </div>
            <div className="customer-toast-snippet">{notification.content}</div>
          </div>
        </div>

        <div className="customer-toast-actions">
          <button
            type="button"
            className="btn-customer-toast-view"
            onClick={handleOpenChat}
          >
            Mở chat ngay
          </button>
          <button
            type="button"
            className="btn-customer-toast-close"
            onClick={() => setNotification(null)}
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}


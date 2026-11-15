import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { conversationService } from '../services/conversation.service';
import { playNotificationSound } from '../utils/notificationSound';

export default function ManagerChatNotification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState(null);
  const timerRef = useRef(null);

  // Chỉ kích hoạt thông báo cho tài khoản Quản Lý / Quản Trị Viên (MANAGER, ADMIN, EMPLOYEE)
  const isManager =
    user &&
    (user.role === 'MANAGER' ||
      user.role === 'ADMIN' ||
      user.user_type === 'EMPLOYEE' ||
      user.employee_role === 'ADMIN' ||
      user.employee_role === 'MANAGER');

  useEffect(() => {
    if (!isManager) return;

    // Xin quyền Desktop Notification nếu được hỗ trợ
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const unsubscribe = conversationService.subscribeToChatStream((newMsg) => {
      // Chỉ nhận thông báo khi có tin nhắn từ Khách Hàng (CUSTOMER)
      if (newMsg.sender_type === 'CUSTOMER') {
        // 1. Phát âm thanh chuông thông báo
        playNotificationSound();

        // Nếu Quản lý đang mở trang /manager/chat và đang xem chính cuộc trò chuyện này,
        // tin nhắn đã hiển thị trực tiếp trong khung chat, không cần hiển thị popup toast
        const activeMgrConv = sessionStorage.getItem('active_manager_conv_id');
        const isViewingThis =
          location.pathname.startsWith('/manager/chat') &&
          (String(activeMgrConv) === String(newMsg.conversation_id) ||
            new URLSearchParams(location.search).get('convId') === String(newMsg.conversation_id));

        if (isViewingThis) {
          return;
        }

        // 2. Định dạng nội dung tin nhắn hiển thị
        let displayContent = newMsg.content || '';
        if (displayContent.startsWith('{') && displayContent.endsWith('}')) {
          try {
            const p = JSON.parse(displayContent);
            displayContent =
              p.text ||
              (p.product_card ? `Hỏi về sản phẩm: ${p.product_card.name}` : displayContent);
          } catch (e) {}
        }
        if (newMsg.attachment_url && !displayContent) {
          displayContent = '[Hình ảnh đính kèm]';
        }

        const rawCustName = (newMsg.sender_name || 'Khách Hàng').trim();
        const cleanCustName =
          rawCustName.replace(/^Khách\s*hàng\s*/i, '').trim() || rawCustName;

        // 3. Hiển thị Popup Toast trên giao diện
        if (timerRef.current) clearTimeout(timerRef.current);
        setNotification({
          customerName: cleanCustName,
          content: displayContent || 'Đã gửi tin nhắn mới',
          conversationId: newMsg.conversation_id,
          timestamp: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });

        timerRef.current = setTimeout(() => {
          setNotification(null);
        }, 7000);

        // 4. Desktop Notification nếu tab đang chạy ngầm
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification('Youth Fashion - Tin nhắn khách hàng mới', {
            body: `${cleanCustName}: ${displayContent || 'Đã gửi một tin nhắn mới'}`,
            icon: '/logo.png',
          });
        }
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isManager]);

  if (!notification) return null;

  const handleOpenChat = () => {
    const targetConvId = notification.conversationId;
    setNotification(null);
    if (location.pathname === '/manager/chat') {
      window.dispatchEvent(
        new CustomEvent('manager_chat:select_conversation', {
          detail: { conversationId: targetConvId },
        })
      );
    } else {
      navigate(`/manager/chat?convId=${targetConvId}`, {
        state: {
          focusConversationId: targetConvId,
        },
      });
    }
  };

  const isPureDefaultName =
    !notification.customerName ||
    notification.customerName.toLowerCase() === 'khách hàng' ||
    notification.customerName.toLowerCase() === 'khách';

  return (
    <>
      <style>{`
        .manager-incoming-toast {
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
          animation: managerToastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        @keyframes managerToastIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .manager-toast-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .manager-toast-icon-pulse {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #16A34A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 12px rgba(22, 163, 74, 0.5);
          animation: managerPulseIcon 1.5s infinite;
        }

        @keyframes managerPulseIcon {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }

        .manager-toast-text-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .manager-toast-title {
          font-size: 13px;
          color: #E5E7EB;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .manager-toast-title strong {
          color: #FFFFFF;
          font-weight: 700;
        }

        .manager-toast-snippet {
          font-size: 12px;
          color: #9CA3AF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 210px;
        }

        .manager-toast-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn-manager-toast-view {
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

        .btn-manager-toast-view:hover {
          background: #F3F4F6;
          transform: translateY(-1px);
        }

        .btn-manager-toast-close {
          background: transparent;
          border: none;
          color: #9CA3AF;
          font-size: 16px;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
          line-height: 1;
        }

        .btn-manager-toast-close:hover {
          color: #FFFFFF;
        }
      `}</style>

      <div className="manager-incoming-toast">
        <div className="manager-toast-left">
          <div className="manager-toast-icon-pulse">
            <MessageSquare size={18} color="#FFFFFF" />
          </div>
          <div className="manager-toast-text-group">
            <div className="manager-toast-title">
              {isPureDefaultName ? (
                <>
                  <strong>Khách hàng</strong> <span>vừa nhắn:</span>
                </>
              ) : (
                <>
                  <span>Khách hàng</span> <strong>{notification.customerName}</strong> <span>vừa nhắn:</span>
                </>
              )}
            </div>
            <div className="manager-toast-snippet">{notification.content}</div>
          </div>
        </div>

        <div className="manager-toast-actions">
          <button
            type="button"
            className="btn-manager-toast-view"
            onClick={handleOpenChat}
          >
            Mở chat ngay
          </button>
          <button
            type="button"
            className="btn-manager-toast-close"
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


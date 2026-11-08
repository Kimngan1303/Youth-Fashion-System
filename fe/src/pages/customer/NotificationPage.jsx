import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  Package,
  Truck,
  RotateCcw,
  AlertCircle,
  Check,
  Trash2,
  ChevronRight,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  clearAllNotifications
} from '../../services/notificationService';

export default function NotificationPage() {
  const { user } = useAuth();
  const { showSuccess, showInfo } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'

  // Tải danh sách thông báo của người dùng
  const refreshNotifications = useCallback(() => {
    const list = getNotificationsForUser(user);
    setNotifications(list);
  }, [user]);

  useEffect(() => {
    refreshNotifications();

    const handleNotifAdded = () => refreshNotifications();
    const handleNotifUpdated = () => refreshNotifications();
    const handleStorageChange = (e) => {
      if (
        e.key === 'yf_customer_notifications' ||
        e.key === 'yf_last_notification_event' ||
        e.key === 'yf_last_status_event' ||
        (e.key && e.key.startsWith('yf_notifications_'))
      ) {
        refreshNotifications();
      }
    };

    window.addEventListener('yf_notification_added', handleNotifAdded);
    window.addEventListener('yf_notifications_updated', handleNotifUpdated);
    window.addEventListener('yf_order_status_changed', handleNotifAdded);
    window.addEventListener('order_status_updated', handleNotifAdded);
    window.addEventListener('storage', handleStorageChange);

    let bc = null;
    try {
      bc = new BroadcastChannel('yf_orders_sync_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_NOTIFICATION' || event.data?.status || event.data?.orderId) {
          refreshNotifications();
        }
      };
    } catch (e) {}

    return () => {
      window.removeEventListener('yf_notification_added', handleNotifAdded);
      window.removeEventListener('yf_notifications_updated', handleNotifUpdated);
      window.removeEventListener('yf_order_status_changed', handleNotifAdded);
      window.removeEventListener('order_status_updated', handleNotifAdded);
      window.removeEventListener('storage', handleStorageChange);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
    };
  }, [refreshNotifications]);

  const unreadCount = useMemo(() => {
    return (notifications || []).filter(item => !item.is_read).length;
  }, [notifications]);

  const readCount = useMemo(() => {
    return (notifications || []).filter(item => item.is_read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'UNREAD') {
      return (notifications || []).filter(item => !item.is_read);
    }
    if (activeFilter === 'READ') {
      return (notifications || []).filter(item => item.is_read);
    }
    return notifications || [];
  }, [notifications, activeFilter]);

  const handleMarkAllRead = () => {
    if (unreadCount === 0) {
      showInfo('Tất cả thông báo đều đã được đọc!');
      return;
    }
    markAllNotificationsAsRead(user);
    refreshNotifications();
    showSuccess('Đã đánh dấu tất cả thông báo là đã đọc!');
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông báo không? Thao tác này không thể hoàn tác.')) {
      clearAllNotifications(user);
      refreshNotifications();
      showSuccess('Đã xóa toàn bộ thông báo thành công!');
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.is_read) {
      markNotificationAsRead(item.id, user);
      refreshNotifications();
    }
    if (item.order_digits) {
      navigate(`/profile?tab=orders&order=${item.order_digits}`);
    } else if (item.link) {
      navigate(item.link);
    } else {
      navigate('/profile?tab=orders');
    }
  };

  // Xác định icon phù hợp cho loại thông báo
  const renderNotifIcon = (type, badgeBg, badgeColor) => {
    const t = String(type || '').toUpperCase();
    if (t.includes('CONFIRMED')) {
      return <CheckCircle size={20} color={badgeColor || '#0369A1'} />;
    }
    if (t.includes('SHIPPING')) {
      return <Truck size={20} color={badgeColor || '#1D4ED8'} />;
    }
    if (t.includes('COMPLETED')) {
      return <CheckCircle size={20} color={badgeColor || '#15803D'} />;
    }
    if (t.includes('CANCEL')) {
      return <AlertCircle size={20} color={badgeColor || '#B91C1C'} />;
    }
    if (t.includes('REFUND') || t.includes('RETURN')) {
      return <RotateCcw size={20} color={badgeColor || '#7E22CE'} />;
    }
    return <Package size={20} color={badgeColor || '#111827'} />;
  };

  return (
    <div className="notification-page-wrapper">
      {/* 1. Breadcrumbs */}
      <nav className="notification-breadcrumb">
        <Link to="/" className="breadcrumb-link">TRANG CHỦ</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">
          THÔNG BÁO CỦA TÔI ({notifications.length < 10 ? `0${notifications.length}` : notifications.length})
        </span>
      </nav>

      {/* 2. Page Header */}
      <div className="notification-header-card">
        <div className="header-left">
          <div className="header-icon-box">
            <Bell size={24} color="#111827" />
            {unreadCount > 0 && <span className="header-unread-dot" />}
          </div>
          <div>
            <h1 className="header-title font-serif">TRUNG TÂM THÔNG BÁO</h1>
            <p className="header-subtitle">
              Cập nhật trực tiếp tiến trình xác nhận, đóng gói, giao hàng, hủy đơn và đổi trả theo thời gian thực.
            </p>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="header-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-mark-all-read"
                onClick={handleMarkAllRead}
                title="Đánh dấu tất cả thông báo là đã đọc"
              >
                <Check size={15} />
                <span>Đã đọc tất cả</span>
              </button>
            )}
            <button
              type="button"
              className="btn-clear-all"
              onClick={handleClearAll}
              title="Xóa toàn bộ thông báo"
            >
              <Trash2 size={15} />
              <span>Xóa tất cả</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Filter Toolbar */}
      <div className="notification-toolbar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            type="button"
            className={`filter-tab-pill ${activeFilter === 'UNREAD' ? 'active' : ''}`}
            onClick={() => setActiveFilter('UNREAD')}
          >
            Chưa đọc ({unreadCount})
          </button>
          <button
            type="button"
            className={`filter-tab-pill ${activeFilter === 'READ' ? 'active' : ''}`}
            onClick={() => setActiveFilter('READ')}
          >
            Đã đọc ({readCount})
          </button>
        </div>
      </div>

      {/* 4. Notification List or Empty State */}
      {filteredNotifications.length === 0 ? (
        <div className="notification-empty-state">
          <div className="empty-bell-circle">
            <Bell size={42} color="#111827" strokeWidth={1.5} />
          </div>
          <h2 className="empty-title font-serif">
            {activeFilter === 'UNREAD' ? 'BẠN KHÔNG CÓ THÔNG BÁO CHƯA ĐỌC' : 'BẠN CHƯA CÓ THÔNG BÁO NÀO'}
          </h2>
          <p className="empty-desc">
            Mỗi khi người quản lý thay đổi trạng thái đơn hàng (xác nhận, vận chuyển, giao hàng thành công, hủy đơn hoặc đổi trả), thông báo mới sẽ tự động hiển thị tại trang này.
          </p>
          <div className="empty-actions">
            <Link to="/profile?tab=orders" className="btn-empty-action primary">
              <Package size={16} />
              <span>XEM LỊCH SỬ ĐƠN HÀNG</span>
            </Link>
            <Link to="/products" className="btn-empty-action secondary">
              <ShoppingBag size={16} />
              <span>TIẾP TỤC MUA SẮM &rarr;</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="notification-list-container">
          {filteredNotifications.map((item) => {
            const isUnread = !item.is_read;
            return (
              <div
                key={item.id}
                className={`notification-item-card ${isUnread ? 'is-unread' : 'is-read'}`}
                onClick={() => handleNotificationClick(item)}
              >
                {/* Cột trái: Icon phân loại trạng thái */}
                <div
                  className="item-icon-box"
                  style={{
                    backgroundColor: item.badgeBg || '#F5F5F4',
                    border: `1px solid ${item.badgeColor ? `${item.badgeColor}33` : '#E7E5E4'}`
                  }}
                >
                  {renderNotifIcon(item.type, item.badgeBg, item.badgeColor)}
                </div>

                {/* Cột giữa: Nội dung chi tiết thông báo */}
                <div className="item-content-body">
                  <div className="item-meta-top">
                    <div className="item-badges-group">
                      {item.badge && (
                        <span
                          className="status-badge-pill"
                          style={{
                            backgroundColor: item.badgeBg || '#F3F4F6',
                            color: item.badgeColor || '#1F2937'
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.order_number && (
                        <span className="order-code-pill">
                          Mã đơn: #{item.order_number}
                        </span>
                      )}
                      {isUnread && <span className="unread-dot-badge">MỚI</span>}
                    </div>

                    <span className="item-time-text">{item.time}</span>
                  </div>

                  <h3 className="item-title-heading">{item.title}</h3>
                  <p className="item-message-desc">{item.message}</p>

                  {/* Nút hành động xem đơn hàng */}
                  <div className="item-action-row" onClick={(e) => e.stopPropagation()}>
                    {isUnread && (
                      <button
                        type="button"
                        className="btn-mark-single-read"
                        onClick={() => {
                          markNotificationAsRead(item.id, user);
                          refreshNotifications();
                        }}
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-view-order-link"
                      onClick={() => handleNotificationClick(item)}
                    >
                      <span>Xem chi tiết đơn hàng #{item.order_number || item.order_digits}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Styles scoped to NotificationPage */}
      <style>{`
        .notification-page-wrapper {
          max-width: 1040px;
          margin: 0 auto;
          padding: 32px 24px 80px 24px;
          min-height: 80vh;
          font-family: inherit;
        }

        .notification-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          color: #78716C;
          margin-bottom: 24px;
        }

        .breadcrumb-link {
          color: #78716C;
          text-decoration: none;
          transition: color 0.2s;
        }

        .breadcrumb-link:hover {
          color: #1C1917;
        }

        .breadcrumb-separator {
          color: #D6D3D1;
        }

        .breadcrumb-current {
          color: #1C1917;
          font-weight: 700;
        }

        .notification-header-card {
          background: #FFFFFF;
          border: 1px solid #ECE7E1;
          border-radius: 16px;
          padding: 24px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .header-icon-box {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #FAF8F5;
          border: 1px solid #ECE7E1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .header-unread-dot {
          position: absolute;
          top: 10px;
          right: 12px;
          width: 10px;
          height: 10px;
          background: #EF4444;
          border-radius: 50%;
          border: 2px solid #FFFFFF;
        }

        .header-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #111827;
          margin: 0 0 6px 0;
        }

        .header-subtitle {
          font-size: 13px;
          color: #6B7280;
          margin: 0;
          line-height: 19px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .btn-mark-all-read {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #D97706;
          background: #FFFBEB;
          color: #B45309;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-mark-all-read:hover {
          background: #FEF3C7;
          border-color: #B45309;
        }

        .btn-clear-all {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          color: #6B7280;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-clear-all:hover {
          background: #FEE2E2;
          color: #DC2626;
          border-color: #FCA5A5;
        }

        .notification-toolbar {
          margin-bottom: 20px;
        }

        .filter-tabs {
          display: flex;
          gap: 10px;
          border-bottom: 1px solid #F3F4F6;
          padding-bottom: 12px;
        }

        .filter-tab-pill {
          padding: 7px 18px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          background: #F3F4F6;
          color: #4B5563;
          transition: all 0.2s;
        }

        .filter-tab-pill.active {
          background: #111827;
          color: #FFFFFF;
        }

        .filter-tab-pill:hover:not(.active) {
          background: #E5E7EB;
          color: #1F2937;
        }

        .notification-list-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .notification-item-card {
          background: #FFFFFF;
          border: 1px solid #ECE7E1;
          border-radius: 14px;
          padding: 20px 22px;
          display: flex;
          gap: 18px;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        .notification-item-card:hover {
          border-color: #D97706;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .notification-item-card.is-unread {
          background: #FFFDF7;
          border: 1.5px solid #FDE68A;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.07);
        }

        .item-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-content-body {
          flex: 1;
        }

        .item-meta-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .item-badges-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .status-badge-pill {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.4px;
          padding: 3px 9px;
          border-radius: 6px;
          display: inline-block;
        }

        .order-code-pill {
          font-size: 12px;
          font-weight: 600;
          color: #6B7280;
          background: #F3F4F6;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .unread-dot-badge {
          background: #EF4444;
          color: #FFFFFF;
          font-size: 9.5px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 10px;
          letter-spacing: 0.5px;
        }

        .item-time-text {
          font-size: 11.5px;
          color: #9CA3AF;
          font-weight: 500;
        }

        .item-title-heading {
          font-size: 14.5px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 5px 0;
          line-height: 20px;
        }

        .item-message-desc {
          font-size: 13px;
          color: #4B5563;
          line-height: 20px;
          margin: 0 0 14px 0;
        }

        .item-action-row {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          padding-top: 10px;
          border-top: 1px solid #F5F4F0;
        }

        .btn-mark-single-read {
          background: none;
          border: none;
          color: #6B7280;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          padding: 4px;
        }

        .btn-mark-single-read:hover {
          color: #111827;
        }

        .btn-view-order-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #111827;
          color: #FFFFFF;
          border: none;
          padding: 7px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view-order-link:hover {
          background: #D97706;
          color: #FFFFFF;
        }

        .notification-empty-state {
          background: #FAF8F5;
          border: 1px dashed #D6D3D1;
          border-radius: 16px;
          padding: 70px 24px;
          text-align: center;
          margin: 10px 0;
        }

        .empty-bell-circle {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 1px solid #ECE7E1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px auto;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .empty-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .empty-desc {
          font-size: 13.5px;
          color: #6B7280;
          max-width: 460px;
          margin: 0 auto 24px auto;
          line-height: 22px;
        }

        .empty-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn-empty-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-empty-action.primary {
          background: #111827;
          color: #FFFFFF;
        }

        .btn-empty-action.primary:hover {
          background: #D97706;
        }

        .btn-empty-action.secondary {
          background: #FFFFFF;
          color: #111827;
          border: 1px solid #D1D5DB;
        }

        .btn-empty-action.secondary:hover {
          border-color: #111827;
        }
      `}</style>
    </div>
  );
}

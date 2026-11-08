import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Bell, MessageSquare, Globe, Sun, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirmModal } from '../context/ConfirmModalContext';
import {
  getNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from '../services/notificationService';

const Header = ({ onOpenAISearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, wishlist, cartCount, logout } = useAuth();
  const { showSuccess, showInfo } = useToast();
  const { confirmModal } = useConfirmModal();
  const isManagerOrAdmin = Boolean(
    user && (
      user.role === 'MANAGER' ||
      user.role === 'ADMIN' ||
      user.role === 'EMPLOYEE' ||
      user.user_type === 'EMPLOYEE' ||
      user.employee_role === 'MANAGER' ||
      user.employee_role === 'ADMIN'
    )
  );
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Tải và đồng bộ thông báo thời gian thực cho người dùng
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

  // Đóng dropdown khi click ra ngoài vùng menu tài khoản hoặc thông báo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotifications]);

  const categoryTimeoutRef = useRef(null);
  const userTimeoutRef = useRef(null);

  const handleCategoryMouseEnter = () => {
    if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);
    setShowCategoryMenu(true);
  };

  const handleCategoryMouseLeave = () => {
    categoryTimeoutRef.current = setTimeout(() => {
      setShowCategoryMenu(false);
    }, 200);
  };

  const handleUserMouseEnter = () => {
    if (userTimeoutRef.current) clearTimeout(userTimeoutRef.current);
    setShowUserMenu(true);
  };

  const handleUserMouseLeave = () => {
    userTimeoutRef.current = setTimeout(() => {
      setShowUserMenu(false);
    }, 200);
  };


  const handleLogout = async () => {
    setShowUserMenu(false);
    const confirmed = await confirmModal({
      title: 'Đăng xuất tài khoản',
      message: 'Bạn có chắc chắn muốn đăng xuất tài khoản khỏi Youth Fashion không?',
      confirmText: 'Đăng xuất',
      cancelText: 'Hủy bỏ',
      variant: 'logout'
    });

    if (confirmed) {
      if (logout) {
        await logout();
      }
      showSuccess('Đã đăng xuất tài khoản thành công!');
      navigate('/');
    }
  };

  const announcementText = [
    { icon: <Globe size={13} />, text: 'MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC CHO ĐƠN HÀNG TỪ 1.500.000Đ' },
    { icon: <Sun size={13} />, text: 'THỜI TRANG BỀN VỮNG' },
    { icon: <Star size={13} />, text: 'THIẾT KẾ ĐỘC BẢN' }
  ];

  return (
    <header className="header-container">
      {/* 1. Top Bar Marquee (Chạy chữ) */}
      <div className="header-top-bar">
        <div className="marquee-track">
          <div className="marquee-content">
            {announcementText.concat(announcementText).concat(announcementText).map((item, idx) => (
              <div key={idx} className="top-bar-item">
                <span className="top-bar-icon">{item.icon}</span>
                <span>{item.text}</span>
                <span className="top-bar-bullet">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <nav className="header-nav container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <img src="/logo-dark.png" alt="YF Logo" className="logo-img" />
          <span className="brand-name font-serif">YOUTH FASHION</span>
        </Link>

        {/* Center Menu Links */}
        <ul className="nav-menu">
          <li className={location.pathname === '/' ? 'active' : ''}>
            <Link to="/">TRANG CHỦ</Link>
          </li>
          <li
            className={`dropdown-trigger ${location.pathname.startsWith('/products') || location.pathname.startsWith('/category') ? 'active' : ''}`}
            onMouseEnter={handleCategoryMouseEnter}
            onMouseLeave={handleCategoryMouseLeave}
          >
            <Link to="/products" className="nav-link">
              DANH MỤC
            </Link>
          </li>
          <li className={location.pathname === '/lookbook' ? 'active' : ''}>
            <Link to="/lookbook">LOOKBOOK</Link>
          </li>
          <li className={location.pathname === '/contact' ? 'active' : ''}>
            <Link to="/contact">LIÊN HỆ</Link>
          </li>
        </ul>

        {/* Right Actions Bar */}
        <div className="nav-actions">
          {/* Search trigger */}
          <div className="search-wrapper">
            {showSearchInput ? (
              <div className="inline-search-input animate-fade-in">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  onBlur={() => !searchQuery && setShowSearchInput(false)}
                />
                <button className="icon-btn-inline" onClick={onOpenAISearch} title="Tìm bằng AI Image">
                  ✨
                </button>
              </div>
            ) : (
              <button
                className={`action-icon ${showSearchInput ? 'active' : ''}`}
                title="Tìm kiếm"
                onClick={() => setShowSearchInput(true)}
              >
                <Search size={18} />
              </button>
            )}
          </div>

          {/* Notifications */}
          <div ref={notificationsRef} className="notifications-wrapper" style={{ position: 'relative' }}>
            <button
              className={`action-icon ${showNotifications ? 'active' : ''}`}
              title="Thông báo"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notifications-dropdown animate-fade-in">
                <div className="notifications-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>THÔNG BÁO</span>
                    {unreadCount > 0 && (
                      <span className="notifications-count" style={{
                        background: '#FEF3C7',
                        color: '#B45309',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 700
                      }}>
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllNotificationsAsRead(user);
                        refreshNotifications();
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#D97706',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '4px',
                      }}
                      title="Đánh dấu tất cả đã đọc"
                    >
                      Đã đọc tất cả
                    </button>
                  )}
                </div>

                <div className="notification-list" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifications && notifications.length > 0 ? (
                    notifications.map((item, idx) => {
                      const isUnread = !item.is_read;
                      return (
                        <div
                          key={item.id || idx}
                          className={`notification-card ${isUnread ? 'is-unread' : ''}`}
                          onClick={() => {
                            markNotificationAsRead(item.id, user);
                            refreshNotifications();
                            setShowNotifications(false);
                            if (item.link) {
                              navigate(item.link);
                            } else {
                              navigate('/profile?tab=orders');
                            }
                          }}
                          style={{
                            cursor: 'pointer',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            marginBottom: '6px',
                            background: isUnread ? '#FFFBEB' : '#FFFFFF',
                            border: isUnread ? '1px solid #FDE68A' : '1px solid #F5F4F0',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#D97706';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isUnread ? '#FDE68A' : '#F5F4F0';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '5px' }}>
                            {item.badge && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '4px',
                                backgroundColor: item.badgeBg || '#F3F4F6',
                                color: item.badgeColor || '#4B5563',
                                letterSpacing: '0.3px',
                                display: 'inline-block'
                              }}>
                                {item.badge}
                              </span>
                            )}
                            <span className="notif-time" style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>
                              {item.time}
                            </span>
                          </div>
                          <div className="notif-title" style={{ fontSize: '12.5px', fontWeight: isUnread ? 700 : 600, color: '#1C1917', marginBottom: '3px', lineHeight: '17px' }}>
                            {item.title}
                          </div>
                          <div className="notif-desc" style={{ fontSize: '11.5px', color: '#4B5563', lineHeight: '16px' }}>
                            {item.message}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div
                      className="notification-empty"
                      style={{
                        padding: '24px 8px',
                        textAlign: 'center',
                        color: '#78716C',
                        fontSize: '12.5px',
                        lineHeight: '18px',
                      }}
                    >
                      <Bell size={24} style={{ color: '#D6D3D1', margin: '0 auto 8px', display: 'block' }} />
                      Hiện tại quý khách chưa có thông báo mới.
                    </div>
                  )}
                </div>

                {notifications && notifications.length > 0 && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #F5F4F0',
                    textAlign: 'center'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/profile?tab=notifications');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#B45309',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        textDecoration: 'underline'
                      }}
                    >
                      Xem tất cả trong Trung tâm thông báo &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <Link
            to="/chat"
            className={`action-icon ${location.pathname === '/chat' ? 'active' : ''}`}
            title="Tin nhắn / Tư vấn"
          >
            <MessageSquare size={18} />
          </Link>

          {/* Cart Icon */}
          <Link
            to={user ? "/cart" : "/login"}
            className={`action-icon ${location.pathname === '/cart' ? 'active' : ''}`}
            title="Giỏ hàng"
            onClick={(e) => {
              if (!user) {
                showInfo('Vui lòng đăng nhập để xem giỏ hàng của bạn!');
              }
            }}
          >
            <ShoppingBag size={18} />
            {user && cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>

          {/* Wishlist Icon */}
          <Link
            to={user ? "/wishlist" : "/login"}
            className={`action-icon ${location.pathname === '/wishlist' ? 'active' : ''}`}
            title="Sản phẩm yêu thích"
            onClick={(e) => {
              if (!user) {
                showInfo('Vui lòng đăng nhập để xem danh sách yêu thích của bạn!');
              }
            }}
          >
            <Heart
              size={18}
              className="wishlist-heart-icon"
              fill={location.pathname === '/wishlist' && user ? '#ffffff' : 'none'}
              color={location.pathname === '/wishlist' && user ? '#ffffff' : 'currentColor'}
            />
            {user && wishlist && wishlist.length > 0 && (
              <span className="badge">{wishlist.length}</span>
            )}
          </Link>

          {/* User Account */}
          <div
            ref={userMenuRef}
            className="user-menu-wrapper"
            onMouseEnter={handleUserMouseEnter}
            onMouseLeave={handleUserMouseLeave}
          >
            <button
              type="button"
              className={`action-icon user-avatar-btn ${showUserMenu ? 'active' : ''}`}
              title="Tài khoản"
              onClick={() => setShowUserMenu(prev => !prev)}
            >
              <User size={18} />
            </button>

            {showUserMenu && user && (
              <div className="user-dropdown animate-fade-in">
                <div className="user-info-header">
                  <span className="user-name">{user.full_name}</span>
                  <span className="user-email">{user.email}</span>
                </div>
                <hr />
                <Link
                  to="/profile"
                  className="dropdown-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  Thông tin tài khoản
                </Link>
                <Link
                  to="/wishlist"
                  className="dropdown-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  Sản phẩm yêu thích
                </Link>
                {isManagerOrAdmin && (
                  <Link
                    to="/manager"
                    className="dropdown-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Bảng quản lý
                  </Link>
                )}
                <hr />
                <button className="dropdown-item text-danger" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </div>
            )}

            {showUserMenu && !user && (
              <div className="user-dropdown animate-fade-in">
                <div className="user-info-header">
                  <span className="user-name">Tài khoản</span>
                  <span className="user-email">Vui lòng đăng nhập để trải nghiệm</span>
                </div>
                <hr />
                <Link
                  to="/login"
                  className="dropdown-item"
                  style={{ fontWeight: 600, color: '#111' }}
                  onClick={() => setShowUserMenu(false)}
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  className="dropdown-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  Đăng Ký Tài Khoản
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <style>{`
        .header-container {
          background-color: #ffffff;
          border-bottom: 1px solid #eeeeee;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        /* Continuous Marquee Top Bar */
        .header-top-bar {
          background-color: #0b0d12;
          color: #d1d5db;
          height: 34px;
          overflow: hidden;
          display: flex;
          align-items: center;
          position: relative;
          font-size: 11px;
          letter-spacing: 0.8px;
          font-weight: 500;
        }

        .marquee-track {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
        }

        .marquee-content {
          display: inline-flex;
          align-items: center;
          animation: marqueeScroll 28s linear infinite;
        }

        .header-top-bar:hover .marquee-content {
          animation-play-state: paused;
        }

        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }

        .top-bar-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px;
        }

        .top-bar-icon {
          color: #9ca3af;
          display: flex;
          align-items: center;
        }

        .top-bar-bullet {
          color: #4b5563;
          margin-left: 12px;
          font-size: 10px;
        }

        .header-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          padding: 0 24px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .logo-img {
          height: 42px;
          width: 42px;
          object-fit: contain;
          display: block;
        }

        .brand-name {
          font-size: 21px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #111827;
          font-family: var(--font-serif);
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: 40px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-menu li a {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          letter-spacing: 1px;
          padding: 26px 0;
          display: inline-block;
          position: relative;
          transition: color 0.2s;
          text-decoration: none;
        }

        .nav-menu li.active a,
        .nav-menu li a:hover {
          color: #111827;
        }

        .nav-menu li.active a::after {
          content: '';
          position: absolute;
          bottom: 18px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #111827;
        }

        .dropdown-trigger {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 220px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          border-radius: 8px;
          padding: 8px 0;
          z-index: 100;
        }

        .dropdown-item {
          display: block;
          padding: 10px 20px;
          font-size: 13px;
          color: #374151;
          transition: background 0.15s;
        }

        .dropdown-item:hover {
          background-color: #f9fafb;
          color: #111827;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-wrapper {
          position: relative;
        }

        .inline-search-input {
          display: flex;
          align-items: center;
          background-color: #f3f4f6;
          border-radius: 20px;
          padding: 4px 12px;
          width: 180px;
        }

        .inline-search-input input {
          border: none;
          background: transparent;
          font-size: 12px;
          width: 100%;
          color: #111827;
        }

        .icon-btn-inline {
          font-size: 13px;
        }

        .action-icon {
          position: relative;
          color: #111827;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 11px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
          outline: none;
          flex-shrink: 0;
        }

        .action-icon svg {
          transition: color 0.18s ease, stroke 0.18s ease, transform 0.18s ease;
        }

        /* Hover effect: luxury dark rounded squircle */
        .action-icon:hover {
          background-color: #111111;
          color: #ffffff;
          border-radius: 11px;
          transform: translateY(-1px);
        }

        .action-icon:hover svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        /* Active / Pressed effect: exactly like the chat button in the screenshot */
        .action-icon.active,
        .action-icon:active {
          background-color: #111111 !important;
          color: #ffffff !important;
          border-radius: 11px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        }

        .action-icon:active {
          transform: scale(0.92) !important;
        }

        .action-icon.active svg,
        .action-icon:active svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        /* High-contrast Badges */
        .badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background-color: #111827;
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          padding: 0 3px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
          pointer-events: none;
          transition: border-color 0.2s ease;
        }

        .action-icon.active .badge,
        .action-icon:hover .badge,
        .action-icon:active .badge {
          border-color: #111111;
        }

        .notifications-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: -20px;
          width: 360px;
          max-width: 90vw;
          background: #FFFFFF;
          border: 1px solid #ECE7E1;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
          padding: 14px 16px;
          z-index: 100;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: #1C1917;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #F5F4F0;
        }

        .notifications-count {
          color: #B45309;
          font-size: 10px;
          font-weight: 600;
        }

        .notification-card {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 6px 0;
        }

        .notif-title {
          font-size: 13px;
          font-weight: 600;
          color: #1C1917;
        }

        .notif-desc {
          font-size: 12px;
          color: #78716C;
          line-height: 17px;
        }

        .notif-time {
          font-size: 11px;
          color: #A8A29E;
          margin-top: 4px;
        }

        .user-menu-wrapper {
          position: relative;
        }

        .header-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 220px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          border-radius: 10px;
          padding: 8px 0;
          margin-top: 4px;
        }

        /* Bridge hover gap so menu never disappears when moving mouse */
        .user-dropdown::before,
        .dropdown-menu::before {
          content: '';
          position: absolute;
          top: -14px;
          left: 0;
          right: 0;
          height: 14px;
        }

        .user-info-header {
          padding: 10px 16px;
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
        }

        .user-email {
          font-size: 12px;
          color: #6b7280;
        }

        hr {
          border: none;
          border-top: 1px solid #f3f4f6;
          margin: 6px 0;
        }

        .text-danger {
          color: #ef4444 !important;
          width: 100%;
          text-align: left;
        }

        @media (max-width: 992px) {
          .nav-menu {
            gap: 18px;
          }
          .nav-menu li a {
            font-size: 11px;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;


import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Bell, MessageSquare, Globe, Sun, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirmModal } from '../context/ConfirmModalContext';

const Header = ({ onOpenAISearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, wishlist, cartCount, logout } = useAuth();
  const { showSuccess } = useToast();
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
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);

  // Đóng dropdown khi click ra ngoài vùng menu tài khoản
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
              <button className="action-icon" title="Tìm kiếm" onClick={() => setShowSearchInput(true)}>
                <Search size={18} />
              </button>
            )}
          </div>

          {/* Notifications */}
          <button className="action-icon" title="Thông báo">
            <Bell size={18} />
            <span className="badge">1</span>
          </button>

          {/* Messages */}
          <button className="action-icon" title="Tin nhắn / Tư vấn">
            <MessageSquare size={18} />
          </button>

          {/* Cart Icon */}
          <Link to="/cart" className="action-icon" title="Giỏ hàng">
            <ShoppingBag size={18} />
            <span className="badge">{cartCount || 2}</span>
          </Link>

          {/* Wishlist Icon */}
          <Link to={user ? "/profile?tab=wishlist" : "/login"} className="action-icon" title="Yêu thích">
            <Heart size={18} />
            <span className="badge">{user ? (wishlist ? wishlist.length : 0) : 0}</span>
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
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
        }

        .action-icon:hover,
        .action-icon.active {
          background-color: #000000;
          color: #ffffff;
        }

        .action-icon:hover svg,
        .action-icon.active svg {
          color: #ffffff;
          stroke: #ffffff;
        }

        .badge {
          position: absolute;
          top: 1px;
          right: 1px;
          background-color: #111827;
          color: #ffffff;
          font-size: 9px;
          font-weight: 700;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
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


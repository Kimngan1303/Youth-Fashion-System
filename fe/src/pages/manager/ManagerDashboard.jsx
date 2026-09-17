import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import LookbookManagement from './LookbookManagement';
import { 
  LayoutGrid, 
  Package, 
  Folder, 
  BookOpen, 
  ShoppingBag, 
  MessageSquare, 
  Tag, 
  BarChart2, 
  Home, 
  LogOut, 
  Search, 
  User 
} from 'lucide-react';

/**
 * Manager Dashboard Component (Single-file JSX + Embedded CSS Method 1)
 * Built directly from Figma layout & CSS specs.
 */

const dashboardStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400&display=swap');

  .manager-layout {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 0px;
    width: 100%;
    min-height: 100vh;
    background: #F7F6F3;
    font-family: 'Inter', sans-serif;
    box-sizing: border-box;
  }

  /* Aside - LeftSidebar */
  .left-sidebar {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0px;
    width: 268px;
    min-width: 268px;
    min-height: 100vh;
    background: #FFFFFF;
    border-right: 1px solid #E8E6E1;
  }

  .sidebar-top-part {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
    gap: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .brand-logo-section {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px 0px 20px;
    gap: 12px;
    width: 100%;
    border-bottom: 1px solid #F0EEE9;
  }

  .brand-logo-text {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: 17px;
    line-height: 26px;
    letter-spacing: 3.06px;
    text-transform: uppercase;
    color: #111111;
  }

  .nav-section-label {
    padding: 16px 0px 4px;
    width: 100%;
    font-weight: 700;
    font-size: 9.5px;
    line-height: 14px;
    letter-spacing: 0.475px;
    text-transform: uppercase;
    color: #8C857B;
  }

  .nav-menu-items {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    gap: 4px;
    width: 100%;
  }

  .nav-menu-link {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    width: 100%;
    box-sizing: border-box;
    border-radius: 8px;
    font-weight: 500;
    font-size: 13px;
    line-height: 20px;
    color: #57534E;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: transparent;
  }

  .nav-menu-link:hover {
    background: #F5F4EF;
    color: #111111;
  }

  .nav-menu-link.active {
    background: #111111;
    color: #FFFFFF;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
  }

  .nav-item-inner {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .order-count-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px 8px;
    background: #FACC15;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 9999px;
    font-weight: 600;
    font-size: 11px;
    color: #713F12;
  }

  .sidebar-bottom-part {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
    gap: 8px;
    width: 100%;
    border-top: 1px solid #F0EEE9;
  }

  .btn-store-status {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    padding: 10px 16px;
    gap: 10px;
    width: 100%;
    height: 38px;
    border: 1px solid rgba(229, 229, 229, 0.8);
    border-radius: 4px;
    font-weight: 500;
    font-size: 12px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #404040;
    background: #FFFFFF;
    cursor: pointer;
  }

  .btn-sidebar-logout {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    gap: 10px;
    width: 100%;
    height: 36px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 12px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #DC2626;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-sidebar-logout:hover {
    background: #FEF2F2;
  }

  /* MainContentArea */
  .main-content-area {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
    min-height: 100vh;
    box-sizing: border-box;
  }

  /* Top Header Bar */
  .top-header-bar {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 12px 28px;
    width: 100%;
    height: 57px;
    background: #FFFFFF;
    border-bottom: 1px solid #E8E6E1;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.02);
  }

  .header-search-box {
    display: flex;
    align-items: center;
    background: #F7F6F3;
    border: 1px solid #E2DFD7;
    border-radius: 8px;
    padding: 6px 14px;
    width: 320px;
    gap: 8px;
  }

  .header-search-input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    width: 100%;
    color: #1C1917;
  }

  .header-user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-avatar-circle {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    background: #111111;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 9999px;
    color: #FFFFFF;
    font-weight: 600;
    font-size: 13px;
  }

  .user-info-text {
    display: flex;
    flex-direction: column;
  }

  .user-name {
    font-weight: 600;
    font-size: 12.5px;
    line-height: 16px;
    color: #1C1917;
  }

  .user-role-label {
    font-weight: 400;
    font-size: 10px;
    line-height: 12px;
    color: #78716C;
  }

  /* Scrollable Dashboard Body */
  .dashboard-scroll-body {
    display: flex;
    flex-direction: column;
    padding: 28px;
    gap: 24px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Section Dashboard Header */
  .dashboard-header-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
  }

  .dashboard-header-sub {
    font-weight: 600;
    font-size: 10.5px;
    line-height: 16px;
    letter-spacing: 0.525px;
    text-transform: uppercase;
    color: #8C857B;
    margin: 0;
  }

  .dashboard-header-title {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    font-size: 26px;
    line-height: 32px;
    color: #111111;
    margin: 4px 0 0 0;
  }

  .btn-export-data {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    padding: 8px 14px;
    gap: 8px;
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    font-weight: 600;
    font-size: 12px;
    color: #292524;
    cursor: pointer;
  }

  /* KPI Cards Grid */
  .kpi-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    width: 100%;
  }

  .kpi-card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px;
    background: #FFFFFF;
    border: 1px solid #EAE7DF;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
  }

  .kpi-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .kpi-title {
    font-weight: 700;
    font-size: 10.5px;
    line-height: 16px;
    letter-spacing: 0.525px;
    text-transform: uppercase;
    color: #8C857B;
  }

  .kpi-icon-badge {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    height: 24px;
    background: #FBF9F4;
    border-radius: 4px;
    color: #A88A4B;
  }

  .kpi-value {
    font-weight: 700;
    font-size: 23px;
    line-height: 29px;
    letter-spacing: -0.575px;
    color: #111111;
    margin: 4px 0;
  }

  .kpi-growth-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    margin-top: 4px;
  }

  .growth-badge-green {
    font-weight: 700;
    color: #15803D;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .growth-subtext {
    color: #78716C;
  }

  .kpi-progress-bg {
    width: 100%;
    height: 6px;
    background: #F2EFE9;
    border-radius: 9999px;
    margin-top: 16px;
    overflow: hidden;
  }

  .kpi-progress-bar {
    height: 100%;
    background: #111111;
    border-radius: 9999px;
  }

  /* Charts Section Box */
  .charts-section-card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 24px;
    background: #FFFFFF;
    border: 1px solid #EAE7DF;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    width: 100%;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid #F2EEE8;
  }

  .chart-title-tag {
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #B45309;
  }

  .chart-heading {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    font-size: 18px;
    color: #111111;
    margin: 2px 0 0 0;
  }

  .chart-pills {
    display: flex;
    background: #F5F4EF;
    border: 1px solid #E8E6DF;
    border-radius: 8px;
    padding: 2px;
    gap: 4px;
  }

  .chart-pill-btn {
    padding: 4px 10px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 11px;
    color: #78716C;
    background: transparent;
    cursor: pointer;
  }

  .chart-pill-btn.active {
    background: #111111;
    color: #FFFFFF;
  }
`;

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('lookbooks');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="manager-layout">
      <style>{dashboardStyles}</style>

      {/* LEFT SIDEBAR */}
      <aside className="left-sidebar">
        <div className="sidebar-top-part">

          {/* Logo Brand */}
          <div className="brand-logo-section">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" />
            </svg>
            <span className="brand-logo-text">YOUTH FASHION</span>
          </div>

          {/* Navigation Label */}
          <div className="nav-section-label">KHU VỰC QUẢN TRỊ</div>

          {/* Menu Items */}
          <nav className="nav-menu-items">
            {/* 1. Tổng Quan */}
            <button
              className={`nav-menu-link ${activeMenu === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveMenu('overview')}
            >
              <div className="nav-item-inner">
                <LayoutGrid size={16} />
                <span>Tổng Quan</span>
              </div>
            </button>

            {/* 2. Quản Lý Sản Phẩm */}
            <button
              className={`nav-menu-link ${activeMenu === 'products' ? 'active' : ''}`}
              onClick={() => setActiveMenu('products')}
            >
              <div className="nav-item-inner">
                <Package size={16} />
                <span>Quản Lý Sản Phẩm</span>
              </div>
            </button>

            {/* 3. Quản Lý Danh Mục */}
            <button
              className={`nav-menu-link ${activeMenu === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveMenu('categories')}
            >
              <div className="nav-item-inner">
                <Folder size={16} />
                <span>Quản Lý Danh Mục</span>
              </div>
            </button>

            {/* 4. Quản Lý Lookbook (Active in screenshot) */}
            <button
              className={`nav-menu-link ${activeMenu === 'lookbooks' ? 'active' : ''}`}
              onClick={() => setActiveMenu('lookbooks')}
            >
              <div className="nav-item-inner">
                <BookOpen size={16} />
                <span>Quản Lý Lookbook</span>
              </div>
            </button>

            {/* 5. Quản Lý Đơn Hàng (Badge 18) */}
            <button
              className={`nav-menu-link ${activeMenu === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveMenu('orders')}
            >
              <div className="nav-item-inner">
                <ShoppingBag size={16} />
                <span>Quản Lý Đơn Hàng</span>
              </div>
              <span className="order-count-badge" style={{ background: '#FACC15', color: '#713F12', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', fontSize: '11px' }}>
                18
              </span>
            </button>

            {/* 6. Tư Vấn & CSKH */}
            <button
              className={`nav-menu-link ${activeMenu === 'customer_service' ? 'active' : ''}`}
              onClick={() => setActiveMenu('customer_service')}
            >
              <div className="nav-item-inner">
                <MessageSquare size={16} />
                <span>Tư Vấn & CSKH</span>
              </div>
            </button>

            {/* 7. Voucher & Khuyến Mãi */}
            <button
              className={`nav-menu-link ${activeMenu === 'vouchers' ? 'active' : ''}`}
              onClick={() => setActiveMenu('vouchers')}
            >
              <div className="nav-item-inner">
                <Tag size={16} />
                <span>Voucher & Khuyến Mãi</span>
              </div>
            </button>

            {/* 8. Báo Cáo & Doanh Thu */}
            <button
              className={`nav-menu-link ${activeMenu === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveMenu('reports')}
            >
              <div className="nav-item-inner">
                <BarChart2 size={16} />
                <span>Báo Cáo & Doanh Thu</span>
              </div>
            </button>
          </nav>

        </div>

        {/* Sidebar Bottom Part */}
        <div className="sidebar-bottom-part">
          <button type="button" className="btn-store-status" onClick={() => navigate('/')}>
            <Home size={15} />
            VỀ TRANG CHỦ
          </button>
          <button type="button" className="btn-sidebar-logout" onClick={handleLogout}>
            <LogOut size={15} />
            ĐĂNG XUẤT
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content-area">

        {/* Top Header Bar */}
        <header className="top-header-bar">
          <div className="header-search-box">
            <Search size={16} color="#A8A29E" />
            <input className="header-search-input" placeholder="Tìm kiếm đơn hàng, sản phẩm, lookbook..." />
          </div>

          <div className="header-user-profile">
            <div className="user-avatar-circle" style={{ background: '#111111', color: '#FFFFFF' }}>
              <User size={18} />
            </div>
            <div className="user-info-text">
              <span className="user-name" style={{ fontWeight: 700, fontSize: '13px', color: '#111' }}>
                {user?.full_name || 'Hoàng Kim Anh'}
              </span>
              <span className="user-role-label" style={{ fontSize: '11px', color: '#78716C' }}>
                {user?.role || 'Quản Lý Cửa Hàng & Bán Hàng'}
              </span>
            </div>
          </div>
        </header>

        {/* MAIN BODY BASED ON ACTIVE MENU */}
        {activeMenu === 'lookbooks' ? (
          <LookbookManagement />
        ) : (
          /* Scrollable Dashboard Body (Overview) */
          <div className="dashboard-scroll-body">

            {/* Header Row */}
            <div className="dashboard-header-row">
              <div>
                <p className="dashboard-header-sub">KHU VỰC TỔNG QUAN</p>
                <h1 className="dashboard-header-title">Bảng Điều Khiển Quản Trị</h1>
              </div>

              <button type="button" className="btn-export-data">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Xuất Dữ Liệu
              </button>
            </div>

            {/* KPI Cards Grid */}
            <div className="kpi-cards-grid">
              {/* KPI Card 1 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-title">Doanh Thu Tháng</span>
                  <div className="kpi-icon-badge">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="kpi-value">1.845.000.000₫</div>
                <div className="kpi-growth-row">
                  <span className="growth-badge-green">▲ 12.5%</span>
                  <span className="growth-subtext">so với tháng trước</span>
                </div>
                <div className="kpi-progress-bg">
                  <div className="kpi-progress-bar" style={{ width: '68%' }} />
                </div>
              </div>

              {/* KPI Card 2 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-title">Tổng Đơn Bán Lẻ</span>
                  <div className="kpi-icon-badge">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <div className="kpi-value">1.248 <span style={{ fontSize: '15px', fontWeight: 400, color: '#57534E' }}>đơn</span></div>
                <div className="kpi-growth-row">
                  <span className="growth-badge-green">▲ 8.2%</span>
                  <span className="growth-subtext">tăng trưởng tuần</span>
                </div>
                <div className="kpi-progress-bg">
                  <div className="kpi-progress-bar" style={{ width: '75%', background: '#C5A059' }} />
                </div>
              </div>

              {/* KPI Card 3 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-title">Giá Trị Trung Bình / Đơn</span>
                  <div className="kpi-icon-badge">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="kpi-value">1.290.000₫</div>
                <div className="kpi-growth-row">
                  <span className="growth-badge-green">▲ 4.1%</span>
                  <span className="growth-subtext">AOV trung bình</span>
                </div>
                <div className="kpi-progress-bg">
                  <div className="kpi-progress-bar" style={{ width: '60%', background: '#EAB308' }} />
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section-card">
              <div className="chart-header">
                <div>
                  <span className="chart-title-tag">XU HƯỚNG TĂNG TRƯỞNG</span>
                  <h3 className="chart-heading">Doanh Thu 4 Tuần Gần Nhất</h3>
                </div>
                <div className="chart-pills">
                  <button type="button" className="chart-pill-btn">7 Ngày</button>
                  <button type="button" className="chart-pill-btn active">4 Tuần</button>
                  <button type="button" className="chart-pill-btn">12 Tháng</button>
                </div>
              </div>

              <div style={{ padding: '40px 0', textAlign: 'center', color: '#78716C' }}>
                📊 [Biểu đồ đường xu hướng doanh thu tích hợp Recharts / Chart.js]
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

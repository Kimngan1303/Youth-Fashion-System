import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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
 * Category Manager Component (Unified Design System)
 * 100% consistent with ManagerDashboard & ProductManager UI layout & tokens
 */

const categoryManagerStyles = `
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
  }

  .btn-sidebar-logout:hover {
    background: #FEF2F2;
  }

  /* Main Content Area */
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

  /* Body */
  .dashboard-scroll-body {
    display: flex;
    flex-direction: column;
    padding: 28px;
    gap: 24px;
    width: 100%;
    box-sizing: border-box;
  }

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

  .btn-add-category {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    gap: 8px;
    background: #111111;
    border: none;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    font-weight: 600;
    font-size: 12px;
    color: #FFFFFF;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-add-category:hover {
    background: #2A2725;
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
  }

  .kpi-title {
    font-weight: 700;
    font-size: 10.5px;
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
    color: #111111;
  }

  .kpi-value {
    font-weight: 700;
    font-size: 23px;
    line-height: 29px;
    letter-spacing: -0.575px;
    color: #111111;
    margin: 6px 0 2px 0;
  }

  .kpi-subtext {
    font-size: 11px;
    color: #78716C;
  }

  .kpi-progress-bg {
    width: 100%;
    height: 6px;
    background: #F2EFE9;
    border-radius: 9999px;
    margin-top: 14px;
    overflow: hidden;
  }

  .kpi-progress-bar {
    height: 100%;
    background: #111111;
    border-radius: 9999px;
  }

  /* Table Section Container */
  .table-section-card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    background: #FFFFFF;
    border: 1px solid #EAE7DF;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    width: 100%;
    overflow: hidden;
  }

  /* Filter Bar */
  .table-filter-bar {
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: 16px;
    border-bottom: 1px solid #F0EEE9;
  }

  .status-tabs-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #F5F4EF;
    padding-bottom: 12px;
    overflow-x: auto;
  }

  .status-tabs-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    color: #78716C;
    background: transparent;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .status-tab-btn.active {
    background: #111111;
    color: #FFFFFF;
  }

  .tab-count-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 9999px;
  }

  .btn-batch-delete {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #FEF2F2;
    border: 1px solid #FECACA;
    border-radius: 8px;
    font-weight: 600;
    font-size: 11px;
    color: #DC2626;
    cursor: pointer;
  }

  .filter-controls-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .search-filter-input {
    display: flex;
    align-items: center;
    background: #F7F6F3;
    border: 1px solid #E2DFD7;
    border-radius: 8px;
    padding: 8px 14px;
    width: 280px;
    gap: 8px;
  }

  .search-filter-input input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    width: 100%;
    color: #1C1917;
  }

  .filter-select {
    padding: 8px 12px;
    border: 1px solid #E2DFD7;
    border-radius: 8px;
    font-size: 12px;
    color: #404040;
    background: #FFFFFF;
    outline: none;
    cursor: pointer;
  }

  /* Data Table */
  .category-data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
  }

  .category-data-table th {
    background: #FAF9F6;
    padding: 12px 16px;
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #78716C;
    border-bottom: 1px solid #EAE7DF;
  }

  .category-data-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #F2EEE8;
    color: #1C1917;
    vertical-align: middle;
  }

  .category-title-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .category-thumb {
    width: 44px;
    height: 44px;
    border-radius: 6px;
    object-fit: cover;
    background: #F2EFE9;
    border: 1px solid #E2DFD7;
  }

  .cat-name {
    font-weight: 600;
    color: #111111;
  }

  .cat-code-badge {
    display: inline-block;
    padding: 1px 6px;
    background: #F2F1EC;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
    color: #78716C;
    margin-right: 6px;
  }

  .cat-slug {
    font-size: 11px;
    color: #78716C;
  }

  .status-pill-active {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    background: #DCFCE7;
    color: #15803D;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
  }

  .status-pill-hidden {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    background: #FEE2E2;
    color: #DC2626;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
  }

  /* 3 Action Buttons matching Figma design */
  .action-buttons-cell {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .action-btn-item {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .action-btn-item.edit {
    color: #44403C;
  }
  .action-btn-item.edit:hover {
    background: #F5F4EF;
    color: #111111;
  }

  .action-btn-item.view {
    color: #44403C;
  }
  .action-btn-item.view:hover {
    background: #F5F4EF;
    color: #111111;
  }

  .action-btn-item.delete {
    color: #EF4444;
  }
  .action-btn-item.delete:hover {
    background: #FEF2F2;
    color: #DC2626;
  }

  /* DRAWER COMPONENT STYLES */
  .drawer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 9999;
    display: flex;
    justify-content: flex-end;
  }

  .drawer-container {
    width: 480px;
    max-width: 90vw;
    height: 100vh;
    background: #FFFFFF;
    box-shadow: -4px 0 25px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    box-sizing: border-box;
    animation: drawerSlide 0.25s ease-out;
  }

  @keyframes drawerSlide {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #EAE7DF;
  }

  .drawer-title {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 20px;
    color: #111111;
    margin: 0;
  }

  .drawer-close-btn {
    background: transparent;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #78716C;
  }

  .drawer-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
  }

  .drawer-footer {
    padding: 16px 24px;
    border-top: 1px solid #EAE7DF;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn-secondary {
    padding: 8px 16px;
    border: 1px solid #E2DFD7;
    background: #FFFFFF;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }

  .btn-primary-black {
    padding: 8px 16px;
    background: #111111;
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  /* CONFIRM MODAL STYLES */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .confirm-modal-box {
    width: 400px;
    max-width: 100%;
    background: #FFFFFF;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    text-align: center;
    box-sizing: border-box;
  }

  .modal-warning-icon {
    width: 48px;
    height: 48px;
    background: #FEF2F2;
    border-radius: 9999px;
    color: #DC2626;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  .modal-title {
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    margin-bottom: 8px;
  }

  .modal-subtext {
    font-size: 13px;
    color: #57534E;
    line-height: 18px;
    margin-bottom: 24px;
  }

  .modal-actions-row {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .btn-danger-confirm {
    padding: 10px 20px;
    background: #DC2626;
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
`;

// Sample dummy Categories matching DB Schema
const sampleCategories = [
  {
    id: '1',
    code: 'CAT-COAT-01',
    name: 'Áo Khoác & Măng Tô',
    slug: '/ao-khoac-mang-to',
    product_count: 45,
    revenue: '1.845.000.000₫',
    display_order: 1,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=150',
  },
  {
    id: '2',
    code: 'CAT-DRESS-02',
    name: 'Váy Thiết Kế & Dạ Hội',
    slug: '/vay-thiet-ke',
    product_count: 32,
    revenue: '1.240.000.000₫',
    display_order: 2,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=150',
  },
  {
    id: '3',
    code: 'CAT-BLAZER-03',
    name: 'Áo Vest & Blazer Atelier',
    slug: '/ao-vest-blazer',
    product_count: 28,
    revenue: '980.000.000₫',
    display_order: 3,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=150',
  },
  {
    id: '4',
    code: 'CAT-SUMMER-04',
    name: 'Bộ Sưu Tập Mùa Hè',
    slug: '/bo-suu-tap-mua-he',
    product_count: 14,
    revenue: '320.000.000₫',
    display_order: 4,
    status: 'INACTIVE', // Đã ẩn
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=150',
  },
];

export default function CategoryManager() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState(sampleCategories);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer state: null, or { mode: 'edit' | 'view', category: item }
  const [drawerData, setDrawerData] = useState(null);

  // Confirm delete modal state: null, or category to delete
  const [deleteCategory, setDeleteCategory] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleConfirmDelete = () => {
    if (deleteCategory) {
      setCategories(categories.filter((c) => c.id !== deleteCategory.id));
      setDeleteCategory(null);
    }
  };

  return (
    <div className="manager-layout">
      <style>{categoryManagerStyles}</style>

      {/* LEFT SIDEBAR */}
      <aside className="left-sidebar">
        <div className="sidebar-top-part">

          {/* Logo Brand */}
          <div className="brand-logo-section">
            <img src="/logo.png" alt="Youth Fashion Logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
            <span className="brand-logo-text">YOUTH FASHION</span>
          </div>

          <div className="nav-section-label">KHU VỰC QUẢN TRỊ</div>

          {/* Navigation Menu */}
          <nav className="nav-menu-items">
            {/* 1. Tổng Quan */}
            <button
              className="nav-menu-link"
              onClick={() => navigate('/manager')}
            >
              <div className="nav-item-inner">
                <LayoutGrid size={16} />
                <span>Tổng Quan</span>
              </div>
            </button>

            {/* 2. Quản Lý Sản Phẩm */}
            <button
              className="nav-menu-link"
              onClick={() => navigate('/manager/products')}
            >
              <div className="nav-item-inner">
                <Package size={16} />
                <span>Quản Lý Sản Phẩm</span>
              </div>
            </button>

            {/* 3. Quản Lý Danh Mục (Active) */}
            <button
              className="nav-menu-link active"
              onClick={() => navigate('/manager/categories')}
            >
              <div className="nav-item-inner">
                <Folder size={16} />
                <span>Quản Lý Danh Mục</span>
              </div>
            </button>

            {/* 4. Quản Lý Lookbook */}
            <button
              className="nav-menu-link"
              onClick={() => navigate('/manager/lookbooks')}
            >
              <div className="nav-item-inner">
                <BookOpen size={16} />
                <span>Quản Lý Lookbook</span>
              </div>
            </button>

            {/* 5. Quản Lý Đơn Hàng (Badge 18) */}
            <button
              className="nav-menu-link"
              onClick={() => navigate('/manager')}
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
              className="nav-menu-link"
              onClick={() => navigate('/manager')}
            >
              <div className="nav-item-inner">
                <MessageSquare size={16} />
                <span>Tư Vấn & CSKH</span>
              </div>
            </button>

            {/* 7. Voucher & Khuyến Mãi */}
            <button
              className="nav-menu-link"
              onClick={() => navigate('/manager')}
            >
              <div className="nav-item-inner">
                <Tag size={16} />
                <span>Voucher & Khuyến Mãi</span>
              </div>
            </button>

            {/* 8. Báo Cáo & Doanh Thu */}
            <button
              className="nav-menu-link"
              onClick={() => navigate('/manager')}
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

        {/* Header Bar */}
        <header className="top-header-bar">
          <div className="header-search-box">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#A8A29E">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="header-search-input"
              placeholder="Tìm theo tên danh mục, mã code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="header-user-profile">
            <div className="user-avatar-circle">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="user-info-text">
              <span className="user-name">{user?.full_name || 'Quản lý Youth Fashion'}</span>
              <span className="user-role-label">{user?.role || 'Quản trị viên (Manager)'}</span>
            </div>
          </div>
        </header>

        {/* Scroll Body */}
        <div className="dashboard-scroll-body">

          {/* Section Header */}
          <div className="dashboard-header-row">
            <div>
              <p className="dashboard-header-sub">QUẢN LÝ DANH MỤC & PHÂN LOẠI</p>
              <h1 className="dashboard-header-title">Quản Lý Danh Mục</h1>
            </div>

            <button type="button" className="btn-add-category">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Thêm Danh Mục Mới
            </button>
          </div>

          {/* KPI Cards Grid */}
          <div className="kpi-cards-grid">

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">TỔNG DANH MỤC</span>
                <div className="kpi-icon-badge">📁</div>
              </div>
              <div className="kpi-value">18 <span style={{ fontSize: '15px', fontWeight: 400, color: '#57534E' }}>Danh mục</span></div>
              <div className="kpi-subtext">15 đang hiển thị • 3 ẩn</div>
              <div className="kpi-progress-bg">
                <div className="kpi-progress-bar" style={{ width: '83%' }} />
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">DANH MỤC CHỦ LỰC</span>
                <div className="kpi-icon-badge">👑</div>
              </div>
              <div className="kpi-value" style={{ fontSize: '18px' }}>Áo Khoác & Măng Tô</div>
              <div className="kpi-subtext">Đóng góp 42% doanh thu toàn hệ thống</div>
              <div className="kpi-progress-bg">
                <div className="kpi-progress-bar" style={{ width: '42%', background: '#C5A059' }} />
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">PHÂN BỔ SKU</span>
                <div className="kpi-icon-badge">🏷️</div>
              </div>
              <div className="kpi-value">248 <span style={{ fontSize: '15px', fontWeight: 400, color: '#57534E' }}>SKU</span></div>
              <div className="kpi-subtext">Trung bình ~14 SKU / danh mục</div>
              <div className="kpi-progress-bg">
                <div className="kpi-progress-bar" style={{ width: '70%', background: '#EAB308' }} />
              </div>
            </div>

          </div>

          {/* Table Section Card */}
          <div className="table-section-card">

            {/* Filter Bar */}
            <div className="table-filter-bar">
              <div className="status-tabs-row">
                <div className="status-tabs-group">
                  <button
                    className={`status-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ALL')}
                  >
                    Tất Cả <span className="tab-count-badge" style={{ background: activeTab === 'ALL' ? '#333' : '#E7E5E4' }}>18</span>
                  </button>
                  <button
                    className={`status-tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ACTIVE')}
                  >
                    Đang Hiển Thị <span className="tab-count-badge" style={{ background: '#DCFCE7', color: '#15803D' }}>15</span>
                  </button>
                  <button
                    className={`status-tab-btn ${activeTab === 'INACTIVE' ? 'active' : ''}`}
                    onClick={() => setActiveTab('INACTIVE')}
                  >
                    Đã Ẩn <span className="tab-count-badge" style={{ background: '#FEE2E2', color: '#DC2626' }}>3</span>
                  </button>
                </div>
              </div>

              <div className="filter-controls-row">
                <div className="search-filter-input">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#A8A29E">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input placeholder="Lọc theo tên hoặc mã danh mục..." />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="filter-select">
                    <option value="">Cấp danh mục: Tất cả</option>
                    <option value="parent">Danh mục gốc (Parent)</option>
                    <option value="sub">Danh mục con (Sub-category)</option>
                  </select>

                  <select className="filter-select">
                    <option value="newest">Sắp xếp: Mới nhất</option>
                    <option value="name_asc">Tên: A - Z</option>
                    <option value="products_desc">Số sản phẩm giảm dần</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <table className="category-data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}><input type="checkbox" /></th>
                  <th>DANH MỤC & MÃ</th>
                  <th>SỐ SẢN PHẨM</th>
                  <th>DOANH THU</th>
                  <th style={{ textAlign: 'center' }}>VỊ TRÍ</th>
                  <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div className="category-title-cell">
                        <img src={c.image} alt={c.name} className="category-thumb" />
                        <div>
                          <div className="cat-name">{c.name}</div>
                          <div>
                            <span className="cat-code-badge">{c.code}</span>
                            <span className="cat-slug">{c.slug}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><strong>{c.product_count}</strong> sản phẩm</td>
                    <td style={{ fontWeight: 600 }}>{c.revenue}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>#{c.display_order}</td>
                    <td style={{ textAlign: 'center' }}>
                      {c.status === 'ACTIVE' ? (
                        <span className="status-pill-active">● Đang Hiện</span>
                      ) : (
                        <span className="status-pill-hidden">● Đã Ẩn</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <div className="action-buttons-cell">
                        {/* Edit Button */}
                        <button
                          type="button"
                          className="action-btn-item edit"
                          title="Chỉnh sửa danh mục"
                          onClick={() => setDrawerData({ mode: 'edit', category: c })}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* View Details Button */}
                        <button
                          type="button"
                          className="action-btn-item view"
                          title="Xem chi tiết"
                          onClick={() => setDrawerData({ mode: 'view', category: c })}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="action-btn-item delete"
                          title="Xóa danh mục"
                          onClick={() => setDeleteCategory(c)}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>

        </div>

      </main>

      {/* DRAWER COMPONENT (Edit / View Details) */}
      {drawerData && (
        <div className="drawer-overlay" onClick={() => setDrawerData(null)}>
          <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="drawer-title">
                {drawerData.mode === 'edit' ? 'Chỉnh Sửa Danh Mục' : 'Chi Tiết Danh Mục'}
              </h3>
              <button className="drawer-close-btn" onClick={() => setDrawerData(null)}>✕</button>
            </div>

            <div className="drawer-body">
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <img src={drawerData.category.image} alt="" style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#57534E' }}>TÊN DANH MỤC</label>
                <input
                  type="text"
                  className="search-filter-input"
                  style={{ width: '100%', marginTop: '4px' }}
                  defaultValue={drawerData.category.name}
                  readOnly={drawerData.mode === 'view'}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#57534E' }}>MÃ CODE DANH MỤC</label>
                <input
                  type="text"
                  className="search-filter-input"
                  style={{ width: '100%', marginTop: '4px' }}
                  defaultValue={drawerData.category.code}
                  readOnly={drawerData.mode === 'view'}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#57534E' }}>SLUG ĐƯỜNG DẪN URL</label>
                <input
                  type="text"
                  className="search-filter-input"
                  style={{ width: '100%', marginTop: '4px' }}
                  defaultValue={drawerData.category.slug}
                  readOnly={drawerData.mode === 'view'}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#57534E' }}>THỨ TỰ HIỂN THỊ</label>
                  <input
                    type="number"
                    className="search-filter-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    defaultValue={drawerData.category.display_order}
                    readOnly={drawerData.mode === 'view'}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#57534E' }}>TRẠNG THÁI</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', marginTop: '4px', height: '36px' }}
                    defaultValue={drawerData.category.status}
                    disabled={drawerData.mode === 'view'}
                  >
                    <option value="ACTIVE">Đang Hiện</option>
                    <option value="INACTIVE">Đã Ẩn</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button className="btn-secondary" onClick={() => setDrawerData(null)}>
                {drawerData.mode === 'view' ? 'Đóng' : 'Hủy'}
              </button>
              {drawerData.mode === 'edit' && (
                <button className="btn-primary-black" onClick={() => setDrawerData(null)}>
                  Lưu Thay Đổi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteCategory && (
        <div className="modal-overlay" onClick={() => setDeleteCategory(null)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-warning-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="modal-title">Xác nhận xóa danh mục?</div>
            <div className="modal-subtext">
              Bạn có chắc chắn muốn xóa danh mục <strong>"{deleteCategory.name}"</strong> không? Các sản phẩm thuộc danh mục này có thể bị ảnh hưởng.
            </div>
            <div className="modal-actions-row">
              <button className="btn-secondary" onClick={() => setDeleteCategory(null)}>
                Hủy bỏ
              </button>
              <button className="btn-danger-confirm" onClick={handleConfirmDelete}>
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

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
 * Product Manager Component (Single-file JSX + Embedded CSS Method 1)
 * Enhanced with Figma UI specs: Total & Size Stock breakdown, Strike-through Pricing,
 * Drawer (Edit / View Details), and Delete Confirmation Modal.
 */

const productManagerStyles = `
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

  .btn-add-product {
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

  .btn-add-product:hover {
    background: #2A2725;
  }

  /* KPI Cards Grid */
  .kpi-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 16px;
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
    gap: 8px;
    border-bottom: 1px solid #F5F4EF;
    padding-bottom: 12px;
    overflow-x: auto;
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
  .product-data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
  }

  .product-data-table th {
    background: #FAF9F6;
    padding: 12px 16px;
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #78716C;
    border-bottom: 1px solid #EAE7DF;
  }

  .product-data-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #F2EEE8;
    color: #1C1917;
    vertical-align: middle;
  }

  .product-info-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .product-thumb {
    width: 44px;
    height: 44px;
    border-radius: 6px;
    object-fit: cover;
    background: #F2EFE9;
    border: 1px solid #E2DFD7;
  }

  .product-name-title {
    font-weight: 600;
    color: #111111;
  }

  .price-cell-main {
    font-weight: 700;
    font-size: 13.5px;
    color: #111111;
  }

  .price-cell-original {
    font-size: 11px;
    color: #A8A29E;
    text-decoration: line-through;
    margin-top: 1px;
  }

  .stock-total-bold {
    font-weight: 700;
    font-size: 13.5px;
    color: #111111;
  }

  .stock-total-warning {
    font-weight: 700;
    font-size: 13.5px;
    color: #C2410C;
  }

  .stock-sizes-subtext {
    font-size: 12px;
    color: #78716C;
    margin-left: 10px;
    font-weight: 400;
  }

  .mini-stock-bar-bg {
    width: 150px;
    height: 5px;
    background: #F2EFE9;
    border-radius: 9999px;
    margin-top: 6px;
    overflow: hidden;
  }

  .mini-stock-bar-fill-green {
    height: 100%;
    background: #15803D;
    border-radius: 9999px;
  }

  .mini-stock-bar-fill-orange {
    height: 100%;
    background: #C2410C;
    border-radius: 9999px;
  }

  .status-pill-green {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 14px;
    background: #DCFCE7;
    color: #15803D;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
  }

  .status-pill-orange {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 14px;
    background: #FEF3C7;
    color: #B45309;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
  }

  /* 3 Action Buttons matching Figma image */
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

// Sample dummy product list matching Figma design Specs (Product level with aggregated sizes)
const initialProducts = [
  {
    id: '1',
    code: 'PROD-COAT-CAMEL',
    name: 'Áo Măng Tô Dạ Camel High-End',
    category: 'Áo Khoác & Măng Tô',
    brand: 'Youth Fashion Atelier',
    price: '4.850.000₫',
    original_price: '5.200.000₫',
    total_stock: 42,
    sizes: [
      { size: 'S', stock: 12 },
      { size: 'M', stock: 18 },
      { size: 'L', stock: 12 },
    ],
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=150',
  },
  {
    id: '2',
    code: 'PROD-SILK-DRESS',
    name: 'Váy Lụa Tơ Tằm Dáng Dài Noir',
    category: 'Váy Thiết Kế',
    brand: 'Youth Fashion Studio',
    price: '2.350.000₫',
    original_price: null,
    total_stock: 5,
    sizes: [
      { size: 'S', stock: 1 },
      { size: 'M', stock: 3 },
      { size: 'L', stock: 1 },
    ],
    status: 'WARNING', // Sắp hết hàng
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=150',
  },
  {
    id: '3',
    code: 'PROD-BLAZER-BLACK',
    name: 'Áo Vest Blazer Oversized Đen',
    category: 'Áo Vest & Blazer',
    brand: 'Youth Fashion Atelier',
    price: '3.690.000₫',
    original_price: '3.950.000₫',
    total_stock: 28,
    sizes: [
      { size: 'S', stock: 8 },
      { size: 'M', stock: 14 },
      { size: 'L', stock: 6 },
    ],
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=150',
  }
];

export default function ProductManager() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer state: null, or { mode: 'edit' | 'view', product: item }
  const [drawerData, setDrawerData] = useState(null);

  // Confirm delete modal state: null, or product to delete
  const [deleteProduct, setDeleteProduct] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleConfirmDelete = () => {
    if (deleteProduct) {
      setProducts(products.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(null);
    }
  };

  return (
    <div className="manager-layout">
      <style>{productManagerStyles}</style>

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

            {/* 2. Quản Lý Sản Phẩm (Active) */}
            <button
              className="nav-menu-link active"
              onClick={() => navigate('/manager/products')}
            >
              <div className="nav-item-inner">
                <Package size={16} />
                <span>Quản Lý Sản Phẩm</span>
              </div>
            </button>

            {/* 3. Quản Lý Danh Mục */}
            <button
              className="nav-menu-link"
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
              placeholder="Tìm theo tên sản phẩm, mã SKU..."
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
              <p className="dashboard-header-sub">QUẢN LÝ KHO HÀNG & BỘ SƯU TẬP</p>
              <h1 className="dashboard-header-title">Quản Lý Sản Phẩm</h1>
            </div>

            <button type="button" className="btn-add-product">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Thêm Sản Phẩm Mới
            </button>
          </div>

          {/* KPI Cards Grid */}
          <div className="kpi-cards-grid">
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Tổng Sản Phẩm</span>
                <div className="kpi-icon-badge">📦</div>
              </div>
              <div className="kpi-value">142</div>
              <div className="kpi-subtext">118 sản phẩm đang kinh doanh</div>
              <div className="kpi-progress-bg">
                <div className="kpi-progress-bar" style={{ width: '85%' }} />
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Giá Trị Kho Hàng</span>
                <div className="kpi-icon-badge">💎</div>
              </div>
              <div className="kpi-value">3.420.000.000₫</div>
              <div className="kpi-subtext">Đã bao gồm 412 biến thể</div>
              <div className="kpi-progress-bg">
                <div className="kpi-progress-bar" style={{ width: '70%', background: '#C5A059' }} />
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Cảnh Báo Hết Hàng</span>
                <div className="kpi-icon-badge">⚠️</div>
              </div>
              <div className="kpi-value" style={{ color: '#B45309' }}>12</div>
              <div className="kpi-subtext">Cần nhập thêm tồn kho ngay</div>
              <div className="kpi-progress-bg">
                <div className="kpi-progress-bar" style={{ width: '30%', background: '#B45309' }} />
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Bán Chạy Nhất</span>
                <div className="kpi-icon-badge">🔥</div>
              </div>
              <div className="kpi-value" style={{ fontSize: '15px' }}>Măng Tô Dạ Camel</div>
              <div className="kpi-subtext">Đã bán 320 chiếc trong tháng</div>
              <div className="kpi-progress-bg">
                <div className="kpi-progress-bar" style={{ width: '92%', background: '#15803D' }} />
              </div>
            </div>
          </div>

          {/* Product Data Table Container */}
          <div className="table-section-card">

            {/* Filter Bar */}
            <div className="table-filter-bar">
              <div className="status-tabs-row">
                <button
                  className={`status-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ALL')}
                >
                  Tất Cả <span className="tab-count-badge" style={{ background: activeTab === 'ALL' ? '#333' : '#E7E5E4' }}>142</span>
                </button>
                <button
                  className={`status-tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ACTIVE')}
                >
                  Đang Bán <span className="tab-count-badge" style={{ background: '#DCFCE7', color: '#15803D' }}>118</span>
                </button>
                <button
                  className={`status-tab-btn ${activeTab === 'WARNING' ? 'active' : ''}`}
                  onClick={() => setActiveTab('WARNING')}
                >
                  Sắp Hết Hàng <span className="tab-count-badge" style={{ background: '#FEF3C7', color: '#B45309' }}>12</span>
                </button>
              </div>

              <div className="filter-controls-row">
                <div className="search-filter-input">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#A8A29E">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input placeholder="Lọc theo tên, SKU..." />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="filter-select">
                    <option value="">Danh mục: Tất cả</option>
                    <option value="coat">Áo Khoác</option>
                    <option value="dress">Váy Thiết Kế</option>
                    <option value="blazer">Blazer</option>
                  </select>

                  <select className="filter-select">
                    <option value="">Mới cập nhật nhất</option>
                    <option value="price_desc">Giá từ cao đến thấp</option>
                    <option value="stock_asc">Tồn kho ít nhất</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table matching Figma design image */}
            <table className="product-data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}><input type="checkbox" /></th>
                  <th>DANH MỤC & SẢN PHẨM</th>
                  <th>GIÁ BÁN / GÓC</th>
                  <th>TỒN KHO (TỔNG & SIZE)</th>
                  <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div className="product-info-cell">
                        <img src={p.image} alt={p.name} className="product-thumb" />
                        <div>
                          <div className="product-name-title">{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#78716C' }}>{p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="price-cell-main">{p.price}</div>
                      {p.original_price && (
                        <div className="price-cell-original">{p.original_price}</div>
                      )}
                    </td>
                    <td>
                      <div>
                        {p.status === 'WARNING' ? (
                          <span className="stock-total-warning">{String(p.total_stock).padStart(2, '0')} chiếc (Sắp hết)</span>
                        ) : (
                          <span className="stock-total-bold">{p.total_stock} chiếc</span>
                        )}
                        <span className="stock-sizes-subtext">
                          {' '}{p.sizes.map((s) => `${s.size}:${s.stock}`).join(' • ')}
                        </span>
                      </div>
                      <div className="mini-stock-bar-bg">
                        <div
                          className={p.status === 'WARNING' ? 'mini-stock-bar-fill-orange' : 'mini-stock-bar-fill-green'}
                          style={{ width: `${Math.min(100, (p.total_stock / 50) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.status === 'ACTIVE' ? (
                        <span className="status-pill-green">Đang bán</span>
                      ) : (
                        <span className="status-pill-orange">Sắp hết hàng</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <div className="action-buttons-cell">
                        {/* Edit Button */}
                        <button
                          type="button"
                          className="action-btn-item edit"
                          title="Chỉnh sửa sản phẩm"
                          onClick={() => setDrawerData({ mode: 'edit', product: p })}
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
                          onClick={() => setDrawerData({ mode: 'view', product: p })}
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
                          title="Xóa sản phẩm"
                          onClick={() => setDeleteProduct(p)}
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
                {drawerData.mode === 'edit' ? 'Chỉnh Sửa Sản Phẩm' : 'Chi Tiết Sản Phẩm'}
              </h3>
              <button className="drawer-close-btn" onClick={() => setDrawerData(null)}>✕</button>
            </div>

            <div className="drawer-body">
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <img src={drawerData.product.image} alt="" style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#57534E' }}>TÊN SẢN PHẨM</label>
                <input
                  type="text"
                  className="search-filter-input"
                  style={{ width: '100%', marginTop: '4px' }}
                  defaultValue={drawerData.product.name}
                  readOnly={drawerData.mode === 'view'}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#57534E' }}>GIÁ BÁN</label>
                <input
                  type="text"
                  className="search-filter-input"
                  style={{ width: '100%', marginTop: '4px' }}
                  defaultValue={drawerData.product.price}
                  readOnly={drawerData.mode === 'view'}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#57534E' }}>PHÂN BỔ TỒN KHO SIZE</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {drawerData.product.sizes.map((s, idx) => (
                    <div key={idx} style={{ flex: 1, background: '#F5F4EF', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#78716C', fontWeight: 600 }}>Size {s.size}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{s.stock}</div>
                    </div>
                  ))}
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
      {deleteProduct && (
        <div className="modal-overlay" onClick={() => setDeleteProduct(null)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-warning-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="modal-title">Xác nhận xóa sản phẩm?</div>
            <div className="modal-subtext">
              Bạn có chắc chắn muốn xóa sản phẩm <strong>"{deleteProduct.name}"</strong> không? Hành động này không thể hoàn tác.
            </div>
            <div className="modal-actions-row">
              <button className="btn-secondary" onClick={() => setDeleteProduct(null)}>
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

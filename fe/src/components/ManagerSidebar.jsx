import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { useConfirmModal } from '../context/ConfirmModalContext';
import { 
  LayoutGrid, 
  Package, 
  Folder, 
  Award,
  BookOpen, 
  ShoppingBag, 
  MessageSquare, 
  Tag, 
  BarChart2, 
  Home, 
  LogOut 
} from 'lucide-react';

const sidebarStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400&display=swap');

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
    font-family: 'Inter', sans-serif;
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
`;

export default function ManagerSidebar({ activeMenu = 'products' }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showSuccess } = useToast();
  const { confirmModal } = useConfirmModal();

  const handleLogout = async () => {
    const confirmed = await confirmModal({
      title: 'Đăng xuất tài khoản',
      message: 'Bạn có chắc chắn muốn đăng xuất tài khoản quản trị không?',
      confirmText: 'Đăng xuất',
      cancelText: 'Hủy bỏ',
      variant: 'logout'
    });

    if (confirmed) {
      if (logout) {
        await logout();
      }
      showSuccess('Đã đăng xuất tài khoản quản trị thành công!');
      navigate('/login');
    }
  };

  return (
    <aside className="left-sidebar">
      <style>{sidebarStyles}</style>

      <div className="sidebar-top-part">
        {/* Brand Logo */}
        <div className="brand-logo-section">
          <img src="/logo.png" alt="Youth Fashion Logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
          <span className="brand-logo-text">YOUTH FASHION</span>
        </div>

        <div className="nav-section-label">KHU VỰC QUẢN TRỊ</div>

        {/* Navigation Menu */}
        <nav className="nav-menu-items">
          {/* 1. Tổng Quan */}
          <button
            type="button"
            className={`nav-menu-link ${activeMenu === 'overview' ? 'active' : ''}`}
            onClick={() => navigate('/manager')}
          >
            <div className="nav-item-inner">
              <LayoutGrid size={16} />
              <span>Tổng Quan</span>
            </div>
          </button>

          {/* 2. Quản Lý Sản Phẩm */}
          <button
            type="button"
            className={`nav-menu-link ${activeMenu === 'products' ? 'active' : ''}`}
            onClick={() => navigate('/manager/products')}
          >
            <div className="nav-item-inner">
              <Package size={16} />
              <span>Quản Lý Sản Phẩm</span>
            </div>
          </button>

          {/* 3. Quản Lý Danh Mục */}
          <button
            type="button"
            className={`nav-menu-link ${activeMenu === 'categories' ? 'active' : ''}`}
            onClick={() => navigate('/manager/categories')}
          >
            <div className="nav-item-inner">
              <Folder size={16} />
              <span>Quản Lý Danh Mục</span>
            </div>
          </button>

          {/* 4. Quản Lý Thương Hiệu */}
          <button
            type="button"
            className={`nav-menu-link ${activeMenu === 'brands' ? 'active' : ''}`}
            onClick={() => navigate('/manager/brands')}
          >
            <div className="nav-item-inner">
              <Award size={16} />
              <span>Quản Lý Thương Hiệu</span>
            </div>
          </button>

          {/* 4. Quản Lý Lookbook */}
          <button
            type="button"
            className={`nav-menu-link ${activeMenu === 'lookbooks' ? 'active' : ''}`}
            onClick={() => navigate('/manager/lookbooks')}
          >
            <div className="nav-item-inner">
              <BookOpen size={16} />
              <span>Quản Lý Lookbook</span>
            </div>
          </button>

          {/* 5. Quản Lý Đơn Hàng (Badge 18) */}
          <button
            type="button"
            className={`nav-menu-link ${activeMenu === 'orders' ? 'active' : ''}`}
            onClick={() => navigate('/manager')}
          >
            <div className="nav-item-inner">
              <ShoppingBag size={16} />
              <span>Quản Lý Đơn Hàng</span>
            </div>
            <span className="order-count-badge">
              18
            </span>
          </button>

          {/* 6. Tư Vấn & CSKH */}
          <button
            type="button"
            className={`nav-menu-link ${activeMenu === 'support' ? 'active' : ''}`}
            onClick={() => navigate('/manager')}
          >
            <div className="nav-item-inner">
              <MessageSquare size={16} />
              <span>Tư Vấn & CSKH</span>
            </div>
          </button>

          {/* 7. Voucher & Khuyến Mãi */}
          <button
            type="button"
            className={`nav-menu-link ${activeMenu === 'vouchers' ? 'active' : ''}`}
            onClick={() => navigate('/manager')}
          >
            <div className="nav-item-inner">
              <Tag size={16} />
              <span>Voucher & Khuyến Mãi</span>
            </div>
          </button>

          {/* 8. Báo Cáo & Doanh Thu */}
          <button
            type="button"
            className={`nav-menu-link ${activeMenu === 'reports' ? 'active' : ''}`}
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
  );
}

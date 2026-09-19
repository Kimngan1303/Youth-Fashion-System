import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { brandService } from '../../services/brandService';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';
import {
  Award,
  Plus,
  Edit,
  Eye,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';

const brandManagerStyles = `
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

  .main-content-area {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
    min-height: 100vh;
    box-sizing: border-box;
  }

  /* Scroll Body */
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
    font-weight: 700;
    font-size: 11.5px;
    line-height: 16px;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #8C857B;
    margin: 0;
  }

  .dashboard-header-title {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 26px;
    line-height: 32px;
    color: #111111;
    margin: 4px 0 0 0;
  }

  .btn-add-brand {
    display: flex;
    align-items: center;
    padding: 10px 18px;
    gap: 8px;
    background: #111111;
    border: none;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    color: #FFFFFF;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-add-brand:hover {
    background: #2A2725;
  }

  /* KPI Cards Grid */
  .kpi-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    width: 100%;
  }

  .kpi-card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px 22px;
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
    font-size: 11.5px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #8C857B;
  }

  .kpi-icon-badge {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30px;
    height: 30px;
    background: #FBF9F4;
    border-radius: 6px;
    font-size: 15px;
  }

  .kpi-value {
    font-weight: 700;
    font-size: 24px;
    line-height: 30px;
    color: #111111;
    margin: 6px 0 2px 0;
  }

  .kpi-subtext {
    font-size: 12.5px;
    color: #78716C;
  }

  /* Table Section Card */
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
    width: 300px;
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

  /* Data Table */
  .brand-data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13.5px;
  }

  .brand-data-table th {
    background: #FAF9F6;
    padding: 14px 18px;
    font-weight: 700;
    font-size: 11.5px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #78716C;
    border-bottom: 1px solid #EAE7DF;
  }

  .brand-data-table td {
    padding: 16px 18px;
    border-bottom: 1px solid #F2EEE8;
    color: #1C1917;
    vertical-align: middle;
  }

  .brand-title-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #F5F4EF;
    border: 1px solid #E2DFD7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111111;
  }

  .brand-name {
    font-weight: 600;
    color: #111111;
  }

  .brand-id-sub {
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

  /* Drawer Form Styles */
  .drawer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 9999;
    display: flex;
    justify-content: flex-end;
  }

  .drawer-container {
    width: 460px;
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
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 12px;
    font-weight: 600;
    color: #57534E;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .form-input, .form-textarea, .form-select {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #E2DFD7;
    border-radius: 6px;
    font-size: 13px;
    color: #111111;
    outline: none;
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
  }

  .form-input:focus, .form-textarea:focus, .form-select:focus {
    border-color: #111111;
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
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

export default function BrandManager() {
  const { showSuccess, showError } = useToast();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer state: null, or { mode: 'create' | 'edit' | 'view', brand?: item }
  const [drawerMode, setDrawerMode] = useState(null);
  const [currentBrand, setCurrentBrand] = useState(null);

  const [formData, setFormData] = useState({
    brand_name: '',
    description: '',
    status: 'ACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);

  // Confirm delete modal state
  const [deleteBrandItem, setDeleteBrandItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Brands từ CSDL MySQL thật 100%
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await brandService.getBrands({
        search: searchTerm,
        status: activeTab,
      });

      if (res.status && res.data) {
        setBrands(res.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách thương hiệu:', err);
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách thương hiệu từ CSDL MySQL');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeTab]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Open Drawer Create
  const handleOpenCreateDrawer = () => {
    setCurrentBrand(null);
    setFormData({
      brand_name: '',
      description: '',
      status: 'ACTIVE',
    });
    setDrawerMode('create');
  };

  // Open Drawer Edit / View
  const handleOpenEditDrawer = (brand, mode = 'edit') => {
    setCurrentBrand(brand);
    setFormData({
      brand_name: brand.brand_name,
      description: brand.description || '',
      status: brand.status,
    });
    setDrawerMode(mode);
  };

  // Submit Create / Edit Brand Form
  const handleSubmitBrandForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isCreate = drawerMode === 'create';
      if (isCreate) {
        await brandService.createBrand(formData);
      } else if (drawerMode === 'edit' && currentBrand) {
        await brandService.updateBrand(currentBrand.brand_id, formData);
      }

      setDrawerMode(null);
      fetchBrands();
      showSuccess(isCreate ? 'Tạo mới thương hiệu thành công' : 'Đã lưu thay đổi thương hiệu thành công');
    } catch (err) {
      console.error('Lỗi khi lưu thương hiệu:', err);
      const detailedErrors = err.response?.data?.errors?.join(', ');
      const msg = detailedErrors
        ? `${err.response.data.message}: ${detailedErrors}`
        : (err.response?.data?.message || 'Có lỗi xảy ra khi lưu thương hiệu');
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Brand
  const handleConfirmDelete = async () => {
    if (!deleteBrandItem) return;
    setDeleting(true);
    try {
      await brandService.deleteBrand(deleteBrandItem.brand_id);
      setDeleteBrandItem(null);
      fetchBrands();
      showSuccess('Đã xóa thương hiệu thành công');
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể xóa thương hiệu này');
    } finally {
      setDeleting(false);
    }
  };

  // KPI Computations
  const totalBrandCount = brands.length;
  const activeCount = brands.filter((b) => b.status === 'ACTIVE').length;
  const inactiveCount = brands.filter((b) => b.status === 'INACTIVE').length;
  const totalProductsInBrand = brands.reduce((sum, b) => sum + (b.product_count || 0), 0);
  const topBrand = brands.reduce((max, b) => ((b.product_count || 0) > (max?.product_count || 0) ? b : max), brands[0]);

  return (
    <div className="manager-layout">
      <style>{brandManagerStyles}</style>

      {/* LEFT SIDEBAR */}
      <ManagerSidebar activeMenu="brands" />

      {/* MAIN CONTENT AREA */}
      <main className="main-content-area">

        {/* Header Bar */}
        <ManagerHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Tìm theo tên thương hiệu trong CSDL MySQL..."
        />

        {/* Scroll Body */}
        <div className="dashboard-scroll-body">

          {/* Section Header */}
          <div className="dashboard-header-row">
            <div>
              <p className="dashboard-header-sub">QUẢN LÝ DỮ LIỆU MYSQL THẬT 100%</p>
              <h1 className="dashboard-header-title">Quản Lý Thương Hiệu</h1>
            </div>

            <button type="button" className="btn-add-brand" onClick={handleOpenCreateDrawer}>
              <Plus size={16} />
              Thêm Thương Hiệu Mới
            </button>
          </div>

          {/* KPI Cards Grid */}
          <div className="kpi-cards-grid">

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">TỔNG THƯƠNG HIỆU DB</span>
                <div className="kpi-icon-badge">🏷️</div>
              </div>
              <div className="kpi-value">{totalBrandCount} <span style={{ fontSize: '14px', fontWeight: 400, color: '#57534E' }}>Thương hiệu</span></div>
              <div className="kpi-subtext">{activeCount} đang hiển thị • {inactiveCount} đã ẩn</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">THƯƠNG HIỆU NHIỀU SP NHẤT</span>
                <div className="kpi-icon-badge">👑</div>
              </div>
              <div className="kpi-value" style={{ fontSize: '18px' }}>{topBrand?.brand_name || 'N/A'}</div>
              <div className="kpi-subtext">Chứa {topBrand?.product_count || 0} sản phẩm liên kết</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">TỔNG SẢN PHẨM PHÂN BỔ</span>
                <div className="kpi-icon-badge">📦</div>
              </div>
              <div className="kpi-value">{totalProductsInBrand} <span style={{ fontSize: '14px', fontWeight: 400, color: '#57534E' }}>Sản phẩm</span></div>
              <div className="kpi-subtext">Trung bình ~{totalBrandCount > 0 ? Math.round(totalProductsInBrand / totalBrandCount) : 0} SP / thương hiệu</div>
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
                    Tất Cả <span className="tab-count-badge" style={{ background: activeTab === 'ALL' ? '#333' : '#E7E5E4' }}>{totalBrandCount}</span>
                  </button>
                  <button
                    className={`status-tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ACTIVE')}
                  >
                    Đang Hiển Thị <span className="tab-count-badge" style={{ background: '#DCFCE7', color: '#15803D' }}>{activeCount}</span>
                  </button>
                  <button
                    className={`status-tab-btn ${activeTab === 'INACTIVE' ? 'active' : ''}`}
                    onClick={() => setActiveTab('INACTIVE')}
                  >
                    Đã Ẩn <span className="tab-count-badge" style={{ background: '#FEE2E2', color: '#DC2626' }}>{inactiveCount}</span>
                  </button>
                </div>
              </div>

              <div className="filter-controls-row">
                <div className="search-filter-input">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#A8A29E">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    placeholder="Lọc theo tên thương hiệu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Loading / Error / Data Table */}
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#78716C' }}>
                <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                <span>Đang tải dữ liệu thương hiệu từ MySQL...</span>
              </div>
            ) : errorMsg ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626' }}>
                <AlertCircle size={28} style={{ margin: '0 auto 8px' }} />
                <p>{errorMsg}</p>
                <button type="button" className="btn-secondary" onClick={fetchBrands} style={{ marginTop: '12px' }}>
                  Thử lại
                </button>
              </div>
            ) : brands.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#78716C' }}>
                Không tìm thấy thương hiệu nào phù hợp.
              </div>
            ) : (
              <table className="brand-data-table">
                <thead>
                  <tr>
                    <th>TÊN THƯƠNG HIỆU</th>
                    <th>MÔ TẢ</th>
                    <th>SẢN PHẨM LIÊN KẾT</th>
                    <th>TRẠNG THÁI</th>
                    <th>NGÀY TẠO</th>
                    <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b.brand_id}>
                      <td>
                        <div className="brand-title-cell">
                          <div className="brand-icon-box">
                            <Award size={18} />
                          </div>
                          <div>
                            <div className="brand-name">{b.brand_name}</div>
                            <div className="brand-id-sub">ID: #{b.brand_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#57534E', maxWidth: '300px' }}>
                        {b.description || <span style={{ color: '#A8A29E', italic: 'true' }}>Chưa có mô tả</span>}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#111111' }}>{b.product_count || 0}</span> sản phẩm
                      </td>
                      <td>
                        {b.status === 'ACTIVE' ? (
                          <span className="status-pill-active">● Hoạt động</span>
                        ) : (
                          <span className="status-pill-hidden">● Đã ẩn</span>
                        )}
                      </td>
                      <td style={{ color: '#78716C', fontSize: '12.5px' }}>
                        {new Date(b.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          <button
                            type="button"
                            className="action-btn-item view"
                            title="Xem chi tiết"
                            onClick={() => handleOpenEditDrawer(b, 'view')}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-btn-item edit"
                            title="Chỉnh sửa"
                            onClick={() => handleOpenEditDrawer(b, 'edit')}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-btn-item delete"
                            title="Xóa thương hiệu"
                            onClick={() => setDeleteBrandItem(b)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>

        </div>
      </main>

      {/* DRAWER FORM (CREATE / EDIT / VIEW) */}
      {drawerMode && (
        <div className="drawer-overlay" onClick={() => setDrawerMode(null)}>
          <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="drawer-title">
                {drawerMode === 'create' && 'Thêm Thương Hiệu Mới'}
                {drawerMode === 'edit' && `Chỉnh Sửa Thương Hiệu #${currentBrand?.brand_id}`}
                {drawerMode === 'view' && `Chi Tiết Thương Hiệu #${currentBrand?.brand_id}`}
              </h2>
              <button type="button" className="drawer-close-btn" onClick={() => setDrawerMode(null)}>✕</button>
            </div>

            <form onSubmit={handleSubmitBrandForm} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="drawer-body">
                <div className="form-group">
                  <label className="form-label">Tên Thương Hiệu *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nhập tên thương hiệu (VD: YouthFashion Studio, Nike...)"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    disabled={drawerMode === 'view'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mô Tả Thương Hiệu</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Nhập mô tả tổng quan về thương hiệu..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={drawerMode === 'view'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Trạng Thái Hiển Thị</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={drawerMode === 'view'}
                  >
                    <option value="ACTIVE">Hoạt động (Hiển thị công khai)</option>
                    <option value="INACTIVE">Tạm ẩn (Ẩn khỏi giao diện bán hàng)</option>
                  </select>
                </div>

                {drawerMode === 'view' && currentBrand && (
                  <div style={{ background: '#F9F8F6', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 600, color: '#78716C' }}>THÔNG TIN THỐNG KÊ</p>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#111' }}>• Số sản phẩm thuộc thương hiệu: <strong>{currentBrand.product_count || 0}</strong></p>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#111' }}>• Ngày khởi tạo: {new Date(currentBrand.created_at).toLocaleString('vi-VN')}</p>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#111' }}>• Cập nhật lần cuối: {new Date(currentBrand.updated_at).toLocaleString('vi-VN')}</p>
                  </div>
                )}
              </div>

              <div className="drawer-footer">
                <button type="button" className="btn-secondary" onClick={() => setDrawerMode(null)}>
                  {drawerMode === 'view' ? 'Đóng' : 'Hủy bỏ'}
                </button>

                {drawerMode !== 'view' && (
                  <button type="submit" className="btn-primary-black" disabled={submitting}>
                    {submitting && <Loader2 className="animate-spin" size={14} />}
                    {drawerMode === 'create' ? 'Tạo Thương Hiệu' : 'Lưu Thay Đổi'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteBrandItem && (
        <div className="modal-overlay" onClick={() => setDeleteBrandItem(null)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-warning-icon">
              <AlertCircle size={26} />
            </div>
            <h3 className="modal-title">Xác nhận xóa thương hiệu?</h3>
            <p className="modal-subtext">
              Bạn có chắc chắn muốn xóa thương hiệu <strong>"{deleteBrandItem.brand_name}"</strong>?
              {deleteBrandItem.product_count > 0 && (
                <span style={{ display: 'block', color: '#DC2626', marginTop: '6px', fontWeight: 600 }}>
                  ⚠️ Thương hiệu này đang chứa {deleteBrandItem.product_count} sản phẩm liên kết!
                </span>
              )}
            </p>
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteBrandItem(null)}
                disabled={deleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting && <Loader2 className="animate-spin" size={14} />}
                Xóa Thương Hiệu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

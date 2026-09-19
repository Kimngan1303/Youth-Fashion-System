import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { categoryService } from '../../services/categoryService';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';
import {
  Folder,
  Plus,
  Edit,
  Eye,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';

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

  .btn-add-category {
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

  .btn-add-category:hover {
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

  .filter-select {
    padding: 8px 12px;
    border: 1px solid #E2DFD7;
    border-radius: 8px;
    font-size: 12.5px;
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
    font-size: 13.5px;
  }

  .category-data-table th {
    background: #FAF9F6;
    padding: 14px 18px;
    font-weight: 700;
    font-size: 11.5px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #78716C;
    border-bottom: 1px solid #EAE7DF;
  }

  .category-data-table td {
    padding: 16px 18px;
    border-bottom: 1px solid #F2EEE8;
    color: #1C1917;
    vertical-align: middle;
  }

  .category-title-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .category-icon-box {
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

  .cat-name {
    font-weight: 600;
    color: #111111;
  }

  .cat-id-sub {
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

export default function CategoryManager() {
  const { showSuccess, showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer state: null, or { mode: 'create' | 'edit' | 'view', category?: item }
  const [drawerMode, setDrawerMode] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);

  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    status: 'ACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);

  // Confirm delete modal state
  const [deleteCategoryItem, setDeleteCategoryItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Categories từ CSDL MySQL thật 100%
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await categoryService.getCategories({
        search: searchTerm,
        status: activeTab,
      });

      if (res.status && res.data) {
        setCategories(res.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh mục:', err);
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách danh mục từ MySQL');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeTab]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open Drawer Create
  const handleOpenCreateDrawer = () => {
    setCurrentCategory(null);
    setFormData({
      category_name: '',
      description: '',
      status: 'ACTIVE',
    });
    setDrawerMode('create');
  };

  // Open Drawer Edit / View
  const handleOpenEditDrawer = (cat, mode = 'edit') => {
    setCurrentCategory(cat);
    setFormData({
      category_name: cat.category_name,
      description: cat.description || '',
      status: cat.status,
    });
    setDrawerMode(mode);
  };

  // Submit Create / Edit Category Form
  const handleSubmitCategoryForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isCreate = drawerMode === 'create';
      if (isCreate) {
        await categoryService.createCategory(formData);
      } else if (drawerMode === 'edit' && currentCategory) {
        await categoryService.updateCategory(currentCategory.category_id, formData);
      }

      setDrawerMode(null);
      fetchCategories();
      showSuccess(isCreate ? 'Tạo mới danh mục thành công' : 'Đã lưu thay đổi danh mục thành công');
    } catch (err) {
      console.error('Lỗi khi lưu danh mục:', err);
      const detailedErrors = err.response?.data?.errors?.join(', ');
      const msg = detailedErrors
        ? `${err.response.data.message}: ${detailedErrors}`
        : (err.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục');
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Category
  const handleConfirmDelete = async () => {
    if (!deleteCategoryItem) return;
    setDeleting(true);
    try {
      await categoryService.deleteCategory(deleteCategoryItem.category_id);
      setDeleteCategoryItem(null);
      fetchCategories();
      showSuccess('Đã xóa danh mục thành công');
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể xóa danh mục này');
    } finally {
      setDeleting(false);
    }
  };

  // KPI Computations
  const totalCatCount = categories.length;
  const activeCount = categories.filter((c) => c.status === 'ACTIVE').length;
  const inactiveCount = categories.filter((c) => c.status === 'INACTIVE').length;
  const totalProductsInCat = categories.reduce((sum, c) => sum + (c.product_count || 0), 0);
  const topCategory = categories.reduce((max, c) => ((c.product_count || 0) > (max?.product_count || 0) ? c : max), categories[0]);

  return (
    <div className="manager-layout">
      <style>{categoryManagerStyles}</style>

      {/* LEFT SIDEBAR */}
      <ManagerSidebar activeMenu="categories" />

      {/* MAIN CONTENT AREA */}
      <main className="main-content-area">

        {/* Header Bar */}
        <ManagerHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Tìm theo tên danh mục trong CSDL MySQL..."
        />

        {/* Scroll Body */}
        <div className="dashboard-scroll-body">

          {/* Section Header */}
          <div className="dashboard-header-row">
            <div>
              <p className="dashboard-header-sub">QUẢN LÝ DỮ LIỆU MYSQL THẬT 100%</p>
              <h1 className="dashboard-header-title">Quản Lý Danh Mục</h1>
            </div>

            <button type="button" className="btn-add-category" onClick={handleOpenCreateDrawer}>
              <Plus size={16} />
              Thêm Danh Mục Mới
            </button>
          </div>

          {/* KPI Cards Grid */}
          <div className="kpi-cards-grid">

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">TỔNG DANH MỤC DB</span>
                <div className="kpi-icon-badge">📁</div>
              </div>
              <div className="kpi-value">{totalCatCount} <span style={{ fontSize: '14px', fontWeight: 400, color: '#57534E' }}>Danh mục</span></div>
              <div className="kpi-subtext">{activeCount} đang hiển thị • {inactiveCount} đã ẩn</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">DANH MỤC NHIỀU SP NHẤT</span>
                <div className="kpi-icon-badge">👑</div>
              </div>
              <div className="kpi-value" style={{ fontSize: '18px' }}>{topCategory?.category_name || 'N/A'}</div>
              <div className="kpi-subtext">Chứa {topCategory?.product_count || 0} sản phẩm liên kết</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">TỔNG SẢN PHẨM PHÂN BỔ</span>
                <div className="kpi-icon-badge">📦</div>
              </div>
              <div className="kpi-value">{totalProductsInCat} <span style={{ fontSize: '14px', fontWeight: 400, color: '#57534E' }}>Sản phẩm</span></div>
              <div className="kpi-subtext">Trung bình ~{totalCatCount > 0 ? Math.round(totalProductsInCat / totalCatCount) : 0} SP / danh mục</div>
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
                    Tất Cả <span className="tab-count-badge" style={{ background: activeTab === 'ALL' ? '#333' : '#E7E5E4' }}>{totalCatCount}</span>
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
                    placeholder="Lọc theo tên danh mục..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Loading / Error / Data Table */}
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#78716C' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '8px', fontSize: '13px' }}>Đang tải danh mục từ MySQL CSDL...</p>
              </div>
            ) : errorMsg ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>
                <AlertCircle size={24} />
                <p style={{ marginTop: '8px', fontSize: '13px' }}>{errorMsg}</p>
              </div>
            ) : categories.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#78716C' }}>
                <p>Không tìm thấy danh mục nào trong CSDL MySQL.</p>
              </div>
            ) : (
              <table className="category-data-table">
                <thead>
                  <tr>
                    <th>TÊN DANH MỤC & ID</th>
                    <th>MÔ TẢ DANH MỤC</th>
                    <th>SỐ SẢN PHẨM LIÊN KẾT</th>
                    <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.category_id}>
                      <td>
                        <div className="category-title-cell">
                          <div className="category-icon-box">
                            <Folder size={20} />
                          </div>
                          <div>
                            <div className="cat-name">{c.category_name}</div>
                            <div className="cat-id-sub">#{c.category_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ color: '#57534E', fontSize: '13px', maxWidth: '320px' }}>
                          {c.description || 'Chưa có mô tả'}
                        </div>
                      </td>
                      <td>
                        <strong>{c.product_count}</strong> sản phẩm
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {c.status === 'ACTIVE' ? (
                          <span className="status-pill-active">● Đang Hiện</span>
                        ) : (
                          <span className="status-pill-hidden">● Đã Ẩn</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <div className="action-buttons-cell">
                          <button
                            type="button"
                            className="action-btn-item edit"
                            title="Chỉnh sửa danh mục"
                            onClick={() => handleOpenEditDrawer(c, 'edit')}
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            type="button"
                            className="action-btn-item view"
                            title="Xem chi tiết"
                            onClick={() => handleOpenEditDrawer(c, 'view')}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            className="action-btn-item delete"
                            title="Xóa danh mục"
                            onClick={() => setDeleteCategoryItem(c)}
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

      {/* DRAWER COMPONENT (Create / Edit / View Details) */}
      {drawerMode && (
        <div className="drawer-overlay" onClick={() => setDrawerMode(null)}>
          <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="drawer-title">
                {drawerMode === 'create'
                  ? 'Thêm Danh Mục Mới'
                  : drawerMode === 'edit'
                    ? 'Chỉnh Sửa Danh Mục'
                    : 'Chi Tiết Danh Mục'}
              </h3>
              <button className="drawer-close-btn" onClick={() => setDrawerMode(null)}>✕</button>
            </div>

            <form onSubmit={handleSubmitCategoryForm} className="drawer-body">
              <div className="form-group">
                <label className="form-label">Tên danh mục *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  disabled={drawerMode === 'view'}
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả danh mục</label>
                <textarea
                  rows="4"
                  className="form-textarea"
                  disabled={drawerMode === 'view'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái hiển thị *</label>
                <select
                  className="form-select"
                  disabled={drawerMode === 'view'}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">Đang Hiện (Hoạt động)</option>
                  <option value="INACTIVE">Đã Ẩn (Tạm ngưng)</option>
                </select>
              </div>

              <div className="drawer-footer">
                <button type="button" className="btn-secondary" onClick={() => setDrawerMode(null)}>
                  {drawerMode === 'view' ? 'Đóng' : 'Hủy'}
                </button>
                {drawerMode !== 'view' && (
                  <button type="submit" className="btn-primary-black" disabled={submitting}>
                    {submitting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                    {drawerMode === 'create' ? 'Tạo Danh Mục Mới' : 'Lưu Thay Đổi'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteCategoryItem && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteCategoryItem(null)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-warning-icon">
              <Trash2 size={24} />
            </div>
            <div className="modal-title">Xác nhận xóa danh mục khỏi MySQL?</div>
            <div className="modal-subtext">
              Bạn có chắc chắn muốn xóa danh mục <strong>"{deleteCategoryItem.category_name}"</strong> khỏi CSDL MySQL không? Hành động này không thể hoàn tác.
            </div>
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary"
                disabled={deleting}
                onClick={() => setDeleteCategoryItem(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                disabled={deleting}
                onClick={handleConfirmDelete}
              >
                {deleting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

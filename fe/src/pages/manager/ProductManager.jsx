import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';
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
  Plus,
  Trash2,
  Edit,
  Eye,
  Star,
  Upload,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';

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
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #111111;
  }

  .nav-section-label {
    padding: 16px 0px 4px;
    width: 100%;
    font-weight: 700;
    font-size: 9.5px;
    line-height: 14px;
    letter-spacing: 0.5px;
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
    width: 340px;
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

  .btn-add-product {
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

  .btn-add-product:hover {
    background: #2A2725;
  }

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
    margin: 8px 0 2px 0;
  }

  .kpi-subtext {
    font-size: 12.5px;
    color: #78716C;
  }

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

  .product-data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13.5px;
  }

  .product-data-table th {
    background: #FAF9F6;
    padding: 14px 18px;
    font-weight: 700;
    font-size: 11.5px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #78716C;
    border-bottom: 1px solid #EAE7DF;
  }

  .product-data-table td {
    padding: 16px 18px;
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
    width: 48px;
    height: 48px;
    border-radius: 6px;
    object-fit: cover;
    background: #F2EFE9;
    border: 1px solid #E2DFD7;
  }

  .product-name-title {
    font-weight: 600;
    color: #111111;
    font-size: 13.5px;
  }

  .price-cell-main {
    font-weight: 700;
    font-size: 13.5px;
    color: #111111;
  }

  .stock-total-bold {
    font-weight: 700;
    font-size: 13.5px;
    color: #111111;
  }

  .stock-sizes-subtext {
    font-size: 11.5px;
    color: #78716C;
    margin-left: 8px;
  }

  .status-pill-green {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    background: #DCFCE7;
    color: #15803D;
    border-radius: 9999px;
    font-size: 11.5px;
    font-weight: 600;
  }

  .status-pill-orange {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    background: #FEF3C7;
    color: #B45309;
    border-radius: 9999px;
    font-size: 11.5px;
    font-weight: 600;
  }

  .action-buttons-cell {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
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
    transition: background 0.15s ease;
  }

  .action-btn-item.edit { color: #44403C; }
  .action-btn-item.edit:hover { background: #F5F4EF; color: #111111; }
  .action-btn-item.view { color: #44403C; }
  .action-btn-item.view:hover { background: #F5F4EF; color: #111111; }
  .action-btn-item.delete { color: #EF4444; }
  .action-btn-item.delete:hover { background: #FEF2F2; color: #DC2626; }

  /* Drawer Modal */
  .drawer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 9999;
    display: flex;
    justify-content: flex-end;
  }

  .drawer-container {
    width: 620px;
    max-width: 95vw;
    height: 100vh;
    background: #FFFFFF;
    box-shadow: -4px 0 25px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    animation: drawerSlide 0.2s ease-out;
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
    font-size: 20px;
    cursor: pointer;
    color: #78716C;
  }

  .drawer-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
    overflow-y: auto;
  }

  .drawer-footer {
    padding: 16px 24px;
    border-top: 1px solid #EAE7DF;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background: #FAF9F6;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #57534E;
  }

  .form-input, .form-textarea, .form-select {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #E2DFD7;
    border-radius: 6px;
    font-size: 13px;
    color: #1C1917;
    outline: none;
    box-sizing: border-box;
  }

  .form-input:focus, .form-textarea:focus, .form-select:focus {
    border-color: #111111;
  }

  /* Image Gallery Card Grid */
  .image-gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 12px;
    margin-top: 8px;
  }

  .image-card-box {
    position: relative;
    width: 100%;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #E2DFD7;
    background: #F7F6F3;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .image-card-box.is-primary {
    border: 2px solid #15803D;
    box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.15);
  }

  .image-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .badge-primary-label {
    position: absolute;
    top: 6px;
    left: 6px;
    background: #15803D;
    color: #FFFFFF;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 7px;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    gap: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .image-actions-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    opacity: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: opacity 0.2s;
    padding: 6px;
  }

  .image-card-box:hover .image-actions-overlay {
    opacity: 1;
  }

  .btn-img-action {
    background: #FFFFFF;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 10.5px;
    font-weight: 600;
    color: #111111;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    width: 90%;
    justify-content: center;
  }

  .btn-img-action.danger {
    background: #DC2626;
    color: #FFFFFF;
  }

  .variant-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1.2fr 1fr 32px;
    gap: 8px;
    align-items: center;
    background: #FBF9F4;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #EAE7DF;
  }

  .btn-secondary {
    padding: 9px 18px;
    border: 1px solid #E2DFD7;
    background: #FFFFFF;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }

  .btn-primary-black {
    padding: 9px 18px;
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
    width: 420px;
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

export default function ProductManager() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // State quản lý danh sách sản phẩm từ MySQL
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Filter & Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Drawer modal state for Create / Edit / View
  const [drawerMode, setDrawerMode] = useState(null); // 'create' | 'edit' | 'view'
  const [currentProduct, setCurrentProduct] = useState(null);

  // Form State cho Create/Edit Product
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    category_id: '',
    brand_id: '',
    status: 'ACTIVE',
  });
  const [variantsData, setVariantsData] = useState([]);

  // Multi-image Selection State (File mới được chọn từ máy tính)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Quản lý ảnh hiện tại trong DB
  const [existingImages, setExistingImages] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingSingleImg, setUploadingSingleImg] = useState(false);

  // Modal Xóa Sản phẩm
  const [deleteProductItem, setDeleteProductItem] = useState(null);

  // Modal Xóa Ảnh sản phẩm
  const [deleteImageId, setDeleteImageId] = useState(null);
  const [deletingImage, setDeletingImage] = useState(false);

  // Mở modal xác nhận xóa ảnh
  const handleOpenDeleteImageModal = (imageId) => {
    setDeleteImageId(imageId);
  };

  // Thực thi xóa ảnh khi người dùng bấm xác nhận trong modal
  const handleConfirmDeleteImage = async () => {
    if (!deleteImageId) return;
    setDeletingImage(true);
    try {
      await productService.deleteProductImage(deleteImageId);
      const updatedImgs = existingImages.filter((img) => String(img.image_id) !== String(deleteImageId));
      setExistingImages(updatedImgs);
      fetchProducts();
      setDeleteImageId(null);
      showSuccess('Đã xóa ảnh thành công');
    } catch (err) {
      console.error('Lỗi khi xóa ảnh:', err);
      showError(err.response?.data?.message || 'Không thể xóa ảnh');
    } finally {
      setDeletingImage(false);
    }
  };

  // Lấy dữ liệu sản phẩm từ MySQL
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await productService.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        category_id: selectedCategory,
      });

      if (res.status && res.data) {
        setProducts(res.data.products || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách sản phẩm:', err);
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách sản phẩm từ CSDL MySQL');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedCategory]);

  const fetchMeta = async () => {
    try {
      const res = await productService.getMeta();
      if (res.status && res.data) {
        setCategories(res.data.categories || []);
        setBrands(res.data.brands || []);
      }
    } catch (err) {
      console.error('Lỗi lấy danh mục/thương hiệu:', err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Mở Drawer Tạo mới
  const handleOpenCreateDrawer = () => {
    setFormData({
      product_name: '',
      description: '',
      category_id: categories.length > 0 ? categories[0].category_id : '',
      brand_id: brands.length > 0 ? brands[0].brand_id : '',
      status: 'ACTIVE',
    });
    setVariantsData([
      { sku: `YOUTH-${Date.now().toString().slice(-4)}-S`, size: 'S', color: 'Đen', price: 250000, stock: 50 },
      { sku: `YOUTH-${Date.now().toString().slice(-4)}-M`, size: 'M', color: 'Trắng', price: 250000, stock: 50 },
    ]);
    setSelectedFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setCurrentProduct(null);
    setDrawerMode('create');
  };

  // Mở Drawer Chỉnh sửa / Xem chi tiết
  const handleOpenEditDrawer = (product, mode = 'edit') => {
    setCurrentProduct(product);
    setFormData({
      product_name: product.product_name,
      description: product.description || '',
      category_id: String(product.category_id),
      brand_id: String(product.brand_id),
      status: product.status,
    });
    setVariantsData(
      product.variants.map((v) => ({
        variant_id: v.variant_id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        price: v.price,
        stock: v.stock,
      }))
    );
    setExistingImages(product.images || []);
    setSelectedFiles([]);
    setImagePreviews([]);
    setDrawerMode(mode);
  };

  // Xử lý chọn NHIỀU file ảnh từ máy tính
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // Xóa 1 ảnh trong danh sách xem trước (Preview) trước khi upload
  const handleRemovePreviewImage = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  // Đặt 1 ảnh trong CSDL làm Ảnh đại diện chính (Primary Image)
  const handleSetPrimaryImage = async (imageId) => {
    if (!currentProduct) return;
    try {
      await productService.setPrimaryProductImage(currentProduct.product_id, imageId);
      // Cập nhật state local ngay lập tức
      const updatedImgs = existingImages.map((img) => ({
        ...img,
        is_primary: String(img.image_id) === String(imageId),
      }));
      setExistingImages(updatedImgs);
      fetchProducts(); // Cập nhật lại sản phẩm trên bảng
      showSuccess('Đã đặt làm ảnh chính');
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể đặt làm ảnh chính');
    }
  };

  // Xóa 1 ảnh trong CSDL MySQL (mở modal xác nhận)
  const handleDeleteExistingImage = (imageId) => {
    handleOpenDeleteImageModal(imageId);
  };

  // Upload trực tiếp 1 hoặc nhiều ảnh mới vào sản phẩm đã có sẵn trong DB
  const handleDirectUploadImage = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !currentProduct) return;

    setUploadingSingleImg(true);
    try {
      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);
        formDataUpload.append('is_primary', existingImages.length === 0 ? 'true' : 'false');
        await productService.addProductImage(currentProduct.product_id, formDataUpload);
      }

      // Tải lại chi tiết sản phẩm để nhận các ảnh vừa upload từ Cloudinary
      const res = await productService.getProductById(currentProduct.product_id);
      if (res.status && res.data) {
        setExistingImages(res.data.images || []);
        setCurrentProduct(res.data);
      }
      fetchProducts();
      showSuccess(`Đã tải lên ${files.length} ảnh mới thành công`);
    } catch (err) {
      showError(err.response?.data?.message || 'Lỗi khi upload ảnh lên Cloudinary');
    } finally {
      setUploadingSingleImg(false);
    }
  };

  // Thêm / bớt hàng biến thể
  const handleAddVariantRow = () => {
    setVariantsData([
      ...variantsData,
      { sku: `SKU-${Date.now().toString().slice(-4)}`, size: 'L', color: 'Đen', price: 290000, stock: 20 },
    ]);
  };

  const handleRemoveVariantRow = (index) => {
    setVariantsData(variantsData.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variantsData];
    updated[index][field] = value;
    setVariantsData(updated);
  };

  // Submit Form Tạo/Sửa Sản phẩm
  const handleSubmitProductForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('product_name', formData.product_name);
      data.append('description', formData.description);
      data.append('category_id', formData.category_id);
      data.append('brand_id', formData.brand_id);
      data.append('status', formData.status);
      data.append('variants', JSON.stringify(variantsData));

      // Append danh sách các file ảnh đính kèm
      for (let i = 0; i < selectedFiles.length; i++) {
        data.append('images', selectedFiles[i]);
      }

      const isCreate = drawerMode === 'create';
      if (isCreate) {
        await productService.createProduct(data);
      } else if (drawerMode === 'edit' && currentProduct) {
        await productService.updateProduct(currentProduct.product_id, data);
      }

      setDrawerMode(null);
      fetchProducts();
      showSuccess(isCreate ? 'Tạo mới sản phẩm thành công' : 'Đã lưu thay đổi sản phẩm thành công');
    } catch (err) {
      console.error('Lỗi khi lưu sản phẩm:', err);
      const detailedErrors = err.response?.data?.errors?.join(', ');
      const errorMsg = detailedErrors 
        ? `${err.response.data.message}: ${detailedErrors}` 
        : (err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm');
      showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Xác nhận Xóa Sản phẩm
  const handleConfirmDelete = async () => {
    if (!deleteProductItem) return;
    try {
      await productService.deleteProduct(deleteProductItem.product_id);
      setDeleteProductItem(null);
      fetchProducts();
      showSuccess('Đã xóa sản phẩm thành công');
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  };

  const calculateStock = (variants) => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="manager-layout">
      <style>{productManagerStyles}</style>

      {/* LEFT SIDEBAR */}
      <ManagerSidebar activeMenu="products" />

      {/* MAIN CONTENT AREA */}
      <main className="main-content-area">
        {/* Header Bar */}
        <ManagerHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Tìm tên sản phẩm trong CSDL MySQL..."
        />

        {/* Scroll Body */}
        <div className="dashboard-scroll-body">
          <div className="dashboard-header-row">
            <div>
              <p className="dashboard-header-sub">QUẢN LÝ DỮ LIỆU MYSQL THẬT 100%</p>
              <h1 className="dashboard-header-title">Quản Lý Sản Phẩm & Bộ Sưu Tập Ảnh</h1>
            </div>

            <button type="button" className="btn-add-product" onClick={handleOpenCreateDrawer}>
              <Plus size={16} />
              Thêm Sản Phẩm Mới
            </button>
          </div>

          {/* KPI Cards */}
          <div className="kpi-cards-grid">
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Tổng Sản Phẩm DB</span>
                <div className="kpi-icon-badge">📦</div>
              </div>
              <div className="kpi-value">{pagination.total}</div>
              <div className="kpi-subtext">Được tải trực tiếp từ MySQL</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Danh Mục</span>
                <div className="kpi-icon-badge">📂</div>
              </div>
              <div className="kpi-value">{categories.length}</div>
              <div className="kpi-subtext">Danh mục sản phẩm hiện có</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Thương Hiệu</span>
                <div className="kpi-icon-badge">🏷️</div>
              </div>
              <div className="kpi-value">{brands.length}</div>
              <div className="kpi-subtext">Thương hiệu đồng hành</div>
            </div>
          </div>

          {/* Product Data Table */}
          <div className="table-section-card">
            <div className="table-filter-bar">
              <div className="filter-controls-row">
                <div className="search-filter-input">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#A8A29E">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    placeholder="Lọc theo tên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="filter-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Danh mục: Tất cả</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#78716C' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '8px', fontSize: '13px' }}>Đang kết nối CSDL MySQL và tải sản phẩm...</p>
              </div>
            ) : errorMsg ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>
                <AlertCircle size={24} />
                <p style={{ marginTop: '8px', fontSize: '13px' }}>{errorMsg}</p>
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#78716C' }}>
                <p>Không tìm thấy sản phẩm nào trong MySQL.</p>
              </div>
            ) : (
              <table className="product-data-table">
                <thead>
                  <tr>
                    <th>SẢN PHẨM & ẢNH ĐẠI DIỆN</th>
                    <th>DANH MỤC / BRAND</th>
                    <th>GIÁ BÁN</th>
                    <th>TỒN KHO & BIẾN THỂ</th>
                    <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const primaryImg = p.images?.find((img) => img.is_primary) || p.images?.[0];
                    const minPrice = p.variants?.length > 0 ? Math.min(...p.variants.map((v) => v.price)) : 0;
                    const totalStock = calculateStock(p.variants);

                    return (
                      <tr key={p.product_id}>
                        <td>
                          <div className="product-info-cell">
                            <img
                              src={primaryImg?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150'}
                              alt={p.product_name}
                              className="product-thumb"
                            />
                            <div>
                              <div className="product-name-title">{p.product_name}</div>
                              <div style={{ fontSize: '11px', color: '#78716C' }}>
                                #{p.product_id} • {p.images?.length || 0} ảnh trong bộ sưu tập
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.category?.category_name || 'N/A'}</div>
                          <div style={{ fontSize: '11px', color: '#78716C' }}>{p.brand?.brand_name || 'N/A'}</div>
                        </td>
                        <td>
                          <div className="price-cell-main">{formatPrice(minPrice)}</div>
                        </td>
                        <td>
                          <span className="stock-total-bold">{totalStock} chiếc</span>
                          <span className="stock-sizes-subtext">
                            ({p.variants?.map((v) => `${v.size}/${v.color}:${v.stock}`).join(', ')})
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={p.status === 'ACTIVE' ? 'status-pill-green' : 'status-pill-orange'}>
                            {p.status === 'ACTIVE' ? 'Đang bán' : 'Ẩn'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <div className="action-buttons-cell">
                            <button
                              type="button"
                              className="action-btn-item edit"
                              title="Chỉnh sửa & Quản lý ảnh"
                              onClick={() => handleOpenEditDrawer(p, 'edit')}
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              type="button"
                              className="action-btn-item view"
                              title="Xem chi tiết"
                              onClick={() => handleOpenEditDrawer(p, 'view')}
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              className="action-btn-item delete"
                              title="Xóa sản phẩm"
                              onClick={() => setDeleteProductItem(p)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* DRAWER FORM FOR CREATE / EDIT / VIEW */}
      {drawerMode && (
        <div className="drawer-overlay" onClick={() => setDrawerMode(null)}>
          <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="drawer-title">
                {drawerMode === 'create'
                  ? 'Thêm Sản Phẩm Mới'
                  : drawerMode === 'edit'
                    ? 'Chỉnh Sửa Sản Phẩm & Quản Lý Ảnh'
                    : 'Chi Tiết Sản Phẩm'}
              </h3>
              <button className="drawer-close-btn" onClick={() => setDrawerMode(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProductForm} className="drawer-body">
              <div className="form-group">
                <label className="form-label">Tên sản phẩm *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  disabled={drawerMode === 'view'}
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Danh mục *</label>
                  <select
                    className="form-select"
                    disabled={drawerMode === 'view'}
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Thương hiệu *</label>
                  <select
                    className="form-select"
                    disabled={drawerMode === 'view'}
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                  >
                    {brands.map((b) => (
                      <option key={b.brand_id} value={b.brand_id}>
                        {b.brand_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả sản phẩm</label>
                <textarea
                  rows="3"
                  className="form-textarea"
                  disabled={drawerMode === 'view'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* BỘ SƯU TẬP ẢNH HIỆN TẠI TRONG CSDL MYSQL */}
              {drawerMode !== 'create' && existingImages.length > 0 && (
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Bộ sưu tập ảnh hiện tại ({existingImages.length} ảnh)</label>
                    {drawerMode !== 'view' && (
                      <label style={{ fontSize: '11px', color: '#15803D', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Upload size={12} />
                        Thêm ảnh trực tiếp
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: 'none' }}
                          onChange={handleDirectUploadImage}
                          disabled={uploadingSingleImg}
                        />
                      </label>
                    )}
                  </div>

                  {uploadingSingleImg && (
                    <p style={{ fontSize: '11px', color: '#15803D', margin: '4px 0' }}>⏳ Đang upload ảnh mới lên Cloudinary...</p>
                  )}

                  <div className="image-gallery-grid">
                    {existingImages.map((img) => (
                      <div key={img.image_id} className={`image-card-box ${img.is_primary ? 'is-primary' : ''}`}>
                        <img src={img.image_url} alt="product img" className="image-card-img" />

                        {img.is_primary && (
                          <div className="badge-primary-label">
                            <Star size={10} fill="#FFFFFF" /> Ảnh chính
                          </div>
                        )}

                        {drawerMode !== 'view' && (
                          <div className="image-actions-overlay">
                            {!img.is_primary && (
                              <button
                                type="button"
                                className="btn-img-action"
                                onClick={() => handleSetPrimaryImage(img.image_id)}
                              >
                                <Star size={12} /> Đặt ảnh chính
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-img-action danger"
                              onClick={() => handleDeleteExistingImage(img.image_id)}
                            >
                              <Trash2 size={12} /> Xóa ảnh
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CHỌN & XEM TRƯỚC NHIỀU ẢNH MỚI TRƯỚC KHI UPLOAD */}
              {drawerMode !== 'view' && (
                <div className="form-group">
                  <label className="form-label">Chọn ảnh từ máy tính (Up được nhiều ảnh)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="form-input"
                    onChange={handleFileSelect}
                  />

                  {imagePreviews.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#78716C', fontWeight: 600 }}>
                        Ảnh xem trước chuẩn bị upload ({imagePreviews.length} ảnh):
                      </span>
                      <div className="image-gallery-grid">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="image-card-box">
                            <img src={preview} alt={`preview ${idx}`} className="image-card-img" />
                            <div className="image-actions-overlay" style={{ opacity: 1, background: 'rgba(0,0,0,0.3)' }}>
                              <button
                                type="button"
                                className="btn-img-action danger"
                                style={{ width: 'auto', padding: '6px' }}
                                title="Gỡ chọn ảnh này"
                                onClick={() => handleRemovePreviewImage(idx)}
                              >
                                <X size={14} /> Gỡ ảnh
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quản lý Biến thể (Variants) */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Biến thể (SKU, Size, Màu, Giá, Tồn kho)</label>
                  {drawerMode !== 'view' && (
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      style={{ fontSize: '11px', color: '#111', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      + Thêm biến thể
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {variantsData.map((v, idx) => (
                    <div key={idx} className="variant-row">
                      <input
                        placeholder="SKU"
                        className="form-input"
                        style={{ padding: '6px', fontSize: '11px' }}
                        disabled={drawerMode === 'view'}
                        value={v.sku}
                        onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                      />
                      <input
                        placeholder="Size"
                        className="form-input"
                        style={{ padding: '6px', fontSize: '11px' }}
                        disabled={drawerMode === 'view'}
                        value={v.size}
                        onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                      />
                      <input
                        placeholder="Màu"
                        className="form-input"
                        style={{ padding: '6px', fontSize: '11px' }}
                        disabled={drawerMode === 'view'}
                        value={v.color}
                        onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                      />
                      <input
                        placeholder="Giá (VNĐ)"
                        type="number"
                        className="form-input"
                        style={{ padding: '6px', fontSize: '11px' }}
                        disabled={drawerMode === 'view'}
                        value={v.price}
                        onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                      />
                      <input
                        placeholder="Kho"
                        type="number"
                        className="form-input"
                        style={{ padding: '6px', fontSize: '11px' }}
                        disabled={drawerMode === 'view'}
                        value={v.stock}
                        onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                      />
                      {drawerMode !== 'view' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="drawer-footer">
                <button type="button" className="btn-secondary" onClick={() => setDrawerMode(null)}>
                  {drawerMode === 'view' ? 'Đóng' : 'Hủy'}
                </button>
                {drawerMode !== 'view' && (
                  <button type="submit" className="btn-primary-black" disabled={submitting}>
                    {submitting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                    {drawerMode === 'create' ? 'Tạo Sản Phẩm & Upload Ảnh' : 'Lưu Thay Đổi'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteProductItem && (
        <div className="modal-overlay" onClick={() => setDeleteProductItem(null)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-warning-icon">
              <Trash2 size={24} />
            </div>
            <div className="modal-title">Xác nhận xóa sản phẩm khỏi MySQL?</div>
            <div className="modal-subtext">
              Bạn có chắc chắn muốn xóa sản phẩm <strong>"{deleteProductItem.product_name}"</strong> khỏi CSDL MySQL không? Hành động này không thể hoàn tác.
            </div>
            <div className="modal-actions-row">
              <button className="btn-secondary" onClick={() => setDeleteProductItem(null)}>
                Hủy bỏ
              </button>
              <button className="btn-danger-confirm" onClick={handleConfirmDelete}>
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE IMAGE MODAL */}
      {deleteImageId && (
        <div className="modal-overlay" style={{ zIndex: 10001 }} onClick={() => !deletingImage && setDeleteImageId(null)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-warning-icon">
              <Trash2 size={24} />
            </div>
            <div className="modal-title">Xóa ảnh này?</div>
            <div className="modal-subtext">
              Bạn có chắc chắn muốn xóa ảnh này khỏi bộ sưu tập? Hành động này không thể hoàn tác.
            </div>
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary"
                disabled={deletingImage}
                onClick={() => setDeleteImageId(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                disabled={deletingImage}
                onClick={handleConfirmDeleteImage}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {deletingImage && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {deletingImage ? 'Đang xóa...' : 'Xóa ảnh'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

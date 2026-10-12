import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { brandService } from '../../services/brandService';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';
import {
  Award,
  Star,
  Tag,
  Plus,
  Search,
  ArrowLeft,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle,
  TrendingUp,
  Banknote,
  CheckCircle,
  X
} from 'lucide-react';

const brandStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400;1,600&display=swap');

  .bm-layout {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    width: 100%;
    min-height: 100vh;
    background: #F7F6F3;
    font-family: 'Inter', sans-serif;
    box-sizing: border-box;
    color: #111111;
  }

  .bm-main-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 100vh;
    box-sizing: border-box;
    background: #F7F6F3;
  }

  .bm-scroll-body {
    display: flex;
    flex-direction: column;
    padding: 32px 36px 60px;
    gap: 24px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Header Section */
  .bm-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
  }

  .bm-title-heading {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px;
    font-weight: 700;
    color: #111111;
    margin: 0;
    line-height: 1.2;
    letter-spacing: -0.3px;
  }

  .bm-title-sub {
    font-size: 13px;
    color: #78716C;
    margin: 6px 0 0 0;
    font-weight: 400;
  }

  .bm-btn-add {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #111111;
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  .bm-btn-add:hover {
    background: #262626;
  }

  .bm-btn-add:active {
    transform: scale(0.98);
  }

  /* Metric Cards Grid */
  .bm-metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    width: 100%;
  }

  .bm-metric-card {
    background: #FFFFFF;
    border: 1px solid #EDE8DE;
    border-radius: 12px;
    padding: 22px 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    box-sizing: border-box;
  }

  .bm-metric-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .bm-metric-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #78716C;
    margin: 0;
  }

  .bm-metric-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F5F4EF;
    color: #111111;
  }

  .bm-metric-icon-box.gold {
    background: #FEF3C7;
    color: #D97706;
  }

  .bm-metric-value-row {
    margin: 14px 0 8px;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .bm-metric-value-num {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 32px;
    font-weight: 700;
    color: #111111;
    line-height: 1;
  }

  .bm-metric-value-unit {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 22px;
    font-weight: 600;
    color: #111111;
  }

  .bm-metric-subtext {
    font-size: 12px;
    color: #78716C;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }

  .bm-progress-bar-wrap {
    height: 4px;
    background: #EAE7DF;
    border-radius: 999px;
    overflow: hidden;
    margin-top: 14px;
    width: 100%;
  }

  .bm-progress-bar-fill {
    height: 100%;
    background: #111111;
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  .bm-progress-accent-line {
    height: 2px;
    background: #F59E0B;
    opacity: 0.5;
    border-radius: 999px;
    margin-top: 14px;
    width: 100%;
  }

  /* Filter Section Card */
  .bm-filter-card {
    background: #FFFFFF;
    border: 1px solid #EDE8DE;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .bm-tab-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .bm-tab-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bm-tab-btn {
    padding: 6px 16px;
    border-radius: 9999px;
    font-size: 12.5px;
    font-weight: 500;
    color: #6B7280;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .bm-tab-btn:hover {
    background: #F3F4F6;
    color: #111111;
  }

  .bm-tab-btn.active {
    background: #111111;
    color: #FFFFFF;
    font-weight: 600;
  }

  .bm-quick-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .bm-btn-pill-outline {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 9999px;
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    color: #374151;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .bm-btn-pill-outline:hover {
    background: #F9FAFB;
    border-color: #D1D5DB;
  }

  .bm-selection-count-text {
    font-size: 12.5px;
    color: #78716C;
    white-space: nowrap;
  }

  .bm-btn-pill-delete {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 9999px;
    border: 1px solid #FECACA;
    background: #FEF2F2;
    color: #EF4444;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .bm-btn-pill-delete:hover:not(:disabled) {
    background: #FEE2E2;
    border-color: #F87171;
  }

  .bm-btn-pill-delete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Search & Sort Row */
  .bm-search-sort-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .bm-search-input-box {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 9px 14px;
    flex: 1;
    max-width: 650px;
    transition: border-color 0.2s;
  }

  .bm-search-input-box:focus-within {
    border-color: #111111;
  }

  .bm-search-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    color: #111111;
    width: 100%;
    font-family: 'Inter', sans-serif;
  }

  .bm-search-input::placeholder {
    color: #9CA3AF;
  }

  .bm-sort-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .bm-sort-label {
    font-size: 13px;
    color: #78716C;
    font-weight: 500;
  }

  .bm-sort-select {
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    color: #111111;
    font-weight: 500;
    outline: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
  }

  .bm-sort-select:focus {
    border-color: #111111;
  }

  /* Table Section Card */
  .bm-table-card {
    background: #FFFFFF;
    border: 1px solid #EDE8DE;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .bm-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .bm-table th {
    background: #F8F7F4;
    padding: 14px 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #78716C;
    border-bottom: 1px solid #EDE8DE;
  }

  .bm-table td {
    padding: 18px 20px;
    border-bottom: 1px solid #F0EEE9;
    vertical-align: middle;
    font-size: 13px;
    color: #1C1917;
    background: #FFFFFF;
  }

  .bm-table tr:hover td {
    background: #FAF9F6;
  }

  .bm-custom-checkbox {
    width: 16px;
    height: 16px;
    accent-color: #111111;
    cursor: pointer;
  }

  .bm-brand-name-text {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    margin: 0;
    letter-spacing: -0.2px;
  }

  .bm-origin-text {
    font-size: 13px;
    color: #374151;
    font-weight: 500;
  }

  .bm-count-number {
    font-weight: 700;
    color: #111111;
    font-size: 13.5px;
  }

  .bm-count-unit {
    color: #78716C;
    font-size: 13px;
    font-weight: 400;
    margin-left: 4px;
  }

  /* Status Pills */
  .bm-status-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 14px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .bm-status-pill.active {
    background: #ECFDF5;
    color: #059669;
  }

  .bm-status-pill.active:hover {
    background: #D1FAE5;
  }

  .bm-status-pill.inactive {
    background: #F3F4F6;
    color: #6B7280;
  }

  .bm-status-pill.inactive:hover {
    background: #E5E7EB;
  }

  /* Actions Group */
  .bm-actions-group {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }

  .bm-action-icon-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #4B5563;
    transition: color 0.15s ease, transform 0.1s ease;
  }

  .bm-action-icon-btn:hover {
    color: #111111;
    transform: scale(1.1);
  }

  .bm-action-icon-btn.delete {
    color: #DC2626;
  }

  .bm-action-icon-btn.delete:hover {
    color: #991B1B;
  }

  /* Pagination Bar */
  .bm-pagination-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #FFFFFF;
    border-top: 1px solid #EDE8DE;
  }

  .bm-pagination-info {
    font-size: 12.5px;
    color: #78716C;
  }

  .bm-pagination-controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .bm-page-nav-btn {
    padding: 5px 12px;
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    color: #374151;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.15s ease;
  }

  .bm-page-nav-btn:hover:not(:disabled) {
    background: #F9FAFB;
    border-color: #D1D5DB;
  }

  .bm-page-nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .bm-page-num-btn {
    min-width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #374151;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .bm-page-num-btn:hover:not(.active) {
    background: #F3F4F6;
  }

  .bm-page-num-btn.active {
    background: #111111;
    color: #FFFFFF;
  }

  /* Modal Windows */
  .bm-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .bm-modal-card {
    background: #FFFFFF;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
    width: 100%;
    max-width: 500px;
    overflow: hidden;
    animation: modalPop 0.2s ease-out;
    box-sizing: border-box;
  }

  @keyframes modalPop {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }

  .bm-modal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid #EDE8DE;
    background: #FAF9F6;
  }

  .bm-modal-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 18px;
    font-weight: 700;
    color: #111111;
    margin: 0;
  }

  .bm-modal-btn-close {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #78716C;
    padding: 4px;
  }

  .bm-modal-btn-close:hover {
    color: #111111;
  }

  .bm-modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .bm-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .bm-form-label {
    font-size: 11.5px;
    font-weight: 700;
    color: #78716C;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .bm-form-input, .bm-form-textarea, .bm-form-select {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #E2DFD7;
    border-radius: 6px;
    font-size: 13px;
    color: #111111;
    outline: none;
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.2s ease;
  }

  .bm-form-input:focus, .bm-form-textarea:focus, .bm-form-select:focus {
    border-color: #111111;
  }

  .bm-modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid #EDE8DE;
    background: #FAF9F6;
  }

  .bm-btn-modal-cancel {
    padding: 8px 16px;
    border: 1px solid #E2DFD7;
    background: #FFFFFF;
    color: #374151;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
  }

  .bm-btn-modal-submit {
    padding: 8px 18px;
    background: #111111;
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .bm-btn-modal-submit:hover {
    background: #262626;
  }
`;

/**
 * Trích xuất hoặc gán xuất xứ chuẩn chỉ cho thương hiệu từ mô tả/tên
 */
export const getBrandOrigin = (brand) => {
  if (!brand) return 'Quốc tế';
  const desc = brand.description || '';
  const match = desc.match(/\[Xuất xứ:\s*([^\]]+)\]/i) || desc.match(/Xuất xứ:\s*([^|\n]+)/i);
  if (match) return match[1].trim();

  const name = (brand.brand_name || '').toLowerCase();
  if (name.includes('chanel') || name.includes('saint laurent') || name.includes('margiela') || name.includes('jacquemus') || name.includes('atelier') || name.includes('couture')) {
    return 'Pháp (Paris)';
  }
  if (name.includes('loro piana') || name.includes('elegance') || name.includes('heritage') || name.includes('modern luxe')) {
    return 'Ý (Milan)';
  }
  if (name.includes('the row') || name.includes('denim')) {
    return 'Mỹ (New York)';
  }
  if (name.includes('tokyo') || name.includes('minimalist')) {
    return 'Nhật Bản (Tokyo)';
  }
  if (name.includes('urban') || name.includes('sporty')) {
    return 'Hàn Quốc (Seoul)';
  }
  if (name.includes('nordic') || name.includes('eco')) {
    return 'Thụy Điển (Stockholm)';
  }
  if (name.includes('youthfashion') || name.includes('casual essentials')) {
    return 'Việt Nam (Hà Nội)';
  }
  return 'Quốc tế';
};

/**
 * Tách phần mô tả sạch (không chứa tag [Xuất xứ: ...])
 */
export const getCleanDescription = (desc = '') => {
  if (!desc) return '';
  return desc.replace(/\[Xuất xứ:\s*[^\]]+\]\s*/i, '').replace(/Xuất xứ:\s*[^|\n]+[|\n]?\s*/i, '').trim();
};

const ITEMS_PER_PAGE = 6;

export default function BrandManager() {
  const { showSuccess, showError } = useToast();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'name_asc' | 'name_desc' | 'products_desc' | 'products_asc'
  const [currentPage, setCurrentPage] = useState(1);

  // Checkbox Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [deletingBrand, setDeletingBrand] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    brand_name: '',
    origin: '',
    description: '',
    status: 'ACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch Brands từ Backend MySQL thật
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await brandService.getBrands();
      if (res.status && res.data) {
        setBrands(res.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách thương hiệu:', err);
      showError('Không thể tải danh sách thương hiệu từ cơ sở dữ liệu MySQL');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Thống kê metrics cho 3 thẻ Card
  const totalCount = brands.length;
  const activeCount = brands.filter((b) => b.status === 'ACTIVE').length;
  const inactiveCount = brands.filter((b) => b.status === 'INACTIVE').length;
  const totalProducts = brands.reduce((sum, b) => sum + (b.product_count || 0), 0);
  const topBrand = useMemo(() => {
    if (brands.length === 0) return null;
    return brands.reduce((max, b) => ((b.product_count || 0) > (max?.product_count || 0) ? b : max), brands[0]);
  }, [brands]);

  // Lọc và Sắp xếp
  const filteredBrands = useMemo(() => {
    let result = [...brands];

    // Lọc theo Tab Trạng thái
    if (activeTab === 'ACTIVE') {
      result = result.filter((b) => b.status === 'ACTIVE');
    } else if (activeTab === 'INACTIVE') {
      result = result.filter((b) => b.status === 'INACTIVE');
    }

    // Lọc theo Từ khóa tìm kiếm (tên, xuất xứ, mô tả)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) => {
        const name = (b.brand_name || '').toLowerCase();
        const origin = getBrandOrigin(b).toLowerCase();
        const desc = (b.description || '').toLowerCase();
        return name.includes(q) || origin.includes(q) || desc.includes(q);
      });
    }

    // Sắp xếp
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.brand_name || '').localeCompare(b.brand_name || '', 'vi'));
    } else if (sortBy === 'name_desc') {
      result.sort((a, b) => (b.brand_name || '').localeCompare(a.brand_name || '', 'vi'));
    } else if (sortBy === 'products_desc') {
      result.sort((a, b) => (b.product_count || 0) - (a.product_count || 0));
    } else if (sortBy === 'products_asc') {
      result.sort((a, b) => (a.product_count || 0) - (b.product_count || 0));
    }

    return result;
  }, [brands, activeTab, searchQuery, sortBy]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredBrands.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Checkbox handlers
  const isAllCurrentSelected = currentItems.length > 0 && currentItems.every((item) => selectedIds.includes(item.brand_id));

  const handleSelectAll = () => {
    if (isAllCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentItems.some((item) => item.brand_id === id)));
    } else {
      const newIds = currentItems.map((item) => item.brand_id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...newIds])));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Toggle nhanh trạng thái Hiển thị / Tạm ẩn
  const handleToggleStatus = async (brand) => {
    const nextStatus = brand.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await brandService.updateBrand(brand.brand_id, {
        brand_name: brand.brand_name,
        description: brand.description,
        status: nextStatus,
      });
      setBrands((prev) =>
        prev.map((b) => (b.brand_id === brand.brand_id ? { ...b, status: nextStatus } : b))
      );
      showSuccess(`Đã chuyển thương hiệu "${brand.brand_name}" sang trạng thái ${nextStatus === 'ACTIVE' ? 'Hiển thị' : 'Tạm ẩn'}`);
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể đổi trạng thái thương hiệu');
    }
  };

  // Mở modal Thêm mới
  const handleOpenCreate = () => {
    setFormData({
      brand_name: '',
      origin: 'Pháp (Paris)',
      description: '',
      status: 'ACTIVE',
    });
    setIsCreateOpen(true);
  };

  // Mở modal Sửa
  const handleOpenEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      brand_name: brand.brand_name,
      origin: getBrandOrigin(brand),
      description: getCleanDescription(brand.description),
      status: brand.status,
    });
  };

  // Lưu form (Tạo hoặc Sửa)
  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!formData.brand_name.trim()) {
      showError('Vui lòng nhập tên thương hiệu');
      return;
    }

    setSubmitting(true);
    try {
      const formattedDescription = formData.origin.trim()
        ? `[Xuất xứ: ${formData.origin.trim()}] ${formData.description.trim()}`
        : formData.description.trim();

      const payload = {
        brand_name: formData.brand_name.trim(),
        description: formattedDescription,
        status: formData.status,
      };

      if (editingBrand) {
        await brandService.updateBrand(editingBrand.brand_id, payload);
        showSuccess(`Cập nhật thương hiệu "${formData.brand_name}" thành công!`);
        setEditingBrand(null);
      } else {
        await brandService.createBrand(payload);
        showSuccess(`Thêm thương hiệu "${formData.brand_name}" thành công!`);
        setIsCreateOpen(false);
      }
      fetchBrands();
    } catch (err) {
      showError(err.response?.data?.message || 'Lỗi khi lưu dữ liệu thương hiệu');
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa đơn lẻ
  const handleConfirmDelete = async () => {
    if (!deletingBrand) return;
    try {
      await brandService.deleteBrand(deletingBrand.brand_id);
      setSelectedIds((prev) => prev.filter((id) => id !== deletingBrand.brand_id));
      setDeletingBrand(null);
      fetchBrands();
      showSuccess(`Đã xóa thương hiệu "${deletingBrand.brand_name}" thành công`);
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể xóa thương hiệu này');
    }
  };

  // Xóa hàng loạt
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => brandService.deleteBrand(id)));
      showSuccess(`Đã xóa thành công ${selectedIds.length} thương hiệu đã chọn`);
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      fetchBrands();
    } catch (err) {
      showError('Có lỗi xảy ra khi xóa một số thương hiệu liên kết sản phẩm');
      setIsBulkDeleteOpen(false);
      fetchBrands();
    }
  };

  return (
    <div className="bm-layout">
      <style>{brandStyles}</style>

      {/* SIDEBAR BÊN TRÁI */}
      <ManagerSidebar activeMenu="brands" />

      {/* NỘI DUNG CHÍNH */}
      <main className="bm-main-content">
        {/* Header trên cùng */}
        <ManagerHeader showSearch={false} />

        <div className="bm-scroll-body">
          {/* TIÊU ĐỀ TRANG & NÚT THÊM THƯƠNG HIỆU */}
          <div className="bm-header-row">
            <div>
              <h1 className="bm-title-heading">Danh Sách Thương Hiệu</h1>
              <p className="bm-title-sub">
                Kiểm soát danh mục {totalCount} nhà mốt liên kết, chỉ số doanh thu đối tác và chính sách phân phối độc quyền.
              </p>
            </div>

            <button type="button" className="bm-btn-add" onClick={handleOpenCreate}>
              <Plus size={16} strokeWidth={2.5} />
              THÊM THƯƠNG HIỆU MỚI
            </button>
          </div>

          {/* 3 THẺ KPI METRIC CARDS CHUẨN XÁC THEO HÌNH */}
          <div className="bm-metrics-grid">
            {/* Thẻ 1: Tổng thương hiệu hợp tác */}
            <div className="bm-metric-card">
              <div className="bm-metric-head">
                <span className="bm-metric-title">TỔNG THƯƠNG HIỆU HỢP TÁC</span>
                <div className="bm-metric-icon-box">
                  <Award size={18} strokeWidth={2} />
                </div>
              </div>
              <div className="bm-metric-value-row">
                <span className="bm-metric-value-num">{totalCount}</span>
                <span className="bm-metric-value-unit">Nhãn Hàng</span>
              </div>
              <div>
                <div className="bm-metric-subtext">
                  <span style={{ color: '#111111', fontWeight: 700 }}>● {activeCount} đang hiển thị</span>
                  <span style={{ margin: '0 4px', color: '#D1D5DB' }}>•</span>
                  <span>{inactiveCount} đã ẩn</span>
                </div>
                <div className="bm-progress-bar-wrap">
                  <div
                    className="bm-progress-bar-fill"
                    style={{ width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Thẻ 2: Thương hiệu nhiều sản phẩm nhất */}
            <div className="bm-metric-card">
              <div className="bm-metric-head">
                <span className="bm-metric-title">THƯƠNG HIỆU NHIỀU SẢN PHẨM NHẤT</span>
                <div className="bm-metric-icon-box gold">
                  <Star size={18} strokeWidth={2} fill="#D97706" />
                </div>
              </div>
              <div className="bm-metric-value-row">
                <span className="bm-metric-value-num" style={{ fontSize: '26px' }}>
                  {topBrand?.brand_name || 'Chưa có'}
                </span>
              </div>
              <div>
                <div className="bm-metric-subtext" style={{ color: '#4B5563', fontWeight: 600 }}>
                  <TrendingUp size={15} color="#D97706" />
                  <span>Chứa {topBrand?.product_count || 0} sản phẩm liên kết</span>
                </div>
                <div className="bm-progress-accent-line" />
              </div>
            </div>

            {/* Thẻ 3: Sản phẩm phân phối liên kết */}
            <div className="bm-metric-card">
              <div className="bm-metric-head">
                <span className="bm-metric-title">SẢN PHẨM PHÂN PHỐI LIÊN KẾT</span>
                <div className="bm-metric-icon-box">
                  <Tag size={18} strokeWidth={2} />
                </div>
              </div>
              <div className="bm-metric-value-row">
                <span className="bm-metric-value-num">{totalProducts.toLocaleString('vi-VN')}</span>
                <span className="bm-metric-value-unit">Sản Phẩm</span>
              </div>
              <div>
                <div className="bm-metric-subtext">
                  <Banknote size={15} color="#78716C" />
                  <span>AOV trung bình ~2.680.000đ / sản phẩm</span>
                </div>
                <div className="bm-progress-bar-wrap">
                  <div className="bm-progress-bar-fill" style={{ width: '55%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* THANH TAB TRẠNG THÁI & HÀNH ĐỘNG NHANH */}
          <div className="bm-filter-card">
            <div className="bm-tab-row">
              {/* Tab Pills */}
              <div className="bm-tab-group">
                <button
                  type="button"
                  className={`bm-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('ALL');
                    setCurrentPage(1);
                  }}
                >
                  Tất cả ({totalCount < 10 ? '0' + totalCount : totalCount})
                </button>
                <button
                  type="button"
                  className={`bm-tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('ACTIVE');
                    setCurrentPage(1);
                  }}
                >
                  Phát hành ({activeCount < 10 ? '0' + activeCount : activeCount})
                </button>
                <button
                  type="button"
                  className={`bm-tab-btn ${activeTab === 'INACTIVE' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('INACTIVE');
                    setCurrentPage(1);
                  }}
                >
                  Tạm ẩn ({inactiveCount < 10 ? '0' + inactiveCount : inactiveCount})
                </button>
              </div>

              {/* Nhóm nút bên phải */}
              <div className="bm-quick-actions">
                <button
                  type="button"
                  className="bm-btn-pill-outline"
                  onClick={() => {
                    setActiveTab('ALL');
                    setSearchQuery('');
                    setSelectedIds([]);
                    setCurrentPage(1);
                  }}
                  title="Đặt lại bộ lọc và quay lại danh sách đầy đủ"
                >
                  <ArrowLeft size={14} />
                  Quay lại
                </button>

                <span className="bm-selection-count-text">
                  | Đã chọn: <strong style={{ color: '#111111' }}>{selectedIds.length} mục</strong> |
                </span>

                <button
                  type="button"
                  className="bm-btn-pill-delete"
                  disabled={selectedIds.length === 0}
                  onClick={() => setIsBulkDeleteOpen(true)}
                  title="Xóa tất cả các thương hiệu đang được chọn"
                >
                  <Trash2 size={14} />
                  Xóa các mục đã chọn
                </button>
              </div>
            </div>

            {/* Hàng Tìm kiếm & Sắp xếp */}
            <div className="bm-search-sort-row">
              <div className="bm-search-input-box">
                <Search size={16} color="#9CA3AF" />
                <input
                  type="text"
                  className="bm-search-input"
                  placeholder="Tìm kiếm tên thương hiệu, xuất xứ, mô tả..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="bm-sort-group">
                <span className="bm-sort-label">Sắp xếp:</span>
                <select
                  className="bm-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Mới cập nhật nhất</option>
                  <option value="name_asc">Tên (A - Z)</option>
                  <option value="name_desc">Tên (Z - A)</option>
                  <option value="products_desc">Nhiều sản phẩm nhất</option>
                  <option value="products_asc">Ít sản phẩm nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* BẢNG DỮ LIỆU THƯƠNG HIỆU */}
          <div className="bm-table-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="bm-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="bm-custom-checkbox"
                        checked={isAllCurrentSelected}
                        onChange={handleSelectAll}
                        title="Chọn tất cả dòng trên trang này"
                      />
                    </th>
                    <th style={{ width: '30%' }}>THƯƠNG HIỆU</th>
                    <th style={{ width: '25%' }}>XUẤT XỨ</th>
                    <th style={{ width: '18%' }}>SỐ LƯỢNG SẢN PHẨM</th>
                    <th style={{ width: '14%', textAlign: 'center' }}>TRẠNG THÁI</th>
                    <th style={{ width: '13%', textAlign: 'center' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#78716C' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <Loader2 size={26} className="animate-spin" color="#111111" />
                          <span>Đang đồng bộ dữ liệu thương hiệu từ MySQL...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#78716C' }}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>
                          Không tìm thấy thương hiệu nào phù hợp với bộ lọc hiện tại.
                        </p>
                        <p style={{ margin: '6px 0 0 0', fontSize: '13px' }}>
                          Bạn có thể thử tìm kiếm từ khóa khác hoặc nhấn "Thêm Thương Hiệu Mới".
                        </p>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((brand) => {
                      const isChecked = selectedIds.includes(brand.brand_id);
                      const origin = getBrandOrigin(brand);

                      return (
                        <tr key={brand.brand_id} style={{ background: isChecked ? '#FFFDF8' : undefined }}>
                          {/* 1. Hộp kiểm Checkbox */}
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              className="bm-custom-checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectOne(brand.brand_id)}
                            />
                          </td>

                          {/* 2. Tên thương hiệu (Serif thanh lịch Playfair Display) */}
                          <td>
                            <h3 className="bm-brand-name-text">{brand.brand_name}</h3>
                          </td>

                          {/* 3. Xuất xứ */}
                          <td>
                            <span className="bm-origin-text">{origin}</span>
                          </td>

                          {/* 4. Số lượng sản phẩm */}
                          <td>
                            <span className="bm-count-number">{brand.product_count || 0}</span>
                            <span className="bm-count-unit">Mẫu</span>
                          </td>

                          {/* 5. Trạng thái (Hiển thị / Tạm ẩn) */}
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className={`bm-status-pill ${brand.status === 'ACTIVE' ? 'active' : 'inactive'}`}
                              onClick={() => handleToggleStatus(brand)}
                              title="Nhấp để đổi trạng thái Hiển thị / Tạm ẩn"
                            >
                              {brand.status === 'ACTIVE' ? 'Hiển thị' : 'Tạm ẩn'}
                            </button>
                          </td>

                          {/* 6. Thao tác (Sửa, Xóa) */}
                          <td>
                            <div className="bm-actions-group">
                              <button
                                type="button"
                                className="bm-action-icon-btn"
                                title="Chỉnh sửa thông tin thương hiệu"
                                onClick={() => handleOpenEdit(brand)}
                              >
                                <Edit3 size={15} />
                              </button>

                              <button
                                type="button"
                                className="bm-action-icon-btn delete"
                                title="Xóa thương hiệu"
                                onClick={() => setDeletingBrand(brand)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* THANH PHÂN TRANG CHUẨN XÁC */}
            <div className="bm-pagination-bar">
              <span className="bm-pagination-info">
                Hiển thị{' '}
                <strong>
                  {filteredBrands.length === 0 ? 0 : startIndex + 1} -{' '}
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredBrands.length)}
                </strong>{' '}
                trên tổng số <strong>{filteredBrands.length}</strong> thương hiệu
              </span>

              <div className="bm-pagination-controls">
                <button
                  type="button"
                  className="bm-page-nav-btn"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  TRƯỚC
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                  if (
                    totalPages > 7 &&
                    num > 3 &&
                    num < totalPages - 1 &&
                    Math.abs(num - validCurrentPage) > 1
                  ) {
                    if (num === 4) return <span key={num} style={{ padding: '0 4px', color: '#9CA3AF' }}>...</span>;
                    return null;
                  }

                  return (
                    <button
                      key={num}
                      type="button"
                      className={`bm-page-num-btn ${validCurrentPage === num ? 'active' : ''}`}
                      onClick={() => setCurrentPage(num)}
                    >
                      {num}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="bm-page-nav-btn"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  SAU
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL 1: THÊM MỚI / CHỈNH SỬA THƯƠNG HIỆU */}
      {(isCreateOpen || editingBrand) && (
        <div
          className="bm-modal-overlay"
          onClick={() => {
            setIsCreateOpen(false);
            setEditingBrand(null);
          }}
        >
          <div className="bm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="bm-modal-head">
              <h2 className="bm-modal-title">
                {editingBrand ? 'Chỉnh Sửa Thương Hiệu' : 'Thêm Thương Hiệu Mới'}
              </h2>
              <button
                type="button"
                className="bm-modal-btn-close"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingBrand(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBrand}>
              <div className="bm-modal-body">
                <div className="bm-form-group">
                  <label className="bm-form-label">Tên Thương Hiệu *</label>
                  <input
                    type="text"
                    className="bm-form-input"
                    placeholder="VD: Maison Margiela, Chanel, Saint Laurent..."
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    required
                  />
                </div>

                <div className="bm-form-group">
                  <label className="bm-form-label">Xuất Xứ (Quốc Gia / Thành Phố)</label>
                  <input
                    type="text"
                    className="bm-form-input"
                    placeholder="VD: Pháp (Paris), Ý (Milan), Mỹ (New York)..."
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  />
                </div>

                <div className="bm-form-group">
                  <label className="bm-form-label">Mô Tả Thương Hiệu</label>
                  <textarea
                    className="bm-form-textarea"
                    rows={3}
                    placeholder="Giới thiệu phong cách thiết kế, định vị thời trang..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="bm-form-group">
                  <label className="bm-form-label">Trạng Thái Hiển Thị</label>
                  <select
                    className="bm-form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Hiển thị (Phát hành công khai)</option>
                    <option value="INACTIVE">Tạm ẩn (Ẩn khỏi trang khách hàng)</option>
                  </select>
                </div>
              </div>

              <div className="bm-modal-footer">
                <button
                  type="button"
                  className="bm-btn-modal-cancel"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingBrand(null);
                  }}
                >
                  Hủy Bỏ
                </button>
                <button type="submit" className="bm-btn-modal-submit" disabled={submitting}>
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {editingBrand ? 'Lưu Thay Đổi' : 'Tạo Thương Hiệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: XÁC NHẬN XÓA 1 THƯƠNG HIỆU */}
      {deletingBrand && (
        <div className="bm-modal-overlay" onClick={() => setDeletingBrand(null)}>
          <div className="bm-modal-card" style={{ maxWidth: '420px', textAlign: 'center', padding: '28px 24px' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertCircle size={26} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#111' }}>
              Xóa Thương Hiệu?
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px', lineHeight: 1.5 }}>
              Bạn có chắc muốn xóa thương hiệu <strong>"{deletingBrand.brand_name}"</strong>?
              {deletingBrand.product_count > 0 && (
                <span style={{ display: 'block', color: '#DC2626', fontWeight: 600, marginTop: '8px' }}>
                  ⚠️ Thương hiệu này đang liên kết với {deletingBrand.product_count} sản phẩm trong cửa hàng!
                </span>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                className="bm-btn-modal-cancel"
                onClick={() => setDeletingBrand(null)}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                className="bm-btn-modal-submit"
                style={{ background: '#DC2626' }}
                onClick={handleConfirmDelete}
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN XÓA HÀNG LOẠT */}
      {isBulkDeleteOpen && (
        <div className="bm-modal-overlay" onClick={() => setIsBulkDeleteOpen(false)}>
          <div className="bm-modal-card" style={{ maxWidth: '420px', textAlign: 'center', padding: '28px 24px' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#111' }}>
              Xóa Hàng Loạt?
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa <strong>{selectedIds.length}</strong> thương hiệu đã chọn khỏi cơ sở dữ liệu? Hành động này không thể hoàn tác.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                className="bm-btn-modal-cancel"
                onClick={() => setIsBulkDeleteOpen(false)}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                className="bm-btn-modal-submit"
                style={{ background: '#DC2626' }}
                onClick={handleConfirmBulkDelete}
              >
                Xóa {selectedIds.length} Mục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

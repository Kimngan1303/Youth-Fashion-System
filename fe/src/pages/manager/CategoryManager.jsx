import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { categoryService } from "../../services/categoryService";
import ManagerSidebar from "../../components/ManagerSidebar";
import ManagerHeader from "../../components/ManagerHeader";
import {
  Folder,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronDown,
  Search,
  Check,
  X,
  Package,
} from "lucide-react";

const categoryManagerStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400&display=swap');

  .manager-layout {
    display: flex;
    flex-direction: row;
    align-items: stretch;
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
    flex-wrap: wrap;
    gap: 16px;
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
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #18181B;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: background 0.15s ease;
  }

  .btn-add-product:hover {
    background: #27272A;
  }

  /* KPI Cards Grid */
  .kpi-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
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
    font-size: 26px;
    line-height: 32px;
    color: #111111;
    margin: 8px 0 2px 0;
  }

  .kpi-subtext {
    font-size: 12.5px;
    color: #78716C;
  }

  /* --- BỘ LỌC TRẠNG THÁI VÀ BULK ACTION --- */
  .product-table-card {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    overflow: hidden;
    width: 100%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    box-sizing: border-box;
  }

  .card-top-filters-wrapper {
    padding: 20px 20px 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #FFFFFF;
    border-bottom: 1px solid #F3F4F6;
  }

  .status-tabs-bulk-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 16px;
    flex-wrap: wrap;
  }

  .status-tabs-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .status-tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #4B5563;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .status-tab-btn:hover:not(.active) {
    background: #F3F4F6;
    color: #111827;
  }

  .status-tab-btn.active {
    background: #18181B;
    color: #FFFFFF;
    font-weight: 600;
  }

  .status-tab-btn.active .tab-count {
    color: rgba(255, 255, 255, 0.75) !important;
  }

  .tab-count {
    font-size: 12.5px;
  }

  .tab-count-green { color: #16A34A; font-weight: 600; }
  .tab-count-red { color: #EF4444; font-weight: 600; }
  .tab-count-gray { color: #6B7280; font-weight: 500; }

  .bulk-actions-group {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .selected-count-label {
    font-size: 13px;
    color: #6B7280;
  }

  .selected-count-label strong {
    color: #111827;
  }

  .btn-bulk-delete {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    background: #FEF2F2;
    border: 1px solid #FECACA;
    color: #DC2626;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-bulk-delete:hover:not(:disabled) {
    background: #FEE2E2;
  }

  .btn-bulk-delete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* --- THANH TÌM KIẾM VÀ SẮP XẾP --- */
  .table-controls-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 16px;
    flex-wrap: wrap;
  }

  .left-filter-group {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .search-filter-box {
    display: flex;
    align-items: center;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 8px 14px;
    width: 290px;
    gap: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  }

  .search-filter-box input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    width: 100%;
    color: #111827;
  }

  .right-sort-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sort-label {
    font-size: 13px;
    color: #6B7280;
  }

  .sort-select {
    padding: 8px 14px;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #111827;
    outline: none;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  }

  /* --- BẢNG DỮ LIỆU --- */
  .product-data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
  }

  .product-data-table th {
    background: #FAFAFA;
    padding: 12px 16px;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #6B7280;
    border-bottom: 1px solid #E5E7EB;
  }

  .product-data-table td {
    padding: 16px;
    vertical-align: middle;
    border-bottom: 1px solid #F3F4F6;
    color: #374151;
  }

  .product-data-table tbody tr:hover {
    background: #F9FAFB;
  }

  .custom-checkbox {
    width: 16px;
    height: 16px;
    accent-color: #18181B;
    cursor: pointer;
    border-radius: 4px;
  }

  .cat-info-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .cat-icon-avatar {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #F4F4F5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3F3F46;
    flex-shrink: 0;
    border: 1px solid #E4E4E7;
  }

  .cat-name-text {
    font-weight: 600;
    color: #18181B;
    font-size: 13.5px;
    margin-bottom: 2px;
  }

  .cat-id-badge {
    font-size: 11px;
    color: #71717A;
    background: #F4F4F5;
    padding: 2px 6px;
    border-radius: 4px;
    display: inline-block;
  }

  .cat-desc-text {
    font-size: 12.5px;
    color: #6B7280;
    max-width: 320px;
    line-height: 18px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .product-count-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    background: #EFF6FF;
    border: 1px solid #DBEAFE;
    color: #1D4ED8;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
  }

  /* Popover Pill Trạng Thái */
  .status-cell-wrapper {
    position: relative;
    display: inline-flex;
    justify-content: center;
  }

  .status-interactive-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid transparent;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s ease;
  }

  .status-interactive-pill:hover {
    filter: brightness(0.96);
  }

  .status-pill-active {
    background: #DCFCE7;
    color: #15803D;
    border-color: #BBF7D0;
  }

  .status-pill-inactive {
    background: #FEE2E2;
    color: #DC2626;
    border-color: #FECACA;
  }

  .status-dot-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .dot-active { background: #16A34A; }
  .dot-inactive { background: #DC2626; }

  .status-menu-popover {
    position: absolute;
    top: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
    z-index: 1000;
    min-width: 145px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .status-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s ease;
  }

  .status-menu-item:hover {
    background: #F3F4F6;
    color: #111827;
  }

  .status-menu-item.active {
    font-weight: 600;
    color: #111827;
    background: #F3F4F6;
  }

  .action-buttons-cell {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  .btn-action-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    color: #4B5563;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-action-icon:hover {
    background: #F9FAFB;
    color: #111827;
    border-color: #D1D5DB;
  }

  .btn-action-icon.danger:hover {
    background: #FEF2F2;
    color: #DC2626;
    border-color: #FECACA;
  }

  /* Phân trang */
  .pagination-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #FFFFFF;
    border-top: 1px solid #E5E7EB;
  }

  .pagination-info {
    font-size: 13px;
    color: #6B7280;
  }

  .pagination-nav-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-page-nav {
    padding: 6px 12px;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
  }

  .btn-page-nav:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-page-num {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    font-size: 12.5px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
  }

  .btn-page-num.active {
    background: #18181B;
    color: #FFFFFF;
    border-color: #18181B;
  }

  /* Modal Form & Confirm */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    backdrop-filter: blur(2px);
  }

  .modal-container-card {
    background: #FFFFFF;
    border-radius: 14px;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
    width: 520px;
    max-width: 100%;
    overflow: hidden;
    animation: modalScaleUp 0.18s ease-out;
  }

  @keyframes modalScaleUp {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }

  .modal-header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #F3F4F6;
  }

  .modal-header-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .btn-modal-close {
    background: transparent;
    border: none;
    color: #9CA3AF;
    cursor: pointer;
    display: flex;
    padding: 4px;
    border-radius: 6px;
  }

  .btn-modal-close:hover {
    background: #F3F4F6;
    color: #374151;
  }

  .modal-body-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .form-group-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-field-label {
    font-size: 12.5px;
    font-weight: 600;
    color: #374151;
  }

  .form-field-input {
    padding: 9px 12px;
    border: 1px solid #D1D5DB;
    border-radius: 8px;
    font-size: 13.5px;
    color: #111827;
    outline: none;
    transition: border-color 0.15s;
  }

  .form-field-input:focus {
    border-color: #18181B;
    box-shadow: 0 0 0 1px #18181B;
  }

  .form-field-textarea {
    padding: 9px 12px;
    border: 1px solid #D1D5DB;
    border-radius: 8px;
    font-size: 13px;
    color: #111827;
    outline: none;
    min-height: 85px;
    resize: vertical;
    font-family: inherit;
  }

  .form-field-textarea:focus {
    border-color: #18181B;
    box-shadow: 0 0 0 1px #18181B;
  }

  .status-toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 4px;
  }

  .toggle-switch-btn {
    position: relative;
    width: 44px;
    height: 24px;
    background: #E5E7EB;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
  }

  .toggle-switch-btn.active {
    background: #16A34A;
  }

  .toggle-switch-handle {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: #FFFFFF;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch-btn.active .toggle-switch-handle {
    transform: translateX(20px);
  }

  .toggle-status-label {
    font-size: 13px;
    font-weight: 600;
  }

  .modal-footer-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #F3F4F6;
    background: #FAFAFA;
  }

  .btn-modal-cancel {
    padding: 9px 18px;
    background: #FFFFFF;
    border: 1px solid #D1D5DB;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
  }

  .btn-modal-submit {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 20px;
    background: #18181B;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-modal-submit:hover:not(:disabled) {
    background: #27272A;
  }

  .btn-modal-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Confirm Delete Dialog */
  .confirm-dialog-card {
    background: #FFFFFF;
    border-radius: 14px;
    width: 420px;
    max-width: 100%;
    padding: 24px;
    text-align: center;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
  }

  .confirm-warning-icon {
    width: 48px;
    height: 48px;
    background: #FEF2F2;
    border-radius: 50%;
    color: #DC2626;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  .confirm-title {
    font-size: 17px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }

  .confirm-subtext {
    font-size: 13.5px;
    color: #4B5563;
    line-height: 20px;
    margin-bottom: 24px;
  }

  .confirm-actions-row {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .btn-confirm-delete {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 20px;
    background: #DC2626;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-confirm-delete:hover:not(:disabled) {
    background: #B91C1C;
  }
`;

export default function CategoryManager() {
  const { showSuccess, showError, showInfo } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Tabs: ALL, ACTIVE, INACTIVE
  const [selectedTab, setSelectedTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Selection for bulk actions
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  // Popover menu for quick status change
  const [activeStatusMenuId, setActiveStatusMenuId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_name: "",
    description: "",
    status: "ACTIVE",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm Modal
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Delete Confirm Modal
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Click outside to close status popover
  useEffect(() => {
    const handleClickOutside = () => setActiveStatusMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Fetch categories from MySQL Backend API
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await categoryService.getCategories();
      if (res?.status && res?.data) {
        setCategories(res.data);
      } else if (Array.isArray(res)) {
        setCategories(res);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh mục từ MySQL:", err);
      setErrorMsg(
        err.response?.data?.message || "Không thể tải danh sách danh mục từ CSDL MySQL",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    const all = categories.length;
    const active = categories.filter((c) => c.status === "ACTIVE").length;
    const inactive = categories.filter((c) => c.status === "INACTIVE").length;
    return { all, active, inactive };
  }, [categories]);

  // KPI Computations
  const totalProductsInCat = useMemo(() => {
    return categories.reduce((sum, c) => sum + (Number(c.product_count) || 0), 0);
  }, [categories]);

  // Filtered & Sorted Categories
  const filteredCategories = useMemo(() => {
    let list = [...categories];

    // Filter by Tab
    if (selectedTab === "ACTIVE") {
      list = list.filter((c) => c.status === "ACTIVE");
    } else if (selectedTab === "INACTIVE") {
      list = list.filter((c) => c.status === "INACTIVE");
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.category_name?.toLowerCase().includes(q) ||
          c.category_id?.toString().includes(q) ||
          c.description?.toLowerCase().includes(q),
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "name_asc") {
        return a.category_name.localeCompare(b.category_name);
      }
      if (sortBy === "name_desc") {
        return b.category_name.localeCompare(a.category_name);
      }
      if (sortBy === "products_desc") {
        return (b.product_count || 0) - (a.product_count || 0);
      }
      if (sortBy === "products_asc") {
        return (a.product_count || 0) - (b.product_count || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      // default newest
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return list;
  }, [categories, selectedTab, searchTerm, sortBy]);

  // Paginated List
  const totalPages = Math.ceil(filteredCategories.length / pageSize) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, page, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
    setSelectedCategoryIds([]);
  }, [selectedTab, searchTerm, sortBy]);

  // Checkbox handlers
  const isAllCurrentPageSelected =
    paginatedCategories.length > 0 &&
    paginatedCategories.every((c) => selectedCategoryIds.includes(c.category_id));

  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedCategories.map((c) => c.category_id));
      setSelectedCategoryIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newIds = new Set([
        ...selectedCategoryIds,
        ...paginatedCategories.map((c) => c.category_id),
      ]);
      setSelectedCategoryIds(Array.from(newIds));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Quick Change Status
  const handleQuickChangeStatus = async (cat, newStatus) => {
    setActiveStatusMenuId(null);
    if (cat.status === newStatus) return;

    try {
      await categoryService.updateCategory(cat.category_id, {
        ...cat,
        status: newStatus,
      });
      showSuccess(
        `Đã chuyển danh mục "${cat.category_name}" sang trạng thái ${newStatus === "ACTIVE" ? "Đang hiển thị" : "Tạm ngưng"}`,
      );
      fetchCategories();
    } catch (err) {
      showError(err.response?.data?.message || "Không thể cập nhật trạng thái");
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      category_name: "",
      description: "",
      status: "ACTIVE",
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      category_name: cat.category_name || "",
      description: cat.description || "",
      status: cat.status || "ACTIVE",
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  // Submit Modal Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.category_name.trim()) {
      showError("Vui lòng nhập tên danh mục!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        await categoryService.createCategory(formData);
        showSuccess("Tạo mới danh mục thành công!");
      } else {
        await categoryService.updateCategory(editingCategory.category_id, formData);
        showSuccess(`Cập nhật danh mục "${formData.category_name}" thành công!`);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.message || "Có lỗi xảy ra khi lưu danh mục";
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Single Category
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(categoryToDelete.category_id);
      showSuccess(`Đã xóa danh mục "${categoryToDelete.category_name}" thành công!`);
      setCategoryToDelete(null);
      setSelectedCategoryIds((prev) =>
        prev.filter((id) => id !== categoryToDelete.category_id),
      );
      fetchCategories();
    } catch (err) {
      showError(err.response?.data?.message || "Không thể xóa danh mục này");
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Delete Selected Categories
  const handleConfirmBulkDelete = async () => {
    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedCategoryIds) {
      const cat = categories.find((c) => String(c.category_id) === String(id));
      if (cat && cat.product_count > 0) {
        failCount++;
        continue;
      }
      try {
        await categoryService.deleteCategory(id);
        successCount++;
      } catch (e) {
        failCount++;
      }
    }

    setIsDeleting(false);
    setIsBulkDeleteModalOpen(false);
    setSelectedCategoryIds([]);
    fetchCategories();

    if (successCount > 0) {
      showSuccess(`Đã xóa thành công ${successCount} danh mục.`);
    }
    if (failCount > 0) {
      showError(
        `${failCount} danh mục không thể xóa do còn chứa sản phẩm liên kết.`,
      );
    }
  };

  return (
    <div className="manager-layout">
      <style>{categoryManagerStyles}</style>

      {/* LEFT SIDEBAR */}
      <ManagerSidebar activeMenu="categories" />

      {/* MAIN CONTENT AREA */}
      <main className="main-content-area">
        {/* Header Bar */}
        <ManagerHeader showSearch={false} />

        {/* Scroll Body */}
        <div className="dashboard-scroll-body">
          {/* Header Row */}
          <div className="dashboard-header-row">
            <div>
              <p className="dashboard-header-sub">
                YOUTHFASHION • QUẢN LÝ DANH MỤC SẢN PHẨM
              </p>
              <h1 className="dashboard-header-title">Quản Lý Danh Mục</h1>
            </div>

            <button
              type="button"
              className="btn-add-product"
              onClick={handleOpenCreateModal}
            >
              <Plus size={16} />
              Thêm Danh Mục Mới
            </button>
          </div>

          {/* 4 Stat Cards */}
          <div className="kpi-cards-grid">
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">TỔNG DANH MỤC DB</span>
                <div className="kpi-icon-badge">📂</div>
              </div>
              <div className="kpi-value">{statusCounts.all}</div>
              <div className="kpi-subtext">Được tải trực tiếp từ MySQL</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">ĐANG HIỂN THỊ</span>
                <div className="kpi-icon-badge">✅</div>
              </div>
              <div className="kpi-value" style={{ color: "#15803D" }}>
                {statusCounts.active}
              </div>
              <div className="kpi-subtext">Sẵn sàng phân loại sản phẩm</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">TẠM NGƯNG / ĐÃ ẨN</span>
                <div className="kpi-icon-badge">⏸️</div>
              </div>
              <div className="kpi-value" style={{ color: "#DC2626" }}>
                {statusCounts.inactive}
              </div>
              <div className="kpi-subtext">Đang tạm ẩn trên giao diện khách</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">TỔNG SẢN PHẨM PHÂN BỔ</span>
                <div className="kpi-icon-badge">📦</div>
              </div>
              <div className="kpi-value">{totalProductsInCat}</div>
              <div className="kpi-subtext">Sản phẩm liên kết trực tiếp</div>
            </div>
          </div>

          {/* Main Table Card (Bọc toàn bộ tabs, bộ lọc và bảng) */}
          <div className="product-table-card">
            <div className="card-top-filters-wrapper">
              {/* Status Tabs & Bulk Action Row */}
              <div className="status-tabs-bulk-row">
                <div className="status-tabs-group">
                  <button
                    type="button"
                    className={`status-tab-btn ${selectedTab === "ALL" ? "active" : ""}`}
                    onClick={() => setSelectedTab("ALL")}
                  >
                    <span>Tất cả</span>
                    <span className="tab-count tab-count-gray">
                      ({statusCounts.all})
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`status-tab-btn ${selectedTab === "ACTIVE" ? "active" : ""}`}
                    onClick={() => setSelectedTab("ACTIVE")}
                  >
                    <span>Đang hiển thị</span>
                    <span className="tab-count tab-count-green">
                      ({statusCounts.active})
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`status-tab-btn ${selectedTab === "INACTIVE" ? "active" : ""}`}
                    onClick={() => setSelectedTab("INACTIVE")}
                  >
                    <span>Tạm ngưng / Đã ẩn</span>
                    <span className="tab-count tab-count-red">
                      ({statusCounts.inactive})
                    </span>
                  </button>
                </div>

                <div className="bulk-actions-group">
                  <span className="selected-count-label">
                    Đã chọn: <strong>{selectedCategoryIds.length}</strong> mục
                  </span>
                  <button
                    type="button"
                    className="btn-bulk-delete"
                    disabled={selectedCategoryIds.length === 0}
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                  >
                    <Trash2 size={14} />
                    <span>Xóa các mục đã chọn</span>
                  </button>
                </div>
              </div>

              {/* Search & Sort Controls */}
              <div className="table-controls-bar">
                <div className="left-filter-group">
                  <div className="search-filter-box">
                    <Search size={15} color="#9CA3AF" />
                    <input
                      placeholder="Lọc theo tên danh mục hoặc ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#9CA3AF",
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="right-sort-group">
                  <span className="sort-label">Sắp xếp:</span>
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Mới nhất (Ngày tạo)</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="name_asc">Tên: A - Z</option>
                    <option value="name_desc">Tên: Z - A</option>
                    <option value="products_desc">Nhiều sản phẩm nhất</option>
                    <option value="products_asc">Ít sản phẩm nhất</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#78716C" }}>
                <Loader2
                  size={26}
                  style={{ animation: "spin 1s linear infinite", display: "inline-block" }}
                />
                <p style={{ marginTop: "10px", fontSize: "13.5px" }}>
                  Đang kết nối CSDL MySQL và tải danh mục...
                </p>
              </div>
            ) : errorMsg ? (
              <div style={{ padding: "36px", textAlign: "center", color: "#DC2626" }}>
                <AlertCircle size={28} style={{ display: "inline-block" }} />
                <p style={{ marginTop: "10px", fontSize: "13.5px" }}>{errorMsg}</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#78716C" }}>
                <Folder size={32} style={{ display: "inline-block", color: "#D1D5DB" }} />
                <p style={{ marginTop: "12px", fontSize: "14px", fontWeight: 500 }}>
                  Không tìm thấy danh mục nào phù hợp với bộ lọc.
                </p>
              </div>
            ) : (
              <>
                <table className="product-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "48px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          className="custom-checkbox"
                          checked={isAllCurrentPageSelected}
                          onChange={handleToggleSelectAll}
                        />
                      </th>
                      <th>DANH MỤC</th>
                      <th>MÔ TẢ DANH MỤC</th>
                      <th style={{ textAlign: "center" }}>SỐ SẢN PHẨM LIÊN KẾT</th>
                      <th style={{ textAlign: "center" }}>TRẠNG THÁI</th>
                      <th style={{ textAlign: "right", paddingRight: "24px" }}>
                        THAO TÁC
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategories.map((c) => {
                      const isSelected = selectedCategoryIds.includes(c.category_id);
                      const isActive = c.status === "ACTIVE";

                      return (
                        <tr key={c.category_id}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              className="custom-checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(c.category_id)}
                            />
                          </td>

                          {/* Danh mục */}
                          <td>
                            <div className="cat-info-cell">
                              <div className="cat-icon-avatar">
                                <Folder size={18} />
                              </div>
                              <div>
                                <div className="cat-name-text">{c.category_name}</div>
                                <span className="cat-id-badge">#{c.category_id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Mô tả */}
                          <td>
                            <div className="cat-desc-text">
                              {c.description || (
                                <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>
                                  Chưa có mô tả
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Số sản phẩm */}
                          <td style={{ textAlign: "center" }}>
                            <span className="product-count-pill">
                              <Package size={12} />
                              {c.product_count || 0} sản phẩm
                            </span>
                          </td>

                          {/* Trạng thái Popover */}
                          <td style={{ textAlign: "center" }}>
                            <div className="status-cell-wrapper">
                              <button
                                type="button"
                                className={`status-interactive-pill ${isActive ? "status-pill-active" : "status-pill-inactive"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveStatusMenuId(
                                    activeStatusMenuId === c.category_id
                                      ? null
                                      : c.category_id,
                                  );
                                }}
                              >
                                <span
                                  className={`status-dot-indicator ${isActive ? "dot-active" : "dot-inactive"}`}
                                />
                                <span>{isActive ? "Đang hiển thị" : "Tạm ngưng"}</span>
                                <ChevronDown size={11} style={{ opacity: 0.7 }} />
                              </button>

                              {activeStatusMenuId === c.category_id && (
                                <div
                                  className="status-menu-popover"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className={`status-menu-item ${isActive ? "active" : ""}`}
                                    onClick={() => handleQuickChangeStatus(c, "ACTIVE")}
                                  >
                                    <span className="status-dot-indicator dot-active" />
                                    <span>Đang hiển thị</span>
                                    {isActive && <Check size={12} style={{ marginLeft: "auto" }} />}
                                  </button>

                                  <button
                                    type="button"
                                    className={`status-menu-item ${!isActive ? "active" : ""}`}
                                    onClick={() => handleQuickChangeStatus(c, "INACTIVE")}
                                  >
                                    <span className="status-dot-indicator dot-inactive" />
                                    <span>Tạm ngưng</span>
                                    {!isActive && <Check size={12} style={{ marginLeft: "auto" }} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Thao tác */}
                          <td style={{ textAlign: "right", paddingRight: "24px" }}>
                            <div className="action-buttons-cell">
                              <button
                                type="button"
                                className="btn-action-icon"
                                title="Chỉnh sửa danh mục"
                                onClick={() => handleOpenEditModal(c)}
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                type="button"
                                className="btn-action-icon danger"
                                title="Xóa danh mục"
                                onClick={() => setCategoryToDelete(c)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="pagination-container">
                  <div className="pagination-info">
                    Hiển thị{" "}
                    <strong>
                      {Math.min(
                        (page - 1) * pageSize + 1,
                        filteredCategories.length,
                      )}
                    </strong>{" "}
                    -{" "}
                    <strong>
                      {Math.min(page * pageSize, filteredCategories.length)}
                    </strong>{" "}
                    trong tổng số <strong>{filteredCategories.length}</strong> danh mục
                  </div>

                  <div className="pagination-nav-group">
                    <button
                      type="button"
                      className="btn-page-nav"
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                      &lt; Trang trước
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`btn-page-num ${page === p ? "active" : ""}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="btn-page-nav"
                      disabled={page >= totalPages}
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                      Trang sau &gt;
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-container-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-bar">
              <h3 className="modal-header-title">
                {modalMode === "create"
                  ? "Thêm Danh Mục Sản Phẩm Mới"
                  : `Chỉnh Sửa Danh Mục: ${editingCategory?.category_name}`}
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="modal-body-content">
                <div className="form-group-field">
                  <label className="form-field-label">
                    Tên Danh Mục <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-field-input"
                    placeholder="Ví dụ: Áo Sơ Mi Nam Nữ, Quần Âu, Đầm Dạ Hội..."
                    value={formData.category_name}
                    onChange={(e) =>
                      setFormData({ ...formData, category_name: e.target.value })
                    }
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group-field">
                  <label className="form-field-label">Mô Tả Danh Mục</label>
                  <textarea
                    className="form-field-textarea"
                    placeholder="Mô tả phong cách, chất liệu hoặc đặc trưng của dòng sản phẩm này..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="form-group-field">
                  <label className="form-field-label">Trạng Thái Hiển Thị</label>
                  <div className="status-toggle-wrapper">
                    <button
                      type="button"
                      className={`toggle-switch-btn ${formData.status === "ACTIVE" ? "active" : ""}`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          status:
                            formData.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                        })
                      }
                    >
                      <div className="toggle-switch-handle" />
                    </button>
                    <span
                      className="toggle-status-label"
                      style={{
                        color: formData.status === "ACTIVE" ? "#15803D" : "#DC2626",
                      }}
                    >
                      {formData.status === "ACTIVE"
                        ? "Đang kích hoạt (Hiển thị cho khách)"
                        : "Tạm ngưng (Đang ẩn)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer-bar">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      {modalMode === "create" ? "Tạo Danh Mục" : "Lưu Thay Đổi"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE SINGLE MODAL */}
      {categoryToDelete && (
        <div className="modal-overlay" onClick={() => setCategoryToDelete(null)}>
          <div
            className="confirm-dialog-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-warning-icon">
              <AlertCircle size={26} />
            </div>
            <h3 className="confirm-title">Xác Nhận Xóa Danh Mục</h3>
            <p className="confirm-subtext">
              Bạn có chắc chắn muốn xóa danh mục{" "}
              <strong>"{categoryToDelete.category_name}"</strong> khỏi hệ thống?
              {categoryToDelete.product_count > 0 && (
                <span
                  style={{
                    display: "block",
                    color: "#DC2626",
                    fontWeight: 600,
                    marginTop: "6px",
                  }}
                >
                  ⚠️ Danh mục này hiện đang có {categoryToDelete.product_count} sản
                  phẩm liên kết. Bạn cần chuyển hoặc xóa các sản phẩm trước khi xóa
                  danh mục!
                </span>
              )}
            </p>
            <div className="confirm-actions-row">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-confirm-delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting || categoryToDelete.product_count > 0}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Xác Nhận Xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BULK DELETE MODAL */}
      {isBulkDeleteModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsBulkDeleteModalOpen(false)}
        >
          <div
            className="confirm-dialog-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-warning-icon">
              <Trash2 size={26} />
            </div>
            <h3 className="confirm-title">Xóa Hàng Loạt Danh Mục</h3>
            <p className="confirm-subtext">
              Bạn đã chọn <strong>{selectedCategoryIds.length}</strong> danh mục để
              xóa. Những danh mục đang có sản phẩm liên kết sẽ tự động được giữ
              lại để bảo đảm an toàn dữ liệu.
            </p>
            <div className="confirm-actions-row">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-confirm-delete"
                onClick={handleConfirmBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Xác Nhận Xóa Hàng Loạt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

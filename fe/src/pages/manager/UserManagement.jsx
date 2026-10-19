import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';
import {
  Award,
  Star,
  UserPlus,
  Shield,
  Search,
  Download,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  Loader2,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const userStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&display=swap');

  .um-layout {
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

  .um-main-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 100vh;
    box-sizing: border-box;
    background: #F7F6F3;
  }

  .um-scroll-body {
    display: flex;
    flex-direction: column;
    padding: 32px 36px 60px;
    gap: 24px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Header Section */
  .um-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
  }

  .um-title-heading {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px;
    font-weight: 700;
    color: #111111;
    margin: 0;
    line-height: 1.2;
    letter-spacing: -0.3px;
  }

  .um-title-sub {
    font-size: 13px;
    color: #78716C;
    margin: 6px 0 0 0;
    font-weight: 400;
  }

  .um-head-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .um-btn-pill-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 9999px;
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    color: #374151;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .um-btn-pill-action:hover {
    background: #F9FAFB;
    border-color: #D1D5DB;
  }

  /* 4 Metric Cards Grid */
  .um-metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    width: 100%;
  }

  .um-metric-card {
    background: #FFFFFF;
    border: 1px solid #EDE8DE;
    border-radius: 12px;
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    box-sizing: border-box;
  }

  .um-metric-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .um-metric-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #78716C;
    margin: 0;
  }

  .um-metric-icon-box {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F5F4EF;
    color: #111111;
  }

  .um-metric-icon-box.gold {
    background: #FEF3C7;
    color: #D97706;
  }

  .um-metric-icon-box.green {
    background: #DCFCE7;
    color: #16A34A;
  }

  .um-metric-icon-box.purple {
    background: #F3E8FF;
    color: #7C3AED;
  }

  .um-metric-value-row {
    margin: 14px 0 8px;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .um-metric-value-num {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px;
    font-weight: 700;
    color: #111111;
    line-height: 1;
  }

  .um-metric-value-unit {
    font-size: 13px;
    font-weight: 500;
    color: #78716C;
  }

  .um-metric-subtext {
    font-size: 11.5px;
    color: #78716C;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .um-progress-bar-wrap {
    height: 4px;
    background: #EAE7DF;
    border-radius: 999px;
    overflow: hidden;
    margin-top: 12px;
    width: 100%;
  }

  .um-progress-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  /* Filter Section Card */
  .um-filter-card {
    background: #FFFFFF;
    border: 1px solid #EDE8DE;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .um-tab-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .um-tab-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .um-tab-btn {
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
    color: #6B7280;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .um-tab-btn:hover {
    background: #F3F4F6;
    color: #111111;
  }

  .um-tab-btn.active {
    background: #111111;
    color: #FFFFFF;
    font-weight: 600;
  }

  .um-quick-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .um-selection-count-text {
    font-size: 12px;
    color: #78716C;
  }

  .um-btn-pill-delete {
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

  .um-btn-pill-delete:hover:not(:disabled) {
    background: #FEE2E2;
  }

  .um-btn-pill-delete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Search & Dropdowns Row */
  .um-search-filter-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .um-search-box {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 8px 14px;
    flex: 1;
    min-width: 280px;
  }

  .um-search-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    color: #111111;
    width: 100%;
    font-family: 'Inter', sans-serif;
  }

  .um-select-filter {
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12.5px;
    color: #374151;
    font-weight: 500;
    outline: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
  }

  /* Table Card */
  .um-table-card {
    background: #FFFFFF;
    border: 1px solid #EDE8DE;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .um-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .um-table th {
    background: #F8F7F4;
    padding: 14px 18px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #78716C;
    border-bottom: 1px solid #EDE8DE;
  }

  .um-table td {
    padding: 16px 18px;
    border-bottom: 1px solid #F0EEE9;
    vertical-align: middle;
    font-size: 13px;
    color: #1C1917;
    background: #FFFFFF;
  }

  .um-table tr:hover td {
    background: #FAF9F6;
  }

  .um-checkbox {
    width: 16px;
    height: 16px;
    accent-color: #111111;
    cursor: pointer;
  }

  /* User Info Cell */
  .um-user-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .um-avatar-badge {
    width: 38px;
    height: 38px;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .um-name-bold {
    font-size: 14px;
    font-weight: 700;
    color: #111111;
    margin: 0;
  }

  .um-contact-sub {
    font-size: 12px;
    color: #78716C;
    margin-top: 2px;
  }

  /* Role Badges */
  .um-role-badge {
    display: inline-flex;
    flex-direction: column;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11.5px;
    font-weight: 600;
    line-height: 1.3;
  }

  .um-role-badge.diamond {
    background: #FEF3C7;
    color: #B45309;
    border: 1px solid #FDE68A;
  }

  .um-role-badge.gold {
    background: #FFFBEB;
    color: #D97706;
    border: 1px solid #FEF3C7;
  }

  .um-role-badge.customer {
    background: #EFF6FF;
    color: #2563EB;
  }

  .um-role-badge.new {
    background: #F3F4F6;
    color: #4B5563;
  }

  .um-role-badge.manager {
    background: #FAF5FF;
    color: #9333EA;
  }

  .um-role-badge.admin {
    background: #111111;
    color: #FFFFFF;
  }

  /* Status Pill */
  .um-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    cursor: pointer;
  }

  .um-status-pill.active {
    background: #ECFDF5;
    color: #059669;
  }

  .um-status-pill.locked {
    background: #FEE2E2;
    color: #DC2626;
  }

  /* Actions */
  .um-actions-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .um-action-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #4B5563;
    padding: 4px;
    transition: color 0.15s ease, transform 0.1s ease;
  }

  .um-action-btn:hover {
    color: #111111;
    transform: scale(1.1);
  }

  .um-action-btn.danger {
    color: #EF4444;
  }

  .um-action-btn.danger:hover {
    color: #B91C1C;
  }

  /* Pagination Bar */
  .um-pagination-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #FFFFFF;
    border-top: 1px solid #EDE8DE;
  }

  .um-page-btn {
    padding: 5px 12px;
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    color: #374151;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .um-page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .um-num-box {
    min-width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: transparent;
    color: #374151;
  }

  .um-num-box.active {
    background: #111111;
    color: #FFFFFF;
  }

  /* Modal */
  .um-modal-overlay {
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

  .um-modal-card {
    background: #FFFFFF;
    border-radius: 12px;
    width: 100%;
    max-width: 520px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
  }

  .um-modal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid #EDE8DE;
    background: #FAF9F6;
  }

  .um-modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .um-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid #EDE8DE;
    background: #FAF9F6;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Helper sinh avatar màu dựa trên tên
const getAvatarStyle = (name = '', idx = 0) => {
  const colors = [
    { bg: '#FEF3C7', color: '#B45309' }, // vàng
    { bg: '#FED7AA', color: '#C2410C' }, // cam
    { bg: '#DBEAFE', color: '#1D4ED8' }, // xanh lam
    { bg: '#F3E8FF', color: '#7E22CE' }, // tím
    { bg: '#FEE2E2', color: '#B91C1C' }, // đỏ
    { bg: '#E5E7EB', color: '#374151' }, // xám
  ];
  const selected = colors[idx % colors.length];
  const initials = name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'YF';

  return { initials, ...selected };
};

const ITEMS_PER_PAGE = 6;

export default function UserManagement() {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CUSTOMERS' | 'VIP' | 'EMPLOYEES' | 'LOCKED'
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [detailModalUser, setDetailModalUser] = useState(null);
  const [lockModalUser, setLockModalUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');

  // Fetch users & metrics
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, metricsRes] = await Promise.all([
        adminService.getUsers(),
        adminService.getMetrics(),
      ]);
      if (usersRes?.data) setUsers(usersRes.data);
      if (metricsRes?.data) setMetrics(metricsRes.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      showError('Không thể tải danh sách tài khoản từ hệ thống');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: users.length,
      customers: users.filter((u) => u.type === 'CUSTOMER' && u.role !== 'VIP' && !u.role.startsWith('VIP')).length,
      vip: users.filter((u) => u.role === 'VIP' || u.role.startsWith('VIP')).length,
      employees: users.filter((u) => u.type === 'EMPLOYEE' || u.role === 'MANAGER' || u.role === 'ADMIN').length,
      locked: users.filter((u) => u.status === 'LOCKED').length,
    };
  }, [users]);

  // Lọc và sắp xếp
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Lọc theo Tab
    if (activeTab === 'CUSTOMERS') {
      result = result.filter((u) => u.type === 'CUSTOMER' && u.role !== 'VIP' && !u.role.startsWith('VIP'));
    } else if (activeTab === 'VIP') {
      result = result.filter((u) => u.role === 'VIP' || u.role.startsWith('VIP'));
    } else if (activeTab === 'EMPLOYEES') {
      result = result.filter((u) => u.type === 'EMPLOYEE' || u.role === 'MANAGER' || u.role === 'ADMIN');
    } else if (activeTab === 'LOCKED') {
      result = result.filter((u) => u.status === 'LOCKED');
    }

    // Lọc theo Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((u) => {
        return (
          (u.full_name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.phone || '').toLowerCase().includes(q)
        );
      });
    }

    // Lọc theo Dropdown Vai trò
    if (roleFilter !== 'ALL') {
      if (roleFilter === 'VIP') {
        result = result.filter((u) => u.role === 'VIP' || u.role.startsWith('VIP'));
      } else if (roleFilter === 'CUSTOMER') {
        result = result.filter((u) => u.role === 'CUSTOMER' || (!u.role.startsWith('VIP') && u.role !== 'MANAGER' && u.role !== 'ADMIN'));
      } else {
        result = result.filter((u) => u.role === roleFilter);
      }
    }

    // Lọc theo Dropdown Trạng thái
    if (statusFilter !== 'ALL') {
      result = result.filter((u) => u.status === statusFilter);
    }

    // Sắp xếp
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortBy === 'spending_desc') {
      result.sort((a, b) => (b.total_spending || 0) - (a.total_spending || 0));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'vi'));
    }

    return result;
  }, [users, activeTab, searchQuery, roleFilter, statusFilter, sortBy]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Checkbox select
  const isAllCurrentSelected = currentItems.length > 0 && currentItems.every((u) => selectedIds.includes(u.id));

  const handleSelectAll = () => {
    if (isAllCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentItems.some((u) => u.id === id)));
    } else {
      const newIds = currentItems.map((u) => u.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...newIds])));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const [isSyncing, setIsSyncing] = useState(false);

  // Đồng bộ thủ công toàn bộ dữ liệu tài khoản từ CSDL MySQL
  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      await fetchData();
      showSuccess('Đã đồng bộ toàn bộ tài khoản từ database thành công!');
    } catch (err) {
      showError('Lỗi khi đồng bộ dữ liệu tài khoản');
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle nhanh trạng thái Khóa / Kích hoạt
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await adminService.updateUserStatus(user.type, user.id, nextStatus);
      await fetchData();
      showSuccess(`Đã ${nextStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản "${user.full_name}"`);
    } catch (err) {
      showError('Không thể cập nhật trạng thái tài khoản');
    }
  };

  // Cập nhật vai trò người dùng
  const handleSaveRole = async () => {
    if (!roleModalUser) return;
    if (roleModalUser.role === 'ADMIN') {
      showError('Tài khoản Quản trị viên (Admin) là cố định duy nhất, không thể thay đổi vai trò');
      setRoleModalUser(null);
      return;
    }
    try {
      await adminService.updateUserRole(roleModalUser.type, roleModalUser.id, selectedRole);
      await fetchData();
      showSuccess(`Đã cập nhật vai trò cho "${roleModalUser.full_name}" thành công!`);
      setRoleModalUser(null);
    } catch (err) {
      showError('Lỗi khi cập nhật vai trò');
    }
  };

  // Xóa tài khoản
  const handleDeleteUser = async (user) => {
    try {
      await adminService.deleteUser(user.type, user.id);
      await fetchData();
      setSelectedIds((prev) => prev.filter((id) => id !== user.id));
      showSuccess(`Đã xóa tài khoản "${user.full_name}" thành công`);
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể xóa tài khoản này');
    }
  };

  // Xuất file CSV danh sách người dùng
  const handleExportCSV = () => {
    const headers = ['ID', 'Loại', 'Họ Tên', 'Email', 'Số Điện Thoại', 'Vai Trò', 'Trạng Thái'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.type,
      `"${u.full_name}"`,
      u.email,
      u.phone || '',
      `"${u.role_label}"`,
      u.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `YouthFashion_NguoiDung_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Đã xuất danh sách người dùng thành file CSV');
  };

  return (
    <div className="um-layout">
      <style>{userStyles}</style>

      {/* SIDEBAR BÊN TRÁI */}
      <ManagerSidebar activeMenu="users" />

      {/* MAIN CONTENT AREA */}
      <main className="um-main-content">
        <ManagerHeader showSearch={false} />

        <div className="um-scroll-body">
          {/* HEADER ROW */}
          <div className="um-header-row">
            <div>
              <h1 className="um-title-heading">Quản Lý Tài Khoản & Phân Quyền Người Dùng</h1>
              <p className="um-title-sub">
                Quản lý danh sách hội viên VIP, khách hàng, nhân viên bán hàng và kiểm soát quyền truy cập hệ thống YouthFashion.
              </p>
            </div>

            <div className="um-head-actions">
              <button
                type="button"
                className="um-btn-pill-action"
                onClick={handleSyncData}
                disabled={isSyncing || loading}
                title="Đồng bộ danh sách tài khoản từ database"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Database'}</span>
              </button>
              <button type="button" className="um-btn-pill-action" onClick={handleExportCSV}>
                <Download size={15} />
                Xuất Danh Sách
              </button>
            </div>
          </div>

          {/* 4 THẺ METRICS KPI CHUẨN XÁC THEO HÌNH */}
          <div className="um-metrics-grid">
            {/* Thẻ 1: Tổng người dùng */}
            <div className="um-metric-card">
              <div className="um-metric-head">
                <span className="um-metric-title">TỔNG NGƯỜI DÙNG</span>
                <div className="um-metric-icon-box">
                  <Award size={18} />
                </div>
              </div>
              <div className="um-metric-value-row">
                <span className="um-metric-value-num">
                  {metrics ? metrics.totalUsers.toLocaleString('vi-VN') : counts.all.toLocaleString('vi-VN')}
                </span>
                <span className="um-metric-value-unit">Tài khoản</span>
              </div>
              <div>
                <div className="um-metric-subtext">
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    Đang bán & HĐ: {metrics ? metrics.activeTotal : counts.all - counts.locked}
                  </span>
                  <span style={{ margin: '0 4px', color: '#D1D5DB' }}>•</span>
                  <span>Tạm khóa: {metrics ? metrics.lockedTotal : counts.locked}</span>
                </div>
                <div className="um-progress-bar-wrap">
                  <div className="um-progress-bar-fill" style={{ width: '85%', background: '#111111' }} />
                </div>
              </div>
            </div>

            {/* Thẻ 2: Khách Hàng VIP */}
            <div className="um-metric-card">
              <div className="um-metric-head">
                <span className="um-metric-title">KHÁCH HÀNG VIP</span>
                <div className="um-metric-icon-box gold">
                  <Star size={18} fill="#D97706" />
                </div>
              </div>
              <div className="um-metric-value-row">
                <span className="um-metric-value-num">
                  {counts.vip.toLocaleString('vi-VN')}
                </span>
                <span className="um-metric-value-unit">Tài khoản</span>
              </div>
              <div>
                <div className="um-metric-subtext" style={{ color: '#D97706', fontWeight: 600 }}>
                  <span>Hội viên VIP</span>
                  <span style={{ margin: '0 4px', color: '#D1D5DB' }}>•</span>
                  <span style={{ color: '#78716C', fontWeight: 400 }}>Tài khoản thân thiết</span>
                </div>
                <div className="um-progress-bar-wrap">
                  <div className="um-progress-bar-fill" style={{ width: `${Math.min(100, Math.max(10, (counts.vip / (counts.all || 1)) * 100))}%`, background: '#D97706' }} />
                </div>
              </div>
            </div>

            {/* Thẻ 3: Tài khoản mới tháng này */}
            <div className="um-metric-card">
              <div className="um-metric-head">
                <span className="um-metric-title">TÀI KHOẢN MỚI THÁNG NÀY</span>
                <div className="um-metric-icon-box green">
                  <UserPlus size={18} />
                </div>
              </div>
              <div className="um-metric-value-row">
                <span className="um-metric-value-num" style={{ color: '#16A34A' }}>
                  +{metrics?.newThisMonth ?? counts.customers}
                </span>
                <span style={{ color: '#16A34A', fontSize: '13px', fontWeight: 600 }}>Tài khoản</span>
              </div>
              <div>
                <div className="um-metric-subtext">
                  <span>Gia nhập trong tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
                </div>
                <div className="um-progress-bar-wrap">
                  <div className="um-progress-bar-fill" style={{ width: '100%', background: '#16A34A' }} />
                </div>
              </div>
            </div>

            {/* Thẻ 4: Nhân sự vận hành */}
            <div className="um-metric-card">
              <div className="um-metric-head">
                <span className="um-metric-title">NHÂN SỰ VẬN HÀNH</span>
                <div className="um-metric-icon-box purple">
                  <Shield size={18} />
                </div>
              </div>
              <div className="um-metric-value-row">
                <span className="um-metric-value-num">
                  {counts.employees}
                </span>
                <span className="um-metric-value-unit">Nhân sự</span>
              </div>
              <div>
                <div className="um-metric-subtext" style={{ color: '#4B5563', fontWeight: 500 }}>
                  <strong style={{ color: '#111111' }}>{metrics?.adminEmployees || 1} Admin</strong> •{' '}
                  {metrics?.managerEmployees || 0} Manager
                </div>
                <div className="um-progress-bar-wrap">
                  <div className="um-progress-bar-fill" style={{ width: '100%', background: '#7C3AED' }} />
                </div>
              </div>
            </div>
          </div>

          {/* THANH LỌC TAB TRẠNG THÁI & HÀNH ĐỘNG NHANH */}
          <div className="um-filter-card">
            <div className="um-tab-row">
              {/* Tab Pills */}
              <div className="um-tab-group">
                <button
                  type="button"
                  className={`um-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('ALL');
                    setCurrentPage(1);
                  }}
                >
                  Tất cả ({counts.all})
                </button>
                <button
                  type="button"
                  className={`um-tab-btn ${activeTab === 'CUSTOMERS' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('CUSTOMERS');
                    setCurrentPage(1);
                  }}
                >
                  Khách hàng ({counts.customers})
                </button>
                <button
                  type="button"
                  className={`um-tab-btn ${activeTab === 'VIP' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('VIP');
                    setCurrentPage(1);
                  }}
                >
                  Khách hàng VIP ({counts.vip})
                </button>
                <button
                  type="button"
                  className={`um-tab-btn ${activeTab === 'EMPLOYEES' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('EMPLOYEES');
                    setCurrentPage(1);
                  }}
                >
                  Nhân sự nội bộ ({counts.employees})
                </button>
                <button
                  type="button"
                  className={`um-tab-btn ${activeTab === 'LOCKED' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('LOCKED');
                    setCurrentPage(1);
                  }}
                >
                  Tạm khóa / Ngừng HĐ ({counts.locked})
                </button>
              </div>

              {/* Nhóm nút bên phải */}
              <div className="um-quick-actions">
                <span className="um-selection-count-text">
                  Đã chọn: <strong style={{ color: '#111' }}>{selectedIds.length} mục</strong>
                </span>
                <button
                  type="button"
                  className="um-btn-pill-delete"
                  disabled={selectedIds.length === 0}
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} tài khoản đã chọn?`)) {
                      setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
                      setSelectedIds([]);
                      showSuccess('Đã xóa các tài khoản được chọn');
                    }
                  }}
                >
                  <Trash2 size={13} />
                  Xóa các mục đã chọn
                </button>
              </div>
            </div>

            {/* Hàng Tìm kiếm & Bộ lọc Dropdowns */}
            <div className="um-search-filter-row">
              <div className="um-search-box">
                <Search size={16} color="#9CA3AF" />
                <input
                  type="text"
                  className="um-search-input"
                  placeholder="Lọc theo tên thành viên, email, số điện thoại"
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
                    style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                className="um-select-filter"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="CUSTOMER">Khách Hàng</option>
                <option value="VIP">Khách Hàng VIP</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin (Cố định)</option>
              </select>

              <select
                className="um-select-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Trạng thái: Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="LOCKED">Tạm khóa</option>
              </select>

              <select
                className="um-select-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Sắp xếp: Mới cập nhật nhất</option>
                <option value="spending_desc">Chi tiêu cao nhất</option>
                <option value="name_asc">Tên (A - Z)</option>
              </select>
            </div>
          </div>

          {/* BẢNG DỮ LIỆU NGƯỜI DÙNG */}
          <div className="um-table-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="um-table">
                <thead>
                  <tr>
                    <th style={{ width: '44px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="um-checkbox"
                        checked={isAllCurrentSelected}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th style={{ width: '28%' }}>NGƯỜI DÙNG & LIÊN HỆ</th>
                    <th style={{ width: '18%' }}>VAI TRÒ</th>
                    <th style={{ width: '16%' }}>TỔNG CHI TIÊU / ĐƠN HÀNG</th>
                    <th style={{ width: '18%' }}>ĐĂNG NHẬP GẦN NHẤT</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>TRẠNG THÁI</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: '#78716C' }}>
                        <Loader2 size={26} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                        <span>Đang tải danh sách người dùng hệ thống...</span>
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: '#78716C' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>Không tìm thấy người dùng nào phù hợp.</p>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((u, idx) => {
                      const isChecked = selectedIds.includes(u.id);
                      const avatar = getAvatarStyle(u.full_name, idx);

                      return (
                        <tr key={`${u.type}-${u.id}`} style={{ background: isChecked ? '#FFFDF8' : undefined }}>
                          {/* Checkbox */}
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              className="um-checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectOne(u.id)}
                            />
                          </td>

                          {/* Người dùng & Liên hệ */}
                          <td>
                            <div className="um-user-cell">
                              <div
                                className="um-avatar-badge"
                                style={{ background: avatar.bg, color: avatar.color }}
                              >
                                {avatar.initials}
                              </div>
                              <div>
                                <h4 className="um-name-bold">{u.full_name}</h4>
                                <div className="um-contact-sub">
                                  <span>{u.email}</span>
                                  {u.phone && <span> • {u.phone}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Vai trò */}
                          <td>
                            {u.role === 'VIP' || u.role.startsWith('VIP') ? (
                              <div className="um-role-badge gold">
                                <span>Khách Hàng VIP</span>
                              </div>
                            ) : u.role === 'MANAGER' ? (
                              <div className="um-role-badge manager">
                                <span>Manager</span>
                              </div>
                            ) : u.role === 'ADMIN' ? (
                              <div>
                                <div className="um-role-badge admin">
                                  <span>Quản Trị Viên (Admin)</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#78716C', marginTop: 2 }}>
                                  Toàn quyền hệ thống
                                </div>
                              </div>
                            ) : (
                              <div className="um-role-badge customer">
                                <span>Khách Hàng</span>
                              </div>
                            )}
                          </td>

                          {/* Tổng chi tiêu / Đơn hàng */}
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#111111' }}>
                              {u.spending_display}
                            </div>
                            <div style={{ fontSize: '12px', color: '#78716C', marginTop: 2 }}>
                              {u.orders_display}
                            </div>
                          </td>

                          {/* Đăng nhập gần nhất */}
                          <td>
                            <div style={{ fontSize: '13px', color: '#111111', fontWeight: 600 }}>
                              {u.last_login.split('(')[0]}
                            </div>
                            {u.last_login.includes('(') && (
                              <div style={{ fontSize: '11.5px', color: '#78716C', marginTop: 2 }}>
                                {u.last_login.split('(')[1].replace(')', '')}
                              </div>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className={`um-status-pill ${u.status === 'ACTIVE' ? 'active' : 'locked'}`}
                              onClick={() => handleToggleStatus(u)}
                              title="Nhấp để chuyển đổi trạng thái Hoạt động / Tạm khóa"
                            >
                              <span style={{ fontSize: '9px' }}>●</span>
                              {u.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                            </button>
                          </td>

                          {/* Thao tác */}
                          <td>
                            <div className="um-actions-group" style={{ justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="um-action-btn"
                                title={u.role === 'ADMIN' ? 'Tài khoản Quản trị viên Admin cố định duy nhất' : 'Phân quyền / Đổi vai trò'}
                                disabled={u.role === 'ADMIN'}
                                style={u.role === 'ADMIN' ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                                onClick={() => {
                                  if (u.role === 'ADMIN') return;
                                  setRoleModalUser(u);
                                  setSelectedRole(u.role.startsWith('VIP') ? 'VIP' : u.role);
                                }}
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                className={`um-action-btn ${u.status === 'ACTIVE' ? '' : 'danger'}`}
                                title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                onClick={() => handleToggleStatus(u)}
                              >
                                {u.status === 'ACTIVE' ? <Lock size={15} /> : <Unlock size={15} />}
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

            {/* PHÂN TRANG */}
            <div className="um-pagination-bar">
              <span style={{ fontSize: '12.5px', color: '#78716C' }}>
                Hiển thị <strong>{filteredUsers.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)}</strong> trong tổng số <strong>{filteredUsers.length}</strong> người dùng
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="um-page-btn"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  &lt; Trang trước
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
                      className={`um-num-box ${validCurrentPage === num ? 'active' : ''}`}
                      onClick={() => setCurrentPage(num)}
                    >
                      {num}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="um-page-btn"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Trang sau &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL PHÂN QUYỀN VAI TRÒ */}
      {roleModalUser && (
        <div className="um-modal-overlay" onClick={() => setRoleModalUser(null)}>
          <div className="um-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-head">
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Phân Quyền Vai Trò Người Dùng</h3>
              <button type="button" onClick={() => setRoleModalUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="um-modal-body">
              <div style={{ padding: '12px 16px', background: '#F8F7F4', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{roleModalUser.full_name}</div>
                <div style={{ fontSize: '12px', color: '#78716C', marginTop: 2 }}>{roleModalUser.email}</div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#78716C', textTransform: 'uppercase' }}>
                  Chọn Vai Trò Hệ Thống
                </label>
                <select
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2DFD7', marginTop: 6, fontSize: '13px' }}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="CUSTOMER">Khách Hàng</option>
                  <option value="VIP">Khách Hàng VIP</option>
                  <option value="MANAGER">Manager</option>
                </select>
                <div style={{ fontSize: '11.5px', color: '#A8A29E', marginTop: 6, lineHeight: 1.4 }}>
                  * Lưu ý: Tài khoản Quản trị viên (Admin) là cố định duy nhất, không thể cấp phát thêm.
                </div>
              </div>
            </div>

            <div className="um-modal-footer">
              <button
                type="button"
                style={{ padding: '8px 16px', border: '1px solid #E2DFD7', background: '#FFF', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12.5px' }}
                onClick={() => setRoleModalUser(null)}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                style={{ padding: '8px 18px', background: '#111', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12.5px' }}
                onClick={handleSaveRole}
              >
                Lưu Phân Quyền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT HỒ SƠ */}
      {detailModalUser && (
        <div className="um-modal-overlay" onClick={() => setDetailModalUser(null)}>
          <div className="um-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-head">
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Chi Tiết Hồ Sơ Người Dùng</h3>
              <button type="button" onClick={() => setDetailModalUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="um-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ padding: 12, border: '1px solid #EDE8DE', borderRadius: 8 }}>
                  <div style={{ fontSize: '11px', color: '#8C857B', fontWeight: 700, textTransform: 'uppercase' }}>Họ Và Tên</div>
                  <div style={{ fontWeight: 700, color: '#111', marginTop: 4 }}>{detailModalUser.full_name}</div>
                </div>
                <div style={{ padding: 12, border: '1px solid #EDE8DE', borderRadius: 8 }}>
                  <div style={{ fontSize: '11px', color: '#8C857B', fontWeight: 700, textTransform: 'uppercase' }}>Mã Người Dùng</div>
                  <div style={{ fontWeight: 700, color: '#111', marginTop: 4 }}>{detailModalUser.user_code}</div>
                </div>
                <div style={{ padding: 12, border: '1px solid #EDE8DE', borderRadius: 8 }}>
                  <div style={{ fontSize: '11px', color: '#8C857B', fontWeight: 700, textTransform: 'uppercase' }}>Email</div>
                  <div style={{ fontWeight: 600, color: '#111', marginTop: 4, wordBreak: 'break-all' }}>{detailModalUser.email}</div>
                </div>
                <div style={{ padding: 12, border: '1px solid #EDE8DE', borderRadius: 8 }}>
                  <div style={{ fontSize: '11px', color: '#8C857B', fontWeight: 700, textTransform: 'uppercase' }}>Số Điện Thoại</div>
                  <div style={{ fontWeight: 600, color: '#111', marginTop: 4 }}>{detailModalUser.phone || 'Chưa cập nhật'}</div>
                </div>
                <div style={{ padding: 12, border: '1px solid #EDE8DE', borderRadius: 8 }}>
                  <div style={{ fontSize: '11px', color: '#8C857B', fontWeight: 700, textTransform: 'uppercase' }}>Vai Trò Hiện Tại</div>
                  <div style={{ fontWeight: 700, color: '#2563EB', marginTop: 4 }}>{detailModalUser.role_label}</div>
                </div>
                <div style={{ padding: 12, border: '1px solid #EDE8DE', borderRadius: 8 }}>
                  <div style={{ fontSize: '11px', color: '#8C857B', fontWeight: 700, textTransform: 'uppercase' }}>Trạng Thái</div>
                  <div style={{ fontWeight: 700, color: detailModalUser.status === 'ACTIVE' ? '#059669' : '#DC2626', marginTop: 4 }}>
                    {detailModalUser.status === 'ACTIVE' ? 'Đang Hoạt Động' : 'Đang Tạm Khóa'}
                  </div>
                </div>
              </div>
            </div>

            <div className="um-modal-footer">
              <button
                type="button"
                style={{ padding: '8px 20px', background: '#111', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12.5px' }}
                onClick={() => setDetailModalUser(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

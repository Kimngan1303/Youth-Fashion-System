import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';
import { orderService } from '../../services/orderService';
import { ensureOrderCacheReset } from '../../utils/orderCacheReset';
import {
  mergeAndNormalizeOrders,
  summarizePeriod,
  toLocalDateInputValue,
  formatDateVN,
  shiftDateString,
  countDaysInclusive,
  formatVND,
  formatCompactVND,
} from '../../utils/orderReportUtils';
import {
  Download,
  ShoppingBag,
  Search,
  ArrowUp,
  ArrowDown,
  Loader2,
  X,
} from 'lucide-react';

const PAGE_SIZE = 5;

const QUICK_PRESETS = [
  { key: '7', label: '7 ngày', days: 7 },
  { key: '30', label: '30 ngày', days: 30 },
  { key: '90', label: '90 ngày', days: 90 },
];

const reportStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&display=swap');

  .rr-layout {
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

  .rr-main-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 100vh;
    background: #F7F6F3;
    box-sizing: border-box;
  }

  .rr-scroll-body {
    display: flex;
    flex-direction: column;
    padding: 28px 36px 48px;
    gap: 22px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Page Title & Export Row */
  .rr-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .rr-page-title {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 28px;
    line-height: 36px;
    color: #111111;
    margin: 0;
  }

  .rr-page-subtitle {
    font-size: 13px;
    line-height: 20px;
    color: #6B7280;
    margin: 4px 0 0 0;
  }

  .rr-export-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: #111111;
    color: #FFFFFF;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(17, 17, 17, 0.12);
    transition: background 0.15s ease, transform 0.15s ease;
    white-space: nowrap;
  }

  .rr-export-btn:hover {
    background: #27272A;
    transform: translateY(-1px);
  }

  .rr-export-btn:active {
    transform: translateY(0);
  }

  /* Top 3 KPI Summary Cards */
  .rr-top-kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    width: 100%;
  }

  .rr-kpi-card {
    background: #FFFFFF;
    border: 1px solid #EAE7DF;
    border-radius: 16px;
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 152px;
    box-sizing: border-box;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .rr-kpi-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .rr-kpi-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #6B7280;
    margin: 0;
  }

  .rr-icon-circle-gold {
    width: 32px;
    height: 32px;
    border-radius: 9999px;
    background: #FAF5EB;
    color: #B48938;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
  }

  .rr-icon-circle-blue {
    width: 32px;
    height: 32px;
    border-radius: 9999px;
    background: #EEF4FF;
    color: #3B82F6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .rr-kpi-main-value {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: 8px;
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 25px;
    line-height: 32px;
    color: #111111;
    word-break: break-word;
  }

  .rr-kpi-currency {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #6B7280;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .rr-kpi-growth-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 12px;
  }

  .rr-growth-up {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-weight: 700;
    color: #15803D;
  }

  .rr-growth-down {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-weight: 700;
    color: #DC2626;
  }

  .rr-growth-neutral {
    font-weight: 600;
    color: #6B7280;
  }

  .rr-growth-compare {
    color: #8C857B;
    font-size: 11.5px;
  }

  .rr-empty-pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 6px;
    background: #F3F4F6;
    color: #6B7280;
    font-size: 11px;
    font-weight: 600;
    width: fit-content;
    margin-top: 8px;
  }

  .rr-empty-inline {
    font-size: 12px;
    color: #6B7280;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rr-card-divider {
    height: 1px;
    background: #F2EFE9;
    margin: 14px 0 10px;
    width: 100%;
  }

  .rr-kpi-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 11.5px;
  }

  .rr-footer-muted {
    color: #6B7280;
  }

  .rr-footer-voucher {
    color: #E11D48;
    font-weight: 600;
  }

  /* Main Report Section Container */
  .rr-section-container {
    background: #FFFFFF;
    border: 1px solid #EAE7DF;
    border-radius: 18px;
    padding: 24px 26px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    box-sizing: border-box;
  }

  .rr-section-title {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 19px;
    line-height: 26px;
    color: #111111;
    margin: 0;
  }

  .rr-section-subtitle {
    font-size: 12.5px;
    color: #6B7280;
    margin: 3px 0 0 0;
  }

  /* Timeframe Filter Inner Box */
  .rr-filter-box {
    border: 1px solid #EFECE6;
    border-radius: 14px;
    padding: 16px 20px;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .rr-filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .rr-filter-kicker {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #8C857B;
    margin: 0;
  }

  .rr-filter-desc {
    font-size: 13px;
    font-weight: 700;
    color: #111111;
    margin: 2px 0 0 0;
  }

  .rr-date-range-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 9999px;
    background: #F3F4F6;
    color: #374151;
    font-size: 12px;
    font-weight: 500;
  }

  .rr-filter-controls {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) auto;
    gap: 16px;
    align-items: end;
  }

  .rr-control-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .rr-control-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #6B7280;
  }

  .rr-date-input {
    height: 40px;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    padding: 0 12px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #111111;
    background: #FFFFFF;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s ease;
  }

  .rr-date-input:focus {
    border-color: #111111;
  }

  .rr-quick-pills {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .rr-preset-btn {
    height: 40px;
    padding: 0 18px;
    border-radius: 9999px;
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    color: #374151;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .rr-preset-btn:hover {
    border-color: #111111;
    color: #111111;
  }

  .rr-preset-btn.active {
    background: #111111;
    color: #FFFFFF;
    border-color: #111111;
  }

  /* Two Middle Detail Cards */
  .rr-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .rr-detail-card {
    border: 1px solid #EFECE6;
    border-radius: 14px;
    padding: 20px 22px;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
  }

  .rr-detail-count-unit {
    font-family: 'Playfair Display', serif;
    font-weight: 400;
    font-size: 16px;
    color: #6B7280;
  }

  .rr-detail-summary-lines {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12.5px;
  }

  .rr-detail-kv-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12.5px;
  }

  .rr-kv-label {
    color: #6B7280;
  }

  .rr-kv-value {
    font-weight: 700;
    color: #111111;
  }

  /* Bottom Order Revenue Table Card */
  .rr-table-card {
    border: 1px solid #EFECE6;
    border-radius: 14px;
    padding: 20px 22px;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-sizing: border-box;
  }

  .rr-table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .rr-search-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 260px;
    max-width: 100%;
    height: 38px;
    padding: 0 12px;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    background: #FFFFFF;
    box-sizing: border-box;
    transition: border-color 0.15s ease;
  }

  .rr-search-wrapper:focus-within {
    border-color: #111111;
  }

  .rr-search-input {
    border: none;
    outline: none;
    background: transparent;
    width: 100%;
    font-size: 13px;
    color: #111111;
  }

  .rr-search-clear {
    border: none;
    background: transparent;
    padding: 2px;
    cursor: pointer;
    color: #9CA3AF;
    display: flex;
    align-items: center;
  }

  .rr-table-scroll {
    width: 100%;
    overflow-x: auto;
  }

  .rr-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 640px;
  }

  .rr-table th {
    text-align: left;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #6B7280;
    padding: 12px 10px;
    border-bottom: 1px solid #F0EEE9;
  }

  .rr-table th.align-right,
  .rr-table td.align-right {
    text-align: right;
  }

  .rr-table td {
    padding: 15px 10px;
    font-size: 13px;
    border-bottom: 1px solid #F6F4EF;
    color: #111111;
    vertical-align: middle;
  }

  .rr-table tbody tr:last-child td {
    border-bottom: none;
  }

  .rr-table tbody tr:hover {
    background: #FAF9F6;
  }

  .rr-order-code {
    font-weight: 700;
    color: #111111;
  }

  .rr-order-date {
    color: #6B7280;
  }

  .rr-status-pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 11.5px;
    font-weight: 600;
  }

  .rr-status-completed {
    background: #DCFCE7;
    color: #15803D;
  }

  .rr-status-shipping {
    background: #DBEAFE;
    color: #1D4ED8;
  }

  .rr-status-processing {
    background: #EDE9FE;
    color: #6D28D9;
  }

  .rr-status-confirmed {
    background: #E0F2FE;
    color: #0369A1;
  }

  .rr-status-pending {
    background: #FEF3C7;
    color: #B45309;
  }

  .rr-table-empty {
    padding: 36px 16px;
    text-align: center;
    color: #78716C;
    font-size: 13px;
  }

  .rr-pagination-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-top: 8px;
    border-top: 1px solid #F2EFE9;
    flex-wrap: wrap;
  }

  .rr-pagination-info {
    font-size: 12.5px;
    color: #6B7280;
  }

  .rr-pagination-controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .rr-page-nav-btn {
    height: 30px;
    padding: 0 12px;
    border-radius: 9999px;
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    color: #374151;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .rr-page-nav-btn:hover:not(:disabled) {
    border-color: #111111;
    color: #111111;
  }

  .rr-page-nav-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .rr-page-num-btn {
    width: 30px;
    height: 30px;
    border-radius: 9999px;
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    color: #374151;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .rr-page-num-btn:hover {
    border-color: #111111;
  }

  .rr-page-num-btn.active {
    background: #111111;
    border-color: #111111;
    color: #FFFFFF;
  }

  .rr-page-ellipsis {
    padding: 0 4px;
    font-size: 12px;
    color: #9CA3AF;
  }

  .rr-spin {
    animation: rrSpin 1s linear infinite;
  }

  @keyframes rrSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1120px) {
    .rr-top-kpi-grid {
      grid-template-columns: 1fr;
    }
    .rr-filter-controls {
      grid-template-columns: 1fr 1fr;
    }
    .rr-detail-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .rr-scroll-body {
      padding: 20px 16px 40px;
    }
    .rr-filter-controls {
      grid-template-columns: 1fr;
    }
  }
`;

const escapeCsvCell = (value) => {
  const str = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
};

const buildPaginationRange = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};

function GrowthIndicator({ value, compareText }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <div className="rr-kpi-growth-row">
        <span className="rr-growth-neutral">Phát sinh trong kỳ</span>
        <span className="rr-growth-compare">{compareText}</span>
      </div>
    );
  }

  const isPositive = value >= 0;
  const formatted = `${isPositive ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <div className="rr-kpi-growth-row">
      <span className={isPositive ? 'rr-growth-up' : 'rr-growth-down'}>
        {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        {formatted}
      </span>
      <span className="rr-growth-compare">{compareText}</span>
    </div>
  );
}

function SummaryKpiCard({ title, stats, compareLabel, iconType = 'currency', emptyStyle = 'pill' }) {
  const hasData = stats.orderCount > 0;

  return (
    <div className="rr-kpi-card">
      <div>
        <div className="rr-kpi-card-top">
          <p className="rr-kpi-label">{title}</p>
          <span className="rr-icon-circle-gold">
            {iconType === 'bag' ? <ShoppingBag size={14} /> : '₫'}
          </span>
        </div>

        {hasData ? (
          <>
            <div className="rr-kpi-main-value">
              <span>{Math.round(stats.totalRevenue).toLocaleString('vi-VN')}</span>
              <span className="rr-kpi-currency">đ</span>
            </div>
            <GrowthIndicator value={stats.revenueGrowth} compareText={compareLabel} />
          </>
        ) : (
          <>
            <div className="rr-kpi-main-value">
              <span>—</span>
              <span className="rr-kpi-currency">đ</span>
            </div>
            {emptyStyle === 'pill' ? (
              <div className="rr-empty-pill">Chưa có dữ liệu</div>
            ) : (
              <div className="rr-empty-inline">
                <span>Chưa có dữ liệu</span>
                <span>—</span>
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <div className="rr-card-divider" />
        {hasData ? (
          <div className="rr-kpi-footer">
            <span className="rr-footer-muted">Gộp: {formatCompactVND(stats.grossRevenue)}</span>
            <span className="rr-footer-voucher">
              Voucher: -{formatCompactVND(stats.voucherDiscount)}
            </span>
          </div>
        ) : (
          <div className="rr-kpi-footer">
            <span className="rr-footer-muted">{compareLabel}</span>
            <span className="rr-footer-muted">—</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RevenueReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const todayKey = useMemo(() => toLocalDateInputValue(new Date()), []);
  const [activePreset, setActivePreset] = useState('7');
  const [startDate, setStartDate] = useState(() => shiftDateString(toLocalDateInputValue(new Date()), -6));
  const [endDate, setEndDate] = useState(() => toLocalDateInputValue(new Date()));

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Bảo vệ quyền truy cập chỉ dành cho Admin và Manager
  useEffect(() => {
    if (!user) return;
    const role = String(user.role || '').toUpperCase();
    const empRole = String(user.employee_role || '').toUpperCase();
    const userType = String(user.type || '').toUpperCase();
    const isStaff =
      ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role) ||
      ['ADMIN', 'MANAGER'].includes(empRole) ||
      userType === 'EMPLOYEE';

    if (!isStaff) {
      showError('Chỉ tài khoản Quản trị (Admin / Manager) mới có quyền xem Báo cáo doanh thu.');
      navigate('/', { replace: true });
    }
  }, [user, navigate, showError]);

  const loadOrders = useCallback(async () => {
    ensureOrderCacheReset();
    try {
      const res = await orderService.getAllOrders();
      const apiList = res?.status && Array.isArray(res.data) ? res.data : [];
      setOrders(mergeAndNormalizeOrders(apiList));
    } catch (err) {
      console.error('Lỗi tải dữ liệu báo cáo doanh thu:', err);
      setOrders(mergeAndNormalizeOrders([]));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    const handleSync = () => {
      loadOrders();
    };
    window.addEventListener('order_status_updated', handleSync);
    window.addEventListener('yf_order_status_changed', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('order_status_updated', handleSync);
      window.removeEventListener('yf_order_status_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadOrders]);

  // Tính 3 thẻ tổng quan: Tuần / Tháng / Năm
  const topOverviewStats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // 1. Tuần: 7 ngày gần nhất so với 7 ngày liền trước
    const weekStart = shiftDateString(todayKey, -6);
    const prevWeekEnd = shiftDateString(weekStart, -1);
    const prevWeekStart = shiftDateString(prevWeekEnd, -6);
    const weekly = summarizePeriod(orders, weekStart, todayKey, prevWeekStart, prevWeekEnd);

    // 2. Tháng: Tháng dương lịch hiện tại so với tháng trước
    const monthStart = toLocalDateInputValue(new Date(year, month, 1));
    const prevMonthStart = toLocalDateInputValue(new Date(year, month - 1, 1));
    const prevMonthEnd = toLocalDateInputValue(new Date(year, month, 0));
    const monthly = summarizePeriod(orders, monthStart, todayKey, prevMonthStart, prevMonthEnd);

    // 3. Năm: Năm dương lịch hiện tại so với năm trước
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const prevYearStart = `${year - 1}-01-01`;
    const prevYearEnd = `${year - 1}-12-31`;
    const yearly = summarizePeriod(orders, yearStart, yearEnd, prevYearStart, prevYearEnd);

    return { weekly, monthly, yearly };
  }, [orders, todayKey]);

  // Tính chỉ số cho khoảng thời gian tùy chọn (PHẠM VI THỜI GIAN)
  const periodStats = useMemo(() => {
    const validStart = startDate <= endDate ? startDate : endDate;
    const validEnd = startDate <= endDate ? endDate : startDate;
    const spanDays = countDaysInclusive(validStart, validEnd);
    const prevEnd = shiftDateString(validStart, -1);
    const prevStart = shiftDateString(prevEnd, -(spanDays - 1));

    return summarizePeriod(orders, validStart, validEnd, prevStart, prevEnd);
  }, [orders, startDate, endDate]);

  // Lọc bảng đơn hàng theo ô tìm kiếm mã đơn / tên khách hàng
  const filteredTableOrders = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return periodStats.orders;
    return periodStats.orders.filter(
      (o) =>
        o.orderCode.toLowerCase().includes(keyword) ||
        o.customerName.toLowerCase().includes(keyword)
    );
  }, [periodStats.orders, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTableOrders.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const startIdx = (safePage - 1) * PAGE_SIZE;
    return filteredTableOrders.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredTableOrders, safePage]);

  const handlePresetSelect = (preset) => {
    setActivePreset(preset.key);
    const newEnd = todayKey;
    const newStart = shiftDateString(newEnd, -(preset.days - 1));
    setStartDate(newStart);
    setEndDate(newEnd);
    setCurrentPage(1);
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    setStartDate(val);
    if (val > endDate) {
      setEndDate(val);
    }
    setActivePreset('');
    setCurrentPage(1);
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    setEndDate(val);
    if (val < startDate) {
      setStartDate(val);
    }
    setActivePreset('');
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    if (filteredTableOrders.length === 0) {
      showInfo('Không có đơn hàng nào trong khoảng thời gian đã chọn để xuất báo cáo.');
      return;
    }

    const lines = [
      ['BÁO CÁO & PHÂN TÍCH DOANH THU - YOUTH FASHION'].map(escapeCsvCell).join(','),
      [`Khoảng thời gian: ${formatDateVN(startDate)} - ${formatDateVN(endDate)}`].map(escapeCsvCell).join(','),
      [
        'Tổng doanh thu thực',
        formatVND(periodStats.totalRevenue),
        'Tổng đơn hàng',
        periodStats.orderCount,
        'AOV trung bình',
        formatVND(periodStats.aov),
        'Tỷ lệ hoàn thành',
        `${periodStats.completionRate.toFixed(1)}%`,
      ]
        .map(escapeCsvCell)
        .join(','),
      '',
      ['Mã đơn', 'Ngày', 'Khách hàng', 'Trạng thái', 'Doanh thu gộp (VNĐ)', 'Giảm giá Voucher (VNĐ)', 'Doanh thu thực (VNĐ)']
        .map(escapeCsvCell)
        .join(','),
      ...filteredTableOrders.map((ord) =>
        [
          ord.orderCode,
          ord.dateDisplay,
          ord.customerName,
          ord.statusLabel,
          Math.round(ord.grossAmount),
          Math.round(ord.voucherAmount),
          Math.round(ord.netAmount),
        ]
          .map(escapeCsvCell)
          .join(',')
      ),
    ];

    const csvContent = `\uFEFF${lines.join('\r\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCao_DoanhThu_${startDate}_den_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess('Đã xuất file báo cáo doanh thu thành công!');
  };

  const displayRangeText = `${formatDateVN(startDate)} – ${formatDateVN(endDate)}`;
  const startRowNumber = filteredTableOrders.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endRowNumber = Math.min(safePage * PAGE_SIZE, filteredTableOrders.length);
  const paginationItems = buildPaginationRange(safePage, totalPages);

  return (
    <div className="rr-layout">
      <style>{reportStyles}</style>

      <ManagerSidebar activeMenu="reports" />

      <div className="rr-main-content">
        <ManagerHeader showSearch={false} />

        <div className="rr-scroll-body">
          {/* Header Row */}
          <div className="rr-page-header">
            <div>
              <h1 className="rr-page-title">Báo Cáo &amp; Phân Tích Doanh Thu</h1>
              <p className="rr-page-subtitle">
                Theo dõi dòng tiền, cấu trúc chi phí, biên lợi nhuận ròng và dự báo tăng trưởng thời trang cao cấp.
              </p>
            </div>

            <button type="button" className="rr-export-btn" onClick={handleExportCsv}>
              <Download size={15} />
              <span>Xuất Báo Cáo</span>
            </button>
          </div>

          {/* Top 3 KPI Summary Cards */}
          <div className="rr-top-kpi-grid">
            <SummaryKpiCard
              title="TỔNG DOANH THU TUẦN"
              stats={topOverviewStats.weekly}
              compareLabel="So với tuần trước"
              iconType="currency"
              emptyStyle="pill"
            />
            <SummaryKpiCard
              title="TỔNG DOANH THU THÁNG"
              stats={topOverviewStats.monthly}
              compareLabel="So với tháng trước"
              iconType="currency"
              emptyStyle="pill"
            />
            <SummaryKpiCard
              title="TỔNG DOANH THU NĂM"
              stats={topOverviewStats.yearly}
              compareLabel="So với năm trước"
              iconType="bag"
              emptyStyle="inline"
            />
          </div>

          {/* Main Section: Báo Cáo Doanh Thu Theo Đơn Hàng */}
          <section className="rr-section-container">
            <div>
              <h2 className="rr-section-title">Báo Cáo Doanh Thu Theo Đơn Hàng</h2>
              <p className="rr-section-subtitle">
                Tổng hợp doanh thu toàn bộ đơn hàng và doanh thu chi tiết từng đơn theo khoảng thời gian đã chọn
              </p>
            </div>

            {/* PHẠM VI THỜI GIAN */}
            <div className="rr-filter-box">
              <div className="rr-filter-header">
                <div>
                  <p className="rr-filter-kicker">PHẠM VI THỜI GIAN</p>
                  <p className="rr-filter-desc">Áp dụng cho cả tổng quan và chi tiết đơn hàng</p>
                </div>
                <span className="rr-date-range-badge">{displayRangeText}</span>
              </div>

              <div className="rr-filter-controls">
                <div className="rr-control-group">
                  <label htmlFor="rr-start-date" className="rr-control-label">
                    TỪ NGÀY
                  </label>
                  <input
                    id="rr-start-date"
                    type="date"
                    className="rr-date-input"
                    value={startDate}
                    max={todayKey}
                    onChange={handleStartDateChange}
                  />
                </div>

                <div className="rr-control-group">
                  <label htmlFor="rr-end-date" className="rr-control-label">
                    ĐẾN NGÀY
                  </label>
                  <input
                    id="rr-end-date"
                    type="date"
                    className="rr-date-input"
                    value={endDate}
                    max={todayKey}
                    onChange={handleEndDateChange}
                  />
                </div>

                <div className="rr-control-group">
                  <span className="rr-control-label">LỰA CHỌN NHANH</span>
                  <div className="rr-quick-pills">
                    {QUICK_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        className={`rr-preset-btn ${activePreset === preset.key ? 'active' : ''}`}
                        onClick={() => handlePresetSelect(preset)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Two Middle Detail Cards */}
            <div className="rr-detail-grid">
              {/* Left Detail Card */}
              <div className="rr-detail-card">
                <div>
                  <div className="rr-kpi-card-top">
                    <p className="rr-kpi-label">DOANH THU TỔNG CỦA TẤT CẢ ĐƠN HÀNG</p>
                    <span className="rr-icon-circle-gold">₫</span>
                  </div>

                  <div className="rr-kpi-main-value">
                    <span>
                      {periodStats.orderCount > 0
                        ? Math.round(periodStats.totalRevenue).toLocaleString('vi-VN')
                        : '0'}
                    </span>
                    <span className="rr-kpi-currency">đ</span>
                  </div>

                  {periodStats.orderCount > 0 ? (
                    <GrowthIndicator
                      value={periodStats.revenueGrowth}
                      compareText="so với khoảng thời gian trước đó"
                    />
                  ) : (
                    <div className="rr-kpi-growth-row">
                      <span className="rr-growth-neutral">Chưa có dữ liệu</span>
                      <span className="rr-growth-compare">trong khoảng thời gian đã chọn</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="rr-card-divider" />
                  <div className="rr-detail-summary-lines">
                    <span className="rr-kv-label">
                      Tổng <strong style={{ color: '#111111' }}>{periodStats.orderCount.toLocaleString('vi-VN')}</strong> đơn hàng trong khoảng thời gian đã chọn
                    </span>
                    <span style={{ fontWeight: 700, color: '#111111' }}>
                      Trung bình {formatVND(periodStats.aov)} / đơn
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Detail Card */}
              <div className="rr-detail-card">
                <div>
                  <div className="rr-kpi-card-top">
                    <p className="rr-kpi-label">DOANH THU CHI TIẾT TỪNG ĐƠN</p>
                    <span className="rr-icon-circle-blue" aria-hidden="true" />
                  </div>

                  <div className="rr-kpi-main-value">
                    <span>{periodStats.orderCount.toLocaleString('vi-VN')}</span>
                    <span className="rr-detail-count-unit">Đơn hàng</span>
                  </div>

                  <div className="rr-kpi-growth-row">
                    <span style={{ fontWeight: 700, color: '#111111' }}>
                      AOV: {formatVND(periodStats.aov)}
                    </span>
                    {periodStats.aovGrowth !== null && (
                      <span className={periodStats.aovGrowth >= 0 ? 'rr-growth-up' : 'rr-growth-down'}>
                        ({periodStats.aovGrowth >= 0 ? '+' : ''}
                        {periodStats.aovGrowth.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="rr-card-divider" />
                  <div className="rr-detail-summary-lines">
                    <div className="rr-detail-kv-row">
                      <span className="rr-kv-label">Đơn hàng cao nhất</span>
                      <span className="rr-kv-value">
                        {periodStats.orderCount > 0 ? formatVND(periodStats.maxOrder) : '—'}
                      </span>
                    </div>
                    <div className="rr-detail-kv-row">
                      <span className="rr-kv-label">Đơn hàng thấp nhất</span>
                      <span className="rr-kv-value">
                        {periodStats.orderCount > 0 ? formatVND(periodStats.minOrder) : '—'}
                      </span>
                    </div>
                    <div className="rr-detail-kv-row">
                      <span className="rr-kv-label">Tỷ lệ hoàn thành</span>
                      <span className="rr-kv-value">
                        {periodStats.allOrdersCount > 0
                          ? `${periodStats.completionRate.toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Table Card: DANH SÁCH DOANH THU TỪNG ĐƠN */}
            <div className="rr-table-card">
              <div className="rr-table-header">
                <div>
                  <p className="rr-filter-kicker">DANH SÁCH DOANH THU TỪNG ĐƠN</p>
                  <p className="rr-filter-desc">Dựa trên khoảng thời gian {displayRangeText}</p>
                </div>

                <div className="rr-search-wrapper">
                  <Search size={14} color="#9CA3AF" />
                  <input
                    type="text"
                    className="rr-search-input"
                    placeholder="Tìm kiếm theo mã đơn"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="rr-search-clear"
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      aria-label="Xóa tìm kiếm"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="rr-table-scroll">
                <table className="rr-table">
                  <thead>
                    <tr>
                      <th>MÃ ĐƠN</th>
                      <th>NGÀY</th>
                      <th>KHÁCH HÀNG</th>
                      <th>TRẠNG THÁI</th>
                      <th className="align-right">DOANH THU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="rr-table-empty">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <Loader2 size={16} className="rr-spin" />
                            Đang tải dữ liệu doanh thu...
                          </span>
                        </td>
                      </tr>
                    ) : paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="rr-table-empty">
                          {searchQuery
                            ? `Không tìm thấy đơn hàng hoàn thành nào khớp với "${searchQuery}" trong khoảng thời gian đã chọn.`
                            : 'Chưa có đơn hàng đã hoàn thành nào trong khoảng thời gian đã chọn.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td className="rr-order-code">{ord.orderCode}</td>
                          <td className="rr-order-date">{ord.dateDisplay}</td>
                          <td>{ord.customerName}</td>
                          <td>
                            <span className={`rr-status-pill rr-status-${ord.statusVariant}`}>
                              {ord.statusLabel}
                            </span>
                          </td>
                          <td className="align-right rr-order-code">{formatVND(ord.netAmount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredTableOrders.length > 0 && (
                <div className="rr-pagination-row">
                  <span className="rr-pagination-info">
                    Hiển thị {startRowNumber}–{endRowNumber} trên{' '}
                    {filteredTableOrders.length.toLocaleString('vi-VN')} đơn hàng
                  </span>

                  <div className="rr-pagination-controls">
                    <button
                      type="button"
                      className="rr-page-nav-btn"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Trước
                    </button>

                    {paginationItems.map((item, idx) =>
                      item === '...' ? (
                        <span key={`ellipsis-${idx}`} className="rr-page-ellipsis">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          className={`rr-page-num-btn ${safePage === item ? 'active' : ''}`}
                          onClick={() => setCurrentPage(item)}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      className="rr-page-nav-btn"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Tiếp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

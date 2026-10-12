import React, { useState, useMemo } from 'react';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';
import { useToast } from '../../context/ToastContext';
import { 
  Tag, 
  Clock, 
  Plus, 
  Trash2, 
  Search, 
  ChevronDown, 
  Star, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Percent, 
  Gift, 
  Calendar, 
  TrendingUp,
  Filter,
  ArrowRight
} from 'lucide-react';

// Initial vouchers list precisely matching the design
const INITIAL_VOUCHERS = [
  {
    id: 'v1',
    code: 'YF - WINTER25',
    name: 'Giảm 20% BST Thu Đông 2025',
    badgeType: 'dark',
    badgeTop: '20%',
    badgeBottom: 'OFF',
    discountType: 'percent',
    discountDisplay: 'Giảm 20%',
    discountSub: 'Tối đa 500.000₫',
    conditionDisplay: 'Đơn từ 1.500.000₫',
    conditionSub: 'Áp dụng Ready-To-Wear',
    usedCount: 342,
    totalLimit: 500,
    progressPercent: (342 / 500) * 100,
    progressColor: '#111111',
    validityDisplay: '15/10/2025 - 15/11/2025',
    statusText: 'Còn 24 ngày',
    statusColor: '#059669', // green
    statusTab: 'active', // Đang diễn ra
  },
  {
    id: 'v2',
    code: 'YF - WELCOME10',
    name: 'Ưu Đãi Hội Viên Mới Đăng Ký',
    badgeType: 'light',
    badgeTop: '10%',
    badgeBottom: 'NEW',
    discountType: 'percent',
    discountDisplay: 'Giảm 10%',
    discountSub: 'Đơn hàng đầu tiên',
    conditionDisplay: 'Không giới hạn',
    conditionSub: 'Tài khoản mới',
    usedCount: 520,
    totalLimit: 1000,
    progressPercent: (520 / 1000) * 100,
    progressColor: '#111111',
    validityDisplay: 'Không thời hạn',
    statusText: 'Tự động kích hoạt',
    statusColor: '#78716C', // gray
    statusTab: 'active',
  },
  {
    id: 'v3',
    code: 'VIP - GOLD30',
    name: 'Tri Ân Khách Hàng Thân Thiết VIP Gold',
    badgeType: 'gold',
    badgeTop: 'VIP',
    badgeBottom: 'GOLD',
    discountType: 'fixed',
    discountDisplay: 'Giảm 300.000₫',
    discountSub: 'Trừ trực tiếp hóa đơn',
    conditionDisplay: 'Hạng Gold & Platinum',
    conditionSub: 'Áp dụng toàn bộ kho',
    usedCount: 88,
    totalLimit: 100,
    progressPercent: 88,
    progressColor: '#F59E0B',
    validityDisplay: '01/10/2025 - 31/10/2025',
    statusText: 'Còn 9 ngày',
    statusColor: '#D97706', // amber
    statusTab: 'active',
  },
  {
    id: 'v4',
    code: 'FREESHIP - OCT',
    name: 'Miễn Phí Giao Hàng Toàn Quốc Tháng 10',
    badgeType: 'blue',
    badgeIcon: 'truck',
    badgeBottom: 'FREE',
    discountType: 'shipping',
    discountDisplay: 'Miễn Phí Vận Chuyển',
    discountSub: 'Tối đa 40.000₫',
    conditionDisplay: 'Đơn từ 800.000₫',
    conditionSub: 'Tất cả tỉnh thành',
    usedCount: 890,
    totalLimit: 1000,
    progressPercent: 89,
    progressColor: '#111111',
    validityDisplay: '01/10/2025 - 31/10/2025',
    statusText: 'Còn 9 ngày',
    statusColor: '#059669', // green
    statusTab: 'active',
  },
  {
    id: 'v5',
    code: 'BLACKFRIDAY - PRE',
    name: 'Siêu Tiệc Black Friday Sớm Cho Khách V...',
    badgeType: 'purple',
    badgeTop: '35%',
    badgeBottom: 'BF-PRE',
    discountType: 'percent',
    discountDisplay: 'Giảm 35%',
    discountSub: 'Toàn bộ kho hàng',
    conditionDisplay: 'Đơn từ 2.000.000₫',
    conditionSub: 'Tối đa 1.000.000₫',
    usedCount: 0,
    totalLimit: 200,
    progressPercent: 0,
    progressColor: '#E5E7EB',
    validityDisplay: 'Bắt đầu: 25/11/2025',
    statusText: 'Sắp mở trong 33 ngày',
    statusColor: '#9333EA', // purple
    statusTab: 'upcoming', // Sắp diễn ra
  },
  {
    id: 'v6',
    code: 'YF - FLASH50',
    name: 'Flash Sale Giờ Vàng Đêm Hội Hoàng Gia...',
    badgeType: 'red',
    badgeTop: '150k',
    badgeBottom: 'FLASH',
    discountType: 'fixed',
    discountDisplay: 'Giảm 150.000₫',
    discountSub: 'Trực tiếp theo bill',
    conditionDisplay: 'Đơn từ 999.000₫',
    conditionSub: 'Khung giờ 20h - 24h',
    usedCount: 300,
    totalLimit: 300,
    progressPercent: 100,
    progressColor: '#EF4444',
    validityDisplay: '20/10/2025 (1 Ngày)',
    statusText: 'Đã hết hạn',
    statusColor: '#9CA3AF', // muted gray
    statusTab: 'expired', // Đã kết thúc
  },
  // Additional vouchers for full realistic pagination
  {
    id: 'v7',
    code: 'YF - SUMMEREND',
    name: 'Xả Kho BST Mùa Hè 2025',
    badgeType: 'dark',
    badgeTop: '50%',
    badgeBottom: 'SALE',
    discountType: 'percent',
    discountDisplay: 'Giảm 50%',
    discountSub: 'Tối đa 300.000₫',
    conditionDisplay: 'Đơn từ 600.000₫',
    conditionSub: 'Sản phẩm Outlet',
    usedCount: 450,
    totalLimit: 500,
    progressPercent: 90,
    progressColor: '#111111',
    validityDisplay: '01/09/2025 - 30/09/2025',
    statusText: 'Đã hết hạn',
    statusColor: '#9CA3AF',
    statusTab: 'expired',
  },
  {
    id: 'v8',
    code: 'VIP - PLATINUM50',
    name: 'Đặc Quyền Hội Viên Platinum Sang Trọng',
    badgeType: 'gold',
    badgeTop: 'VIP',
    badgeBottom: 'PLAT',
    discountType: 'fixed',
    discountDisplay: 'Giảm 500.000₫',
    discountSub: 'Áp dụng trên mọi hóa đơn',
    conditionDisplay: 'Hạng Platinum',
    conditionSub: 'Không giới hạn giá trị đơn',
    usedCount: 24,
    totalLimit: 50,
    progressPercent: 48,
    progressColor: '#F59E0B',
    validityDisplay: '01/10/2025 - 31/12/2025',
    statusText: 'Còn 70 ngày',
    statusColor: '#059669',
    statusTab: 'active',
  }
];

// Sample voucher usage log
const MOCK_HISTORY = [
  { id: 'LOG-01', code: 'YOUTH-WELCOME20', customer: 'Lê Hoàng Long', orderId: '#DH-9821', discount: '200.000₫', time: '10 phút trước', status: 'Áp dụng thành công' },
  { id: 'LOG-02', code: 'VIP - GOLD30', customer: 'Đặng Thu Thảo', orderId: '#DH-9820', discount: '300.000₫', time: '45 phút trước', status: 'Áp dụng thành công' },
  { id: 'LOG-03', code: 'FREESHIP - OCT', customer: 'Trần Minh Châu', orderId: '#DH-9818', discount: '40.000₫', time: '2 giờ trước', status: 'Áp dụng thành công' },
  { id: 'LOG-04', code: 'YF - WINTER25', customer: 'Nguyễn Văn Hùng', orderId: '#DH-9815', discount: '360.000₫', time: '3 giờ trước', status: 'Áp dụng thành công' },
  { id: 'LOG-05', code: 'YF - FLASH50', customer: 'Phạm Thu Trang', orderId: '#DH-9809', discount: '150.000₫', time: '5 giờ trước', status: 'Áp dụng thành công' },
];

const voucherPageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400&display=swap');

  .manager-layout {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 0px;
    width: 100%;
    min-height: 100vh;
    background: #FAFAF9;
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
    overflow-x: hidden;
  }

  .voucher-scroll-body {
    display: flex;
    flex-direction: column;
    padding: 24px 32px 48px;
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Page Header Row */
  .voucher-header-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    box-sizing: border-box;
  }

  .voucher-title-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .voucher-main-title {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 27px;
    line-height: 34px;
    color: #111111;
    margin: 0;
  }

  .voucher-subtitle {
    font-weight: 400;
    font-size: 13px;
    line-height: 19px;
    color: #78716C;
    margin: 0;
  }

  .voucher-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-history-pill {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    height: 40px;
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 13px;
    color: #292524;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-history-pill:hover {
    background: #F5F4EF;
    border-color: #D6D3CD;
  }

  .btn-create-pill {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    height: 40px;
    background: #111111;
    border: 1px solid #111111;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 13px;
    color: #FFFFFF;
    cursor: pointer;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;
  }

  .btn-create-pill:hover {
    background: #27272A;
    border-color: #27272A;
    transform: translateY(-1px);
  }

  /* Metric KPI Cards (4 Cards Grid) */
  .kpi-cards-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .kpi-card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 18px 20px;
    background: #FFFFFF;
    border: 1px solid #EDE8DE;
    border-radius: 12px;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.02);
    min-height: 146px;
  }

  .kpi-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .kpi-title {
    font-weight: 700;
    font-size: 10.5px;
    line-height: 14px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #8C857B;
  }

  .kpi-badge-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
  }

  .kpi-value-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin: 8px 0 10px;
  }

  .kpi-number-big {
    font-weight: 700;
    font-size: 26px;
    line-height: 32px;
    color: #111111;
    letter-spacing: -0.5px;
  }

  .kpi-unit-label {
    font-weight: 500;
    font-size: 13px;
    color: #78716C;
  }

  .kpi-code-big {
    font-weight: 700;
    font-size: 17.5px;
    line-height: 24px;
    color: #111111;
    letter-spacing: -0.2px;
  }

  .kpi-sub-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11.5px;
    line-height: 16px;
    color: #78716C;
    margin-bottom: 6px;
  }

  .kpi-progress-bar-track {
    width: 100%;
    height: 4px;
    border-radius: 9999px;
    background: #F0EDE6;
    overflow: hidden;
  }

  .kpi-progress-bar-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.3s ease;
  }

  /* Filters & Tabs Section */
  .filter-section-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .tab-filters-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tab-pill-btn {
    padding: 7px 16px;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 13px;
    line-height: 18px;
    color: #57534E;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-pill-btn:hover {
    background: #F0EDE6;
    color: #111111;
  }

  .tab-pill-btn.active {
    background: #111111;
    color: #FFFFFF;
    font-weight: 600;
  }

  /* Selection & Bulk action row */
  .selection-action-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .selection-count-text {
    font-weight: 400;
    font-size: 13px;
    color: #57534E;
  }

  .btn-delete-selected {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: #FFF1F2;
    border: 1px solid #FECDD3;
    border-radius: 6px;
    font-weight: 500;
    font-size: 12px;
    color: #E11D48;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-delete-selected:hover {
    background: #FFE4E6;
  }

  /* Search & Dropdown Filter Row */
  .search-filter-controls-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 8px;
    height: 40px;
    box-sizing: border-box;
  }

  .search-input-field {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    color: #1C1917;
  }

  .search-input-field::placeholder {
    color: #9CA3AF;
  }

  .custom-select-box {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 14px;
    height: 40px;
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 8px;
    font-size: 13px;
    color: #292524;
    cursor: pointer;
    min-width: 175px;
    position: relative;
    user-select: none;
  }

  /* Table Container */
  .voucher-table-card {
    box-sizing: border-box;
    width: 100%;
    background: #FFFFFF;
    border: 1px solid #EDE8DE;
    border-radius: 12px;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.02);
    overflow: hidden;
  }

  .voucher-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .voucher-table th {
    padding: 13px 18px;
    background: #FCFBF9;
    border-bottom: 1px solid #EDE8DE;
    font-weight: 700;
    font-size: 10.5px;
    line-height: 14px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #8C857B;
  }

  .voucher-table td {
    padding: 16px 18px;
    border-bottom: 1px solid #F2EFE9;
    vertical-align: middle;
    font-size: 13px;
  }

  .voucher-table tr:last-child td {
    border-bottom: none;
  }

  .voucher-table tr:hover td {
    background: #FAF8F5;
  }

  /* Table Checkbox */
  .styled-checkbox {
    width: 16px;
    height: 16px;
    border: 1px solid #D6D3CD;
    border-radius: 4px;
    cursor: pointer;
    accent-color: #111111;
  }

  /* Voucher Name & Badge cell */
  .voucher-cell-flex {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .voucher-badge {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    min-width: 38px;
    border-radius: 6px;
    text-align: center;
    font-weight: 700;
    line-height: 1.1;
  }

  .badge-top-text {
    font-size: 11px;
    font-weight: 700;
  }

  .badge-bottom-text {
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }

  /* Badge Color Variants */
  .badge-dark {
    background: #111111;
    color: #FFFFFF;
  }

  .badge-light {
    background: #F3F4F6;
    border: 1px solid #E5E7EB;
    color: #1F2937;
  }

  .badge-gold {
    background: #FEF3C7;
    border: 1px solid #FDE68A;
    color: #B45309;
  }

  .badge-blue {
    background: #EFF6FF;
    border: 1px solid #DBEAFE;
    color: #2563EB;
  }

  .badge-purple {
    background: #F3E8FF;
    border: 1px solid #E9D5FF;
    color: #7E22CE;
  }

  .badge-red {
    background: #FEE2E2;
    border: 1px solid #FECACA;
    color: #DC2626;
  }

  .voucher-info-col {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .voucher-code-text {
    font-weight: 700;
    font-size: 13.5px;
    line-height: 18px;
    color: #111111;
    cursor: pointer;
  }

  .voucher-desc-text {
    font-weight: 400;
    font-size: 12px;
    line-height: 16px;
    color: #78716C;
  }

  .text-primary-val {
    font-weight: 600;
    font-size: 13px;
    line-height: 18px;
    color: #111111;
  }

  .text-secondary-sub {
    font-weight: 400;
    font-size: 12px;
    line-height: 16px;
    color: #78716C;
  }

  /* Usage Bar in Table */
  .usage-cell-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 135px;
  }

  .usage-numbers-row {
    display: flex;
    align-items: baseline;
    gap: 3px;
    font-size: 12.5px;
    line-height: 16px;
  }

  .usage-bar-track {
    width: 100%;
    height: 4px;
    background: #E8E5DD;
    border-radius: 9999px;
    overflow: hidden;
  }

  .usage-bar-fill {
    height: 100%;
    border-radius: 9999px;
  }

  /* Table Footer / Pagination */
  .table-pagination-footer {
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    background: #FFFFFF;
    border-top: 1px solid #EDE8DE;
  }

  .pagination-info-text {
    font-weight: 400;
    font-size: 13px;
    color: #78716C;
  }

  .pagination-buttons-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-page-nav {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 6px;
    font-weight: 500;
    font-size: 12.5px;
    color: #44403C;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-page-nav:hover:not(:disabled) {
    background: #F5F4EF;
    border-color: #D6D3CD;
  }

  .btn-page-nav:disabled {
    color: #A8A29E;
    border-color: #EFECE6;
    cursor: not-allowed;
    background: #FAF8F5;
  }

  .btn-page-number {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    font-weight: 500;
    font-size: 13px;
    color: #44403C;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-page-number:hover {
    background: #F0EDE6;
  }

  .btn-page-number.active {
    background: #111111;
    color: #FFFFFF;
    font-weight: 600;
  }

  /* Modal Overlays */
  .modal-overlay-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  }

  .modal-window-card {
    background: #FFFFFF;
    border-radius: 14px;
    width: 100%;
    max-width: 620px;
    box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.15);
    border: 1px solid #EDE8DE;
    overflow: hidden;
    animation: modalPop 0.2s ease-out;
  }

  @keyframes modalPop {
    from {
      opacity: 0;
      transform: scale(0.97);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .modal-head-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid #EDE8DE;
    background: #FCFBF9;
  }

  .modal-title-text {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 19px;
    color: #111111;
    margin: 0;
  }

  .modal-btn-close {
    background: transparent;
    border: none;
    color: #78716C;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 6px;
    transition: background 0.15s;
  }

  .modal-btn-close:hover {
    background: #EFECE6;
    color: #111111;
  }

  .modal-form-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 75vh;
    overflow-y: auto;
  }

  .form-row-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .form-group-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label-txt {
    font-weight: 600;
    font-size: 12px;
    color: #44403C;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .form-input-ctrl {
    box-sizing: border-box;
    width: 100%;
    padding: 9px 12px;
    background: #FFFFFF;
    border: 1px solid #D6D3CD;
    border-radius: 7px;
    font-size: 13px;
    color: #1C1917;
    outline: none;
    transition: border-color 0.15s;
  }

  .form-input-ctrl:focus {
    border-color: #111111;
    box-shadow: 0 0 0 2px rgba(17, 17, 17, 0.08);
  }

  .modal-actions-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid #EDE8DE;
    background: #FAF8F5;
  }
`;

export default function VoucherManager() {
  const { showSuccess, showError, showInfo } = useToast();

  // State management
  const [vouchers, setVouchers] = useState(INITIAL_VOUCHERS);
  const [activeTab, setActiveTab] = useState('all'); // all, active, upcoming, expired
  const [searchQuery, setSearchQuery] = useState('');
  const [offerTypeFilter, setOfferTypeFilter] = useState('all'); // all, percent, fixed, shipping
  const [sortBy, setSortBy] = useState('newest'); // newest, usage, discount
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeVoucherDetail, setActiveVoucherDetail] = useState(null);

  // New Voucher form state
  const [newVoucher, setNewVoucher] = useState({
    code: '',
    name: '',
    discountType: 'percent',
    discountValue: '',
    maxDiscount: '',
    minOrder: '',
    totalLimit: 500,
    startDate: '',
    endDate: '',
    categoryLimit: 'Ready-To-Wear',
  });

  // Filter vouchers based on tab, search query, offerType
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(item => {
      // Tab filter
      if (activeTab === 'active' && item.statusTab !== 'active') return false;
      if (activeTab === 'upcoming' && item.statusTab !== 'upcoming') return false;
      if (activeTab === 'expired' && item.statusTab !== 'expired') return false;

      // Offer type filter
      if (offerTypeFilter !== 'all' && item.discountType !== offerTypeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchName = item.name.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'usage') return b.usedCount - a.usedCount;
      if (sortBy === 'limit') return b.totalLimit - a.totalLimit;
      return 0; // default newest
    });
  }, [vouchers, activeTab, searchQuery, offerTypeFilter, sortBy]);

  // Paginated items
  const totalItems = filteredVouchers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedVouchers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVouchers.slice(start, start + pageSize);
  }, [filteredVouchers, currentPage]);

  // Handle select all checkbox
  const isAllSelected = paginatedVouchers.length > 0 && paginatedVouchers.every(v => selectedIds.has(v.id));
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      paginatedVouchers.forEach(v => next.add(v.id));
      setSelectedIds(next);
    }
  };

  // Handle single item checkbox
  const handleToggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Bulk delete selected vouchers
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) {
      showInfo('Chưa chọn mã voucher nào để xóa.');
      return;
    }
    const count = selectedIds.size;
    setVouchers(prev => prev.filter(v => !selectedIds.has(v.id)));
    setSelectedIds(new Set());
    showSuccess(`Đã xóa thành công ${count} mã voucher đã chọn!`);
  };

  // Handle create new voucher
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newVoucher.code.trim()) {
      showError('Vui lòng nhập mã voucher!');
      return;
    }
    if (!newVoucher.name.trim()) {
      showError('Vui lòng nhập tên chương trình!');
      return;
    }

    const createdItem = {
      id: `v_${Date.now()}`,
      code: newVoucher.code.toUpperCase().trim(),
      name: newVoucher.name.trim(),
      badgeType: newVoucher.discountType === 'percent' ? 'dark' : newVoucher.discountType === 'fixed' ? 'gold' : 'blue',
      badgeTop: newVoucher.discountType === 'percent' ? `${newVoucher.discountValue || 15}%` : 'HOT',
      badgeBottom: newVoucher.discountType === 'shipping' ? 'FREE' : 'SALE',
      discountType: newVoucher.discountType,
      discountDisplay: newVoucher.discountType === 'percent' ? `Giảm ${newVoucher.discountValue || 15}%` : `Giảm ${newVoucher.discountValue || '200.000'}₫`,
      discountSub: newVoucher.maxDiscount ? `Tối đa ${newVoucher.maxDiscount}₫` : 'Trừ trực tiếp',
      conditionDisplay: newVoucher.minOrder ? `Đơn từ ${newVoucher.minOrder}₫` : 'Không giới hạn',
      conditionSub: newVoucher.categoryLimit || 'Áp dụng toàn bộ kho',
      usedCount: 0,
      totalLimit: Number(newVoucher.totalLimit) || 500,
      progressPercent: 0,
      progressColor: '#111111',
      validityDisplay: newVoucher.startDate && newVoucher.endDate ? `${newVoucher.startDate} - ${newVoucher.endDate}` : '30 ngày kể từ kích hoạt',
      statusText: 'Đang áp dụng',
      statusColor: '#059669',
      statusTab: 'active',
    };

    setVouchers([createdItem, ...vouchers]);
    setIsCreateOpen(false);
    setNewVoucher({
      code: '',
      name: '',
      discountType: 'percent',
      discountValue: '',
      maxDiscount: '',
      minOrder: '',
      totalLimit: 500,
      startDate: '',
      endDate: '',
      categoryLimit: 'Ready-To-Wear',
    });
    showSuccess(`Đã tạo và kích hoạt mã voucher "${createdItem.code}" thành công!`);
  };

  // Open voucher detail modal
  const handleOpenDetail = (voucher) => {
    setActiveVoucherDetail(voucher);
    setIsDetailOpen(true);
  };

  return (
    <div className="manager-layout">
      <style>{voucherPageStyles}</style>

      {/* Left Sidebar matching exact active menu */}
      <ManagerSidebar activeMenu="vouchers" />

      {/* Main Content Area */}
      <div className="main-content-area">
        {/* Top Header Bar with User identity matching screenshot */}
        <ManagerHeader 
          showSearch={false}
          userName="Hoàng Kim Anh"
          userRole="Quản Lý Cửa Hàng & Bán Hàng"
        />

        {/* Scrollable Voucher Body */}
        <div className="voucher-scroll-body">
          {/* 1. Header Title & Actions Row */}
          <div className="voucher-header-row">
            <div className="voucher-title-section">
              <h1 className="voucher-main-title">Voucher & Chương Trình Khuyến Mãi</h1>
              <p className="voucher-subtitle">
                Thiết lập chính sách giảm giá, mã tri ân khách hàng thân thiết và tối ưu chuyển đổi mua sắm
              </p>
            </div>

            <div className="voucher-header-actions">
              <button 
                type="button" 
                className="btn-history-pill"
                onClick={() => setIsHistoryOpen(true)}
              >
                <Clock size={16} color="#44403C" />
                <span>Lịch Sử Áp Dụng Mã</span>
              </button>

              <button 
                type="button" 
                className="btn-create-pill"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Tạo Voucher Mới</span>
              </button>
            </div>
          </div>

          {/* 2. Four KPI / Metric Cards */}
          <div className="kpi-cards-grid">
            {/* Card 1: TỔNG VOUCHER HOẠT ĐỘNG */}
            <div className="kpi-card">
              <div className="kpi-header-row">
                <span className="kpi-title">TỔNG VOUCHER HOẠT ĐỘNG</span>
                <div className="kpi-badge-icon" style={{ background: '#F5F4EF' }}>
                  <Tag size={15} color="#78716C" />
                </div>
              </div>

              <div className="kpi-value-row">
                <span className="kpi-number-big">18</span>
                <span className="kpi-unit-label">Mã</span>
              </div>

              <div>
                <div className="kpi-sub-row">
                  <span style={{ color: '#111111', fontWeight: 500 }}>Đang áp dụng: 14</span>
                  <span style={{ color: '#78716C' }}>Dự kiến: 04</span>
                </div>
                <div className="kpi-progress-bar-track">
                  <div 
                    className="kpi-progress-bar-fill" 
                    style={{ width: `${(14 / 18) * 100}%`, background: '#111111' }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: DOANH SỐ TỪ VOUCHER */}
            <div className="kpi-card">
              <div className="kpi-header-row">
                <span className="kpi-title">DOANH SỐ TỪ VOUCHER</span>
                <div className="kpi-badge-icon" style={{ background: '#FEF3C7', color: '#D97706', fontWeight: 700, fontSize: '13px' }}>
                  ₫
                </div>
              </div>

              <div className="kpi-value-row">
                <span className="kpi-number-big">645.800.000<u style={{ textDecorationThickness: '1.5px', marginLeft: 2 }}>đ</u></span>
              </div>

              <div>
                <div className="kpi-sub-row">
                  <span>Chiếm <strong style={{ color: '#D97706' }}>34.8%</strong> tổng doanh thu</span>
                </div>
                <div className="kpi-progress-bar-track" style={{ background: '#FEF3C7' }}>
                  <div 
                    className="kpi-progress-bar-fill" 
                    style={{ width: '34.8%', background: '#F59E0B' }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: LƯỢT ĐÃ ĐỔI / ÁP DỤNG */}
            <div className="kpi-card">
              <div className="kpi-header-row">
                <span className="kpi-title">LƯỢT ĐÃ ĐỔI / ÁP DỤNG</span>
                <div className="kpi-badge-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                  <TrendingUp size={15} color="#10B981" />
                </div>
              </div>

              <div className="kpi-value-row">
                <span className="kpi-number-big">1.240</span>
                <span className="kpi-unit-label">Lượt</span>
              </div>

              <div>
                <div className="kpi-sub-row">
                  <span>Tỷ lệ sử dụng voucher</span>
                  <strong style={{ color: '#10B981', fontWeight: 600 }}>78.5%</strong>
                </div>
                <div className="kpi-progress-bar-track" style={{ background: '#D1FAE5' }}>
                  <div 
                    className="kpi-progress-bar-fill" 
                    style={{ width: '78.5%', background: '#10B981' }}
                  />
                </div>
              </div>
            </div>

            {/* Card 4: VOUCHER HIỆU QUẢ NHẤT */}
            <div className="kpi-card">
              <div className="kpi-header-row">
                <span className="kpi-title">VOUCHER HIỆU QUẢ NHẤT</span>
                <div className="kpi-badge-icon" style={{ background: '#FEF3C7' }}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                </div>
              </div>

              <div className="kpi-value-row">
                <span className="kpi-code-big">YOUTH-WELCOME20</span>
              </div>

              <div>
                <div className="kpi-sub-row">
                  <span style={{ color: '#111111', fontWeight: 500 }}>412 lượt dùng</span>
                  <strong style={{ color: '#111111', fontWeight: 600 }}>218.000.000₫</strong>
                </div>
                <div className="kpi-progress-bar-track" style={{ background: '#E0F2FE' }}>
                  <div 
                    className="kpi-progress-bar-fill" 
                    style={{ width: '68%', background: '#0D9488' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Filters & Tabs Section */}
          <div className="filter-section-wrapper">
            {/* Status Filter Tabs */}
            <div className="tab-filters-row">
              <button 
                type="button" 
                className={`tab-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              >
                Tất cả (18)
              </button>
              <button 
                type="button" 
                className={`tab-pill-btn ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
              >
                Đang diễn ra (14)
              </button>
              <button 
                type="button" 
                className={`tab-pill-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => { setActiveTab('upcoming'); setCurrentPage(1); }}
              >
                Sắp diễn ra (04)
              </button>
              <button 
                type="button" 
                className={`tab-pill-btn ${activeTab === 'expired' ? 'active' : ''}`}
                onClick={() => { setActiveTab('expired'); setCurrentPage(1); }}
              >
                Đã kết thúc (22)
              </button>
            </div>

            {/* Selection Status & Batch Delete Row */}
            <div className="selection-action-row">
              <span className="selection-count-text">
                Đã chọn: <strong>{selectedIds.size} mục</strong>
              </span>

              <button 
                type="button" 
                className="btn-delete-selected"
                onClick={handleDeleteSelected}
              >
                <Trash2 size={13} color="#E11D48" />
                <span>Xóa các mục đã chọn</span>
              </button>
            </div>

            {/* Search Input & Dropdowns Row */}
            <div className="search-filter-controls-row">
              {/* Search Box */}
              <div className="search-input-wrapper">
                <Search size={16} color="#A8A29E" />
                <input
                  type="text"
                  className="search-input-field"
                  placeholder="Lọc theo mã voucher, tên chiến dịch..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>

              {/* Offer Type Dropdown */}
              <div 
                className="custom-select-box"
                onClick={() => {
                  const types = ['all', 'percent', 'fixed', 'shipping'];
                  const curIdx = types.indexOf(offerTypeFilter);
                  const next = types[(curIdx + 1) % types.length];
                  setOfferTypeFilter(next);
                  setCurrentPage(1);
                }}
                title="Nhấn để chuyển đổi loại ưu đãi"
              >
                <span>
                  Loại ưu đãi: {
                    offerTypeFilter === 'all' ? 'Tất cả' :
                    offerTypeFilter === 'percent' ? 'Giảm %' :
                    offerTypeFilter === 'fixed' ? 'Giảm tiền' : 'Freeship'
                  }
                </span>
                <ChevronDown size={15} color="#78716C" />
              </div>

              {/* Sort By Dropdown */}
              <div 
                className="custom-select-box"
                onClick={() => {
                  const sorts = ['newest', 'usage', 'limit'];
                  const curIdx = sorts.indexOf(sortBy);
                  const next = sorts[(curIdx + 1) % sorts.length];
                  setSortBy(next);
                }}
                title="Nhấn để sắp xếp"
              >
                <span>
                  Sắp xếp: {
                    sortBy === 'newest' ? 'Mới cập nhật nhất' :
                    sortBy === 'usage' ? 'Lượt dùng nhiều nhất' : 'Giới hạn cao nhất'
                  }
                </span>
                <ChevronDown size={15} color="#78716C" />
              </div>
            </div>
          </div>

          {/* 4. Voucher Data Table Card */}
          <div className="voucher-table-card">
            <table className="voucher-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      className="styled-checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th style={{ width: '32%' }}>MÃ VOUCHER & TÊN CHƯƠNG TRÌNH</th>
                  <th style={{ width: '18%' }}>LOẠI ƯU ĐÃI</th>
                  <th style={{ width: '18%' }}>ĐIỀU KIỆN ÁP DỤNG</th>
                  <th style={{ width: '16%' }}>ĐÃ DÙNG / GIỚI HẠN</th>
                  <th style={{ width: '16%' }}>THỜI GIAN HIỆU LỰC</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVouchers.map((v) => {
                  const isChecked = selectedIds.has(v.id);
                  return (
                    <tr key={v.id} style={{ background: isChecked ? '#FFFDF7' : undefined }}>
                      {/* Checkbox */}
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          className="styled-checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(v.id)}
                        />
                      </td>

                      {/* Mã Voucher & Tên Chương Trình */}
                      <td>
                        <div className="voucher-cell-flex">
                          {/* Badge with exact design colors */}
                          <div className={`voucher-badge badge-${v.badgeType}`}>
                            {v.badgeIcon === 'truck' ? (
                              <>
                                <Truck size={15} color="#2563EB" />
                                <span className="badge-bottom-text">{v.badgeBottom}</span>
                              </>
                            ) : (
                              <>
                                <span className="badge-top-text">{v.badgeTop}</span>
                                <span className="badge-bottom-text">{v.badgeBottom}</span>
                              </>
                            )}
                          </div>

                          <div className="voucher-info-col">
                            <span 
                              className="voucher-code-text"
                              onClick={() => handleOpenDetail(v)}
                            >
                              {v.code}
                            </span>
                            <span className="voucher-desc-text">{v.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Loại Ưu Đãi */}
                      <td>
                        <div className="voucher-info-col">
                          <span className="text-primary-val">{v.discountDisplay}</span>
                          <span className="text-secondary-sub">{v.discountSub}</span>
                        </div>
                      </td>

                      {/* Điều Kiện Áp Dụng */}
                      <td>
                        <div className="voucher-info-col">
                          <span className="text-primary-val" style={{ fontWeight: 500 }}>{v.conditionDisplay}</span>
                          <span className="text-secondary-sub">{v.conditionSub}</span>
                        </div>
                      </td>

                      {/* Đã Dùng / Giới Hạn */}
                      <td>
                        <div className="usage-cell-wrapper">
                          <div className="usage-numbers-row">
                            <span 
                              style={{ 
                                fontWeight: 700, 
                                color: v.id === 'v3' ? '#D97706' : v.id === 'v6' ? '#EF4444' : '#111111' 
                              }}
                            >
                              {v.usedCount}
                            </span>
                            <span style={{ color: '#78716C', fontSize: '12px' }}>
                              / {v.totalLimit.toLocaleString('vi-VN')} lượt
                            </span>
                          </div>
                          <div className="usage-bar-track">
                            <div 
                              className="usage-bar-fill" 
                              style={{ 
                                width: `${Math.min(100, v.progressPercent)}%`, 
                                background: v.progressColor 
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Thời Gian Hiệu Lực */}
                      <td>
                        <div className="voucher-info-col">
                          <span className="text-primary-val" style={{ fontWeight: 500 }}>{v.validityDisplay}</span>
                          <span 
                            style={{ 
                              fontWeight: 600, 
                              fontSize: '12px', 
                              color: v.statusColor 
                            }}
                          >
                            {v.statusText}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedVouchers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#78716C' }}>
                      Không tìm thấy mã voucher nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Table Footer Pagination */}
            <div className="table-pagination-footer">
              <span className="pagination-info-text">
                Hiển thị 1 - {paginatedVouchers.length} trong tổng số <strong>18</strong> voucher
              </span>

              <div className="pagination-buttons-group">
                <button 
                  type="button" 
                  className="btn-page-nav"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  &lt; Trang trước
                </button>

                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`btn-page-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  type="button" 
                  className="btn-page-nav"
                  disabled={currentPage >= 3}
                  onClick={() => setCurrentPage(prev => Math.min(3, prev + 1))}
                >
                  Trang sau &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: TẠO VOUCHER MỚI */}
      {isCreateOpen && (
        <div className="modal-overlay-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-window-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head-bar">
              <h3 className="modal-title-text">Tạo Voucher Khuyến Mãi Mới</h3>
              <button type="button" className="modal-btn-close" onClick={() => setIsCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-form-body">
                <div className="form-row-2col">
                  <div className="form-group-item">
                    <label className="form-label-txt">Mã Voucher (Code) *</label>
                    <input 
                      type="text" 
                      className="form-input-ctrl"
                      placeholder="VD: YF-SUMMER25"
                      value={newVoucher.code}
                      onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-txt">Loại Ưu Đãi *</label>
                    <select 
                      className="form-input-ctrl"
                      value={newVoucher.discountType}
                      onChange={(e) => setNewVoucher({ ...newVoucher, discountType: e.target.value })}
                    >
                      <option value="percent">Giảm Theo Phần Trăm (%)</option>
                      <option value="fixed">Giảm Theo Số Tiền Cố Định (₫)</option>
                      <option value="shipping">Miễn Phí Vận Chuyển (Freeship)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-label-txt">Tên Chương Trình / Chiến Dịch *</label>
                  <input 
                    type="text" 
                    className="form-input-ctrl"
                    placeholder="VD: Siêu Ưu Đãi Mùa Lễ Hội YOUTH FASHION"
                    value={newVoucher.name}
                    onChange={(e) => setNewVoucher({ ...newVoucher, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row-2col">
                  <div className="form-group-item">
                    <label className="form-label-txt">Giá Trị Giảm</label>
                    <input 
                      type="text" 
                      className="form-input-ctrl"
                      placeholder={newVoucher.discountType === 'percent' ? 'VD: 20' : 'VD: 200.000'}
                      value={newVoucher.discountValue}
                      onChange={(e) => setNewVoucher({ ...newVoucher, discountValue: e.target.value })}
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-txt">Giảm Tối Đa (₫)</label>
                    <input 
                      type="text" 
                      className="form-input-ctrl"
                      placeholder="VD: 500.000"
                      value={newVoucher.maxDiscount}
                      onChange={(e) => setNewVoucher({ ...newVoucher, maxDiscount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group-item">
                    <label className="form-label-txt">Đơn Hàng Tối Thiểu (₫)</label>
                    <input 
                      type="text" 
                      className="form-input-ctrl"
                      placeholder="VD: 1.500.000"
                      value={newVoucher.minOrder}
                      onChange={(e) => setNewVoucher({ ...newVoucher, minOrder: e.target.value })}
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-txt">Giới Hạn Lượt Dùng</label>
                    <input 
                      type="number" 
                      className="form-input-ctrl"
                      placeholder="VD: 500"
                      value={newVoucher.totalLimit}
                      onChange={(e) => setNewVoucher({ ...newVoucher, totalLimit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group-item">
                    <label className="form-label-txt">Ngày Bắt Đầu</label>
                    <input 
                      type="text" 
                      className="form-input-ctrl"
                      placeholder="15/10/2025"
                      value={newVoucher.startDate}
                      onChange={(e) => setNewVoucher({ ...newVoucher, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-txt">Ngày Kết Thúc</label>
                    <input 
                      type="text" 
                      className="form-input-ctrl"
                      placeholder="15/11/2025"
                      value={newVoucher.endDate}
                      onChange={(e) => setNewVoucher({ ...newVoucher, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions-footer">
                <button 
                  type="button" 
                  className="btn-history-pill" 
                  style={{ height: '36px' }}
                  onClick={() => setIsCreateOpen(false)}
                >
                  Hủy Bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn-create-pill"
                  style={{ height: '36px' }}
                >
                  <CheckCircle size={15} />
                  Kích Hoạt Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LỊCH SỬ ÁP DỤNG MÃ */}
      {isHistoryOpen && (
        <div className="modal-overlay-backdrop" onClick={() => setIsHistoryOpen(false)}>
          <div className="modal-window-card" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head-bar">
              <h3 className="modal-title-text">Lịch Sử Áp Dụng Mã Khuyến Mãi Gần Đây</h3>
              <button type="button" className="modal-btn-close" onClick={() => setIsHistoryOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
              <table className="voucher-table" style={{ border: '1px solid #EDE8DE', borderRadius: '8px' }}>
                <thead>
                  <tr>
                    <th>MÃ VOUCHER</th>
                    <th>KHÁCH HÀNG</th>
                    <th>MÃ ĐƠN</th>
                    <th>GIẢM GIÁ</th>
                    <th>THỜI GIAN</th>
                    <th>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_HISTORY.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 700, color: '#111111' }}>{log.code}</td>
                      <td>{log.customer}</td>
                      <td style={{ color: '#2563EB', fontWeight: 600 }}>{log.orderId}</td>
                      <td style={{ color: '#DC2626', fontWeight: 600 }}>-{log.discount}</td>
                      <td style={{ color: '#78716C', fontSize: '12px' }}>{log.time}</td>
                      <td>
                        <span style={{ color: '#059669', fontSize: '12px', fontWeight: 600, background: '#ECFDF5', padding: '3px 8px', borderRadius: '9999px' }}>
                          Thành công
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions-footer">
              <button 
                type="button" 
                className="btn-create-pill"
                style={{ height: '36px' }}
                onClick={() => setIsHistoryOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CHI TIẾT VOUCHER */}
      {isDetailOpen && activeVoucherDetail && (
        <div className="modal-overlay-backdrop" onClick={() => setIsDetailOpen(false)}>
          <div className="modal-window-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head-bar">
              <h3 className="modal-title-text">Chi Tiết Voucher {activeVoucherDetail.code}</h3>
              <button type="button" className="modal-btn-close" onClick={() => setIsDetailOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: '#F8F7F4', borderRadius: '10px' }}>
                <div className={`voucher-badge badge-${activeVoucherDetail.badgeType}`} style={{ width: 48, height: 48 }}>
                  <span className="badge-top-text" style={{ fontSize: 13 }}>{activeVoucherDetail.badgeTop}</span>
                  <span className="badge-bottom-text">{activeVoucherDetail.badgeBottom}</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111' }}>{activeVoucherDetail.code}</h4>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#78716C' }}>{activeVoucherDetail.name}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div style={{ padding: 12, border: '1px solid #EDE8DE', borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: '#8C857B', fontWeight: 700, textTransform: 'uppercase' }}>Loại Giảm Giá</span>
                  <div style={{ fontWeight: 600, color: '#111', marginTop: 4 }}>{activeVoucherDetail.discountDisplay}</div>
                  <div style={{ fontSize: 12, color: '#78716C' }}>{activeVoucherDetail.discountSub}</div>
                </div>

                <div style={{ padding: 12, border: '1px solid #EDE8DE', borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: '#8C857B', fontWeight: 700, textTransform: 'uppercase' }}>Điều Kiện</span>
                  <div style={{ fontWeight: 600, color: '#111', marginTop: 4 }}>{activeVoucherDetail.conditionDisplay}</div>
                  <div style={{ fontSize: 12, color: '#78716C' }}>{activeVoucherDetail.conditionSub}</div>
                </div>

                <div style={{ padding: 12, border: '1px solid #EDE8DE', borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: '#8C857B', fontWeight: 700, textTransform: 'uppercase' }}>Tiến Độ Sử Dụng</span>
                  <div style={{ fontWeight: 600, color: '#111', marginTop: 4 }}>
                    {activeVoucherDetail.usedCount} / {activeVoucherDetail.totalLimit} lượt
                  </div>
                  <div style={{ fontSize: 12, color: '#78716C' }}>{activeVoucherDetail.progressPercent.toFixed(1)}% hoàn thành</div>
                </div>

                <div style={{ padding: 12, border: '1px solid #EDE8DE', borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: '#8C857B', fontWeight: 700, textTransform: 'uppercase' }}>Hiệu Lực</span>
                  <div style={{ fontWeight: 600, color: '#111', marginTop: 4 }}>{activeVoucherDetail.validityDisplay}</div>
                  <div style={{ fontSize: 12, color: activeVoucherDetail.statusColor, fontWeight: 600 }}>{activeVoucherDetail.statusText}</div>
                </div>
              </div>
            </div>

            <div className="modal-actions-footer">
              <button 
                type="button" 
                className="btn-create-pill"
                style={{ height: '36px' }}
                onClick={() => setIsDetailOpen(false)}
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

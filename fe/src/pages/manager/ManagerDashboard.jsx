import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';
import { orderService } from '../../services/orderService';
import { adminService } from '../../services/adminService';
import { ensureOrderCacheReset } from '../../utils/orderCacheReset';
import {
  mergeAndNormalizeOrders,
  summarizePeriod,
  toLocalDateInputValue,
  buildOverviewChartSeries,
  buildTopProducts,
} from '../../utils/orderReportUtils';
import { resolveOrderItemImage } from '../../utils/productImageUtils';
import {
  Wallet,
  ShoppingBag,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Loader2,
} from 'lucide-react';

const MONTHLY_REVENUE_TARGET = 2_000_000_000;

const CHART_WIDTH = 860;
const CHART_HEIGHT = 270;
const PAD_LEFT = 54;
const PAD_RIGHT = 24;
const PAD_TOP = 32;
const PAD_BOTTOM = 38;
const PLOT_W = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

const dashboardStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&display=swap');

  .md-layout {
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

  .md-main-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 100vh;
    background: #F7F6F3;
    box-sizing: border-box;
  }

  .md-scroll-body {
    display: flex;
    flex-direction: column;
    padding: 28px 36px 52px;
    gap: 22px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Page Title */
  .md-kicker {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.9px;
    text-transform: uppercase;
    color: #8C857B;
    margin: 0;
  }

  .md-page-title {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 30px;
    line-height: 38px;
    color: #111111;
    margin: 4px 0 0 0;
  }

  /* Top 3 KPI Summary Cards */
  .md-kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    width: 100%;
  }

  .md-kpi-card {
    background: #FFFFFF;
    border: 1px solid #EAE7DF;
    border-radius: 16px;
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 168px;
    box-sizing: border-box;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .md-kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .md-kpi-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #78716C;
    margin: 0;
  }

  .md-kpi-icon-gold {
    width: 32px;
    height: 32px;
    border-radius: 9999px;
    background: #FAF3E1;
    color: #B48938;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .md-kpi-icon-neutral {
    width: 32px;
    height: 32px;
    border-radius: 9999px;
    background: #F4F3F0;
    color: #57534E;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .md-kpi-value-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: 10px;
    font-weight: 700;
    font-size: 26px;
    line-height: 32px;
    color: #111111;
    letter-spacing: -0.4px;
  }

  .md-kpi-unit {
    font-size: 12.5px;
    font-weight: 600;
    color: #78716C;
  }

  .md-kpi-currency-mark {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .md-kpi-sub-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    font-size: 12px;
    color: #78716C;
    flex-wrap: wrap;
  }

  .md-growth-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
  }

  .md-growth-pill.up {
    background: #ECFDF5;
    color: #15803D;
  }

  .md-growth-pill.down {
    background: #FEF2F2;
    color: #DC2626;
  }

  .md-growth-pill.muted {
    background: #F3F4F6;
    color: #6B7280;
  }

  .md-kpi-footer {
    margin-top: 16px;
  }

  .md-kpi-footer-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11.5px;
    color: #78716C;
    margin-bottom: 7px;
  }

  .md-kpi-footer-meta strong {
    color: #111111;
    font-weight: 700;
  }

  .md-progress-track {
    width: 100%;
    height: 5px;
    background: #F1EFEA;
    border-radius: 9999px;
    overflow: hidden;
  }

  .md-progress-fill-dark {
    height: 100%;
    background: #111111;
    border-radius: 9999px;
    transition: width 0.35s ease;
  }

  .md-progress-fill-amber {
    height: 100%;
    background: #EAB308;
    border-radius: 9999px;
    transition: width 0.35s ease;
  }

  /* Chart Card */
  .md-card {
    background: #FFFFFF;
    border: 1px solid #EAE7DF;
    border-radius: 18px;
    padding: 24px 26px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    box-sizing: border-box;
    width: 100%;
  }

  .md-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .md-chart-title-wrap {
    max-width: 520px;
  }

  .md-section-title {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 19px;
    line-height: 26px;
    color: #111111;
    margin: 0;
  }

  .md-section-subtitle {
    font-size: 12.5px;
    line-height: 18px;
    color: #6B7280;
    margin: 6px 0 0 0;
  }

  .md-chart-controls-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  .md-legend-row {
    display: flex;
    align-items: center;
    gap: 18px;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
  }

  .md-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .md-legend-dot-dark {
    width: 9px;
    height: 9px;
    border-radius: 9999px;
    background: #111111;
  }

  .md-legend-dot-gold {
    width: 9px;
    height: 9px;
    border-radius: 9999px;
    background: #EAB308;
  }

  .md-tabs-segmented {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    background: #F4F3F0;
    border-radius: 10px;
    flex-wrap: wrap;
  }

  .md-tab-btn {
    border: none;
    background: transparent;
    padding: 6px 14px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 600;
    color: #6B7280;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .md-tab-btn:hover {
    color: #111111;
  }

  .md-tab-btn.active {
    background: #FFFFFF;
    color: #111111;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .md-chart-stage {
    position: relative;
    width: 100%;
    padding-top: 12px;
    user-select: none;
  }

  .md-tooltip-float {
    position: absolute;
    background: #18181B;
    color: #FFFFFF;
    border-radius: 10px;
    padding: 11px 15px;
    min-width: 215px;
    pointer-events: none;
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.22);
    z-index: 20;
    transition: left 0.12s ease, top 0.12s ease;
  }

  .md-tooltip-kicker {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.4px;
    color: #FBBF24;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .md-tooltip-rev {
    font-size: 18px;
    font-weight: 700;
    color: #FFFFFF;
    line-height: 24px;
  }

  .md-tooltip-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-top: 6px;
    font-size: 11.5px;
  }

  .md-tooltip-orders {
    color: #D4D4D8;
  }

  .md-tooltip-aov {
    color: #34D399;
    font-weight: 700;
  }

  .md-empty-chart-overlay {
    position: absolute;
    left: 50%;
    top: 44%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid #EAE7DF;
    padding: 10px 18px;
    border-radius: 9999px;
    font-size: 12.5px;
    font-weight: 600;
    color: #78716C;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    pointer-events: none;
    white-space: nowrap;
  }

  /* Top Products Card */
  .md-top-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 12px;
  }

  .md-view-all-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: #111111;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    padding: 4px 0;
    white-space: nowrap;
  }

  .md-view-all-btn:hover {
    text-decoration: underline;
  }

  .md-product-list {
    display: flex;
    flex-direction: column;
  }

  .md-product-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 15px 0;
    border-bottom: 1px solid #F3F1EC;
  }

  .md-product-row:last-child {
    border-bottom: none;
    padding-bottom: 4px;
  }

  .md-product-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    flex: 1;
  }

  .md-product-thumb {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    object-fit: cover;
    background: #F4F3F0;
    border: 1px solid #EAE7DF;
    flex-shrink: 0;
  }

  .md-product-name {
    font-size: 13.5px;
    font-weight: 700;
    color: #111111;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .md-product-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    font-size: 11.5px;
    color: #8C857B;
    flex-wrap: wrap;
  }

  .md-sku-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    border-radius: 4px;
    background: #F3F4F6;
    color: #4B5563;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  .md-product-metrics {
    display: flex;
    align-items: center;
    gap: 36px;
    text-align: right;
    flex-shrink: 0;
  }

  .md-metric-primary {
    font-size: 13.5px;
    font-weight: 700;
    color: #111111;
  }

  .md-metric-primary.green {
    color: #15803D;
  }

  .md-metric-sub {
    font-size: 11.5px;
    color: #8C857B;
    margin-top: 2px;
  }

  .md-empty-products {
    padding: 32px 16px;
    text-align: center;
    color: #78716C;
    font-size: 13px;
  }

  @media (max-width: 1100px) {
    .md-kpi-grid {
      grid-template-columns: 1fr;
    }
    .md-chart-controls-col {
      align-items: flex-start;
    }
  }

  @media (max-width: 768px) {
    .md-scroll-body {
      padding: 20px 16px 40px;
    }
    .md-product-row {
      flex-direction: column;
      align-items: flex-start;
    }
    .md-product-metrics {
      width: 100%;
      justify-content: space-between;
      gap: 16px;
      text-align: left;
    }
  }

  @keyframes mdSpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .md-spin {
    animation: mdSpin 1s linear infinite;
  }
`;

const computeNiceAxisMax = (maxVal) => {
  if (!maxVal || maxVal <= 0) return 100_000_000;
  const padded = maxVal * 1.15;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  const normalized = padded / magnitude;
  const steps = [1, 1.2, 1.6, 2, 2.5, 4, 5, 8, 10];
  const niceFactor = steps.find((s) => normalized <= s) || 10;
  return niceFactor * magnitude;
};

const formatAxisMoney = (value) => {
  if (value === 0) return '0₫';
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return `${Math.round(value)}`;
};

const formatMoneyUnderline = (val) => Math.round(Number(val || 0)).toLocaleString('vi-VN');

const buildSmoothLinePath = (points, yTop, yBottom) => {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const clampY = (val) => Math.max(yTop, Math.min(yBottom, val));
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = clampY(p2.y - (p3.y - p1.y) / 6);

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return path;
};

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [userMetrics, setUserMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('30d');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const prevYear = useMemo(() => new Date().getFullYear() - 1, []);

  // Kiểm tra quyền truy cập dành cho Admin và Manager
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
      showError('Chỉ tài khoản Quản trị (Admin / Manager) mới có quyền truy cập Tổng quan.');
      navigate('/', { replace: true });
    }
  }, [user, navigate, showError]);

  const loadDashboardData = useCallback(async () => {
    ensureOrderCacheReset();
    try {
      const [ordersRes, metricsRes] = await Promise.allSettled([
        orderService.getAllOrders(),
        adminService.getMetrics(),
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.status && Array.isArray(ordersRes.value.data)) {
        setOrders(mergeAndNormalizeOrders(ordersRes.value.data));
      } else {
        setOrders(mergeAndNormalizeOrders([]));
      }

      if (metricsRes.status === 'fulfilled' && metricsRes.value?.data) {
        setUserMetrics(metricsRes.value.data);
      }
    } catch {
      setOrders(mergeAndNormalizeOrders([]));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const handleSync = () => {
      loadDashboardData();
    };
    window.addEventListener('order_status_updated', handleSync);
    window.addEventListener('yf_order_status_changed', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('order_status_updated', handleSync);
      window.removeEventListener('yf_order_status_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadDashboardData]);

  // Chỉ số tháng hiện tại vs tháng trước (Doanh thu chỉ tính đơn đã hoàn thành)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayKey = toLocalDateInputValue(now);

    const monthStart = toLocalDateInputValue(new Date(year, month, 1));
    const prevMonthStart = toLocalDateInputValue(new Date(year, month - 1, 1));
    const prevMonthEnd = toLocalDateInputValue(new Date(year, month, 0));

    return summarizePeriod(orders, monthStart, todayKey, prevMonthStart, prevMonthEnd);
  }, [orders]);

  // Dữ liệu biểu đồ theo tab được chọn
  const chartData = useMemo(() => buildOverviewChartSeries(orders, chartMode), [orders, chartMode]);

  // Top 4 sản phẩm đóng góp doanh thu cao nhất từ đơn hoàn thành
  const topProductsResult = useMemo(() => buildTopProducts(orders, 4), [orders]);

  const yAxisMax = useMemo(() => computeNiceAxisMax(chartData.maxRevenue), [chartData.maxRevenue]);
  const maxBarOrders = Math.max(1, chartData.maxOrders);

  const chartPoints = useMemo(() => {
    const n = chartData.buckets.length;
    if (n === 0) return [];
    const slotW = PLOT_W / n;
    const barW = Math.max(6, Math.min(22, slotW * 0.42));

    return chartData.buckets.map((bucket, idx) => {
      const cx = PAD_LEFT + slotW * idx + slotW / 2;
      const revRatio = yAxisMax > 0 ? bucket.revenue / yAxisMax : 0;
      const ordRatio = bucket.ordersCount / maxBarOrders;
      const yLine = PAD_TOP + PLOT_H * (1 - revRatio);
      const barH = bucket.ordersCount > 0 ? Math.max(8, PLOT_H * 0.86 * ordRatio) : 0;
      const yBar = PAD_TOP + PLOT_H - barH;

      return {
        ...bucket,
        idx,
        x: cx,
        yLine,
        barX: cx - barW / 2,
        barW,
        yBar,
        barH,
      };
    });
  }, [chartData.buckets, yAxisMax, maxBarOrders]);

  const smoothPath = useMemo(
    () => buildSmoothLinePath(chartPoints.map((p) => ({ x: p.x, y: p.yLine })), PAD_TOP, PAD_TOP + PLOT_H),
    [chartPoints]
  );

  // Mặc định highlight ngày đỉnh (Peak) khi có doanh thu và người dùng chưa rê chuột
  const activePointIndex = hoveredIdx !== null ? hoveredIdx : chartData.peakIndex;
  const activePoint = activePointIndex >= 0 ? chartPoints[activePointIndex] : null;
  const hasAnyChartRevenue = chartData.maxRevenue > 0;

  const revenueGoalPct = Math.min(100, (monthlyStats.totalRevenue / MONTHLY_REVENUE_TARGET) * 100);
  const currentMonthNumber = new Date().getMonth() + 1;

  const tooltipLeftPct = activePoint
    ? Math.max(15, Math.min(85, (activePoint.x / CHART_WIDTH) * 100))
    : 50;
  const tooltipTopPct = activePoint
    ? Math.max(4, Math.min(48, ((activePoint.yLine - 92) / CHART_HEIGHT) * 100))
    : 12;

  const renderXAxisLabel = (pt, total) => {
    if (chartMode === 'week' || chartMode === 'quarter') return true;
    const step = Math.max(1, Math.floor(total / 6));
    return pt.idx === 0 || pt.idx === total - 1 || pt.idx % step === 0 || pt.idx === chartData.peakIndex;
  };

  return (
    <div className="md-layout">
      <style>{dashboardStyles}</style>

      <ManagerSidebar activeMenu="overview" />

      <main className="md-main-content">
        <ManagerHeader showSearch={false} />

        <div className="md-scroll-body">
          {/* Header */}
          <div>
            <p className="md-kicker">YOUTHFASHION • TỔNG QUAN HỆ THỐNG</p>
            <h1 className="md-page-title">Tổng Quan</h1>
          </div>

          {/* Top 3 KPI Summary Cards */}
          <div className="md-kpi-grid">
            {/* Card 1: TỔNG DOANH THU */}
            <div className="md-kpi-card">
              <div>
                <div className="md-kpi-header">
                  <p className="md-kpi-label">TỔNG DOANH THU</p>
                  <span className="md-kpi-icon-gold">
                    <Wallet size={15} />
                  </span>
                </div>

                <div className="md-kpi-value-row">
                  <span>
                    {monthlyStats.orderCount > 0 ? formatMoneyUnderline(monthlyStats.totalRevenue) : '0'}
                    <span className="md-kpi-currency-mark">đ</span>
                  </span>
                </div>

                <div className="md-kpi-sub-row">
                  {monthlyStats.revenueGrowth !== null ? (
                    <>
                      <span className={`md-growth-pill ${monthlyStats.revenueGrowth >= 0 ? 'up' : 'down'}`}>
                        {monthlyStats.revenueGrowth >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                        {monthlyStats.revenueGrowth >= 0 ? '+' : ''}
                        {monthlyStats.revenueGrowth.toFixed(1)}%
                      </span>
                      <span>so với tháng trước</span>
                    </>
                  ) : (
                    <>
                      <span className="md-growth-pill muted">↑ —</span>
                      <span>{monthlyStats.orderCount > 0 ? 'Phát sinh tháng này' : 'Chưa có dữ liệu'}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="md-kpi-footer">
                <div className="md-kpi-footer-meta">
                  <span>Mục tiêu {MONTHLY_REVENUE_TARGET.toLocaleString('vi-VN')}₫</span>
                  <strong>{revenueGoalPct.toFixed(1)}%</strong>
                </div>
                <div className="md-progress-track">
                  <div className="md-progress-fill-dark" style={{ width: `${revenueGoalPct}%` }} />
                </div>
              </div>
            </div>

            {/* Card 2: TỔNG ĐƠN HÀNG */}
            <div className="md-kpi-card">
              <div>
                <div className="md-kpi-header">
                  <p className="md-kpi-label">TỔNG ĐƠN HÀNG</p>
                  <span className="md-kpi-icon-neutral">
                    <ShoppingBag size={15} />
                  </span>
                </div>

                <div className="md-kpi-value-row">
                  <span>{monthlyStats.allOrdersCount.toLocaleString('vi-VN')}</span>
                  <span className="md-kpi-unit">ĐƠN</span>
                </div>

                <div className="md-kpi-sub-row">
                  {monthlyStats.allOrdersGrowth !== null ? (
                    <span className={`md-growth-pill ${monthlyStats.allOrdersGrowth >= 0 ? 'up' : 'down'}`}>
                      {monthlyStats.allOrdersGrowth >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                      {monthlyStats.allOrdersGrowth >= 0 ? '+' : ''}
                      {monthlyStats.allOrdersGrowth.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="md-growth-pill muted">↑ —</span>
                  )}
                  <span>{monthlyStats.orderCount.toLocaleString('vi-VN')} đơn hoàn tất</span>
                </div>
              </div>

              <div className="md-kpi-footer">
                <div className="md-kpi-footer-meta">
                  <span>Giao thành công</span>
                  <strong>{monthlyStats.completionRate.toFixed(1)}%</strong>
                </div>
                <div className="md-progress-track">
                  <div className="md-progress-fill-amber" style={{ width: `${monthlyStats.completionRate}%` }} />
                </div>
              </div>
            </div>

            {/* Card 3: TỔNG NGƯỜI DÙNG */}
            <div className="md-kpi-card">
              <div>
                <div className="md-kpi-header">
                  <p className="md-kpi-label">TỔNG NGƯỜI DÙNG</p>
                  <span className="md-kpi-icon-neutral">
                    <Users size={15} />
                  </span>
                </div>

                <div className="md-kpi-value-row">
                  <span>
                    {userMetrics ? Number(userMetrics.totalUsers || 0).toLocaleString('vi-VN') : '—'}
                  </span>
                  <span className="md-kpi-unit">người dùng</span>
                </div>

                <div className="md-kpi-sub-row">
                  {userMetrics && userMetrics.newUserGrowth !== null && userMetrics.newUserGrowth !== undefined ? (
                    <>
                      <span className={`md-growth-pill ${userMetrics.newUserGrowth >= 0 ? 'up' : 'down'}`}>
                        {userMetrics.newUserGrowth >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                        {userMetrics.newUserGrowth >= 0 ? '+' : ''}
                        {userMetrics.newUserGrowth.toFixed(1)}%
                      </span>
                      <span>so với tháng trước</span>
                    </>
                  ) : (
                    <>
                      <span className="md-growth-pill muted">↑ —</span>
                      <span>
                        {userMetrics && userMetrics.newThisMonth > 0
                          ? `${userMetrics.newThisMonth} tài khoản mới tháng này`
                          : 'Chưa có dữ liệu'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="md-kpi-footer">
                <div className="md-kpi-footer-meta">
                  <span>Người dùng mới</span>
                  <strong>
                    {userMetrics && userMetrics.newThisMonth !== undefined
                      ? `+${userMetrics.newThisMonth}`
                      : '—'}
                  </strong>
                </div>
                <div className="md-progress-track">
                  <div
                    className="md-progress-fill-dark"
                    style={{
                      width:
                        userMetrics && userMetrics.totalUsers > 0
                          ? `${Math.min(100, (userMetrics.newThisMonth / userMetrics.totalUsers) * 100)}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Chart Card */}
          <section className="md-card">
            <div className="md-chart-header">
              <div className="md-chart-title-wrap">
                <h2 className="md-section-title">
                  Biểu Đồ Doanh Thu &amp; Xu Hướng Đơn Hàng Theo Thời Gian
                </h2>
                <p className="md-section-subtitle">
                  Thống kê chi tiết doanh thu từng ngày từ đơn hoàn thành kết hợp lượng đơn hàng phát sinh
                </p>
              </div>

              <div className="md-chart-controls-col">
                <div className="md-legend-row">
                  <span className="md-legend-item">
                    <span className="md-legend-dot-dark" />
                    Doanh thu (VNĐ)
                  </span>
                  <span className="md-legend-item">
                    <span className="md-legend-dot-gold" />
                    Số đơn hàng
                  </span>
                </div>

                <div className="md-tabs-segmented">
                  <button
                    type="button"
                    className={`md-tab-btn ${chartMode === '30d' ? 'active' : ''}`}
                    onClick={() => {
                      setChartMode('30d');
                      setHoveredIdx(null);
                    }}
                  >
                    30 ngày gần nhất
                  </button>
                  <button
                    type="button"
                    className={`md-tab-btn ${chartMode === 'week' ? 'active' : ''}`}
                    onClick={() => {
                      setChartMode('week');
                      setHoveredIdx(null);
                    }}
                  >
                    Theo tuần
                  </button>
                  <button
                    type="button"
                    className={`md-tab-btn ${chartMode === 'quarter' ? 'active' : ''}`}
                    onClick={() => {
                      setChartMode('quarter');
                      setHoveredIdx(null);
                    }}
                  >
                    Theo quý
                  </button>
                  <button
                    type="button"
                    className={`md-tab-btn ${chartMode === 'prev_year' ? 'active' : ''}`}
                    onClick={() => {
                      setChartMode('prev_year');
                      setHoveredIdx(null);
                    }}
                  >
                    Cùng kỳ {prevYear}
                  </button>
                </div>
              </div>
            </div>

            <div className="md-chart-stage" onMouseLeave={() => setHoveredIdx(null)}>
              {activePoint && (hasAnyChartRevenue || hoveredIdx !== null) && (
                <div
                  className="md-tooltip-float"
                  style={{
                    left: `${tooltipLeftPct}%`,
                    top: `${tooltipTopPct}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="md-tooltip-kicker">
                    ● {activePoint.tooltipTitle} •{' '}
                    {activePoint.idx === chartData.peakIndex && hasAnyChartRevenue
                      ? 'ĐỈNH DOANH THU'
                      : 'CHI TIẾT TRONG KỲ'}
                  </div>
                  <div className="md-tooltip-rev">
                    {formatMoneyUnderline(activePoint.revenue)}
                    <span className="md-kpi-currency-mark">đ</span>
                  </div>
                  <div className="md-tooltip-meta">
                    <span className="md-tooltip-orders">Số lượng: {activePoint.ordersCount} đơn</span>
                    <span className="md-tooltip-aov">AOV: {formatMoneyUnderline(activePoint.aov)}đ</span>
                  </div>
                </div>
              )}

              {!loading && !hasAnyChartRevenue && hoveredIdx === null && (
                <div className="md-empty-chart-overlay">
                  Chưa có đơn hàng hoàn thành phát sinh trong giai đoạn này
                </div>
              )}

              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
                role="img"
                aria-label="Biểu đồ doanh thu và xu hướng đơn hàng theo thời gian"
              >
                <defs>
                  <linearGradient id="yfBarGoldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EAB308" stopOpacity="0.62" />
                    <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.16" />
                  </linearGradient>
                  <linearGradient id="yfBarPeakGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D97706" stopOpacity="0.92" />
                    <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.45" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines & Y-Axis Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const yPos = PAD_TOP + PLOT_H * (1 - ratio);
                  const val = yAxisMax * ratio;
                  return (
                    <g key={ratio}>
                      <line
                        x1={PAD_LEFT}
                        x2={CHART_WIDTH - PAD_RIGHT}
                        y1={yPos}
                        y2={yPos}
                        stroke="#F1EFEA"
                        strokeWidth="1"
                      />
                      <text
                        x={PAD_LEFT - 10}
                        y={yPos + 4}
                        textAnchor="end"
                        fill="#A8A29E"
                        fontSize="10.5"
                        fontFamily="Inter, sans-serif"
                      >
                        {formatAxisMoney(val)}
                      </text>
                    </g>
                  );
                })}

                {/* Order Bars */}
                {chartPoints.map((pt) => {
                  const isHighlighted = activePoint && activePoint.idx === pt.idx;
                  return (
                    <g key={pt.key}>
                      {pt.barH > 0 && (
                        <rect
                          x={pt.barX}
                          y={pt.yBar}
                          width={pt.barW}
                          height={pt.barH}
                          rx={4}
                          fill={isHighlighted ? 'url(#yfBarPeakGrad)' : 'url(#yfBarGoldGrad)'}
                        />
                      )}
                      {isHighlighted && (
                        <line
                          x1={pt.x}
                          x2={pt.x}
                          y1={pt.yLine}
                          y2={PAD_TOP + PLOT_H}
                          stroke="#B45309"
                          strokeWidth="1.4"
                          strokeDasharray="3 3"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Revenue Smooth Spline Line */}
                {smoothPath && (
                  <path
                    d={smoothPath}
                    fill="none"
                    stroke="#111111"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                )}

                {/* Key Milestones & Active Marker */}
                {chartPoints.map((pt, idx) => {
                  const isActive = activePoint && activePoint.idx === pt.idx;
                  const showMilestone =
                    hasAnyChartRevenue &&
                    (isActive || idx === 0 || idx === chartPoints.length - 1 || idx % 5 === 0);

                  if (!showMilestone) return null;

                  return (
                    <circle
                      key={`dot-${pt.key}`}
                      cx={pt.x}
                      cy={pt.yLine}
                      r={isActive ? 5 : 3.5}
                      fill={isActive ? '#111111' : '#FFFFFF'}
                      stroke="#111111"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* X-Axis Labels */}
                {chartPoints.map((pt) => {
                  const isPeak = hasAnyChartRevenue && pt.idx === chartData.peakIndex;
                  if (!renderXAxisLabel(pt, chartPoints.length)) return null;
                  return (
                    <text
                      key={`lbl-${pt.key}`}
                      x={pt.x}
                      y={CHART_HEIGHT - 12}
                      textAnchor="middle"
                      fill={isPeak ? '#111111' : '#8C857B'}
                      fontWeight={isPeak ? '700' : '500'}
                      fontSize="10.5"
                      fontFamily="Inter, sans-serif"
                    >
                      {isPeak ? `${pt.axisLabel} (Peak)` : pt.axisLabel}
                    </text>
                  );
                })}

                {/* Invisible Hover Hit Targets */}
                {chartPoints.map((pt) => {
                  const slotW = PLOT_W / Math.max(1, chartPoints.length);
                  return (
                    <rect
                      key={`hit-${pt.key}`}
                      x={pt.x - slotW / 2}
                      y={PAD_TOP}
                      width={slotW}
                      height={PLOT_H + 16}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredIdx(pt.idx)}
                      onClick={() => setHoveredIdx(pt.idx)}
                    />
                  );
                })}
              </svg>
            </div>
          </section>

          {/* Bottom Card: Sản Phẩm Đóng Góp Doanh Thu Cao Nhất */}
          <section className="md-card">
            <div className="md-top-header">
              <div>
                <h2 className="md-section-title">Sản Phẩm Đóng Góp Doanh Thu Cao Nhất</h2>
                <p className="md-section-subtitle">
                  {topProductsResult.isCurrentMonth
                    ? `Top 4 thiết kế được tuyển chọn bán chạy nhất tháng ${currentMonthNumber}`
                    : 'Top 4 thiết kế bán chạy nhất từ các đơn hàng hoàn thành'}
                </p>
              </div>

              <button
                type="button"
                className="md-view-all-btn"
                onClick={() => navigate('/manager/products')}
              >
                <span>Xem tất cả SKU</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="md-empty-products">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={16} className="md-spin" />
                  Đang tải dữ liệu sản phẩm bán chạy...
                </span>
              </div>
            ) : topProductsResult.items.length === 0 ? (
              <div className="md-empty-products">
                Chưa có sản phẩm nào ghi nhận doanh thu từ đơn hàng hoàn thành.
              </div>
            ) : (
              <div className="md-product-list">
                {topProductsResult.items.map((item) => (
                  <div key={item.key} className="md-product-row">
                    <div className="md-product-left">
                      <img
                        src={resolveOrderItemImage(item.rawItem)}
                        alt={item.name}
                        className="md-product-thumb"
                      />
                      <div style={{ minWidth: 0 }}>
                        <h3 className="md-product-name">{item.name}</h3>
                        <div className="md-product-meta">
                          <span>SKU: {item.sku}</span>
                          <span className="md-sku-tag">{item.categoryTag}</span>
                        </div>
                      </div>
                    </div>

                    <div className="md-product-metrics">
                      <div>
                        <div className="md-metric-primary">
                          {formatMoneyUnderline(item.unitPrice)}
                          <span className="md-kpi-currency-mark">đ</span>
                        </div>
                        <div className="md-metric-sub">
                          {item.soldQty.toLocaleString('vi-VN')} lượt bán
                        </div>
                      </div>

                      <div style={{ minWidth: '126px' }}>
                        <div className="md-metric-primary green">
                          {formatMoneyUnderline(item.totalRevenue)}
                          <span className="md-kpi-currency-mark">đ</span>
                        </div>
                        <div className="md-metric-sub">Doanh số thu về</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

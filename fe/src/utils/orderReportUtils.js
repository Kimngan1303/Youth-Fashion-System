/**
 * Tiện ích chuẩn hóa dữ liệu đơn hàng và tính toán chỉ số Báo cáo Doanh thu.
 * Đồng bộ quy tắc lọc đơn mẫu, đơn xóa và đơn PayOS chưa thanh toán giống OrderManager.
 */

const MOCK_ORDER_IDS = new Set([
  '891', '890', '889', '888', '887', '886', '885', '884',
  '88210', '85420', '79114', '72015', '68192',
]);

const STATUS_RANK = {
  PENDING: 1,
  CONFIRMED: 2,
  PROCESSING: 3,
  PREPARING: 3,
  SHIPPING: 4,
  DELIVERING: 4,
  SHIPPED: 4,
  IN_TRANSIT: 4,
  COMPLETED: 5,
  DELIVERED: 5,
  SUCCESS: 5,
  RETURNED: 6,
  REFUNDED: 6,
  CANCELLED: 7,
  FAILED: 7,
};

const safeParseJSON = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const getDeletedOrderIds = () => {
  const arr = safeParseJSON(localStorage.getItem('yf_deleted_order_ids'), []);
  return new Set(Array.isArray(arr) ? arr.map(String) : []);
};

/**
 * Loại bỏ đơn mẫu, đơn đã xóa và đơn PayOS chưa hoàn tất thanh toán.
 */
export const purgeInvalidOrders = (list) => {
  if (!Array.isArray(list)) return [];
  const deletedSet = getDeletedOrderIds();

  return list.filter((ord) => {
    if (!ord) return false;
    const rawId = String(ord.order_id || '').trim();
    const rawCode = String(ord.order_number || ord.order_code || '').trim();
    const digitsOnly = (rawCode || rawId).replace(/\D/g, '');

    if (MOCK_ORDER_IDS.has(rawId) || MOCK_ORDER_IDS.has(rawCode) || (digitsOnly && MOCK_ORDER_IDS.has(digitsOnly))) {
      return false;
    }
    if (deletedSet.has(rawId) || deletedSet.has(rawCode) || (digitsOnly && deletedSet.has(digitsOnly))) {
      return false;
    }

    const paymentMethodRaw = String(
      ord.payment_method || ord.payments?.[0]?.payment_method || ord.payment_label || ''
    ).toUpperCase();
    const isPayos = paymentMethodRaw.includes('PAYOS') || paymentMethodRaw.includes('VIETQR');

    if (isPayos) {
      const paymentStatus = String(
        ord.payment_status || ord.payments?.[0]?.payment_status || ''
      ).toUpperCase();
      const orderStatus = String(ord.order_status || ord.status || '').toUpperCase();
      if (
        ['PENDING', 'CANCELLED', 'FAILED', 'UNPAID'].includes(paymentStatus) ||
        orderStatus === 'CANCELLED'
      ) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Chuẩn hóa trạng thái đơn hàng thành nhóm thống nhất để tính tỷ lệ hoàn thành & hiển thị badge.
 */
export const normalizeOrderStatus = (rawStatus, rawLabel = '', ord = null) => {
  const s = String(rawStatus || ord?.order_status || ord?.status || '').toUpperCase().trim();
  const l = String(rawLabel || ord?.status_label || '').toUpperCase();
  const note = String(ord?.note || '').toLowerCase();
  const cancelReason = String(ord?.cancel_reason || '').toLowerCase();
  const refundDecision = String(ord?.refund_decision || '').toUpperCase();

  const isReturned =
    ['RETURNED', 'REFUNDED', 'EXCHANGE', 'RETURN'].includes(s) ||
    l.includes('ĐỔI TRẢ') ||
    l.includes('TRẢ HÀNG') ||
    l.includes('HOÀN TIỀN') ||
    l.includes('TỪ CHỐI HOÀN') ||
    l.includes('ĐÃ HOÀN') ||
    l.includes('YÊU CẦU HOÀN') ||
    refundDecision === 'APPROVED' ||
    refundDecision === 'REJECTED' ||
    Boolean(ord?.refund_reason) ||
    Boolean(ord?.refund_bank) ||
    Boolean(ord?.reject_reason) ||
    note.includes('hoàn tiền') ||
    note.includes('đổi trả') ||
    (note.includes('stk:') && !note.includes('khách hủy đơn:')) ||
    cancelReason.includes('hoàn tiền') ||
    cancelReason.includes('đổi trả');

  if (isReturned) {
    return { code: 'RETURNED', label: l.includes('ĐÃ HOÀN') ? 'Đã hoàn tiền' : 'Đổi trả', variant: 'returned' };
  }

  if (['CANCELLED', 'FAILED'].includes(s) || l.includes('HỦY') || note.startsWith('shop hủy') || note.startsWith('khách hủy')) {
    return { code: 'CANCELLED', label: 'Đã hủy', variant: 'cancelled' };
  }

  if (['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(s) || l.includes('HOÀN THÀNH') || l.includes('ĐÃ GIAO')) {
    return { code: 'COMPLETED', label: 'Hoàn thành', variant: 'completed' };
  }

  if (['SHIPPING', 'DELIVERING', 'SHIPPED', 'IN_TRANSIT'].includes(s) || l.includes('VẬN CHUYỂN') || l.includes('ĐANG GIAO')) {
    return { code: 'SHIPPING', label: 'Đang giao', variant: 'shipping' };
  }

  if (['PROCESSING', 'PREPARING'].includes(s) || l.includes('XỬ LÝ') || l.includes('CHUẨN BỊ')) {
    return { code: 'PROCESSING', label: 'Đang xử lý', variant: 'processing' };
  }

  if (s === 'CONFIRMED' || l.includes('XÁC NHẬN')) {
    return { code: 'CONFIRMED', label: 'Đã xác nhận', variant: 'confirmed' };
  }

  return { code: 'PENDING', label: 'Chờ xác nhận', variant: 'pending' };
};

/**
 * Phân tích ngày tạo đơn về đối tượng Date hợp lệ theo múi giờ local.
 */
export const parseOrderDate = (ord) => {
  const candidates = [ord?.created_date, ord?.created_at];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate instanceof Date && !isNaN(candidate.getTime())) {
      return candidate;
    }
    const str = String(candidate).trim();
    if (!str) continue;

    if (str.toLowerCase().includes('hôm nay')) {
      return new Date();
    }

    const vnMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (vnMatch) {
      const day = Number(vnMatch[1]);
      const month = Number(vnMatch[2]) - 1;
      const year = Number(vnMatch[3]);
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    const isoDate = new Date(str);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
  }
  return new Date();
};

/**
 * Chuyển Date thành chuỗi YYYY-MM-DD theo múi giờ địa phương.
 */
export const toLocalDateInputValue = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Định dạng YYYY-MM-DD -> DD/MM/YYYY để hiển thị tiếng Việt.
 */
export const formatDateVN = (dateInput) => {
  if (!dateInput) return '—';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split('-');
    return `${d}/${m}/${y}`;
  }
  const d = dateInput instanceof Date ? dateInput : parseOrderDate({ created_date: dateInput });
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Cộng/trừ số ngày từ chuỗi YYYY-MM-DD (tránh sai lệch DST/UTC).
 */
export const shiftDateString = (dateStr, deltaDays) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const shifted = new Date(y, m - 1, d + deltaDays);
  return toLocalDateInputValue(shifted);
};

/**
 * Đếm số ngày bao gồm cả startStr và endStr.
 */
export const countDaysInclusive = (startStr, endStr) => {
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const startMs = new Date(sy, sm - 1, sd).getTime();
  const endMs = new Date(ey, em - 1, ed).getTime();
  return Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
};

/**
 * Áp dụng ghi đè trạng thái localStorage (yf_order_status_overrides) lên danh sách đơn hàng.
 */
const applyOverridesToOrder = (ord, overrides) => {
  if (!overrides || !ord) return ord;
  const rawId = String(ord.order_id || '').trim();
  const rawCode = String(ord.order_number || ord.order_code || '').trim();
  const digits = (rawCode || rawId).replace(/\D/g, '');
  const ov = (digits && overrides[digits]) || (rawId && overrides[rawId]) || (rawCode && overrides[rawCode]);
  if (!ov) return ord;

  const curStatus = String(ord.order_status || ord.status || '').toUpperCase();
  const ovStatus = String(ov.status || '').toUpperCase();
  if (ovStatus === 'CANCELLED') {
    return { ...ord, order_status: 'CANCELLED', status: 'CANCELLED', status_label: 'Đã hủy' };
  }
  const curRank = STATUS_RANK[curStatus] || 0;
  const ovRank = STATUS_RANK[ovStatus] || 0;
  if (ovRank >= curRank) {
    return {
      ...ord,
      order_status: ovStatus || ord.order_status,
      status: ovStatus || ord.status,
      status_label: ov.status_label_manager || ov.status_label || ord.status_label,
      refund_decision: ov.refund_decision || ord.refund_decision,
    };
  }
  return ord;
};

/**
 * Chuẩn hóa một bản ghi đơn hàng thô (từ Backend API hoặc localStorage) thành định dạng báo cáo.
 */
export const normalizeReportOrder = (rawOrder, overrides = {}) => {
  const ord = applyOverridesToOrder(rawOrder, overrides);
  const createdDateObj = parseOrderDate(ord);
  const dateKey = toLocalDateInputValue(createdDateObj);

  const rawItems = Array.isArray(ord.order_items)
    ? ord.order_items
    : (Array.isArray(ord.items) ? ord.items : []);

  const itemsGross = rawItems.reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 1);
    const lineSub = item?.subtotal != null
      ? Number(item.subtotal)
      : Number(item?.unit_price ?? item?.price ?? 0) * qty;
    return sum + (Number.isFinite(lineSub) ? lineSub : 0);
  }, 0);

  const netAmount = Math.max(0, Number(ord.total_amount ?? ord.amount ?? 0) || 0);
  const explicitDiscount = Number(ord.discount_amount ?? ord.voucher_discount ?? 0) || 0;
  const grossAmount = Math.max(netAmount, explicitDiscount > 0 ? netAmount + explicitDiscount : itemsGross);
  const voucherAmount = Math.max(0, grossAmount - netAmount);
  const itemsRawTotal = itemsGross > 0 ? itemsGross : netAmount;
  const revenueScale = itemsRawTotal > 0 && netAmount < itemsRawTotal ? netAmount / itemsRawTotal : 1;

  const normalizedItems = rawItems.map((item) => {
    const qty = Math.max(1, Number(item?.quantity ?? 1) || 1);
    const unitPrice = Number(item?.unit_price ?? item?.price ?? 0) || 0;
    const rawSub = item?.subtotal != null ? Number(item.subtotal) : unitPrice * qty;
    const productObj = item?.variant?.product || item?.product || {};
    const productId = String(
      productObj?.product_id || item?.product_id || item?.id || item?.variant_id || ''
    ).trim();
    const name = String(
      item?.product_name || item?.name || item?.title || productObj?.product_name || 'Sản phẩm Youth Fashion'
    ).trim();
    const sku = String(
      item?.variant?.sku || item?.sku || (productId ? `YF-SP-${productId}` : 'YF-SKU')
    ).trim();
    const categoryTag = String(
      productObj?.category?.category_name || item?.category_name || item?.category || 'YOUTH FASHION'
    )
      .trim()
      .toUpperCase();

    return {
      key: productId || name.toLowerCase(),
      productId,
      sku,
      name,
      categoryTag,
      rawItem: item,
      unitPrice: unitPrice > 0 ? unitPrice : Math.round(rawSub / qty),
      quantity: qty,
      lineRevenue: Math.max(0, (Number.isFinite(rawSub) ? rawSub : 0) * revenueScale),
    };
  });

  const statusInfo = normalizeOrderStatus(ord.order_status || ord.status, ord.status_label, ord);
  const isCompletedOrder = statusInfo.code === 'COMPLETED';

  const rawNumber = String(ord.order_number || ord.order_code || ord.order_id || '').trim();
  const displayCode = rawNumber.startsWith('YF')
    ? rawNumber.replace(/\s+/g, '')
    : (rawNumber ? `YF-${rawNumber}` : 'YF-ORDER');

  const customerName =
    ord.recipient_name ||
    ord.customer?.full_name ||
    ord.customer?.name ||
    ord.customer_name ||
    'Khách hàng';

  return {
    id: String(ord.order_id || rawNumber || Math.random().toString(36).slice(2)),
    digitsKey: rawNumber.replace(/\D/g, '') || String(ord.order_id || ''),
    orderCode: displayCode,
    dateObj: createdDateObj,
    dateKey,
    dateDisplay: formatDateVN(createdDateObj),
    customerName,
    statusCode: statusInfo.code,
    statusLabel: statusInfo.label,
    statusVariant: statusInfo.variant,
    isCompleted: isCompletedOrder,
    // Doanh thu chỉ tính các đơn hàng đã hoàn thành (Hoàn thành / Đã giao)
    isRevenueEligible: isCompletedOrder,
    netAmount,
    grossAmount,
    voucherAmount,
    items: normalizedItems,
  };
};

/**
 * Hợp nhất dữ liệu đơn hàng từ Backend API và localStorage, loại trùng lặp & đơn không hợp lệ.
 */
export const mergeAndNormalizeOrders = (apiOrders = []) => {
  const managerCached = safeParseJSON(localStorage.getItem('yf_manager_orders'), []);
  const customerOrders = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith('yf_customer_orders')) {
      const parsed = safeParseJSON(localStorage.getItem(key), []);
      if (Array.isArray(parsed)) customerOrders.push(...parsed);
    }
  }

  const overrides = safeParseJSON(localStorage.getItem('yf_order_status_overrides'), {});
  const mergedMap = new Map();

  const upsertOrder = (raw) => {
    if (!raw) return;
    const rawCode = String(raw.order_number || raw.order_code || raw.order_id || '');
    const digits = rawCode.replace(/\D/g, '');
    const dedupeKey = digits || String(raw.order_id || rawCode);
    if (!dedupeKey) return;

    const existing = mergedMap.get(dedupeKey);
    if (!existing) {
      mergedMap.set(dedupeKey, raw);
      return;
    }

    // Gộp giữ lại items đầy đủ nhất và trạng thái mới nhất
    const mergedItems = (existing.order_items?.length || existing.items?.length)
      ? (existing.order_items || existing.items)
      : (raw.order_items || raw.items || []);

    const existingStatus = normalizeOrderStatus(existing.order_status || existing.status, existing.status_label, existing).code;
    const rawStatus = normalizeOrderStatus(raw.order_status || raw.status, raw.status_label, raw).code;
    const pickRaw = (STATUS_RANK[rawStatus] || 0) > (STATUS_RANK[existingStatus] || 0);

    const existingAmt = Number(existing.total_amount ?? 0);
    const rawAmt = Number(raw.total_amount ?? 0);

    mergedMap.set(dedupeKey, {
      ...(pickRaw ? existing : raw),
      ...(pickRaw ? raw : existing),
      order_items: mergedItems,
      total_amount: existingAmt > 0 ? existingAmt : rawAmt,
    });
  };

  // Ưu tiên danh sách chuẩn từ Backend API trước, rồi bổ sung từ cache localStorage
  (Array.isArray(apiOrders) ? apiOrders : []).forEach(upsertOrder);
  (Array.isArray(managerCached) ? managerCached : []).forEach(upsertOrder);
  customerOrders.forEach(upsertOrder);

  const validRawOrders = purgeInvalidOrders(Array.from(mergedMap.values()));

  return validRawOrders
    .map((ord) => normalizeReportOrder(ord, overrides))
    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
};

/**
 * Tổng hợp chỉ số doanh thu & so sánh với kỳ liền trước.
 */
export const summarizePeriod = (allOrders, startKey, endKey, prevStartKey, prevEndKey) => {
  const inCurrentAll = allOrders.filter((o) => o.dateKey >= startKey && o.dateKey <= endKey);
  const inPrevAll = allOrders.filter((o) => o.dateKey >= prevStartKey && o.dateKey <= prevEndKey);

  const revenueOrders = inCurrentAll.filter((o) => o.isRevenueEligible);
  const prevRevenueOrders = inPrevAll.filter((o) => o.isRevenueEligible);

  const totalRevenue = revenueOrders.reduce((s, o) => s + o.netAmount, 0);
  const grossRevenue = revenueOrders.reduce((s, o) => s + o.grossAmount, 0);
  const voucherDiscount = revenueOrders.reduce((s, o) => s + o.voucherAmount, 0);

  const prevRevenue = prevRevenueOrders.reduce((s, o) => s + o.netAmount, 0);
  const prevAov = prevRevenueOrders.length > 0 ? prevRevenue / prevRevenueOrders.length : 0;

  const orderCount = revenueOrders.length;
  const aov = orderCount > 0 ? totalRevenue / orderCount : 0;

  const amounts = revenueOrders.map((o) => o.netAmount);
  const maxOrder = amounts.length > 0 ? Math.max(...amounts) : 0;
  const minOrder = amounts.length > 0 ? Math.min(...amounts) : 0;

  const completedCount = inCurrentAll.filter((o) => o.isCompleted).length;
  const completionRate = inCurrentAll.length > 0 ? (completedCount / inCurrentAll.length) * 100 : 0;

  const computeGrowth = (curr, prev) => {
    if (prev > 0) return ((curr - prev) / prev) * 100;
    return null;
  };

  return {
    orders: revenueOrders,
    allOrdersCount: inCurrentAll.length,
    orderCount,
    totalRevenue,
    grossRevenue,
    voucherDiscount,
    aov,
    maxOrder,
    minOrder,
    completionRate,
    revenueGrowth: computeGrowth(totalRevenue, prevRevenue),
    allOrdersGrowth: computeGrowth(inCurrentAll.length, inPrevAll.length),
    aovGrowth: computeGrowth(aov, prevAov),
  };
};

/**
 * Tạo chuỗi dữ liệu cho biểu đồ kết hợp Doanh thu & Xu hướng Đơn hàng (chỉ tính đơn đã hoàn thành).
 * mode: 'week' | 'month' | 'year'
 */
export const buildOverviewChartSeries = (allOrders = [], mode = 'month') => {
  const completedOrders = allOrders.filter((o) => o.isRevenueEligible);
  const now = new Date();
  const todayStr = toLocalDateInputValue(now);

  const buckets = [];

  if (mode === 'week') {
    // 7 ngày gần nhất
    for (let offset = 6; offset >= 0; offset -= 1) {
      const dateStr = shiftDateString(todayStr, -offset);
      const [, mm, dd] = dateStr.split('-');
      buckets.push({
        key: dateStr,
        startKey: dateStr,
        endKey: dateStr,
        axisLabel: `${dd} Th${Number(mm)}`,
        tooltipTitle: `NGÀY ${dd}/${mm}`,
        revenue: 0,
        ordersCount: 0,
      });
    }
  } else if (mode === 'year') {
    // 12 tháng trong năm hiện tại
    const currentYear = now.getFullYear();
    for (let m = 0; m < 12; m += 1) {
      const startKey = toLocalDateInputValue(new Date(currentYear, m, 1));
      const endKey = toLocalDateInputValue(new Date(currentYear, m + 1, 0));
      const mm = String(m + 1).padStart(2, '0');
      buckets.push({
        key: `${currentYear}-${mm}`,
        startKey,
        endKey,
        axisLabel: `Th${m + 1}`,
        tooltipTitle: `THÁNG ${mm}/${currentYear}`,
        revenue: 0,
        ordersCount: 0,
      });
    }
  } else {
    // Mặc định ('month'): 30 ngày gần nhất
    for (let offset = 29; offset >= 0; offset -= 1) {
      const dateStr = shiftDateString(todayStr, -offset);
      const [, mm, dd] = dateStr.split('-');
      buckets.push({
        key: dateStr,
        startKey: dateStr,
        endKey: dateStr,
        axisLabel: `${dd} Th${Number(mm)}`,
        tooltipTitle: `NGÀY ${dd}/${mm}`,
        revenue: 0,
        ordersCount: 0,
      });
    }
  }

  completedOrders.forEach((ord) => {
    const bucket = buckets.find((b) => ord.dateKey >= b.startKey && ord.dateKey <= b.endKey);
    if (bucket) {
      bucket.revenue += ord.netAmount;
      bucket.ordersCount += 1;
    }
  });

  let peakIndex = -1;
  let maxRevenue = 0;
  buckets.forEach((b, idx) => {
    b.aov = b.ordersCount > 0 ? b.revenue / b.ordersCount : 0;
    if (b.revenue > maxRevenue) {
      maxRevenue = b.revenue;
      peakIndex = idx;
    }
  });

  return {
    buckets,
    peakIndex,
    maxRevenue,
    maxOrders: buckets.reduce((max, b) => Math.max(max, b.ordersCount), 0),
  };
};

/**
 * Xếp hạng sản phẩm đóng góp doanh thu cao nhất từ các đơn hàng đã hoàn thành.
 */
export const buildTopProducts = (allOrders = [], limit = 4) => {
  const completedOrders = allOrders.filter((o) => o.isRevenueEligible && Array.isArray(o.items));
  if (completedOrders.length === 0) {
    return { items: [], isCurrentMonth: true };
  }

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthCompleted = completedOrders.filter((o) => o.dateKey.startsWith(monthPrefix));
  const useCurrentMonth = currentMonthCompleted.some((o) => o.items.length > 0);
  const sourceOrders = useCurrentMonth ? currentMonthCompleted : completedOrders;

  const aggMap = new Map();
  sourceOrders.forEach((ord) => {
    ord.items.forEach((item) => {
      const existing = aggMap.get(item.key);
      if (!existing) {
        aggMap.set(item.key, {
          key: item.key,
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          categoryTag: item.categoryTag,
          rawItem: item.rawItem,
          unitPrice: item.unitPrice,
          soldQty: item.quantity,
          totalRevenue: item.lineRevenue,
        });
      } else {
        existing.soldQty += item.quantity;
        existing.totalRevenue += item.lineRevenue;
        if (item.unitPrice > 0) existing.unitPrice = item.unitPrice;
      }
    });
  });

  const ranked = Array.from(aggMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue || b.soldQty - a.soldQty)
    .slice(0, limit);

  return { items: ranked, isCurrentMonth: useCurrentMonth };
};

export const formatVND = (amount) => `${Math.round(Number(amount || 0)).toLocaleString('vi-VN')} đ`;

export const formatCompactVND = (amount) => {
  const val = Math.round(Number(amount || 0));
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')}B đ`;
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1).replace(/\.0$/, '')}M đ`;
  }
  return `${val.toLocaleString('vi-VN')} đ`;
};

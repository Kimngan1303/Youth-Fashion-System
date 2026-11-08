import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';
import { orderService } from '../../services/orderService';
import { resolveOrderItemImage } from '../../utils/productImageUtils';
import {
  ShoppingBag,
  Star,
  DollarSign,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Check,
  Clock,
  Truck,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard
} from 'lucide-react';

// Danh sách ID / mã đơn hàng mẫu cần thanh lọc để chỉ hiển thị đơn đặt hàng thực tế
const MOCK_ORDER_IDS = new Set([
  '891', '890', '889', '888', '887', '886', '885', '884',
  '88210', '85420', '79114', '72015', '68192'
]);

const getDeletedOrderIds = () => {
  try {
    const raw = localStorage.getItem('yf_deleted_order_ids');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
};

const addDeletedOrderId = (idOrNumber) => {
  try {
    const set = getDeletedOrderIds();
    const raw = String(idOrNumber || '').trim();
    const digits = raw.replace(/\D/g, '');
    if (raw) set.add(raw);
    if (digits) set.add(digits);
    localStorage.setItem('yf_deleted_order_ids', JSON.stringify([...set]));
  } catch (e) {}
};

const purgeMockOrders = (list) => {
  if (!Array.isArray(list)) return [];
  const deletedSet = getDeletedOrderIds();
  return list.filter(o => {
    if (!o) return false;
    const rawId = String(o.order_id || '').trim();
    const rawCode = String(o.order_number || o.order_code || '').trim();
    const digitsOnly = (rawCode || rawId).replace(/\D/g, '');

    if (MOCK_ORDER_IDS.has(rawId)) return false;
    if (MOCK_ORDER_IDS.has(rawCode)) return false;
    if (digitsOnly && MOCK_ORDER_IDS.has(digitsOnly)) return false;

    // Lọc bỏ triệt để các đơn hàng đã bị xóa khỏi hệ thống
    if (deletedSet.has(rawId)) return false;
    if (deletedSet.has(rawCode)) return false;
    if (digitsOnly && deletedSet.has(digitsOnly)) return false;

    return true;
  });
};

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
  FAILED: 7
};

// Helper kiểm tra chuỗi có phải ghi chú hoàn tiền không
const isRefundNote = (text) => {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return lower.includes('hoàn tiền') || lower.includes('stk:') || lower.includes('đổi trả');
};

// Helper kiểm tra chuỗi có phải ghi chú hủy đơn không
const isCancelNote = (text) => {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return lower.includes('hủy') || [
    'đổi ý, không muốn mua nữa',
    'đổi ý',
    'không muốn mua nữa',
    'muốn thay đổi địa chỉ nhận hàng',
    'muốn thay đổi địa chỉ',
    'thay đổi địa chỉ',
    'muốn thay đổi sản phẩm',
    'thủ tục thanh toán quá rắc rối',
    'tìm thấy giá rẻ hơn ở nơi khác',
    'muốn đổi sang màu sắc / kích thước khác',
    'đặt trùng đơn hàng',
    'đặt trùng đơn'
  ].some(p => lower === p || lower.includes(p));
};

// Helper nhận diện đơn đổi trả / hoàn tiền chính xác tuyệt đối
const isOrderReturned = (status, label = '', note = '', ord = null) => {
  const s = String(status || ord?.order_status || ord?.status || '').toUpperCase();
  const l = String(label || ord?.status_label || '').toUpperCase();
  const n = String(note || ord?.note || '').toLowerCase();
  const cr = String(ord?.cancel_reason || '').toLowerCase();
  const refundDecision = String(ord?.refund_decision || '').toUpperCase();

  // Bất kỳ dấu hiệu nào của đổi trả / hoàn tiền thì 100% là đơn đổi trả
  if (['RETURNED', 'REFUNDED', 'EXCHANGE', 'RETURN'].includes(s)) return true;
  if (l.includes('ĐỔI TRẢ') || l.includes('TRẢ HÀNG') || l.includes('HOÀN TIỀN') || l.includes('TỪ CHỐI HOÀN') || l.includes('ĐÃ HOÀN') || l.includes('YÊU CẦU HOÀN')) return true;
  if (refundDecision === 'APPROVED' || refundDecision === 'REJECTED') return true;
  if (Boolean(ord?.refund_reason) || Boolean(ord?.refund_bank) || Boolean(ord?.reject_reason)) return true;
  if (n.includes('hoàn tiền') || n.includes('đổi trả') || (n.includes('stk:') && !n.includes('khách hủy đơn:'))) return true;
  if (cr.includes('hoàn tiền') || cr.includes('đổi trả') || cr.includes('stk:')) return true;

  // Đơn hàng đã hủy thực sự (khi hoàn toàn không có bất kỳ dấu hiệu hoàn tiền nào)
  if (s === 'CANCELLED' || l.includes('HỦY') || l.includes('CANCEL')) {
    return false;
  }

  return false;
};

// Helper nhận diện đơn hủy
const isOrderCancelled = (status, label = '', note = '', ord = null) => {
  if (isOrderReturned(status, label, note, ord)) return false;
  const s = String(status || ord?.order_status || ord?.status || '').toUpperCase();
  const l = String(label || ord?.status_label || '').toUpperCase();
  const n = String(note || ord?.note || '').toLowerCase();
  const cr = String(ord?.cancel_reason || '').toLowerCase();

  // Tuyệt đối không nhận diện đơn có thông tin hoàn tiền là đơn hủy
  if (n.includes('hoàn tiền') || n.includes('stk:') || cr.includes('hoàn tiền') || cr.includes('stk:')) return false;

  if (['CANCELLED', 'FAILED'].includes(s)) return true;
  if (l.includes('HỦY') || l.includes('CANCEL')) return true;
  if (n.startsWith('shop hủy đơn:') || n.includes('shop hủy:') || n.startsWith('khách hủy đơn:') || n.includes('khách hủy:') || (Boolean(ord?.cancel_reason) && !isRefundNote(ord?.cancel_reason))) return true;

  return false;
};

const pickAuthoritativeStatus = (statusA, statusB, labelA, labelB, noteA = '', noteB = '') => {
  const sA = String(statusA || '').toUpperCase();
  const sB = String(statusB || '').toUpperCase();
  const lA = String(labelA || '').toUpperCase();
  const lB = String(labelB || '').toUpperCase();
  const nA = String(noteA || '').toLowerCase();
  const nB = String(noteB || '').toLowerCase();

  const isRetA = isOrderReturned(sA, lA, nA);
  const isRetB = isOrderReturned(sB, lB, nB);
  if (isRetA || isRetB) {
    const isApp = lA.includes('ĐÃ HOÀN') || lB.includes('ĐÃ HOÀN') || nA.includes('đã xác nhận hoàn tiền') || nB.includes('đã xác nhận hoàn tiền') || nA.includes('đã hoàn tiền') || nB.includes('đã hoàn tiền');
    const isRej = !isApp && (lA.includes('TỪ CHỐI') || lB.includes('TỪ CHỐI') || nA.includes('từ chối hoàn tiền') || nB.includes('từ chối hoàn tiền') || nA.includes('từ chối hoàn') || nB.includes('từ chối hoàn'));
    const bestLabel = isApp ? 'Đã hoàn tiền' : (isRej ? 'Từ chối hoàn' : 'Đổi trả');
    return { status: 'RETURNED', label: bestLabel };
  }

  // Đơn hàng đã hủy thực sự thì ưu tiên hủy trước
  if (sA === 'CANCELLED' || sB === 'CANCELLED' || lA.includes('HỦY') || lB.includes('HỦY')) {
    return { status: 'CANCELLED', label: 'Đã hủy' };
  }

  const rankA = STATUS_RANK[sA] || 0;
  const rankB = STATUS_RANK[sB] || 0;

  if (rankA >= rankB && rankA > 1) {
    return { status: sA, label: labelA };
  }
  if (rankB > 1) {
    return { status: sB, label: labelB };
  }
  return { status: sA || sB || 'PENDING', label: labelA || labelB || 'Chờ xác nhận' };
};

// Kiểm tra nếu nội dung ghi chú là lý do hủy hoặc hoàn tiền của hệ thống
const isOrderCancelOrRefundNote = (text, cancelReason, refundReason) => {
  if (!text) return true;
  const t = String(text).trim();
  const lower = t.toLowerCase();
  if (cancelReason && lower.includes(String(cancelReason).trim().toLowerCase())) return true;
  if (refundReason && lower.includes(String(refundReason).trim().toLowerCase())) return true;
  if (lower.startsWith('shop hủy đơn:') || lower.startsWith('shop hủy:') || lower.startsWith('khách hủy đơn:') || lower.startsWith('khách yêu cầu hoàn tiền:') || lower.startsWith('khách hủy:') || lower.startsWith('từ chối hoàn tiền:') || lower.startsWith('đã xác nhận hoàn tiền:')) return true;
  if (lower.includes('stk:') || lower.includes('hoàn tiền') || lower.includes('đổi trả')) return true;
  const phrases = [
    'đổi ý, không muốn mua nữa',
    'đổi ý',
    'không muốn mua nữa',
    'muốn thay đổi địa chỉ nhận hàng',
    'muốn thay đổi địa chỉ',
    'thay đổi địa chỉ',
    'muốn thay đổi sản phẩm',
    'thủ tục thanh toán quá rắc rối',
    'tìm thấy giá rẻ hơn ở nơi khác',
    'muốn đổi sang màu sắc / kích thước khác',
    'muốn đổi sang màu sắc',
    'đặt trùng đơn hàng',
    'đặt trùng đơn',
    'sản phẩm không vừa kích cỡ (size)',
    'sản phẩm không vừa kích cỡ',
    'sản phẩm lỗi đường may',
    'giao sai mẫu',
    'không ưng ý sau khi nhận sản phẩm',
    'sản phẩm lỗi / hư hỏng',
    'hàng lỗi',
    'sản phẩm không giống mô tả',
    'khách hàng yêu cầu hủy đơn',
    'khách hủy đơn',
    'shop hủy đơn',
    'đã hủy',
    'lý do khác'
  ];
  return phrases.some(p => lower === p || lower.includes(p));
};

// Helper lấy lý do hủy chuẩn xác để hiển thị (tuyệt đối không hiển thị nhầm lý do hoàn tiền)
const getDisplayCancelReason = (ord) => {
  if (!ord) return 'Đổi ý, không muốn mua nữa';
  const n = String(ord.note || '').trim();
  if (n.includes('Shop hủy đơn:')) {
    const parsed = n.replace('Shop hủy đơn:', '').trim();
    if (parsed && !isRefundNote(parsed)) return parsed;
  }
  if (n.includes('Khách hủy đơn:')) {
    const parsed = n.replace('Khách hủy đơn:', '').trim();
    if (parsed && !isRefundNote(parsed)) return parsed;
  }
  const cr = String(ord.cancel_reason || '').trim();
  if (cr && !isRefundNote(cr) && !cr.includes('STK:')) {
    return cr.replace('Shop hủy đơn:', '').replace('Khách hủy đơn:', '').trim();
  }
  if (n && !isRefundNote(n) && !n.includes('STK:')) {
    return n.replace('Shop hủy đơn:', '').replace('Khách hủy đơn:', '').trim();
  }
  try {
    const rawId = String(ord.order_id || '').trim();
    const rawCode = String(ord.order_number || ord.order_code || '').trim();
    const digits = (rawCode || rawId).replace(/\D/g, '');
    const rawOv = localStorage.getItem('yf_order_status_overrides');
    if (rawOv) {
      const ov = JSON.parse(rawOv);
      const entry = (digits && ov[digits]) || (rawId && ov[rawId]) || (rawCode && ov[rawCode]);
      if (entry?.cancel_reason && !isRefundNote(entry.cancel_reason) && !entry.cancel_reason.includes('STK:')) {
        return entry.cancel_reason.replace('Shop hủy đơn:', '').replace('Khách hủy đơn:', '').trim();
      }
    }
  } catch (e) {}
  return ord.cancelled_by === 'SHOP' ? 'Sản phẩm tạm thời hết hàng trong kho' : 'Đổi ý, không muốn mua nữa';
};

// Helper lấy ghi chú giao hàng thật sự của khách (không hiển thị nếu trùng lý do hủy/hoàn tiền)
const getDisplayDeliveryNote = (ord) => {
  if (!ord) return '';
  const isRet = isOrderReturned(ord.order_status, ord.status_label, ord.note, ord);
  const isCanc = !isRet && isOrderCancelled(ord.order_status, ord.status_label, ord.note, ord);
  
  // Chỉ lấy ghi chú giao hàng thật sự mà khách nhập lúc thanh toán
  let candidate = String(ord.customer_delivery_note || ord.delivery_note || '').trim();
  if (!candidate && !isCanc && !isRet) {
    candidate = String(ord.note || '').trim();
  }
  if (!candidate) return '';
  if (isCancelNote(candidate) || isRefundNote(candidate) || isOrderCancelOrRefundNote(candidate, ord.cancel_reason, ord.refund_reason)) return '';
  const cr = String(ord.cancel_reason || '').toLowerCase().trim();
  const rr = String(ord.refund_reason || '').toLowerCase().trim();
  const lower = candidate.toLowerCase();
  if (cr && (lower === cr || cr.includes(lower) || lower.includes(cr))) return '';
  if (rr && (lower === rr || rr.includes(lower) || lower.includes(rr))) return '';
  return candidate;
};

// Áp dụng trạng thái ghi đè (overrides) để đảm bảo F5 hoặc API không làm mất trạng thái vừa chuyển
const applyStatusOverrides = (ordersList) => {
  if (!Array.isArray(ordersList)) return [];
  try {
    const rawOverrides = localStorage.getItem('yf_order_status_overrides');
    if (!rawOverrides) return ordersList;
    const overrides = JSON.parse(rawOverrides);
    let overridesModified = false;

    const result = ordersList.map(ord => {
      if (!ord) return ord;
      const rawId = String(ord.order_id || '').trim();
      const rawCode = String(ord.order_number || ord.order_code || '').trim();
      const digits = (rawCode || rawId).replace(/\D/g, '');

      const ov = (digits && overrides[digits]) || (rawId && overrides[rawId]) || (rawCode && overrides[rawCode]);

      // Dọn dẹp override nếu cancel_reason bị dính nội dung hoàn tiền
      if (ov && ov.cancel_reason && isRefundNote(ov.cancel_reason)) {
        delete ov.cancel_reason;
        overridesModified = true;
      }

      const ovStatus = String(ov?.status || '').toUpperCase();
      const curStatus = String(ord.order_status || ord.status || '').toUpperCase();
      const ovLabel = String(ov?.status_label || ov?.status_label_manager || '');
      const isExplicitCanc = curStatus === 'CANCELLED' || ovStatus === 'CANCELLED' || ovLabel.includes('Hủy');

      // 1. Nếu là đơn Đổi trả / Hoàn tiền (chỉ khi không phải đơn hủy rõ ràng)
      const isRet = !isExplicitCanc && (isOrderReturned(ord.order_status, ord.status_label, ord.note, ord) || (ov && isOrderReturned(ov.status, ov.status_label, ov.note, ov)));
      if (isRet) {
        let bestLabel = 'Đổi trả';
        const rawL = String(ov?.status_label_manager || ov?.status_label || ord.status_label || '').toUpperCase();
        if (ov?.refund_decision === 'APPROVED' || rawL.includes('ĐÃ HOÀN')) {
          bestLabel = 'Đã hoàn tiền';
        } else if (ov?.refund_decision === 'REJECTED' || rawL.includes('TỪ CHỐI')) {
          bestLabel = 'Từ chối hoàn';
        } else {
          bestLabel = 'Đổi trả';
        }

        const cleanNote = (ov?.note && !ov.note.includes('Khách hủy đơn:')) ? ov.note : (ord.note && !ord.note.includes('Khách hủy đơn:') ? ord.note : '');
        return {
          ...ord,
          order_status: 'RETURNED',
          status: 'RETURNED',
          status_label: bestLabel,
          refund_decision: ov?.refund_decision || ord.refund_decision || (bestLabel === 'Đã hoàn tiền' ? 'APPROVED' : (bestLabel === 'Từ chối hoàn' ? 'REJECTED' : 'PENDING')),
          refund_reason: ov?.refund_reason || ord.refund_reason,
          refund_bank: ov?.refund_bank || ord.refund_bank,
          reject_reason: ov?.reject_reason || ord.reject_reason,
          cancel_reason: '',
          note: cleanNote || ord.note,
        };
      }

      // 2. Nếu đơn hàng thực sự là CANCELLED:
      if (isExplicitCanc) {
        let bestCancelReason = '';
        let cancelledBy = ov?.cancelled_by || ord.cancelled_by || '';
        if (ov?.cancel_reason && !isRefundNote(ov.cancel_reason)) {
          bestCancelReason = ov.cancel_reason;
        } else if (ord.cancel_reason && !isRefundNote(ord.cancel_reason)) {
          bestCancelReason = ord.cancel_reason;
        } else if (ov?.note && ov.note.includes('Shop hủy đơn:')) {
          bestCancelReason = ov.note.replace('Shop hủy đơn:', '').trim();
          cancelledBy = 'SHOP';
        } else if (ord.note && ord.note.includes('Shop hủy đơn:')) {
          bestCancelReason = ord.note.replace('Shop hủy đơn:', '').trim();
          cancelledBy = 'SHOP';
        } else if (ov?.note && ov.note.includes('Khách hủy đơn:')) {
          bestCancelReason = ov.note.replace('Khách hủy đơn:', '').trim();
          if (!cancelledBy) cancelledBy = 'CUSTOMER';
        } else if (ord.note && ord.note.includes('Khách hủy đơn:')) {
          bestCancelReason = ord.note.replace('Khách hủy đơn:', '').trim();
          if (!cancelledBy) cancelledBy = 'CUSTOMER';
        } else if (ord.note && !isRefundNote(ord.note)) {
          bestCancelReason = ord.note.trim();
        } else if (ov?.note && !isRefundNote(ov.note)) {
          bestCancelReason = ov.note.trim();
        }
        if (!bestCancelReason) {
          bestCancelReason = cancelledBy === 'SHOP' ? 'Sản phẩm tạm thời hết hàng trong kho' : 'Đổi ý, không muốn mua nữa';
        }

        return {
          ...ord,
          order_status: 'CANCELLED',
          status: 'CANCELLED',
          status_label: 'Đã hủy',
          cancel_reason: bestCancelReason,
          cancelled_by: cancelledBy || (bestCancelReason.includes('Shop') ? 'SHOP' : 'CUSTOMER'),
          refund_reason: '',
          refund_bank: '',
          refund_decision: '',
          reject_reason: '',
        };
      }

      // 3. Nếu có override các trạng thái khác
      if (ov) {
        const curRank = STATUS_RANK[curStatus] || 0;
        const ovStatus = String(ov.status || '').toUpperCase();
        const ovRank = STATUS_RANK[ovStatus] || 0;

        if (ovRank >= curRank) {
          return {
            ...ord,
            order_status: ov.status,
            status: ov.status,
            status_label: ov.status_label_manager || ov.status_label || ord.status_label,
            delivered_date: ov.delivered_date || ord.delivered_date,
            note: ov.note || ord.note,
          };
        }
      }
      return ord;
    });

    if (overridesModified) {
      try {
        localStorage.setItem('yf_order_status_overrides', JSON.stringify(overrides));
      } catch (e) {}
    }

    return result;
  } catch (e) {
    return ordersList;
  }
};

export default function OrderManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  // Danh sách đơn hàng (Bắt đầu hoàn toàn trống để chờ đơn thật từ tài khoản khách hàng)
  const [orders, setOrders] = useState(() => {
    try {
      if (localStorage.getItem('yf_orders_reset_all_v3') !== 'true') {
        orderService.clearAllOrders().catch(() => {});
        localStorage.removeItem('yf_manager_orders');
        localStorage.removeItem('yf_customer_orders');
        localStorage.removeItem('yf_deleted_order_ids');
        localStorage.removeItem('yf_order_status_overrides');
        sessionStorage.removeItem('yf_last_completed_order');
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('yf_customer_orders') || k.startsWith('yf_orders_reset_') || k === 'yf_manager_orders')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.setItem('yf_orders_reset_all_v3', 'true');
        return [];
      }

      const saved = localStorage.getItem('yf_manager_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = applyStatusOverrides(purgeMockOrders(parsed));
          localStorage.setItem('yf_manager_orders', JSON.stringify(cleaned));
          return cleaned;
        }
      }
    } catch (e) {}
    return [];
  });

  // Bộ lọc và phân trang
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop (đã qua sử dụng / mất tem mác)');
  const [isEditingRejectReason, setIsEditingRejectReason] = useState(false);
  const [editRejectReasonText, setEditRejectReasonText] = useState('');
  const [isShopCancelModalOpen, setIsShopCancelModalOpen] = useState(false);
  const [shopCancelOrder, setShopCancelOrder] = useState(null);
  const [shopCancelReason, setShopCancelReason] = useState('Sản phẩm tạm thời hết hàng trong kho');
  const [customShopCancelReason, setCustomShopCancelReason] = useState('');

  // Form tạo đơn hàng mới
  const [newOrderForm, setNewOrderForm] = useState({
    recipient_name: '',
    recipient_phone: '',
    recipient_email: '',
    address: '',
    product_name: '',
    size: 'Size M',
    color: 'Màu Tiêu chuẩn',
    quantity: 1,
    unit_price: 2500000,
    payment_method: 'PAYOS',
    order_status: 'PENDING',
    note: ''
  });

  // Hàm tải dữ liệu từ database backend và đồng bộ với localStorage
  const fetchOrdersFromBackend = useCallback(() => {
    if (localStorage.getItem('yf_orders_reset_all_v3') !== 'true') return;

    orderService.getAllOrders()
      .then((res) => {
        if (res?.status && Array.isArray(res.data) && res.data.length > 0) {
          const apiFormatted = res.data.map((ord) => {
            const isRet = isOrderReturned(ord.order_status, '', ord.note, ord);
            const sRaw = String(ord.order_status || 'PENDING').toUpperCase();
            let s = sRaw;
            if (isRet) s = 'RETURNED';
            else if (['CONFIRMED'].includes(sRaw)) s = 'CONFIRMED';
            else if (['SHIPPING', 'SHIPPED', 'DELIVERING', 'IN_TRANSIT', 'PROCESSING', 'PREPARING'].includes(sRaw)) s = 'SHIPPING';
            else if (['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(sRaw)) s = 'COMPLETED';
            else if (['CANCELLED', 'FAILED'].includes(sRaw)) s = 'CANCELLED';
            else if (['RETURNED', 'REFUNDED', 'EXCHANGE'].includes(sRaw)) s = 'RETURNED';
            else s = 'PENDING';

            let statusLabel = 'Chờ xác nhận';
            if (s === 'RETURNED') {
              const noteLow = String(ord.note || '').toLowerCase();
              if (noteLow.includes('đã xác nhận hoàn tiền')) statusLabel = 'Đã hoàn tiền';
              else if (noteLow.includes('từ chối hoàn tiền')) statusLabel = 'Từ chối hoàn';
              else statusLabel = 'Đổi trả';
            } else if (s === 'CONFIRMED') statusLabel = 'Đã xác nhận';
            else if (s === 'COMPLETED') statusLabel = 'Đã giao';
            else if (s === 'SHIPPING') statusLabel = 'Đang vận chuyển';
            else if (s === 'CANCELLED') statusLabel = 'Đã hủy';

            const isPayos = ord.payments?.[0]?.payment_method === 'PAYOS';
            const isDirect = ord.payments?.[0]?.payment_method === 'DIRECT';
            const payStatus = ord.payments?.[0]?.payment_status === 'SUCCESS' ? 'PAID' : 'PENDING';
            let payLabel = isPayos
              ? 'PayOS - Đã thanh toán'
              : (isDirect ? 'Thanh toán trực tiếp' : 'COD - Chưa thanh toán');

            const orderDateStr = ord.created_at ? new Date(ord.created_at).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : 'Vừa xong';

            return {
              order_id: String(ord.order_id || ord.order_number),
              order_number: ord.order_number?.startsWith('YF') ? ord.order_number : `YF - ${ord.order_number || ord.order_id}`,
              created_at: orderDateStr,
              created_date: ord.created_at || new Date().toISOString(),
              customer: {
                name: ord.recipient_name || ord.customer?.full_name || 'Khách hàng',
                phone: ord.recipient_phone || ord.customer?.phone || '090****000',
                is_vip: false,
                email: ord.recipient_email || ord.customer?.email || '',
                address: [ord.shipping_address_line, ord.shipping_ward, ord.shipping_district, ord.shipping_city].filter(Boolean).join(', ')
              },
              items: (ord.order_items || []).map((it) => ({
                id: it.order_item_id || it.variant_id,
                name: it.product_name,
                image: resolveOrderItemImage(it),
                size: it.size ? `Size ${it.size}` : 'Size M',
                color: it.color ? `Màu ${it.color}` : 'Tiêu chuẩn',
                quantity: Number(it.quantity || 1),
                price: Number(it.unit_price || 0),
                total_items_count: ord.order_items?.length || 1
              })),
              total_amount: Number(ord.total_amount || 0),
              payment_method: isPayos ? 'PAYOS' : (isDirect ? 'DIRECT' : 'COD'),
              payment_status: payStatus,
              payment_label: payLabel,
              order_status: s,
              status_label: statusLabel,
              note: ord.note || ''
            };
          });

          const cleanedApi = purgeMockOrders(apiFormatted);

          // Hợp nhất đơn thật từ backend lên đầu
          setOrders((prev) => {
            const cleanedPrev = purgeMockOrders(prev);
            const merged = [...cleanedApi];
            for (const p of cleanedPrev) {
              const mIdx = merged.findIndex(m => String(m.order_number).replace(/\D/g, '') === String(p.order_number).replace(/\D/g, ''));
              if (mIdx === -1) {
                merged.push(p);
              } else {
                const best = pickAuthoritativeStatus(
                  merged[mIdx].order_status,
                  p.order_status,
                  merged[mIdx].status_label,
                  p.status_label,
                  merged[mIdx].note,
                  p.note
                );
                merged[mIdx] = {
                  ...p,
                  ...merged[mIdx],
                  order_status: best.status,
                  status: best.status,
                  status_label: best.label,
                  note: merged[mIdx].note || p.note,
                  delivered_date: best.status === 'COMPLETED' ? (merged[mIdx].delivered_date || p.delivered_date || new Date().toLocaleDateString('vi-VN')) : (merged[mIdx].delivered_date || p.delivered_date),
                };
              }
            }
            const finalMerged = applyStatusOverrides(merged);
            try {
              localStorage.setItem('yf_manager_orders', JSON.stringify(finalMerged));
            } catch (e) {}
            return finalMerged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Tải dữ liệu từ database backend và đồng bộ với localStorage khi mount
  useEffect(() => {
    if (localStorage.getItem('yf_orders_reset_all_v3') !== 'true') {
      orderService.clearAllOrders().catch(() => {});
      localStorage.removeItem('yf_manager_orders');
      localStorage.removeItem('yf_customer_orders');
      localStorage.removeItem('yf_deleted_order_ids');
      sessionStorage.removeItem('yf_last_completed_order');
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('yf_customer_orders') || k.startsWith('yf_orders_reset_') || k === 'yf_manager_orders')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('yf_orders_reset_all_v3', 'true');
      setOrders([]);
      return;
    }

    fetchOrdersFromBackend();
  }, [fetchOrdersFromBackend]);

  // Lấy danh sách đơn hàng từ localStorage của khách hàng nếu vừa đặt hàng
  useEffect(() => {
    try {
      const keysToScan = ['yf_customer_orders'];
      if (user) {
        keysToScan.push(`yf_customer_orders_${user.customer_id || user.id || user.email}`);
      }
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('yf_customer_orders') && !keysToScan.includes(k)) {
          keysToScan.push(k);
        }
      }

      let allCustomerOrders = [];
      keysToScan.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              allCustomerOrders.push(...parsed);
            }
          }
        } catch (e) {}
      });

      const cleanedCustomerOrders = purgeMockOrders(allCustomerOrders);

      if (cleanedCustomerOrders.length > 0) {
        setOrders((prev) => {
          const updated = [...purgeMockOrders(prev)];
          cleanedCustomerOrders.forEach(co => {
            const orderCodeDigits = String(co.order_code || co.order_id || co.order_number || '').replace(/\D/g, '');
            const exists = updated.some(u => String(u.order_number || u.order_id || '').replace(/\D/g, '') === orderCodeDigits);
            if (!exists && orderCodeDigits) {
              const isPayos = String(co.payment_method || '').includes('VietQR') || String(co.payment_method || '').includes('PAYOS');
              const isDirect = String(co.payment_method || '').includes('Trực tiếp') || String(co.payment_method || '').includes('DIRECT');
              
              const s = String(co.status || co.order_status || 'PENDING').toUpperCase();
              let statusLabel = 'Chờ xác nhận';
              if (['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(s)) statusLabel = 'Đã giao';
              else if (['SHIPPING', 'IN_TRANSIT', 'DELIVERING'].includes(s)) statusLabel = 'Đang vận chuyển';
              else if (['CANCELLED', 'FAILED'].includes(s)) statusLabel = 'Đã hủy';
              else if (['RETURNED', 'REFUNDED'].includes(s)) statusLabel = 'Đổi trả';

              let payLabel = isPayos
                ? 'PayOS - Đã thanh toán'
                : (isDirect ? 'Thanh toán trực tiếp' : 'COD - Chưa thanh toán');

              updated.unshift({
                order_id: String(co.order_id || orderCodeDigits),
                order_number: co.order_code?.startsWith('YF') ? co.order_code : `YF - ${co.order_id || orderCodeDigits}`,
                created_at: co.created_at || 'Vừa xong - Hôm nay',
                created_date: co.created_date || new Date().toISOString(),
                customer: {
                  name: co.recipient_name || user?.full_name || 'Khách hàng trực tuyến',
                  phone: co.recipient_phone || user?.phone || '090****000',
                  is_vip: false,
                  email: co.recipient_email || user?.email || '',
                  address: co.address || co.shipping_address || 'Giao tận nơi theo đơn đặt hàng'
                },
                items: (co.items || []).map(it => ({
                  id: it.id || it.variant_id,
                  name: it.name || it.title || it.product_name,
                  image: resolveOrderItemImage(it),
                  size: it.size ? (it.size.startsWith('Size') ? it.size : `Size ${it.size}`) : 'Size M',
                  color: it.color ? (it.color.startsWith('Màu') ? it.color : `Màu ${it.color}`) : 'Tiêu chuẩn',
                  quantity: Number(it.quantity || 1),
                  price: Number(it.price || 0),
                  total_items_count: co.items?.length || 1
                })),
                total_amount: Number(co.total_amount || 0),
                payment_method: isPayos ? 'PAYOS' : (isDirect ? 'DIRECT' : 'COD'),
                payment_status: isPayos ? 'PAID' : 'PENDING',
                payment_label: payLabel,
                order_status: s,
                status_label: statusLabel,
                note: co.note || 'Đơn hàng mới đặt từ website'
              });
            }
          });
          try {
            localStorage.setItem('yf_manager_orders', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    } catch (e) {}
  }, [user]);

  // Lắng nghe sự kiện đồng bộ trạng thái đơn hàng thời gian thực từ khách hàng hoặc các tab khác
  useEffect(() => {
    const applyIncomingStatus = (detail) => {
      if (!detail || !detail.status) return;
      const rawStatus = detail.status;
      const isRetEvt = isOrderReturned(rawStatus, detail.statusLabel, detail.note, detail);
      const isCancEvt = !isRetEvt && isOrderCancelled(rawStatus, detail.statusLabel, detail.note, detail);
      const newStatus = isRetEvt ? 'RETURNED' : (isCancEvt ? 'CANCELLED' : rawStatus);

      const newLabel = isRetEvt
        ? (detail.refund_decision === 'APPROVED' ? 'Đã hoàn tiền' : (detail.refund_decision === 'REJECTED' ? 'Từ chối hoàn' : 'Đổi trả'))
        : (isCancEvt ? 'Đã hủy' : (detail.statusLabel || (
            newStatus === 'CONFIRMED' ? 'Đã xác nhận' : (
              newStatus === 'SHIPPING' ? 'Đang vận chuyển' : (
                newStatus === 'COMPLETED' ? 'Đã giao' : 'Chờ xác nhận'
              )
            )
          )));

      const evtId = String(detail.orderId || '').trim();
      const evtNum = String(detail.orderNumber || detail.orderCode || '').trim();
      const evtDigits = String(detail.orderDigits || detail.digits || evtNum || evtId).replace(/\D/g, '');

      // 1. Cập nhật override trong localStorage để bảo vệ trạng thái vĩnh viễn
      try {
        const rawOv = localStorage.getItem('yf_order_status_overrides');
        const overrides = rawOv ? JSON.parse(rawOv) : {};
        const isApprDecision = detail.refund_decision === 'APPROVED' || String(detail.statusLabel || '').includes('hoàn tiền') || String(newLabel || '').includes('hoàn tiền');
        const isRejDecision = detail.refund_decision === 'REJECTED' || String(detail.statusLabel || '').includes('từ chối') || String(newLabel || '').includes('từ chối');
        const customerRetLabel = isApprDecision ? 'ĐÃ HOÀN TIỀN' : (isRejDecision ? 'TỪ CHỐI HOÀN' : 'ĐỔI TRẢ');
        const overrideEntry = {
          status: newStatus,
          status_label: newLabel,
          status_label_manager: newLabel,
          status_label_customer: isCancEvt ? 'ĐÃ HỦY' : (newStatus === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : (isRetEvt ? customerRetLabel : (detail.customerLabel || newLabel))),
          cancel_reason: isCancEvt ? (detail.cancel_reason && !isRefundNote(detail.cancel_reason) ? detail.cancel_reason : (detail.reason && !isRefundNote(detail.reason) ? detail.reason : 'Đổi ý, không muốn mua nữa')) : '',
          refund_reason: isRetEvt ? (detail.refund_reason || detail.reason) : '',
          refund_bank: isRetEvt ? detail.refund_bank : '',
          refund_decision: isRetEvt ? (detail.refund_decision || (isApprDecision ? 'APPROVED' : (isRejDecision ? 'REJECTED' : 'PENDING'))) : '',
          reject_reason: detail.reject_reason || '',
          note: isRetEvt
            ? (detail.note || `Khách yêu cầu hoàn tiền: ${detail.reason || detail.refund_reason || 'Đổi trả'}${detail.refund_bank ? ` | STK: ${detail.refund_bank}` : ''}`)
            : (isCancEvt ? (detail.cancel_note || `Khách hủy đơn: ${detail.cancel_reason || detail.reason || 'Đổi ý, không muốn mua nữa'}`) : detail.note),
          updated_at: Date.now(),
        };
        if (evtDigits) {
          overrides[evtDigits] = overrideEntry;
          overrides[`YF-${evtDigits}`] = overrideEntry;
          overrides[`#YF-${evtDigits}`] = overrideEntry;
          overrides[`YF - ${evtDigits}`] = overrideEntry;
          overrides[`#YF - ${evtDigits}`] = overrideEntry;
          overrides[`YF – ${evtDigits}`] = overrideEntry;
          overrides[`#YF – ${evtDigits}`] = overrideEntry;
          overrides[`#${evtDigits}`] = overrideEntry;
          for (const k of Object.keys(overrides)) {
            if (k.replace(/\D/g, '') === evtDigits) {
              overrides[k] = overrideEntry;
            }
          }
        }
        if (evtId) overrides[evtId] = overrideEntry;
        if (evtNum) overrides[evtNum] = overrideEntry;
        localStorage.setItem('yf_order_status_overrides', JSON.stringify(overrides));
      } catch (e) {}

      // 2. Cập nhật state orders trực tiếp
      setOrders(prev => {
        let hasMatch = false;
        const updated = prev.map(ord => {
          const oId = String(ord.order_id || '').trim();
          const oNum = String(ord.order_number || ord.order_code || '').trim();
          const oDigits = (oNum || oId).replace(/\D/g, '');

          const isMatch =
            (evtId && (oId === evtId || oNum === evtId)) ||
            (evtNum && (oId === evtNum || oNum === evtNum)) ||
            (evtDigits && oDigits && evtDigits === oDigits);

          if (isMatch) {
            hasMatch = true;
            return {
              ...ord,
              order_status: newStatus,
              status: newStatus,
              status_label: newLabel,
              cancel_reason: isCancEvt ? (detail.cancel_reason && !isRefundNote(detail.cancel_reason) ? detail.cancel_reason : (detail.reason && !isRefundNote(detail.reason) ? detail.reason : (ord.cancel_reason && !isRefundNote(ord.cancel_reason) ? ord.cancel_reason : 'Đổi ý, không muốn mua nữa'))) : '',
              refund_reason: isRetEvt ? (detail.refund_reason || detail.reason || ord.refund_reason) : ord.refund_reason,
              refund_bank: isRetEvt ? (detail.refund_bank || ord.refund_bank) : ord.refund_bank,
              refund_decision: detail.refund_decision || ord.refund_decision,
              reject_reason: detail.reject_reason || ord.reject_reason,
              note: isRetEvt
                ? (detail.note || ord.note)
                : (isCancEvt ? (detail.cancel_note || `Khách hủy đơn: ${detail.cancel_reason || detail.reason || ord.cancel_reason || 'Đổi ý, không muốn mua nữa'}`) : (detail.note || ord.note)),
              delivered_date: newStatus === 'COMPLETED' ? (ord.delivered_date || new Date().toLocaleDateString('vi-VN')) : ord.delivered_date,
            };
          }
          return ord;
        });

        if (hasMatch) {
          try {
            localStorage.setItem('yf_manager_orders', JSON.stringify(updated));
          } catch (err) {}
          return updated;
        }
        return prev;
      });

      // Tải lại ngay từ backend DB để xác thực dữ liệu
      fetchOrdersFromBackend();
    };

    // Kiểm tra và áp dụng overrides lên state orders hiện tại một cách an toàn
    const syncFromOverrides = () => {
      setOrders(prev => {
        const updated = applyStatusOverrides(prev);
        let hasDiff = false;
        if (updated.length !== prev.length) {
          hasDiff = true;
        } else {
          for (let i = 0; i < prev.length; i++) {
            if (
              prev[i].order_status !== updated[i].order_status ||
              prev[i].status !== updated[i].status ||
              prev[i].status_label !== updated[i].status_label
            ) {
              hasDiff = true;
              break;
            }
          }
        }
        if (hasDiff) {
          try {
            localStorage.setItem('yf_manager_orders', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        }
        return prev;
      });
    };

    // 1. Kênh BroadcastChannel siêu tốc giữa các tab (0ms)
    let bc;
    try {
      bc = new BroadcastChannel('yf_orders_sync_channel');
      bc.onmessage = (event) => {
        if (event.data?.status) {
          applyIncomingStatus(event.data);
        } else {
          fetchOrdersFromBackend();
        }
      };
    } catch (e) {}

    // 2. Lắng nghe storage event đa tab
    const handleStorageEvent = (e) => {
      if (e?.key === 'yf_last_status_event' && e?.newValue) {
        try {
          const detail = JSON.parse(e.newValue);
          applyIncomingStatus(detail);
        } catch (err) {}
      } else if (e?.key === 'yf_order_status_overrides' || e?.key === 'yf_manager_orders' || e?.key?.startsWith('yf_customer_orders')) {
        syncFromOverrides();
        fetchOrdersFromBackend();
      }
    };

    // 3. Lắng nghe custom events cùng window
    const handleCustomEvent = (e) => {
      let detail = e?.detail;
      if (!detail) {
        try {
          const raw = localStorage.getItem('yf_last_status_event');
          if (raw) detail = JSON.parse(raw);
        } catch (err) {}
      }
      if (detail?.status) {
        applyIncomingStatus(detail);
      } else {
        syncFromOverrides();
        fetchOrdersFromBackend();
      }
    };

    // 4. Khi quản lý chuyển tab quay lại xem trang quản lý
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromOverrides();
        fetchOrdersFromBackend();
      }
    };

    // 5. Polling tự động kiểm tra định kỳ mỗi 2 giây
    const intervalId = setInterval(() => {
      syncFromOverrides();
      fetchOrdersFromBackend();
    }, 2000);

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('yf_order_status_changed', handleCustomEvent);
    window.addEventListener('order_status_updated', handleCustomEvent);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('yf_order_status_changed', handleCustomEvent);
      window.removeEventListener('order_status_updated', handleCustomEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchOrdersFromBackend]);

  // Lưu lại vào localStorage mỗi khi orders thay đổi
  const saveOrders = (updatedList) => {
    setOrders(updatedList);
    try {
      localStorage.setItem('yf_manager_orders', JSON.stringify(updatedList));
    } catch (e) {}
  };

  // Helper phân loại nhóm trạng thái
  const getCategoryFromStatus = (status, label = '', note = '', ord = null) => {
    if (isOrderReturned(status, label, note, ord)) return 'RETURNED';
    if (isOrderCancelled(status, label, note, ord)) return 'CANCELLED';
    const s = String(status || '').toUpperCase();
    const l = String(label || '').toUpperCase();
    if (['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(s) || l.includes('ĐÃ GIAO')) return 'COMPLETED';
    if (['SHIPPING', 'DELIVERING', 'IN_TRANSIT'].includes(s) || (l.includes('VẬN CHUYỂN') && !l.includes('CHỜ VẬN CHUYỂN'))) return 'SHIPPING';
    if (['CONFIRMED'].includes(s) || l.includes('ĐÃ XÁC NHẬN')) return 'CONFIRMED';
    if (['PENDING'].includes(s) || l.includes('CHỜ XÁC NHẬN')) return 'PENDING';
    return 'PENDING';
  };

  // Số lượng đơn hàng theo từng tab
  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter(o => getCategoryFromStatus(o.order_status, o.status_label, o.note, o) === 'PENDING').length,
      CONFIRMED: orders.filter(o => getCategoryFromStatus(o.order_status, o.status_label, o.note, o) === 'CONFIRMED').length,
      SHIPPING: orders.filter(o => getCategoryFromStatus(o.order_status, o.status_label, o.note, o) === 'SHIPPING').length,
      COMPLETED: orders.filter(o => getCategoryFromStatus(o.order_status, o.status_label, o.note, o) === 'COMPLETED').length,
      CANCELLED: orders.filter(o => getCategoryFromStatus(o.order_status, o.status_label, o.note, o) === 'CANCELLED').length,
      RETURNED: orders.filter(o => getCategoryFromStatus(o.order_status, o.status_label, o.note, o) === 'RETURNED').length,
    };
  }, [orders]);

  // Doanh thu và thống kê
  const stats = useMemo(() => {
    const totalRev = orders
      .filter(o => getCategoryFromStatus(o.order_status, o.status_label) === 'COMPLETED' || o.payment_status === 'PAID')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const pendingRevenue = orders
      .filter(o => getCategoryFromStatus(o.order_status, o.status_label) === 'PENDING')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const completedCount = counts.COMPLETED;
    const pendingCount = counts.PENDING;
    const aov = orders.length > 0 ? Math.round(totalRev / Math.max(1, completedCount || 1)) : 0;

    const totalOrdersStr = String(orders.length).padStart(2, '0');
    const completedStr = String(completedCount).padStart(2, '0');
    const shippingStr = String(counts.SHIPPING).padStart(2, '0');
    const pendingStr = String(pendingCount).padStart(2, '0');

    return {
      totalOrdersToday: totalOrdersStr,
      completedToday: completedStr,
      processingToday: shippingStr,
      urgentPendingCount: pendingStr,
      pendingRevFormatted: pendingRevenue.toLocaleString('vi-VN') + 'đ',
      todayRevenueFormatted: totalRev.toLocaleString('vi-VN') + 'đ',
      aovFormatted: aov.toLocaleString('vi-VN') + 'đ',
      completedPercent: orders.length > 0 ? Math.min(100, Math.round((completedCount / orders.length) * 100)) : 0,
      pendingPercent: orders.length > 0 ? Math.min(100, Math.round((pendingCount / orders.length) * 100)) : 0
    };
  }, [orders, counts]);

  // Lọc và tìm kiếm
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Lọc theo Tab
    if (activeTab !== 'ALL') {
      result = result.filter(o => getCategoryFromStatus(o.order_status, o.status_label) === activeTab);
    }

    // Lọc theo phương thức thanh toán
    if (paymentFilter !== 'ALL') {
      result = result.filter(o => o.payment_method === paymentFilter);
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(o => {
        const codeMatch = String(o.order_number || o.order_id).toLowerCase().includes(q);
        const nameMatch = String(o.customer?.name || '').toLowerCase().includes(q);
        const phoneMatch = String(o.customer?.phone || '').toLowerCase().includes(q);
        const itemMatch = (o.items || []).some(it => String(it.name || '').toLowerCase().includes(q));
        return codeMatch || nameMatch || phoneMatch || itemMatch;
      });
    }

    // Sắp xếp
    if (sortBy === 'NEWEST') {
      result.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    } else if (sortBy === 'OLDEST') {
      result.sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));
    } else if (sortBy === 'AMOUNT_DESC') {
      result.sort((a, b) => Number(b.total_amount || 0) - Number(a.total_amount || 0));
    } else if (sortBy === 'AMOUNT_ASC') {
      result.sort((a, b) => Number(a.total_amount || 0) - Number(b.total_amount || 0));
    }

    return result;
  }, [orders, activeTab, paymentFilter, searchQuery, sortBy]);

  // Phân trang
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Xử lý chọn nhiều checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(paginatedOrders.map(o => o.order_id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Xóa các mục đã chọn
  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedOrderIds.length} đơn hàng đã chọn không?`)) {
      const idsToDelete = [...selectedOrderIds];

      for (const id of idsToDelete) {
        const idStr = String(id || '').trim();
        const orderObj = orders.find(o => String(o.order_id) === idStr || String(o.order_number) === idStr);
        const num = String(orderObj?.order_number || idStr).trim();
        const digits = (num || idStr).replace(/\D/g, '');

        addDeletedOrderId(idStr);
        addDeletedOrderId(num);
        if (digits) addDeletedOrderId(digits);

        try {
          await orderService.deleteOrder(idStr).catch(() => {});
          if (num !== idStr) await orderService.deleteOrder(num).catch(() => {});
        } catch (e) {}

        removeCustomerOrderStorage(idStr);
        if (num !== idStr) removeCustomerOrderStorage(num);
        if (digits) removeCustomerOrderStorage(digits);
      }

      const updated = orders.filter(o => {
        const oId = String(o.order_id || '').trim();
        const oNum = String(o.order_number || '').trim();
        const oDigits = (oNum || oId).replace(/\D/g, '');
        return !idsToDelete.some(delId => {
          const dStr = String(delId).trim();
          const dDigits = dStr.replace(/\D/g, '');
          return oId === dStr || oNum === dStr || (dDigits && oDigits && dDigits === oDigits);
        });
      });

      saveOrders(updated);
      setSelectedOrderIds([]);

      window.dispatchEvent(new Event('order_status_updated'));
      window.dispatchEvent(new CustomEvent('yf_order_status_changed', { detail: { action: 'BULK_DELETE' } }));

      showSuccess(`Đã xóa thành công ${idsToDelete.length} đơn hàng!`);
    }
  };

  // Cập nhật trạng thái một đơn hàng nhanh chóng (hỗ trợ cả Dropdown trực tiếp trên bảng và Modal chỉnh sửa)
  const updateSingleOrderStatus = async (targetOrder, newStatus) => {
    if (!targetOrder || !newStatus) return;

    const currentCat = getCategoryFromStatus(targetOrder.order_status, targetOrder.status_label, targetOrder.note, targetOrder);
    if (currentCat === 'CANCELLED') {
      showError('Đơn hàng này đã bị hủy, không thể thay đổi trạng thái!');
      return;
    }
    if (currentCat === 'RETURNED' && newStatus !== 'RETURNED') {
      showError('Đơn hàng đổi trả / hoàn tiền chỉ có thể Xử lý hoàn tiền hoặc Từ chối hoàn!');
      return;
    }
    if (newStatus === 'RETURNED' && currentCat !== 'RETURNED') {
      showError('Quản lý không thể tự ý chuyển đơn hàng sang Đổi trả! Chỉ khi khách hàng gửi yêu cầu hoàn tiền, quản lý mới có thể thao tác xử lý hoàn tiền hoặc từ chối.');
      return;
    }

    let newStatusLabel = 'Chờ xác nhận';
    let customerLabel = 'CHỜ XÁC NHẬN';
    const formattedDate = new Date().toLocaleDateString('vi-VN');

    if (newStatus === 'CONFIRMED') {
      newStatusLabel = 'Đã xác nhận';
      customerLabel = 'ĐÃ XÁC NHẬN';
    } else if (newStatus === 'COMPLETED') {
      newStatusLabel = 'Đã giao';
      customerLabel = `ĐÃ GIAO (${formattedDate})`;
    } else if (newStatus === 'SHIPPING') {
      newStatusLabel = 'Đang vận chuyển';
      customerLabel = 'ĐANG VẬN CHUYỂN';
    } else if (newStatus === 'CANCELLED') {
      newStatusLabel = 'Đã hủy';
      customerLabel = 'ĐÃ HỦY';
    } else if (newStatus === 'RETURNED' || newStatus === 'APPROVED' || newStatus === 'REJECTED') {
      const isApp = newStatus === 'APPROVED' || targetOrder.refund_decision === 'APPROVED' || String(targetOrder.status_label || '').includes('hoàn tiền');
      const isRej = newStatus === 'REJECTED' || targetOrder.refund_decision === 'REJECTED' || String(targetOrder.status_label || '').includes('từ chối');
      newStatus = 'RETURNED';
      if (isApp) {
        newStatusLabel = 'Đã hoàn tiền';
        customerLabel = 'ĐÃ HOÀN TIỀN';
      } else if (isRej) {
        newStatusLabel = 'Từ chối hoàn';
        customerLabel = 'TỪ CHỐI HOÀN';
      } else {
        newStatusLabel = 'Đổi trả';
        customerLabel = 'ĐỔI TRẢ';
      }
    }

    const tId = String(targetOrder.order_id || '').trim();
    const tNum = String(targetOrder.order_number || targetOrder.order_code || '').trim();
    const digits = (tNum || tId).replace(/\D/g, '');

    // 1. Lưu đè vĩnh viễn vào yf_order_status_overrides để ĐẢM BẢO không bao giờ bị F5 hay API làm mất trạng thái
    try {
      const rawOv = localStorage.getItem('yf_order_status_overrides');
      const overrides = rawOv ? JSON.parse(rawOv) : {};
      const isAppDecision = newStatusLabel === 'Đã hoàn tiền';
      const isRejDecision = newStatusLabel === 'Từ chối hoàn';
      const overrideEntry = {
        status: newStatus,
        status_label: newStatusLabel,
        status_label_manager: newStatusLabel,
        status_label_customer: customerLabel,
        delivered_date: newStatus === 'COMPLETED' ? formattedDate : null,
        refund_decision: isAppDecision ? 'APPROVED' : (isRejDecision ? 'REJECTED' : targetOrder.refund_decision),
        reject_reason: isRejDecision ? (targetOrder.reject_reason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop') : targetOrder.reject_reason,
        refund_reason: targetOrder.refund_reason,
        refund_bank: targetOrder.refund_bank,
        note: targetOrder.note,
        updated_at: Date.now(),
      };
      if (digits) {
        overrides[digits] = overrideEntry;
        overrides[`YF-${digits}`] = overrideEntry;
        overrides[`#YF-${digits}`] = overrideEntry;
        overrides[`YF - ${digits}`] = overrideEntry;
        overrides[`#YF - ${digits}`] = overrideEntry;
        overrides[`YF – ${digits}`] = overrideEntry;
        overrides[`#YF – ${digits}`] = overrideEntry;
        overrides[`#${digits}`] = overrideEntry;
        for (const k of Object.keys(overrides)) {
          if (k.replace(/\D/g, '') === digits) {
            overrides[k] = overrideEntry;
          }
        }
      }
      if (tId) overrides[tId] = overrideEntry;
      if (tNum) overrides[tNum] = overrideEntry;
      localStorage.setItem('yf_order_status_overrides', JSON.stringify(overrides));
    } catch (e) {}

    // 2. Cập nhật state danh sách đơn hàng Manager
    const updated = orders.map(o => {
      const oId = String(o.order_id || '').trim();
      const oNum = String(o.order_number || o.order_code || '').trim();
      const oDigits = (oNum || oId).replace(/\D/g, '');
      const isMatch = (tId && (oId === tId || oNum === tId)) ||
                      (tNum && (oId === tNum || oNum === tNum)) ||
                      (digits && oDigits && digits === oDigits);
      if (isMatch) {
        return {
          ...o,
          order_status: newStatus,
          status: newStatus,
          status_label: newStatusLabel,
          delivered_date: newStatus === 'COMPLETED' ? (o.delivered_date || formattedDate) : o.delivered_date,
        };
      }
      return o;
    });

    saveOrders(updated);

    // 3. Đồng bộ trực tiếp vào tất cả các key localStorage của khách hàng
    syncCustomerOrdersStorage(tId, tNum, newStatus, newStatusLabel, customerLabel);

    // 4. Gửi API backend cập nhật CSDL MySQL
    try {
      if (tId) orderService.updateOrderStatus(tId, newStatus).catch(() => {});
      if (tNum && tNum !== tId) orderService.updateOrderStatus(tNum, newStatus).catch(() => {});
      if (digits && digits !== tId && digits !== tNum) orderService.updateOrderStatus(digits, newStatus).catch(() => {});
    } catch (e) {}

    // 5. Phát sự kiện toàn cục và ghi sự kiện cross-tab để trang hồ sơ khách hàng nhận được ngay
    const statusPayload = {
      orderId: tId,
      orderNumber: tNum,
      digits,
      status: newStatus,
      statusLabel: newStatusLabel,
      customerLabel,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('yf_last_status_event', JSON.stringify(statusPayload));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('yf_order_status_changed', { detail: statusPayload }));
    window.dispatchEvent(new Event('order_status_updated'));

    showSuccess(`Đã chuyển trạng thái đơn hàng #${tNum || tId} sang "${newStatusLabel}" thành công!`);
  };

  // Mở modal Shop hủy đơn hàng
  const handleOpenShopCancelModal = (ord) => {
    if (!ord) return;
    setShopCancelOrder(ord);
    setShopCancelReason('Sản phẩm tạm thời hết hàng trong kho');
    setCustomShopCancelReason('');
    setIsShopCancelModalOpen(true);
  };

  // Xác nhận Shop hủy đơn hàng
  const handleConfirmShopCancel = async () => {
    if (!shopCancelOrder) return;
    const finalReason = shopCancelReason === 'Lý do khác'
      ? (customShopCancelReason.trim() || 'Sản phẩm tạm thời hết hàng trong kho')
      : (shopCancelReason || 'Sản phẩm tạm thời hết hàng trong kho');

    await executeCancelOrder(shopCancelOrder, finalReason, 'SHOP');
    setIsShopCancelModalOpen(false);
    setShopCancelOrder(null);
  };

  // Thực thi thao tác hủy đơn hàng từ phía Shop
  const executeCancelOrder = async (targetOrder, reason, cancelledBy = 'SHOP') => {
    if (!targetOrder) return;
    const tId = String(targetOrder.order_id || '').trim();
    const tNum = String(targetOrder.order_number || targetOrder.order_code || '').trim();
    const digits = (tNum || tId).replace(/\D/g, '');

    const newStatus = 'CANCELLED';
    const newStatusLabel = 'Đã hủy';
    const customerLabel = 'ĐÃ HỦY';
    const updatedNote = cancelledBy === 'SHOP' ? `Shop hủy đơn: ${reason}` : `Khách hủy đơn: ${reason}`;

    // 1. Lưu đè vĩnh viễn vào yf_order_status_overrides
    try {
      const rawOv = localStorage.getItem('yf_order_status_overrides');
      const overrides = rawOv ? JSON.parse(rawOv) : {};
      const overrideEntry = {
        status: newStatus,
        status_label: newStatusLabel,
        status_label_manager: newStatusLabel,
        status_label_customer: customerLabel,
        cancel_reason: reason,
        cancelled_by: cancelledBy,
        note: updatedNote,
        updated_at: Date.now(),
      };
      if (digits) {
        overrides[digits] = overrideEntry;
        overrides[`YF-${digits}`] = overrideEntry;
        overrides[`#YF-${digits}`] = overrideEntry;
        overrides[`YF - ${digits}`] = overrideEntry;
        overrides[`#YF - ${digits}`] = overrideEntry;
        overrides[`YF – ${digits}`] = overrideEntry;
        overrides[`#YF – ${digits}`] = overrideEntry;
        overrides[`#${digits}`] = overrideEntry;
        for (const k of Object.keys(overrides)) {
          if (k.replace(/\D/g, '') === digits) {
            overrides[k] = overrideEntry;
          }
        }
      }
      if (tId) overrides[tId] = overrideEntry;
      if (tNum) overrides[tNum] = overrideEntry;
      localStorage.setItem('yf_order_status_overrides', JSON.stringify(overrides));
    } catch (e) {}

    // 2. Cập nhật state danh sách đơn hàng Manager
    const updated = orders.map(o => {
      const oId = String(o.order_id || '').trim();
      const oNum = String(o.order_number || o.order_code || '').trim();
      const oDigits = (oNum || oId).replace(/\D/g, '');
      const isMatch = (tId && (oId === tId || oNum === tId)) ||
                      (tNum && (oId === tNum || oNum === tNum)) ||
                      (digits && oDigits && digits === oDigits);
      if (isMatch) {
        return {
          ...o,
          order_status: newStatus,
          status: newStatus,
          status_label: newStatusLabel,
          cancel_reason: reason,
          cancelled_by: cancelledBy,
          note: updatedNote,
        };
      }
      return o;
    });
    saveOrders(updated);

    // 3. Đồng bộ storage của khách hàng
    syncCustomerOrdersStorage(tId, tNum, newStatus, newStatusLabel, customerLabel, reason, cancelledBy, updatedNote);

    // 4. Gửi API backend cập nhật CSDL MySQL
    try {
      if (tId) orderService.updateOrderStatus(tId, newStatus, updatedNote).catch(() => {});
      if (tNum && tNum !== tId) orderService.updateOrderStatus(tNum, newStatus, updatedNote).catch(() => {});
      if (digits && digits !== tId && digits !== tNum) orderService.updateOrderStatus(digits, newStatus, updatedNote).catch(() => {});
    } catch (e) {}

    // 5. Phát sự kiện toàn cục và ghi sự kiện cross-tab
    const statusPayload = {
      orderId: tId,
      orderNumber: tNum,
      digits,
      status: newStatus,
      statusLabel: newStatusLabel,
      customerLabel,
      cancel_reason: reason,
      cancelled_by: cancelledBy,
      note: updatedNote,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('yf_last_status_event', JSON.stringify(statusPayload));
      const bc = new BroadcastChannel('yf_orders_sync_channel');
      bc.postMessage(statusPayload);
      bc.close();
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('yf_order_status_changed', { detail: statusPayload }));
    window.dispatchEvent(new Event('order_status_updated'));

    // Cập nhật lại editingOrder nếu đang mở
    setEditingOrder(prev => {
      if (!prev) return null;
      const prevId = String(prev.order_id || '').trim();
      const prevNum = String(prev.order_number || prev.order_code || '').trim();
      const prevDigits = (prevNum || prevId).replace(/\D/g, '');
      if (prevId === tId || prevNum === tNum || prevDigits === digits) {
        return {
          ...prev,
          order_status: newStatus,
          status: newStatus,
          status_label: newStatusLabel,
          cancel_reason: reason,
          cancelled_by: cancelledBy,
          note: updatedNote,
        };
      }
      return prev;
    });

    showSuccess(`Đã chuyển đơn hàng #${tNum || tId} sang "Đã hủy" với lý do từ Shop!`);
  };

  // Đồng bộ trạng thái đơn hàng sang bộ nhớ người dùng (Customer Profile)
  const syncCustomerOrdersStorage = (targetOrderId, orderNumber, newStatus, newStatusLabel, customerLabel, cancelReason = '', cancelledBy = '', updatedNote = '') => {
    try {
      const orderDigits = String(orderNumber || targetOrderId || '').replace(/\D/g, '');
      const tId = String(targetOrderId || '').trim();
      const tNum = String(orderNumber || '').trim();
      const formattedDate = new Date().toLocaleDateString('vi-VN');
      const finalCustomerLabel = customerLabel || (
        newStatus === 'COMPLETED' ? `ĐÃ GIAO (${formattedDate})` : (
          newStatus === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : (
            newStatus === 'SHIPPING' ? 'ĐANG VẬN CHUYỂN' : (
              newStatus === 'CANCELLED' ? 'ĐÃ HỦY' : (
                newStatus === 'RETURNED' ? 'ĐỔI TRẢ' : 'CHỜ XÁC NHẬN'
              )
            )
          )
        )
      );

      // Đảm bảo lưu overrides
      try {
        const rawOv = localStorage.getItem('yf_order_status_overrides');
        const overrides = rawOv ? JSON.parse(rawOv) : {};
        const isAppDec = newStatusLabel === 'Đã hoàn tiền' || finalCustomerLabel === 'ĐÃ HOÀN TIỀN';
        const isRejDec = newStatusLabel === 'Từ chối hoàn' || finalCustomerLabel === 'TỪ CHỐI HOÀN';
        const prevOv = (orderDigits && (overrides[orderDigits] || overrides[`YF-${orderDigits}`])) || (tId && overrides[tId]) || (tNum && overrides[tNum]) || {};
        const overrideEntry = {
          ...prevOv,
          status: newStatus,
          status_label: newStatusLabel || 'Chờ xác nhận',
          status_label_manager: newStatusLabel || 'Chờ xác nhận',
          status_label_customer: finalCustomerLabel,
          delivered_date: newStatus === 'COMPLETED' ? formattedDate : null,
          refund_decision: isAppDec ? 'APPROVED' : (isRejDec ? 'REJECTED' : prevOv.refund_decision),
          cancel_reason: (newStatus === 'CANCELLED' && cancelReason) ? cancelReason : (prevOv.cancel_reason || cancelReason),
          cancelled_by: (newStatus === 'CANCELLED' && cancelledBy) ? cancelledBy : (prevOv.cancelled_by || cancelledBy),
          note: (newStatus === 'CANCELLED' && updatedNote) ? updatedNote : (prevOv.note || updatedNote),
          updated_at: Date.now(),
        };
        if (orderDigits) {
          overrides[orderDigits] = overrideEntry;
          overrides[`YF-${orderDigits}`] = overrideEntry;
          overrides[`#YF-${orderDigits}`] = overrideEntry;
          overrides[`YF - ${orderDigits}`] = overrideEntry;
          overrides[`#YF - ${orderDigits}`] = overrideEntry;
          overrides[`YF – ${orderDigits}`] = overrideEntry;
          overrides[`#YF – ${orderDigits}`] = overrideEntry;
          overrides[`#${orderDigits}`] = overrideEntry;
          for (const k of Object.keys(overrides)) {
            if (k.replace(/\D/g, '') === orderDigits) {
              overrides[k] = overrideEntry;
            }
          }
        }
        if (tId) overrides[tId] = overrideEntry;
        if (tNum) overrides[tNum] = overrideEntry;
        localStorage.setItem('yf_order_status_overrides', JSON.stringify(overrides));
      } catch (e) {}

      const isMatch = (ord) => {
        if (!ord) return false;
        const ordId = String(ord.order_id || '').trim();
        const ordCode = String(ord.order_code || ord.order_number || '').trim();
        const itemDigits = (ordCode || ordId).replace(/\D/g, '');
        if (ordId && (ordId === tId || ordId === tNum)) return true;
        if (ordCode && (ordCode === tId || ordCode === tNum)) return true;
        if (orderDigits && itemDigits && orderDigits === itemDigits) return true;
        return false;
      };

      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('yf_customer_orders') || k === 'yf_manager_orders' || k === 'orders')) {
          allKeys.push(k);
        }
      }
      if (!allKeys.includes('yf_customer_orders')) allKeys.push('yf_customer_orders');

      const isAppSync = newStatusLabel === 'Đã hoàn tiền' || finalCustomerLabel === 'ĐÃ HOÀN TIỀN';
      const isRejSync = newStatusLabel === 'Từ chối hoàn' || finalCustomerLabel === 'TỪ CHỐI HOÀN';

      allKeys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            let hasChange = false;
            const updated = parsed.map(cOrd => {
              if (isMatch(cOrd)) {
                hasChange = true;
                return {
                  ...cOrd,
                  status: newStatus,
                  order_status: newStatus,
                  status_label: k === 'yf_manager_orders' ? (newStatusLabel || 'Chờ xác nhận') : finalCustomerLabel,
                  refund_decision: isAppSync ? 'APPROVED' : (isRejSync ? 'REJECTED' : cOrd.refund_decision),
                  delivered_date: newStatus === 'COMPLETED' ? (cOrd.delivered_date || formattedDate) : cOrd.delivered_date,
                  cancel_reason: (newStatus === 'CANCELLED' && cancelReason) ? cancelReason : cOrd.cancel_reason,
                  cancelled_by: (newStatus === 'CANCELLED' && cancelledBy) ? cancelledBy : cOrd.cancelled_by,
                  note: (newStatus === 'CANCELLED' && updatedNote) ? updatedNote : cOrd.note,
                };
              }
              return cOrd;
            });
            if (hasChange) {
              localStorage.setItem(k, JSON.stringify(updated));
            }
          }
        } catch (err) {}
      });

      try {
        const lastRaw = sessionStorage.getItem('yf_last_completed_order');
        if (lastRaw) {
          const lastObj = JSON.parse(lastRaw);
          if (isMatch(lastObj)) {
            sessionStorage.setItem('yf_last_completed_order', JSON.stringify({
              ...lastObj,
              status: newStatus,
              order_status: newStatus,
              status_label: finalCustomerLabel,
              delivered_date: newStatus === 'COMPLETED' ? (lastObj.delivered_date || formattedDate) : lastObj.delivered_date,
            }));
          }
        }
      } catch (e) {}

      const syncPayload = {
        orderId: tId,
        orderNumber,
        digits: orderDigits,
        status: newStatus,
        statusLabel: newStatusLabel,
        customerLabel: finalCustomerLabel,
        timestamp: Date.now()
      };
      try {
        localStorage.setItem('yf_last_status_event', JSON.stringify(syncPayload));
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('yf_order_status_changed', {
        detail: syncPayload
      }));
      window.dispatchEvent(new Event('order_status_updated'));
    } catch (e) {
      console.warn('Lỗi đồng bộ danh sách đơn hàng khách hàng:', e);
    }
  };

  const removeCustomerOrderStorage = (targetOrderId) => {
    try {
      const tId = String(targetOrderId || '').trim();
      const orderDigits = tId.replace(/\D/g, '');

      const isMatch = (ord) => {
        if (!ord) return false;
        const ordId = String(ord.order_id || '').trim();
        const ordCode = String(ord.order_code || ord.order_number || '').trim();
        const itemDigits = (ordCode || ordId).replace(/\D/g, '');
        if (ordId === tId || ordCode === tId) return true;
        if (orderDigits && itemDigits && orderDigits === itemDigits) return true;
        return false;
      };

      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('yf_customer_orders') || k === 'yf_manager_orders' || k === 'orders')) {
          allKeys.push(k);
        }
      }

      allKeys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(cOrd => !isMatch(cOrd));
            localStorage.setItem(k, JSON.stringify(filtered));
          }
        } catch (err) {}
      });

      try {
        const lastRaw = sessionStorage.getItem('yf_last_completed_order');
        if (lastRaw) {
          const lastObj = JSON.parse(lastRaw);
          if (isMatch(lastObj)) {
            sessionStorage.removeItem('yf_last_completed_order');
          }
        }
      } catch (e) {}

      window.dispatchEvent(new Event('order_status_updated'));
    } catch (e) {}
  };

  // Mở modal chi tiết & chỉnh sửa trạng thái
  const handleOpenEdit = (ord) => {
    if (!ord) return;
    const idStr = String(ord.order_id || '').trim();
    const numStr = String(ord.order_number || ord.order_code || '').trim();
    const digits = (numStr || idStr).replace(/\D/g, '');

    const isRet = isOrderReturned(ord.order_status, ord.status_label, ord.note, ord);
    const isCanc = !isRet && isOrderCancelled(ord.order_status, ord.status_label, ord.note, ord);

    let refundReason = isRet ? (ord.refund_reason || '') : '';
    let refundBank = isRet ? (ord.refund_bank || '') : '';
    let refundDecision = isRet ? (ord.refund_decision || '') : '';
    let rejectReason = isRet ? (ord.reject_reason || '') : '';
    let cancelReason = isCanc ? (ord.cancel_reason || '') : '';
    let note = ord.note || '';

    // Tìm kiếm thêm dữ liệu refund / cancel từ overrides (chỉ lấy đúng loại)
    try {
      const rawOv = localStorage.getItem('yf_order_status_overrides');
      if (rawOv) {
        const ov = JSON.parse(rawOv);
        const entry = (digits && ov[digits]) || (idStr && ov[idStr]) || (numStr && ov[numStr]);
        if (entry) {
          const entryStatus = String(entry.status || '').toUpperCase();
          if (isRet && (entryStatus === 'RETURNED' || entry.refund_reason || entry.refund_bank)) {
            refundReason = refundReason || entry.refund_reason || '';
            refundBank = refundBank || entry.refund_bank || '';
            refundDecision = refundDecision || entry.refund_decision || '';
            rejectReason = rejectReason || entry.reject_reason || '';
          } else if (isCanc && (entryStatus === 'CANCELLED' || entry.cancel_reason)) {
            if (entry.cancel_reason && !isRefundNote(entry.cancel_reason)) {
              cancelReason = cancelReason || entry.cancel_reason;
            }
          }
          if (!note) note = entry.note || '';
        }
      }
    } catch (e) {}

    // Tìm trong yf_customer_orders
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('yf_customer_orders')) {
          const rawC = localStorage.getItem(k);
          if (rawC) {
            const parsedC = JSON.parse(rawC);
            if (Array.isArray(parsedC)) {
              const match = parsedC.find(c => {
                const cDigits = String(c.order_code || c.order_id || c.order_number || '').replace(/\D/g, '');
                return cDigits && digits && cDigits === digits;
              });
              if (match) {
                const matchStatus = String(match.status || match.order_status || '').toUpperCase();
                if (isRet && (matchStatus === 'RETURNED' || match.refund_reason || match.refund_bank)) {
                  refundReason = refundReason || match.refund_reason || '';
                  refundBank = refundBank || match.refund_bank || '';
                  refundDecision = refundDecision || match.refund_decision || '';
                  rejectReason = rejectReason || match.reject_reason || '';
                } else if (isCanc && (matchStatus === 'CANCELLED' || match.cancel_reason)) {
                  if (match.cancel_reason && !isRefundNote(match.cancel_reason)) {
                    cancelReason = cancelReason || match.cancel_reason;
                  }
                }
                if (!note) note = match.note || '';
              }
            }
          }
        }
      }
    } catch (e) {}

    let orderStatusToSet = ord.order_status;
    let statusLabelToSet = ord.status_label;

    if (isRet) {
      orderStatusToSet = 'RETURNED';
      cancelReason = ''; // Tuyệt đối không lưu cancelReason cho đơn đổi trả
      if (note) {
        if (note.includes('Đã xác nhận hoàn tiền') || ord.status_label === 'Đã hoàn tiền') {
          refundDecision = 'APPROVED';
        } else if (note.includes('Từ chối hoàn tiền') || ord.status_label === 'Từ chối hoàn') {
          refundDecision = 'REJECTED';
        }

        if (note.includes('STK:')) {
          const parts = note.split('STK:');
          if (parts[1] && !refundBank) refundBank = parts[1].trim();
          if (parts[0] && !refundReason) {
            const rPart = parts[0].replace('Khách yêu cầu hoàn tiền:', '').replace('Đã xác nhận hoàn tiền:', '').replace('|', '').trim();
            if (rPart && !rPart.includes('₫') && !rPart.includes('đ')) refundReason = rPart;
          }
        } else if (note.includes('Khách yêu cầu hoàn tiền:') && !refundReason) {
          refundReason = note.replace('Khách yêu cầu hoàn tiền:', '').trim();
        } else if (!refundReason && !note.toLowerCase().includes('hủy')) {
          refundReason = note.trim();
        }
      }
      if (!refundReason) {
        refundReason = 'Sản phẩm không vừa kích cỡ (Size)';
      }
      if (ord.status_label === 'Đã hoàn tiền' || refundDecision === 'APPROVED') {
        refundDecision = 'APPROVED';
        statusLabelToSet = 'Đã hoàn tiền';
      } else if (ord.status_label === 'Từ chối hoàn' || refundDecision === 'REJECTED') {
        refundDecision = 'REJECTED';
        statusLabelToSet = 'Từ chối hoàn';
      } else {
        statusLabelToSet = 'Đổi trả';
      }
    } else if (isCanc) {
      orderStatusToSet = 'CANCELLED';
      statusLabelToSet = 'Đã hủy';
      refundReason = '';
      refundBank = '';
      refundDecision = '';
      rejectReason = '';

      if (cancelReason && isRefundNote(cancelReason)) {
        cancelReason = '';
      }

      if (!cancelReason) {
        if (ord.cancel_reason && !isRefundNote(ord.cancel_reason)) {
          cancelReason = ord.cancel_reason;
        } else if (note && note.includes('Khách hủy đơn:')) {
          cancelReason = note.replace('Khách hủy đơn:', '').trim();
        } else if (note && !isRefundNote(note)) {
          cancelReason = note.trim();
        }
      }
      if (!cancelReason) {
        cancelReason = 'Đổi ý, không muốn mua nữa';
      }
    } else {
      cancelReason = '';
      refundReason = '';
      refundBank = '';
      refundDecision = '';
      rejectReason = '';
    }

    // Tách riêng ghi chú giao hàng thật sự của khách (chỉ giữ nếu không phải lý do hủy/hoàn tiền)
    let realCustomerDeliveryNote = '';
    const rawDeliveryCandidate = String(ord.customer_delivery_note || ord.delivery_note || (isCanc || isRet ? '' : note) || '').trim();
    if (rawDeliveryCandidate && !isCancelNote(rawDeliveryCandidate) && !isRefundNote(rawDeliveryCandidate) && !isOrderCancelOrRefundNote(rawDeliveryCandidate, cancelReason, refundReason)) {
      if (!isCanc || (rawDeliveryCandidate.toLowerCase() !== cancelReason.toLowerCase())) {
        realCustomerDeliveryNote = rawDeliveryCandidate;
      }
    }

    setShowRejectInput(false);
    setIsEditingRejectReason(false);
    setEditRejectReasonText(rejectReason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop');
    setRejectReasonInput(rejectReason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop (đã qua sử dụng / mất tem mác)');

    setEditingOrder({
      ...ord,
      order_status: orderStatusToSet,
      status: orderStatusToSet,
      status_label: statusLabelToSet,
      refund_reason: refundReason,
      refund_bank: refundBank,
      refund_decision: refundDecision,
      reject_reason: rejectReason,
      cancel_reason: cancelReason,
      customer_delivery_note: realCustomerDeliveryNote,
      note: note,
    });
    setIsEditModalOpen(true);
  };

  // Đồng bộ quyết định hoàn tiền (Xác nhận / Từ chối) sang customer orders storage
  const syncCustomerRefundDecision = (targetOrderId, orderNumber, decision, newStatusLabel, customerLabel, updatedNote, rejectReason = '', refundReason = '', refundBank = '') => {
    try {
      const orderDigits = String(orderNumber || targetOrderId || '').replace(/\D/g, '');
      const tId = String(targetOrderId || '').trim();
      const tNum = String(orderNumber || '').trim();

      const isMatch = (ord) => {
        if (!ord) return false;
        const ordId = String(ord.order_id || '').trim();
        const ordCode = String(ord.order_code || ord.order_number || '').trim();
        const itemDigits = (ordCode || ordId).replace(/\D/g, '');
        if (ordId && (ordId === tId || ordId === tNum)) return true;
        if (ordCode && (ordCode === tId || ordCode === tNum)) return true;
        if (orderDigits && itemDigits && orderDigits === itemDigits) return true;
        return false;
      };

      const allKeys = Object.keys(localStorage).filter(k =>
        k && (k.startsWith('yf_customer_orders') || k === 'yf_manager_orders' || k === 'orders')
      );
      if (!allKeys.includes('yf_customer_orders')) allKeys.push('yf_customer_orders');

      allKeys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            let hasChange = false;
            const updated = parsed.map(cOrd => {
              if (isMatch(cOrd)) {
                hasChange = true;
                return {
                  ...cOrd,
                  status: 'RETURNED',
                  order_status: 'RETURNED',
                  status_label: k === 'yf_manager_orders' ? newStatusLabel : customerLabel,
                  refund_decision: decision,
                  reject_reason: rejectReason || cOrd.reject_reason,
                  refund_reason: refundReason || cOrd.refund_reason,
                  refund_bank: refundBank || cOrd.refund_bank,
                  note: updatedNote,
                };
              }
              return cOrd;
            });
            if (hasChange) {
              localStorage.setItem(k, JSON.stringify(updated));
            }
          }
        } catch (err) {}
      });

      try {
        const lastRaw = sessionStorage.getItem('yf_last_completed_order');
        if (lastRaw) {
          const lastObj = JSON.parse(lastRaw);
          if (isMatch(lastObj)) {
            sessionStorage.setItem('yf_last_completed_order', JSON.stringify({
              ...lastObj,
              status: 'RETURNED',
              order_status: 'RETURNED',
              status_label: customerLabel,
              refund_decision: decision,
              reject_reason: rejectReason || lastObj.reject_reason,
              refund_reason: refundReason || lastObj.refund_reason,
              refund_bank: refundBank || lastObj.refund_bank,
              note: updatedNote,
            }));
          }
        }
      } catch (e) {}
    } catch (e) {
      console.warn('Lỗi syncCustomerRefundDecision:', e);
    }
  };

  // Xác nhận hoàn tiền đơn hàng
  const handleConfirmRefund = async (targetOrder) => {
    if (!targetOrder) return;
    const tId = String(targetOrder.order_id || '').trim();
    const tNum = String(targetOrder.order_number || targetOrder.order_code || '').trim();
    const digits = (tNum || tId).replace(/\D/g, '');

    const bankInfo = targetOrder.refund_bank || (targetOrder.note && targetOrder.note.includes('STK:') ? targetOrder.note.split('STK:')[1]?.trim() : '');
    const refundAmt = Number(targetOrder.total_amount || 0).toLocaleString('vi-VN');

    const newStatus = 'RETURNED';
    const newStatusLabel = 'Đã hoàn tiền';
    const customerLabel = 'ĐÃ HOÀN TIỀN';
    const updatedNote = `Đã xác nhận hoàn tiền: ${refundAmt}₫ | ${targetOrder.refund_reason ? `Lý do: ${targetOrder.refund_reason} | ` : ''}STK: ${bankInfo}`;

    // 1. Lưu overrides vĩnh viễn với tất cả biến thể mã đơn
    try {
      const rawOv = localStorage.getItem('yf_order_status_overrides');
      const overrides = rawOv ? JSON.parse(rawOv) : {};
      const overrideEntry = {
        status: newStatus,
        status_label: newStatusLabel,
        status_label_manager: newStatusLabel,
        status_label_customer: customerLabel,
        refund_decision: 'APPROVED',
        refund_bank: bankInfo,
        refund_reason: targetOrder.refund_reason || '',
        note: updatedNote,
        updated_at: Date.now(),
      };
      if (digits) {
        overrides[digits] = overrideEntry;
        overrides[`YF-${digits}`] = overrideEntry;
        overrides[`#YF-${digits}`] = overrideEntry;
        overrides[`YF - ${digits}`] = overrideEntry;
        overrides[`#YF - ${digits}`] = overrideEntry;
        overrides[`YF – ${digits}`] = overrideEntry;
        overrides[`#YF – ${digits}`] = overrideEntry;
        overrides[`#${digits}`] = overrideEntry;
        for (const k of Object.keys(overrides)) {
          if (k.replace(/\D/g, '') === digits) {
            overrides[k] = overrideEntry;
          }
        }
      }
      if (tId) overrides[tId] = overrideEntry;
      if (tNum) overrides[tNum] = overrideEntry;
      localStorage.setItem('yf_order_status_overrides', JSON.stringify(overrides));
    } catch (e) {}

    // 2. Cập nhật state orders của Manager
    const updatedOrders = orders.map(o => {
      const oId = String(o.order_id || '').trim();
      const oNum = String(o.order_number || o.order_code || '').trim();
      const oDigits = (oNum || oId).replace(/\D/g, '');
      const isMatch = (tId && (oId === tId || oNum === tId)) ||
                      (tNum && (oId === tNum || oNum === tNum)) ||
                      (digits && oDigits && digits === oDigits);
      if (isMatch) {
        return {
          ...o,
          order_status: newStatus,
          status: newStatus,
          status_label: newStatusLabel,
          refund_decision: 'APPROVED',
          refund_bank: bankInfo,
          note: updatedNote,
          payment_status: 'REFUNDED',
          payment_label: 'Đã hoàn tiền',
        };
      }
      return o;
    });
    saveOrders(updatedOrders);

    // 3. Đồng bộ customer orders storage
    syncCustomerRefundDecision(tId, tNum, 'APPROVED', newStatusLabel, customerLabel, updatedNote, '', targetOrder.refund_reason || '', bankInfo);

    // 4. Cập nhật MySQL DB backend
    try {
      if (tId) orderService.updateOrderStatus(tId, newStatus, updatedNote).catch(() => {});
      if (tNum && tNum !== tId) orderService.updateOrderStatus(tNum, newStatus, updatedNote).catch(() => {});
      if (digits && digits !== tId && digits !== tNum) orderService.updateOrderStatus(digits, newStatus, updatedNote).catch(() => {});
    } catch (e) {}

    // 5. Phát sự kiện toàn cục & BroadcastChannel
    const statusPayload = {
      orderId: tId,
      orderNumber: tNum,
      digits,
      status: newStatus,
      statusLabel: newStatusLabel,
      customerLabel,
      refund_decision: 'APPROVED',
      refund_bank: bankInfo,
      note: updatedNote,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('yf_last_status_event', JSON.stringify(statusPayload));
      const bc = new BroadcastChannel('yf_orders_sync_channel');
      bc.postMessage(statusPayload);
      bc.close();
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('yf_order_status_changed', { detail: statusPayload }));
    window.dispatchEvent(new Event('order_status_updated'));

    // Cập nhật lại editingOrder & Đóng modal nếu đang mở
    setEditingOrder(prev => prev ? {
      ...prev,
      order_status: newStatus,
      status_label: newStatusLabel,
      refund_decision: 'APPROVED',
      refund_bank: bankInfo,
      note: updatedNote,
      payment_status: 'REFUNDED',
      payment_label: 'Đã hoàn tiền',
    } : null);
    setIsEditModalOpen(false);

    showSuccess(`Đã xác nhận hoàn tiền thành công cho đơn hàng #${tNum || tId}!`);
  };

  // Mở mục nhập lý do hoặc xác nhận từ chối hoàn tiền ngay lập tức
  const handleRejectRefund = async (targetOrder) => {
    if (!targetOrder) return;
    const defaultReason = rejectReasonInput.trim() || targetOrder.reject_reason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop';
    await handleConfirmRejectWithReason(targetOrder, defaultReason);
    setIsEditModalOpen(false);
  };

  // Xác nhận từ chối hoàn tiền với lý do cụ thể do Shop nhập
  const handleConfirmRejectWithReason = async (targetOrder, customReason) => {
    if (!targetOrder) return;
    const tId = String(targetOrder.order_id || '').trim();
    const tNum = String(targetOrder.order_number || targetOrder.order_code || '').trim();
    const digits = (tNum || tId).replace(/\D/g, '');

    const rejectReason = String(customReason || '').trim() || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop';
    const newStatus = 'RETURNED';
    const newStatusLabel = 'Từ chối hoàn';
    const customerLabel = 'TỪ CHỐI HOÀN';
    const updatedNote = `Từ chối hoàn tiền: ${rejectReason} | Lý do khách gửi: ${targetOrder.refund_reason || 'Đổi trả'}`;

    // 1. Lưu overrides với tất cả biến thể mã đơn
    try {
      const rawOv = localStorage.getItem('yf_order_status_overrides');
      const overrides = rawOv ? JSON.parse(rawOv) : {};
      const overrideEntry = {
        status: newStatus,
        status_label: newStatusLabel,
        status_label_manager: newStatusLabel,
        status_label_customer: customerLabel,
        refund_decision: 'REJECTED',
        reject_reason: rejectReason,
        refund_reason: targetOrder.refund_reason || '',
        note: updatedNote,
        updated_at: Date.now(),
      };
      if (digits) {
        overrides[digits] = overrideEntry;
        overrides[`YF-${digits}`] = overrideEntry;
        overrides[`#YF-${digits}`] = overrideEntry;
        overrides[`YF - ${digits}`] = overrideEntry;
        overrides[`#YF - ${digits}`] = overrideEntry;
        overrides[`YF – ${digits}`] = overrideEntry;
        overrides[`#YF – ${digits}`] = overrideEntry;
        overrides[`#${digits}`] = overrideEntry;
      }
      if (tId) overrides[tId] = overrideEntry;
      if (tNum) overrides[tNum] = overrideEntry;
      localStorage.setItem('yf_order_status_overrides', JSON.stringify(overrides));
    } catch (e) {}

    // 2. Cập nhật state orders
    const updatedOrders = orders.map(o => {
      const oId = String(o.order_id || '').trim();
      const oNum = String(o.order_number || o.order_code || '').trim();
      const oDigits = (oNum || oId).replace(/\D/g, '');
      const isMatch = (tId && (oId === tId || oNum === tId)) ||
                      (tNum && (oId === tNum || oNum === tNum)) ||
                      (digits && oDigits && digits === oDigits);
      if (isMatch) {
        return {
          ...o,
          order_status: newStatus,
          status: newStatus,
          status_label: newStatusLabel,
          refund_decision: 'REJECTED',
          reject_reason: rejectReason,
          note: updatedNote,
        };
      }
      return o;
    });
    saveOrders(updatedOrders);

    // 3. Đồng bộ customer orders storage
    syncCustomerRefundDecision(tId, tNum, 'REJECTED', newStatusLabel, customerLabel, updatedNote, rejectReason, targetOrder.refund_reason || '', targetOrder.refund_bank || '');

    // 4. Cập nhật DB
    try {
      if (tId) orderService.updateOrderStatus(tId, newStatus, updatedNote).catch(() => {});
      if (tNum && tNum !== tId) orderService.updateOrderStatus(tNum, newStatus, updatedNote).catch(() => {});
      if (digits && digits !== tId && digits !== tNum) orderService.updateOrderStatus(digits, newStatus, updatedNote).catch(() => {});
    } catch (e) {}

    // 5. Phát sự kiện toàn cục
    const statusPayload = {
      orderId: tId,
      orderNumber: tNum,
      digits,
      status: newStatus,
      statusLabel: newStatusLabel,
      customerLabel,
      refund_decision: 'REJECTED',
      reject_reason: rejectReason,
      note: updatedNote,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('yf_last_status_event', JSON.stringify(statusPayload));
      const bc = new BroadcastChannel('yf_orders_sync_channel');
      bc.postMessage(statusPayload);
      bc.close();
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('yf_order_status_changed', { detail: statusPayload }));
    window.dispatchEvent(new Event('order_status_updated'));

    // Cập nhật lại editingOrder
    setEditingOrder(prev => prev ? {
      ...prev,
      order_status: newStatus,
      status_label: newStatusLabel,
      refund_decision: 'REJECTED',
      reject_reason: rejectReason,
      note: updatedNote,
    } : null);

    setShowRejectInput(false);
    setIsEditModalOpen(false);
    showSuccess(`Đã từ chối hoàn tiền cho đơn hàng #${tNum || tId} thành công!`);
  };

  // Cập nhật lại lý do từ chối hoàn tiền khi Shop muốn thay đổi
  const handleUpdateRejectReason = async (targetOrder, customReason) => {
    if (!targetOrder) return;
    const tId = String(targetOrder.order_id || '').trim();
    const tNum = String(targetOrder.order_number || targetOrder.order_code || '').trim();
    const digits = (tNum || tId).replace(/\D/g, '');

    const rejectReason = String(customReason || '').trim() || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop';
    const newStatus = 'RETURNED';
    const newStatusLabel = 'Từ chối hoàn';
    const customerLabel = 'TỪ CHỐI HOÀN';
    const updatedNote = `Từ chối hoàn tiền: ${rejectReason} | Lý do khách gửi: ${targetOrder.refund_reason || 'Đổi trả'}`;

    // 1. Lưu overrides với tất cả biến thể mã đơn
    try {
      const rawOv = localStorage.getItem('yf_order_status_overrides');
      const overrides = rawOv ? JSON.parse(rawOv) : {};
      const overrideEntry = {
        status: newStatus,
        status_label: newStatusLabel,
        status_label_manager: newStatusLabel,
        status_label_customer: customerLabel,
        refund_decision: 'REJECTED',
        reject_reason: rejectReason,
        refund_reason: targetOrder.refund_reason || '',
        note: updatedNote,
        updated_at: Date.now(),
      };
      if (digits) {
        overrides[digits] = overrideEntry;
        overrides[`YF-${digits}`] = overrideEntry;
        overrides[`#YF-${digits}`] = overrideEntry;
        overrides[`YF - ${digits}`] = overrideEntry;
        overrides[`#YF - ${digits}`] = overrideEntry;
        overrides[`YF – ${digits}`] = overrideEntry;
        overrides[`#YF – ${digits}`] = overrideEntry;
        overrides[`#${digits}`] = overrideEntry;
        for (const k of Object.keys(overrides)) {
          if (k.replace(/\D/g, '') === digits) {
            overrides[k] = overrideEntry;
          }
        }
      }
      if (tId) overrides[tId] = overrideEntry;
      if (tNum) overrides[tNum] = overrideEntry;
      localStorage.setItem('yf_order_status_overrides', JSON.stringify(overrides));
    } catch (e) {}

    // 2. Cập nhật state orders của Manager
    const updatedOrders = orders.map(o => {
      const oId = String(o.order_id || '').trim();
      const oNum = String(o.order_number || o.order_code || '').trim();
      const oDigits = (oNum || oId).replace(/\D/g, '');
      const isMatch = (tId && (oId === tId || oNum === tId)) ||
                      (tNum && (oId === tNum || oNum === tNum)) ||
                      (digits && oDigits && digits === oDigits);
      if (isMatch) {
        return {
          ...o,
          order_status: newStatus,
          status: newStatus,
          status_label: newStatusLabel,
          refund_decision: 'REJECTED',
          reject_reason: rejectReason,
          note: updatedNote,
        };
      }
      return o;
    });
    saveOrders(updatedOrders);

    // 3. Đồng bộ customer orders storage
    syncCustomerRefundDecision(tId, tNum, 'REJECTED', newStatusLabel, customerLabel, updatedNote, rejectReason, targetOrder.refund_reason || '', targetOrder.refund_bank || '');

    // 4. Cập nhật DB MySQL backend
    try {
      if (tId) orderService.updateOrderStatus(tId, newStatus, updatedNote).catch(() => {});
      if (tNum && tNum !== tId) orderService.updateOrderStatus(tNum, newStatus, updatedNote).catch(() => {});
      if (digits && digits !== tId && digits !== tNum) orderService.updateOrderStatus(digits, newStatus, updatedNote).catch(() => {});
    } catch (e) {}

    // 5. Phát sự kiện toàn cục & BroadcastChannel
    const statusPayload = {
      orderId: tId,
      orderNumber: tNum,
      digits,
      status: newStatus,
      statusLabel: newStatusLabel,
      customerLabel,
      refund_decision: 'REJECTED',
      reject_reason: rejectReason,
      note: updatedNote,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('yf_last_status_event', JSON.stringify(statusPayload));
      const bc = new BroadcastChannel('yf_orders_sync_channel');
      bc.postMessage(statusPayload);
      bc.close();
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('yf_order_status_changed', { detail: statusPayload }));
    window.dispatchEvent(new Event('order_status_updated'));

    // Cập nhật lại editingOrder hiện tại
    setEditingOrder(prev => prev ? {
      ...prev,
      order_status: newStatus,
      status_label: newStatusLabel,
      refund_decision: 'REJECTED',
      reject_reason: rejectReason,
      note: updatedNote,
    } : null);

    showSuccess(`Đã cập nhật lý do từ chối hoàn tiền cho đơn hàng #${tNum || tId} thành công!`);
  };

  // Lưu chỉnh sửa trạng thái đơn hàng
  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    await updateSingleOrderStatus(editingOrder, editingOrder.order_status);
    setIsEditModalOpen(false);
  };

  // Mở modal xác nhận xóa 1 đơn hàng
  const handleOpenDelete = (id) => {
    setDeletingOrderId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrderId) return;
    const idToDelete = String(deletingOrderId || '').trim();
    const orderObj = orders.find(o => String(o.order_id) === idToDelete || String(o.order_number) === idToDelete);
    const numToDelete = String(orderObj?.order_number || idToDelete).trim();
    const digitsToDelete = (numToDelete || idToDelete).replace(/\D/g, '');

    // 1. Ghi nhận xóa vĩnh viễn vào danh sách ID đã xóa
    addDeletedOrderId(idToDelete);
    addDeletedOrderId(numToDelete);
    if (digitsToDelete) addDeletedOrderId(digitsToDelete);

    // 2. Gọi backend API xóa trong CSDL MySQL
    try {
      await orderService.deleteOrder(idToDelete).catch(() => {});
      if (numToDelete !== idToDelete) {
        await orderService.deleteOrder(numToDelete).catch(() => {});
      }
      if (digitsToDelete && digitsToDelete !== idToDelete) {
        await orderService.deleteOrder(digitsToDelete).catch(() => {});
      }
    } catch (e) {}

    // 3. Loại bỏ khỏi danh sách đơn hàng
    const updated = orders.filter(o => {
      const oId = String(o.order_id || '').trim();
      const oNum = String(o.order_number || '').trim();
      const oDigits = (oNum || oId).replace(/\D/g, '');

      if (oId === idToDelete || oNum === idToDelete) return false;
      if (oId === numToDelete || oNum === numToDelete) return false;
      if (digitsToDelete && oDigits && digitsToDelete === oDigits) return false;
      return true;
    });

    saveOrders(updated);

    // 4. Xóa sạch khỏi mọi bộ nhớ customer orders
    removeCustomerOrderStorage(idToDelete);
    if (numToDelete !== idToDelete) removeCustomerOrderStorage(numToDelete);
    if (digitsToDelete) removeCustomerOrderStorage(digitsToDelete);

    setSelectedOrderIds(prev => prev.filter(id => {
      const sId = String(id).trim();
      const sDigits = sId.replace(/\D/g, '');
      return sId !== idToDelete && sId !== numToDelete && (!digitsToDelete || sDigits !== digitsToDelete);
    }));

    setIsDeleteModalOpen(false);
    setDeletingOrderId(null);

    // 5. Phát sự kiện toàn cục để các trang ProfilePage và Sidebar cập nhật theo
    window.dispatchEvent(new Event('order_status_updated'));
    window.dispatchEvent(new CustomEvent('yf_order_status_changed', {
      detail: { action: 'DELETE', orderId: idToDelete, orderDigits: digitsToDelete }
    }));

    showSuccess('Đã xóa đơn hàng thành công khỏi hệ thống!');
  };

  // Tạo đơn hàng mới từ trang Quản trị
  const handleCreateNewOrder = (e) => {
    e.preventDefault();
    if (!newOrderForm.recipient_name || !newOrderForm.recipient_phone) {
      showError('Vui lòng nhập tên khách hàng và số điện thoại!');
      return;
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newCode = `YF-2025-${randomCode}`;
    const totalAmount = Number(newOrderForm.unit_price || 0) * Number(newOrderForm.quantity || 1);

    let statusLabel = 'Chờ xác nhận';
    if (newOrderForm.order_status === 'SHIPPING') statusLabel = 'Đang vận chuyển';
    else if (newOrderForm.order_status === 'COMPLETED') statusLabel = 'Đã giao';
    else if (newOrderForm.order_status === 'CANCELLED') statusLabel = 'Đã hủy';
    else if (newOrderForm.order_status === 'RETURNED') statusLabel = 'Đổi trả';

    let payLabel = 'PayOS - Đã thanh toán';
    if (newOrderForm.payment_method === 'DIRECT') payLabel = 'Thanh toán trực tiếp';
    else if (newOrderForm.payment_method === 'COD') payLabel = 'COD - Chưa thanh toán';

    const createdOrder = {
      order_id: String(randomCode),
      order_number: newCode,
      created_at: 'Vừa xong - Hôm nay',
      created_date: new Date().toISOString(),
      customer: {
        name: newOrderForm.recipient_name,
        phone: newOrderForm.recipient_phone,
        is_vip: false,
        email: newOrderForm.recipient_email,
        address: newOrderForm.address || 'Giao tại cửa hàng Flagship Boutique'
      },
      items: [
        {
          id: `it-${randomCode}-1`,
          name: newOrderForm.product_name || 'Trang Phục May Đo Thiết Kế Haute Couture',
          image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800',
          size: newOrderForm.size,
          color: newOrderForm.color,
          quantity: Number(newOrderForm.quantity || 1),
          price: Number(newOrderForm.unit_price || 0),
          total_items_count: Number(newOrderForm.quantity || 1)
        }
      ],
      total_amount: totalAmount,
      payment_method: newOrderForm.payment_method,
      payment_status: newOrderForm.payment_method === 'COD' ? 'PENDING' : 'PAID',
      payment_label: payLabel,
      order_status: newOrderForm.order_status,
      status_label: statusLabel,
      note: newOrderForm.note
    };

    saveOrders([createdOrder, ...orders]);
    setIsCreateModalOpen(false);
    showSuccess(`Đã tạo thành công đơn hàng mới #${newCode}!`);

    // Reset form
    setNewOrderForm({
      recipient_name: '',
      recipient_phone: '',
      recipient_email: '',
      address: '',
      product_name: '',
      size: 'Size M',
      color: 'Màu Tiêu chuẩn',
      quantity: 1,
      unit_price: 2500000,
      payment_method: 'PAYOS',
      order_status: 'PENDING',
      note: ''
    });
  };

  return (
    <div className="manager-layout">
      {/* 1. LEFT SIDEBAR */}
      <ManagerSidebar activeMenu="orders" />

      {/* 2. MAIN CONTENT AREA */}
      <main className="main-content-area">
        <ManagerHeader showSearch={false} userName="Hoàng Kim Anh" userRole="Quản Lý Cửa Hàng & Bán Hàng" />

        <div className="order-manager-page-body">
          {/* Breadcrumb & Title Row */}
          <div className="order-header-row">
            <div>
              <p className="order-super-title">YOUTHFASHION • QUẢN LÝ VẬN HÀNH & ĐƠN HÀNG</p>
              <h1 className="order-main-title font-serif">Danh Sách Đơn Hàng</h1>
            </div>

            <button
              type="button"
              className="btn-create-order"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Tạo Đơn Hàng Mới</span>
            </button>
          </div>

          {/* 3 Metric Summary Cards */}
          <div className="order-stats-grid">
            {/* Card 1 */}
            <div className="order-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">TỔNG ĐƠN HÀNG (HÔM NAY)</span>
                <ShoppingBag size={17} className="stat-icon-neutral" />
              </div>
              <div className="stat-card-value font-serif">
                {stats.totalOrdersToday} Đơn Hàng
              </div>
              <div className="stat-card-sub">
                Thành công: <strong>{stats.completedToday}</strong> • Đang xử lý: <strong>{stats.processingToday}</strong>
              </div>
              <div className="stat-bar-track">
                <div className="stat-bar-fill bar-fill-black" style={{ width: `${stats.completedPercent}%` }} />
              </div>
            </div>

            {/* Card 2 */}
            <div className="order-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">ĐƠN CHỜ XỬ LÝ GẤP</span>
                <Star size={17} className="stat-icon-star" />
              </div>
              <div className="stat-card-value font-serif">
                {stats.urgentPendingCount} Đơn Chờ Duyệt
              </div>
              <div className="stat-card-sub">
                Đóng góp <strong>{stats.pendingRevFormatted}</strong> doanh thu cần xác nhận
              </div>
              <div className="stat-bar-track">
                <div className="stat-bar-fill bar-fill-amber" style={{ width: `${stats.pendingPercent}%` }} />
              </div>
            </div>

            {/* Card 3 */}
            <div className="order-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">DOANH THU ĐƠN HÀNG (NGÀY)</span>
                <DollarSign size={17} className="stat-icon-dollar" />
              </div>
              <div className="stat-card-value font-serif">
                {stats.todayRevenueFormatted}
              </div>
              <div className="stat-card-sub">
                AOV trung bình ~<strong>{stats.aovFormatted}</strong> / đơn
              </div>
              <div className="stat-bar-track">
                <div className="stat-bar-fill bar-fill-grey" style={{ width: stats.todayRevenueFormatted !== '0đ' ? '60%' : '0%' }} />
              </div>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="order-tabs-wrapper">
            <div className="order-status-tabs">
              {[
                { key: 'ALL', label: `Tất cả (${counts.ALL})`, type: 'all' },
                { key: 'PENDING', label: `Chờ xác nhận (${counts.PENDING})`, type: 'pending' },
                { key: 'CONFIRMED', label: `Đã xác nhận (${counts.CONFIRMED})`, type: 'confirmed' },
                { key: 'SHIPPING', label: `Đang vận chuyển (${counts.SHIPPING})`, type: 'shipping' },
                { key: 'COMPLETED', label: `Đã giao (${counts.COMPLETED})`, type: 'completed' },
                { key: 'CANCELLED', label: `Đã hủy (${counts.CANCELLED})`, type: 'cancelled' },
                { key: 'RETURNED', label: `Đổi trả (${counts.RETURNED})`, type: 'returned' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  className={`order-tab-btn tab-${tab.type} ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setCurrentPage(1);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Batch Action Toolbar */}
          <div className="batch-action-bar">
            <span className="batch-count-text">
              Đã chọn: <strong>{selectedOrderIds.length}</strong> mục
            </span>

            {selectedOrderIds.length > 0 && (
              <button
                type="button"
                className="btn-bulk-delete"
                onClick={handleBulkDelete}
              >
                <Trash2 size={13} />
                <span>Xóa các mục đã chọn</span>
              </button>
            )}
          </div>

          {/* Search & Filter Controls Bar */}
          <div className="order-filter-controls">
            <div className="search-input-box">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo mã đơn (#YF-...), tên khách hàng, số điện thoại..."
                className="search-field"
              />
              {searchQuery && (
                <button type="button" className="clear-search" onClick={() => setSearchQuery('')}>
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="dropdown-filter-group">
              <select
                className="filter-select"
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Phương thức thanh toán (Tất cả)</option>
                <option value="PAYOS">PayOS - Chuyển khoản VietQR</option>
                <option value="COD">Tiền mặt khi nhận hàng (COD)</option>
                <option value="DIRECT">Thanh toán trực tiếp tại Flagship</option>
              </select>

              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="NEWEST">Sắp xếp: Mới nhất</option>
                <option value="OLDEST">Sắp xếp: Cũ nhất</option>
                <option value="AMOUNT_DESC">Giá trị: Cao đến thấp</option>
                <option value="AMOUNT_ASC">Giá trị: Thấp đến cao</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="orders-table-card">
            <div className="table-responsive">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={paginatedOrders.length > 0 && selectedOrderIds.length === paginatedOrders.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>MÃ ĐƠN & THỜI GIAN</th>
                    <th>KHÁCH HÀNG</th>
                    <th>SẢN PHẨM & SỐ LƯỢNG</th>
                    <th>TỔNG TIỀN & THANH TOÁN</th>
                    <th>TRẠNG THÁI</th>
                    <th style={{ textAlign: 'center' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-table-cell">
                        <div className="empty-table-content">
                          <ShoppingBag size={42} strokeWidth={1.5} className="empty-icon" />
                          <p className="empty-text">Chưa có đơn hàng nào trong hệ thống</p>
                          <p style={{ fontSize: '12px', color: '#8C857B', margin: '4px 0 0' }}>
                            Đơn đặt hàng mới từ tài khoản khách hàng sẽ xuất hiện tự động tại đây.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((ord) => {
                      const cat = getCategoryFromStatus(ord.order_status, ord.status_label, ord.note, ord);
                      const isSelected = selectedOrderIds.includes(ord.order_id);
                      const firstItem = ord.items?.[0] || {};
                      const itemImg = resolveOrderItemImage(firstItem);
                      const totalCount = ord.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1;

                      return (
                        <tr key={ord.order_id} className={isSelected ? 'row-selected' : ''}>
                          {/* Checkbox */}
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              className="custom-checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(ord.order_id)}
                            />
                          </td>

                          {/* Mã đơn & Thời gian */}
                          <td>
                            <div className="order-code-cell">
                              <span
                                className="order-code-text"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleOpenEdit(ord)}
                                title="Bấm để xem chi tiết đơn hàng"
                              >
                                #{ord.order_number}
                              </span>
                              <span className="order-time-text">{ord.created_at}</span>
                            </div>
                          </td>

                          {/* Khách hàng */}
                          <td>
                            <div className="customer-cell">
                              <div className="customer-name-row">
                                <span className="customer-name">{ord.customer?.name}</span>
                                {ord.customer?.is_vip && (
                                  <span className="vip-badge">{ord.customer?.vip_tag || 'VIP Gold'}</span>
                                )}
                              </div>
                              <span className="customer-phone">{ord.customer?.phone}</span>
                            </div>
                          </td>

                          {/* Sản phẩm & Số lượng */}
                          <td>
                            <div className="product-info-cell">
                              <img
                                src={itemImg}
                                alt={firstItem.name || 'Sản phẩm'}
                                className="product-thumb"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800';
                                }}
                              />
                              <div className="product-text-details">
                                <span className="product-name-title" title={firstItem.name}>
                                  {firstItem.name || 'Sản phẩm Haute Couture'}
                                </span>
                                <span className="product-meta-sub">
                                  {firstItem.size || 'Size M'} • x{firstItem.quantity || 1} (Tổng {totalCount} món)
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Tổng tiền & Thanh toán */}
                          <td>
                            <div className="payment-cell">
                              <span className="amount-text">
                                {Number(ord.total_amount || 0).toLocaleString('vi-VN')}đ
                              </span>
                              {ord.payment_method === 'DIRECT' ? (
                                <span className="payment-pill pill-direct">Thanh toán trực tiếp</span>
                              ) : ord.payment_method === 'COD' ? (
                                <span className="payment-pill pill-cod">COD - Chưa thanh toán</span>
                              ) : (
                                <span className="payment-pill pill-payos">PayOS - Đã thanh toán</span>
                              )}
                            </div>
                          </td>

                          {/* Trạng thái - Dạng Select chuẩn tiện dụng (Đơn đã hủy cố định không được đổi) */}
                          <td>
                            <div className="status-cell">
                              {cat === 'CANCELLED' ? (
                                <span
                                  className="status-fixed-pill status-pill-cancelled"
                                  title="Đơn hàng đã bị hủy, không thể thay đổi trạng thái"
                                >
                                  Đã hủy
                                </span>
                              ) : cat === 'RETURNED' ? (
                                (() => {
                                  const isRej = ord.refund_decision === 'REJECTED' || String(ord.status_label || '').toUpperCase().includes('TỪ CHỐI') || String(ord.note || '').toLowerCase().includes('từ chối hoàn tiền');
                                  const isApp = !isRej && (ord.refund_decision === 'APPROVED' || String(ord.status_label || '').toUpperCase().includes('ĐÃ HOÀN') || String(ord.note || '').toLowerCase().includes('đã xác nhận hoàn tiền'));
                                  return (
                                    <select
                                      className={`status-select-pill ${
                                        isRej
                                          ? 'status-pill-rejected status-pill-cancelled'
                                          : (isApp ? 'status-pill-approved status-pill-completed' : 'status-pill-returned')
                                      }`}
                                      style={{
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        padding: '5px 32px 5px 14px',
                                        borderRadius: '20px',
                                        fontSize: '11.5px',
                                        textAlign: 'left',
                                        border: isRej ? '1.5px solid #FECACA' : (isApp ? '1.5px solid #BBF7D0' : '1.5px solid #E9D5FF'),
                                        backgroundColor: isRej ? '#FEF2F2' : (isApp ? '#DCFCE7' : '#FAF5FF'),
                                        color: isRej ? '#DC2626' : (isApp ? '#15803D' : '#9333EA')
                                      }}
                                      value={isRej ? 'REJECTED' : (isApp ? 'APPROVED' : 'RETURNED')}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'REJECTED') {
                                          handleConfirmRejectWithReason(ord, ord.reject_reason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop');
                                        } else if (val === 'APPROVED') {
                                          handleConfirmRefund(ord);
                                        } else if (val === 'RETURNED') {
                                          updateSingleOrderStatus(ord, 'RETURNED');
                                        }
                                      }}
                                      title="Chuyển trạng thái: Đổi trả / Từ chối hoàn / Đã hoàn tiền"
                                    >
                                      <option value="RETURNED">Đổi trả</option>
                                      <option value="REJECTED">Từ chối hoàn</option>
                                      <option value="APPROVED">Đã hoàn tiền</option>
                                    </select>
                                  );
                                })()
                              ) : (
                                <select
                                  className={`status-select-pill status-pill-${cat.toLowerCase()}`}
                                  value={cat}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'CANCELLED') {
                                      handleOpenShopCancelModal(ord);
                                    } else {
                                      updateSingleOrderStatus(ord, val);
                                    }
                                  }}
                                  title="Bấm để chuyển trạng thái đơn hàng"
                                >
                                  <option value="PENDING">Chờ xác nhận</option>
                                  <option value="CONFIRMED">Đã xác nhận</option>
                                  <option value="SHIPPING">Đang vận chuyển</option>
                                  <option value="COMPLETED">Đã giao</option>
                                  <option value="CANCELLED">Đã hủy</option>
                                </select>
                              )}
                            </div>
                          </td>

                          {/* Thao tác */}
                          <td>
                            <div className="actions-cell">
                              <button
                                type="button"
                                className="action-icon-btn edit-btn"
                                title="Chỉnh sửa & Cập nhật trạng thái"
                                onClick={() => handleOpenEdit(ord)}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                className="action-icon-btn delete-btn"
                                title="Xóa đơn hàng"
                                onClick={() => handleOpenDelete(ord.order_id)}
                              >
                                <Trash2 size={14} />
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

            {/* Pagination & Footer Row */}
            <div className="table-footer-row">
              <div className="footer-left-info">
                <span>Hiển thị {paginatedOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} – {Math.min(currentPage * itemsPerPage, filteredOrders.length)} trong tổng số {filteredOrders.length} đơn hàng</span>
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  &lt; Trang trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    className={`page-number-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Trang sau &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL 1: CHỈNH SỬA & CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG */}
      {isEditModalOpen && editingOrder && (() => {
        const isRetModal = isOrderReturned(editingOrder.order_status, editingOrder.status_label, editingOrder.note, editingOrder);
        const isCancModal = !isRetModal && isOrderCancelled(editingOrder.order_status, editingOrder.status_label, editingOrder.note, editingOrder);
        const realDeliveryNote = getDisplayDeliveryNote(editingOrder);

        return (
          <div className="modal-backdrop-custom" onClick={() => setIsEditModalOpen(false)}>
            <div className="modal-box-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header-custom">
                <div>
                  <p className="modal-super">CHI TIẾT & CẬP NHẬT</p>
                  <h3 className="modal-title font-serif">Đơn Hàng #{editingOrder.order_number}</h3>
                </div>
                <button type="button" className="btn-close-modal" onClick={() => setIsEditModalOpen(false)}>
                  <X size={17} />
                </button>
              </div>

              <div className="modal-body-custom">
                {/* Thông tin khách hàng */}
                <div className="modal-info-panel">
                  <h4 className="panel-title">Thông tin giao nhận</h4>
                  <div className="panel-grid-2">
                    <div className="info-field">
                      <span className="field-label">Khách hàng:</span>
                      <strong className="field-value">{editingOrder.customer?.name}</strong>
                    </div>
                    <div className="info-field">
                      <span className="field-label">Số điện thoại:</span>
                      <span className="field-value">{editingOrder.customer?.phone}</span>
                    </div>
                    <div className="info-field" style={{ gridColumn: 'span 2' }}>
                      <span className="field-label">Địa chỉ giao:</span>
                      <span className="field-value">{editingOrder.customer?.address || 'Tại Flagship Store'}</span>
                    </div>
                    {realDeliveryNote && (
                      <div className="info-field" style={{ gridColumn: 'span 2' }}>
                        <span className="field-label">Ghi chú của khách:</span>
                        <span className="field-value italic-note">"{realDeliveryNote}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* KHỐI HIỂN THỊ CHI TIẾT YÊU CẦU ĐỔI TRẢ & HOÀN TIỀN */}
                {isRetModal && (
                  <div className="modal-info-panel modal-return-highlight" style={{
                    background: '#FAF5FF',
                    border: '1.5px solid #E9D5FF',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #F3E8FF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#7E22CE',
                          color: '#FFFFFF'
                        }}>
                          <RotateCcw size={13} strokeWidth={2.5} />
                        </span>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Thông Tin Yêu Cầu Đổi Trả &amp; Hoàn Tiền
                        </h4>
                      </div>

                      {editingOrder.refund_decision === 'APPROVED' ? (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#DCFCE7',
                          color: '#15803D',
                          border: '1px solid #BBF7D0',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          ✓ ĐÃ HOÀN TIỀN
                        </span>
                      ) : editingOrder.refund_decision === 'REJECTED' ? (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#FEE2E2',
                          color: '#B91C1C',
                          border: '1px solid #FECACA',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          ✕ TỪ CHỐI HOÀN
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#FEF3C7',
                          color: '#B45309',
                          border: '1px solid #FDE68A',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          ⏳ CHỜ XỬ LÝ
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <strong style={{ color: '#581C87', minWidth: '135px' }}>Lý do đổi trả:</strong>
                        <span style={{ color: '#1C1917', fontWeight: 600 }}>
                          {editingOrder.refund_reason ||
                            (editingOrder.note && editingOrder.note.includes('STK:')
                              ? editingOrder.note.split('STK:')[0].replace('Khách yêu cầu hoàn tiền:', '').replace('|', '').trim()
                              : (editingOrder.note ? editingOrder.note.replace('Khách yêu cầu hoàn tiền:', '').trim() : 'Sản phẩm không vừa kích cỡ (Size)'))}
                        </span>
                      </div>

                      {(editingOrder.refund_bank || (editingOrder.note && editingOrder.note.includes('STK:'))) && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <strong style={{ color: '#581C87', minWidth: '135px' }}>TK nhận tiền hoàn:</strong>
                          <span style={{
                            color: '#7E22CE',
                            fontWeight: 700,
                            background: '#FFFFFF',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #D8B4FE',
                            letterSpacing: '0.2px'
                          }}>
                            {editingOrder.refund_bank || (editingOrder.note && editingOrder.note.split('STK:')[1]?.trim())}
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '12px', color: '#6B21A8' }}>
                        <span style={{ minWidth: '135px' }}>Số tiền hoàn dự kiến:</span>
                        <strong style={{ fontSize: '14px', color: '#7E22CE' }}>
                          {Number(editingOrder.total_amount || 0).toLocaleString('vi-VN')}₫
                        </strong>
                      </div>

                      {(editingOrder.refund_decision === 'REJECTED' || editingOrder.reject_reason) && (
                        <div style={{
                          marginTop: '8px',
                          padding: '10px 12px',
                          background: '#FFFFFF',
                          border: '1.5px solid #FECACA',
                          borderRadius: '8px',
                          color: '#991B1B'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEditingRejectReason ? '10px' : '4px' }}>
                            <strong style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '5px', color: '#DC2626' }}>
                              <AlertCircle size={14} /> Lý do Shop đã từ chối hoàn tiền:
                            </strong>
                            {!isEditingRejectReason && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingRejectReason(true);
                                  setEditRejectReasonText(editingOrder.reject_reason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop');
                                }}
                                style={{
                                  background: '#FEF2F2',
                                  border: '1px solid #FECACA',
                                  color: '#DC2626',
                                  borderRadius: '6px',
                                  padding: '3px 10px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Edit size={12} /> Thay đổi lý do
                              </button>
                            )}
                          </div>

                          {!isEditingRejectReason ? (
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C1917', lineHeight: 1.4, display: 'block' }}>
                              "{editingOrder.reject_reason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop'}"
                            </span>
                          ) : (
                            <div style={{ marginTop: '8px', padding: '10px', background: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                                Chọn lý do mẫu hoặc tự nhập lý do từ chối:
                              </label>
                              <select
                                style={{
                                  width: '100%',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #D1D5DB',
                                  fontSize: '12.5px',
                                  marginBottom: '8px',
                                  background: '#FFFFFF',
                                  cursor: 'pointer'
                                }}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setEditRejectReasonText(e.target.value);
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="" disabled>-- Chọn nhanh lý do mẫu có sẵn --</option>
                                <option value="Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop">Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop</option>
                                <option value="Sản phẩm đã qua sử dụng, có mùi lạ hoặc mất tem mác">Sản phẩm đã qua sử dụng, có mùi lạ hoặc mất tem mác</option>
                                <option value="Đã quá thời hạn đổi trả 7 ngày theo quy định của shop">Đã quá thời hạn đổi trả 7 ngày theo quy định của shop</option>
                                <option value="Sản phẩm bị lỗi / hỏng do tác động ngoại lực của người dùng">Sản phẩm bị lỗi / hỏng do tác động ngoại lực của người dùng</option>
                                <option value="Không có video/hình ảnh bằng chứng mở hộp sản phẩm hợp lệ">Không có video/hình ảnh bằng chứng mở hộp sản phẩm hợp lệ</option>
                                <option value="Sản phẩm thuộc danh mục khuyến mãi/xả kho không hỗ trợ đổi trả">Sản phẩm thuộc danh mục khuyến mãi/xả kho không hỗ trợ đổi trả</option>
                                <option value="Thông tin tài khoản nhận tiền hoàn của khách không chính xác">Thông tin tài khoản nhận tiền hoàn của khách không chính xác</option>
                              </select>

                              <textarea
                                rows={2}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  border: '1.5px solid #FCA5A5',
                                  fontSize: '13px',
                                  color: '#1F2937',
                                  boxSizing: 'border-box',
                                  resize: 'vertical',
                                  fontFamily: 'inherit',
                                  lineHeight: 1.4
                                }}
                                value={editRejectReasonText}
                                onChange={(e) => setEditRejectReasonText(e.target.value)}
                                placeholder="Nhập chi tiết lý do từ chối hoàn tiền..."
                              />

                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setIsEditingRejectReason(false)}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    background: '#FFFFFF',
                                    border: '1px solid #D1D5DB',
                                    color: '#4B5563',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const finalReason = editRejectReasonText.trim() || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop';
                                    await handleUpdateRejectReason(editingOrder, finalReason);
                                    setIsEditingRejectReason(false);
                                  }}
                                  style={{
                                    padding: '5px 14px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    background: '#DC2626',
                                    border: 'none',
                                    color: '#FFFFFF',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Check size={13} strokeWidth={2.5} /> Lưu lý do mới
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* KHỐI HIỂN THỊ CHI TIẾT HỦY ĐƠN */}
                {!isRetModal && isCancModal && (() => {
                  const isShopCanc = editingOrder.cancelled_by === 'SHOP' ||
                    String(editingOrder.note || '').toLowerCase().includes('shop hủy') ||
                    String(editingOrder.cancel_reason || '').toLowerCase().includes('shop hủy');
                  const cancelReason = getDisplayCancelReason(editingOrder);

                  return (
                    <div className="modal-info-panel modal-cancel-highlight" style={{
                      background: '#FEF2F2',
                      border: '1.5px solid #FECACA',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #FEE2E2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#DC2626',
                            color: '#FFFFFF'
                          }}>
                            <X size={13} strokeWidth={2.5} />
                          </span>
                          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            {isShopCanc ? 'Thông Tin Shop Hủy Đơn' : 'Thông Tin Khách Hủy Đơn'}
                          </h4>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA', padding: '2px 8px', borderRadius: '12px' }}>
                          ✕ ĐÃ HỦY
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#450A0A' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <strong style={{ color: '#991B1B', minWidth: '120px' }}>
                            {isShopCanc ? 'Lý do Shop hủy:' : 'Lý do khách hủy:'}
                          </strong>
                          <span style={{
                            fontWeight: 700,
                            color: '#DC2626',
                            background: '#FFFFFF',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #FECACA',
                            letterSpacing: '0.2px'
                          }}>
                            {cancelReason}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#7F1D1D' }}>
                          <span style={{ minWidth: '120px' }}>Người thực hiện:</span>
                          <strong style={{ color: isShopCanc ? '#DC2626' : '#450A0A' }}>
                            {isShopCanc ? 'Shop Youth Fashion (Quản trị viên)' : 'Khách hàng hủy trực tuyến từ tài khoản'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Danh sách sản phẩm */}
                <div className="modal-info-panel">
                  <h4 className="panel-title">Chi tiết sản phẩm ({editingOrder.items?.length} sản phẩm)</h4>
                  <div className="modal-items-list">
                    {editingOrder.items?.map((it, idx) => (
                      <div key={it.id || idx} className="modal-item-row">
                        <img src={resolveOrderItemImage(it)} alt="" className="modal-item-thumb" />
                        <div className="modal-item-meta">
                          <span className="modal-item-name">{it.name}</span>
                          <span className="modal-item-sub">{it.size} • {it.color}</span>
                        </div>
                        <div className="modal-item-price-col">
                          <span>x{it.quantity}</span>
                          <strong>{Number(it.price || 0).toLocaleString('vi-VN')}₫</strong>
                        </div>
                      </div>
                    ))}
                    <div className="modal-total-row">
                      <span>Tổng thanh toán:</span>
                      <strong className="total-highlight">{Number(editingOrder.total_amount || 0).toLocaleString('vi-VN')}₫</strong>
                    </div>
                  </div>
                </div>

                {/* Chọn trạng thái mới dạng select */}
                <div className="modal-form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px', color: '#1C1917' }}>
                    Cập nhật trạng thái đơn hàng:
                  </label>
                  {isCancModal ? (
                    <div style={{
                      padding: '10px 14px',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '8px',
                      color: '#DC2626',
                      fontSize: '13px',
                      fontWeight: 700
                    }}>
                      ⛔ Đơn hàng đã bị hủy, trạng thái cố định là "Đã hủy" và không thể thay đổi.
                    </div>
                  ) : isRetModal ? (
                    <div style={{
                      padding: '12px 14px',
                      background: '#FAF5FF',
                      border: '1px solid #E9D5FF',
                      borderRadius: '8px',
                      color: '#7E22CE',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div>
                        <span>Trạng thái xử lý: </span>
                        {editingOrder.refund_decision === 'APPROVED' ? (
                          <strong style={{ color: '#15803D' }}>✓ ĐÃ XÁC NHẬN HOÀN TIỀN</strong>
                        ) : editingOrder.refund_decision === 'REJECTED' ? (
                          <strong style={{ color: '#DC2626' }}>✕ ĐÃ TỪ CHỐI HOÀN TIỀN</strong>
                        ) : (
                          <strong style={{ color: '#7E22CE' }}>⏳ CHỜ QUẢN LÝ XỬ LÝ HOÀN TIỀN</strong>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: '#6B21A8' }}>
                        {editingOrder.refund_decision === 'APPROVED' ? 'Đã hoàn tất chuyển khoản hoàn tiền cho khách' :
                         editingOrder.refund_decision === 'REJECTED' ? 'Đã gửi thông báo từ chối hoàn kèm lý do cho khách' :
                         'Bấm nút "Xác nhận hoàn" hoặc "Từ chối hoàn" để cập nhật'}
                      </span>
                    </div>
                  ) : (
                    <select
                      className="form-control-input"
                      style={{ width: '100%', height: '42px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#FFFFFF', cursor: 'pointer' }}
                      value={editingOrder.order_status}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CANCELLED') {
                          handleOpenShopCancelModal(editingOrder);
                        } else {
                          setEditingOrder({ ...editingOrder, order_status: val });
                        }
                      }}
                    >
                      <option value="PENDING">Chờ xác nhận</option>
                      <option value="CONFIRMED">Đã xác nhận</option>
                      <option value="SHIPPING">Đang vận chuyển</option>
                      <option value="COMPLETED">Đã giao</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="modal-footer-custom">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsEditModalOpen(false)}>
                  {isCancModal || isRetModal ? 'Đóng' : 'Hủy bỏ'}
                </button>
                {isRetModal ? (
                  <div style={{ display: 'inline-flex', gap: '10px' }}>
                    {editingOrder.refund_decision !== 'APPROVED' && (
                      <button
                        type="button"
                        className="btn-modal-reject"
                        onClick={() => handleRejectRefund(editingOrder)}
                        style={{
                          padding: '8px 18px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1.5px solid #FECACA',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ✕ Từ chối hoàn
                      </button>
                    )}
                    {editingOrder.refund_decision !== 'APPROVED' && (
                      <button
                        type="button"
                        className="btn-modal-confirm"
                        onClick={() => handleConfirmRefund(editingOrder)}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          background: '#15803D',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 5px rgba(21, 128, 61, 0.25)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ✓ Xác nhận hoàn
                      </button>
                    )}
                  </div>
                ) : !isCancModal && (
                  <button type="button" className="btn-modal-save" onClick={handleSaveEdit}>
                    Lưu Thay Đổi
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: TẠO ĐƠN HÀNG MỚI */}
      {isCreateModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-box-card modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div>
                <p className="modal-super">HỆ THỐNG BÁN HÀNG OMNICHANNEL</p>
                <h3 className="modal-title font-serif">Tạo Đơn Hàng Mới</h3>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setIsCreateModalOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreateNewOrder}>
              <div className="modal-body-custom">
                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="field-label">Tên khách hàng *</label>
                    <input
                      type="text"
                      className="form-control-input"
                      placeholder="Ví dụ: Nguyễn Hoàng Thảo My"
                      required
                      value={newOrderForm.recipient_name}
                      onChange={e => setNewOrderForm({ ...newOrderForm, recipient_name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="field-label">Số điện thoại liên hệ *</label>
                    <input
                      type="text"
                      className="form-control-input"
                      placeholder="Ví dụ: 0987654321"
                      required
                      value={newOrderForm.recipient_phone}
                      onChange={e => setNewOrderForm({ ...newOrderForm, recipient_phone: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="field-label">Email khách hàng</label>
                    <input
                      type="email"
                      className="form-control-input"
                      placeholder="khachhang@gmail.com"
                      value={newOrderForm.recipient_email}
                      onChange={e => setNewOrderForm({ ...newOrderForm, recipient_email: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="field-label">Địa chỉ giao hàng chi tiết</label>
                    <input
                      type="text"
                      className="form-control-input"
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP"
                      value={newOrderForm.address}
                      onChange={e => setNewOrderForm({ ...newOrderForm, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-divider" />

                <h4 className="panel-title">Thông tin sản phẩm đặt may</h4>
                <div className="form-grid-2">
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="field-label">Tên sản phẩm thiết kế</label>
                    <input
                      type="text"
                      className="form-control-input"
                      placeholder="Ví dụ: Áo Măng Tô Belted Dạ Camel"
                      value={newOrderForm.product_name}
                      onChange={e => setNewOrderForm({ ...newOrderForm, product_name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="field-label">Size may đo</label>
                    <select
                      className="form-control-input"
                      value={newOrderForm.size}
                      onChange={e => setNewOrderForm({ ...newOrderForm, size: e.target.value })}
                    >
                      <option value="Size S">Size S (Vừa vặn)</option>
                      <option value="Size M">Size M (Tiêu chuẩn)</option>
                      <option value="Size L">Size L (Thoải mái)</option>
                      <option value="Size XL">Size XL (Phom rộng)</option>
                      <option value="May đo Haute Couture">May đo theo số đo riêng</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="field-label">Màu sắc</label>
                    <input
                      type="text"
                      className="form-control-input"
                      placeholder="Ví dụ: Màu Camel Sand"
                      value={newOrderForm.color}
                      onChange={e => setNewOrderForm({ ...newOrderForm, color: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="field-label">Số lượng</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control-input"
                      value={newOrderForm.quantity}
                      onChange={e => setNewOrderForm({ ...newOrderForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="field-label">Đơn giá (VNĐ)</label>
                    <input
                      type="number"
                      step="50000"
                      className="form-control-input"
                      value={newOrderForm.unit_price}
                      onChange={e => setNewOrderForm({ ...newOrderForm, unit_price: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-divider" />

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="field-label">Phương thức thanh toán</label>
                    <select
                      className="form-control-input"
                      value={newOrderForm.payment_method}
                      onChange={e => setNewOrderForm({ ...newOrderForm, payment_method: e.target.value })}
                    >
                      <option value="PAYOS">PayOS - Chuyển khoản VietQR</option>
                      <option value="COD">Tiền mặt khi nhận hàng (COD)</option>
                      <option value="DIRECT">Thanh toán trực tiếp tại Flagship</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="field-label">Trạng thái ban đầu</label>
                    <select
                      className="form-control-input"
                      value={newOrderForm.order_status}
                      onChange={e => setNewOrderForm({ ...newOrderForm, order_status: e.target.value })}
                    >
                      <option value="PENDING">Chờ xác nhận</option>
                      <option value="CONFIRMED">Đã xác nhận</option>
                      <option value="SHIPPING">Đang vận chuyển</option>
                      <option value="COMPLETED">Đã giao</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="field-label">Ghi chú đơn hàng</label>
                    <textarea
                      rows="2"
                      className="form-control-input"
                      placeholder="Ghi chú đóng gói hộp quà hoặc yêu cầu đặc biệt..."
                      value={newOrderForm.note}
                      onChange={e => setNewOrderForm({ ...newOrderForm, note: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer-custom">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsCreateModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-modal-save">
                  Tạo Đơn Hàng Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN XÓA ĐƠN HÀNG */}
      {isDeleteModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-box-card modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3 className="modal-title font-serif">Xác Nhận Xóa Đơn Hàng</h3>
              <button type="button" className="btn-close-modal" onClick={() => setIsDeleteModalOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <div className="modal-body-custom">
              <p className="delete-confirm-text">
                Bạn có chắc chắn muốn xóa đơn hàng này khỏi hệ thống không? Dữ liệu sau khi xóa sẽ không thể khôi phục.
              </p>
            </div>
            <div className="modal-footer-custom">
              <button type="button" className="btn-modal-cancel" onClick={() => setIsDeleteModalOpen(false)}>
                Hủy bỏ
              </button>
              <button type="button" className="btn-modal-delete" onClick={handleConfirmDelete}>
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: XÁC NHẬN SHOP HỦY ĐƠN HÀNG */}
      {isShopCancelModalOpen && shopCancelOrder && (
        <div className="modal-backdrop-custom" onClick={() => setIsShopCancelModalOpen(false)}>
          <div className="modal-box-card modal-small" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', letterSpacing: '0.5px' }}>THAO TÁC CỦA QUẢN TRỊ VIÊN</span>
                <h3 className="modal-title font-serif" style={{ fontSize: '18px', color: '#111827', margin: 0 }}>
                  Shop Hủy Đơn Hàng #{shopCancelOrder.order_number || shopCancelOrder.order_code || shopCancelOrder.order_id}
                </h3>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setIsShopCancelModalOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <div className="modal-body-custom" style={{ padding: '16px 20px' }}>
              <div style={{
                padding: '10px 14px',
                background: '#FEF2F2',
                borderRadius: '8px',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px'
              }}>
                <AlertCircle size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
                <span>
                  Lý do bạn chọn dưới đây sẽ được <strong>hiển thị trực tiếp cho khách hàng</strong> tại trang theo dõi đơn hàng.
                </span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Vui lòng chọn lý do Shop hủy đơn:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'Sản phẩm tạm thời hết hàng trong kho',
                    'Không thể liên hệ xác nhận đơn với khách hàng qua số điện thoại',
                    'Địa chỉ nhận hàng nằm ngoài phạm vi hỗ trợ vận chuyển',
                    'Phát hiện nghi ngờ đơn hàng ảo hoặc thông tin đặt hàng không hợp lệ',
                    'Sản phẩm có sự cố chất lượng trong quá trình kiểm tra xuất kho',
                    'Khách hàng liên hệ qua hotline/chat yêu cầu Shop hủy hộ',
                    'Lý do khác'
                  ].map((r, i) => (
                    <label
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: shopCancelReason === r ? '1.5px solid #DC2626' : '1px solid #E5E7EB',
                        background: shopCancelReason === r ? '#FEF2F2' : '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        color: shopCancelReason === r ? '#991B1B' : '#374151',
                        fontWeight: shopCancelReason === r ? 600 : 400,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="shopCancelPresetReason"
                        value={r}
                        checked={shopCancelReason === r}
                        onChange={() => setShopCancelReason(r)}
                        style={{ accentColor: '#DC2626' }}
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {shopCancelReason === 'Lý do khác' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Nhập chi tiết lý do từ Shop:
                  </label>
                  <textarea
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1.5px solid #FCA5A5',
                      fontSize: '12.5px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Nhập lý do chi tiết để khách hàng được biết..."
                    value={customShopCancelReason}
                    onChange={(e) => setCustomShopCancelReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer-custom">
              <button type="button" className="btn-modal-cancel" onClick={() => setIsShopCancelModalOpen(false)}>
                Đóng
              </button>
              <button
                type="button"
                className="btn-modal-delete"
                onClick={handleConfirmShopCancel}
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <X size={15} strokeWidth={2.5} /> Xác Nhận Shop Hủy Đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded High-Fashion Styles matching Figma specs */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400&display=swap');

        .manager-layout {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          padding: 0px;
          width: 100%;
          min-height: 100vh;
          background: #FFFFFF;
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .main-content-area {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          flex: 1;
          min-width: 0;
          width: calc(100% - 268px);
          min-height: 100vh;
          background: #FFFFFF;
          box-sizing: border-box;
        }

        .order-manager-page-body {
          padding: 24px 32px 60px;
          background: #FFFFFF;
          min-height: calc(100vh - 60px);
          font-family: 'Inter', sans-serif;
          width: 100%;
          box-sizing: border-box;
          flex: 1;
        }

        .order-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
        }

        .order-super-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #8C857B;
          margin-bottom: 4px;
        }

        .order-main-title {
          font-size: 28px;
          font-weight: 700;
          color: #111111;
          margin: 0;
        }

        .btn-create-order {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #111111;
          color: #FFFFFF;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-create-order:hover {
          background: #27272a;
        }

        /* 3 Stats Grid */
        .order-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .order-stat-card {
          background: #FFFFFF;
          border: 1px solid #EAE7DF;
          border-radius: 12px;
          padding: 20px 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          position: relative;
        }

        .stat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .stat-card-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #78716C;
        }

        .stat-icon-neutral {
          color: #A8A29E;
        }

        .stat-icon-star {
          color: #F59E0B;
        }

        .stat-icon-dollar {
          color: #A8A29E;
        }

        .stat-card-value {
          font-size: 26px;
          font-weight: 700;
          color: #111111;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .stat-card-sub {
          font-size: 11.5px;
          color: #78716C;
          margin-bottom: 14px;
        }

        .stat-card-sub strong {
          color: #1C1917;
        }

        .stat-bar-track {
          width: 100%;
          height: 3px;
          background: #F0EEE9;
          border-radius: 2px;
          overflow: hidden;
        }

        .stat-bar-fill {
          height: 100%;
          border-radius: 2px;
        }

        .bar-fill-black {
          background: #111111;
        }

        .bar-fill-amber {
          background: #F59E0B;
        }

        .bar-fill-grey {
          background: #78716C;
        }

        /* Status Tabs */
        .order-tabs-wrapper {
          margin-bottom: 12px;
        }

        .order-status-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .order-tab-btn {
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 600;
          color: #57534E;
          background: #FFFFFF;
          border: 1px solid #E7E5E4;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .order-tab-btn:hover {
          background: #F5F5F4;
          color: #1C1917;
        }

        /* Active Tab Styling chuẩn các màu */
        .order-tab-btn.active.tab-all {
          background: #111111;
          color: #FFFFFF;
          border-color: #111111;
        }

        .order-tab-btn.active.tab-pending {
          background: #FEF3C7;
          color: #B45309;
          border-color: #FDE68A;
        }

        .order-tab-btn.active.tab-confirmed {
          background: #E0F2FE;
          color: #0369A1;
          border-color: #BAE6FD;
        }

        .order-tab-btn.active.tab-shipping {
          background: #EFF6FF;
          color: #1D4ED8;
          border-color: #BFDBFE;
        }

        .order-tab-btn.active.tab-completed {
          background: #DCFCE7;
          color: #15803D;
          border-color: #BBF7D0;
        }

        .order-tab-btn.active.tab-cancelled {
          background: #FEE2E2;
          color: #991B1B;
          border-color: #FECDD3;
        }

        .order-tab-btn.active.tab-returned {
          background: #F3E8FF;
          color: #7E22CE;
          border-color: #D8B4FE;
        }

        /* Batch Action Bar */
        .batch-action-bar {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
          font-size: 12px;
          color: #78716C;
        }

        .batch-count-text strong {
          color: #111111;
        }

        .btn-bulk-delete {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FEE2E2;
          color: #DC2626;
          border: 1px solid #FECACA;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-bulk-delete:hover {
          background: #FECDD3;
        }

        /* Search & Filter Controls */
        .order-filter-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .search-input-box {
          position: relative;
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 0 14px;
          width: 440px;
          max-width: 100%;
          height: 40px;
        }

        .search-icon {
          color: #9CA3AF;
          margin-right: 8px;
          flex-shrink: 0;
        }

        .search-field {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13px;
          color: #111111;
        }

        .clear-search {
          border: none;
          background: transparent;
          color: #9CA3AF;
          cursor: pointer;
          padding: 4px;
        }

        .dropdown-filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-select {
          height: 40px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 0 12px;
          font-size: 13px;
          color: #374151;
          outline: none;
          cursor: pointer;
        }

        /* Orders Table Card */
        .orders-table-card {
          background: #FFFFFF;
          border: 1px solid #EAE7DF;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
          text-align: left;
        }

        .orders-table thead tr {
          background: #FAFAF9;
          border-bottom: 1px solid #EAE7DF;
        }

        .orders-table th {
          padding: 14px 16px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #78716C;
          white-space: nowrap;
        }

        .orders-table tbody tr {
          border-bottom: 1px solid #F0EEE9;
          transition: background 0.15s ease;
        }

        .orders-table tbody tr:hover {
          background: #FAF9F6;
        }

        .orders-table tbody tr.row-selected {
          background: #FFFBEB;
        }

        .orders-table td {
          padding: 14px 16px;
          vertical-align: middle;
        }

        .custom-checkbox {
          width: 15px;
          height: 15px;
          border-radius: 4px;
          cursor: pointer;
          accent-color: #111111;
        }

        /* Order Code Cell */
        .order-code-cell {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .order-code-text {
          font-weight: 700;
          color: #111111;
          font-size: 13px;
        }

        .order-time-text {
          font-size: 11px;
          color: #78716C;
        }

        /* Customer Cell */
        .customer-cell {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .customer-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .customer-name {
          font-weight: 600;
          color: #111111;
          font-size: 13px;
        }

        .vip-badge {
          background: #FEF3C7;
          color: #B45309;
          border: 1px solid #FDE68A;
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 9.5px;
          font-weight: 700;
        }

        .customer-phone {
          font-size: 11.5px;
          color: #78716C;
        }

        /* Product Info Cell */
        .product-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 320px;
        }

        .product-thumb {
          width: 44px;
          height: 44px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid #EAE7DF;
          flex-shrink: 0;
          background: #F5F5F4;
        }

        .product-text-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .product-name-title {
          font-weight: 600;
          color: #1C1917;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-meta-sub {
          font-size: 11px;
          color: #78716C;
        }

        /* Payment Cell */
        .payment-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .amount-text {
          font-weight: 700;
          font-size: 13.5px;
          color: #111111;
        }

        .payment-pill {
          display: inline-block;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          width: fit-content;
        }

        .pill-payos {
          background: #DCFCE7;
          color: #15803D;
          border: 1px solid #BBF7D0;
        }

        .pill-direct {
          background: #FEF3C7;
          color: #B45309;
          border: 1px solid #FDE68A;
        }

        .pill-cod {
          background: #F3F4F6;
          color: #4B5563;
          border: 1px solid #E5E7EB;
        }

        /* Status Select Pill & Outlines chuẩn 5 màu */
        .status-cell {
          display: flex;
          align-items: center;
        }

        .status-select-pill {
          display: inline-block;
          padding: 5px 32px 5px 14px !important;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          outline: none;
          transition: all 0.2s ease;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-repeat: no-repeat !important;
          background-position: right 10px center !important;
          background-size: 10px 10px !important;
          font-family: inherit;
          text-align: left;
        }

        .status-select-pill.status-pill-pending {
          background-color: #FFFBEB;
          color: #B45309;
          border: 1px solid #FDE68A;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23B45309'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        }

        .status-select-pill.status-pill-confirmed {
          background-color: #F0F9FF;
          color: #0284C7;
          border: 1px solid #BAE6FD;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230284C7'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        }

        .status-select-pill.status-pill-shipping {
          background-color: #EFF6FF;
          color: #1D4ED8;
          border: 1px solid #BFDBFE;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231D4ED8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        }

        .status-select-pill.status-pill-completed {
          background-color: #F0FDF4;
          color: #16A34A;
          border: 1px solid #BBF7D0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2316A34A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        }

        .status-select-pill.status-pill-rejected,
        .status-select-pill.status-pill-cancelled {
          background-color: #FEF2F2 !important;
          color: #DC2626 !important;
          border: 1.5px solid #FECACA !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23DC2626'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") !important;
        }

        .status-select-pill.status-pill-approved,
        .status-select-pill.status-pill-completed {
          background-color: #F0FDF4 !important;
          color: #16A34A !important;
          border: 1.5px solid #BBF7D0 !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2316A34A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") !important;
        }

        .status-select-pill.status-pill-returned {
          background-color: #FAF5FF;
          color: #9333EA;
          border: 1px solid #E9D5FF;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239333EA'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        }

        .status-fixed-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
          white-space: nowrap;
          cursor: not-allowed;
          user-select: none;
        }

        .status-fixed-pill.status-pill-cancelled {
          background-color: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        .status-select-pill:hover {
          filter: brightness(0.96);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .status-select-pill option {
          background-color: #FFFFFF;
          color: #1F2937;
          font-weight: 500;
          font-size: 13px;
        }

        .status-badge-outline {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .badge-yellow {
          background: #FFFBEB;
          color: #B45309;
          border: 1px solid #FDE68A;
        }

        .badge-blue {
          background: #EFF6FF;
          color: #1D4ED8;
          border: 1px solid #BFDBFE;
        }

        .badge-green {
          background: #F0FDF4;
          color: #16A34A;
          border: 1px solid #BBF7D0;
        }

        .badge-red {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        .badge-purple {
          background: #FAF5FF;
          color: #9333EA;
          border: 1px solid #E9D5FF;
        }

        /* Action Buttons */
        .actions-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .action-icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-icon-btn.edit-btn {
          color: #6B7280;
        }

        .action-icon-btn.edit-btn:hover {
          background: #F3F4F6;
          color: #111111;
          border-color: #E5E7EB;
        }

        .action-icon-btn.delete-btn {
          color: #EF4444;
        }

        .action-icon-btn.delete-btn:hover {
          background: #FEE2E2;
          color: #DC2626;
        }

        /* Table Footer Row */
        .table-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: #FFFFFF;
          border-top: 1px solid #EAE7DF;
          font-size: 12px;
          color: #78716C;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-left-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .page-nav-btn {
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          color: #4B5563;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11.5px;
          cursor: pointer;
        }

        .page-nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-number-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          color: #374151;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .page-number-btn.active {
          background: #111111;
          color: #FFFFFF;
          border-color: #111111;
        }

        /* Modals */
        .modal-backdrop-custom {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-box-card {
          background: #FFFFFF;
          border-radius: 12px;
          width: 580px;
          max-width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }

        .modal-box-card.modal-large {
          width: 720px;
        }

        .modal-box-card.modal-small {
          width: 440px;
        }

        .modal-header-custom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid #EAE7DF;
          background: #FAFAF9;
        }

        .modal-super {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #8C857B;
          margin-bottom: 2px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #111111;
          margin: 0;
        }

        .btn-close-modal {
          border: none;
          background: transparent;
          color: #9CA3AF;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .btn-close-modal:hover {
          color: #111111;
          background: #F3F4F6;
        }

        .modal-body-custom {
          padding: 22px 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-info-panel {
          background: #FAF9F6;
          border: 1px solid #EAE7DF;
          border-radius: 8px;
          padding: 14px 16px;
        }

        .panel-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #44403C;
          margin: 0 0 10px 0;
        }

        .panel-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          font-size: 12px;
        }

        .info-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .field-label {
          font-size: 11px;
          color: #78716C;
        }

        .field-value {
          color: #1C1917;
        }

        .italic-note {
          font-style: italic;
          color: #B45309;
        }

        .modal-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .modal-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #EAE7DF;
        }

        .modal-item-thumb {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          object-fit: cover;
        }

        .modal-item-meta {
          flex: 1;
        }

        .modal-item-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #111111;
          display: block;
        }

        .modal-item-sub {
          font-size: 11px;
          color: #78716C;
        }

        .modal-item-price-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-size: 12px;
        }

        .modal-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 6px;
          font-size: 13px;
        }

        .total-highlight {
          font-size: 16px;
          color: #B45309;
        }

        .form-label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #1C1917;
          margin-bottom: 8px;
        }

        .status-radio-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .status-option-pill {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: #F5F5F4;
          color: #57534E;
          border: 1px solid #E7E5E4;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .status-option-pill.selected {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .modal-footer-custom {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 24px;
          background: #FAFAF9;
          border-top: 1px solid #EAE7DF;
        }

        .btn-modal-cancel {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          background: #FFFFFF;
          color: #57534E;
          border: 1px solid #D6D3D1;
          cursor: pointer;
        }

        .btn-modal-save {
          padding: 8px 18px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          background: #111111;
          color: #FFFFFF;
          border: none;
          cursor: pointer;
        }

        .btn-modal-delete {
          padding: 8px 18px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          background: #DC2626;
          color: #FFFFFF;
          border: none;
          cursor: pointer;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .form-divider {
          height: 1px;
          background: #EAE7DF;
          margin: 6px 0;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-control-input {
          height: 38px;
          padding: 0 12px;
          border-radius: 6px;
          border: 1px solid #D1D5DB;
          font-size: 13px;
          color: #111111;
          outline: none;
        }

        textarea.form-control-input {
          height: auto;
          padding: 8px 12px;
        }

        .delete-confirm-text {
          font-size: 13.5px;
          color: #374151;
          line-height: 1.5;
          margin: 0;
        }

        .empty-table-cell {
          padding: 60px 20px !important;
          text-align: center;
        }

        .empty-table-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .empty-icon {
          color: #A8A29E;
        }

        .empty-text {
          font-size: 13.5px;
          color: #78716C;
          margin: 0;
        }
      `}</style>
    </div>
  );
}


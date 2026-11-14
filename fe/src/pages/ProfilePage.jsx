import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  User, Package, Lock, Heart, LogOut, CheckCircle,
  Camera, MapPin, Calendar, Clock, CreditCard, ChevronRight, AlertCircle, Tag, Copy, LayoutDashboard, Eye, EyeOff,
  Search, Truck, Check, X, Star, RefreshCw, FileText, ShieldCheck, ChevronLeft, ArrowRight, Phone, RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import ProductCard from '../components/ProductCard';
import { voucherService } from '../services/voucherService';
import { orderService } from '../services/orderService';
import { resolveOrderItemImage } from '../utils/productImageUtils';
import { ensureOrderCacheReset } from '../utils/orderCacheReset';

// Chuẩn hóa ngày hiển thị sang dạng DD/MM/YYYY
const normalizeDobToVn = (dob) => {
  if (!dob) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) return dob;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    const [y, m, d] = dob.split('-');
    return `${d}/${m}/${y}`;
  }
  const parts = dob.split(/[\/\-.]/);
  if (parts.length === 3 && parts[2].length === 4) {
    let d = parts[0].padStart(2, '0');
    let m = parts[1].padStart(2, '0');
    let y = parts[2];
    if (parseInt(d, 10) <= 12 && parseInt(m, 10) > 12) {
      [d, m] = [m, d];
    }
    return `${d}/${m}/${y}`;
  }
  return dob;
};

// Chuyển đổi DD/MM/YYYY sang YYYY-MM-DD cho input date picker
const convertVnDateToIso = (vnStr) => {
  if (!vnStr) return '';
  const parts = vnStr.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
};

// Tự động chèn dấu / khi người dùng chỉ cần gõ số ngày sinh (VD: 18101994 -> 18/10/1994)
const formatDobInput = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

// Kiểm tra tính hợp lệ của ngày sinh (ngày tồn tại, tháng 1-12, không vượt quá hôm nay)
const validateDob = (dobStr) => {
  if (!dobStr || !dobStr.trim()) return 'Ngày sinh nhật không được để trống';
  const parts = dobStr.split('/');
  if (parts.length !== 3 || dobStr.length !== 10) {
    return 'Vui lòng nhập đủ 8 số ngày sinh (VD: 18101994)';
  }
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return 'Ngày sinh chỉ được chứa số';
  }
  if (month < 1 || month > 12) {
    return 'Tháng sinh không hợp lệ (từ 01 đến 12)';
  }
  if (day < 1 || day > 31) {
    return 'Ngày sinh không hợp lệ (từ 01 đến 31)';
  }
  const dateObj = new Date(year, month - 1, day);
  if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
    return `Ngày ${dobStr} không tồn tại trong lịch`;
  }
  if (year < 1900) {
    return 'Năm sinh không được nhỏ hơn 1900';
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (dateObj > today) {
    return 'Ngày sinh không được lớn hơn ngày hiện tại';
  }
  return '';
};

// Hàm hỗ trợ lọc bỏ dữ liệu mẫu cũ và đơn hàng đã bị xóa nếu còn lưu trong bộ nhớ
const purgeMockOrders = (list) => {
  if (!Array.isArray(list)) return [];
  const mockIds = new Set(['891', '890', '889', '888', '887', '886', '885', '884', '88210', '85420', '79114', '72015', '68192']);
  let deletedSet = new Set();
  try {
    const rawDel = localStorage.getItem('yf_deleted_order_ids');
    if (rawDel) deletedSet = new Set(JSON.parse(rawDel));
  } catch (e) { }

  return list.filter(o => {
    if (!o) return false;
    const rawId = String(o.order_id || '').trim();
    const rawCode = String(o.order_code || o.order_number || '').trim();
    const digitsOnly = (rawCode || rawId).replace(/\D/g, '');

    if (mockIds.has(rawId)) return false;
    if (mockIds.has(rawCode)) return false;
    if (digitsOnly && mockIds.has(digitsOnly)) return false;

    if (deletedSet.has(rawId)) return false;
    if (deletedSet.has(rawCode)) return false;
    if (digitsOnly && deletedSet.has(digitsOnly)) return false;

    // Không tính các đơn hàng PayOS chưa thanh toán thành công hoặc đã bị hủy
    const isPayosOrder = o.payment_method === 'PAYOS' || String(o.payment_method || '').includes('VietQR') || String(o.payment_method || '').includes('PAYOS') || String(o.payment_label || '').includes('PayOS');
    if (isPayosOrder) {
      const pStatus = String(o.payment_status || '').toUpperCase();
      const oStatus = String(o.order_status || o.status || '').toUpperCase();
      if (pStatus === 'PENDING' || pStatus === 'CANCELLED' || pStatus === 'FAILED' || pStatus === 'UNPAID' || oStatus === 'CANCELLED') {
        return false;
      }
    }

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

// Phân giải chính xác trạng thái hoàn tiền (ĐỒNG Ý / TỪ CHỐI HOÀN) dựa trên đa nguồn dữ liệu (Quản lý & Overrides)
const resolveOrderRefundStatus = (ord) => {
  if (!ord) return { isApproved: false, isRejected: false, decision: null, rejectReason: '' };
  const rawId = String(ord.order_id || '').trim();
  const rawCode = String(ord.order_code || ord.order_number || '').trim();
  const digits = (rawCode || rawId).replace(/\D/g, '');

  let decision = (ord.refund_decision && ord.refund_decision !== 'PENDING') ? ord.refund_decision : null;
  let rejectReason = ord.reject_reason || '';
  let noteStr = String(ord.note || '');
  let labelStr = String(ord.status_label || '').toUpperCase();
  const noteLow = noteStr.toLowerCase();

  // 0. Kiểm tra trực tiếp từ chính thuộc tính của ord
  if (!decision) {
    if (labelStr.includes('ĐÃ HOÀN') || noteLow.includes('đã xác nhận hoàn tiền') || noteLow.includes('đã hoàn tiền') || ord.payment_status === 'REFUNDED') {
      decision = 'APPROVED';
    } else if (labelStr.includes('TỪ CHỐI') || noteLow.includes('từ chối hoàn')) {
      decision = 'REJECTED';
    }
  }

  // 1. Kiểm tra trực tiếp từ yf_manager_orders (quyết định thực tế từ phía Quản lý Shop)
  try {
    const rawMgr = localStorage.getItem('yf_manager_orders');
    if (rawMgr) {
      const mgrList = JSON.parse(rawMgr);
      if (Array.isArray(mgrList)) {
        const mMatch = mgrList.find(m => {
          if (!m) return false;
          const mId = String(m.order_id || '').trim();
          const mNum = String(m.order_number || m.order_code || '').trim();
          const mDigits = (mNum || mId).replace(/\D/g, '');
          return (rawId && (mId === rawId || mNum === rawId)) ||
                 (rawCode && (mId === rawCode || mNum === rawCode)) ||
                 (digits && mDigits && digits === mDigits);
        });
        if (mMatch) {
          const mL = String(mMatch.status_label || '').toUpperCase();
          const mN = String(mMatch.note || '').toLowerCase();
          if (mMatch.refund_decision === 'APPROVED' || mL.includes('ĐÃ HOÀN') || mN.includes('đã xác nhận hoàn tiền') || mN.includes('đã hoàn tiền') || mMatch.payment_status === 'REFUNDED') {
            decision = 'APPROVED';
          } else if (mMatch.refund_decision === 'REJECTED' || mL.includes('TỪ CHỐI') || mN.includes('từ chối hoàn')) {
            decision = 'REJECTED';
          }
          if (mMatch.reject_reason) rejectReason = mMatch.reject_reason;
          if (mMatch.note) noteStr = mMatch.note;
        }
      }
    }
  } catch (e) {}

  // 2. Kiểm tra từ yf_order_status_overrides với mọi biến thể mã đơn (kể cả en-dash – và dấu cách)
  if (!decision) {
    try {
      const rawOv = localStorage.getItem('yf_order_status_overrides');
      if (rawOv) {
        const ovs = JSON.parse(rawOv);
        let ov = null;
        if (digits) {
          ov = ovs[digits] || ovs[`YF-${digits}`] || ovs[`#YF-${digits}`] || ovs[`YF - ${digits}`] || ovs[`#YF - ${digits}`] || ovs[`YF – ${digits}`] || ovs[`#YF – ${digits}`] || ovs[`#${digits}`];
        }
        if (!ov && rawId) ov = ovs[rawId];
        if (!ov && rawCode) ov = ovs[rawCode];
        if (!ov && typeof ovs === 'object') {
          for (const k of Object.keys(ovs)) {
            if (digits && k.replace(/\D/g, '') === digits) {
              ov = ovs[k];
              break;
            }
          }
        }
        if (ov) {
          const ovL = String(ov.status_label_customer || ov.status_label || '').toUpperCase();
          const ovN = String(ov.note || '').toLowerCase();
          if (ov.refund_decision === 'APPROVED' || ovL.includes('ĐÃ HOÀN') || ovN.includes('đã xác nhận hoàn tiền') || ovN.includes('đã hoàn tiền')) {
            decision = 'APPROVED';
          } else if (ov.refund_decision === 'REJECTED' || ovL.includes('TỪ CHỐI') || ovN.includes('từ chối hoàn')) {
            decision = 'REJECTED';
          }
          if (ov.reject_reason) rejectReason = rejectReason || ov.reject_reason;
          if (ov.note) noteStr = noteStr || ov.note;
        }
      }
    } catch (e) {}
  }

  // 3. Kiểm tra từ yf_customer_orders và các key user lưu trữ
  if (!decision) {
    try {
      const allCustKeys = Object.keys(localStorage).filter(k => k && k.startsWith('yf_customer_orders'));
      for (const ck of allCustKeys) {
        const rawCust = localStorage.getItem(ck);
        if (!rawCust) continue;
        const cList = JSON.parse(rawCust);
        if (!Array.isArray(cList)) continue;
        const cMatch = cList.find(c => {
          if (!c) return false;
          const cId = String(c.order_id || '').trim();
          const cCode = String(c.order_code || c.order_number || '').trim();
          const cDigits = (cCode || cId).replace(/\D/g, '');
          return (rawId && (cId === rawId || cCode === rawId)) ||
                 (rawCode && (cId === rawCode || cCode === rawCode)) ||
                 (digits && cDigits && digits === cDigits);
        });
        if (cMatch) {
          const cL = String(cMatch.status_label || '').toUpperCase();
          const cN = String(cMatch.note || '').toLowerCase();
          if (cMatch.refund_decision === 'APPROVED' || cL.includes('ĐÃ HOÀN') || cN.includes('đã xác nhận hoàn tiền') || cN.includes('đã hoàn tiền')) {
            decision = 'APPROVED';
          } else if (cMatch.refund_decision === 'REJECTED' || cL.includes('TỪ CHỐI') || cN.includes('từ chối hoàn')) {
            decision = 'REJECTED';
          }
          if (cMatch.reject_reason) rejectReason = rejectReason || cMatch.reject_reason;
          if (cMatch.note) noteStr = noteStr || cMatch.note;
          if (decision) break;
        }
      }
    } catch (e) {}
  }

  // 4. Kiểm tra từ chính ord note và status_label
  if (!decision) {
    if (ord.refund_decision === 'APPROVED' || labelStr.includes('ĐÃ HOÀN') || noteLow.includes('đã xác nhận hoàn tiền') || noteLow.includes('đã hoàn tiền')) decision = 'APPROVED';
    else if (ord.refund_decision === 'REJECTED' || labelStr.includes('TỪ CHỐI') || noteLow.includes('từ chối hoàn')) decision = 'REJECTED';
  }

  if (!rejectReason && noteStr.includes('Từ chối hoàn tiền:')) {
    rejectReason = noteStr.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim();
  }

  return {
    isApproved: decision === 'APPROVED',
    isRejected: decision === 'REJECTED',
    decision,
    rejectReason: rejectReason || (decision === 'REJECTED' ? 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop' : '')
  };
};

const pickAuthoritativeStatus = (statusA, statusB, labelA, labelB, noteA = '', noteB = '', refundDecisionA = '', refundDecisionB = '') => {
  const sA = String(statusA || '').toUpperCase();
  const sB = String(statusB || '').toUpperCase();
  const lA = String(labelA || '').toUpperCase();
  const lB = String(labelB || '').toUpperCase();
  const rA = String(refundDecisionA || '').toUpperCase();
  const rB = String(refundDecisionB || '').toUpperCase();

  // Đơn hàng đã hủy là trạng thái tuyệt đối, không thể ghi đè ngược về bất kỳ trạng thái nào khác
  if (sA === 'CANCELLED' || sB === 'CANCELLED') {
    return { status: 'CANCELLED', label: 'ĐÃ HỦY' };
  }

  // Nếu là đơn hoàn/đổi trả: ưu tiên trạng thái đã được Shop quyết định (ĐÃ HOÀN TIỀN / TỪ CHỐI HOÀN)
  if (sA === 'RETURNED' || sB === 'RETURNED' || lA.includes('ĐỔI TRẢ') || lB.includes('ĐỔI TRẢ') || lA.includes('HOÀN') || lB.includes('HOÀN')) {
    const isAppr = rA === 'APPROVED' || rB === 'APPROVED' || lA.includes('ĐÃ HOÀN') || lB.includes('ĐÃ HOÀN');
    const isRej = rA === 'REJECTED' || rB === 'REJECTED' || lA.includes('TỪ CHỐI') || lB.includes('TỪ CHỐI');
    const bestLabel = isAppr ? 'ĐÃ HOÀN TIỀN' : (isRej ? 'TỪ CHỐI HOÀN' : 'ĐỔI TRẢ');
    return { status: 'RETURNED', label: bestLabel };
  }

  const rankA = STATUS_RANK[sA] || 0;
  const rankB = STATUS_RANK[sB] || 0;

  if (rankA >= rankB && rankA > 1) {
    return { status: sA, label: labelA };
  }
  if (rankB > 1) {
    return { status: sB, label: labelB };
  }
  return { status: sA || sB || 'PENDING', label: labelA || labelB || 'CHỜ XÁC NHẬN' };
};

// Helper nhận diện và trích xuất lý do hủy đơn (phân biệt Shop hủy vs Khách hủy)
const resolveCancelInfo = (ord) => {
  if (!ord) return { isShopCancelled: false, cancelReason: 'Đổi ý, không muốn mua nữa' };
  const rawId = String(ord.order_id || '').trim();
  const rawCode = String(ord.order_code || ord.order_number || '').trim();
  const digits = (rawCode || rawId).replace(/\D/g, '');

  let cancelledBy = ord.cancelled_by || '';
  let cancelReason = ord.cancel_reason || '';
  let noteStr = String(ord.note || '');

  // 1. Kiểm tra từ yf_order_status_overrides
  try {
    const rawOv = localStorage.getItem('yf_order_status_overrides');
    if (rawOv) {
      const ovs = JSON.parse(rawOv);
      const ov = (digits && (ovs[digits] || ovs[`YF-${digits}`] || ovs[`#YF-${digits}`] || ovs[`YF - ${digits}`] || ovs[`#YF - ${digits}`])) || (rawId && ovs[rawId]) || (rawCode && ovs[rawCode]);
      if (ov) {
        if (ov.cancelled_by) cancelledBy = ov.cancelled_by;
        if (ov.cancel_reason) cancelReason = ov.cancel_reason;
        if (ov.note && !noteStr) noteStr = ov.note;
      }
    }
  } catch (e) {}

  // 2. Kiểm tra từ yf_manager_orders
  try {
    const rawMgr = localStorage.getItem('yf_manager_orders');
    if (rawMgr) {
      const mgrList = JSON.parse(rawMgr);
      if (Array.isArray(mgrList)) {
        const m = mgrList.find(item => {
          const mDigits = String(item.order_number || item.order_code || item.order_id || '').replace(/\D/g, '');
          return digits && mDigits && digits === mDigits;
        });
        if (m) {
          if (m.cancelled_by) cancelledBy = m.cancelled_by;
          if (m.cancel_reason) cancelReason = m.cancel_reason;
          if (m.note) noteStr = m.note;
        }
      }
    }
  } catch (e) {}

  const noteLow = noteStr.toLowerCase();
  const isShop = cancelledBy === 'SHOP' ||
                 cancelledBy === 'MANAGER' ||
                 noteLow.includes('shop hủy đơn') ||
                 noteLow.includes('shop hủy') ||
                 String(cancelReason).toLowerCase().includes('shop hủy');

  let finalReason = cancelReason;
  if (!finalReason || finalReason === 'Khách hủy đơn' || finalReason === 'Đổi ý, không muốn mua nữa') {
    if (noteStr.includes('Shop hủy đơn:')) {
      finalReason = noteStr.split('Shop hủy đơn:')[1]?.trim();
    } else if (noteStr.includes('Khách hủy đơn:')) {
      finalReason = noteStr.split('Khách hủy đơn:')[1]?.trim();
    }
  }
  if (!finalReason) {
    finalReason = isShop ? 'Sản phẩm tạm thời hết hàng trong kho' : 'Đổi ý, không muốn mua nữa';
  }

  return {
    isShopCancelled: isShop,
    cancelReason: finalReason.replace('Shop hủy đơn:', '').replace('Khách hủy đơn:', '').trim()
  };
};

// Áp dụng trạng thái ghi đè (overrides) để trang người dùng luôn đồng bộ 100% với Manager
const applyStatusOverrides = (ordersList) => {
  if (!Array.isArray(ordersList)) return [];
  try {
    const rawOverrides = localStorage.getItem('yf_order_status_overrides');
    const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
    let overridesModified = false;

    let mgrOrdersList = [];
    try {
      const rawMgr = localStorage.getItem('yf_manager_orders');
      if (rawMgr) mgrOrdersList = JSON.parse(rawMgr);
    } catch (e) {}

    const result = ordersList.map(ord => {
      if (!ord) return ord;
      const rawId = String(ord.order_id || '').trim();
      const rawCode = String(ord.order_code || ord.order_number || '').trim();
      const digits = (rawCode || rawId).replace(/\D/g, '');

      const curStatus = String(ord.status || ord.order_status || '').toUpperCase();
      let ov = (digits && (overrides[digits] || overrides[`YF-${digits}`] || overrides[`#YF-${digits}`] || overrides[`YF - ${digits}`] || overrides[`#YF - ${digits}`] || overrides[`YF – ${digits}`] || overrides[`#YF – ${digits}`] || overrides[`#${digits}`])) || (rawId && overrides[rawId]) || (rawCode && overrides[rawCode]);
      if (!ov && digits && typeof overrides === 'object') {
        for (const k of Object.keys(overrides)) {
          if (k.replace(/\D/g, '') === digits) {
            ov = overrides[k];
            break;
          }
        }
      }

      // Kiểm tra quyết định quản lý mới nhất từ yf_manager_orders
      let mgrOrd = null;
      if (Array.isArray(mgrOrdersList)) {
        mgrOrd = mgrOrdersList.find(m => {
          if (!m) return false;
          const mId = String(m.order_id || '').trim();
          const mNum = String(m.order_number || m.order_code || '').trim();
          const mDigits = (mNum || mId).replace(/\D/g, '');
          return (rawId && (mId === rawId || mNum === rawId)) ||
                 (rawCode && (mId === rawCode || mNum === rawCode)) ||
                 (digits && mDigits && digits === mDigits);
        });
      }

      // Nếu Manager đã từ chối hoặc hoàn tiền trong yf_manager_orders thì ưu tiên áp dụng ngay
      if (mgrOrd) {
        const mgrL = String(mgrOrd.status_label || '').toUpperCase();
        const mgrN = String(mgrOrd.note || '').toLowerCase();
        const isMgrRej = mgrOrd.refund_decision === 'REJECTED' || mgrL.includes('TỪ CHỐI') || mgrN.includes('từ chối hoàn tiền') || mgrN.includes('từ chối hoàn');
        const isMgrApp = !isMgrRej && (mgrOrd.refund_decision === 'APPROVED' || mgrL.includes('ĐÃ HOÀN') || mgrN.includes('đã xác nhận hoàn tiền') || mgrN.includes('đã hoàn tiền') || mgrOrd.payment_status === 'REFUNDED');
        if (isMgrRej) {
          const mgrRejectReason = mgrOrd.reject_reason || (mgrOrd.note?.includes('Từ chối hoàn tiền:') ? mgrOrd.note.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim() : 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop');
          ov = {
            ...(ov || {}),
            status: 'RETURNED',
            status_label: 'Từ chối hoàn',
            status_label_manager: 'Từ chối hoàn',
            status_label_customer: 'TỪ CHỐI HOÀN',
            refund_decision: 'REJECTED',
            reject_reason: mgrRejectReason,
            refund_reason: mgrOrd.refund_reason || ov?.refund_reason || ord.refund_reason,
            refund_bank: mgrOrd.refund_bank || ov?.refund_bank || ord.refund_bank,
            note: mgrOrd.note || ov?.note || ord.note,
            updated_at: Date.now()
          };
          if (digits) {
            overrides[digits] = ov;
            overrides[`YF-${digits}`] = ov;
            overrides[`#YF-${digits}`] = ov;
            overrides[`YF - ${digits}`] = ov;
            overrides[`#YF - ${digits}`] = ov;
            overrides[`YF – ${digits}`] = ov;
            overrides[`#YF – ${digits}`] = ov;
            overrides[`#${digits}`] = ov;
          }
          if (rawId) overrides[rawId] = ov;
          if (rawCode) overrides[rawCode] = ov;
          overridesModified = true;
        } else if (isMgrApp) {
          ov = {
            ...(ov || {}),
            status: 'RETURNED',
            status_label: 'Đã hoàn tiền',
            status_label_manager: 'Đã hoàn tiền',
            status_label_customer: 'ĐÃ HOÀN TIỀN',
            refund_decision: 'APPROVED',
            refund_reason: mgrOrd.refund_reason || ov?.refund_reason || ord.refund_reason,
            refund_bank: mgrOrd.refund_bank || ov?.refund_bank || ord.refund_bank,
            note: mgrOrd.note || ov?.note || ord.note,
            updated_at: Date.now()
          };
          if (digits) {
            overrides[digits] = ov;
            overrides[`YF-${digits}`] = ov;
            overrides[`#YF-${digits}`] = ov;
            overrides[`YF - ${digits}`] = ov;
            overrides[`#YF - ${digits}`] = ov;
            overrides[`YF – ${digits}`] = ov;
            overrides[`#YF – ${digits}`] = ov;
            overrides[`#${digits}`] = ov;
          }
          if (rawId) overrides[rawId] = ov;
          if (rawCode) overrides[rawCode] = ov;
          overridesModified = true;
        }
      }

      // 1. Đơn hàng đã hủy tuyệt đối không bị hạ cấp
      if (curStatus === 'CANCELLED') {
        const isShop = (ov && ov.cancelled_by === 'SHOP') || (ord.cancelled_by === 'SHOP') ||
          String(ord.note || '').toLowerCase().includes('shop hủy') ||
          String(ov?.note || '').toLowerCase().includes('shop hủy');
        const defaultNote = isShop ? 'Shop hủy đơn' : 'Khách hủy đơn';
        const bestCancelReason = ord.cancel_reason || ov?.cancel_reason || (isShop ? 'Sản phẩm tạm thời hết hàng trong kho' : 'Đổi ý, không muốn mua nữa');
        if (ov && ov.status !== 'CANCELLED') {
          const fixedOv = {
            status: 'CANCELLED',
            status_label: 'Đã hủy',
            status_label_manager: 'Đã hủy',
            status_label_customer: 'ĐÃ HỦY',
            cancel_reason: bestCancelReason,
            cancelled_by: isShop ? 'SHOP' : (ord.cancelled_by || ov?.cancelled_by || 'CUSTOMER'),
            note: ord.note || ov?.note || defaultNote,
            updated_at: Date.now(),
          };
          if (digits) overrides[digits] = fixedOv;
          if (rawId) overrides[rawId] = fixedOv;
          if (rawCode) overrides[rawCode] = fixedOv;
          overridesModified = true;
        }
        return {
          ...ord,
          status: 'CANCELLED',
          order_status: 'CANCELLED',
          status_label: 'ĐÃ HỦY',
          cancel_reason: bestCancelReason,
          cancelled_by: isShop ? 'SHOP' : (ord.cancelled_by || ov?.cancelled_by || 'CUSTOMER'),
        };
      }

      // 2. Áp dụng override
      if (ov) {
        const ovStatus = String(ov.status || '').toUpperCase();
        const ovLabel = String(ov.status_label_customer || ov.status_label || '').toUpperCase();
        const ovDecision = String(ov.refund_decision || '').toUpperCase();

        let resolvedLabel = ov.status_label_customer || ov.status_label;
        if (ovStatus === 'RETURNED') {
          const effectiveDecision = ovDecision || String(ord.refund_decision || '').toUpperCase();
          const effectiveLabel = ovLabel || String(ord.status_label || '').toUpperCase();
          const effectiveNote = String(ov.note || ord.note || '').toLowerCase();
          if (effectiveDecision === 'APPROVED' || effectiveLabel.includes('ĐÃ HOÀN') || effectiveNote.includes('đã xác nhận hoàn tiền') || effectiveNote.includes('đã hoàn tiền')) resolvedLabel = 'ĐÃ HOÀN TIỀN';
          else if (effectiveDecision === 'REJECTED' || effectiveLabel.includes('TỪ CHỐI') || effectiveNote.includes('từ chối hoàn tiền') || effectiveNote.includes('từ chối hoàn')) resolvedLabel = 'TỪ CHỐI HOÀN';
          else resolvedLabel = 'ĐỔI TRẢ';
        } else if (!resolvedLabel) {
          resolvedLabel = ovStatus === 'COMPLETED' ? 'ĐÃ GIAO' : (
            ovStatus === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : (
              ovStatus === 'SHIPPING' ? 'ĐANG VẬN CHUYỂN' : (
                ovStatus === 'CANCELLED' ? 'ĐÃ HỦY' : 'CHỜ XÁC NHẬN'
              )
            )
          );
        }

        const resolvedDecision = (resolvedLabel === 'ĐÃ HOÀN TIỀN' ? 'APPROVED' : ((resolvedLabel === 'TỪ CHỐI HOÀN' || resolvedLabel === 'TỪ CHỐI HOÀN TIỀN') ? 'REJECTED' : (ov.refund_decision || ord.refund_decision)));

        let resolvedRejectReason = ov.reject_reason || ord.reject_reason || '';
        const checkNote = ov.note || ord.note || '';
        if (!resolvedRejectReason && checkNote.includes('Từ chối hoàn tiền:')) {
          resolvedRejectReason = checkNote.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim();
        }

        return {
          ...ord,
          status: ov.status,
          order_status: ov.status,
          status_label: resolvedLabel,
          delivered_date: ov.delivered_date || ord.delivered_date,
          cancel_reason: ov.cancel_reason || ord.cancel_reason,
          cancelled_by: ov.cancelled_by || ord.cancelled_by,
          refund_decision: resolvedDecision,
          refund_bank: ov.refund_bank || ord.refund_bank,
          refund_reason: ov.refund_reason || ord.refund_reason,
          reject_reason: resolvedRejectReason,
          delivery_status: ov.delivery_status || ord.delivery_status,
          delivery_fail_reason: ov.delivery_fail_reason || ord.delivery_fail_reason,
          retry_date: ov.retry_date || ord.retry_date,
          delivery_attempts: ov.delivery_attempts || ord.delivery_attempts,
          note: ov.note || ord.note,
        };
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

// Chuẩn hóa trạng thái đơn hàng đồng bộ theo Manager
const normalizeInitialOrderStatus = (order) => {
  if (!order) return order;
  const s = String(order.status || order.order_status || '').toUpperCase();
  const label = String(order.status_label || '').toUpperCase();
  const noteStr = String(order.note || '').toLowerCase();

  const isReturned = ['RETURNED', 'REFUNDED', 'EXCHANGE', 'RETURN'].includes(s) ||
    label.includes('ĐỔI TRẢ') ||
    label.includes('TRẢ HÀNG') ||
    label.includes('HOÀN TIỀN') ||
    label.includes('TỪ CHỐI') ||
    label.includes('ĐÃ HOÀN') ||
    Boolean(order.refund_reason) ||
    Boolean(order.refund_bank) ||
    order.refund_decision === 'APPROVED' ||
    order.refund_decision === 'REJECTED' ||
    noteStr.includes('khách yêu cầu hoàn tiền') ||
    noteStr.includes('yêu cầu hoàn tiền') ||
    (noteStr.includes('stk:') && !noteStr.includes('khách hủy đơn:'));
  const isCancelled = !isReturned && (['CANCELLED', 'FAILED'].includes(s) || label.includes('HỦY'));
  const isCompleted = !isReturned && !isCancelled && (['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(s) || label.includes('ĐÃ GIAO') || label.includes('GIAO THÀNH CÔNG'));
  const isShipping = !isReturned && !isCancelled && !isCompleted && (['SHIPPING', 'DELIVERING', 'SHIPPED', 'IN_TRANSIT'].includes(s) || (label.includes('VẬN CHUYỂN') && !label.includes('CHỜ VẬN CHUYỂN')) || label.includes('ĐANG GIAO'));
  const isConfirmed = !isReturned && !isCancelled && !isCompleted && !isShipping && (['CONFIRMED'].includes(s) || label.includes('ĐÃ XÁC NHẬN'));

  let normalizedStatus = 'PENDING';
  let normalizedLabel = 'CHỜ XÁC NHẬN';

  if (isReturned) {
    normalizedStatus = 'RETURNED';
    const refSt = resolveOrderRefundStatus(order);
    const isAppr = refSt.isApproved || order.refund_decision === 'APPROVED' || label.includes('ĐÃ HOÀN') || noteStr.includes('đã xác nhận hoàn tiền') || noteStr.includes('đã hoàn tiền');
    const isRej = !isAppr && (refSt.isRejected || order.refund_decision === 'REJECTED' || label.includes('TỪ CHỐI') || noteStr.includes('từ chối hoàn tiền') || noteStr.includes('từ chối hoàn'));
    if (isAppr) normalizedLabel = 'ĐÃ HOÀN TIỀN';
    else if (isRej) normalizedLabel = 'TỪ CHỐI HOÀN';
    else normalizedLabel = 'ĐỔI TRẢ';
  } else if (isCancelled) {
    normalizedStatus = 'CANCELLED';
    normalizedLabel = (order.status_label && !order.status_label.toUpperCase().includes('CHỜ XÁC NHẬN')) ? order.status_label : 'ĐÃ HỦY';
  } else if (isCompleted) {
    normalizedStatus = 'COMPLETED';
    normalizedLabel = (order.status_label && !order.status_label.toUpperCase().includes('CHỜ XÁC NHẬN') && !order.status_label.toUpperCase().includes('ĐỔI TRẢ')) ? order.status_label : (order.delivered_date ? `ĐÃ GIAO (${order.delivered_date})` : 'ĐÃ GIAO');
  } else if (isShipping) {
    normalizedStatus = 'SHIPPING';
    normalizedLabel = 'ĐANG VẬN CHUYỂN';
  } else if (isConfirmed) {
    normalizedStatus = 'CONFIRMED';
    normalizedLabel = 'ĐÃ XÁC NHẬN';
  }

  // Tự động phân giải reject_reason nếu có trong note hoặc refSt
  const refStFinal = resolveOrderRefundStatus(order);
  let rejectReason = order.reject_reason || refStFinal.rejectReason || '';
  if (!rejectReason && order.note && order.note.includes('Từ chối hoàn tiền:')) {
    rejectReason = order.note.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim();
  }

  return {
    ...order,
    status: normalizedStatus,
    order_status: normalizedStatus,
    status_label: normalizedLabel,
    refund_decision: isReturned ? (normalizedLabel === 'ĐÃ HOÀN TIỀN' ? 'APPROVED' : ((normalizedLabel === 'TỪ CHỐI HOÀN' || normalizedLabel === 'TỪ CHỐI HOÀN TIỀN') ? 'REJECTED' : (order.refund_decision || 'PENDING'))) : order.refund_decision,
    reject_reason: rejectReason || order.reject_reason,
  };
};

const ProfilePage = () => {
  const { user, updateUserProfile, changePassword, orders, wishlist, logout, addToCart } = useAuth();
  const isManagerOrAdmin = Boolean(
    user && (
      String(user.role || '').toUpperCase() === 'MANAGER' ||
      String(user.role || '').toUpperCase() === 'ADMIN' ||
      String(user.role || '').toUpperCase() === 'EMPLOYEE' ||
      String(user.user_type || '').toUpperCase() === 'EMPLOYEE' ||
      String(user.employee_role || '').toUpperCase() === 'MANAGER' ||
      String(user.employee_role || '').toUpperCase() === 'ADMIN' ||
      user.email === 'mana@gmail.com'
    )
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
    navigate('/');
  };
  const initialTab = searchParams.get('tab') || 'vouchers';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const ordersPerPage = 3;

  // Lịch sử đơn hàng: Chỉ tải các đơn hàng thực tế mà người dùng đã đặt thành công
  const [customerOrders, setCustomerOrders] = useState(() => {
    try {
      if (ensureOrderCacheReset()) {
        return [];
      }

      const userKey = user ? `yf_customer_orders_${user.customer_id || user.id || user.email}` : null;
      let saved = [];
      if (userKey) {
        const u = localStorage.getItem(userKey);
        if (u) saved = JSON.parse(u);
      }
      if (!saved || saved.length === 0) {
        const g = localStorage.getItem('yf_customer_orders');
        if (g) saved = JSON.parse(g);
      }
      let cleaned = purgeMockOrders(saved);
      try {
        const mgrRaw = localStorage.getItem('yf_manager_orders');
        if (mgrRaw) {
          const mgrOrders = JSON.parse(mgrRaw);
          if (Array.isArray(mgrOrders) && mgrOrders.length > 0) {
            cleaned = cleaned.map(loc => {
              const locDigits = String(loc.order_code || loc.order_id || loc.order_number || '').replace(/\D/g, '');
              const locId = String(loc.order_id || '');
              const locCode = String(loc.order_code || loc.order_number || '');
              const m = mgrOrders.find(item => {
                if (!item) return false;
                const mId = String(item.order_id || '').trim();
                const mNum = String(item.order_number || item.order_code || '').trim();
                const mDigits = (mNum || mId).replace(/\D/g, '');
                return (locId && (mId === locId || mNum === locId)) ||
                       (locCode && (mId === locCode || mNum === locCode)) ||
                       (locDigits && mDigits && locDigits === mDigits);
              });
              if (m && (m.order_status || m.status)) {
                const rawMStatus = String(m.order_status || m.status).toUpperCase();
                let mStatus = rawMStatus;
                if (['SHIPPING', 'SHIPPED', 'DELIVERING', 'IN_TRANSIT'].includes(rawMStatus)) mStatus = 'SHIPPING';
                else if (['CONFIRMED'].includes(rawMStatus)) mStatus = 'CONFIRMED';
                else if (['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(rawMStatus)) mStatus = 'COMPLETED';
                else if (['CANCELLED', 'FAILED'].includes(rawMStatus)) mStatus = 'CANCELLED';
                else if (['RETURNED', 'REFUNDED', 'EXCHANGE'].includes(rawMStatus)) mStatus = 'RETURNED';
                else mStatus = 'PENDING';

                const isRej = m.refund_decision === 'REJECTED' || String(m.status_label || '').toUpperCase().includes('TỪ CHỐI') || String(m.note || '').toLowerCase().includes('từ chối hoàn tiền') || String(m.note || '').toLowerCase().includes('từ chối hoàn');
                const isApp = !isRej && (m.refund_decision === 'APPROVED' || String(m.status_label || '').toUpperCase().includes('ĐÃ HOÀN') || String(m.note || '').toLowerCase().includes('đã xác nhận hoàn tiền') || String(m.note || '').toLowerCase().includes('đã hoàn tiền') || m.payment_status === 'REFUNDED');
                let mLabel = m.status_label_customer || m.status_label;
                if (mStatus === 'RETURNED') {
                  if (isApp) {
                    mLabel = 'ĐÃ HOÀN TIỀN';
                  } else if (isRej) {
                    mLabel = 'TỪ CHỐI HOÀN';
                  } else {
                    mLabel = 'ĐỔI TRẢ';
                  }
                }
                const rejReason = m.reject_reason || loc.reject_reason || (m.note?.includes('Từ chối hoàn tiền:') ? m.note.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim() : 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop');
                return {
                  ...loc,
                  status: mStatus,
                  order_status: mStatus,
                  status_label: isRej ? 'TỪ CHỐI HOÀN' : (isApp ? 'ĐÃ HOÀN TIỀN' : mLabel),
                  refund_decision: isRej ? 'REJECTED' : (isApp ? 'APPROVED' : (m.refund_decision || loc.refund_decision)),
                  reject_reason: isRej ? rejReason : (m.reject_reason || loc.reject_reason),
                  refund_reason: m.refund_reason || loc.refund_reason,
                  refund_bank: m.refund_bank || loc.refund_bank,
                  note: m.note || loc.note,
                };
              }
              return loc;
            });
          }
        }
      } catch (e) {}
      try {
        if (userKey) localStorage.setItem(userKey, JSON.stringify(cleaned));
        localStorage.setItem('yf_customer_orders', JSON.stringify(cleaned));
      } catch (e) { }
      return applyStatusOverrides(cleaned).map(order => normalizeInitialOrderStatus({
        ...order,
        items: (order.items || []).map(item => ({
          ...item,
          image: resolveOrderItemImage(item),
        }))
      }));
    } catch (e) {
      return [];
    }
  });

  // Modal theo dõi hành trình, đánh giá, bảo hành, hủy đơn, hoàn tiền
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [reviewModalOrder, setReviewModalOrder] = useState(null);
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [refundModalOrder, setRefundModalOrder] = useState(null);
  const [refundReason, setRefundReason] = useState('Sản phẩm không vừa kích cỡ (Size)');
  const [customRefundReason, setCustomRefundReason] = useState('');
  const [refundBankInfo, setRefundBankInfo] = useState('');
  const [refundBankError, setRefundBankError] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Đổi ý, không muốn mua nữa');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [orderAlert, setOrderAlert] = useState({ type: '', message: '' });
  const [reviewRating, setReviewRating] = useState(5);
  const [selectedReviewTags, setSelectedReviewTags] = useState(['Chất liệu thượng hạng', 'Đường may tinh xảo']);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmittedAlert, setReviewSubmittedAlert] = useState('');
  const [reviewedOrdersMap, setReviewedOrdersMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('yf_reviewed_orders') || '{}');
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    const handleSyncReviews = () => {
      try {
        setReviewedOrdersMap(JSON.parse(localStorage.getItem('yf_reviewed_orders') || '{}'));
      } catch (e) {}
    };
    window.addEventListener('yf_reviews_updated', handleSyncReviews);
    window.addEventListener('storage', handleSyncReviews);
    return () => {
      window.removeEventListener('yf_reviews_updated', handleSyncReviews);
      window.removeEventListener('storage', handleSyncReviews);
    };
  }, []);

  const isOrderReviewed = useCallback((ord) => {
    if (!ord) return false;
    const rawId = String(ord.order_id || ord.id || '').trim();
    const rawCode = String(ord.order_code || ord.order_number || '').trim();
    const digits = (rawCode || rawId).replace(/\D/g, '');
    return Boolean(
      (rawId && reviewedOrdersMap[rawId]) ||
      (rawCode && reviewedOrdersMap[rawCode]) ||
      (digits && reviewedOrdersMap[digits]) ||
      ord.is_reviewed
    );
  }, [reviewedOrdersMap]);

  // Tự động chuyển tab khi URL thay đổi (VD: chuyển từ Đặt hàng thành công sang /profile?tab=orders)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Đồng bộ đơn hàng từ database backend, Manager storage & LocalStorage thực tế
  const loadOrders = useCallback(() => {
    if (localStorage.getItem('yf_orders_reset_all_v3') !== 'true') {
      try {
        orderService.clearAllOrders().catch(() => { });
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
      } catch (e) { }
      setCustomerOrders([]);
      return;
    }

    const userKey = user ? `yf_customer_orders_${user.customer_id || user.id || user.email}` : null;
    let local = [];
    try {
      if (userKey) {
        const uSaved = localStorage.getItem(userKey);
        if (uSaved) local = JSON.parse(uSaved);
      }
      if (!local || local.length === 0) {
        const gSaved = localStorage.getItem('yf_customer_orders');
        if (gSaved) local = JSON.parse(gSaved);
      }
      local = purgeMockOrders(local).map(order => normalizeInitialOrderStatus({
        ...order,
        items: (order.items || []).map(item => ({
          ...item,
          image: resolveOrderItemImage(item),
        }))
      }));

      // Đồng bộ trực tiếp từ danh sách quản lý đơn hàng của Manager/Admin (yf_manager_orders)
      const mgrRaw = localStorage.getItem('yf_manager_orders');
      if (mgrRaw) {
        const mgrOrders = JSON.parse(mgrRaw);
        if (Array.isArray(mgrOrders) && mgrOrders.length > 0) {
          local = local.map(loc => {
            const locDigits = String(loc.order_code || loc.order_id || loc.order_number || '').replace(/\D/g, '');
            const locId = String(loc.order_id || '');
            const locCode = String(loc.order_code || loc.order_number || '');
            const m = mgrOrders.find(item => {
              if (!item) return false;
              const mId = String(item.order_id || '').trim();
              const mNum = String(item.order_number || item.order_code || '').trim();
              const mDigits = (mNum || mId).replace(/\D/g, '');
              return (locId && (mId === locId || mNum === locId)) ||
                     (locCode && (mId === locCode || mNum === locCode)) ||
                     (locDigits && mDigits && locDigits === mDigits);
            });
            if (m && m.order_status) {
              const rawMStatus = String(m.order_status).toUpperCase();
              let mStatus = rawMStatus;
              if (['SHIPPING', 'SHIPPED', 'DELIVERING', 'IN_TRANSIT'].includes(rawMStatus)) mStatus = 'SHIPPING';
              else if (['CONFIRMED'].includes(rawMStatus)) mStatus = 'CONFIRMED';
              else if (['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(rawMStatus)) mStatus = 'COMPLETED';
              else if (['CANCELLED', 'FAILED'].includes(rawMStatus)) mStatus = 'CANCELLED';
              else if (['RETURNED', 'REFUNDED', 'EXCHANGE'].includes(rawMStatus)) mStatus = 'RETURNED';
              else mStatus = 'PENDING';

              const formattedDate = new Date().toLocaleDateString('vi-VN');
              const isRej = m.refund_decision === 'REJECTED' || String(m.status_label || '').toUpperCase().includes('TỪ CHỐI') || String(m.note || '').toLowerCase().includes('từ chối hoàn tiền') || String(m.note || '').toLowerCase().includes('từ chối hoàn');
              const isApp = !isRej && (m.refund_decision === 'APPROVED' || String(m.status_label || '').toUpperCase().includes('ĐÃ HOÀN') || String(m.note || '').toLowerCase().includes('đã xác nhận hoàn tiền') || String(m.note || '').toLowerCase().includes('đã hoàn tiền') || m.payment_status === 'REFUNDED');
              let mLabel = m.status_label_customer || m.status_label;
              if (mStatus === 'RETURNED') {
                if (isApp) {
                  mLabel = 'ĐÃ HOÀN TIỀN';
                } else if (isRej) {
                  mLabel = 'TỪ CHỐI HOÀN';
                } else {
                  mLabel = 'ĐỔI TRẢ';
                }
              } else if (!mLabel) {
                mLabel = (
                  mStatus === 'COMPLETED' ? `ĐÃ GIAO (${formattedDate})` : (
                    mStatus === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : (
                      mStatus === 'SHIPPING' ? 'ĐANG VẬN CHUYỂN' : (
                        mStatus === 'CANCELLED' ? 'ĐÃ HỦY' : 'CHỜ XÁC NHẬN'
                      )
                    )
                  )
                );
              }
              const curLocStatus = String(loc.status || loc.order_status || '').toUpperCase();
              if (curLocStatus === 'CANCELLED' && mStatus !== 'CANCELLED') {
                return loc;
              }

              const rejReason = m.reject_reason || loc.reject_reason || (m.note?.includes('Từ chối hoàn tiền:') ? m.note.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim() : 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop');
              return {
                ...loc,
                status: mStatus,
                order_status: mStatus,
                status_label: isRej ? 'TỪ CHỐI HOÀN' : (isApp ? 'ĐÃ HOÀN TIỀN' : mLabel),
                refund_decision: isRej ? 'REJECTED' : (isApp ? 'APPROVED' : (m.refund_decision || loc.refund_decision)),
                reject_reason: isRej ? rejReason : (m.reject_reason || loc.reject_reason),
                refund_reason: m.refund_reason || loc.refund_reason,
                refund_bank: m.refund_bank || loc.refund_bank,
                note: m.note || loc.note,
                delivered_date: mStatus === 'COMPLETED' ? (loc.delivered_date || formattedDate) : loc.delivered_date,
              };
            }
            return loc;
          });
        }
      }

      local = applyStatusOverrides(local);
      if (userKey) localStorage.setItem(userKey, JSON.stringify(local));
      localStorage.setItem('yf_customer_orders', JSON.stringify(local));
    } catch (e) { }

    // Cập nhật giao diện ngay lập tức từ local storage
    if (local && local.length > 0) {
      setCustomerOrders(local);
    }

    // Gọi API lấy các đơn hàng thực tế đã lưu trong MySQL
    orderService.getMyOrders(user?.email)
      .then((res) => {
        if (res?.status && Array.isArray(res.data)) {
          const apiFormatted = res.data.map((apiOrd) => {
            const isPayos = apiOrd.payments?.[0]?.payment_method === 'PAYOS' || String(apiOrd.payment_method || '').includes('PAYOS') || String(apiOrd.payment_method || '').includes('VietQR');
            const isPayosPaid = isPayos && (apiOrd.payments?.[0]?.payment_status === 'SUCCESS' || apiOrd.payments?.[0]?.payment_status === 'PAID');
            // Nếu đơn PayOS chưa thanh toán thành công hoặc đã bị hủy thì không tính là đơn hàng đặt
            if (isPayos && !isPayosPaid) {
              return null;
            }

            const s = String(apiOrd.order_status || '').toUpperCase();
            const isCompleted = ['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(s);
            const isShipping = ['SHIPPING', 'DELIVERING', 'SHIPPED', 'IN_TRANSIT'].includes(s);
            const isConfirmed = ['CONFIRMED'].includes(s);
            const isReturned = ['RETURNED', 'REFUNDED', 'EXCHANGE', 'RETURN'].includes(s);
            const isCancelled = ['CANCELLED', 'FAILED'].includes(s);
            const orderDateStr = new Date(apiOrd.created_at).toLocaleDateString('vi-VN');
            const apiNote = String(apiOrd.note || '');

            let currentStatus = isCompleted
              ? 'COMPLETED'
              : (isReturned
                ? 'RETURNED'
                : (isCancelled
                  ? 'CANCELLED'
                  : (isShipping ? 'SHIPPING' : (isConfirmed ? 'CONFIRMED' : 'PENDING'))));

            let currentStatusLabel = isCompleted
              ? `ĐÃ GIAO (${orderDateStr})`
              : (isCancelled
                ? 'ĐÃ HỦY'
                : (isShipping ? 'ĐANG VẬN CHUYỂN' : (isConfirmed ? 'ĐÃ XÁC NHẬN' : 'CHỜ XÁC NHẬN')));

            let refundDecision = undefined;
            let rejectReason = '';
            let refundReason = '';
            let refundBank = '';

            if (isReturned) {
              const apiNoteLow = apiNote.toLowerCase();
              if (apiNoteLow.includes('đã xác nhận hoàn tiền') || apiNoteLow.includes('đã hoàn tiền')) {
                refundDecision = 'APPROVED';
                currentStatusLabel = 'ĐÃ HOÀN TIỀN';
              } else if (apiNoteLow.includes('từ chối hoàn tiền') || apiNoteLow.includes('từ chối hoàn')) {
                refundDecision = 'REJECTED';
                currentStatusLabel = 'TỪ CHỐI HOÀN';
                rejectReason = apiNote.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim();
              } else {
                currentStatusLabel = 'ĐỔI TRẢ';
              }
              if (apiNote.includes('STK:')) {
                refundBank = apiNote.split('STK:')[1]?.trim();
                const rPart = apiNote.split('STK:')[0].replace('Khách yêu cầu hoàn tiền:', '').replace('Đã xác nhận hoàn tiền:', '').replace('|', '').trim();
                if (rPart && !rPart.includes('₫') && !rPart.includes('đ')) refundReason = rPart;
              }
            }

            return {
              order_id: String(apiOrd.order_id || apiOrd.order_number),
              order_code: apiOrd.order_number ? (apiOrd.order_number.startsWith('YF') ? apiOrd.order_number : `YF - ${apiOrd.order_number}`) : `YF - ${apiOrd.order_id}`,
              created_at: orderDateStr,
              payment_method: apiOrd.payments?.[0]?.payment_method === 'PAYOS'
                ? 'Thanh toán: Chuyển khoản VietQR'
                : 'Thanh toán: Tiền mặt khi nhận hàng (COD)',
              status: currentStatus,
              order_status: currentStatus,
              status_label: currentStatusLabel,
              delivered_date: isCompleted ? orderDateStr : null,
              total_amount: Number(apiOrd.total_amount || 0),
              note: apiNote,
              refund_decision: refundDecision,
              reject_reason: rejectReason,
              refund_reason: refundReason,
              refund_bank: refundBank,
              items: (apiOrd.order_items || []).map((i) => ({
                id: i.order_item_id || i.variant_id,
                name: i.product_name,
                size: `Size ${i.size || 'M'}`,
                color: `Màu ${i.color || 'Tiêu chuẩn'}`,
                quantity: Number(i.quantity || 1),
                price: Number(i.unit_price || 0),
                image: resolveOrderItemImage(i),
                collection_tag: i.variant?.product?.category?.category_name || 'THỜI TRANG CAO CẤP',
              })),
            };
          });

          // Hợp nhất đơn hàng từ backend và local (ưu tiên cập nhật trạng thái mới nhất từ Manager)
          const merged = [...apiFormatted.filter(Boolean)];
          for (const item of (local || [])) {
            const idx = merged.findIndex(m =>
              String(m.order_code).replace(/\D/g, '') === String(item.order_code || item.order_id).replace(/\D/g, '')
            );
            if (idx === -1) {
              merged.push(normalizeInitialOrderStatus({
                ...item,
                items: (item.items || []).map(it => ({
                  ...it,
                  image: resolveOrderItemImage(it),
                }))
              }));
            } else {
              const best = pickAuthoritativeStatus(
                merged[idx].status,
                item.status,
                merged[idx].status_label,
                item.status_label,
                merged[idx].note,
                item.note,
                merged[idx].refund_decision,
                item.refund_decision
              );
              merged[idx] = {
                ...merged[idx],
                ...item,
                status: best.status,
                order_status: best.status,
                status_label: best.label,
                delivered_date: best.status === 'COMPLETED' ? (item.delivered_date || merged[idx].delivered_date || new Date().toLocaleDateString('vi-VN')) : (item.delivered_date || merged[idx].delivered_date),
                refund_decision: (item.refund_decision === 'REJECTED' || merged[idx].refund_decision === 'REJECTED' || best.label === 'TỪ CHỐI HOÀN' || best.label === 'TỪ CHỐI HOÀN TIỀN') ? 'REJECTED' : (item.refund_decision || merged[idx].refund_decision || (best.label === 'ĐÃ HOÀN TIỀN' ? 'APPROVED' : undefined)),
                refund_bank: item.refund_bank || merged[idx].refund_bank,
                refund_reason: item.refund_reason || merged[idx].refund_reason,
                reject_reason: item.reject_reason || merged[idx].reject_reason || ((best.label === 'TỪ CHỐI HOÀN' || best.label === 'TỪ CHỐI HOÀN TIỀN') ? 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop' : ''),
                note: item.note || merged[idx].note,
              };
            }
          }
          const finalOrders = applyStatusOverrides(purgeMockOrders(merged)).map(ord => normalizeInitialOrderStatus({
            ...ord,
            items: (ord.items || []).map(it => ({
              ...it,
              image: resolveOrderItemImage(it),
            }))
          }));
          setCustomerOrders(finalOrders);
          if (userKey) localStorage.setItem(userKey, JSON.stringify(finalOrders));
          localStorage.setItem('yf_customer_orders', JSON.stringify(finalOrders));
        } else {
          setCustomerOrders(applyStatusOverrides(purgeMockOrders(local || [])).map(normalizeInitialOrderStatus));
        }
      })
      .catch(() => {
        setCustomerOrders(applyStatusOverrides(purgeMockOrders(local || [])).map(normalizeInitialOrderStatus));
      });
  }, [user]);

  // Lắng nghe sự kiện đồng bộ thời gian thực khi Manager cập nhật trạng thái
  useEffect(() => {
    loadOrders();

    const handleOrderSync = (e) => {
      // Khi tab khác ghi đè đơn hàng qua storage, tự động tải lại toàn bộ
      if (e?.key === 'yf_manager_orders' || e?.key === 'yf_order_status_overrides' || e?.key?.startsWith('yf_customer_orders')) {
        loadOrders();
        return;
      }

      let detail = e?.detail;
      if (!detail && e?.key === 'yf_last_status_event' && e?.newValue) {
        try {
          detail = JSON.parse(e.newValue);
        } catch (err) { }
      }
      if (!detail) {
        try {
          const raw = localStorage.getItem('yf_last_status_event');
          if (raw) detail = JSON.parse(raw);
        } catch (err) { }
      }

      if (detail?.action === 'CLEAR_ALL') {
        setCustomerOrders([]);
        setTrackingModalOrder(null);
        return;
      }

      if (detail?.status) {
        const s = detail.status;
        let cLabel = detail.customerLabel;
        if (s === 'RETURNED') {
          if (detail.refund_decision === 'APPROVED' || String(detail.statusLabel || '').toLowerCase().includes('hoàn tiền') || String(detail.customerLabel || '').includes('HOÀN TIỀN')) {
            cLabel = 'ĐÃ HOÀN TIỀN';
          } else if (detail.refund_decision === 'REJECTED' || String(detail.statusLabel || '').toLowerCase().includes('từ chối') || String(detail.customerLabel || '').includes('TỪ CHỐI')) {
            cLabel = 'TỪ CHỐI HOÀN';
          } else {
            cLabel = 'ĐỔI TRẢ';
          }
        } else if (!cLabel) {
          cLabel = detail.statusLabel || (
            s === 'COMPLETED' ? 'ĐÃ GIAO' : (
              s === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : (
                s === 'SHIPPING' ? 'ĐANG VẬN CHUYỂN' : (
                  s === 'CANCELLED' ? 'ĐÃ HỦY' : 'CHỜ XÁC NHẬN'
                )
              )
            )
          );
        }

        const evtDigits = String(detail.orderDigits || detail.digits || detail.orderNumber || detail.orderId || '').replace(/\D/g, '');
        try {
          const rawOv = localStorage.getItem('yf_order_status_overrides');
          const ovs = rawOv ? JSON.parse(rawOv) : {};
          if (evtDigits) {
            const ovEntry = {
              status: s,
              status_label: detail.statusLabel || cLabel,
              status_label_customer: cLabel,
              refund_decision: detail.refund_decision,
              reject_reason: detail.reject_reason,
              note: detail.note,
              updated_at: Date.now()
            };
            ovs[evtDigits] = ovEntry;
            ovs[`YF-${evtDigits}`] = ovEntry;
            ovs[`#YF-${evtDigits}`] = ovEntry;
            ovs[`YF - ${evtDigits}`] = ovEntry;
            ovs[`#YF - ${evtDigits}`] = ovEntry;
            ovs[`YF – ${evtDigits}`] = ovEntry;
            ovs[`#YF – ${evtDigits}`] = ovEntry;
            localStorage.setItem('yf_order_status_overrides', JSON.stringify(ovs));
          }
        } catch (e) {}

        setCustomerOrders(prev => {
          const updated = prev.map(ord => {
            const oId = String(ord.order_id || '').trim();
            const oCode = String(ord.order_code || ord.order_number || '').trim();
            const oDigits = (oCode || oId).replace(/\D/g, '');
            const evtId = String(detail.orderId || '').trim();
            const evtCode = String(detail.orderNumber || detail.orderCode || '').trim();

            const isMatch = (evtId && (oId === evtId || oCode === evtId)) ||
              (evtCode && (oId === evtCode || oCode === evtCode)) ||
              (evtDigits && oDigits && evtDigits === oDigits);

            if (isMatch) {
              return {
                ...ord,
                status: s,
                order_status: s,
                status_label: cLabel,
                cancel_reason: detail.cancel_reason || ord.cancel_reason,
                cancelled_by: detail.cancelled_by || ord.cancelled_by,
                refund_decision: detail.refund_decision || ord.refund_decision,
                refund_bank: detail.refund_bank || ord.refund_bank,
                reject_reason: detail.reject_reason || ord.reject_reason,
                delivery_status: detail.delivery_status !== undefined ? detail.delivery_status : ord.delivery_status,
                delivery_fail_reason: detail.delivery_fail_reason !== undefined ? detail.delivery_fail_reason : ord.delivery_fail_reason,
                retry_date: detail.retry_date !== undefined ? detail.retry_date : ord.retry_date,
                delivery_attempts: detail.delivery_attempts !== undefined ? detail.delivery_attempts : ord.delivery_attempts,
                note: detail.note || ord.note,
              };
            }
            return ord;
          });
          try {
            const userKey = user ? `yf_customer_orders_${user.customer_id || user.id || user.email}` : null;
            if (userKey) localStorage.setItem(userKey, JSON.stringify(updated));
            localStorage.setItem('yf_customer_orders', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        setTrackingModalOrder(prev => {
          if (!prev) return null;
          const matchId = String(prev.order_id || '').trim();
          const matchCode = String(prev.order_code || prev.order_number || '').trim();
          const matchDigits = (matchCode || matchId).replace(/\D/g, '');
          const evtId = String(detail.orderId || '').trim();
          const evtCode = String(detail.orderNumber || '').trim();
          const evtDigits = String(detail.orderDigits || detail.digits || evtCode || evtId).replace(/\D/g, '');

          const isMatch = (evtId && (matchId === evtId || matchCode === evtId)) ||
            (evtCode && (matchId === evtCode || matchCode === evtCode)) ||
            (evtDigits && matchDigits && evtDigits === matchDigits);

          if (isMatch) {
            return {
              ...prev,
              status: s,
              order_status: s,
              status_label: cLabel,
              cancel_reason: detail.cancel_reason || prev.cancel_reason,
              cancelled_by: detail.cancelled_by || prev.cancelled_by,
              refund_decision: detail.refund_decision || prev.refund_decision,
              refund_bank: detail.refund_bank || prev.refund_bank,
              reject_reason: detail.reject_reason || prev.reject_reason,
              delivery_status: detail.delivery_status !== undefined ? detail.delivery_status : prev.delivery_status,
              delivery_fail_reason: detail.delivery_fail_reason !== undefined ? detail.delivery_fail_reason : prev.delivery_fail_reason,
              retry_date: detail.retry_date !== undefined ? detail.retry_date : prev.retry_date,
              delivery_attempts: detail.delivery_attempts !== undefined ? detail.delivery_attempts : prev.delivery_attempts,
              note: detail.note || prev.note,
            };
          }
          return prev;
        });
      }
    };

    let bc = null;
    try {
      bc = new BroadcastChannel('yf_orders_sync_channel');
      bc.onmessage = (evt) => {
        if (evt?.data) {
          handleOrderSync({ detail: evt.data });
        }
      };
    } catch (e) {}

    window.addEventListener('order_status_updated', handleOrderSync);
    window.addEventListener('yf_order_status_changed', handleOrderSync);
    window.addEventListener('storage', handleOrderSync);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadOrders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', loadOrders);

    // Đồng bộ định kỳ 2.5s đảm bảo luôn cập nhật theo mọi thao tác của Manager
    const pollInterval = setInterval(() => {
      loadOrders();
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', loadOrders);
      window.removeEventListener('order_status_updated', handleOrderSync);
      window.removeEventListener('yf_order_status_changed', handleOrderSync);
      window.removeEventListener('storage', handleOrderSync);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
    };
  }, [loadOrders]);
  const DEFAULT_AVATAR = '/logo-white.png';

  // Nén ảnh tải lên về chuẩn JPEG (max 400x400) để tối ưu lưu trữ CSDL & LocalStorage
  const compressAvatarImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 400;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const isValidAvatarUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('http://') || url.startsWith('https://')) return true;
    if (url.startsWith('data:image/')) return url.length > 50 && url.includes(';base64,');
    return false;
  };

  // Form State initialized from user context
  const getSavedAvatar = () => {
    if (isValidAvatarUrl(user?.avatar_url)) return user.avatar_url;
    if (user?.email) {
      const byEmail = localStorage.getItem(`avatar_url_${user.email}`);
      if (isValidAvatarUrl(byEmail)) return byEmail;
    }
    const globalAvatar = localStorage.getItem('user_avatar_url');
    if (isValidAvatarUrl(globalAvatar)) return globalAvatar;
    return DEFAULT_AVATAR;
  };

  // Định dạng ngày tham gia / đăng ký hệ thống chuẩn DD/MM/YYYY
  const formatRegistrationDate = (dateVal) => {
    if (dateVal) {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${d.getFullYear()}`;
      }
    }
    // Fallback 1: Lấy ngày từ đơn hàng sớm nhất của khách hàng
    if (customerOrders && customerOrders.length > 0) {
      const sorted = [...customerOrders].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      if (sorted[0]?.created_at) {
        const d = new Date(sorted[0].created_at);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          return `${day}/${month}/${d.getFullYear()}`;
        }
      }
    }
    // Fallback 2: Lấy ngày lưu cục bộ khi tài khoản được tạo
    const storedReg = user?.email && localStorage.getItem(`yf_user_registered_at_${user.email}`);
    if (storedReg) {
      const d = new Date(storedReg);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${d.getFullYear()}`;
      }
    }
    // Fallback 3: Ngày hiện tại
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  };

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    avatar_url: getSavedAvatar(),
    gender: user?.gender || 'Nữ',
    dob: normalizeDobToVn(user?.dob),
    province: user?.address?.province || '',
    district: user?.address?.district || '',
    ward: user?.address?.ward || '',
    detailAddress: user?.address?.detail || ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || prev.full_name || '',
        phone: user.phone || '',
        email: user.email || prev.email || '',
        avatar_url: getSavedAvatar(),
        gender: user.gender || prev.gender || 'Nữ',
        dob: normalizeDobToVn(user.dob),
        province: user.address?.province || prev.province || '',
        district: user.address?.district || prev.district || '',
        ward: user.address?.ward || prev.ward || '',
        detailAddress: user.address?.detail || prev.detailAddress || ''
      }));
    }
  }, [user]);

  const [profileAlert, setProfileAlert] = useState({ type: '', message: '' });
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [dobError, setDobError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const fileInputRef = useRef(null);
  const hiddenDateRef = useRef(null);

  // Hàm kiểm tra họ và tên
  const validateFullName = (name) => {
    if (!name || !name.trim()) {
      return 'Họ và tên không được để trống';
    }
    if (name.trim().length < 2) {
      return 'Họ và tên phải có tối thiểu 2 ký tự';
    }
    return '';
  };

  // Hàm kiểm tra định dạng số điện thoại di động Việt Nam chuẩn (Bắt buộc điền)
  const validatePhone = (phoneNumber) => {
    if (!phoneNumber || !phoneNumber.toString().trim()) {
      return 'Số điện thoại không được để trống';
    }
    const cleaned = phoneNumber.toString().replace(/[\s.\-()]/g, '');
    const vnPhoneRegex = /^(?:(?:\+84|84|0))(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;
    if (!vnPhoneRegex.test(cleaned)) {
      return 'Số điện thoại không hợp lệ (gồm 10 số thuộc các đầu mạng di động VN: 032-039, 05x, 07x, 08x, 09x)';
    }
    return '';
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      try {
        const compressedAvatarUrl = await compressAvatarImage(file);
        if (compressedAvatarUrl) {
          setFormData(prev => ({ ...prev, avatar_url: compressedAvatarUrl }));
          try {
            localStorage.setItem('user_avatar_url', compressedAvatarUrl);
            if (user?.email) {
              localStorage.setItem(`avatar_url_${user.email}`, compressedAvatarUrl);
            }
          } catch (err) {
            console.warn('LocalStorage quota warning:', err);
          }
          if (updateUserProfile) {
            await updateUserProfile({ avatar_url: compressedAvatarUrl });
          }
          setProfileAlert({ type: 'success', message: 'Đã cập nhật ảnh đại diện mới thành công!' });
          setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
        }
      } catch (err) {
        console.error('Lỗi cập nhật ảnh đại diện:', err);
      }
    }
  };

  // Password State
  const [passData, setPassData] = useState({ currentPass: '', newPass: '', confirmPass: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passAlertType, setPassAlertType] = useState('danger');
  const [newPassError, setNewPassError] = useState('');
  const [confirmPassError, setConfirmPassError] = useState('');

  // Validations matching Registration
  const validateNewPassword = (pwd) => {
    if (!pwd || !pwd.trim()) {
      return 'Mật khẩu mới không được để trống';
    }
    if (pwd.length < 6) {
      return 'Mật khẩu mới phải có tối thiểu 6 ký tự';
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/.test(pwd)) {
      return 'Mật khẩu phải bao gồm chữ hoa (A-Z), chữ thường (a-z), chữ số (0-9) và ký tự đặc biệt (VD: Manh123@)';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPwd, newPwd) => {
    if (!confirmPwd || !confirmPwd.trim()) {
      return 'Xác nhận mật khẩu mới không được để trống';
    }
    if (confirmPwd !== newPwd) {
      return 'Mật khẩu mới xác nhận không khớp. Vui lòng kiểm tra lại!';
    }
    return '';
  };

  const handleNewPassChange = (e) => {
    const val = e.target.value;
    setPassData(p => ({ ...p, newPass: val }));
    if (newPassError) {
      setNewPassError(validateNewPassword(val));
    }
    if (confirmPassError && passData.confirmPass) {
      setConfirmPassError(validateConfirmPassword(passData.confirmPass, val));
    }
  };

  const handleConfirmPassChange = (e) => {
    const val = e.target.value;
    setPassData(p => ({ ...p, confirmPass: val }));
    if (confirmPassError) {
      setConfirmPassError(validateConfirmPassword(val, passData.newPass));
    }
  };

  // Synchronize when tab query param changes
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'info';
    setActiveTab(currentTab);
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'full_name' && fullNameError) {
      setFullNameError(validateFullName(value));
    }
    if (name === 'phone' && phoneError) {
      setPhoneError(validatePhone(value));
    }
    if (name === 'gender' && genderError) {
      setGenderError('');
    }
  };

  const handleFullNameBlur = () => {
    setFullNameError(validateFullName(formData.full_name));
  };

  const handlePhoneBlur = () => {
    setPhoneError(validatePhone(formData.phone));
  };

  // Xử lý khi người dùng nhập số ngày sinh (tự chèn dấu /, chỉ cho nhập số)
  const handleDobChange = (e) => {
    const formatted = formatDobInput(e.target.value);
    setFormData(prev => ({ ...prev, dob: formatted }));
    if (dobError) {
      setDobError(validateDob(formatted));
    }
  };

  const handleDobBlur = () => {
    setDobError(validateDob(formData.dob));
  };

  // Xử lý khi người dùng chọn ngày từ bảng lịch
  const handleCalendarDateChange = (e) => {
    const isoVal = e.target.value;
    if (isoVal) {
      const [y, m, d] = isoVal.split('-');
      const vnDate = `${d}/${m}/${y}`;
      setFormData(prev => ({ ...prev, dob: vnDate }));
      setDobError('');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra Họ và tên
    const nameErr = validateFullName(formData.full_name);
    if (nameErr) {
      setFullNameError(nameErr);
      setProfileAlert({ type: 'danger', message: nameErr });
      setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
      return;
    }
    setFullNameError('');

    // 2. Kiểm tra Số điện thoại
    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      setProfileAlert({ type: 'danger', message: phoneErr });
      setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
      return;
    }
    setPhoneError('');

    // 3. Kiểm tra Ngày sinh nhật
    const dobErr = validateDob(formData.dob);
    if (dobErr) {
      setDobError(dobErr);
      setProfileAlert({ type: 'danger', message: dobErr });
      setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
      return;
    }
    setDobError('');

    // 4. Kiểm tra Giới tính
    if (!formData.gender) {
      setGenderError('Vui lòng chọn giới tính');
      setProfileAlert({ type: 'danger', message: 'Vui lòng chọn giới tính' });
      setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
      return;
    }
    setGenderError('');

    const res = await updateUserProfile({
      full_name: formData.full_name.trim(),
      phone: formData.phone ? formData.phone.trim() : '',
      avatar_url: formData.avatar_url,
      gender: formData.gender,
      dob: formData.dob.trim(),
      address: {
        province: formData.province,
        district: formData.district,
        ward: formData.ward,
        detail: formData.detailAddress
      }
    });

    if (res?.success) {
      setProfileAlert({ type: 'success', message: res?.message || 'Đã cập nhật thông tin hồ sơ cá nhân thành công!' });
    } else {
      setProfileAlert({ type: 'danger', message: res?.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại!' });
    }
    setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
  };


  const handlePassChange = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassAlertType('danger');

    // 1. Validate Mật khẩu hiện tại không trống
    if (!passData.currentPass || !passData.currentPass.trim()) {
      setPassMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    // 2. Validate Mật khẩu mới >= 6 ký tự (giống hệt khi đăng ký)
    const nErr = validateNewPassword(passData.newPass);
    if (nErr) {
      setNewPassError(nErr);
      setPassMsg(nErr);
      return;
    }
    setNewPassError('');

    // 3. Validate Mật khẩu mới xác nhận trùng khớp
    const cErr = validateConfirmPassword(passData.confirmPass, passData.newPass);
    if (cErr) {
      setConfirmPassError(cErr);
      setPassMsg(cErr);
      return;
    }
    setConfirmPassError('');

    // 4. Validate Mật khẩu mới khác Mật khẩu hiện tại
    if (passData.currentPass === passData.newPass) {
      setPassMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    if (changePassword) {
      const res = await changePassword({
        current_password: passData.currentPass,
        new_password: passData.newPass,
        confirm_password: passData.confirmPass,
      });

      if (res?.success) {
        setPassAlertType('success');
        setPassMsg(res?.message || 'Đã đổi mật khẩu thành công và lưu vào CSDL!');
        setPassData({ currentPass: '', newPass: '', confirmPass: '' });
      } else {
        setPassAlertType('danger');
        setPassMsg(res?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại!');
      }
    } else {
      setPassAlertType('success');
      setPassMsg('Đã đổi mật khẩu thành công!');
      setPassData({ currentPass: '', newPass: '', confirmPass: '' });
    }

    setTimeout(() => setPassMsg(''), 5000);
  };

  const handleCopyVoucher = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  // Vouchers List kết nối tự động từ Kho Voucher của Quản lý
  const [vouchersList, setVouchersList] = useState(() => voucherService.getCustomerVouchers());

  useEffect(() => {
    voucherService.fetchVouchers().catch(() => { });
    const unsubscribe = voucherService.subscribe(() => {
      setVouchersList(voucherService.getCustomerVouchers());
    });
    return unsubscribe;
  }, []);

  // Helper Countdown timer component for 5-minute payment deadline
  const CountdownTimer = ({ deadline }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
      if (!deadline) return;
      const targetTime = new Date(deadline).getTime();

      const updateTimer = () => {
        const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
        setTimeLeft(diff);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }, [deadline]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    if (timeLeft <= 0) {
      return <span className="timer-expired">Hết thời hạn thanh toán</span>;
    }

    return (
      <span className="timer-active">
        <Clock size={14} /> Còn {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} để thanh toán
      </span>
    );
  };

  // Phân loại trạng thái đơn hàng theo nhóm
  const getOrderStatusCategory = (status, order = null) => {
    if (order) {
      const refSt = resolveOrderRefundStatus(order);
      if (refSt.isApproved || refSt.isRejected) return 'RETURNED';
    }

    const s = String(status || order?.order_status || order?.status || '').toUpperCase();
    const label = String(order?.status_label || '').toUpperCase();
    const noteStr = String(order?.note || '').toLowerCase();

    if (['RETURNED', 'REFUNDED', 'EXCHANGE', 'RETURN'].includes(s) ||
        label.includes('ĐỔI TRẢ') ||
        label.includes('TRẢ HÀNG') ||
        label.includes('HOÀN TIỀN') ||
        label.includes('TỪ CHỐI') ||
        label.includes('ĐÃ HOÀN') ||
        Boolean(order?.refund_reason) ||
        Boolean(order?.refund_bank) ||
        order?.refund_decision === 'APPROVED' ||
        order?.refund_decision === 'REJECTED' ||
        noteStr.includes('khách yêu cầu hoàn tiền') ||
        (noteStr.includes('stk:') && !noteStr.includes('khách hủy đơn:'))) {
      return 'RETURNED';
    }
    if (['CANCELLED', 'FAILED'].includes(s) || label.includes('HỦY')) {
      return 'CANCELLED';
    }
    if (['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(s) || label.includes('ĐÃ GIAO') || label.includes('GIAO THÀNH CÔNG')) {
      return 'COMPLETED';
    }
    if (['SHIPPING', 'DELIVERING', 'SHIPPED', 'IN_TRANSIT', 'PROCESSING', 'PREPARING'].includes(s) || label.includes('VẬN CHUYỂN') || label.includes('ĐANG GIAO')) {
      return 'SHIPPING';
    }
    if (['CONFIRMED'].includes(s) || label.includes('ĐÃ XÁC NHẬN')) {
      return 'CONFIRMED';
    }
    if (['PENDING', 'AWAITING_CONFIRMATION'].includes(s) || label.includes('CHỜ XÁC NHẬN')) {
      return 'PENDING';
    }
    return 'PENDING';
  };

  const orderCounts = {
    ALL: customerOrders.length,
    PENDING: customerOrders.filter(o => getOrderStatusCategory(o.status, o) === 'PENDING').length,
    CONFIRMED: customerOrders.filter(o => getOrderStatusCategory(o.status, o) === 'CONFIRMED').length,
    SHIPPING: customerOrders.filter(o => getOrderStatusCategory(o.status, o) === 'SHIPPING').length,
    COMPLETED: customerOrders.filter(o => getOrderStatusCategory(o.status, o) === 'COMPLETED').length,
    CANCELLED: customerOrders.filter(o => getOrderStatusCategory(o.status, o) === 'CANCELLED').length,
    RETURNED: customerOrders.filter(o => getOrderStatusCategory(o.status, o) === 'RETURNED').length,
  };

  // Chỉ tính những đơn hàng có trạng thái ĐÃ GIAO cho mục Tổng chi tiêu ở Profile
  const deliveredOrders = useMemo(() => {
    return customerOrders.filter((ord) => getOrderStatusCategory(ord.status, ord) === 'COMPLETED');
  }, [customerOrders]);

  const deliveredSpent = useMemo(() => {
    return deliveredOrders.reduce((sum, ord) => sum + Number(ord.total_amount || 0), 0);
  }, [deliveredOrders]);

  const formattedDeliveredSpent = useMemo(() => {
    if (deliveredSpent <= 0) return '0₫';
    if (deliveredSpent >= 1000000) {
      return `${(deliveredSpent / 1000000).toFixed(1).replace('.0', '')}tr`;
    }
    return `${deliveredSpent.toLocaleString('vi-VN')}₫`;
  }, [deliveredSpent]);

  const filteredOrders = customerOrders.filter(ord => {
    if (orderStatusFilter !== 'ALL' && getOrderStatusCategory(ord.status, ord) !== orderStatusFilter) {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      const codeMatch = String(ord.order_code || ord.order_number || ord.order_id).toLowerCase().includes(q);
      const itemMatch = (ord.items || []).some(i => String(i.name || i.product_name).toLowerCase().includes(q));
      return codeMatch || itemMatch;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const startIndex = (orderCurrentPage - 1) * ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

  const handleReorder = async (ord) => {
    if (!ord || !ord.items || ord.items.length === 0) return;
    for (const item of ord.items) {
      if (addToCart) {
        await addToCart({
          id: item.id || 1,
          title: item.name,
          price: item.price,
          image: item.image,
        }, item.size?.replace('Size ', '') || 'M', item.quantity || 1);
      }
    }
    setProfileAlert({
      type: 'success',
      message: `Đã thêm các sản phẩm từ đơn hàng #${ord.order_code || ord.order_id} vào giỏ hàng thành công!`
    });
    setTimeout(() => navigate('/cart'), 700);
  };

  const confirmCancelOrder = async (ord) => {
    if (!ord) return;
    setIsCancelling(true);
    try {
      const finalReason = cancelReason === 'Lý do khác' && customCancelReason.trim()
        ? customCancelReason.trim()
        : cancelReason;

      const orderDisplayCode = ord.order_code || ord.order_number || ord.order_id;
      const orderDigits = String(orderDisplayCode || ord.order_id || '').replace(/\D/g, '');
      const tId = String(ord.order_id || '').trim();
      const tNum = String(orderDisplayCode || '').trim();

      const isRealCustNote = (txt) => {
        if (!txt) return false;
        const low = String(txt).toLowerCase().trim();
        const cancelPhrases = [
          'hủy', 'hoàn tiền', 'stk:', 'đổi trả', 'đổi ý', 'không muốn mua nữa',
          'muốn thay đổi địa chỉ nhận hàng', 'muốn thay đổi địa chỉ', 'thay đổi địa chỉ',
          'muốn thay đổi sản phẩm', 'thủ tục thanh toán quá rắc rối', 'tìm thấy giá rẻ hơn',
          'đặt trùng đơn'
        ];
        return !cancelPhrases.some(p => low.includes(p));
      };
      const cleanDeliveryNote = isRealCustNote(ord.customer_delivery_note) ? ord.customer_delivery_note : (isRealCustNote(ord.note) ? ord.note : '');

      // 1. Cập nhật state customerOrders ngay lập tức
      const updatedOrders = customerOrders.map((o) => {
        const oId = String(o.order_id || '').trim();
        const oNum = String(o.order_code || o.order_number || '').trim();
        const oDigits = (oNum || oId).replace(/\D/g, '');
        const isMatch =
          (tId && (oId === tId || oNum === tId)) ||
          (tNum && (oId === tNum || oNum === tNum)) ||
          (orderDigits && oDigits && orderDigits === oDigits);
        if (isMatch) {
          return {
            ...o,
            status: 'CANCELLED',
            order_status: 'CANCELLED',
            status_label: 'ĐÃ HỦY',
            cancel_reason: finalReason,
            cancelled_by: 'CUSTOMER',
            stepper: null,
          };
        }
        return o;
      });

      setCustomerOrders(updatedOrders);

      // 2. Lưu đè vĩnh viễn vào yf_order_status_overrides để ĐẢM BẢO F5 hoặc API không làm mất trạng thái Đã hủy
      try {
        const rawOverrides = localStorage.getItem('yf_order_status_overrides');
        const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
        const overrideEntry = {
          status: 'CANCELLED',
          status_label: 'Đã hủy',
          status_label_manager: 'Đã hủy',
          status_label_customer: 'ĐÃ HỦY',
          cancel_reason: finalReason,
          cancelled_by: 'CUSTOMER',
          note: cleanDeliveryNote,
          cancel_note: `Khách hủy đơn: ${finalReason}`,
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
        }
        if (tId) overrides[tId] = overrideEntry;
        if (tNum) overrides[tNum] = overrideEntry;
        localStorage.setItem('yf_order_status_overrides', JSON.stringify(overrides));
      } catch (e) {}

      // 3. Lưu vào tất cả key yf_customer_orders* trong localStorage
      try {
        const userKey = user ? `yf_customer_orders_${user.customer_id || user.id || user.email}` : null;
        if (userKey) localStorage.setItem(userKey, JSON.stringify(updatedOrders));
        localStorage.setItem('yf_customer_orders', JSON.stringify(updatedOrders));

        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('yf_customer_orders_') && k !== userKey) {
            try {
              const rawK = localStorage.getItem(k);
              if (rawK) {
                const parsedK = JSON.parse(rawK);
                if (Array.isArray(parsedK)) {
                  const updatedK = parsedK.map(item => {
                    const iId = String(item.order_id || '').trim();
                    const iNum = String(item.order_code || item.order_number || '').trim();
                    const iDigits = (iNum || iId).replace(/\D/g, '');
                    if ((tId && (iId === tId || iNum === tId)) ||
                        (tNum && (iId === tNum || iNum === tNum)) ||
                        (orderDigits && iDigits && orderDigits === iDigits)) {
                      return { ...item, status: 'CANCELLED', order_status: 'CANCELLED', status_label: 'ĐÃ HỦY', cancel_reason: finalReason, cancelled_by: 'CUSTOMER' };
                    }
                    return item;
                  });
                  localStorage.setItem(k, JSON.stringify(updatedK));
                }
              }
            } catch (err) {}
          }
        }
      } catch (e) {}

      // 4. Cập nhật trực tiếp vào yf_manager_orders để trang quản lý nhận được ngay lập tức
      try {
        const mgrRaw = localStorage.getItem('yf_manager_orders');
        if (mgrRaw) {
          const mgrOrders = JSON.parse(mgrRaw);
          if (Array.isArray(mgrOrders)) {
            const updatedMgr = mgrOrders.map(m => {
              const mId = String(m.order_id || '').trim();
              const mNum = String(m.order_number || m.order_code || '').trim();
              const mDigits = (mNum || mId).replace(/\D/g, '');
              const isMatch =
                (tId && (mId === tId || mNum === tId)) ||
                (tNum && (mId === tNum || mNum === tNum)) ||
                (orderDigits && mDigits && orderDigits === mDigits);
              if (isMatch) {
                return {
                  ...m,
                  order_status: 'CANCELLED',
                  status: 'CANCELLED',
                  status_label: 'Đã hủy',
                  cancel_reason: finalReason,
                  cancelled_by: 'CUSTOMER',
                  note: cleanDeliveryNote,
                  cancel_note: `Khách hủy đơn: ${finalReason}`,
                };
              }
              return m;
            });
            localStorage.setItem('yf_manager_orders', JSON.stringify(updatedMgr));
          }
        }
      } catch (e) {}

      // 5. Phát sự kiện toàn cục & cross-tab để OrderManager cập nhật tức thì
      const statusPayload = {
        orderId: tId,
        orderNumber: tNum,
        orderDigits,
        digits: orderDigits,
        status: 'CANCELLED',
        statusLabel: 'Đã hủy',
        customerLabel: 'ĐÃ HỦY',
        reason: finalReason,
        cancel_reason: finalReason,
        cancelled_by: 'CUSTOMER',
        note: cleanDeliveryNote,
        cancel_note: `Khách hủy đơn: ${finalReason}`,
        timestamp: Date.now()
      };
      try {
        localStorage.setItem('yf_last_status_event', JSON.stringify(statusPayload));
      } catch (e) {}

      try {
        window.dispatchEvent(new CustomEvent('yf_order_status_changed', { detail: statusPayload }));
        window.dispatchEvent(new CustomEvent('order_status_updated', { detail: statusPayload }));
      } catch (e) {}

      try {
        const bc = new BroadcastChannel('yf_orders_sync_channel');
        bc.postMessage(statusPayload);
        bc.close();
      } catch (e) {}

      // 6. Gửi API backend cập nhật CSDL MySQL
      try {
        if (tId) orderService.cancelOrder(tId, finalReason).catch(() => {});
        if (tNum && tNum !== tId) orderService.cancelOrder(tNum, finalReason).catch(() => {});
        if (orderDigits && orderDigits !== tId && orderDigits !== tNum) orderService.cancelOrder(orderDigits, finalReason).catch(() => {});
        if (tId) orderService.updateOrderStatus(tId, 'CANCELLED').catch(() => {});
        if (orderDigits && orderDigits !== tId) orderService.updateOrderStatus(orderDigits, 'CANCELLED').catch(() => {});
      } catch (err) {
        console.warn('Cập nhật hủy đơn DB:', err?.message);
      }

      setOrderAlert({
        type: 'success',
        message: `Đã hủy thành công đơn hàng #${orderDisplayCode}!`,
      });
      setTimeout(() => setOrderAlert({ type: '', message: '' }), 4000);
    } catch (err) {
      console.error('Lỗi khi hủy đơn:', err);
    } finally {
      setIsCancelling(false);
      setCancelModalOrder(null);
    }
  };

  const confirmRefundOrder = async (ord) => {
    if (!ord) return;

    // Bắt buộc nhập thông tin tài khoản ngân hàng để nhận tiền hoàn
    const bankTrimmed = String(refundBankInfo || '').trim();
    if (!bankTrimmed) {
      setRefundBankError('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng (STK, Tên ngân hàng, Tên chủ thẻ)!');
      setOrderAlert({
        type: 'error',
        message: 'Bắt buộc nhập thông tin tài khoản ngân hàng (Số tài khoản, Tên ngân hàng, Chủ tài khoản) để nhận tiền hoàn!',
      });
      setTimeout(() => setOrderAlert({ type: '', message: '' }), 4000);
      return;
    }
    setRefundBankError('');
    setIsRefunding(true);
    try {
      const finalReason = refundReason === 'Lý do khác' && customRefundReason.trim()
        ? customRefundReason.trim()
        : refundReason;

    const orderDisplayCode = ord.order_code || ord.order_number || ord.order_id;
    const orderDigits = String(orderDisplayCode || ord.order_id || '').replace(/\D/g, '');
    const tId = String(ord.order_id || '').trim();
    const tNum = String(orderDisplayCode || '').trim();
    const refundNote = `Khách yêu cầu hoàn tiền: ${finalReason} | STK: ${bankTrimmed}`;

    // 1. Cập nhật state customerOrders ngay lập tức sang RETURNED (Đổi trả)
    const updatedOrders = customerOrders.map((o) => {
      const oId = String(o.order_id || '').trim();
      const oNum = String(o.order_code || o.order_number || '').trim();
      const oDigits = (oNum || oId).replace(/\D/g, '');
      const isMatch =
        (tId && (oId === tId || oNum === tId)) ||
        (tNum && (oId === tNum || oNum === tNum)) ||
        (orderDigits && oDigits && orderDigits === oDigits);
      if (isMatch) {
        return {
          ...o,
          status: 'RETURNED',
          order_status: 'RETURNED',
          status_label: 'ĐỔI TRẢ',
          refund_reason: finalReason,
          refund_bank: bankTrimmed,
          note: refundNote,
          stepper: null,
        };
      }
      return o;
    });

    setCustomerOrders(updatedOrders);

    // 2. Lưu vào localStorage & đồng bộ sang Manager
    try {
      const userKey = user ? `yf_customer_orders_${user.customer_id || user.id || user.email}` : null;
      if (userKey) localStorage.setItem(userKey, JSON.stringify(updatedOrders));
      localStorage.setItem('yf_customer_orders', JSON.stringify(updatedOrders));

      // Cập nhật tất cả key yf_customer_orders_*
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('yf_customer_orders_') && k !== userKey) {
          try {
            const rawK = localStorage.getItem(k);
            if (rawK) {
              const parsedK = JSON.parse(rawK);
              if (Array.isArray(parsedK)) {
                const updatedK = parsedK.map(item => {
                  const iId = String(item.order_id || '').trim();
                  const iNum = String(item.order_code || item.order_number || '').trim();
                  const iDigits = (iNum || iId).replace(/\D/g, '');
                  if ((tId && (iId === tId || iNum === tId)) ||
                      (tNum && (iId === tNum || iNum === tNum)) ||
                      (orderDigits && iDigits && orderDigits === iDigits)) {
                    return {
                      ...item,
                      status: 'RETURNED',
                      order_status: 'RETURNED',
                      status_label: 'ĐỔI TRẢ',
                      refund_reason: finalReason,
                      refund_bank: bankTrimmed,
                      note: refundNote
                    };
                  }
                  return item;
                });
                localStorage.setItem(k, JSON.stringify(updatedK));
              }
            }
          } catch (err) {}
        }
      }

      // Ghi đè trạng thái overrides vĩnh viễn
      const rawOverrides = localStorage.getItem('yf_order_status_overrides');
      const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
      const overrideEntry = {
        status: 'RETURNED',
        status_label: 'Đổi trả',
        status_label_manager: 'Đổi trả',
        status_label_customer: 'ĐỔI TRẢ',
        refund_reason: finalReason,
        refund_bank: bankTrimmed,
        note: refundNote,
        updated_at: Date.now()
      };
      if (orderDigits) {
        overrides[orderDigits] = overrideEntry;
        overrides[`YF-${orderDigits}`] = overrideEntry;
        overrides[`#YF-${orderDigits}`] = overrideEntry;
        overrides[`YF - ${orderDigits}`] = overrideEntry;
      }
      if (tId) overrides[tId] = overrideEntry;
      if (tNum) overrides[tNum] = overrideEntry;
      localStorage.setItem('yf_order_status_overrides', JSON.stringify(overrides));

      // Cập nhật yf_manager_orders để trang quản lý nhận được ngay lập tức
      const mgrRaw = localStorage.getItem('yf_manager_orders');
      if (mgrRaw) {
        const mgrOrders = JSON.parse(mgrRaw);
        if (Array.isArray(mgrOrders)) {
          const updatedMgr = mgrOrders.map(m => {
            const mId = String(m.order_id || '').trim();
            const mNum = String(m.order_number || m.order_code || '').trim();
            const mDigits = (mNum || mId).replace(/\D/g, '');
            const isMatch =
              (tId && (mId === tId || mNum === tId)) ||
              (tNum && (mId === tNum || mNum === tNum)) ||
              (orderDigits && mDigits && orderDigits === mDigits);
            if (isMatch) {
              return {
                ...m,
                order_status: 'RETURNED',
                status: 'RETURNED',
                status_label: 'Đổi trả',
                refund_reason: finalReason,
                refund_bank: bankTrimmed,
                note: refundNote,
              };
            }
            return m;
          });
          localStorage.setItem('yf_manager_orders', JSON.stringify(updatedMgr));
        }
      }

      // Phát event storage đa tab & BroadcastChannel
      const statusPayload = {
        orderId: tId,
        orderNumber: tNum,
        orderDigits: orderDigits,
        digits: orderDigits,
        orderCode: orderDisplayCode,
        status: 'RETURNED',
        statusLabel: 'Đổi trả',
        customerLabel: 'ĐỔI TRẢ',
        refund_bank: bankTrimmed,
        refund_reason: finalReason,
        reason: finalReason,
        note: refundNote,
        timestamp: Date.now()
      };
      localStorage.setItem('yf_last_status_event', JSON.stringify(statusPayload));
      window.dispatchEvent(new CustomEvent('yf_order_status_changed', { detail: statusPayload }));
      window.dispatchEvent(new CustomEvent('order_status_updated', { detail: statusPayload }));

      try {
        const bc = new BroadcastChannel('yf_orders_sync_channel');
        bc.postMessage(statusPayload);
        bc.close();
      } catch (e) {}
    } catch (e) {
      console.warn('Lỗi lưu localStorage khi hoàn tiền:', e);
    }

    // 3. Đồng bộ lên Backend MySQL CSDL
    try {
      if (orderService.updateOrderStatus) {
        if (tId) await orderService.updateOrderStatus(tId, 'RETURNED', refundNote).catch(() => {});
        if (tNum && tNum !== tId) await orderService.updateOrderStatus(tNum, 'RETURNED', refundNote).catch(() => {});
        if (orderDigits && orderDigits !== tId && orderDigits !== tNum) await orderService.updateOrderStatus(orderDigits, 'RETURNED', refundNote).catch(() => {});
      }
    } catch (err) {
      console.warn('Cập nhật hoàn tiền DB:', err?.message);
    }

      setOrderAlert({
        type: 'success',
        message: `Đã gửi yêu cầu hoàn tiền đơn hàng #${orderDisplayCode} thành công! Đơn hàng đã chuyển sang trạng thái "Đổi trả".`,
      });
      setTimeout(() => setOrderAlert({ type: '', message: '' }), 4500);
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu hoàn tiền:', err);
    } finally {
      setIsRefunding(false);
      setRefundModalOrder(null);
    }
  };

  // Mở modal theo dõi chi tiết với đầy đủ dữ liệu cập nhật mới nhất (đồng ý / từ chối hoàn)
  const handleOpenTrackingModal = (ord) => {
    if (!ord) return;
    const rawId = String(ord.order_id || '').trim();
    const rawCode = String(ord.order_code || ord.order_number || '').trim();
    const digits = (rawCode || rawId).replace(/\D/g, '');

    let refundReason = ord.refund_reason || '';
    let refundBank = ord.refund_bank || '';
    let refundDecision = (ord.refund_decision && ord.refund_decision !== 'PENDING') ? ord.refund_decision : '';
    let rejectReason = ord.reject_reason || '';
    let note = ord.note || '';

    // 1. Tìm kiếm trong yf_order_status_overrides với mọi biến thể mã
    try {
      const rawOv = localStorage.getItem('yf_order_status_overrides');
      if (rawOv) {
        const overrides = JSON.parse(rawOv);
        const ov = (digits && overrides[digits]) ||
                   (rawId && overrides[rawId]) ||
                   (rawCode && overrides[rawCode]) ||
                   (digits && overrides[`YF-${digits}`]) ||
                   (digits && overrides[`YF - ${digits}`]) ||
                   (digits && overrides[`#YF-${digits}`]) ||
                   (digits && overrides[`#${digits}`]);
        if (ov) {
          refundReason = refundReason || ov.refund_reason || '';
          refundBank = refundBank || ov.refund_bank || '';
          const ovL = String(ov.status_label_customer || ov.status_label || '').toUpperCase();
          const ovN = String(ov.note || '').toLowerCase();
          if (ov.refund_decision === 'APPROVED' || ovL.includes('ĐÃ HOÀN') || ovN.includes('đã xác nhận hoàn tiền') || ovN.includes('đã hoàn tiền')) {
            refundDecision = 'APPROVED';
          } else if (ov.refund_decision === 'REJECTED' || ovL.includes('TỪ CHỐI') || ovN.includes('từ chối hoàn')) {
            refundDecision = 'REJECTED';
          } else if (ov.refund_decision) {
            refundDecision = ov.refund_decision;
          }
          rejectReason = rejectReason || ov.reject_reason || '';
          note = ov.note || note || '';
        }
      }
    } catch (e) {}

    // 2. Tìm kiếm trong yf_manager_orders để lấy quyết định mới nhất từ Shop
    try {
      const rawMgr = localStorage.getItem('yf_manager_orders');
      if (rawMgr) {
        const mgrOrders = JSON.parse(rawMgr);
        if (Array.isArray(mgrOrders)) {
          const m = mgrOrders.find(item => {
            const mId = String(item.order_id || '').trim();
            const mNum = String(item.order_number || item.order_code || '').trim();
            const mDigits = (mNum || mId).replace(/\D/g, '');
            return (rawId && (mId === rawId || mNum === rawId)) ||
                   (rawCode && (mId === rawCode || mNum === rawCode)) ||
                   (digits && mDigits && digits === mDigits);
          });
          if (m) {
            refundReason = refundReason || m.refund_reason || '';
            refundBank = refundBank || m.refund_bank || '';
            const mL = String(m.status_label || '').toUpperCase();
            const mN = String(m.note || '').toLowerCase();
            if (m.refund_decision === 'APPROVED' || mL.includes('ĐÃ HOÀN') || mN.includes('đã xác nhận hoàn tiền') || mN.includes('đã hoàn tiền') || m.payment_status === 'REFUNDED') {
              refundDecision = 'APPROVED';
            } else if (m.refund_decision === 'REJECTED' || mL.includes('TỪ CHỐI') || mN.includes('từ chối hoàn')) {
              refundDecision = 'REJECTED';
            } else if (m.refund_decision) {
              refundDecision = m.refund_decision;
            }
            rejectReason = rejectReason || m.reject_reason || '';
            note = m.note || note || '';
          }
        }
      }
    } catch (e) {}

    // 3. Phân tích chi tiết từ chuỗi note
    if (note) {
      if (note.includes('Đã xác nhận hoàn tiền') || note.toLowerCase().includes('đã hoàn tiền') || ord.status_label === 'Đã hoàn tiền' || ord.status_label === 'ĐÃ HOÀN TIỀN') {
        refundDecision = 'APPROVED';
      } else if (note.includes('Từ chối hoàn tiền') || note.toLowerCase().includes('từ chối hoàn') || ord.status_label === 'Từ chối hoàn' || ord.status_label === 'TỪ CHỐI HOÀN TIỀN' || ord.status_label === 'TỪ CHỐI') {
        refundDecision = 'REJECTED';
      }
      if (!rejectReason && note.includes('Từ chối hoàn tiền:')) {
        rejectReason = note.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim();
      }
      if (!refundReason && note.includes('Lý do khách gửi:')) {
        refundReason = note.split('Lý do khách gửi:')[1]?.trim();
      } else if (!refundReason && note.includes('Lý do:')) {
        refundReason = note.split('Lý do:')[1]?.split('|')[0]?.trim();
      }
      if (note.includes('STK:')) {
        const parts = note.split('STK:');
        if (parts[1] && !refundBank) refundBank = parts[1].trim();
        if (parts[0] && !refundReason) {
          const rPart = parts[0].replace('Khách yêu cầu hoàn tiền:', '').replace('Đã xác nhận hoàn tiền:', '').replace('|', '').trim();
          if (rPart && !rPart.includes('₫') && !rPart.includes('đ')) refundReason = rPart;
        }
      }
    }

    const refStatus = resolveOrderRefundStatus(ord);
    const ordL = String(ord.status_label || '').toUpperCase();
    const ordN = String(note || ord.note || '').toLowerCase();
    const isActuallyRejected = refStatus.isRejected || refundDecision === 'REJECTED' || ord.refund_decision === 'REJECTED' || ordL.includes('TỪ CHỐI') || ordN.includes('từ chối hoàn tiền') || ordN.includes('từ chối hoàn');
    const isActuallyApproved = !isActuallyRejected && (refStatus.isApproved || refundDecision === 'APPROVED' || ord.refund_decision === 'APPROVED' || ordL.includes('ĐÃ HOÀN') || ordN.includes('đã xác nhận hoàn tiền') || ordN.includes('đã hoàn tiền') || ord.payment_status === 'REFUNDED');

    const finalDecision = isActuallyApproved ? 'APPROVED' : (isActuallyRejected ? 'REJECTED' : (refundDecision || 'PENDING'));
    const finalLabel = isActuallyApproved ? 'ĐÃ HOÀN TIỀN' : (isActuallyRejected ? 'TỪ CHỐI HOÀN' : (ord.status_label || 'ĐỔI TRẢ'));

    if (isActuallyRejected && !rejectReason) {
      rejectReason = refStatus.rejectReason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop';
    }

    // Tự động cập nhật đồng bộ đơn hàng trong customerOrders state
    if (isActuallyApproved) {
      setCustomerOrders(prev => prev.map(o => {
        const oId = String(o.order_id || '').trim();
        const oCode = String(o.order_code || o.order_number || '').trim();
        const oDigits = (oCode || oId).replace(/\D/g, '');
        if ((rawId && (oId === rawId || oCode === rawId)) ||
            (rawCode && (oId === rawCode || oCode === rawCode)) ||
            (digits && oDigits && digits === oDigits)) {
          return {
            ...o,
            status: 'RETURNED',
            order_status: 'RETURNED',
            status_label: 'ĐÃ HOÀN TIỀN',
            refund_decision: 'APPROVED',
            refund_bank: refundBank || o.refund_bank,
            refund_reason: refundReason || o.refund_reason,
            note: note || o.note,
          };
        }
        return o;
      }));
    }

    const cancelInfo = resolveCancelInfo(ord);

    setTrackingModalOrder({
      ...ord,
      status: (isActuallyApproved || isActuallyRejected || ord.status === 'RETURNED' || ord.order_status === 'RETURNED') ? 'RETURNED' : ord.status,
      order_status: (isActuallyApproved || isActuallyRejected || ord.status === 'RETURNED' || ord.order_status === 'RETURNED') ? 'RETURNED' : ord.order_status,
      status_label: finalLabel,
      refund_reason: refundReason,
      refund_bank: refundBank,
      refund_decision: finalDecision,
      reject_reason: isActuallyRejected ? (rejectReason || refStatus.rejectReason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop') : '',
      cancel_reason: cancelInfo.cancelReason,
      cancelled_by: cancelInfo.isShopCancelled ? 'SHOP' : (ord.cancelled_by || 'CUSTOMER'),
      note: note,
    });
  };

  return (
    <div className="profile-page-bg">
      <div className="container main-profile-wrapper" style={{ paddingTop: '28px' }}>
        {/* 2. Top Luxury Membership Header Banner */}
        <div className="profile-hero-banner">
          <div className="hero-banner-left">
            <div className="hero-avatar-box" title="Bấm để thay đổi ảnh đại diện">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleAvatarFileChange}
                style={{ display: 'none' }}
              />
              <img
                src={formData.avatar_url || DEFAULT_AVATAR}
                alt={user?.full_name || (isManagerOrAdmin ? 'Quản Lý Youth Fashion' : 'Khách hàng Youth Fashion')}
                className="hero-avatar-img"
                onClick={() => fileInputRef.current?.click()}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_AVATAR;
                }}
              />
              <button
                type="button"
                className="avatar-change-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Thay đổi ảnh đại diện"
              >
                <Camera size={13} />
              </button>
            </div>

            <div className="hero-info-content">
              <div className="hero-subtitle">
                <span className="gold-text-hero">THÀNH VIÊN TỪ NGÀY</span> <span className="dot">•</span> {formatRegistrationDate(user?.created_at || user?.createdAt)}
              </div>
              <h1 className="hero-user-name font-serif">{user?.full_name || (isManagerOrAdmin ? 'Quản Lý Youth Fashion' : 'Khách hàng Youth Fashion')}</h1>
              <div className="hero-tier-pill">
                <span>{user?.tier || 'Member'}</span>
              </div>
            </div>
          </div>

          <div className="hero-banner-right">
            <div className="stats-box">
              <div className="stat-col">
                <span className="stat-label">TỔNG CHI TIÊU</span>
                <span className="stat-value">
                  {deliveredOrders.length > 0 ? formattedDeliveredSpent : '0₫'}
                </span>
                <span className="stat-sub gold-sub">
                  {deliveredOrders.length > 0
                    ? `Chốt chẵn ${String(deliveredOrders.length).padStart(2, '0')} đơn đã giao`
                    : 'Chưa có đơn đã giao'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Content Grid (Sidebar + Right Content) */}
        <div className="profile-content-grid">
          {/* Left Sidebar */}
          <aside className="profile-sidebar-card">
            <h4 className="sidebar-header-title">TRUNG TÂM QUẢN TRỊ KHÁCH HÀNG</h4>

            <div className="sidebar-nav-list">
              {/* Menu Item 1: Hồ Sơ Cá Nhân */}
              <button
                className={`nav-item-btn ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <div className="nav-item-left">
                  <User size={18} />
                  <span>HỒ SƠ CÁ NHÂN</span>
                </div>
              </button>

              {/* Menu Item 2: Lịch Sử Đơn Hàng */}
              <button
                className={`nav-item-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <div className="nav-item-left">
                  <Package size={18} />
                  <span>LỊCH SỬ ĐƠN HÀNG</span>
                </div>
                <span className="nav-badge-pill grey-badge">
                  {customerOrders.length > 0 ? String(orderCounts.ALL).padStart(2, '0') : '0'}
                </span>
              </button>

              {/* Menu Item 3: Voucher & Mã Ưu Đãi */}
              <button
                className={`nav-item-btn ${activeTab === 'vouchers' ? 'active' : ''}`}
                onClick={() => setActiveTab('vouchers')}
              >
                <div className="nav-item-left">
                  <Tag size={18} />
                  <span>VOUCHER & MÃ ƯU ĐÃI</span>
                </div>
                <span className="nav-badge-pill gold-badge">{vouchersList.length} MÃ</span>
              </button>

              {/* Menu Item 4: Đổi Mật Khẩu */}
              <button
                className={`nav-item-btn ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                <div className="nav-item-left">
                  <Lock size={18} />
                  <span>ĐỔI MẬT KHẨU</span>
                </div>
              </button>

              {/* Menu Item: Bảng Quản Lý (Đối với tài khoản manager hoặc admin) */}
              {isManagerOrAdmin && (
                <button
                  className="nav-item-btn manager-nav-btn"
                  onClick={() => navigate('/manager')}
                >
                  <div className="nav-item-left">
                    <LayoutDashboard size={18} />
                    <span>BẢNG QUẢN LÝ</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              )}

              {/* Menu Item 5: Đăng Xuất */}
              <button
                className="nav-item-btn logout-item-btn"
                onClick={handleLogout}
              >
                <div className="nav-item-left text-danger">
                  <LogOut size={18} />
                  <span>ĐĂNG XUẤT</span>
                </div>
              </button>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="profile-main-card">
            {/* TAB 1: Thông Tin Cá Nhân */}
            {activeTab === 'info' && (
              <div className="content-inner animate-fade-in">
                <div className="content-title-header">
                  <h2 className="content-main-heading font-serif">Thông Tin Cá Nhân</h2>
                  <p className="content-sub-heading">Cập nhật hồ sơ định danh và thông tin liên hệ bảo mật</p>
                </div>

                {profileAlert.message && (
                  <div className={`profile-alert alert-${profileAlert.type}`}>
                    {profileAlert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{profileAlert.message}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="profile-form">
                  <div className="form-fields-2col">
                    {/* Họ Và Tên */}
                    <div className="field-group">
                      <label className="field-label">
                        HỌ VÀ TÊN <span className="field-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        className={`custom-input ${fullNameError ? 'input-error' : ''}`}
                        value={formData.full_name}
                        onChange={handleInputChange}
                        onBlur={handleFullNameBlur}
                        placeholder="Nhập họ và tên của bạn"
                        required
                      />
                      {fullNameError && (
                        <div className="field-error-msg">
                          <AlertCircle size={14} />
                          <span>{fullNameError}</span>
                        </div>
                      )}
                    </div>

                    {/* Địa Chỉ Email */}
                    <div className="field-group">
                      <label className="field-label">
                        ĐỊA CHỈ EMAIL <span className="field-required">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="custom-input input-disabled"
                        value={formData.email}
                        readOnly
                        disabled
                      />
                    </div>

                    {/* Số Điện Thoại Di Động */}
                    <div className="field-group">
                      <label className="field-label">
                        SỐ ĐIỆN THOẠI DI ĐỘNG <span className="field-required">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        className={`custom-input ${phoneError ? 'input-error' : ''}`}
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={handlePhoneBlur}
                        placeholder="VD: 0908 123 456"
                        required
                      />
                      {phoneError && (
                        <div className="field-error-msg">
                          <AlertCircle size={14} />
                          <span>{phoneError}</span>
                        </div>
                      )}
                    </div>

                    {/* Ngày Sinh Nhật */}
                    <div className="field-group">
                      <label className="field-label">
                        NGÀY SINH NHẬT <span className="field-required">*</span>
                      </label>
                      <div className="dob-picker-group">
                        <input
                          type="text"
                          name="dob"
                          className={`custom-input dob-text-input ${dobError ? 'input-error' : ''}`}
                          value={formData.dob}
                          onChange={handleDobChange}
                          onBlur={handleDobBlur}
                          placeholder="DD/MM/YYYY"
                          maxLength={10}
                          inputMode="numeric"
                          required
                        />
                        <button
                          type="button"
                          className="dob-calendar-btn"
                          onClick={() => hiddenDateRef.current?.showPicker ? hiddenDateRef.current.showPicker() : hiddenDateRef.current?.click()}
                          title="Mở lịch chọn ngày"
                        >
                          <Calendar size={18} />
                        </button>
                        <input
                          ref={hiddenDateRef}
                          type="date"
                          tabIndex={-1}
                          aria-hidden="true"
                          className="dob-hidden-native-input"
                          value={convertVnDateToIso(formData.dob)}
                          onChange={handleCalendarDateChange}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      {dobError && (
                        <div className="field-error-msg">
                          <AlertCircle size={14} />
                          <span>{dobError}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Giới Tính */}
                  <div className="field-group full-width-group">
                    <label className="field-label">
                      GIỚI TÍNH <span className="field-required">*</span>
                    </label>
                    <div className="gender-radio-options">
                      {['Nữ', 'Nam', 'Khác / Không tiết lộ'].map((g) => (
                        <label key={g} className="custom-radio-label">
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={formData.gender === g}
                            onChange={handleInputChange}
                            className="custom-radio-input"
                          />
                          <span className="radio-text">{g}</span>
                        </label>
                      ))}
                    </div>
                    {genderError && (
                      <div className="field-error-msg">
                        <AlertCircle size={14} />
                        <span>{genderError}</span>
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="form-submit-row">
                    <button type="submit" className="save-profile-btn">
                      LƯU THAY ĐỔI HỒ SƠ
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: Lịch Sử Đơn Hàng */}
            {activeTab === 'orders' && (
              <div className="content-inner animate-fade-in">
                {reviewSubmittedAlert && (
                  <div className="profile-alert alert-success animate-fade-in" style={{ marginBottom: 16 }}>
                    <CheckCircle size={16} /> {reviewSubmittedAlert}
                  </div>
                )}

                {orderAlert.message && (
                  <div className={`profile-alert alert-${orderAlert.type} animate-fade-in`} style={{ marginBottom: 16 }}>
                    {orderAlert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{orderAlert.message}</span>
                  </div>
                )}

                {/* Header Tiêu đề & Ô tìm kiếm */}
                <div className="orders-header-row">
                  <div className="orders-header-text">
                    <h2 className="content-main-heading font-serif">Lịch Sử Đơn Hàng</h2>
                    <p className="content-sub-heading">Theo dõi đơn đặt hàng thủ công, hành trình dịch chuyển & lịch sử tích điểm đổi quà.</p>
                  </div>

                  <div className="orders-search-box">
                    <Search size={15} className="search-box-icon" />
                    <input
                      type="text"
                      placeholder="Tìm mã đơn, tên sản phẩm..."
                      value={orderSearchQuery}
                      onChange={(e) => {
                        setOrderSearchQuery(e.target.value);
                        setOrderCurrentPage(1);
                      }}
                      className="orders-search-input"
                    />
                    {orderSearchQuery && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        onClick={() => {
                          setOrderSearchQuery('');
                          setOrderCurrentPage(1);
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter Tabs chuẩn mẫu Haute Couture */}
                <div className="status-filter-tabs">
                  {[
                    { key: 'ALL', label: `Tất cả (${String(orderCounts.ALL).padStart(2, '0')})`, type: 'all' },
                    { key: 'PENDING', label: `Chờ xác nhận (${String(orderCounts.PENDING).padStart(2, '0')})`, type: 'pending' },
                    { key: 'CONFIRMED', label: `Đã xác nhận (${String(orderCounts.CONFIRMED).padStart(2, '0')})`, type: 'confirmed' },
                    { key: 'SHIPPING', label: `Đang vận chuyển (${String(orderCounts.SHIPPING).padStart(2, '0')})`, type: 'shipping' },
                    { key: 'COMPLETED', label: `Đã giao (${String(orderCounts.COMPLETED).padStart(2, '0')})`, type: 'completed' },
                    { key: 'CANCELLED', label: `Đã hủy (${String(orderCounts.CANCELLED).padStart(2, '0')})`, type: 'cancelled' },
                    { key: 'RETURNED', label: `Đổi trả (${String(orderCounts.RETURNED).padStart(2, '0')})`, type: 'returned' }
                  ].map(st => (
                    <button
                      key={st.key}
                      className={`status-tab tab-${st.type} ${orderStatusFilter === st.key ? 'active' : ''}`}
                      onClick={() => {
                        setOrderStatusFilter(st.key);
                        setOrderCurrentPage(1);
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Danh sách các đơn hàng */}
                <div className="orders-list">
                  {filteredOrders.length === 0 ? (
                    <div className="empty-state-card animate-fade-in">
                      <div className="empty-state-icon-wrapper">
                        <Package size={40} strokeWidth={1.5} className="empty-box-icon" />
                      </div>
                      <h3 className="empty-state-title font-serif">Chưa Có Đơn Hàng Nào</h3>
                      <p className="empty-state-desc">
                        {orderSearchQuery
                          ? `Không tìm thấy đơn hàng nào khớp với từ khóa "${orderSearchQuery}".`
                          : (orderStatusFilter === 'ALL'
                            ? 'Lịch sử mua sắm của bạn hiện đang trống. Hãy khám phá ngay các bộ sưu tập thời trang may đo thủ công mới nhất để tìm cho mình phong cách đẳng cấp.'
                            : 'Hiện không có đơn hàng nào thuộc trạng thái này.')}
                      </p>
                      <Link to="/" className="btn-empty-shop">
                        <span>KHÁM PHÁ BỘ SƯU TẬP</span>
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  ) : (
                    currentOrders.map(ord => {
                      const statusCat = getOrderStatusCategory(ord.status, ord);
                      return (
                        <div key={ord.order_id} className="order-item-card animate-fade-in">
                          {/* Header Bar */}
                          <div className="order-card-header">
                            <div className="order-header-meta">
                              <span className="order-code">#{ord.order_code || ord.order_number || ord.order_id}</span>
                              <span className="meta-sep">|</span>
                              <span className="order-date">Ngày đặt: {ord.created_at}</span>
                              {ord.payment_method && (
                                <>
                                  <span className="meta-sep">|</span>
                                  <span className="order-method">
                                    {(ord.payment_method === 'COD' || ord.payment_method === 'Tiền mặt khi nhận hàng (COD)') && (statusCat === 'COMPLETED' || statusCat === 'RETURNED')
                                      ? 'COD - Đã thanh toán'
                                      : ord.payment_method}
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="order-status-badge">
                              {statusCat === 'COMPLETED' ? (
                                <span className="status-badge-pill badge-completed">
                                  <Check size={14} strokeWidth={2.5} /> {ord.status_label ? ord.status_label.replace('GIAO THÀNH CÔNG', 'ĐÃ GIAO') : (ord.delivered_date ? `ĐÃ GIAO (${ord.delivered_date})` : 'ĐÃ GIAO')}
                                </span>
                              ) : statusCat === 'RETURNED' ? (
                                (() => {
                                  const { isApproved, isRejected } = resolveOrderRefundStatus(ord);
                                  const ordL = String(ord.status_label || '').toUpperCase();
                                  const ordN = String(ord.note || '').toLowerCase();
                                  const isActuallyApproved = isApproved || ord.refund_decision === 'APPROVED' || ordL.includes('ĐÃ HOÀN') || ordN.includes('đã xác nhận hoàn tiền') || ordN.includes('đã hoàn tiền');
                                  const isActuallyRejected = !isActuallyApproved && (isRejected || ord.refund_decision === 'REJECTED' || ordL.includes('TỪ CHỐI') || ordN.includes('từ chối hoàn tiền') || ordN.includes('từ chối hoàn'));

                                  if (isActuallyApproved) {
                                    return (
                                      <span className="status-badge-pill badge-completed" style={{ background: '#DCFCE7', color: '#15803D', border: '1.5px solid #BBF7D0' }}>
                                        <Check size={14} strokeWidth={2.5} /> ĐÃ HOÀN TIỀN
                                      </span>
                                    );
                                  }
                                  if (isActuallyRejected) {
                                    return (
                                      <span className="status-badge-pill badge-cancelled" style={{ background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA', fontWeight: 700 }}>
                                        <X size={14} strokeWidth={2.5} /> TỪ CHỐI HOÀN
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="status-badge-pill badge-returned">
                                      <RefreshCw size={14} /> {ord.status_label || 'ĐỔI TRẢ'}
                                    </span>
                                  );
                                })()
                              ) : statusCat === 'CANCELLED' ? (
                                <span className="status-badge-pill badge-cancelled">
                                  <X size={14} strokeWidth={2.5} /> {ord.status_label || 'ĐÃ HỦY'}
                                </span>
                              ) : (ord.delivery_status === 'FAILED_RETRY' || String(ord.status_label || '').toUpperCase().includes('GIAO THẤT BẠI') || String(ord.status_label || '').toUpperCase().includes('HẸN GIAO LẠI')) ? (
                                <span className="status-badge-pill" style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', fontWeight: 700 }}>
                                  <Clock size={14} /> {ord.status_label || 'GIAO THẤT BẠI - HẸN GIAO LẠI'}
                                </span>
                              ) : (statusCat === 'SHIPPING' || ord.status === 'SHIPPING' || ord.status_label === 'ĐANG GIAO HÀNG HỎA TỐC' || ord.status_label === 'ĐANG VẬN CHUYỂN') ? (
                                <span className="status-badge-pill badge-shipping">
                                  <Truck size={14} /> {ord.status_label === 'CHỜ GIAO HÀNG' ? 'ĐANG VẬN CHUYỂN' : (ord.status_label || 'ĐANG VẬN CHUYỂN')}
                                </span>
                              ) : statusCat === 'CONFIRMED' ? (
                                <span className="status-badge-pill badge-confirmed">
                                  <CheckCircle size={14} /> {ord.status_label || 'ĐÃ XÁC NHẬN'}
                                </span>
                              ) : (
                                <span className="status-badge-pill badge-delivering badge-processing badge-pending">
                                  <Clock size={14} /> {(!ord.status_label || ord.status_label === 'CHỜ GIAO HÀNG' || ord.status_label === 'ĐANG XỬ LÝ') ? 'CHỜ XÁC NHẬN' : ord.status_label}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="order-items-wrapper">
                            {ord.items.map((item, idx) => {
                              const itemImg = resolveOrderItemImage(item);
                              return (
                                <div key={item.id || idx} className="order-product-row">
                                  <img
                                    src={itemImg}
                                    alt={item.name}
                                    className="item-thumb"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = resolveOrderItemImage(item);
                                    }}
                                  />
                                  <div className="item-details">
                                    {item.collection_tag && (
                                      <span className="item-collection-tag">{item.collection_tag}</span>
                                    )}
                                    <h4 className="item-title font-serif">{item.name}</h4>
                                    <div className="item-specs-row">
                                      <span>Kích thước: {item.size}</span>
                                      <span className="specs-dot">•</span>
                                      <span>Màu sắc: {item.color}</span>
                                      {item.quantity && (
                                        <>
                                          <span className="specs-dot">•</span>
                                          <span>Số lượng: {String(item.quantity).padStart(2, '0')}</span>
                                        </>
                                      )}
                                    </div>
                                    {item.service_note && (
                                      <div className="item-service-note">{item.service_note}</div>
                                    )}
                                    {item.warranty_tag && (
                                      <div className="item-warranty-badge">{item.warranty_tag}</div>
                                    )}
                                  </div>

                                  <div className="item-price-col">
                                    <span className="item-current-price">{(item.price * (item.quantity || 1)).toLocaleString('vi-VN')}₫</span>
                                    {item.discount_text && (
                                      <span className="item-discount-text">{item.discount_text}</span>
                                    )}
                                    {item.original_price && (
                                      <span className="item-original-price">{(item.original_price).toLocaleString('vi-VN')}₫</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Khối cảnh báo nếu Shop đã từ chối hoàn tiền */}
                          {statusCat === 'RETURNED' && (() => {
                            const { isRejected, rejectReason } = resolveOrderRefundStatus(ord);
                            const ordL = String(ord.status_label || '').toUpperCase();
                            const ordN = String(ord.note || '');
                            const isActuallyRejected = isRejected || ord.refund_decision === 'REJECTED' || ordL.includes('TỪ CHỐI') || ordN.toLowerCase().includes('từ chối hoàn tiền');
                            if (!isActuallyRejected) return null;
                            const finalReason = rejectReason || ord.reject_reason || (ordN.includes('Từ chối hoàn tiền:') ? ordN.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim() : 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop');
                            return (
                              <div style={{
                                margin: '0 0 12px',
                                padding: '10px 14px',
                                background: '#FEF2F2',
                                border: '1.5px solid #FECACA',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                color: '#991B1B',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}>
                                <AlertCircle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
                                <div>
                                  <strong style={{ color: '#B91C1C' }}>Shop đã từ chối yêu cầu hoàn tiền:</strong>{' '}
                                  <span style={{ color: '#1C1917', fontWeight: 600 }}>
                                    "{finalReason}"
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Khối thông báo nếu Shop đã đồng ý & hoàn tiền thành công */}
                          {statusCat === 'RETURNED' && (() => {
                            const { isApproved } = resolveOrderRefundStatus(ord);
                            const ordL = String(ord.status_label || '').toUpperCase();
                            const ordN = String(ord.note || '').toLowerCase();
                            const isActuallyApproved = isApproved || ord.refund_decision === 'APPROVED' || ordL.includes('ĐÃ HOÀN') || ordN.includes('đã xác nhận hoàn tiền') || ordN.includes('đã hoàn tiền') || ord.payment_status === 'REFUNDED';
                            if (!isActuallyApproved) return null;
                            const bankInfo = ord.refund_bank || (ord.note && ord.note.includes('STK:') ? ord.note.split('STK:')[1]?.trim() : '');
                            const refundAmt = Number(ord.total_amount || 0).toLocaleString('vi-VN');
                            return (
                              <div style={{
                                margin: '0 0 12px',
                                padding: '10px 14px',
                                background: '#F0FDF4',
                                border: '1.5px solid #BBF7D0',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                color: '#15803D',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}>
                                <CheckCircle size={15} style={{ color: '#16A34A', flexShrink: 0 }} />
                                <div>
                                  <strong style={{ color: '#15803D' }}>Shop đã xác nhận hoàn tiền thành công:</strong>{' '}
                                  <span style={{ color: '#166534', fontWeight: 600 }}>
                                    Đã hoàn trả {refundAmt}₫ {bankInfo ? `về tài khoản ngân hàng (${bankInfo})` : ''}. Quý khách vui lòng kiểm tra biến động số dư.
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Khối cảnh báo lý do hủy đơn (phân biệt Shop hủy vs Khách hủy) */}
                          {statusCat === 'CANCELLED' && (() => {
                            const { isShopCancelled, cancelReason } = resolveCancelInfo(ord);
                            return (
                              <div style={{
                                margin: '0 0 12px',
                                padding: '10px 14px',
                                background: isShopCancelled ? '#FEF2F2' : '#F9FAFB',
                                border: isShopCancelled ? '1.5px solid #FECACA' : '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                color: isShopCancelled ? '#991B1B' : '#4B5563',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}>
                                {isShopCancelled ? (
                                  <AlertCircle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
                                ) : (
                                  <X size={15} style={{ color: '#6B7280', flexShrink: 0 }} />
                                )}
                                <div>
                                  <strong style={{ color: isShopCancelled ? '#DC2626' : '#374151' }}>
                                    {isShopCancelled ? 'Shop đã hủy đơn hàng này:' : 'Đơn hàng đã được hủy theo yêu cầu của bạn:'}
                                  </strong>{' '}
                                  <span style={{ color: '#1F2937', fontWeight: 600 }}>
                                    "{cancelReason}"
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Khối cảnh báo nếu giao hàng thất bại / hẹn giao lại */}
                          {(ord.delivery_status === 'FAILED_RETRY' || ord.delivery_status === 'FAILED_RETURN' || (ord.delivery_fail_reason && statusCat !== 'COMPLETED')) && (
                            <div style={{
                              margin: '0 0 12px',
                              padding: '12px 14px',
                              background: '#FFFBEB',
                              border: '1.5px solid #FDE68A',
                              borderRadius: '8px',
                              fontSize: '12.5px',
                              color: '#92400E',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}>
                              <AlertCircle size={16} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
                              <div style={{ flex: 1, lineHeight: '1.5' }}>
                                <div>
                                  <strong style={{ color: '#B45309' }}>Cập nhật giao hàng:</strong>{' '}
                                  <span>Giao hàng chưa thành công{ord.delivery_attempts ? ` (Lần ${ord.delivery_attempts})` : ''}.</span>
                                </div>
                                {ord.delivery_fail_reason && (
                                  <div style={{ marginTop: '2px', color: '#78350F' }}>
                                    Lý do shipper báo: <strong>"{ord.delivery_fail_reason}"</strong>
                                  </div>
                                )}
                                {ord.retry_date ? (
                                  <div style={{ marginTop: '4px', fontWeight: 600, color: '#B45309' }}>
                                    Hệ thống đã lên lịch giao lại vào ngày: <span style={{ textDecoration: 'underline' }}>{new Date(ord.retry_date).toLocaleDateString('vi-VN')}</span>. Vui lòng chú ý điện thoại để nhận hàng.
                                  </div>
                                ) : (ord.delivery_status === 'FAILED_RETURN' || statusCat === 'CANCELLED') ? (
                                  <div style={{ marginTop: '4px', color: '#B91C1C', fontWeight: 600 }}>
                                    Đơn hàng đã được chuyển hoàn về kho do giao không thành công nhiều lần hoặc theo yêu cầu.
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          )}

                          {/* Footer & Action Buttons */}
                          <div className="order-card-footer">
                            <div className="order-total-group">
                              {ord.items.length > 1 ? (
                                <>
                                  <span className="total-lbl">Tổng đơn hàng ({ord.items.length} sản phẩm): </span>
                                  <span className="total-price-text">{ord.total_amount.toLocaleString('vi-VN')}₫</span>
                                </>
                              ) : (
                                <>
                                  <span className="total-lbl">Tổng giá trị thanh toán: </span>
                                  <span className="total-price-text">{ord.total_amount.toLocaleString('vi-VN')}₫</span>
                                </>
                              )}
                            </div>

                            <div className="order-actions-group">
                              {(statusCat === 'PENDING' || statusCat === 'CONFIRMED') && (
                                <>
                                  <button
                                    type="button"
                                    className="btn-order-action btn-dark-outline"
                                    onClick={() => {
                                      setCancelReason('Đổi ý, không muốn mua nữa');
                                      setCustomCancelReason('');
                                      setCancelModalOrder(ord);
                                    }}
                                  >
                                    HỦY ĐƠN
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-order-action btn-black-solid"
                                    onClick={() => handleOpenTrackingModal(ord)}
                                  >
                                    THEO DÕI HÀNH TRÌNH CHI TIẾT
                                  </button>
                                </>
                              )}

                              {(statusCat === 'SHIPPING' || statusCat === 'DELIVERING') && (
                                <>
                                  <button
                                    type="button"
                                    className="btn-order-action btn-black-solid"
                                    onClick={() => handleOpenTrackingModal(ord)}
                                  >
                                    THEO DÕI HÀNH TRÌNH CHI TIẾT
                                  </button>
                                </>
                              )}

                              {statusCat === 'COMPLETED' && (
                                <>
                                  <button
                                    className="btn-order-action btn-neutral-outline"
                                    onClick={() => handleOpenTrackingModal(ord)}
                                  >
                                    Xem Hành Trình
                                  </button>
                                  {isOrderReviewed(ord) ? (
                                    <button
                                      className="btn-order-action btn-gold-outline"
                                      onClick={() => {
                                        const firstItem = ord.items?.[0] || {};
                                        const prodId = firstItem.product_id || firstItem.id || 'YF-COAT-CAMEL-01';
                                        navigate(`/product/${prodId}#customer-reviews`);
                                      }}
                                      title="Xem đánh giá thực tế của bạn trên trang chi tiết sản phẩm"
                                    >
                                      ★ Đã Đánh Giá (Xem Feedback)
                                    </button>
                                  ) : (
                                    <button
                                      className="btn-order-action btn-gold-outline"
                                      onClick={() => setReviewModalOrder(ord)}
                                    >
                                      ★ Viết Đánh Giá
                                    </button>
                                  )}
                                  <button
                                    className="btn-order-action btn-neutral-outline"
                                    onClick={() => {
                                      setRefundReason('Sản phẩm không vừa kích cỡ (Size)');
                                      setCustomRefundReason('');
                                      setRefundBankInfo('');
                                      setRefundBankError('');
                                      setRefundModalOrder(ord);
                                    }}
                                  >
                                    Yêu Cầu Hoàn Tiền
                                  </button>
                                  <button
                                    className="btn-order-action btn-dark-outline"
                                    onClick={() => handleReorder(ord)}
                                  >
                                    {ord.items.length > 1 ? 'MUA LẠI ĐƠN NÀY' : 'MUA LẠI'}
                                  </button>
                                </>
                              )}

                              {(statusCat === 'CANCELLED' || statusCat === 'RETURNED') && (
                                <>
                                  <button
                                    className="btn-order-action btn-neutral-outline"
                                    onClick={() => handleOpenTrackingModal(ord)}
                                  >
                                    {statusCat === 'RETURNED'
                                      ? (() => {
                                          const { isApproved, isRejected } = resolveOrderRefundStatus(ord);
                                          const ordL = String(ord.status_label || '').toUpperCase();
                                          const ordN = String(ord.note || '').toLowerCase();
                                          const app = isApproved || ord.refund_decision === 'APPROVED' || ordL.includes('ĐÃ HOÀN') || ordN.includes('đã xác nhận hoàn tiền') || ordN.includes('đã hoàn tiền');
                                          const rej = !app && (isRejected || ord.refund_decision === 'REJECTED' || ordL.includes('TỪ CHỐI') || ordN.includes('từ chối hoàn tiền') || ordN.includes('từ chối hoàn'));
                                          if (app) return 'Chi Tiết Hoàn Tiền';
                                          if (rej) return 'Chi Tiết Từ Chối';
                                          return 'Chi Tiết Đổi Trả';
                                        })()
                                      : 'Chi Tiết Hủy Đơn'}
                                  </button>
                                  <button
                                    className="btn-order-action btn-dark-outline"
                                    onClick={() => handleReorder(ord)}
                                  >
                                    MUA LẠI ĐƠN NÀY
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Phân trang đơn hàng */}
                {filteredOrders.length > 0 && (
                  <div className="orders-pagination-row">
                    <div className="pagination-info">
                      Hiển thị {startIndex + 1} - {Math.min(startIndex + ordersPerPage, filteredOrders.length)} trong tổng số {filteredOrders.length > 0 ? String(filteredOrders.length).padStart(2, '0') : '0'} đơn hàng
                    </div>

                    {totalPages > 1 && (
                      <div className="pagination-controls">
                        <button
                          className="pagination-btn pagination-nav-btn"
                          disabled={orderCurrentPage === 1}
                          onClick={() => setOrderCurrentPage(p => Math.max(1, p - 1))}
                        >
                          &lt; Trang trước
                        </button>

                        {Array.from({ length: totalPages }).map((_, pIdx) => {
                          const pageNum = pIdx + 1;
                          return (
                            <button
                              key={pageNum}
                              className={`pagination-btn pagination-num-btn ${orderCurrentPage === pageNum ? 'active' : ''}`}
                              onClick={() => setOrderCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          className="pagination-btn pagination-nav-btn"
                          disabled={orderCurrentPage === totalPages}
                          onClick={() => setOrderCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                          Trang sau &gt;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Voucher & Mã Ưu Đãi */}
            {activeTab === 'vouchers' && (
              <div className="content-inner animate-fade-in">
                <div className="content-title-header">
                  <h2 className="content-main-heading font-serif">Voucher & Mã Ưu Đãi VIP</h2>
                  <p className="content-sub-heading">Danh sách mã quà tặng & đặc quyền chiết khấu của riêng bạn.</p>
                </div>

                {copiedCode && (
                  <div className="profile-alert alert-success">
                    <CheckCircle size={16} /> Đã sao chép mã voucher <strong>{copiedCode}</strong> vào bộ nhớ tạm!
                  </div>
                )}

                {vouchersList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', background: '#F9F8F6', borderRadius: 12, border: '1px dashed #E2DFD7' }}>
                    <Tag size={36} color="#A8A29E" style={{ marginBottom: 12 }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1C1917', margin: '0 0 6px' }}>Hiện chưa có mã ưu đãi</h3>
                    <p style={{ fontSize: 13, color: '#78716C', margin: 0 }}>Các chương trình khuyến mãi và quà tặng mới nhất sẽ được cập nhật tại đây.</p>
                  </div>
                ) : (
                  <div className="vouchers-grid">
                    {vouchersList.map((v, idx) => (
                      <div key={v.id || idx} className="voucher-card">
                        <div className="voucher-left-stub">
                          <Tag size={22} className="stub-icon" />
                          <span className="stub-tag">
                            {v.badgeLine1}
                            {v.badgeLine2 && <><br />{v.badgeLine2}</>}
                          </span>
                        </div>
                        <div className="voucher-details">
                          <h4 className="voucher-title">{v.title}</h4>
                          <p className="voucher-desc">{v.desc}</p>
                          <div className="voucher-footer">
                            <span className="voucher-expiry">{v.expiry}</span>
                            <button
                              className="copy-code-btn"
                              onClick={() => handleCopyVoucher(v.code)}
                              title="Sao chép mã"
                            >
                              <Copy size={13} /> {v.code}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Đổi Mật Khẩu */}
            {activeTab === 'password' && (
              <div className="content-inner animate-fade-in">
                <div className="content-title-header">
                  <h2 className="content-main-heading font-serif">Đổi Mật Khẩu</h2>
                  <p className="content-sub-heading">Đảm bảo an toàn tài khoản bằng cách cập nhật mật khẩu định kỳ.</p>
                </div>

                {passMsg && (
                  <div className={`profile-alert alert-${passAlertType}`}>
                    {passAlertType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{passMsg}</span>
                  </div>
                )}

                <form onSubmit={handlePassChange} className="password-form">
                  {/* MẬT KHẨU HIỆN TẠI */}
                  <div className="field-group">
                    <label className="field-label">MẬT KHẨU HIỆN TẠI <span className="field-required">*</span></label>
                    <div className="password-input-relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        className="custom-input"
                        value={passData.currentPass}
                        onChange={(e) => setPassData(p => ({ ...p, currentPass: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        className="pass-eye-toggle-btn"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        title={showCurrentPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        aria-label="Toggle password visibility"
                      >
                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* MẬT KHẨU MỚI */}
                  <div className="field-group">
                    <label className="field-label">MẬT KHẨU MỚI <span className="field-required">*</span></label>
                    <div className="password-input-relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        className={`custom-input ${newPassError ? 'input-error' : ''}`}
                        value={passData.newPass}
                        onChange={handleNewPassChange}
                        onBlur={() => setNewPassError(validateNewPassword(passData.newPass))}
                        required
                      />
                      <button
                        type="button"
                        className="pass-eye-toggle-btn"
                        onClick={() => setShowNewPass(!showNewPass)}
                        title={showNewPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        aria-label="Toggle password visibility"
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {newPassError && (
                      <div className="field-error-msg">
                        <AlertCircle size={14} />
                        <span>{newPassError}</span>
                      </div>
                    )}
                  </div>

                  {/* XÁC NHẬN MẬT KHẨU MỚI */}
                  <div className="field-group">
                    <label className="field-label">XÁC NHẬN MẬT KHẨU MỚI <span className="field-required">*</span></label>
                    <div className="password-input-relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        className={`custom-input ${confirmPassError ? 'input-error' : ''}`}
                        value={passData.confirmPass}
                        onChange={handleConfirmPassChange}
                        onBlur={() => setConfirmPassError(validateConfirmPassword(passData.confirmPass, passData.newPass))}
                        required
                      />
                      <button
                        type="button"
                        className="pass-eye-toggle-btn"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        title={showConfirmPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        aria-label="Toggle password visibility"
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassError && (
                      <div className="field-error-msg">
                        <AlertCircle size={14} />
                        <span>{confirmPassError}</span>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="save-profile-btn" style={{ marginTop: '16px' }}>
                    CẬP NHẬT MẬT KHẨU
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal 1: Theo Dõi Hành Trình Chi Tiết */}
      {trackingModalOrder && (() => {
        const refStatus = resolveOrderRefundStatus(trackingModalOrder);
        const ordL = String(trackingModalOrder.status_label || '').toUpperCase();
        const ordN = String(trackingModalOrder.note || '').toLowerCase();
        const isApproved = refStatus.isApproved || trackingModalOrder.refund_decision === 'APPROVED' || ordL.includes('ĐÃ HOÀN') || ordN.includes('đã xác nhận hoàn tiền') || ordN.includes('đã hoàn tiền');
        const isRejected = !isApproved && (refStatus.isRejected || trackingModalOrder.refund_decision === 'REJECTED' || ordL.includes('TỪ CHỐI') || ordN.includes('từ chối hoàn tiền') || ordN.includes('từ chối hoàn'));
        const isRet = isApproved || isRejected || Boolean(trackingModalOrder.refund_reason) || Boolean(trackingModalOrder.refund_bank) || getOrderStatusCategory(trackingModalOrder.status, trackingModalOrder) === 'RETURNED';
        const modalCat = isRet ? 'RETURNED' : getOrderStatusCategory(trackingModalOrder.status, trackingModalOrder);
        const cancelInfo = resolveCancelInfo(trackingModalOrder);

        const isShippingOrDelivered = ['SHIPPING', 'DELIVERING', 'SHIPPED', 'IN_TRANSIT', 'COMPLETED', 'DELIVERED', 'SUCCESS'].includes(modalCat);
        const orderDate = trackingModalOrder.created_at || 'Hôm nay';
        const recipientName = trackingModalOrder.recipient_name || trackingModalOrder.customer?.name || trackingModalOrder.customer_name || user?.full_name || 'Khách hàng';
        const recipientPhone = trackingModalOrder.recipient_phone || trackingModalOrder.customer?.phone || trackingModalOrder.phone || user?.phone || '';
        const recipientAddress = trackingModalOrder.shipping_address || trackingModalOrder.address || trackingModalOrder.customer?.address || (typeof user?.address === 'string' ? user.address : [user?.address?.detail, user?.address?.ward, user?.address?.district, user?.address?.province].filter(Boolean).join(', ')) || '';

        const isDeliveryRetry = trackingModalOrder.delivery_status === 'FAILED_RETRY' ||
          String(trackingModalOrder.status_label || '').toUpperCase().includes('GIAO THẤT BẠI') ||
          String(trackingModalOrder.status_label || '').toUpperCase().includes('HẸN GIAO LẠI');

        const statusBadgeStyle = isDeliveryRetry
          ? { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }
          : (modalCat === 'COMPLETED'
          ? { background: '#dcfce7', color: '#15803d' }
          : (modalCat === 'SHIPPING'
            ? { background: '#dbeafe', color: '#1d4ed8' }
            : (modalCat === 'CONFIRMED'
              ? { background: '#e0f2fe', color: '#0369a1' }
              : (modalCat === 'CANCELLED'
                ? { background: '#fee2e2', color: '#b91c1c' }
                : (modalCat === 'RETURNED'
                  ? (isApproved
                    ? { background: '#dcfce7', color: '#15803d' }
                    : (isRejected
                      ? { background: '#fee2e2', color: '#b91c1c' }
                      : { background: '#f3e8ff', color: '#7e22ce' }))
                  : { background: '#fef3c7', color: '#b45309' })))));

        const statusText = isDeliveryRetry
          ? (trackingModalOrder.status_label || 'GIAO THẤT BẠI - HẸN GIAO LẠI')
          : (modalCat === 'COMPLETED'
          ? 'ĐÃ GIAO HÀNG'
          : (modalCat === 'SHIPPING'
            ? 'ĐANG VẬN CHUYỂN'
            : (modalCat === 'CONFIRMED'
              ? 'ĐÃ XÁC NHẬN'
              : (modalCat === 'CANCELLED'
                ? 'ĐÃ HỦY'
                : (modalCat === 'RETURNED'
                  ? (isApproved ? 'ĐÃ HOÀN TIỀN' : (isRejected ? 'TỪ CHỐI HOÀN TIỀN' : 'ĐỔI TRẢ'))
                  : 'CHỜ XÁC NHẬN')))));

        return (
          <div className="profile-modal-overlay animate-fade-in" onClick={() => setTrackingModalOrder(null)}>
            <div className="profile-modal-box tracking-modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header-row">
                <div>
                  <span className="modal-super-title">THEO DÕI HỎA TỐC 2H</span>
                  <h3 className="modal-title font-serif">Mã Đơn #{trackingModalOrder.order_code || trackingModalOrder.order_id}</h3>
                </div>
                <button className="modal-close-btn" onClick={() => setTrackingModalOrder(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* 1. Thông tin người đặt hàng hiển thị ở trên cùng */}
              <div className="tracking-customer-box">
                <div className="tracking-section-header">
                  <span className="tracking-sub-title">THÔNG TIN NGƯỜI ĐẶT HÀNG</span>
                  <span className="tracking-order-badge" style={statusBadgeStyle}>{statusText}</span>
                </div>
                <div className="customer-info-content">
                  <div className="customer-info-row">
                    <div className="info-cell">
                      <User size={14} className="cell-icon" />
                      <span className="cell-label">Người đặt:</span>
                      <strong className="cell-value">{recipientName}</strong>
                    </div>
                    {recipientPhone && (
                      <div className="info-cell">
                        <Phone size={14} className="cell-icon" />
                        <span className="cell-label">Điện thoại:</span>
                        <strong className="cell-value">{recipientPhone}</strong>
                      </div>
                    )}
                  </div>
                  {recipientAddress && (
                    <div className="customer-address-row">
                      <MapPin size={14} className="cell-icon" />
                      <span className="cell-label">Địa chỉ nhận:</span>
                      <span className="cell-value">{recipientAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Thông tin xử lý đổi trả & hoàn tiền hoặc bưu cục/shipper */}
              {modalCat === 'RETURNED' ? (
                <div className="tracking-modal-card" style={{
                  background: isApproved ? '#F0FDF4' : (isRejected ? '#FEF2F2' : '#FAF5FF'),
                  borderColor: isApproved ? '#BBF7D0' : (isRejected ? '#FECACA' : '#E9D5FF'),
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: isApproved ? '1px solid #DCFCE7' : (isRejected ? '1px solid #FEE2E2' : '1px solid #F3E8FF') }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isApproved ? '#16A34A' : (isRejected ? '#DC2626' : '#7E22CE'),
                        color: '#FFFFFF'
                      }}>
                        {isApproved ? <Check size={13} strokeWidth={2.5} /> : isRejected ? <X size={13} strokeWidth={2.5} /> : <RotateCcw size={13} strokeWidth={2.5} />}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: isApproved ? '#15803D' : (isRejected ? '#DC2626' : '#7E22CE'), textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {isApproved ? 'Shop Đã Phê Duyệt & Hoàn Tiền Thành Công' : isRejected ? 'Shop Đã Từ Chối Yêu Cầu Hoàn Tiền' : 'Thông Tin Yêu Cầu Đổi Trả & Hoàn Tiền'}
                      </h4>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: isApproved ? '#DCFCE7' : (isRejected ? '#FEE2E2' : '#F3E8FF'),
                      color: isApproved ? '#15803D' : (isRejected ? '#B91C1C' : '#7E22CE'),
                      border: isApproved ? '1px solid #BBF7D0' : (isRejected ? '1px solid #FECACA' : '1px solid #E9D5FF'),
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {isApproved ? '✓ ĐÃ HOÀN TIỀN' : isRejected ? '✕ TỪ CHỐI HOÀN TIỀN' : '⏳ CHỜ XỬ LÝ'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    {!isApproved && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <strong style={{ color: isRejected ? '#991B1B' : '#581C87', minWidth: '135px' }}>Lý do đổi trả:</strong>
                        <span style={{ color: '#1C1917', fontWeight: 600 }}>
                          {trackingModalOrder.refund_reason || (trackingModalOrder.note && trackingModalOrder.note.includes('STK:') ? trackingModalOrder.note.split('STK:')[0].replace('Khách yêu cầu hoàn tiền:', '').replace('|', '').trim() : (trackingModalOrder.note ? trackingModalOrder.note.replace('Khách yêu cầu hoàn tiền:', '').trim() : 'Sản phẩm không vừa kích cỡ (Size)'))}
                        </span>
                      </div>
                    )}

                    {(trackingModalOrder.refund_bank || (trackingModalOrder.note && trackingModalOrder.note.includes('STK:'))) && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <strong style={{ color: isApproved ? '#166534' : (isRejected ? '#991B1B' : '#581C87'), minWidth: '135px' }}>TK nhận tiền hoàn:</strong>
                        <span style={{
                          color: isApproved ? '#15803D' : '#7E22CE',
                          fontWeight: 700,
                          background: '#FFFFFF',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: isApproved ? '1px solid #BBF7D0' : '1px solid #D8B4FE',
                          letterSpacing: '0.2px'
                        }}>
                          {trackingModalOrder.refund_bank || (trackingModalOrder.note && trackingModalOrder.note.split('STK:')[1]?.trim())}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                      <span style={{ color: isApproved ? '#166534' : (isRejected ? '#991B1B' : '#6B21A8'), minWidth: '135px' }}>Số tiền hoàn trả:</span>
                      <strong style={{ fontSize: '14px', color: isApproved ? '#15803D' : '#7E22CE' }}>
                        {Number(trackingModalOrder.total_amount || 0).toLocaleString('vi-VN')}₫
                      </strong>
                    </div>

                    {isRejected && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px', padding: '10px 12px', background: '#FFFFFF', borderRadius: '8px', border: '1.5px solid #FECACA', color: '#991B1B' }}>
                        <strong style={{ minWidth: '135px', color: '#B91C1C' }}>Lý do từ chối từ Shop:</strong>
                        <span style={{ fontWeight: 600, color: '#DC2626' }}>
                          {trackingModalOrder.reject_reason || (trackingModalOrder.note && trackingModalOrder.note.includes('Từ chối hoàn tiền:') ? trackingModalOrder.note.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim() : 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop')}
                        </span>
                      </div>
                    )}

                    {isApproved && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px', padding: '10px 12px', background: '#FFFFFF', borderRadius: '8px', border: '1.5px solid #BBF7D0', color: '#15803D' }}>
                        <strong style={{ minWidth: '135px', color: '#166534' }}>Thông báo từ Shop:</strong>
                        <span style={{ fontWeight: 600, color: '#15803D' }}>
                          Shop đã phê duyệt yêu cầu đổi trả và hoàn tất chuyển tiền hoàn trả về tài khoản ngân hàng của bạn. Quý khách vui lòng kiểm tra biến động số dư.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : modalCat === 'CANCELLED' ? (
                <div className="tracking-modal-card" style={{
                  background: '#FEF2F2',
                  borderColor: '#FECACA',
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
                        {cancelInfo.isShopCancelled ? 'Shop Đã Hủy Đơn Hàng' : 'Đơn Hàng Đã Bị Hủy'}
                      </h4>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#FEE2E2',
                      color: '#B91C1C',
                      border: '1px solid #FECACA',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      ✕ ĐÃ HỦY
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <strong style={{ color: '#991B1B', minWidth: '135px' }}>
                        {cancelInfo.isShopCancelled ? 'Lý do từ Shop:' : 'Lý do hủy đơn:'}
                      </strong>
                      <span style={{ color: '#B91C1C', fontWeight: 600 }}>
                        {cancelInfo.cancelReason || 'Đổi ý, không muốn mua nữa'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <strong style={{ color: '#991B1B', minWidth: '135px' }}>Người thực hiện:</strong>
                      <span style={{ color: '#1C1917', fontWeight: 600 }}>
                        {cancelInfo.isShopCancelled ? 'Shop Youth Fashion (Quản trị viên)' : 'Khách hàng'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px', padding: '10px 12px', background: '#FFFFFF', borderRadius: '8px', border: '1.5px solid #FECACA', color: '#991B1B' }}>
                      <AlertCircle size={15} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                        {cancelInfo.isShopCancelled ? (
                          <>
                            Đơn hàng đã được phía <strong>Shop Youth Fashion</strong> hủy. Toàn bộ tiền cọc hoặc các khoản thanh toán (nếu có) sẽ được xử lý hoàn trả theo quy định. Nếu quý khách có bất kỳ thắc mắc nào, vui lòng liên hệ hotline/chat để được hỗ trợ nhanh nhất.
                          </>
                        ) : (
                          <>
                            Đơn hàng đã được hủy theo yêu cầu của bạn. Sản phẩm đã được trả về kho tồn hệ thống.
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {isDeliveryRetry && (
                    <div style={{
                      background: '#FFFBEB',
                      border: '1.5px solid #FDE68A',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      marginBottom: '14px',
                      fontSize: '13px',
                      color: '#92400E'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <AlertCircle size={16} style={{ color: '#D97706' }} />
                        <strong style={{ color: '#B45309' }}>Giao hàng chưa thành công{trackingModalOrder.delivery_attempts ? ` (Lần ${trackingModalOrder.delivery_attempts})` : ''}</strong>
                      </div>
                      {trackingModalOrder.delivery_fail_reason && (
                        <div style={{ color: '#78350F', marginBottom: '4px' }}>
                          Lý do shipper báo: <strong>"{trackingModalOrder.delivery_fail_reason}"</strong>
                        </div>
                      )}
                      {trackingModalOrder.retry_date && (
                        <div style={{ color: '#B45309', fontWeight: 600 }}>
                          Lịch hẹn giao lại dự kiến: <u>{new Date(trackingModalOrder.retry_date).toLocaleDateString('vi-VN')}</u>. Shipper sẽ liên hệ trước khi đến.
                        </div>
                      )}
                    </div>
                  )}
                  <div className="tracking-modal-card">
                    <div className="carrier-badge-row">
                      <span className="carrier-name">🚚 Giao Hàng Nhanh (Express VIP)</span>
                      <span className="carrier-code">Mã bưu cục: GHN-VFP-{String(trackingModalOrder.order_code || trackingModalOrder.order_id).replace(/\D/g, '').slice(-6) || '494124'}</span>
                    </div>
                  {isShippingOrDelivered ? (
                    <div className="shipper-info-box">
                      <User size={15} />
                      <span>Tài xế giao nhận: <strong>{trackingModalOrder.stepper?.driver_name || 'Lê Hoàng Nam (Hotline: 0906 234 567)'}</strong></span>
                    </div>
                  ) : (
                    <div className="shipper-info-box pending-shipper">
                      <Clock size={14} className="pending-icon" />
                      <span className="pending-note">Thông tin tài xế sẽ hiển thị khi đơn hàng chuyển sang trạng thái <strong>Đang vận chuyển</strong>.</span>
                    </div>
                  )}
                  </div>
                </>
              )}

              {/* 3. Nhật ký hành trình đơn hàng */}
              <div className="tracking-history-timeline">
                <h4 className="timeline-section-title">Nhật ký hành trình đơn hàng:</h4>
                {(() => {
                  if (modalCat === 'COMPLETED') {
                    return (
                      <>
                        <div className="history-step active">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{trackingModalOrder.delivered_date || orderDate} - Nhận hàng thành công</span>
                            <p className="history-text">Đơn hàng đã được giao thành công tận tay khách hàng.</p>
                          </div>
                        </div>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{orderDate} - 11:20 - Đang vận chuyển</span>
                            <p className="history-text">Kiện hàng đã hoàn tất đóng gói Haute Couture và bàn giao cho đơn vị vận chuyển Giao Hàng Nhanh (Express VIP).</p>
                          </div>
                        </div>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{orderDate} - 09:30 - Đang xử lý</span>
                            <p className="history-text">Đơn hàng đã được nhân viên kiểm duyệt thông tin và chuẩn bị tại shop.</p>
                          </div>
                        </div>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{orderDate} - Tiếp nhận đơn</span>
                            <p className="history-text">Tiếp nhận đơn hàng thành công trên hệ thống thương mại điện tử Youth Fashion.</p>
                          </div>
                        </div>
                      </>
                    );
                  }

                  if (modalCat === 'SHIPPING') {
                    return (
                      <>
                        {isDeliveryRetry && (
                          <div className="history-step active">
                            <div className="history-dot" style={{ background: '#D97706' }} />
                            <div className="history-content">
                              <span className="history-time" style={{ color: '#D97706' }}>
                                Giao chưa thành công{trackingModalOrder.delivery_attempts ? ` (Lần ${trackingModalOrder.delivery_attempts})` : ''} - Hẹn giao lại
                              </span>
                              <p className="history-text" style={{ color: '#78350F' }}>
                                {trackingModalOrder.delivery_fail_reason ? `Lý do: "${trackingModalOrder.delivery_fail_reason}".` : 'Chưa giao được cho người nhận.'}
                                {trackingModalOrder.retry_date ? ` Đơn vị vận chuyển đã lên lịch phát lại vào ngày ${new Date(trackingModalOrder.retry_date).toLocaleDateString('vi-VN')}.` : ' Sẽ liên hệ lại để giao hàng.'}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className={`history-step ${!isDeliveryRetry ? 'active' : ''}`}>
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{orderDate} - Đã bàn giao shipper</span>
                            <p className="history-text">Kiện hàng đã hoàn tất đóng gói và bàn giao cho đơn vị vận chuyển Giao Hàng Nhanh (Express VIP). Đơn hàng đang trên đường vận chuyển tới địa chỉ của bạn.</p>
                          </div>
                        </div>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{orderDate} - Đang xử lý</span>
                            <p className="history-text">Đơn hàng đã được nhân viên kiểm duyệt thông tin, hoàn tất đóng gói tại shop.</p>
                          </div>
                        </div>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{orderDate} - Tiếp nhận đơn</span>
                            <p className="history-text">Xác nhận đơn hàng thành công trên hệ thống Youth Fashion.</p>
                          </div>
                        </div>
                      </>
                    );
                  }

                  if (modalCat === 'CANCELLED') {
                    return (
                      <>
                        <div className="history-step active">
                          <div className="history-dot" style={{ background: '#DC2626' }} />
                          <div className="history-content">
                            <span className="history-time" style={{ color: '#DC2626', fontWeight: 700 }}>
                              {cancelInfo.isShopCancelled ? 'Hôm nay - Shop đã hủy đơn hàng' : 'Hôm nay - Đã hủy đơn hàng'}
                            </span>
                            <p className="history-text">
                              {cancelInfo.isShopCancelled ? (
                                <>
                                  Đơn hàng đã được phía Shop hủy. Lý do từ Shop: <strong style={{ color: '#DC2626' }}>"{cancelInfo.cancelReason}"</strong>. Quý khách vui lòng liên hệ hotline/chat nếu cần hỗ trợ thêm.
                                </>
                              ) : (
                                <>
                                  Đơn hàng đã hủy theo yêu cầu của khách hàng. Lý do: <strong>"{cancelInfo.cancelReason}"</strong>.
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">Ghi nhận hủy đơn</span>
                            <p className="history-text">
                              {cancelInfo.isShopCancelled ? 'Quản lý cửa hàng đã xác nhận hủy đơn trên hệ thống và hoàn trả số lượng sản phẩm về kho tồn.' : 'Hệ thống ghi nhận yêu cầu hủy đơn và hoàn trả số lượng sản phẩm về kho tồn.'}
                            </p>
                          </div>
                        </div>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{orderDate} - Đang xử lý</span>
                            <p className="history-text">Đơn hàng đang chờ nhân viên kiểm duyệt thông tin và chuẩn bị tại shop.</p>
                          </div>
                        </div>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{orderDate} - Tiếp nhận đơn</span>
                            <p className="history-text">Tiếp nhận đơn hàng thành công trên hệ thống thương mại điện tử Youth Fashion.</p>
                          </div>
                        </div>
                      </>
                    );
                  }

                  if (modalCat === 'RETURNED') {
                    const refSt = resolveOrderRefundStatus(trackingModalOrder);
                    const tmLabel = String(trackingModalOrder.status_label || '').toUpperCase();
                    const tmNote = String(trackingModalOrder.note || '').toLowerCase();
                    const isApproved = refSt.isApproved || trackingModalOrder.refund_decision === 'APPROVED' || tmLabel.includes('ĐÃ HOÀN') || tmNote.includes('đã xác nhận hoàn tiền') || tmNote.includes('đã hoàn tiền');
                    const isRejected = !isApproved && (refSt.isRejected || trackingModalOrder.refund_decision === 'REJECTED' || tmLabel.includes('TỪ CHỐI') || tmNote.includes('từ chối hoàn tiền') || tmNote.includes('từ chối hoàn'));
                    const originalReason = trackingModalOrder.refund_reason || (trackingModalOrder.note && trackingModalOrder.note.includes('STK:') ? trackingModalOrder.note.split('STK:')[0].replace('Khách yêu cầu hoàn tiền:', '').replace('|', '').trim() : (trackingModalOrder.note ? trackingModalOrder.note.replace('Khách yêu cầu hoàn tiền:', '').trim() : 'Khách yêu cầu hoàn tiền sau khi nhận hàng'));
                    return (
                      <>
                        {isApproved ? (
                          <>
                            <div className="history-step active">
                              <div className="history-dot" style={{ background: '#16A34A' }} />
                              <div className="history-content">
                                <span className="history-time" style={{ color: '#16A34A', fontWeight: 700 }}>Hôm nay - Shop đã đồng ý &amp; hoàn tiền thành công</span>
                                <p className="history-text">
                                  Shop đã xác nhận và thực hiện hoàn tiền thành công số tiền <strong>{Number(trackingModalOrder.total_amount || 0).toLocaleString('vi-VN')}₫</strong> về tài khoản: <strong>{trackingModalOrder.refund_bank || (trackingModalOrder.note && trackingModalOrder.note.split('STK:')[1]?.trim()) || 'Tài khoản đã cung cấp'}</strong>. Quý khách vui lòng kiểm tra biến động số dư tài khoản ngân hàng.
                                </p>
                              </div>
                            </div>
                            <div className="history-step">
                              <div className="history-dot" />
                              <div className="history-content">
                                <span className="history-time">Tiếp nhận yêu cầu đổi trả &amp; hoàn tiền</span>
                                <p className="history-text">
                                  Hệ thống đã tiếp nhận và hoàn tất xử lý yêu cầu đổi trả &amp; hoàn tiền của quý khách.
                                </p>
                              </div>
                            </div>
                          </>
                        ) : isRejected ? (
                          <>
                            <div className="history-step active">
                              <div className="history-dot" style={{ background: '#DC2626' }} />
                              <div className="history-content">
                                <span className="history-time" style={{ color: '#DC2626', fontWeight: 700 }}>Hôm nay - Shop đã từ chối yêu cầu hoàn tiền</span>
                                <p className="history-text">
                                  Shop đã từ chối yêu cầu đổi trả &amp; hoàn tiền của bạn. Lý do từ chối: <strong style={{ color: '#DC2626' }}>{trackingModalOrder.reject_reason || (trackingModalOrder.note && trackingModalOrder.note.includes('Từ chối hoàn tiền:') ? trackingModalOrder.note.split('Từ chối hoàn tiền:')[1]?.split('|')[0]?.trim() : 'Sản phẩm không đáp ứng điều kiện đổi trả theo chính sách của shop')}</strong>.
                                </p>
                              </div>
                            </div>
                            <div className="history-step">
                              <div className="history-dot" />
                              <div className="history-content">
                                <span className="history-time">Tiếp nhận yêu cầu đổi trả &amp; hoàn tiền</span>
                                <p className="history-text">
                                  Hệ thống đã tiếp nhận yêu cầu đổi trả &amp; hoàn tiền từ khách hàng. Lý do: <strong>{originalReason}</strong>.
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="history-step active">
                            <div className="history-dot" style={{ background: '#7E22CE' }} />
                            <div className="history-content">
                              <span className="history-time" style={{ color: '#7E22CE', fontWeight: 700 }}>Hôm nay - Tiếp nhận yêu cầu hoàn tiền (Đang chờ Shop xử lý)</span>
                              <p className="history-text">
                                Hệ thống đã tiếp nhận yêu cầu đổi trả &amp; hoàn tiền. Lý do: <strong>{originalReason}</strong>.
                                {(trackingModalOrder.refund_bank || (trackingModalOrder.note && trackingModalOrder.note.includes('STK:'))) ? (
                                  <span style={{ display: 'block', marginTop: '4px', color: '#6b21a8' }}>
                                    Tài khoản nhận hoàn tiền: <strong>{trackingModalOrder.refund_bank || (trackingModalOrder.note && trackingModalOrder.note.split('STK:')[1]?.trim())}</strong>.
                                  </span>
                                ) : (
                                  <span style={{ display: 'block', marginTop: '4px', color: '#6b21a8' }}>
                                    Tiền hoàn sẽ được chuyển về tài khoản thanh toán ban đầu.
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">Đang đối soát &amp; xử lý hoàn tiền</span>
                            <p className="history-text">Bộ phận Chăm sóc Khách hàng đang đối soát hồ sơ đổi trả và điều phối bưu tá thu hồi kiện hàng.</p>
                          </div>
                        </div>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{trackingModalOrder.delivered_date || 'Trước đó'} - Nhận hàng thành công</span>
                            <p className="history-text">Đơn hàng đã được giao thành công tận tay khách hàng trước khi phát sinh yêu cầu đổi trả.</p>
                          </div>
                        </div>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{orderDate} - Đang xử lý</span>
                            <p className="history-text">Kiện hàng đã được kiểm định, hoàn tất đóng gói và chuẩn bị tại shop.</p>
                          </div>
                        </div>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{orderDate} - Tiếp nhận đơn</span>
                            <p className="history-text">Tiếp nhận đơn hàng thành công trên hệ thống thương mại điện tử Youth Fashion.</p>
                          </div>
                        </div>
                      </>
                    );
                  }

                  if (modalCat === 'CONFIRMED') {
                    return (
                      <>
                        <div className="history-step">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">{orderDate} - Đang xử lý</span>
                            <p className="history-text">Đơn hàng đang chờ nhân viên kiểm duyệt thông tin, kiểm tra tồn kho và chuẩn bị tại shop.</p>
                          </div>
                        </div>
                        <div className="history-step active">
                          <div className="history-dot" />
                          <div className="history-content">
                            <span className="history-time">Hôm nay - Đã tiếp nhận đơn</span>
                            <p className="history-text">Tiếp nhận đơn hàng thành công trên hệ thống thương mại điện tử Youth Fashion.</p>
                          </div>
                        </div>
                      </>
                    );
                  }

                  // Default: PENDING (Chờ xác nhận / Đang xử lý)
                  return (
                    <>
                      <div className="history-step active">
                        <div className="history-dot" />
                        <div className="history-content">
                          <span className="history-time">Hôm nay - Đang xử lý</span>
                          <p className="history-text">Đơn hàng đang chờ nhân viên kiểm duyệt thông tin, kiểm tra tồn kho và chuẩn bị tại shop.</p>
                        </div>
                      </div>
                      <div className="history-step">
                        <div className="history-dot" />
                        <div className="history-content">
                          <span className="history-time">{orderDate} - Tiếp nhận đơn</span>
                          <p className="history-text">Tiếp nhận đơn hàng thành công trên hệ thống thương mại điện tử Youth Fashion.</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="modal-footer-actions">
                <button className="btn-modal-primary" onClick={() => setTrackingModalOrder(null)}>
                  ĐÃ HIỂU
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal 2: Viết Đánh Giá*/}
      {reviewModalOrder && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setReviewModalOrder(null)}>
          <div className="profile-modal-box review-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <span className="modal-super-title gold-text">★ ĐẶC QUYỀN THÀNH VIÊN VIP</span>
                <h3 className="modal-title font-serif">Viết Đánh Giá Sản Phẩm</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setReviewModalOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="review-reward-banner">
              <span>🎉 Nhận ngay <strong>+100 Điểm Thưởng VIP</strong> sau khi hoàn thành đánh giá!</span>
            </div>

            <div className="review-product-preview">
              <img
                src={resolveOrderItemImage(reviewModalOrder.items?.[0])}
                alt=""
                className="review-thumb"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = resolveOrderItemImage(reviewModalOrder.items?.[0]);
                }}
              />
              <div>
                <h4 className="review-prod-title font-serif">{reviewModalOrder.items?.[0]?.name}</h4>
                <span className="review-prod-specs">Mã đơn: #{reviewModalOrder.order_code || reviewModalOrder.order_id}</span>
              </div>
            </div>

            <div className="review-rating-stars">
              <span className="rating-prompt">Chất lượng sản phẩm & độ vừa vặn:</span>
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= reviewRating ? 'selected' : ''}`}
                    onClick={() => setReviewRating(star)}
                  >
                    ★
                  </button>
                ))}
                <span className="rating-label-text">
                  {reviewRating === 5 ? 'Cực kỳ hài lòng (5/5)' : reviewRating === 4 ? 'Rất tốt (4/5)' : `${reviewRating}/5 sao`}
                </span>
              </div>
            </div>

            <div className="review-quick-tags">
              {['Chất liệu thượng hạng', 'Đường may tinh xảo', 'Chuẩn phom dáng', 'Đóng gói sang trọng'].map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`quick-tag-chip ${selectedReviewTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedReviewTags(prev =>
                      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                    );
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="review-textarea-wrap">
              <textarea
                rows={3}
                placeholder="Chia sẻ thêm cảm nhận của bạn về chất vải, phom dáng và dịch vụ may đo..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                className="review-textarea"
              />
            </div>

            <div className="modal-footer-actions">
              <button className="btn-modal-cancel" onClick={() => setReviewModalOrder(null)}>
                HỦY
              </button>
              <button
                className="btn-modal-primary"
                onClick={() => {
                  const firstItem = reviewModalOrder?.items?.[0] || {};
                  const prodId = String(firstItem.product_id || firstItem.id || 'YF-COAT-CAMEL-01');
                  const prodName = firstItem.name || 'Áo Măng Tô Belted Dạ Camel Cashmere';
                  const variantParts = [firstItem.size ? `Size ${firstItem.size}` : '', firstItem.color ? `${firstItem.color}` : ''].filter(Boolean);
                  const variantStr = variantParts.length > 0 ? variantParts.join(' • ') : 'Tiêu chuẩn';

                  const authorName = user?.full_name || user?.name || (user?.email ? user.email.split('@')[0] : 'Khách hàng VIP');
                  const oId = String(reviewModalOrder?.order_id || reviewModalOrder?.id || '').trim();
                  const oCode = String(reviewModalOrder?.order_code || reviewModalOrder?.order_number || reviewModalOrder?.order_id || '').trim();
                  const digits = (oCode || oId).replace(/\D/g, '');

                  const newReview = {
                    id: 'rev_' + Date.now(),
                    product_id: prodId,
                    product_name: prodName,
                    author: authorName,
                    customer_id: String(user?.customer_id || user?.id || ''),
                    is_verified: true,
                    date: new Date().toLocaleDateString('vi-VN'),
                    created_at: new Date().toISOString(),
                    variant: variantStr,
                    rating: Number(reviewRating || 5),
                    content: reviewComment.trim() || (selectedReviewTags.length > 0 ? selectedReviewTags.join(', ') : 'Chất lượng sản phẩm rất tuyệt vời, đúng kỳ vọng và phom dáng chuẩn!'),
                    tags: selectedReviewTags || [],
                    likes: 0,
                    order_id: oId,
                    order_code: oCode,
                  };

                  try {
                    const existing = JSON.parse(localStorage.getItem('yf_product_reviews') || '[]');
                    const updated = [newReview, ...existing.filter(r => !(r.order_id === oId && r.product_id === prodId))];
                    localStorage.setItem('yf_product_reviews', JSON.stringify(updated));
                  } catch (e) {}

                  try {
                    const revMap = JSON.parse(localStorage.getItem('yf_reviewed_orders') || '{}');
                    if (oId) revMap[oId] = true;
                    if (oCode) revMap[oCode] = true;
                    if (digits) revMap[digits] = true;
                    localStorage.setItem('yf_reviewed_orders', JSON.stringify(revMap));
                    setReviewedOrdersMap(revMap);
                  } catch (e) {}

                  try {
                    window.dispatchEvent(new CustomEvent('yf_reviews_updated', { detail: newReview }));
                    const bc = new BroadcastChannel('yf_reviews_sync_channel');
                    bc.postMessage(newReview);
                    bc.close();
                  } catch (e) {}

                  setReviewSubmittedAlert(`Cảm ơn bạn! Đánh giá đã được ghi nhận thành công và bạn nhận được +100 điểm thưởng VIP. Đang chuyển đến trang đánh giá sản phẩm...`);
                  setReviewModalOrder(null);
                  setTimeout(() => {
                    navigate(`/product/${prodId}#customer-reviews`);
                  }, 600);
                }}
              >
                GỬI ĐÁNH GIÁ & NHẬN ĐIỂM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Hỗ Trợ Bảo Hành */}
      {warrantyModalOpen && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setWarrantyModalOpen(false)}>
          <div className="profile-modal-box warranty-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <span className="modal-super-title">ATELIER CONCIERGE</span>
                <h3 className="modal-title font-serif">Chính Sách & Hỗ Trợ Bảo Hành</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setWarrantyModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="warranty-content">
              <div className="warranty-item">
                <ShieldCheck size={24} className="gold-icon" />
                <div>
                  <h5>Bảo hành đường may & khuy khóa trọn đời</h5>
                  <p>Mọi trang phục may đo tại Youth Fashion đều được hỗ trợ chăm sóc, sửa đường chỉ và thay thế phụ kiện chính hãng trọn đời sản phẩm.</p>
                </div>
              </div>

              <div className="warranty-item">
                <RefreshCw size={24} className="gold-icon" />
                <div>
                  <h5>Miễn phí chỉnh sửa số đo trong 30 ngày</h5>
                  <p>Nếu bạn muốn lên gấu váy, nới hoặc bóp eo để đạt tỷ lệ hoàn hảo nhất, vui lòng mang đến Atelier hoặc liên hệ Hotline để được hỗ trợ giao nhận tận nơi.</p>
                </div>
              </div>

              <div className="warranty-item">
                <Clock size={24} className="gold-icon" />
                <div>
                  <h5>Hotline Concierge 24/7</h5>
                  <p>Chuyên viên chăm sóc khách hàng VIP: <strong>1900 6868 (Phím 1)</strong> hoặc email: <strong>atelier@youthfashion.vn</strong></p>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button className="btn-modal-primary" onClick={() => setWarrantyModalOpen(false)}>
                ĐÃ HIỂU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Xác Nhận Hủy Đơn Hàng */}
      {cancelModalOrder && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => !isCancelling && setCancelModalOrder(null)}>
          <div className="profile-modal-box cancel-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <span className="modal-super-title" style={{ color: '#dc2626' }}>XÁC NHẬN HỦY ĐƠN</span>
                <h3 className="modal-title font-serif">Mã Đơn #{cancelModalOrder.order_code || cancelModalOrder.order_id}</h3>
              </div>
              <button className="modal-close-btn" disabled={isCancelling} onClick={() => setCancelModalOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f3f5' }}>
              <p style={{ margin: '0 0 14px 0', fontSize: '13.5px', color: '#44403c', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn hủy đơn hàng này không? Sau khi xác nhận, đơn hàng sẽ chuyển sang trạng thái <strong>ĐÃ HỦY</strong>.
              </p>

              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1c1917', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Vui lòng chọn lý do hủy:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Đổi ý, không muốn mua nữa',
                  'Muốn thay đổi địa chỉ nhận hàng',
                  'Muốn đổi sang màu sắc / kích thước khác',
                  'Đặt trùng đơn hàng',
                  'Lý do khác'
                ].map((reason) => (
                  <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#44403c', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="cancel_reason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      style={{ accentColor: '#1c1917', cursor: 'pointer' }}
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {cancelReason === 'Lý do khác' && (
                <textarea
                  placeholder="Nhập lý do chi tiết..."
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d6d3d1',
                    fontSize: '13px',
                    minHeight: '64px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              )}
            </div>

            <div className="modal-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                className="btn-order-action btn-dark-outline"
                disabled={isCancelling}
                onClick={() => setCancelModalOrder(null)}
              >
                QUAY LẠI
              </button>
              <button
                type="button"
                className="btn-order-action btn-black-solid"
                disabled={isCancelling}
                onClick={() => confirmCancelOrder(cancelModalOrder)}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              >
                {isCancelling ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN HỦY ĐƠN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Yêu Cầu Hoàn Tiền */}
      {refundModalOrder && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => !isRefunding && setRefundModalOrder(null)}>
          <div className="profile-modal-box cancel-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <span className="modal-super-title" style={{ color: '#7e22ce' }}>CHÍNH SÁCH ĐỔI TRẢ & HOÀN TIỀN</span>
                <h3 className="modal-title font-serif">Mã Đơn #{refundModalOrder.order_code || refundModalOrder.order_id}</h3>
              </div>
              <button className="modal-close-btn" disabled={isRefunding} onClick={() => setRefundModalOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f3f5' }}>
              <div style={{
                background: '#faf5ff',
                border: '1px solid #e9d5ff',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12.5px', color: '#6b21a8', fontWeight: 600 }}>Số tiền hoàn dự kiến:</span>
                <strong style={{ fontSize: '15px', color: '#7e22ce' }}>
                  {Number(refundModalOrder.total_amount || 0).toLocaleString('vi-VN')}₫
                </strong>
              </div>

              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1c1917', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Vui lòng chọn lý do yêu cầu hoàn tiền:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Sản phẩm không vừa kích cỡ (Size)',
                  'Sản phẩm lỗi đường may / chất liệu vải',
                  'Giao sai mẫu / sai màu sắc so với ảnh',
                  'Không ưng ý sau khi nhận sản phẩm',
                  'Lý do khác'
                ].map((reason) => (
                  <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#44403c', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="refund_reason"
                      value={reason}
                      checked={refundReason === reason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      style={{ accentColor: '#7e22ce', cursor: 'pointer' }}
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {refundReason === 'Lý do khác' && (
                <textarea
                  placeholder="Nhập lý do chi tiết..."
                  value={customRefundReason}
                  onChange={(e) => setCustomRefundReason(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d6d3d1',
                    fontSize: '13px',
                    minHeight: '64px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              )}

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1c1917', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Thông tin tài khoản nhận tiền hoàn (STK / Ngân hàng / Chủ tài khoản) <span style={{ color: '#dc2626' }}>* (Bắt buộc)</span>:
                </label>
                <input
                  type="text"
                  placeholder="VD: 1903688888 - Techcombank - NGUYEN VAN A"
                  value={refundBankInfo}
                  onChange={(e) => {
                    setRefundBankInfo(e.target.value);
                    if (refundBankError) setRefundBankError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: refundBankError ? '1.5px solid #dc2626' : '1px solid #d6d3d1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: refundBankError ? '#fef2f2' : '#ffffff'
                  }}
                />
                {refundBankError ? (
                  <span style={{ display: 'block', fontSize: '12px', color: '#dc2626', fontWeight: 600, marginTop: '6px' }}>
                    ⚠️ {refundBankError}
                  </span>
                ) : (
                  <span style={{ display: 'block', fontSize: '11.5px', color: '#6b21a8', fontWeight: 500, marginTop: '5px' }}>
                    * Bắt buộc: Quý khách vui lòng cung cấp Số tài khoản, Tên ngân hàng và Tên chủ tài khoản để Youth Fashion tiến hành hoàn tiền.
                  </span>
                )}
              </div>
            </div>

            <div className="modal-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                className="btn-order-action btn-dark-outline"
                disabled={isRefunding}
                onClick={() => setRefundModalOrder(null)}
              >
                QUAY LẠI
              </button>
              <button
                type="button"
                className="btn-order-action btn-black-solid"
                disabled={isRefunding}
                onClick={() => confirmRefundOrder(refundModalOrder)}
                style={{ backgroundColor: '#7e22ce', borderColor: '#7e22ce', color: '#ffffff' }}
              >
                {isRefunding ? 'ĐANG GỬI...' : 'XÁC NHẬN HOÀN TIỀN'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Profile Page Global Layout */
        .profile-page-bg {
          background-color: #f7f7f8;
          min-height: auto;
          padding-bottom: 40px;
        }

        /* 1. Breadcrumbs Bar */
        .profile-breadcrumb-bar {
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 14px 0;
          margin-bottom: 28px;
        }

        .profile-breadcrumb-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #6b7280;
        }

        .bc-link {
          color: #6b7280;
          text-decoration: none;
          transition: color 0.15s;
        }

        .bc-link:hover {
          color: #111827;
        }

        .bc-sep {
          color: #d1d5db;
          font-size: 10px;
        }

        .bc-current {
          color: #111827;
          font-weight: 700;
        }

        .main-profile-wrapper {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* 2. Top Hero Membership Banner */
        .profile-hero-banner {
          background: linear-gradient(135deg, #1d1e22 0%, #121316 100%);
          border-radius: 16px;
          padding: 32px 36px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        }

        .hero-banner-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .hero-avatar-box {
          position: relative;
          cursor: pointer;
        }

        .hero-avatar-img {
          width: 92px;
          height: 92px;
          border-radius: 14px;
          object-fit: contain;
          background: #000000;
          border: 2px solid rgba(212, 175, 55, 0.4);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: opacity 0.2s;
        }

        .hero-avatar-box:hover .hero-avatar-img {
          opacity: 0.85;
        }

        .avatar-change-btn {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background-color: #ffffff;
          color: #111827;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #121316;
          cursor: pointer;
          transition: transform 0.2s, background-color 0.2s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        .avatar-change-btn:hover {
          background-color: #d4af37;
          color: #ffffff;
          transform: scale(1.1);
        }

        .hero-avatar-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background-color: #d4af37;
          color: #111827;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #121316;
        }

        .check-badge-icon {
          color: #121316;
          stroke-width: 2.5;
        }

        .hero-info-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hero-subtitle {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          color: #9ca3af;
          text-transform: uppercase;
        }

        .gold-text-hero {
          color: #d4af37;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .hero-subtitle .dot {
          margin: 0 4px;
          color: #6b7280;
        }

        .hero-user-name {
          font-size: 26px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .hero-tier-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: #e6c667;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          padding: 5px 14px;
          border-radius: 20px;
          width: fit-content;
          margin-top: 2px;
        }

        .tier-medal {
          font-size: 12px;
        }

        /* Right Stats Box */
        .stats-box {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px 28px;
          display: flex;
          align-items: center;
          gap: 32px;
          backdrop-filter: blur(8px);
        }

        .stat-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #9ca3af;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.1;
        }

        .stat-sub {
          font-size: 11px;
          color: #9ca3af;
        }

        .gold-sub {
          color: #d4af37;
          font-weight: 500;
        }

        .stat-divider {
          width: 1px;
          height: 48px;
          background-color: rgba(255, 255, 255, 0.12);
        }

        /* 3. Main Grid Layout */
        .profile-content-grid {
          display: grid;
          grid-template-columns: 305px 1fr;
          gap: 28px;
          align-items: start;
        }

        /* Sidebar Styling */
        .profile-sidebar-card {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 24px 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }

        .sidebar-header-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #6b7280;
          margin-bottom: 18px;
          padding-left: 8px;
          white-space: nowrap;
        }

        .sidebar-nav-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nav-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 14px;
          border-radius: 10px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: #374151;
          background-color: transparent;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .nav-item-btn:hover {
          background-color: #f3f4f6;
          color: #111827;
        }

        .nav-item-btn.active {
          background-color: #000000;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .nav-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .nav-item-left span {
          white-space: nowrap;
        }

        .active-arrow {
          color: #ffffff;
          flex-shrink: 0;
        }

        .nav-badge-pill {
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 12px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .grey-badge {
          background-color: #f3f4f6;
          color: #374151;
        }

        .gold-badge {
          background-color: #fde047;
          color: #713f12;
          font-weight: 700;
        }

        .manager-nav-btn {
          color: #0284c7 !important;
          border-left: 3px solid #0284c7;
          border-radius: 4px 10px 10px 4px;
        }

        .manager-nav-btn .nav-item-left {
          color: #0284c7;
        }

        .manager-nav-btn .nav-item-left span {
          font-weight: 600;
          color: #0284c7;
        }

        .manager-nav-btn:hover {
          background-color: #f0f9ff;
        }

        .logout-item-btn {
          margin-top: 10px;
          border-top: 1px solid #f3f4f6;
          border-radius: 0;
          padding-top: 16px;
        }

        .logout-item-btn:hover {
          background-color: #fef2f2;
        }

        .text-danger {
          color: #dc2626 !important;
        }

        /* Right Content Area Styling */
        .profile-main-card {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 36px 40px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          min-height: 520px;
        }

        .content-title-header {
          margin-bottom: 30px;
        }

        .content-main-heading {
          font-size: 26px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 6px;
        }

        .content-sub-heading {
          font-size: 13px;
          color: #6b7280;
        }

        .profile-alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .alert-success {
          background-color: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .alert-danger {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Form Grid Layout */
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-fields-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .full-width-group {
          grid-column: 1 / -1;
        }

        .field-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #4b5563;
        }

        .custom-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          color: #111827;
          background-color: #ffffff;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .custom-input:focus {
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.05);
        }

        .password-input-relative {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .password-input-relative .custom-input {
          padding-right: 42px;
        }

        .pass-eye-toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .pass-eye-toggle-btn:hover {
          color: #111827;
        }

        .field-required {
          color: #ef4444;
          font-weight: 700;
          margin-left: 2px;
        }

        .custom-input.input-error {
          border-color: #ef4444 !important;
          background-color: #fef2f2 !important;
        }

        .custom-input.input-error:focus {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
        }

        .field-error-msg {
          font-size: 12px;
          color: #dc2626;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          line-height: 1.4;
          font-weight: 500;
        }

        .input-disabled {
          background-color: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
          border-color: #e5e7eb;
        }

        .dob-picker-group {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .dob-text-input {
          padding-right: 44px;
          letter-spacing: 0.5px;
        }

        .dob-calendar-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          cursor: pointer;
          border-radius: 6px;
          transition: color 0.2s, background-color 0.2s, transform 0.15s;
        }

        .dob-calendar-btn:hover {
          color: #111827;
          background-color: #f3f4f6;
          transform: translateY(-50%) scale(1.08);
        }

        .dob-hidden-native-input {
          position: absolute;
          bottom: 0;
          right: 12px;
          width: 0;
          height: 0;
          opacity: 0;
          pointer-events: none;
          border: none;
          padding: 0;
          margin: 0;
        }

        .gender-radio-options {
          display: flex;
          align-items: center;
          gap: 28px;
          padding-top: 4px;
        }

        .custom-radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #111827;
        }

        .custom-radio-input {
          accent-color: #000000;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .form-submit-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .save-profile-btn {
          background-color: #000000;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 14px 28px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .save-profile-btn:hover {
          background-color: #27272a;
        }

        /* Vouchers Tab */
        .vouchers-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .voucher-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          display: flex;
          overflow: hidden;
          background-color: #ffffff;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .voucher-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
        }

        .voucher-left-stub {
          background-color: #181E29;
          color: #ffffff;
          width: 105px;
          min-width: 105px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 8px;
          text-align: center;
          position: relative;
        }

        .stub-icon {
          color: #facc15;
          stroke-width: 2;
        }

        .stub-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
          color: #ffffff;
          line-height: 1.35;
        }

        .voucher-details {
          padding: 18px 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .voucher-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .voucher-desc {
          font-size: 11.5px;
          color: #6b7280;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .voucher-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .voucher-expiry {
          font-size: 11.5px;
          color: #9ca3af;
        }

        .copy-code-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #000000;
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }

        .copy-code-btn:hover {
          background-color: #27272a;
        }

        /* Password Form */
        .password-form {
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Order History Styles - Haute Couture Luxury Youth Fashion */
        .orders-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .orders-header-text {
          flex: 1;
          min-width: 260px;
        }

        .orders-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #ffffff;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 8px 14px;
          width: 270px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .orders-search-box:focus-within {
          border-color: #1c1917;
          box-shadow: 0 0 0 2px rgba(28, 25, 23, 0.08);
        }

        .search-box-icon {
          color: #a8a29e;
          flex-shrink: 0;
        }

        .orders-search-input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 12.5px;
          color: #1c1917;
          width: 100%;
        }

        .orders-search-input::placeholder {
          color: #a8a29e;
        }

        .search-clear-btn {
          background: none;
          border: none;
          color: #78716c;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-filter-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 16px;
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .status-filter-tabs::-webkit-scrollbar {
          display: none;
        }

        .status-tab {
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #57534e;
          background-color: #f5f5f4;
          border: 1px solid #e7e5e4;
          transition: all 0.2s ease;
          white-space: nowrap;
          cursor: pointer;
        }

        .status-tab:hover {
          color: #1c1917;
          background-color: #e7e5e4;
          border-color: #d6d3d1;
        }

        .status-tab.active {
          background-color: #1c1917;
          color: #ffffff;
          border-color: #1c1917;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        }

        .status-tab.active.tab-pending {
          background-color: #fef3c7;
          color: #92400e;
          border-color: #fcd34d;
          box-shadow: 0 2px 8px rgba(217, 119, 6, 0.15);
        }

        .status-tab.active.tab-confirmed {
          background-color: #e0f2fe;
          color: #0369a1;
          border-color: #bae6fd;
          box-shadow: 0 2px 8px rgba(3, 105, 161, 0.15);
        }

        .status-tab.active.tab-shipping {
          background-color: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
          box-shadow: 0 2px 8px rgba(29, 78, 216, 0.15);
        }

        .status-tab.active.tab-completed {
          background-color: #dcfce7;
          color: #15803d;
          border-color: #86efac;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15);
        }

        .status-tab.active.tab-cancelled {
          background-color: #fee2e2;
          color: #991b1b;
          border-color: #fca5a5;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
        }

        .status-tab.active.tab-returned {
          background-color: #f3e8ff;
          color: #6b21a8;
          border-color: #d8b4fe;
          box-shadow: 0 2px 8px rgba(126, 34, 206, 0.15);
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        /* Luxury Order Card */
        .order-item-card {
          border: 1px solid #e7e5e4;
          border-radius: 12px;
          background-color: #ffffff;
          overflow: hidden;
          transition: box-shadow 0.2s, border-color 0.2s;
        }

        .order-item-card:hover {
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
          border-color: #d6d3d1;
        }

        .order-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 20px;
          background-color: #fafaf9;
          border-bottom: 1px solid #f0eee9;
          font-size: 12px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .order-header-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .order-code {
          font-weight: 700;
          color: #1c1917;
        }

        .meta-sep {
          color: #d6d3d1;
          font-size: 11px;
        }

        .order-date, .order-method {
          color: #78716c;
        }

        /* Status Badge Pills - Khung hiển thị trạng thái đơn hàng */
        .status-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 20px;
          letter-spacing: 0.3px;
        }

        /* 1. Khung Chờ xác nhận: Màu vàng */
        .badge-pending,
        .badge-delivering,
        .badge-processing {
          background-color: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        /* 1.1 Khung Đã xác nhận: Màu xanh ngọc / sky blue */
        .badge-confirmed {
          background-color: #f0f9ff;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }

        /* 2. Khung Đang vận chuyển: Màu xanh dương */
        .badge-shipping {
          background-color: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        /* 3. Khung Đã giao: Màu xanh lá */
        .badge-completed {
          background-color: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        /* 4. Khung Đã hủy: Màu đỏ */
        .badge-cancelled {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecdd3;
        }

        /* 5. Khung Đổi trả: Màu tím */
        .badge-returned {
          background-color: #f3e8ff;
          color: #7e22ce;
          border: 1px solid #d8b4fe;
        }

        /* Order Items */
        .order-items-wrapper {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .order-product-row {
          display: flex;
          align-items: flex-start;
          gap: 18px;
        }

        .item-thumb {
          width: 76px;
          height: 76px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #f0eee9;
          background-color: #f5f5f4;
          flex-shrink: 0;
        }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-collection-tag {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #d97706;
          text-transform: uppercase;
        }

        .item-title {
          font-size: 14.5px;
          font-weight: 600;
          color: #1c1917;
          margin: 0;
        }

        .item-specs-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #78716c;
          flex-wrap: wrap;
        }

        .specs-dot {
          color: #d6d3d1;
          font-size: 10px;
        }

        .item-service-note {
          font-size: 12px;
          color: #b45309;
          background-color: #fffbeb;
          padding: 3px 8px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 2px;
          width: fit-content;
        }

        .item-warranty-badge {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 600;
          color: #0369a1;
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 2px 8px;
          border-radius: 4px;
          margin-top: 2px;
          width: fit-content;
        }

        .item-price-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
          min-width: 140px;
        }

        .item-current-price {
          font-size: 15px;
          font-weight: 700;
          color: #1c1917;
        }

        .item-discount-text {
          font-size: 11px;
          color: #ea580c;
          font-weight: 500;
        }

        .item-original-price {
          font-size: 12px;
          color: #a8a29e;
          text-decoration: line-through;
        }

        /* Order Card Footer */
        .order-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 20px;
          background-color: #fafaf9;
          border-top: 1px solid #f0eee9;
          flex-wrap: wrap;
          gap: 14px;
        }

        .order-total-group {
          font-size: 13.5px;
        }

        .total-lbl {
          color: #57534e;
        }

        .total-price-text {
          font-size: 16px;
          font-weight: 700;
          color: #1c1917;
        }

        .order-actions-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-order-action {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.4px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-black-solid {
          background-color: #1c1917;
          color: #ffffff;
          border: 1px solid #1c1917;
          text-transform: uppercase;
        }

        .btn-black-solid:hover {
          background-color: #000000;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }

        .btn-dark-outline {
          background-color: transparent;
          color: #1c1917;
          border: 1.5px solid #1c1917;
          text-transform: uppercase;
        }

        .btn-dark-outline:hover {
          background-color: #1c1917;
          color: #ffffff;
        }

        .btn-gold-outline {
          background-color: #fffbeb;
          color: #b45309;
          border: 1.5px solid #fde68a;
        }

        .btn-gold-outline:hover {
          background-color: #fef3c7;
          border-color: #f59e0b;
        }

        .btn-neutral-outline {
          background-color: #ffffff;
          color: #4b5563;
          border: 1px solid #d1d5db;
        }

        .btn-neutral-outline:hover {
          background-color: #f9fafb;
          color: #111827;
          border-color: #9ca3af;
        }

        /* Pagination Styles */
        .orders-pagination-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #f1f3f5;
          font-size: 12.5px;
          color: #78716c;
          flex-wrap: wrap;
          gap: 14px;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pagination-btn {
          border: 1px solid #e7e5e4;
          background-color: #ffffff;
          color: #44403c;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: #1c1917;
          color: #1c1917;
        }

        .pagination-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .pagination-num-btn {
          min-width: 34px;
          text-align: center;
        }

        .pagination-num-btn.active {
          background-color: #1c1917;
          color: #ffffff;
          border-color: #1c1917;
        }

        /* Modals Styles */
        .profile-modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }

        .profile-modal-box {
          background-color: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          padding: 26px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f1f3f5;
        }

        .modal-super-title {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #78716c;
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }

        .modal-super-title.gold-text {
          color: #d97706;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #1c1917;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #78716c;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.15s;
        }

        .modal-close-btn:hover {
          background-color: #f5f5f4;
          color: #1c1917;
        }

        /* Khối thông tin người đặt & nhận hàng */
        .tracking-customer-box {
          background-color: #fafaf9;
          border: 1px solid #f0eee9;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 14px;
        }

        .tracking-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f1f3f5;
        }

        .tracking-sub-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #1c1917;
          text-transform: uppercase;
        }

        .tracking-order-badge {
          font-size: 10.5px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .customer-info-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12.5px;
        }

        .customer-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .info-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #44403c;
        }

        .customer-address-row {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          color: #57534e;
          font-size: 12px;
          line-height: 1.4;
          margin-top: 2px;
        }

        .cell-icon {
          color: #78716c;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .cell-label {
          color: #78716c;
          font-weight: 500;
        }

        .cell-value {
          color: #1c1917;
        }

        .tracking-modal-card {
          background-color: #fafaf9;
          border: 1px solid #f0eee9;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .carrier-badge-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          margin-bottom: 10px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .carrier-name {
          font-weight: 700;
          color: #1c1917;
        }

        .carrier-code {
          color: #78716c;
          font-family: monospace;
          background: #ffffff;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #e7e5e4;
        }

        .shipper-info-box {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #57534e;
          border-top: 1px dashed #e7e5e4;
          padding-top: 10px;
        }

        .shipper-info-box.pending-shipper {
          color: #78716c;
          font-size: 11.5px;
          line-height: 1.4;
        }

        .shipper-info-box.pending-shipper .pending-icon {
          color: #d97706;
          flex-shrink: 0;
        }

        .shipper-info-box.pending-shipper .pending-note strong {
          color: #1c1917;
        }

        .timeline-section-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #1c1917;
          margin: 0 0 14px;
        }

        .tracking-history-timeline {
          margin-bottom: 24px;
          position: relative;
          padding-left: 18px;
        }

        .history-step {
          position: relative;
          padding-bottom: 18px;
          border-left: 2px solid #e7e5e4;
          padding-left: 16px;
        }

        .history-step:last-child {
          border-left: 2px solid transparent;
          padding-bottom: 0;
        }

        .history-dot {
          position: absolute;
          left: -7px;
          top: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #d6d3d1;
          border: 2px solid #ffffff;
        }

        .history-step.active .history-dot {
          background-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.2);
        }

        .history-time {
          font-size: 11px;
          font-weight: 700;
          color: #78716c;
          display: block;
          margin-bottom: 2px;
        }

        .history-step.active .history-time {
          color: #d97706;
        }

        .history-text {
          font-size: 12.5px;
          color: #1c1917;
          margin: 0;
          line-height: 1.45;
        }

        .review-reward-banner {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          color: #b45309;
          margin-bottom: 18px;
        }

        .review-product-preview {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          background-color: #fafaf9;
          border-radius: 8px;
          margin-bottom: 18px;
        }

        .review-thumb {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 6px;
        }

        .review-prod-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #1c1917;
          margin: 0 0 2px;
        }

        .review-prod-specs {
          font-size: 11.5px;
          color: #78716c;
        }

        .review-rating-stars {
          margin-bottom: 18px;
        }

        .rating-prompt {
          font-size: 12.5px;
          font-weight: 600;
          color: #1c1917;
          display: block;
          margin-bottom: 8px;
        }

        .stars-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .star-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #d6d3d1;
          cursor: pointer;
          transition: transform 0.15s, color 0.15s;
          padding: 0;
        }

        .star-btn.selected {
          color: #f59e0b;
        }

        .star-btn:hover {
          transform: scale(1.15);
        }

        .rating-label-text {
          font-size: 12px;
          font-weight: 600;
          color: #b45309;
          margin-left: 6px;
        }

        .review-quick-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .quick-tag-chip {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 11.5px;
          border: 1px solid #e7e5e4;
          background-color: #ffffff;
          color: #57534e;
          cursor: pointer;
          transition: all 0.15s;
        }

        .quick-tag-chip.active {
          background-color: #1c1917;
          color: #ffffff;
          border-color: #1c1917;
        }

        .review-textarea-wrap {
          margin-bottom: 20px;
        }

        .review-textarea {
          width: 100%;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12.5px;
          font-family: inherit;
          color: #1c1917;
          outline: none;
          resize: vertical;
        }

        .review-textarea:focus {
          border-color: #1c1917;
        }

        .modal-footer-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-modal-cancel {
          background-color: #f5f5f4;
          color: #57534e;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-modal-primary {
          background-color: #1c1917;
          color: #ffffff;
          border: none;
          padding: 10px 22px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.4px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-modal-primary:hover {
          background-color: #000000;
        }

        .warranty-content {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 24px;
        }

        .warranty-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .gold-icon {
          color: #d97706;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .warranty-item h5 {
          font-size: 13.5px;
          font-weight: 700;
          color: #1c1917;
          margin: 0 0 4px;
        }

        .warranty-item p {
          font-size: 12px;
          color: #57534e;
          margin: 0;
          line-height: 1.5;
        }

        /* Responsive Media Queries */
        @media (max-width: 1024px) {
          .profile-hero-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
          }

          .hero-banner-right {
            width: 100%;
          }

          .stats-box {
            width: 100%;
            justify-content: space-around;
          }

          .profile-content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .form-fields-2col,
          .vouchers-grid {
            grid-template-columns: 1fr;
          }

          .profile-main-card {
            padding: 24px 20px;
          }

          .stats-box {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .stat-divider {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;

/**
 * ==============================================================================
 * DỊCH VỤ DỮ LIỆU & API LOOKBOOK (LOOKBOOK SERVICE)
 * ==============================================================================
 * Cung cấp:
 * 1. Các phương thức gọi API Backend (MySQL Database qua axiosClient):
 *    - getLookbooks, getLookbookById, createLookbook, updateLookbook, deleteLookbook
 *    - toggleStatus, updatePosition, bulkDeleteLookbooks
 * 2. Các hàm tiện ích: getLookbookPositionValue, notifyLookbookUpdated
 * ==============================================================================
 */

import axiosClient from './axiosClient';

/**
 * Hàm tính giá trị số đại diện cho vị trí hiển thị:
 * - 'banner' / 'BANNER' -> Trả về 0 (ưu tiên hiển thị trên cùng)
 * - '1', '2', '3'... -> Trả về số tương ứng (1, 2, 3...)
 * - Không xác định -> Trả về 999 (xếp cuối cùng)
 */
export const getLookbookPositionValue = (pos) => {
  if (pos === 'banner' || pos === 'BANNER' || pos === 0) return 0;
  const n = Number(pos);
  return isNaN(n) ? 999 : n;
};

export const getLookCodeByPosition = (pos) => {
  const p = String(pos || '').trim().toLowerCase();
  if (p === 'banner') return 'BANNER';
  const num = parseInt(p, 10);
  return isNaN(num) ? p.toUpperCase() : `LOOK ${num < 10 ? '0' + num : num}`;
};

export const getLookbookCodeByPosition = (pos) => {
  const p = String(pos || '').trim().toLowerCase();
  if (p === 'banner') return 'LB - BANNER';
  const num = parseInt(p, 10);
  return isNaN(num) ? `LB - ${p.toUpperCase()}` : `LB - LOOK${num < 10 ? '0' + num : num}`;
};

export const getSectionRoleByPosition = (pos) => {
  const p = String(pos || '').trim().toLowerCase();
  if (p === 'banner') return 'Khối Banner';
  const num = parseInt(p, 10);
  return isNaN(num) ? `Khối Look ${p}` : `Khối Look ${num < 10 ? '0' + num : num}`;
};

/**
 * Phát sự kiện thông báo cập nhật Lookbook giữa các trang trong ứng dụng
 */
export const notifyLookbookUpdated = () => {
  localStorage.setItem('lookbook_updated_at', Date.now().toString());
  window.dispatchEvent(new CustomEvent('lookbook-updated'));
};

/**
 * DỊCH VỤ API LOOKBOOK KẾT NỐI VỚI BACKEND MYSQL
 */
export const lookbookService = {
  // Lấy tất cả lookbook (hỗ trợ search, status)
  getLookbooks: async (params = {}) => {
    const response = await axiosClient.get('/lookbooks', { params });
    return response.data;
  },

  // Lấy chi tiết lookbook theo ID
  getLookbookById: async (id) => {
    const response = await axiosClient.get(`/lookbooks/${id}`);
    return response.data;
  },

  // Tạo mới lookbook
  createLookbook: async (data) => {
    const isFormData = data instanceof FormData;
    const response = await axiosClient.post('/lookbooks', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Cập nhật lookbook
  updateLookbook: async (id, data) => {
    const isFormData = data instanceof FormData;
    const response = await axiosClient.put(`/lookbooks/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Xóa 1 lookbook
  deleteLookbook: async (id) => {
    const response = await axiosClient.delete(`/lookbooks/${id}`);
    return response.data;
  },

  // Bật/tắt trạng thái hiển thị (published <-> hidden)
  toggleStatus: async (id) => {
    const current = await lookbookService.getLookbookById(id);
    const itemData = current?.data || current;
    const newStatus = (itemData?.status === 'published' || itemData?.status === 'PUBLISHED') ? 'hidden' : 'published';
    const response = await axiosClient.put(`/lookbooks/${id}`, { status: newStatus });
    return response.data;
  },

  // Đổi thứ tự vị trí hiển thị
  updatePosition: async (id, newPos) => {
    const response = await axiosClient.put(`/lookbooks/${id}`, { position: String(newPos) });
    return response.data;
  },

  // Hoán đổi vị trí hiển thị giữa 2 lookbook
  swapPositions: async (id1, id2) => {
    const response = await axiosClient.put('/lookbooks/swap-positions', { id1, id2 });
    return response.data;
  },

  // Xóa danh sách nhiều lookbook
  bulkDeleteLookbooks: async (ids = []) => {
    const results = await Promise.all(
      ids.map(id => axiosClient.delete(`/lookbooks/${id}`))
    );
    return results;
  },

  getLookbookPositionValue,
  notifyLookbookUpdated
};

export default lookbookService;


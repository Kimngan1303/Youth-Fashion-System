import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Star, 
  Tag, 
  X, 
  Check, 
  Sparkles,
  ExternalLink,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { getStoredLookbooks, saveStoredLookbooks, resetToDefaultLookbooks, getLookbookPositionValue } from '../../services/lookbookData';
import { useToast } from '../../context/ToastContext';
import { useConfirmModal } from '../../context/ConfirmModalContext';

// ============================================================================
// [PHẦN 1] KHỞI TẠO COMPONENT QUẢN LÝ LOOKBOOK (LOOKBOOK MANAGEMENT)
// - Mục đích: Trang quản trị nội dung Lookbook cho phép Quản lý (Manager):
//   1. Xem danh sách toàn bộ các tuyển tập Lookbook
//   2. Đổi thứ tự vị trí hiển thị (Banner, 1, 2, 3, 4...) tự động đồng bộ sang Trang chủ và Trang Lookbook
//   3. Tạo mới, chỉnh sửa thông tin, giá bán, gắn danh sách sản phẩm phối đồ (tag)
//   4. Ẩn/hiện (Phát hành/Tạm ẩn), xóa hoặc khôi phục mặc định ban đầu
// ============================================================================
export default function LookbookManagement() {
  const { showSuccess, showWarning } = useToast();
  const { confirmModal } = useConfirmModal();

  // [STATE] Danh sách lookbook đọc trực tiếp từ LocalStorage qua dịch vụ lookbookData.js
  const [lookbooks, setLookbooks] = useState(() => getStoredLookbooks());

  // [HÀM ĐỒNG BỘ] Cập nhật danh sách lookbook vào state đồng thời lưu LocalStorage và báo tin cho toàn app
  const updateLookbooks = (newItems) => {
    setLookbooks(newItems);
    saveStoredLookbooks(newItems);
  };

  // [STATE] Tab lọc trạng thái: 'all' (tất cả), 'published' (đã phát hành), 'hidden' (tạm ẩn)
  const [currentTab, setCurrentTab] = useState('all');

  // [STATE] Từ khóa tìm kiếm (tìm theo tiêu đề, mã code, mùa chiến dịch)
  const [searchQuery, setSearchQuery] = useState('');

  // [STATE] Tiêu chí sắp xếp: 'position' (theo thứ tự điều khiển), 'newest' (mới nhất), 'productCount' (số SP), 'oldest' (cũ nhất)
  const [sortBy, setSortBy] = useState('position');

  // [STATE] Danh sách ID các lookbook đang được tích chọn (để xóa hàng loạt)
  const [selectedIds, setSelectedIds] = useState([]);

  // [STATE] Phân trang (Trang hiện tại và số phần tử mỗi trang)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // [STATE] Quản lý trạng thái đóng/mở các Modal
  const [isModalOpen, setIsModalOpen] = useState(false);       // Modal Thêm mới / Sửa
  const [editingLookbook, setEditingLookbook] = useState(null); // Dữ liệu lookbook đang chỉnh sửa (null nếu tạo mới)
  const [previewLookbook, setPreviewLookbook] = useState(null); // Dữ liệu lookbook đang xem trước (Preview)

  // [STATE] Dữ liệu form nhập liệu trong Modal Tạo / Sửa
  const [formData, setFormData] = useState({
    title: '',         // Tên tuyển tập / trang phục
    code: '',          // Mã lookbook (LB - LOOK01...)
    lookCode: '',      // Nhãn Look (LOOK 01 hoặc BANNER)
    sectionRole: '',   // Vị trí khối điều khiển trên giao diện
    season: '',        // Phong cách / Mùa chiến dịch
    badge: '',         // Nhãn phụ (MỚI, ICONIC...)
    position: '1',     // Thứ tự hiển thị: 'banner', 1, 2, 3...
    productCount: 1,   // Số lượng sản phẩm
    price: '',         // Giá hiển thị combo
    status: 'published', // Trạng thái: 'published' (phát hành) | 'hidden' (tạm ẩn)
    image: '',         // Link ảnh URL
    description: '',   // Mô tả cảm hứng / chất liệu
    products: []       // Danh sách từng sản phẩm phối đồ gắn kèm
  });

  // ==========================================================================
  // [PHẦN 2] TÍNH TOÁN CÁC CHỈ SỐ THỐNG KÊ (METRICS / STATS)
  // ==========================================================================
  const totalCount = lookbooks.length;
  const publishedCount = lookbooks.filter(lb => lb.status === 'published').length;
  const hiddenCount = lookbooks.filter(lb => lb.status === 'hidden').length;
  
  // ==========================================================================
  // [PHẦN 3] TÌM LOOKBOOK NỔI BẬT NHẤT & BỘ LỌC DỮ LIỆU
  // ==========================================================================
  // Tìm lookbook nổi bật đại diện (ưu tiên vị trí số 1, hoặc mục đầu tiên không phải banner)
  const prominentLookbook = useMemo(() => {
    return lookbooks.find(lb => String(lb.position) === '1') || lookbooks.find(lb => lb.position !== 'banner') || lookbooks[0];
  }, [lookbooks]);

  // Bộ lọc danh sách Lookbook dựa trên Tab trạng thái, từ khóa tìm kiếm và tùy chọn sắp xếp
  const filteredLookbooks = useMemo(() => {
    let result = [...lookbooks];

    // [BƯỚC 1] Lọc theo Tab trạng thái ('published' = Phát hành | 'hidden' = Tạm ẩn)
    if (currentTab === 'published') {
      result = result.filter(lb => lb.status === 'published');
    } else if (currentTab === 'hidden') {
      result = result.filter(lb => lb.status === 'hidden');
    }

    // [BƯỚC 2] Lọc theo từ khóa tìm kiếm (tìm kiếm không phân biệt hoa thường)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(lb => 
        lb.title.toLowerCase().includes(q) ||
        lb.code.toLowerCase().includes(q) ||
        lb.season.toLowerCase().includes(q)
      );
    }

    // [BƯỚC 3] Sắp xếp danh sách
    if (sortBy === 'newest') {
      result.sort((a, b) => b.id - a.id); // ID lớn hơn tạo sau -> mới nhất
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => a.id - b.id); // ID nhỏ hơn -> cũ nhất
    } else if (sortBy === 'position') {
      // Sắp xếp theo chuẩn thứ tự vị trí: Banner lên đầu tiên, sau đó đến 1, 2, 3, 4, 5...
      result.sort((a, b) => getLookbookPositionValue(a.position) - getLookbookPositionValue(b.position));
    } else if (sortBy === 'productCount') {
      result.sort((a, b) => b.productCount - a.productCount); // Nhiều sản phẩm phối nhất lên đầu
    }

    return result;
  }, [lookbooks, currentTab, searchQuery, sortBy]);

  // [PHÂN TRANG] Tính toán tổng số trang và cắt danh sách cho trang hiện tại
  const totalPages = Math.ceil(filteredLookbooks.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLookbooks.slice(start, start + itemsPerPage);
  }, [filteredLookbooks, currentPage, itemsPerPage]);

  // ==========================================================================
  // [PHẦN 4] XỬ LÝ CHỌN CHECKBOX VÀ XÓA LOOKBOOK
  // ==========================================================================
  // Kiểm tra xem tất cả các mục trên trang hiện tại đã được chọn hay chưa
  const isAllSelected = currentItems.length > 0 && currentItems.every(item => selectedIds.includes(item.id));

  // Chọn hoặc bỏ chọn tất cả các mục trên trang hiện tại
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = currentItems.map(item => item.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = currentItems.map(item => item.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  // Chọn hoặc bỏ chọn một lookbook đơn lẻ
  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // [HÀM XÓA NHIỀU MỤC] Xóa hàng loạt các lookbook đang được tích chọn
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmModal({
      title: 'Xóa danh sách Lookbook',
      message: `Bạn có chắc chắn muốn xóa ${selectedIds.length} lookbook đã chọn không? Hành động này không thể hoàn tác.`,
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      variant: 'danger'
    });

    if (confirmed) {
      const updated = lookbooks.filter(lb => !selectedIds.includes(lb.id));
      updateLookbooks(updated);
      setSelectedIds([]);
      if (currentPage > 1 && currentItems.length === selectedIds.length) {
        setCurrentPage(currentPage - 1);
      }
      showSuccess(`Đã xóa ${selectedIds.length} lookbook thành công!`);
    }
  };

  // [HÀM XÓA 1 MỤC] Xóa đơn lẻ một lookbook theo ID
  const handleDeleteOne = async (id) => {
    const confirmed = await confirmModal({
      title: 'Xóa Lookbook',
      message: 'Bạn có chắc chắn muốn xóa lookbook này không? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa lookbook',
      cancelText: 'Hủy bỏ',
      variant: 'danger'
    });

    if (confirmed) {
      const updated = lookbooks.filter(lb => lb.id !== id);
      updateLookbooks(updated);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      showSuccess('Đã xóa lookbook thành công!');
    }
  };

  // ==========================================================================
  // [PHẦN 5] BẬT/TẮT TRẠNG THÁI & ĐỔI THỨ TỰ VỊ TRÍ (HOÁN ĐỔI TỰ ĐỘNG)
  // ==========================================================================
  // Chuyển đổi trạng thái Phát hành <-> Tạm ẩn cho một lookbook
  const handleToggleStatus = (id) => {
    const updated = lookbooks.map(lb => {
      if (lb.id === id) {
        return {
          ...lb,
          status: lb.status === 'published' ? 'hidden' : 'published'
        };
      }
      return lb;
    });
    updateLookbooks(updated);
  };

  // [LOGIC ĐỔI VỊ TRÍ ĐẶC BIỆT] Tự động hoán đổi vị trí khi người dùng chọn vị trí mới
  // Ví dụ: Look A đang ở vị trí #1, nếu chọn sang #2 thì Look B đang ở #2 sẽ tự động chuyển về #1
  const handleUpdatePosition = (id, newPos) => {
    const target = newPos === 'banner' ? 'banner' : Number(newPos);
    const currentItem = lookbooks.find(lb => lb.id === id);
    if (!currentItem || String(currentItem.position) === String(target)) return;
    const oldPos = currentItem.position;

    // Tìm xem đã có lookbook nào đang giữ vị trí đích 'target' hay chưa
    const existingWithTarget = lookbooks.find(lb => lb.id !== id && String(lb.position) === String(target));

    const updated = lookbooks.map(lb => {
      // 1. Cập nhật vị trí mới cho item hiện tại
      if (lb.id === id) {
        return { 
          ...lb, 
          position: target,
          lookCode: target === 'banner' ? 'BANNER' : (lb.lookCode === 'BANNER' ? `LOOK 0${target}` : lb.lookCode),
          sectionRole: target === 'banner' 
            ? 'Banner (Ảnh trên cùng - Hero Cover đầu trang)' 
            : (lb.sectionRole && lb.sectionRole.includes('Banner') ? `Khối Look 0${target} trên trang` : lb.sectionRole)
        };
      }
      // 2. Nếu có item đang giữ vị trí đó, hoán đổi nó về vị trí cũ 'oldPos' của item hiện tại
      if (existingWithTarget && lb.id === existingWithTarget.id) {
        return { 
          ...lb, 
          position: oldPos,
          lookCode: oldPos === 'banner' ? 'BANNER' : (lb.lookCode === 'BANNER' ? `LOOK 0${oldPos}` : lb.lookCode),
          sectionRole: oldPos === 'banner'
            ? 'Banner (Ảnh trên cùng - Hero Cover đầu trang)'
            : (lb.sectionRole && lb.sectionRole.includes('Banner') ? `Khối Look 0${oldPos} trên trang` : lb.sectionRole)
        };
      }
      return lb;
    });
    updateLookbooks(updated);
  };

  // ==========================================================================
  // [PHẦN 6] QUẢN LÝ DANH SÁCH SẢN PHẨM PHỐI ĐỒ (GẮN TAGS)
  // - Cho phép thêm dòng mới, sửa tên/giá và xóa dòng sản phẩm phối
  // ==========================================================================
  // Thêm một dòng sản phẩm rỗng vào form
  const handleAddProductRow = () => {
    setFormData(prev => ({
      ...prev,
      products: [...(prev.products || []), { name: '', price: '' }]
    }));
  };

  // Cập nhật tên hoặc giá của từng sản phẩm phối theo index
  const handleProductChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev.products || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, products: updated };
    });
  };

  // Xóa một dòng sản phẩm phối theo index
  const handleRemoveProductRow = (index) => {
    setFormData(prev => ({
      ...prev,
      products: (prev.products || []).filter((_, i) => i !== index)
    }));
  };

  // ==========================================================================
  // [PHẦN 7] MỞ MODAL VÀ LƯU DỮ LIỆU FORM (TẠO MỚI / CHỈNH SỬA)
  // ==========================================================================
  // Mở Modal Tạo mới với giá trị khởi tạo tự động
  const handleOpenCreate = () => {
    setEditingLookbook(null);
    const nextPos = lookbooks.length + 1;
    setFormData({
      title: '',
      code: `LB - LOOK0${nextPos}`,
      lookCode: `LOOK 0${nextPos}`,
      sectionRole: `Khối Look 0${nextPos} bổ sung trên trang`,
      season: 'PHONG CÁCH THU ĐÔNG',
      badge: 'MỚI',
      position: String(nextPos),
      productCount: 2,
      price: '3.000.000₫',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=1000',
      description: '',
      products: [
        { name: '', price: '' }
      ]
    });
    setIsModalOpen(true);
  };

  // Mở Modal Chỉnh sửa với dữ liệu sẵn có của Lookbook được chọn
  const handleOpenEdit = (lookbook) => {
    setEditingLookbook(lookbook);
    const initialProducts = lookbook.products && Array.isArray(lookbook.products) 
      ? lookbook.products.map(p => ({ ...p })) 
      : [];

    setFormData({
      title: lookbook.title,
      code: lookbook.code || '',
      lookCode: lookbook.lookCode || '',
      sectionRole: lookbook.sectionRole || '',
      season: lookbook.season || '',
      badge: lookbook.badge || '',
      position: lookbook.position === 'banner' ? 'banner' : String(lookbook.position),
      productCount: initialProducts.length > 0 ? initialProducts.length : (lookbook.productCount || 1),
      price: lookbook.price || '',
      status: lookbook.status,
      image: lookbook.image,
      description: lookbook.description || '',
      products: initialProducts
    });
    setIsModalOpen(true);
  };

  // [HÀM LƯU FORM] Xử lý khi nhấn nút "Lưu Thay Đổi" hoặc "Tạo Lookbook"
  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showWarning('Vui lòng nhập tên tuyển tập Lookbook!');
      return;
    }

    const pos = formData.position === 'banner' ? 'banner' : Number(formData.position);
    
    // Nếu là Banner thì danh sách sản phẩm phối là rỗng (vì Banner là ảnh bìa lớn)
    const cleanedProducts = pos === 'banner'
      ? []
      : (formData.products || []).filter(p => p.name.trim() || p.price.trim());
    const count = cleanedProducts.length > 0 ? cleanedProducts.length : (Number(formData.productCount) || 1);
    const autoLookCode = pos === 'banner' ? 'BANNER' : (formData.lookCode && formData.lookCode !== 'BANNER' ? formData.lookCode : `LOOK 0${pos}`);

    if (editingLookbook) {
      // Trường hợp Chỉnh sửa: Cập nhật lookbook có id tương ứng
      const updated = lookbooks.map(lb => {
        if (lb.id === editingLookbook.id) {
          return {
            ...lb,
            ...formData,
            lookCode: autoLookCode,
            position: pos,
            productCount: count,
            products: cleanedProducts
          };
        }
        return lb;
      });
      updateLookbooks(updated);
      showSuccess('Đã cập nhật bộ sưu tập Lookbook thành công!');
    } else {
      // Trường hợp Tạo mới: Thêm bản ghi mới với ID sinh theo timestamp
      const newLookbook = {
        id: Date.now(),
        ...formData,
        lookCode: autoLookCode,
        position: pos,
        productCount: count,
        conversionRate: '0%',
        products: cleanedProducts
      };
      updateLookbooks([...lookbooks, newLookbook]);
      showSuccess('Đã tạo bộ sưu tập Lookbook mới thành công!');
    }

    setIsModalOpen(false);
  };

  return (
    <div className="lookbook-page-container">
      {/* Inline styles specifically tailored for Lookbook Management */}
      <style>{`
        .lookbook-page-container {
          padding: 28px;
          width: 100%;
          box-sizing: border-box;
          background: #F7F6F3;
          min-height: calc(100vh - 60px);
          font-family: 'Inter', sans-serif;
        }

        /* Top Breadcrumb & Title */
        .lb-breadcrumb {
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #8C857B;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .lb-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .lb-main-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #111111;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .btn-create-lookbook {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #111111;
          color: #FFFFFF;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        }

        .btn-create-lookbook:hover {
          background: #27272A;
          transform: translateY(-1px);
        }

        /* 3 Summary Metric Cards Grid */
        .lb-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .lb-stat-card {
          background: #FFFFFF;
          border: 1px solid #ECEAE4;
          border-radius: 12px;
          padding: 20px 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .lb-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .lb-stat-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #78716C;
        }

        .lb-stat-icon-badge {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #F5F5F4;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #44403C;
        }

        .lb-stat-icon-badge.gold {
          background: #FEF3C7;
          color: #D97706;
        }

        .lb-stat-value {
          font-size: 22px;
          font-weight: 700;
          color: #111111;
          line-height: 1.25;
          margin-bottom: 8px;
        }

        .lb-stat-value.serif {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 17px;
          font-weight: 700;
        }

        .lb-stat-subtext {
          font-size: 12px;
          color: #78716C;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 14px;
        }

        .lb-stat-progress-bg {
          width: 100%;
          height: 4px;
          background: #E7E5E4;
          border-radius: 999px;
          overflow: hidden;
        }

        .lb-stat-progress-fill {
          height: 100%;
          border-radius: 999px;
        }

        /* Filter, Search & Table Container */
        .lb-table-card {
          background: #FFFFFF;
          border: 1px solid #ECEAE4;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
          overflow: hidden;
        }

        /* Filter Top Toolbar */
        .lb-toolbar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #F0EEE9;
        }

        .lb-filter-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lb-tab-btn {
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #57534E;
          padding: 7px 16px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .lb-tab-btn:hover {
          background: #F5F4EF;
          color: #111111;
        }

        .lb-tab-btn.active {
          background: #111111;
          color: #FFFFFF;
        }

        .lb-bulk-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
        }

        .lb-selected-count {
          color: #78716C;
        }

        .btn-bulk-delete {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border: 1px solid #FECACA;
          background: #FEF2F2;
          color: #DC2626;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-bulk-delete:hover:not(:disabled) {
          background: #FEE2E2;
          border-color: #F87171;
        }

        .btn-bulk-delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          border-color: #F3F4F6;
          background: #F9FAFB;
          color: #9CA3AF;
        }

        /* Search & Sort Bar */
        .lb-toolbar-search-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          gap: 16px;
          background: #FFFFFF;
          border-bottom: 1px solid #F0EEE9;
        }

        .lb-search-input-wrapper {
          position: relative;
          flex: 1;
        }

        .lb-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #A8A29E;
        }

        .lb-search-input {
          width: 100%;
          box-sizing: border-box;
          padding: 9px 14px 9px 40px;
          border: 1px solid #E7E5E4;
          border-radius: 8px;
          font-size: 13px;
          color: #1C1917;
          background: #FFFFFF;
          outline: none;
          transition: border-color 0.2s;
        }

        .lb-search-input:focus {
          border-color: #111111;
        }

        .lb-sort-group {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #78716C;
          white-space: nowrap;
        }

        .lb-sort-select {
          padding: 8px 12px;
          border: 1px solid #E7E5E4;
          border-radius: 8px;
          background: #FFFFFF;
          font-size: 13px;
          color: #1C1917;
          font-weight: 500;
          outline: none;
          cursor: pointer;
        }

        /* Data Table */
        .lb-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .lb-table th {
          background: #FAFAF9;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #78716C;
          padding: 14px 18px;
          border-bottom: 1px solid #ECEAE4;
        }

        .lb-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #F4F2EC;
          vertical-align: middle;
          font-size: 13px;
          color: #1C1917;
        }

        .lb-table tr:hover td {
          background: #FBFBFA;
        }

        .lb-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #111111;
          cursor: pointer;
        }

        /* Lookbook Title & Thumbnail column */
        .lb-item-cell {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .lb-thumb-img {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #E5E7EB;
          background: #F3F4F6;
          flex-shrink: 0;
        }

        .lb-title-text {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 14px;
          font-weight: 700;
          color: #111111;
          margin-bottom: 3px;
          line-height: 1.3;
        }

        .lb-meta-text {
          font-size: 11.5px;
          color: #78716C;
          font-family: 'Inter', sans-serif;
        }

        /* Position Badge */
        .lb-position-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .lb-position-badge.top-rank {
          background: #111111;
          color: #FFFFFF;
        }

        .lb-position-badge.normal-rank {
          background: #F5F5F4;
          color: #57534E;
          border: 1px solid #E7E5E4;
        }

        /* Product count & mini bar */
        .lb-product-count-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 90px;
        }

        .lb-product-count-text {
          font-weight: 600;
          font-size: 13px;
          color: #1C1917;
        }

        .lb-product-bar-bg {
          width: 65px;
          height: 4px;
          background: #E5E7EB;
          border-radius: 999px;
          overflow: hidden;
        }

        .lb-product-bar-fill {
          height: 100%;
          background: #111111;
          border-radius: 999px;
        }

        .lb-product-bar-fill.muted {
          background: #9CA3AF;
        }

        /* Status Badge */
        .lb-status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .lb-status-pill.published {
          background: #DCFCE7;
          color: #15803D;
        }

        .lb-status-pill.published:hover {
          background: #BBF7D0;
        }

        .lb-status-pill.hidden {
          background: #F3F4F6;
          color: #6B7280;
        }

        .lb-status-pill.hidden:hover {
          background: #E5E7EB;
        }

        /* Action Buttons */
        .lb-actions-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lb-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          color: #78716C;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .lb-action-btn:hover {
          background: #F5F5F4;
          color: #111111;
        }

        .lb-action-btn.delete {
          color: #EF4444;
        }

        .lb-action-btn.delete:hover {
          background: #FEF2F2;
          color: #DC2626;
        }

        /* Table Pagination Footer */
        .lb-pagination-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #FFFFFF;
          border-top: 1px solid #F0EEE9;
          font-size: 12.5px;
          color: #78716C;
        }

        .lb-pagination-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-page-nav {
          padding: 6px 14px;
          border: 1px solid #E7E5E4;
          background: #FFFFFF;
          color: #44403C;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-page-nav:hover:not(:disabled) {
          background: #F5F5F4;
          border-color: #D6D3D1;
        }

        .btn-page-nav:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn-page-num {
          min-width: 32px;
          height: 32px;
          padding: 0 6px;
          border-radius: 6px;
          border: 1px solid transparent;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: transparent;
          color: #44403C;
        }

        .btn-page-num:hover {
          background: #F5F5F4;
        }

        .btn-page-num.active {
          background: #111111;
          color: #FFFFFF;
        }

        /* Modal Backdrop */
        .lb-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .lb-modal-box {
          background: #FFFFFF;
          border-radius: 16px;
          width: 100%;
          max-width: 580px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .lb-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #F0EEE9;
        }

        .lb-modal-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 700;
          color: #111111;
          margin: 0;
        }

        .btn-close-modal {
          border: none;
          background: transparent;
          color: #78716C;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
        }

        .btn-close-modal:hover {
          background: #F5F5F4;
          color: #111111;
        }

        .lb-modal-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .lb-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .lb-form-label {
          font-size: 12px;
          font-weight: 600;
          color: #44403C;
        }

        .lb-form-input, .lb-form-textarea, .lb-form-select {
          padding: 10px 14px;
          border: 1px solid #E7E5E4;
          border-radius: 8px;
          font-size: 13px;
          color: #1C1917;
          outline: none;
          background: #FFFFFF;
          font-family: inherit;
        }

        .lb-form-input:focus, .lb-form-textarea:focus, .lb-form-select:focus {
          border-color: #111111;
        }

        .lb-form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .lb-img-preview-box {
          margin-top: 8px;
          width: 100%;
          height: 140px;
          border-radius: 8px;
          border: 1px dashed #D6D3D1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #FAFAF9;
        }

        .lb-img-preview-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .lb-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #F0EEE9;
          background: #FAFAF9;
          border-radius: 0 0 16px 16px;
        }

        .btn-modal-cancel {
          padding: 9px 18px;
          border: 1px solid #E7E5E4;
          background: #FFFFFF;
          color: #57534E;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-modal-submit {
          padding: 9px 20px;
          background: #111111;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-modal-submit:hover {
          background: #27272A;
        }
      `}</style>

      {/* ==================================================================== */}
      {/* [PHẦN 8] BREADCRUMB & TIÊU ĐỀ TRANG QUẢN LÝ LOOKBOOK                 */}
      {/* ==================================================================== */}
      <div className="lb-breadcrumb">
        YOUTHFASHION • QUẢN LÝ NỘI DUNG & LOOKBOOK
      </div>

      <div className="lb-header-row">
        <h1 className="lb-main-title">Quản Lý Tuyển Tập Lookbook</h1>
        <button 
          type="button" 
          className="btn-create-lookbook"
          onClick={handleOpenCreate}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Tạo Lookbook Mới</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* [PHẦN 9] 3 THẺ THỐNG KÊ TỔNG QUAN (METRIC SUMMARY CARDS)              */}
      {/* 1. Tổng tuyển tập (Bao gồm số phát hành và số tạm ẩn)               */}
      {/* 2. Lookbook nổi bật nhất (Mục đang chiếm vị trí số 1)                */}
      {/* 3. Tổng số phối đồ (Outfit) & sản phẩm được gắn tag                  */}
      {/* ==================================================================== */}
      <div className="lb-stats-grid">
        {/* THẺ 1: Tổng số lượng tuyển tập */}
        <div className="lb-stat-card">
          <div className="lb-stat-top">
            <span className="lb-stat-label">TỔNG TUYỂN TẬP</span>
            <div className="lb-stat-icon-badge">
              <ImageIcon size={16} />
            </div>
          </div>
          <div>
            <div className="lb-stat-value">{totalCount} Lookbook</div>
            <div className="lb-stat-subtext">
              Phát hành: <strong>{publishedCount < 10 ? `0${publishedCount}` : publishedCount}</strong> • Tạm ẩn: <strong>{hiddenCount < 10 ? `0${hiddenCount}` : hiddenCount}</strong>
            </div>
            <div className="lb-stat-progress-bg">
              <div 
                className="lb-stat-progress-fill" 
                style={{ 
                  width: `${(publishedCount / (totalCount || 1)) * 100}%`,
                  background: '#18181B' 
                }} 
              />
            </div>
          </div>
        </div>

        {/* THẺ 2: Tuyển tập Lookbook nổi bật nhất (Vị trí số 1) */}
        <div className="lb-stat-card">
          <div className="lb-stat-top">
            <span className="lb-stat-label">LOOKBOOK NỔI BẬT NHẤT</span>
            <div className="lb-stat-icon-badge gold">
              <Star size={16} fill="#D97706" />
            </div>
          </div>
          <div>
            <div className="lb-stat-value serif" title={prominentLookbook?.title}>
              {prominentLookbook?.title || "Fall/Winter 2025: L'Automne Éternel"}
            </div>
            <div className="lb-stat-subtext">
              <span style={{ color: '#D97706', fontSize: '15px' }}>•</span>
              <span>Đóng góp <strong>{prominentLookbook?.conversionRate || "36%"}</strong> chuyển đổi mua sắm</span>
            </div>
            <div className="lb-stat-progress-bg">
              <div 
                className="lb-stat-progress-fill" 
                style={{ width: '42%', background: '#D97706' }} 
              />
            </div>
          </div>
        </div>

        {/* THẺ 3: Tổng số Outfit & sản phẩm phối được gắn tag */}
        <div className="lb-stat-card">
          <div className="lb-stat-top">
            <span className="lb-stat-label">TỔNG OUTFIT & SẢN PHẨM GẮN TAG</span>
            <div className="lb-stat-icon-badge">
              <Tag size={16} />
            </div>
          </div>
          <div>
            <div className="lb-stat-value">8 Phối Đồ (Outfits)</div>
            <div className="lb-stat-subtext">
              Trung bình <strong>~3 sản phẩm tag</strong> / mỗi Lookbook
            </div>
            <div className="lb-stat-progress-bg">
              <div 
                className="lb-stat-progress-fill" 
                style={{ width: '68%', background: '#334155' }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* [PHẦN 10] BẢNG DỮ LIỆU LOOKBOOK & BỘ LỌC TÌM KIẾM                     */}
      {/* ==================================================================== */}
      <div className="lb-table-card">
        {/* THANH CÔNG CỤ TRÊN: Tab trạng thái & Nút thao tác hàng loạt */}
        <div className="lb-toolbar-top">
          <div className="lb-filter-tabs">
            <button
              type="button"
              className={`lb-tab-btn ${currentTab === 'all' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('all'); setCurrentPage(1); }}
            >
              Tất cả ({totalCount < 10 ? `0${totalCount}` : totalCount})
            </button>
            <button
              type="button"
              className={`lb-tab-btn ${currentTab === 'published' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('published'); setCurrentPage(1); }}
            >
              Phát hành ({publishedCount < 10 ? `0${publishedCount}` : publishedCount})
            </button>
            <button
              type="button"
              className={`lb-tab-btn ${currentTab === 'hidden' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('hidden'); setCurrentPage(1); }}
            >
              Tạm ẩn ({hiddenCount < 10 ? `0${hiddenCount}` : hiddenCount})
            </button>
          </div>

          <div className="lb-bulk-actions">
            {/* Nút khôi phục dữ liệu lookbook gốc */}
            <button
              type="button"
              className="btn-reset-defaults"
              onClick={async () => {
                const confirmed = await confirmModal({
                  title: 'Khôi phục cấu hình chuẩn',
                  message: 'Khôi phục danh sách lookbook về cấu hình chuẩn ban đầu (Mục 1 đến 6 theo thiết kế)?',
                  confirmText: 'Khôi phục',
                  cancelText: 'Hủy bỏ',
                  variant: 'warning'
                });
                if (confirmed) {
                  const reset = resetToDefaultLookbooks();
                  setLookbooks(reset);
                  setSelectedIds([]);
                  showSuccess('Đã khôi phục danh sách lookbook về cấu hình chuẩn ban đầu!');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                background: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer'
              }}
              title="Khôi phục các bộ sưu tập mặc định ban đầu"
            >
              <RotateCcw size={12} />
              <span>Khôi phục mặc định</span>
            </button>
            <span style={{ color: '#E7E5E4' }}>|</span>
            <span className="lb-selected-count">
              Đã chọn: <strong>{selectedIds.length} mục</strong>
            </span>
            <span style={{ color: '#E7E5E4' }}>|</span>
            {/* Nút xóa nhiều mục đã tích chọn */}
            <button
              type="button"
              className="btn-bulk-delete"
              disabled={selectedIds.length === 0}
              onClick={handleBulkDelete}
            >
              <Trash2 size={13} />
              <span>Xóa đã chọn</span>
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* [PHẦN 10.1] THANH TÌM KIẾM VÀ TÙY CHỌN SẮP XẾP                   */}
        {/* ================================================================== */}
        <div className="lb-toolbar-search-row">
          <div className="lb-search-input-wrapper">
            <Search className="lb-search-icon" size={16} />
            <input
              type="text"
              className="lb-search-input"
              placeholder="Tìm kiếm tên lookbook, mùa chiến dịch, chủ đề..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="lb-sort-group">
            <span>Sắp xếp:</span>
            <select 
              className="lb-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="position">Thứ tự điều khiển (1, 2, 3, 4, 5...)</option>
              <option value="newest">Mới cập nhật nhất</option>
              <option value="productCount">Số lượng sản phẩm</option>
              <option value="oldest">Cũ nhất</option>
            </select>
          </div>
        </div>

        {/* ================================================================== */}
        {/* [PHẦN 10.2] BẢNG HIỂN THỊ DANH SÁCH TUYỂN TẬP LOOKBOOK             */}
        {/* ================================================================== */}
        <div style={{ overflowX: 'auto' }}>
          <table className="lb-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    className="lb-checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={{ textAlign: 'center', width: '110px' }}>THỨ TỰ (VỊ TRÍ)</th>
                <th>MỤC & LOOKBOOK ĐIỀU KHIỂN</th>
                <th style={{ width: '150px' }}>GIÁ & SẢN PHẨM</th>
                <th style={{ textAlign: 'center', width: '130px' }}>TRẠNG THÁI</th>
                <th style={{ textAlign: 'center', width: '120px' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#8C857B' }}>
                    Không tìm thấy tuyển tập Lookbook phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                currentItems.map((lb) => {
                  const isChecked = selectedIds.includes(lb.id);
                  const isTopRank = lb.position <= 3;

                  return (
                    <tr key={lb.id}>
                      {/* Cột 1: Hộp chọn Checkbox */}
                      <td>
                        <input
                          type="checkbox"
                          className="lb-checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(lb.id)}
                        />
                      </td>

                      {/* Cột 2: Lựa chọn vị trí tức thì (Banner hoặc 1, 2, 3... - Tự hoán đổi vị trí) */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <select
                            className={`lb-position-badge ${lb.position === 'banner' ? 'banner-rank' : isTopRank ? 'top-rank' : 'normal-rank'}`}
                            value={lb.position}
                            onChange={(e) => handleUpdatePosition(lb.id, e.target.value)}
                            style={{
                              cursor: 'pointer',
                              outline: 'none',
                              border: lb.position === 'banner' ? '1px solid #111827' : isTopRank ? 'none' : '1px solid #E7E5E4',
                              background: lb.position === 'banner' ? '#111827' : undefined,
                              color: lb.position === 'banner' ? '#FBBF24' : undefined,
                              textAlign: 'center',
                              padding: '4px 10px',
                              fontWeight: 700,
                              fontSize: '13px',
                              borderRadius: '6px',
                              width: 'auto',
                              height: 'auto'
                            }}
                            title={`Vị trí: ${lb.position === 'banner' ? 'Banner ảnh trên cùng' : '#' + lb.position}`}
                          >
                            <option value="banner" style={{ background: '#111827', color: '#FBBF24', fontWeight: 'bold' }}>
                              Banner
                            </option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num} style={{ background: '#FFFFFF', color: '#111111' }}>
                                {num}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Cột 3: Tên tuyển tập, nhãn Look và khối điều khiển trên giao diện */}
                      <td>
                        <div className="lb-item-cell">
                          <img
                            src={lb.image}
                            alt={lb.title}
                            className="lb-thumb-img"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600';
                            }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                background: '#111111',
                                color: '#FFFFFF',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {lb.lookCode || `LOOK 0${lb.position}`}
                              </span>
                              <div className="lb-title-text" style={{ margin: 0 }}>
                                {lb.title}
                              </div>
                            </div>
                            <div className="lb-meta-text" style={{ color: '#047857', fontWeight: 600, margin: '2px 0' }}>
                              📍 Điều khiển: {lb.sectionRole || `Khối Look ${lb.position} trên trang`}
                            </div>
                            <div className="lb-meta-text">
                              {lb.code} • {lb.season} {lb.badge && `• [${lb.badge}]`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 4: Giá bán hiển thị & Số lượng sản phẩm phối */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#111111' }}>
                            {lb.price || '5.445.000₫'}
                          </span>
                          <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                            {lb.productCount || 1} sản phẩm phối
                          </span>
                        </div>
                      </td>

                      {/* Cột 5: Nút chuyển đổi trạng thái Phát hành / Tạm ẩn */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className={`lb-status-pill ${lb.status}`}
                          onClick={() => handleToggleStatus(lb.id)}
                          title="Nhấp để chuyển Phát hành / Tạm ẩn"
                        >
                          {lb.status === 'published' ? 'Phát hành' : 'Tạm ẩn'}
                        </button>
                      </td>

                      {/* Cột 6: Các nút hành động (Xem trước, Sửa, Xóa) */}
                      <td>
                        <div className="lb-actions-group" style={{ justifyContent: 'center' }}>
                          {/* Nút Mở Modal Chỉnh sửa */}
                          <button
                            type="button"
                            className="lb-action-btn"
                            title="Chỉnh sửa thông tin"
                            onClick={() => handleOpenEdit(lb)}
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Nút Xóa Lookbook */}
                          <button
                            type="button"
                            className="lb-action-btn delete"
                            title="Xóa Lookbook"
                            onClick={() => handleDeleteOne(lb.id)}
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

        {/* ================================================================== */}
        {/* [PHẦN 10.3] PHÂN TRANG (PAGINATION)                                */}
        {/* ================================================================== */}
        <div className="lb-pagination-row">
          <div>
            Hiển thị <strong>{filteredLookbooks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLookbooks.length)}</strong> trong tổng số <strong>{filteredLookbooks.length}</strong> tuyển tập lookbook
          </div>

          <div className="lb-pagination-controls">
            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              &lt; Trang trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                type="button"
                className={`btn-page-num ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Trang sau &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* [PHẦN 11] MODAL THÊM MỚI / CHỈNH SỬA TUYỂN TẬP LOOKBOOK              */}
      {/* - Cho phép nhập tên, mục điều khiển, mùa, vị trí, giá, link ảnh      */}
      {/* - Tự động ẩn danh sách sản phẩm phối khi vị trí là Banner            */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="lb-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="lb-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="lb-modal-header">
              <h3 className="lb-modal-title">
                {editingLookbook ? 'Chỉnh Sửa Mục Lookbook' : 'Tạo Lookbook Mới'}
              </h3>
              <button 
                type="button" 
                className="btn-close-modal" 
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveForm}>
              <div className="lb-modal-form">
                {/* [MỤC 1] Tên tuyển tập / tên bộ sưu tập */}
                <div className="lb-form-group">
                  <label className="lb-form-label">Tên Mục / Tuyển Tập Lookbook *</label>
                  <input
                    type="text"
                    className="lb-form-input"
                    placeholder="VD: Áo Măng Tô Belted Dạ Camel Cashmere Quý Phái Thời Đại"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* [MỤC 2] Ghi chú vai trò điều khiển hiển thị trên giao diện */}
                <div className="lb-form-group">
                  <label className="lb-form-label">Mục điều khiển trên giao diện (Vị trí & Khối)</label>
                  <input
                    type="text"
                    className="lb-form-input"
                    placeholder="VD: Khối Look 01 (Áo Măng Tô & Nổi Bật Trang Chủ)"
                    value={formData.sectionRole}
                    onChange={(e) => setFormData({ ...formData, sectionRole: e.target.value })}
                  />
                </div>

                {/* [MỤC 3] Mùa chiến dịch & Thứ tự vị trí (Banner hoặc số 1, 2, 3...) */}
                <div className="lb-form-row-2">
                  <div className="lb-form-group">
                    <label className="lb-form-label">Phong Cách / Mùa</label>
                    <input
                      type="text"
                      className="lb-form-input"
                      placeholder="VD: PHONG CÁCH THU ĐÔNG"
                      value={formData.season}
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    />
                  </div>

                  <div className="lb-form-group">
                    <label className="lb-form-label">Thứ Tự Vị Trí (Banner, 1, 2, 3, 4...)</label>
                    <select
                      className="lb-form-select"
                      value={formData.position}
                      onChange={(e) => {
                        const newPos = e.target.value;
                        setFormData({ 
                          ...formData, 
                          position: newPos,
                          lookCode: newPos === 'banner' ? 'BANNER' : (formData.lookCode === 'BANNER' ? `LOOK 0${newPos}` : formData.lookCode)
                        });
                      }}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="banner" style={{ fontWeight: 700, color: '#D97706' }}>
                        ★ Banner (Ảnh bìa lớn trên cùng)
                      </option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          Vị trí #{num} {num === 1 ? '(Look 01 & Nổi bật Trang Chủ)' : num === 2 ? '(Look 02)' : num === 3 ? '(Look 03)' : num === 4 ? '(Look 04)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* [MỤC 4] Giá hiển thị tổng thể (Ẩn khi vị trí là Banner) */}
                {formData.position !== 'banner' && (
                  <div className="lb-form-group">
                    <label className="lb-form-label">Giá Hiển Thị / Combo</label>
                    <input
                      type="text"
                      className="lb-form-input"
                      placeholder="VD: 5.445.000₫"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                )}

                {/* [MỤC 5] Danh sách sản phẩm phối gắn tag (TỰ ĐỘNG ẨN khi vị trí là Banner) */}
                {formData.position !== 'banner' && (
                  <div className="lb-form-group" style={{ background: '#F9FAFB', padding: '14px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div>
                        <label className="lb-form-label" style={{ fontWeight: 700, fontSize: '13px', color: '#111827', display: 'block', margin: 0 }}>
                          Danh Sách Sản Phẩm Phối (Gắn Tag)
                        </label>
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>
                          Các sản phẩm hiển thị tên & giá chi tiết trong khối Lookbook
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddProductRow}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#111827',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={13} strokeWidth={2.5} /> Thêm sản phẩm
                      </button>
                    </div>

                    {formData.products && formData.products.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {formData.products.map((prod, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 38px', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="text"
                              className="lb-form-input"
                              placeholder="Tên sản phẩm (VD: Áo Khoác Tweed Ivory Cropped)"
                              value={prod.name}
                              onChange={(e) => handleProductChange(idx, 'name', e.target.value)}
                            />
                            <input
                              type="text"
                              className="lb-form-input"
                              placeholder="Giá (VD: 2.150.000₫)"
                              value={prod.price}
                              onChange={(e) => handleProductChange(idx, 'price', e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveProductRow(idx)}
                              style={{
                                background: '#FEF2F2',
                                border: '1px solid #FEE2E2',
                                borderRadius: '6px',
                                height: '38px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#EF4444',
                                cursor: 'pointer'
                              }}
                              title="Xóa sản phẩm này"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                        Chưa có sản phẩm nào trong danh sách. Bấm "+ Thêm sản phẩm" để thêm từng món đồ phối.
                      </div>
                    )}
                  </div>
                )}

                {/* [MỤC 6] Trạng thái hiển thị (Phát hành hoặc Tạm ẩn) */}
                <div className="lb-form-group">
                  <label className="lb-form-label">Trạng Thái Hiển Thị</label>
                  <select
                    className="lb-form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="published">Phát hành (Hiển thị ngay cho khách hàng)</option>
                    <option value="hidden">Tạm ẩn (Bản nháp / Lưu trữ nội bộ)</option>
                  </select>
                </div>

                {/* [MỤC 7] Đường link ảnh URL & Khung xem trước ảnh */}
                <div className="lb-form-group">
                  <label className="lb-form-label">Link Ảnh Bìa Tuyển Tập (URL)</label>
                  <input
                    type="url"
                    className="lb-form-input"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                  {formData.image && (
                    <div className="lb-img-preview-box">
                      <img src={formData.image} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  )}
                </div>

                {/* [MỤC 8] Mô tả chi tiết cảm hứng & chất liệu */}
                <div className="lb-form-group">
                  <label className="lb-form-label">Mô Tả Bộ Sưu Tập</label>
                  <textarea
                    rows="3"
                    className="lb-form-textarea"
                    placeholder="Mô tả phong cách, cảm hứng thiết kế hoặc thông điệp..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Nút hành động Modal (Hủy bỏ / Lưu thay đổi) */}
              <div className="lb-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn-modal-submit">
                  {editingLookbook ? 'Lưu Thay Đổi' : 'Tạo Lookbook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* [PHẦN 12] MODAL XEM TRƯỚC CHI TIẾT LOOKBOOK (PREVIEW DETAIL)          */}
      {/* ==================================================================== */}
      {previewLookbook && (
        <div className="lb-modal-backdrop" onClick={() => setPreviewLookbook(null)}>
          <div className="lb-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="lb-modal-header">
              <div>
                <span style={{ fontSize: '11px', color: '#78716C', fontWeight: 600 }}>
                  {previewLookbook.code} • {previewLookbook.season}
                </span>
                <h3 className="lb-modal-title" style={{ marginTop: '2px' }}>
                  {previewLookbook.title}
                </h3>
              </div>
              <button 
                type="button" 
                className="btn-close-modal" 
                onClick={() => setPreviewLookbook(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ position: 'relative', height: '220px', borderRadius: '10px', overflow: 'hidden', marginBottom: '18px' }}>
                <img
                  src={previewLookbook.image}
                  alt={previewLookbook.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span 
                  className={`lb-status-pill ${previewLookbook.status}`}
                  style={{ position: 'absolute', top: '12px', right: '12px' }}
                >
                  {previewLookbook.status === 'published' ? 'Phát hành' : 'Tạm ẩn'}
                </span>
              </div>

              <p style={{ fontSize: '13.5px', color: '#57534E', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                {previewLookbook.description || 'Bộ sưu tập thời trang thanh lịch mang đậm tinh thần của Youth Fashion.'}
              </p>

              <div style={{ background: '#FAF9F6', borderRadius: '8px', padding: '14px 16px', border: '1px solid #ECEAE4', marginBottom: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C857B', fontWeight: 600 }}>VỊ TRÍ</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>#{previewLookbook.position}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C857B', fontWeight: 600 }}>SẢN PHẨM TAG</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>{previewLookbook.productCount} SP</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C857B', fontWeight: 600 }}>CHUYỂN ĐỔI</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#D97706' }}>{previewLookbook.conversionRate || '25%'}</div>
                  </div>
                </div>
              </div>

              {previewLookbook.outfits && previewLookbook.outfits.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 10px 0' }}>
                    Danh Sách Phối Đồ (Outfits) Gắn Tag:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {previewLookbook.outfits.map((outfit, index) => (
                      <div 
                        key={index}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: '#FFFFFF',
                          border: '1px solid #E7E5E4',
                          borderRadius: '8px',
                          fontSize: '13px'
                        }}
                      >
                        <div>
                          <strong style={{ color: '#111' }}>{outfit.name}</strong>
                          <div style={{ fontSize: '11px', color: '#78716C' }}>{outfit.items} sản phẩm thành phần</div>
                        </div>
                        <span style={{ fontWeight: 600, color: '#111' }}>{outfit.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lb-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setPreviewLookbook(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-modal-submit"
                onClick={() => {
                  const target = previewLookbook;
                  setPreviewLookbook(null);
                  handleOpenEdit(target);
                }}
              >
                Chỉnh Sửa Tuyển Tập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

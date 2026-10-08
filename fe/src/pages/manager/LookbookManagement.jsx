import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  RotateCcw,
  Undo2,
  Loader2,
  Package
} from 'lucide-react';
import { lookbookService, getLookbookPositionValue, notifyLookbookUpdated } from '../../services/lookbookService';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';

// Helper: Tự động tạo nhãn Look theo số vị trí (vị trí 1 -> LOOK 01, vị trí 2 -> LOOK 02, banner -> BANNER)
export const getLookCodeByPosition = (pos) => {
  const p = String(pos || '').trim().toLowerCase();
  if (p === 'banner') return 'BANNER';
  const num = parseInt(p, 10);
  return isNaN(num) ? p.toUpperCase() : `LOOK ${num < 10 ? '0' + num : num}`;
};

// Helper: Tự động tạo tên khối điều khiển theo số vị trí (vị trí 1 -> Khối Look 01, banner -> Khối Banner)
export const getSectionRoleByPosition = (pos) => {
  const p = String(pos || '').trim().toLowerCase();
  if (p === 'banner') return 'Khối Banner';
  const num = parseInt(p, 10);
  return isNaN(num) ? `Khối Look ${p}` : `Khối Look ${num < 10 ? '0' + num : num}`;
};

// Helper: Tự động tạo mã Lookbook theo số vị trí (vị trí 1 -> LB - LOOK01, vị trí 2 -> LB - LOOK02, banner -> LB - BANNER)
export const getLookbookCodeByPosition = (pos) => {
  const p = String(pos || '').trim().toLowerCase();
  if (p === 'banner') return 'LB - BANNER';
  const num = parseInt(p, 10);
  return isNaN(num) ? `LB - ${p.toUpperCase()}` : `LB - LOOK${num < 10 ? '0' + num : num}`;
};

// ============================================================================
// [PHẦN 1] KHỞI TẠO COMPONENT QUẢN LÝ LOOKBOOK (LOOKBOOK MANAGEMENT)
// - Dữ liệu Lookbook được đọc và lưu trữ trực tiếp từ Cơ sở dữ liệu MySQL
// ============================================================================
export default function LookbookManagement() {
  const { showSuccess, showWarning, showError, showInfo } = useToast();
  const { confirmModal } = useConfirmModal();

  // [STATE] Danh sách lookbook từ MySQL database qua lookbookService
  const [lookbooks, setLookbooks] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // [STATE] Ngăn xếp lưu lịch sử các thao tác đã sửa để có thể quay lại (Undo)
  const [undoStack, setUndoStack] = useState([]);

  // [REF & STATE] Quản lý chọn 1 file ảnh từ máy tính
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // [HÀM TẢI DỮ LIỆU TỪ MYSQL]
  const fetchLookbooks = async () => {
    try {
      setIsLoading(true);
      const res = await lookbookService.getLookbooks();
      const items = res?.data || [];
      setLookbooks(items);
    } catch (err) {
      console.error('Lỗi khi tải danh sách lookbook từ database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCatalogProducts = async () => {
    try {
      const res = await productService.getProducts({ limit: 100 });
      const items = res?.data?.products || res?.products || [];
      setCatalogProducts(items);
    } catch (err) {
      console.error('Lỗi khi tải danh mục sản phẩm từ CSDL:', err);
    }
  };

  useEffect(() => {
    fetchLookbooks();
    fetchCatalogProducts();
  }, []);

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
  const totalTaggedProducts = lookbooks.reduce((sum, lb) => sum + (lb.products?.length || Number(lb.productCount) || 0), 0);
  const avgTagged = totalCount > 0 ? (totalTaggedProducts / totalCount).toFixed(1) : 0;

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

  const getPaginationPages = (page, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const delta = 1;
    const range = [];
    const pagesWithDots = [];

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    let prevPage;
    for (let i of range) {
      if (prevPage) {
        if (i - prevPage === 2) {
          pagesWithDots.push(prevPage + 1);
        } else if (i - prevPage !== 1) {
          pagesWithDots.push('...');
        }
      }
      pagesWithDots.push(i);
      prevPage = i;
    }

    return pagesWithDots;
  };

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

  // [HÀM XÓA NHIỀU MỤC] Xóa hàng loạt các lookbook đang được tích chọn khỏi MySQL
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmModal({
      title: 'Xóa danh sách Lookbook',
      message: `Bạn có chắc chắn muốn xóa ${selectedIds.length} lookbook đã chọn khỏi cơ sở dữ liệu MySQL không? Hành động này không thể hoàn tác.`,
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      variant: 'danger'
    });

    if (confirmed) {
      const itemsToDelete = lookbooks.filter(lb => selectedIds.includes(lb.id));
      try {
        await lookbookService.bulkDeleteLookbooks(selectedIds);
        setUndoStack(prev => [...prev, {
          type: 'BULK_DELETE',
          items: itemsToDelete.map(item => ({ ...item })),
          description: `Xóa ${selectedIds.length} Lookbook`
        }]);
        setSelectedIds([]);
        if (currentPage > 1 && currentItems.length === selectedIds.length) {
          setCurrentPage(currentPage - 1);
        }
        showSuccess(`Đã xóa ${selectedIds.length} lookbook khỏi MySQL thành công!`);
        notifyLookbookUpdated();
        await fetchLookbooks();
      } catch (err) {
        showWarning(err.response?.data?.message || 'Có lỗi xảy ra khi xóa danh sách Lookbook!');
      }
    }
  };

  // [HÀM XÓA 1 MỤC] Xóa đơn lẻ một lookbook theo ID khỏi MySQL
  const handleDeleteOne = async (id) => {
    const confirmed = await confirmModal({
      title: 'Xóa Lookbook',
      message: 'Bạn có chắc chắn muốn xóa lookbook này khỏi cơ sở dữ liệu MySQL không? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa lookbook',
      cancelText: 'Hủy bỏ',
      variant: 'danger'
    });

    if (confirmed) {
      const itemToDelete = lookbooks.find(lb => lb.id === id);
      try {
        await lookbookService.deleteLookbook(id);
        if (itemToDelete) {
          setUndoStack(prev => [...prev, {
            type: 'DELETE_LOOKBOOK',
            data: { ...itemToDelete },
            description: `Xóa Lookbook "${itemToDelete.title}"`
          }]);
        }
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        showSuccess('Đã xóa lookbook thành công!');
        notifyLookbookUpdated();
        await fetchLookbooks();
      } catch (err) {
        showWarning(err.response?.data?.message || 'Có lỗi xảy ra khi xóa Lookbook!');
      }
    }
  };

  // ==========================================================================
  // [PHẦN 5] BẬT/TẮT TRẠNG THÁI & ĐỔI THỨ TỰ VỊ TRÍ TRONG MYSQL
  // ==========================================================================
  // Chuyển đổi trạng thái Phát hành <-> Tạm ẩn cho một lookbook
  const handleToggleStatus = async (id) => {
    const current = lookbooks.find(lb => lb.id === id);
    try {
      await lookbookService.toggleStatus(id);
      if (current) {
        setUndoStack(prev => [...prev, {
          type: 'TOGGLE_STATUS',
          id: id,
          description: `Đổi trạng thái "${current.title}"`
        }]);
      }
      showSuccess('Đã cập nhật trạng thái hiển thị Lookbook!');
      notifyLookbookUpdated();
      await fetchLookbooks();
    } catch (err) {
      showWarning(err.response?.data?.message || 'Có lỗi xảy ra khi đổi trạng thái!');
    }
  };

  // Đổi thứ tự vị trí hiển thị: nếu trùng vị trí thì hỏi xác nhận có muốn đổi chỗ 2 mục không
  const handleUpdatePosition = async (id, newPos) => {
    const currentItem = lookbooks.find(lb => lb.id === id);
    if (!currentItem || String(currentItem.position).toLowerCase() === String(newPos).toLowerCase()) {
      return;
    }

    // Kiểm tra xem vị trí mới đã được lookbook khác chọn hay chưa
    const conflictingItem = lookbooks.find(
      lb => lb.id !== id && String(lb.position).toLowerCase() === String(newPos).toLowerCase()
    );

    const posName = String(newPos).toLowerCase() === 'banner' ? 'Banner' : `vị trí #${newPos}`;
    const currentPosName = String(currentItem.position).toLowerCase() === 'banner' ? 'Banner' : `vị trí #${currentItem.position}`;

    if (conflictingItem) {
      // Thông báo xác nhận: có muốn đổi mục này với mục số đó không
      const confirmed = await confirmModal({
        title: 'Xác nhận đổi vị trí',
        message: `Bạn có muốn đổi mục "${currentItem.title}" (${currentPosName}) với mục "${conflictingItem.title}" (${posName}) không?`,
        confirmText: 'Đồng ý',
        cancelText: 'Từ chối',
        variant: 'info'
      });

      // Bấm từ chối thì không đổi
      if (!confirmed) {
        return;
      }

      // Bấm đồng ý thì đổi chỗ 2 mục
      try {
        await lookbookService.swapPositions(id, conflictingItem.id);
        setUndoStack(prev => [...prev, {
          type: 'SWAP_POSITION',
          id1: id,
          id2: conflictingItem.id,
          pos1: currentItem.position,
          pos2: conflictingItem.position,
          description: `Đổi vị trí giữa "${currentItem.title}" và "${conflictingItem.title}"`
        }]);
        showSuccess(`Đã đổi chỗ 2 mục Lookbook (${currentPosName} ⇄ ${posName}) thành công!`);
        notifyLookbookUpdated();
        await fetchLookbooks();
      } catch (err) {
        showError(err.response?.data?.message || 'Có lỗi xảy ra khi đổi chỗ 2 mục Lookbook!');
        await fetchLookbooks();
      }
      return;
    }

    // Nếu vị trí chưa có ai chọn thì cập nhật bình thường
    try {
      await lookbookService.updatePosition(id, newPos);
      setUndoStack(prev => [...prev, {
        type: 'CHANGE_POSITION',
        id: id,
        oldPos: currentItem.position,
        description: `Đổi vị trí "${currentItem.title}" về ${currentPosName}`
      }]);
      showSuccess(`Đã cập nhật vị trí sang ${posName} thành công!`);
      notifyLookbookUpdated();
      await fetchLookbooks();
    } catch (err) {
      showError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật vị trí!');
      await fetchLookbooks();
    }
  };

  // [HÀM QUAY LẠI (UNDO)] Khôi phục lại 1 bước thao tác vừa sửa trước đó
  const handleUndo = async () => {
    if (undoStack.length === 0) {
      showInfo('Không có thao tác nào để quay lại!');
      return;
    }

    const lastAction = undoStack[undoStack.length - 1];

    try {
      setIsLoading(true);
      if (lastAction.type === 'SWAP_POSITION') {
        // Hoán đổi ngược lại 2 mục
        await lookbookService.swapPositions(lastAction.id1, lastAction.id2);
      } else if (lastAction.type === 'CHANGE_POSITION') {
        // Đặt lại vị trí cũ
        await lookbookService.updatePosition(lastAction.id, lastAction.oldPos);
      } else if (lastAction.type === 'TOGGLE_STATUS') {
        // Đổi lại trạng thái cũ
        await lookbookService.toggleStatus(lastAction.id);
      } else if (lastAction.type === 'EDIT_LOOKBOOK') {
        // Khôi phục dữ liệu lookbook trước khi sửa
        await lookbookService.updateLookbook(lastAction.id, lastAction.prevData);
      } else if (lastAction.type === 'SWAP_AND_EDIT') {
        // Đổi lại vị trí 2 mục và khôi phục dữ liệu cũ
        await lookbookService.swapPositions(lastAction.id1, lastAction.id2);
        await lookbookService.updateLookbook(lastAction.id1, lastAction.prevData1);
      } else if (lastAction.type === 'CREATE_LOOKBOOK') {
        // Xóa lookbook vừa tạo
        await lookbookService.deleteLookbook(lastAction.createdId);
      } else if (lastAction.type === 'DELETE_LOOKBOOK') {
        // Tạo lại lookbook vừa xóa
        await lookbookService.createLookbook(lastAction.data);
      } else if (lastAction.type === 'BULK_DELETE') {
        // Tạo lại danh sách lookbook vừa xóa hàng loạt
        for (const item of lastAction.items) {
          await lookbookService.createLookbook(item);
        }
      }

      setUndoStack(prev => prev.slice(0, -1));
      showSuccess(`Đã quay lại bước trước: ${lastAction.description}!`);
      notifyLookbookUpdated();
      await fetchLookbooks();
    } catch (err) {
      showError(err.response?.data?.message || 'Có lỗi xảy ra khi quay lại bước trước!');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // [PHẦN 6] QUẢN LÝ DANH SÁCH SẢN PHẨM PHỐI ĐỒ (GẮN TAGS TỪ DATABASE)
  // - Cho phép chọn sản phẩm từ CSDL/Danh mục, tự động lấy giá, ảnh, danh mục
  // ==========================================================================
  // Thêm một dòng sản phẩm rỗng vào form để chọn từ catalog
  const handleAddProductRow = () => {
    setFormData(prev => ({
      ...prev,
      products: [
        ...(prev.products || []),
        { product_id: '', name: '', price: '', price_num: 0, image: '', category_name: '', sku: '' }
      ]
    }));
  };

  // Xử lý chọn sản phẩm từ danh sách Danh mục / Database
  const handleSelectCatalogProduct = (index, selectedProductId) => {
    const p = catalogProducts.find(item => String(item.product_id) === String(selectedProductId));
    setFormData(prev => {
      const updated = [...(prev.products || [])];
      if (!p) {
        updated[index] = { product_id: '', name: '', price: '', price_num: 0, image: '', category_name: '', sku: '' };
      } else {
        const primaryImg = p.images?.find(i => i.is_primary)?.image_url || p.images?.[0]?.image_url || '';
        const priceVal = p.variants?.[0]?.price ? Number(p.variants[0].price) : 0;
        const formattedPrice = priceVal > 0 ? priceVal.toLocaleString('vi-VN') + '₫' : '';
        updated[index] = {
          product_id: String(p.product_id),
          name: p.product_name,
          price: formattedPrice,
          price_num: priceVal,
          image: primaryImg,
          category_name: p.category?.category_name || '',
          sku: p.variants?.[0]?.sku || `YF-${p.product_id}`
        };
      }

      // Tự động tính tổng giá combo nếu chưa có hoặc cập nhật
      const totalComboPrice = updated.reduce((sum, item) => sum + (Number(item.price_num) || parseInt(String(item.price || '').replace(/\D/g, '')) || 0), 0);
      const newComboPrice = totalComboPrice > 0 ? totalComboPrice.toLocaleString('vi-VN') + '₫' : prev.price;

      return {
        ...prev,
        price: prev.price && prev.price !== '3.000.000₫' ? prev.price : newComboPrice,
        products: updated
      };
    });
  };

  // Cập nhật tên hoặc giá của từng sản phẩm phối theo index (nếu chỉnh sửa tay)
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
  // [PHẦN 7] MỞ MODAL VÀ LƯU DỮ LIỆU FORM (TẠO MỚI / CHỈNH SỬA VÀO MYSQL)
  // ==========================================================================
  // Mở Modal Tạo mới với giá trị khởi tạo tự động
  const handleOpenCreate = () => {
    setEditingLookbook(null);
    setSelectedFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Tìm vị trí số nhỏ nhất còn trống chưa được Lookbook nào sử dụng
    const usedPositions = new Set(lookbooks.map(lb => String(lb.position).toLowerCase()));
    let nextPos = 1;
    while (usedPositions.has(String(nextPos))) {
      nextPos++;
    }
    setFormData({
      title: '',
      code: getLookbookCodeByPosition(nextPos),
      lookCode: getLookCodeByPosition(nextPos),
      sectionRole: getSectionRoleByPosition(nextPos),
      season: 'PHONG CÁCH THU ĐÔNG',
      badge: 'MỚI',
      position: String(nextPos),
      productCount: 0,
      price: '',
      status: 'published',
      image: '',
      description: '',
      products: []
    });
    setIsModalOpen(true);
  };

  // Mở Modal Chỉnh sửa với dữ liệu sẵn có của Lookbook được chọn
  const handleOpenEdit = (lookbook) => {
    setEditingLookbook(lookbook);
    setSelectedFile(null);
    setImagePreview(lookbook.image || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    const initialProducts = lookbook.products && Array.isArray(lookbook.products)
      ? lookbook.products.map(p => ({ ...p }))
      : [];

    const pos = lookbook.position === 'banner' ? 'banner' : String(lookbook.position);
    setFormData({
      title: lookbook.title,
      code: getLookbookCodeByPosition(pos),
      lookCode: getLookCodeByPosition(pos),
      sectionRole: getSectionRoleByPosition(pos),
      season: lookbook.season || '',
      badge: lookbook.badge || '',
      position: pos,
      productCount: initialProducts.length > 0 ? initialProducts.length : (lookbook.productCount || 1),
      price: lookbook.price || '',
      status: lookbook.status,
      image: lookbook.image,
      description: lookbook.description || '',
      products: initialProducts
    });
    setIsModalOpen(true);
  };

  // Xử lý khi chọn 1 ảnh từ máy tính
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showWarning('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WEBP...)');
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setFormData(prev => ({ ...prev, image: previewUrl }));
  };

  // Gỡ bỏ ảnh đã chọn
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // [HÀM LƯU FORM] Xử lý khi nhấn nút "Lưu Thay Đổi" hoặc "Tạo Lookbook"
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showWarning('Vui lòng nhập tên tuyển tập Lookbook!');
      return;
    }
    if (!selectedFile && !formData.image?.trim()) {
      showWarning('Vui lòng chọn 1 ảnh bìa từ máy tính cho Lookbook!');
      return;
    }

    const pos = formData.position === 'banner' ? 'banner' : String(formData.position);

    // Kiểm tra trùng lặp vị trí: mỗi 1 vị trí chỉ có thể pick 1 Lookbook
    const conflictingItem = lookbooks.find(
      lb => (!editingLookbook || lb.id !== editingLookbook.id) &&
            String(lb.position).toLowerCase() === String(pos).toLowerCase()
    );

    // Nếu là Banner thì danh sách sản phẩm phối là rỗng (vì Banner là ảnh bìa lớn)
    const cleanedProducts = pos === 'banner'
      ? []
      : (formData.products || []).filter(p => p.name.trim() || p.price.trim());
    const count = cleanedProducts.length > 0 ? cleanedProducts.length : (Number(formData.productCount) || 1);
    const autoCode = getLookbookCodeByPosition(pos);
    const autoLookCode = getLookCodeByPosition(pos);
    const autoSectionRole = getSectionRoleByPosition(pos);

    const buildPayload = () => {
      if (selectedFile) {
        const data = new FormData();
        data.append('image', selectedFile);
        data.append('title', formData.title);
        data.append('code', autoCode);
        data.append('lookCode', autoLookCode);
        data.append('sectionRole', autoSectionRole);
        data.append('season', formData.season || '');
        data.append('badge', formData.badge || '');
        data.append('position', pos);
        data.append('productCount', String(count));
        data.append('price', formData.price || '');
        data.append('status', formData.status || 'published');
        data.append('description', formData.description || '');
        data.append('products', JSON.stringify(cleanedProducts));
        return data;
      }
      return {
        ...formData,
        code: autoCode,
        lookCode: autoLookCode,
        sectionRole: autoSectionRole,
        position: pos,
        productCount: count,
        products: cleanedProducts
      };
    };

    if (conflictingItem) {
      const posLabel = String(pos).toLowerCase() === 'banner' ? 'Banner' : `vị trí #${pos}`;
      const currentPosLabel = editingLookbook && String(editingLookbook.position).toLowerCase() === 'banner' ? 'Banner' : `vị trí #${editingLookbook?.position}`;

      if (editingLookbook) {
        const confirmed = await confirmModal({
          title: 'Xác nhận đổi vị trí',
          message: `Bạn có muốn đổi mục "${formData.title}" (${currentPosLabel}) với mục "${conflictingItem.title}" (${posLabel}) không?`,
          confirmText: 'Đồng ý',
          cancelText: 'Từ chối',
          variant: 'info'
        });

        // Bấm từ chối thì không đổi
        if (!confirmed) {
          return;
        }

        // Bấm đồng ý thì đổi chỗ 2 mục và cập nhật form
        try {
          setIsSubmitting(true);
          await lookbookService.swapPositions(editingLookbook.id, conflictingItem.id);
          const payload = buildPayload();
          await lookbookService.updateLookbook(editingLookbook.id, payload);

          setUndoStack(prev => [...prev, {
            type: 'SWAP_AND_EDIT',
            id1: editingLookbook.id,
            id2: conflictingItem.id,
            prevData1: { ...editingLookbook },
            description: `Sửa & đổi vị trí "${formData.title}"`
          }]);

          showSuccess('Đã đổi chỗ và cập nhật tuyển tập Lookbook thành công!');
          setIsModalOpen(false);
          notifyLookbookUpdated();
          await fetchLookbooks();
        } catch (err) {
          showError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu Lookbook vào MySQL!');
        } finally {
          setIsSubmitting(false);
        }
        return;
      } else {
        showError(`Vị trí ${posLabel} đã được sử dụng bởi Lookbook "${conflictingItem.title}". Mỗi vị trí chỉ có thể chọn 1 Lookbook!`);
        return;
      }
    }

    const payload = buildPayload();

    try {
      setIsSubmitting(true);
      if (editingLookbook) {
        const prevData = { ...editingLookbook };
        await lookbookService.updateLookbook(editingLookbook.id, payload);
        setUndoStack(prev => [...prev, {
          type: 'EDIT_LOOKBOOK',
          id: editingLookbook.id,
          prevData,
          description: `Sửa Lookbook "${formData.title}"`
        }]);
        showSuccess('Đã cập nhật tuyển tập Lookbook trong MySQL thành công!');
      } else {
        const res = await lookbookService.createLookbook(payload);
        const createdId = res?.data?.id || res?.id;
        if (createdId) {
          setUndoStack(prev => [...prev, {
            type: 'CREATE_LOOKBOOK',
            createdId,
            description: `Tạo Lookbook "${formData.title}"`
          }]);
        }
        showSuccess('Đã tạo tuyển tập Lookbook mới trong MySQL thành công!');
      }

      setIsModalOpen(false);
      notifyLookbookUpdated();
      await fetchLookbooks();
    } catch (err) {
      showError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu Lookbook vào MySQL!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="manager-layout">
      {/* Inline styles specifically tailored for Lookbook Management */}
      <style>{`
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

        .dashboard-scroll-body {
          display: flex;
          flex-direction: column;
          padding: 0px;
          gap: 24px;
          width: 100%;
          box-sizing: border-box;
        }

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
      {/* LEFT SIDEBAR */}
      <ManagerSidebar activeMenu="lookbooks" />

      {/* MAIN CONTENT AREA */}
      <main className="main-content-area">
        {/* Header Bar */}
        <ManagerHeader searchPlaceholder="Tìm kiếm tuyển tập lookbook..." />

        <div className="dashboard-scroll-body">
          <div className="lookbook-page-container">

            {/* Breadcrumb */}
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
                    {prominentLookbook?.title || "Chưa có Lookbook"}
                  </div>
                  <div className="lb-stat-subtext">
                    <span style={{ color: '#D97706', fontSize: '15px' }}>•</span>
                    <span>{prominentLookbook ? `Vị trí #${prominentLookbook.position} • ${prominentLookbook.season || 'Bộ sưu tập'}` : 'Chưa thiết lập'}</span>
                  </div>
                  <div className="lb-stat-progress-bg">
                    <div
                      className="lb-stat-progress-fill"
                      style={{ width: prominentLookbook ? '100%' : '0%', background: '#D97706' }}
                    />
                  </div>
                </div>
              </div>

              {/* THẺ 3: Tổng số Outfit & sản phẩm phối được gắn tag */}
              <div className="lb-stat-card">
                <div className="lb-stat-top">
                  <span className="lb-stat-label">TỔNG SẢN PHẨM GẮN TAG</span>
                  <div className="lb-stat-icon-badge">
                    <Tag size={16} />
                  </div>
                </div>
                <div>
                  <div className="lb-stat-value">{totalTaggedProducts} Sản Phẩm Phối</div>
                  <div className="lb-stat-subtext">
                    Trung bình <strong>~{avgTagged} sản phẩm</strong> / mỗi Lookbook
                  </div>
                  <div className="lb-stat-progress-bg">
                    <div
                      className="lb-stat-progress-fill"
                      style={{ width: totalTaggedProducts > 0 ? '100%' : '0%', background: '#334155' }}
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
                  {/* Nút quay lại 1 bước đã sửa */}
                  <button
                    type="button"
                    className="btn-undo-action"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0 || isLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      background: undoStack.length > 0 ? '#FFFFFF' : '#F9FAFB',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: undoStack.length > 0 ? '#374151' : '#9CA3AF',
                      cursor: undoStack.length > 0 && !isLoading ? 'pointer' : 'not-allowed',
                      opacity: undoStack.length > 0 ? 1 : 0.6,
                      transition: 'all 0.15s ease'
                    }}
                    title={undoStack.length > 0 ? `Quay lại 1 bước trước: ${undoStack[undoStack.length - 1]?.description}` : 'Chưa có thao tác nào để quay lại'}
                  >
                    <Undo2 size={13} />
                    <span>Quay lại</span>
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
                      <th>THÔNG TIN LOOKBOOK</th>
                      <th style={{ width: '150px' }}>GIÁ & SẢN PHẨM</th>
                      <th style={{ textAlign: 'center', width: '130px' }}>TRẠNG THÁI</th>
                      <th style={{ textAlign: 'center', width: '120px' }}>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#8C857B' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <Loader2 size={28} className="animate-spin" style={{ color: '#111827' }} />
                            <span>Đang tải dữ liệu Lookbook từ cơ sở dữ liệu MySQL...</span>
                          </div>
                        </td>
                      </tr>
                    ) : currentItems.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#8C857B' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <ImageIcon size={36} style={{ color: '#D1D5DB' }} />
                            {searchQuery ? (
                              <span>Không tìm thấy tuyển tập Lookbook phù hợp với điều kiện tìm kiếm.</span>
                            ) : (
                              <>
                                <span style={{ fontWeight: 600, color: '#374151' }}>
                                  Chưa có tuyển tập Lookbook nào trong cơ sở dữ liệu MySQL.
                                </span>
                                <span style={{ fontSize: '13px' }}>
                                  Nhấn nút "Tạo Lookbook Mới" bên trên để bắt đầu thêm bài viết thời trang mới.
                                </span>
                              </>
                            )}
                          </div>
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

                            {/* Cột 2: Lựa chọn vị trí tức thì (Banner hoặc 1, 2, 3... - Mỗi vị trí chỉ 1 Lookbook) */}
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
                                    width: '90px',
                                    boxSizing: 'border-box',
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
                                    e.target.style.display = 'none';
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
                                      {getLookCodeByPosition(lb.position)}
                                    </span>
                                    <div className="lb-title-text" style={{ margin: 0 }}>
                                      {lb.title}
                                    </div>
                                  </div>
                                  <div className="lb-meta-text" style={{ color: '#047857', fontWeight: 600, margin: '2px 0' }}>
                                    📍 Điều khiển: {getSectionRoleByPosition(lb.position)}
                                  </div>
                                  <div className="lb-meta-text">
                                    {getLookbookCodeByPosition(lb.position)} • {lb.season} {lb.badge && `• [${lb.badge}]`}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Cột 4: Giá bán hiển thị & Số lượng sản phẩm phối */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontWeight: 700, fontSize: '13px', color: '#111111' }}>
                                  {lb.price || '—'}
                                </span>
                                <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                                  {lb.productCount || 0} sản phẩm phối
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

                  {getPaginationPages(currentPage, totalPages).map((page, idx) => {
                    if (page === '...') {
                      return (
                        <span key={`dots-${idx}`} className="btn-page-ellipsis" style={{ minWidth: '28px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8C857B', fontWeight: 700 }}>
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        type="button"
                        className={`btn-page-num ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}

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

                      {/* [MỤC 2] Mùa chiến dịch & Thứ tự vị trí (Banner hoặc số 1, 2, 3...) */}
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
                                code: getLookbookCodeByPosition(newPos),
                                lookCode: getLookCodeByPosition(newPos),
                                sectionRole: getSectionRoleByPosition(newPos)
                              });
                            }}
                            style={{ fontWeight: 600 }}
                          >
                            <option value="banner" style={{ fontWeight: 700, color: '#D97706' }}>
                              ★ Banner (Ảnh bìa lớn trên cùng) {lookbooks.some(item => (!editingLookbook || item.id !== editingLookbook.id) && String(item.position).toLowerCase() === 'banner') ? '— [Đã có Lookbook dùng]' : ''}
                            </option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(num => {
                              const occupiedBy = lookbooks.find(
                                item => (!editingLookbook || item.id !== editingLookbook.id) && String(item.position).toLowerCase() === String(num)
                              );
                              return (
                                <option key={num} value={num} style={{ color: occupiedBy ? '#DC2626' : undefined }}>
                                  Vị trí #{num} {num === 1 ? '(Look 01 & Nổi bật Trang Chủ)' : num === 2 ? '(Look 02)' : num === 3 ? '(Look 03)' : num === 4 ? '(Look 04)' : ''} {occupiedBy ? `— [Đã dùng: ${occupiedBy.title}]` : ''}
                                </option>
                              );
                            })}
                          </select>
                          {(() => {
                            const occupiedBy = lookbooks.find(
                              item => (!editingLookbook || item.id !== editingLookbook.id) &&
                                      String(item.position).toLowerCase() === String(formData.position).toLowerCase()
                            );
                            if (occupiedBy) {
                              return (
                                <div style={{ fontSize: '12px', color: editingLookbook ? '#D97706' : '#DC2626', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>ℹ️</span>
                                  <span>
                                    {editingLookbook
                                      ? `Vị trí này đang thuộc về "${occupiedBy.title}". Khi bấm Lưu, hệ thống sẽ xác nhận để đổi chỗ 2 mục.`
                                      : `Vị trí này đã được sử dụng bởi "${occupiedBy.title}". Mỗi vị trí chỉ có thể chọn 1 Lookbook!`}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
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

                      {/* [MỤC 5] Danh sách sản phẩm phối gắn tag từ CSDL / Danh Mục (TỰ ĐỘNG ẨN khi vị trí là Banner) */}
                      {formData.position !== 'banner' && (
                        <div className="lb-form-group" style={{ background: '#F9FAFB', padding: '16px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                              <label className="lb-form-label" style={{ fontWeight: 700, fontSize: '13px', color: '#111827', display: 'block', margin: 0 }}>
                                Danh Sách Sản Phẩm Phối (Gắn Tag Từ Danh Mục & CSDL)
                              </label>
                              <span style={{ fontSize: '11px', color: '#6B7280' }}>
                                Chọn sản phẩm từ MySQL để hiển thị chi tiết và cho phép khách bấm thêm thẳng vào giỏ hàng
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddProductRow}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#111827',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Plus size={13} strokeWidth={2.5} /> Thêm sản phẩm
                            </button>
                          </div>

                          {formData.products && formData.products.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {formData.products.map((prod, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                  }}
                                >
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 34px', gap: '8px', alignItems: 'center' }}>
                                    <select
                                      className="lb-form-select"
                                      value={prod.product_id || ''}
                                      onChange={(e) => handleSelectCatalogProduct(idx, e.target.value)}
                                      style={{ fontWeight: 500, fontSize: '13px' }}
                                    >
                                      <option value="">-- Chọn sản phẩm từ Danh mục / MySQL Database ({catalogProducts.length} SP) --</option>
                                      {catalogProducts.map((cp) => {
                                        const priceVal = cp.variants?.[0]?.price ? Number(cp.variants[0].price).toLocaleString('vi-VN') + '₫' : 'Liên hệ';
                                        return (
                                          <option key={cp.product_id} value={cp.product_id}>
                                            {cp.product_name} • [{priceVal}] {cp.category?.category_name ? `• (${cp.category.category_name})` : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
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

                                  {/* Hiển thị thẻ thông tin sản phẩm đã chọn từ CSDL */}
                                  {prod.name ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                                      {prod.image ? (
                                        <img
                                          src={prod.image}
                                          alt={prod.name}
                                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0' }}
                                        />
                                      ) : (
                                        <div style={{ width: '42px', height: '42px', background: '#E2E8F0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748B' }}>
                                          No img
                                        </div>
                                      )}
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {prod.name}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                          <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700 }}>
                                            {prod.price}
                                          </span>
                                          {prod.category_name && (
                                            <span style={{ fontSize: '10px', background: '#E2E8F0', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                              {prod.category_name}
                                            </span>
                                          )}
                                          {prod.product_id && (
                                            <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                                              ID #{prod.product_id}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', background: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
                                          <Check size={12} strokeWidth={3} /> Đã liên kết CSDL
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '11.5px', color: '#94A3B8', fontStyle: 'italic', paddingLeft: '4px' }}>
                                      Vui lòng chọn 1 sản phẩm trong danh sách thả xuống ở trên để gắn tag.
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                              Chưa gắn tag sản phẩm nào từ danh mục. Bấm "+ Thêm sản phẩm" để chọn các sản phẩm phối đồ từ CSDL.
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

                      {/* [MỤC 7] Chọn ảnh từ máy tính (1 ảnh) & Khung xem trước ảnh */}
                      <div className="lb-form-group">
                        <label className="lb-form-label" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                          Chọn ảnh từ máy tính (1 ảnh) *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          className="lb-form-input"
                          onChange={handleFileSelect}
                          style={{ cursor: 'pointer' }}
                        />

                        {imagePreview ? (
                          <div style={{ marginTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '11px', color: '#78716C', fontWeight: 600 }}>
                                {selectedFile ? 'Ảnh vừa chọn từ máy tính:' : 'Ảnh bìa hiện tại:'}
                              </span>
                              <button
                                type="button"
                                onClick={handleRemoveFile}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#DC2626',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <X size={13} /> Gỡ ảnh
                              </button>
                            </div>
                            <div className="lb-img-preview-box" style={{ height: '180px', position: 'relative' }}>
                              <img
                                src={imagePreview}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11.5px', color: '#9CA3AF', fontStyle: 'italic', marginTop: '6px' }}>
                            Chưa chọn ảnh nào. Vui lòng bấm "Chọn tệp" để tải 1 ảnh bìa từ máy tính.
                          </div>
                        )}
                      </div>

                      {/* [MỤC 8] Mô tả chi tiết cảm hứng & chất liệu */}
                      <div className="lb-form-group">
                        <label className="lb-form-label">Mô Tả Bộ Sưu Tập</label>
                        <textarea
                          rows="3"
                          className="lb-form-textarea"
                          placeholder="Mô tả phong cách, cảm hứng thiết kế (VD: Thiết kế được lựa chọn trình diễn tại Paris Fashion Week 2025...)"
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
                        {getLookbookCodeByPosition(previewLookbook.position)} • {previewLookbook.season}
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
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Search,
  Camera,
  Upload,
  UploadCloud,
  X,
  Crop,
  Eye,
  Sparkles,
  Clock,
  Trash2,
  Layers,
  Image as ImageIcon,
  Type,
  Loader2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import ProductCard from "../../components/ProductCard";
import ImageCropperModal from "../../components/ImageCropperModal";
import { aiService } from "../../services/aiService";
import { useAuth } from "../../context/AuthContext";
import { useConfirmModal } from "../../context/ConfirmModalContext";
import { useToast } from "../../context/ToastContext";

const SEARCH_HISTORY_KEY = "youthfashion_search_history";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirmModal } = useConfirmModal();
  const { showSuccess, showError, showInfo } = useToast();

  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Search input state
  const urlQuery = searchParams.get("q") || searchParams.get("search") || "";
  const [queryText, setQueryText] = useState(urlQuery);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [rawOriginalFile, setRawOriginalFile] = useState(null);
  const [rawOriginalUrl, setRawOriginalUrl] = useState(null);
  const [currentFocusBox, setCurrentFocusBox] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Execution state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchMetadata, setSearchMetadata] = useState(null);
  const [suggestedQuery, setSuggestedQuery] = useState(null);
  const [wasCorrected, setWasCorrected] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // History & Recommendations
  const [searchHistory, setSearchHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // 1. Cleanup image preview & original blob URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (
        imagePreview &&
        typeof imagePreview === "string" &&
        imagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(imagePreview);
      }
      if (
        rawOriginalUrl &&
        typeof rawOriginalUrl === "string" &&
        rawOriginalUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(rawOriginalUrl);
      }
    };
  }, [imagePreview, rawOriginalUrl]);

  // 2. Load Search History (from API for logged in, from localStorage for guest)
  const fetchSearchHistory = async () => {
    let localItems = [];
    try {
      localItems = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
      if (!Array.isArray(localItems)) localItems = [];
    } catch (e) {
      localItems = [];
    }

    if (user) {
      try {
        const res = await aiService.getSearchHistory(15);
        if (res.status && Array.isArray(res.data) && res.data.length > 0) {
          const apiKeywords = res.data
            .map((item) => item.query_text)
            .filter(Boolean);
          // Hợp nhất API keywords với local items (loại trùng lặp)
          const merged = Array.from(
            new Set([...apiKeywords, ...localItems]),
          ).slice(0, 15);
          setSearchHistory(merged);
          return merged;
        }
      } catch (err) {
        console.warn(
          "Không thể nạp lịch sử từ API, dùng localStorage:",
          err.message,
        );
      }
    }

    setSearchHistory(localItems.slice(0, 15));
    return localItems.slice(0, 15);
  };

  // 4. Save keyword to localStorage (always keep local cache fresh)
  const saveKeywordLocally = (keyword) => {
    if (!keyword || typeof keyword !== "string" || keyword.trim() === "")
      return;
    const clean = keyword.trim();
    try {
      const current = JSON.parse(
        localStorage.getItem(SEARCH_HISTORY_KEY) || "[]",
      );
      const filtered = Array.isArray(current)
        ? current.filter((k) => k.toLowerCase() !== clean.toLowerCase())
        : [];
      const updated = [clean, ...filtered].slice(0, 15);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      setSearchHistory(updated);
    } catch (e) {
      // Ignore quota errors
    }
  };

  // 5. Fetch Recommendations based on search history
  const fetchRecommendations = async (keywords = []) => {
    setLoadingRecommendations(true);
    try {
      const res = await aiService.getRecommendations(8, keywords);
      if (res.status && res.data) {
        setRecommendations(res.data.products || []);
      }
    } catch (err) {
      console.warn("Lỗi khi nạp gợi ý sản phẩm:", err.message);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Initial mount: load history and recommendations
  useEffect(() => {
    fetchSearchHistory().then((historyList) => {
      fetchRecommendations(historyList);
    });
  }, [user]);

  // 6. Handle URL query changes (e.g. user arrived with ?q=...)
  useEffect(() => {
    const q = (
      searchParams.get("q") ||
      searchParams.get("search") ||
      ""
    ).trim();
    if (q && q !== queryText) {
      setQueryText(q);
      executeSearch(q, null);
    }
  }, [searchParams]);

  // 7. Core Search Execution
  const executeSearch = async (
    textOverride = null,
    imageOverride = undefined,
  ) => {
    const targetText = (
      textOverride !== null ? textOverride : queryText
    ).trim();
    const targetImage =
      imageOverride !== undefined ? imageOverride : selectedImage;

    if (!targetText && !targetImage) {
      setErrorMessage("Vui lòng nhập từ khóa mô tả hoặc tải lên hình ảnh mẫu");
      return;
    }

    setIsSearching(true);
    setErrorMessage("");
    setSuggestedQuery(null);
    setWasCorrected(false);

    // Tự động tối ưu hóa trọng số Multimodal (Adaptive Auto-Weighting):
    // - Nếu từ khóa ngắn/chung chung (<= 2 từ): Ưu tiên hình ảnh (70% ảnh - 30% text)
    // - Nếu từ khóa mô tả chi tiết (>= 3 từ): Cân bằng tối ưu (50% ảnh - 50% text)
    const words = (targetText || "").trim().split(/\s+/).filter(Boolean);
    const imgWeight = words.length <= 2 ? 0.7 : 0.5;
    const txtWeight = words.length <= 2 ? 0.3 : 0.5;

    try {
      let response;
      const topK = 12;

      if (targetImage && targetText) {
        response = await aiService.searchHybrid(
          targetImage,
          targetText,
          topK,
          imgWeight,
          txtWeight,
        );
      } else if (targetImage) {
        response = await aiService.searchByImage(targetImage, topK);
      } else {
        response = await aiService.searchByText(targetText, topK);
      }

      if (response && response.status) {
        // Chỉ chấp nhận sản phẩm có độ khớp trên 80% (>= 0.80)
        const rawProducts = response.data?.products || [];
        const validProducts = rawProducts.filter((p) =>
          typeof p.similarity === "number" ? p.similarity >= 0.80 : true
        );
        setSearchResults(validProducts);
        const actualType =
          response.data?.search_type ||
          (targetImage && targetText
            ? "HYBRID"
            : targetImage
              ? "IMAGE"
              : "TEXT");

        setSearchMetadata({
          searchType: actualType,
          weights: response.data?.weights || {
            image: imgWeight,
            text: txtWeight,
          },
          query: targetText,
          total: validProducts.length,
        });

        if (response.data?.was_corrected && response.data?.suggested_query) {
          setSuggestedQuery(response.data.suggested_query);
          setWasCorrected(true);
        } else {
          setSuggestedQuery(null);
          setWasCorrected(false);
        }

        // Lưu vào lịch sử tìm kiếm nếu có text
        if (targetText) {
          saveKeywordLocally(targetText);
          // Cập nhật lại recommendations dựa trên từ khóa mới
          fetchRecommendations([targetText, ...searchHistory]);
        }
      } else {
        setErrorMessage(response?.message || "Có lỗi xảy ra khi tìm kiếm");
      }
    } catch (err) {
      console.error("Lỗi gọi API tìm kiếm AI:", err);
      const apiMsg = err.response?.data?.message || err.message;
      setErrorMessage(`Không thể kết nối dịch vụ AI: ${apiMsg}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Form submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (queryText.trim()) {
      setSearchParams({ q: queryText.trim() });
    }
    executeSearch();
  };

  // Click on a history tag
  const handleHistoryClick = (keyword) => {
    setQueryText(keyword);
    // Xóa ảnh đang chọn nếu muốn tìm thuần text từ history
    if (imagePreview) {
      removeImage();
    }
    setSearchParams({ q: keyword });
    executeSearch(keyword, null);
  };

  // Prompt to Clear Search History (With Confirm Modal)
  const handlePromptClearHistory = async () => {
    if (searchHistory.length === 0) return;

    const confirmed = await confirmModal({
      title: "Xóa lịch sử tìm kiếm?",
      message:
        "Bạn có chắc chắn muốn xóa toàn bộ lịch sử tìm kiếm không? Hành động này không thể hoàn tác.",
      confirmText: "Xóa tất cả",
      cancelText: "Hủy",
      variant: "danger",
    });

    if (confirmed) {
      try {
        if (user) {
          await aiService.clearSearchHistory();
        }
        localStorage.removeItem(SEARCH_HISTORY_KEY);
        setSearchHistory([]);
        showSuccess("Đã xóa toàn bộ lịch sử tìm kiếm!");
      } catch (err) {
        console.error("Lỗi xóa lịch sử:", err);
        localStorage.removeItem(SEARCH_HISTORY_KEY);
        setSearchHistory([]);
        showSuccess("Đã xóa lịch sử tìm kiếm cục bộ!");
      }
    }
  };

  // Click on spell suggestion
  const handleApplySuggestion = (suggestion) => {
    setQueryText(suggestion);
    setSearchParams({ q: suggestion });
    executeSearch(suggestion);
  };

  // Xử lý file ảnh (dùng chung cho Upload file, Kéo thả Drag & Drop và Dán Clipboard Ctrl+V)
  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      showError("Vui lòng chọn hoặc kéo thả file định dạng hình ảnh (PNG, JPG, WEBP,...)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError("Dung lượng ảnh tối đa cho phép là 10MB");
      return;
    }

    if (
      imagePreview &&
      typeof imagePreview === "string" &&
      imagePreview.startsWith("blob:") &&
      imagePreview !== rawOriginalUrl
    ) {
      URL.revokeObjectURL(imagePreview);
    }
    if (
      rawOriginalUrl &&
      typeof rawOriginalUrl === "string" &&
      rawOriginalUrl.startsWith("blob:")
    ) {
      URL.revokeObjectURL(rawOriginalUrl);
    }

    const originalUrl = URL.createObjectURL(file);
    setRawOriginalFile(file);
    setRawOriginalUrl(originalUrl);
    setErrorMessage("");

    // Tự động nhận diện và focus vào sản phẩm trang phục (Áo hoặc sản phẩm chính)
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalHeight / (img.naturalWidth || 1);
      let initBox;
      if (ratio >= 1.15) {
        // Ảnh người mẫu / toàn thân: Tự động focus vào Áo (nửa trên)
        initBox = { x: 0.15, y: 0.10, width: 0.70, height: 0.44 };
      } else {
        // Ảnh vuông / flatlay: Focus vào sản phẩm ở giữa
        initBox = { x: 0.10, y: 0.10, width: 0.80, height: 0.80 };
      }
      setCurrentFocusBox(initBox);

      // Cắt ảnh theo vùng focus tự động bằng Canvas trong background
      const canvas = document.createElement("canvas");
      const sx = Math.max(0, Math.round(initBox.x * img.naturalWidth));
      const sy = Math.max(0, Math.round(initBox.y * img.naturalHeight));
      const sw = Math.min(img.naturalWidth - sx, Math.round(initBox.width * img.naturalWidth));
      const sh = Math.min(img.naturalHeight - sy, Math.round(initBox.height * img.naturalHeight));
      canvas.width = Math.max(1, sw);
      canvas.height = Math.max(1, sh);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      canvas.toBlob((blob) => {
        if (blob) {
          const focusedFile = new File([blob], "focused_fashion_product.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          const focusedUrl = URL.createObjectURL(blob);
          setSelectedImage(focusedFile);
          setImagePreview(focusedUrl);
          // Tự động tìm kiếm luôn với sản phẩm đã auto-focus
          executeSearch(queryText, focusedFile);
        } else {
          setSelectedImage(file);
          setImagePreview(originalUrl);
          executeSearch(queryText, file);
        }
      }, "image/jpeg", 0.95);
    };
    img.onerror = () => {
      setSelectedImage(file);
      setImagePreview(originalUrl);
      executeSearch(queryText, file);
    };
    img.src = originalUrl;
  };

  // Xác nhận chuyển vùng focus từ modal (ví dụ từ Áo sang Quần)
  const handleCropComplete = (croppedFile, croppedUrl, normalizedBox) => {
    if (
      imagePreview &&
      typeof imagePreview === "string" &&
      imagePreview.startsWith("blob:") &&
      imagePreview !== rawOriginalUrl
    ) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(croppedFile);
    setImagePreview(croppedUrl);
    setCurrentFocusBox(normalizedBox);
    setIsCropperOpen(false);
    executeSearch(queryText, croppedFile);
    showSuccess("Đã cập nhật vùng focus sản phẩm!");
  };

  // Giữ ảnh gốc: đặt lại tìm kiếm theo toàn bộ ảnh gốc không cắt
  const handleKeepOriginal = () => {
    if (rawOriginalFile && rawOriginalUrl) {
      if (
        imagePreview &&
        typeof imagePreview === "string" &&
        imagePreview.startsWith("blob:") &&
        imagePreview !== rawOriginalUrl
      ) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImage(rawOriginalFile);
      setImagePreview(rawOriginalUrl);
      setCurrentFocusBox({ x: 0, y: 0, width: 1.0, height: 1.0 });
      setIsCropperOpen(false);
      executeSearch(queryText, rawOriginalFile);
      showInfo("Đã đặt lại tìm kiếm theo toàn bộ ảnh gốc!");
    } else {
      setIsCropperOpen(false);
    }
  };

  const handleImageFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Drag & Drop handlers cho khu vực tìm kiếm
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  // Hỗ trợ dán ảnh trực tiếp từ Clipboard (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [imagePreview, rawOriginalUrl]);

  const removeImage = () => {
    if (
      imagePreview &&
      typeof imagePreview === "string" &&
      imagePreview.startsWith("blob:") &&
      imagePreview !== rawOriginalUrl
    ) {
      URL.revokeObjectURL(imagePreview);
    }
    if (
      rawOriginalUrl &&
      typeof rawOriginalUrl === "string" &&
      rawOriginalUrl.startsWith("blob:")
    ) {
      URL.revokeObjectURL(rawOriginalUrl);
    }
    setSelectedImage(null);
    setImagePreview(null);
    setRawOriginalFile(null);
    setRawOriginalUrl(null);
    setCurrentFocusBox(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearQueryText = () => {
    setQueryText("");
    setSearchParams({});
  };

  return (
    <div className="search-page-container">
      {/* 0. Breadcrumb */}
      <div className="search-breadcrumb-bar">
        <div className="container breadcrumb-content">
          <Link to="/" className="bc-link">
            TRANG CHỦ
          </Link>
          <span className="bc-sep">&gt;</span>
          <span className="bc-current">TÌM KIẾM SẢN PHẨM</span>
        </div>
      </div>

      {/* 1. Main Search Header Box (Shopee-inspired, tailored for YouthFashion) */}
      <section className="search-hero-section">
        <div className="container">
          <div
            className={`search-box-card ${isDragging ? "dragging-over" : ""}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag & Drop Visual Overlay khi người dùng kéo ảnh vào */}
            {isDragging && (
              <div className="drag-drop-overlay animate-fade-in">
                <div className="drag-drop-card-inner">
                  <div className="drag-drop-icon-pulse">
                    <UploadCloud size={46} />
                  </div>
                  <h3 className="drag-drop-title font-serif">
                    Thả hình ảnh vào đây
                  </h3>
                  <p className="drag-drop-subtitle">
                    AI sẽ tự động nhận diện kiểu dáng, màu sắc và tìm kiếm trang phục tương tự
                  </p>
                  <span className="drag-drop-types">
                    Hỗ trợ JPG, PNG, WEBP (tối đa 10MB)
                  </span>
                </div>
              </div>
            )}

            <h1 className="search-hero-title font-serif">
              Tìm Kiếm Thời Trang Thông Minh
            </h1>
            <p className="search-hero-subtitle">
              Công nghệ AI nhận diện hình ảnh, ngữ nghĩa trang phục và tìm kiếm
              kết hợp đa phương thức
            </p>

            <form onSubmit={handleFormSubmit} className="search-primary-form">
              <div className="search-input-shell">
                <Search size={20} className="search-shell-icon" />
                <input
                  type="text"
                  placeholder="Nhập mô tả sản phẩm (VD: áo sơ mi trắng công sở, đầm dạ hội dài, quần jeans suông)..."
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  className="search-main-input"
                />

                {queryText && (
                  <button
                    type="button"
                    className="input-action-btn clear-text-btn"
                    onClick={handleClearQueryText}
                    title="Xóa văn bản"
                  >
                    <X size={16} />
                  </button>
                )}

                <button
                  type="button"
                  className={`input-action-btn camera-upload-btn ${selectedImage ? "has-image" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  title="Tải ảnh tìm kiếm (Visual Search)"
                >
                  <Camera size={20} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  hidden
                />

                <button
                  type="submit"
                  className="search-submit-main-btn"
                  disabled={
                    isSearching || (!queryText.trim() && !selectedImage)
                  }
                >
                  {isSearching ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang tìm...</span>
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      <span>TÌM KIẾM</span>
                    </>
                  )}
                </button>
              </div>

              {/* Gợi ý kéo thả ảnh tiện ích khi chưa có ảnh */}
              {!imagePreview && (
                <div
                  className="search-dropzone-hint animate-fade-in"
                  onClick={() => fileInputRef.current?.click()}
                  title="Nhấn để tải ảnh hoặc kéo thả trực tiếp vào khung tìm kiếm"
                >
                  <UploadCloud size={14} className="dropzone-hint-icon" />
                  <span>Kéo & thả ảnh vào đây, hoặc nhấn máy ảnh để tìm bằng hình ảnh</span>
                  <span className="dropzone-paste-badge">Ctrl + V</span>
                </div>
              )}

              {/* Preview ảnh thông minh chuẩn Shopee/Lens: Tự động focus sản phẩm, bấm vào xem chi tiết để đổi focus hoặc reset ảnh */}
              {imagePreview && (
                <div className="selected-image-bar animate-fade-in">
                  <div className="selected-img-left">
                    <div
                      className="selected-thumb-wrapper"
                      onClick={() => setIsCropperOpen(true)}
                      title="Nhấn để xem chi tiết ảnh và điều chỉnh vùng focus sản phẩm"
                    >
                      <img
                        src={imagePreview}
                        alt="Ảnh tìm kiếm"
                        className="selected-thumb"
                      />
                      <div className="thumb-zoom-overlay">
                        <Eye size={14} />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="view-detail-img-text"
                      onClick={() => setIsCropperOpen(true)}
                      title="Xem chi tiết ảnh & điều chỉnh vùng focus sản phẩm"
                    >
                      Xem chi tiết ảnh
                    </button>
                  </div>

                  <div className="selected-img-actions">
                    <button
                      type="button"
                      className="remove-selected-img-btn"
                      onClick={removeImage}
                      title="Xóa ảnh tìm kiếm"
                    >
                      <X size={14} /> Gỡ ảnh
                    </button>
                  </div>
                </div>
              )}

              {/* Error message */}
              {errorMessage && (
                <div className="search-error-box animate-fade-in">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>

            {/* Spell Correction Suggestion Hint (Xám mờ, ngay dưới thanh search, trên lịch sử tìm kiếm) */}
            {suggestedQuery && (
              <div className="search-spell-inline-hint animate-fade-in">
                <Sparkles size={14} className="spell-hint-icon" />
                <span className="spell-hint-text">
                  Ý bạn là:{" "}
                  <button
                    type="button"
                    className="spell-link-btn"
                    onClick={() => handleApplySuggestion(suggestedQuery)}
                  >
                    {suggestedQuery}
                  </button>
                  ?
                </span>
              </div>
            )}

            {/* 2. Lịch sử tìm kiếm (Search History Section) */}
            <div className="search-history-container">
              <div className="history-header-row">
                <div className="history-title-group">
                  <Clock size={15} className="history-clock-icon" />
                  <h3 className="history-title">Lịch sử tìm kiếm</h3>
                </div>
                {searchHistory.length > 0 && (
                  <button
                    type="button"
                    className="clear-history-action-btn"
                    onClick={handlePromptClearHistory}
                    title="Xóa toàn bộ lịch sử tìm kiếm"
                  >
                    <Trash2 size={14} />
                    <span>Xóa tất cả</span>
                  </button>
                )}
              </div>

              {searchHistory.length > 0 ? (
                <div className="history-tags-wrapper">
                  {searchHistory.map((keyword, index) => (
                    <button
                      key={index}
                      type="button"
                      className="history-tag-pill"
                      onClick={() => handleHistoryClick(keyword)}
                    >
                      <span>{keyword}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="history-empty-text">
                  <span>
                    Chưa có lịch sử tìm kiếm nào gần đây. Hãy nhập từ khóa để
                    bắt đầu!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Search Results Section (Chỉ hiển thị khi đã thực hiện tìm kiếm) */}
      {searchResults !== null && (
        <section className="search-results-section">
          <div className="container">
            <div className="results-top-bar">
              <div className="results-top-left">
                <h2 className="results-heading font-serif">
                  Kết Quả Tìm Kiếm ({searchResults.length} sản phẩm)
                </h2>

                {searchMetadata && (
                  <span
                    className={`results-mode-badge ${searchMetadata.searchType.toLowerCase()}`}
                  >
                    {searchMetadata.searchType === "HYBRID" && (
                      <>
                        <Layers size={13} />
                        Tìm kiếm kết hợp (Hình ảnh + Mô tả)
                      </>
                    )}
                    {searchMetadata.searchType === "IMAGE" && (
                      <>
                        <ImageIcon size={13} />
                        Tìm bằng hình ảnh (Visual Search)
                      </>
                    )}
                    {searchMetadata.searchType === "TEXT" && (
                      <>
                        <Type size={13} />
                        Tìm bằng văn bản ngữ nghĩa
                      </>
                    )}
                  </span>
                )}
              </div>
              <span className="results-ranking-note">
                Sắp xếp theo độ tương đồng Vector Cosine (CLIP Model)
              </span>
            </div>

            {/* Products Grid */}
            {searchResults.length === 0 ? (
              <div className="no-search-results-box">
                <ShoppingBag size={48} strokeWidth={1} color="#9ca3af" />
                <h3 className="no-results-title">
                  Không tìm thấy sản phẩm phù hợp
                </h3>
                <p className="no-results-desc">
                  Thử điều chỉnh câu mô tả chi tiết hơn hoặc tải lên hình ảnh
                  chụp trang phục rõ nét.
                </p>
              </div>
            ) : (
              <div className="products-grid-4 search-grid">
                {searchResults.map((p) => {
                  const primaryImg =
                    p.image_url ||
                    p.images?.[0]?.image_url ||
                    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800";
                  const priceVal = p.price
                    ? Number(p.price)
                    : p.variants?.[0]?.price
                      ? Number(p.variants[0].price)
                      : 0;
                  const tagText = p.similarity_percent
                    ? `${p.similarity_percent} Khớp`
                    : "MỚI";
                  const formattedProduct = {
                    id: p.product_id,
                    name: p.product_name,
                    price:
                      priceVal > 0
                        ? priceVal.toLocaleString("vi-VN") + "đ"
                        : "Liên hệ",
                    tag: tagText,
                    image: primaryImg,
                  };
                  return (
                    <ProductCard
                      key={p.product_id}
                      product={formattedProduct}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Khu vực: Gợi ý sản phẩm dành cho bạn (Recommended for you) */}
      <section className="search-recommendations-section">
        <div className="container">
          <div className="recommendations-header-row">
            <div className="recom-title-box">
              <div className="recom-icon-badge">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="recommendations-title font-serif">
                  Gợi Ý Sản Phẩm Dành Cho Bạn
                </h2>
                <p className="recommendations-desc">
                  Tuyển chọn dựa trên lịch sử tìm kiếm gần đây và xu hướng thời
                  trang được yêu thích
                </p>
              </div>
            </div>
            <Link to="/products" className="view-catalog-link">
              Xem toàn bộ catalog <ArrowRight size={14} />
            </Link>
          </div>

          {loadingRecommendations ? (
            <div className="recom-loading-box">
              <Loader2 size={24} className="animate-spin text-gray-500" />
              <span>Đang cá nhân hóa sản phẩm gợi ý...</span>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="recom-empty-text">
              Đang cập nhật danh mục gợi ý.
            </div>
          ) : (
            <div className="products-grid-4">
              {recommendations.map((p) => {
                const primaryImg =
                  p.image_url ||
                  p.images?.[0]?.image_url ||
                  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800";
                const priceVal = p.price ? Number(p.price) : 0;
                const formattedProduct = {
                  id: p.product_id,
                  name: p.product_name,
                  price:
                    priceVal > 0
                      ? priceVal.toLocaleString("vi-VN") + "đ"
                      : "Liên hệ",
                  tag: p.recommendation_reason?.includes("Khớp")
                    ? "GỢI Ý RIÊNG"
                    : "NỔI BẬT",
                  image: primaryImg,
                };
                return (
                  <ProductCard key={p.product_id} product={formattedProduct} />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Shopee / Google Lens Visual Focus Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={rawOriginalUrl || imagePreview}
        initialFocusBox={currentFocusBox}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
        onKeepOriginal={handleKeepOriginal}
      />

      {/* Page Styles */}
      <style>{`
        .search-page-container {
          background-color: #faf9f6;
          min-height: 80vh;
          padding-bottom: 70px;
        }

        .search-breadcrumb-bar {
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 14px 0;
        }

        .breadcrumb-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
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
        }

        .bc-current {
          color: #111827;
          font-weight: 700;
        }

        /* 1. Hero Search Box (Shopee Desktop aesthetic) */
        .search-hero-section {
          padding: 36px 0 24px;
        }

        .search-box-card {
          position: relative;
          background: #ffffff;
          border-radius: 18px;
          padding: 32px 36px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03);
          border: 1px solid #f1f1ee;
          transition: all 0.25s ease;
        }

        .search-box-card.dragging-over {
          border-color: #111827 !important;
          background-color: #fcfbf9 !important;
          box-shadow: 0 14px 40px -5px rgba(0, 0, 0, 0.12), 0 0 0 3px rgba(17, 24, 39, 0.08) !important;
        }

        .drag-drop-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          border: 2px dashed #111827;
          border-radius: 18px;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .drag-drop-card-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px;
        }

        .drag-drop-icon-pulse {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background-color: #f4f3ef;
          color: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          animation: pulse 1.8s infinite;
        }

        .drag-drop-title {
          font-size: 21px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 6px;
        }

        .drag-drop-subtitle {
          font-size: 13.5px;
          color: #4b5563;
          max-width: 440px;
          margin-bottom: 10px;
        }

        .drag-drop-types {
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .search-dropzone-hint {
          display: inline-flex;
          align-items: center;
          align-self: center;
          gap: 8px;
          margin-top: 6px;
          padding: 6px 16px;
          background-color: #f7f6f2;
          border: 1px dashed #d1cebe;
          border-radius: 999px;
          font-size: 12.5px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        .search-dropzone-hint:hover {
          background-color: #edeae0;
          border-color: #111827;
          color: #111827;
        }

        .dropzone-hint-icon {
          color: #4b5563;
          flex-shrink: 0;
        }

        .dropzone-paste-badge {
          padding: 2px 7px;
          background-color: #ffffff;
          border: 1px solid #d1cebe;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          color: #374151;
          font-family: monospace;
          letter-spacing: 0.5px;
        }

        .search-hero-title {
          font-size: 26px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 6px;
          text-align: center;
        }

        .search-hero-subtitle {
          font-size: 13.5px;
          color: #6b7280;
          text-align: center;
          margin-bottom: 24px;
        }

        .search-primary-form {
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .search-input-shell {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 2px solid #111827;
          border-radius: 12px;
          padding: 4px 6px 4px 16px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-input-shell:focus-within {
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
        }

        .search-shell-icon {
          color: #9ca3af;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .search-main-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14.5px;
          color: #111827;
          background: transparent;
          padding: 10px 0;
        }

        .input-action-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .input-action-btn:hover {
          color: #111827;
          background-color: #f3f4f6;
        }

        .camera-upload-btn.has-image {
          color: #7c3aed;
          background-color: #f5f3ff;
        }

        .search-submit-main-btn {
          background: #111827;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 11px 22px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: background-color 0.2s ease, transform 0.1s ease;
          margin-left: 6px;
          flex-shrink: 0;
        }

        .search-submit-main-btn:hover:not(:disabled) {
          background: #262626;
        }

        .search-submit-main-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .selected-image-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .selected-img-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .selected-thumb-wrapper {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid #cbd5e1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .selected-thumb-wrapper:hover {
          transform: scale(1.06);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .selected-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .thumb-zoom-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .selected-thumb-wrapper:hover .thumb-zoom-overlay {
          opacity: 1;
        }

        .view-detail-img-text {
          background: none;
          border: none;
          color: #2563eb;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .view-detail-img-text:hover {
          color: #1d4ed8;
        }

        .selected-img-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .crop-selected-img-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #fff7ed;
          border: 1px solid #fed7aa;
          color: #ea580c;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .crop-selected-img-btn:hover {
          background-color: #ffedd5;
          border-color: #fdba74;
          transform: translateY(-1px);
        }

        .remove-selected-img-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: 1px solid #fecaca;
          color: #dc2626;
          background-color: #fef2f2;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-selected-img-btn:hover {
          background-color: #fee2e2;
          border-color: #fca5a5;
          transform: translateY(-1px);
        }

        .search-error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #fef2f2;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 12.5px;
        }

        /* 2. Search History Section */
        .search-history-container {
          max-width: 820px;
          margin: 22px auto 0;
          padding-top: 18px;
          border-top: 1px dashed #e5e7eb;
        }

        .history-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .history-title-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .history-clock-icon {
          color: #9ca3af;
        }

        .history-title {
          font-size: 13px;
          font-weight: 700;
          color: #4b5563;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .clear-history-action-btn {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .clear-history-action-btn:hover {
          color: #ef4444;
        }

        .history-tags-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .history-tag-pill {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #374151;
          font-size: 12.5px;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .history-tag-pill:hover {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }

        .history-empty-text {
          font-size: 12.5px;
          color: #9ca3af;
          font-style: italic;
        }

        /* 3. Search Results Section */
        .search-results-section {
          padding: 24px 0 40px;
        }

        .results-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
          flex-wrap: wrap;
          gap: 10px;
        }

        .results-top-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .results-heading {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .results-mode-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .results-mode-badge.hybrid {
          background-color: #f5f3ff;
          color: #7c3aed;
          border: 1px solid #ddd6fe;
        }

        .results-mode-badge.image {
          background-color: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .results-mode-badge.text {
          background-color: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .results-ranking-note {
          font-size: 11.5px;
          color: #9ca3af;
        }

        .search-spell-inline-hint {
          max-width: 820px;
          margin: 12px auto 0;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13.5px;
          color: #6b7280;
          padding: 4px 6px;
        }

        .search-spell-inline-hint .spell-hint-icon {
          color: #9ca3af;
          flex-shrink: 0;
        }

        .search-spell-inline-hint .spell-hint-text {
          color: #6b7280;
        }

        .search-spell-inline-hint .spell-link-btn {
          background: none;
          border: none;
          padding: 0 3px;
          font-weight: 600;
          color: #374151;
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
          font-size: 13.5px;
          transition: color 0.15s ease;
        }

        .search-spell-inline-hint .spell-link-btn:hover {
          color: #000000;
        }

        .no-search-results-box {
          text-align: center;
          background: #ffffff;
          border-radius: 14px;
          padding: 48px 24px;
          border: 1px dashed #d1d5db;
          margin: 10px 0;
        }

        .no-results-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 12px 0 4px;
        }

        .no-results-desc {
          font-size: 13px;
          color: #6b7280;
        }

        .products-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .search-grid {
          margin-bottom: 24px;
        }

        /* 4. Recommendations Section */
        .search-recommendations-section {
          padding: 30px 0 20px;
          border-top: 1px solid #eae8e1;
        }

        .recommendations-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .recom-title-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .recom-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #d97706;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .recommendations-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .recommendations-desc {
          font-size: 12.5px;
          color: #6b7280;
          margin-top: 2px;
        }

        .view-catalog-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #111827;
          text-decoration: none;
          text-transform: uppercase;
          transition: gap 0.2s ease;
        }

        .view-catalog-link:hover {
          gap: 10px;
        }

        .recom-loading-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px;
          color: #6b7280;
          font-size: 13.5px;
        }

        .recom-empty-text {
          text-align: center;
          color: #9ca3af;
          padding: 24px;
          font-size: 13px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .products-grid-4 {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .search-box-card {
            padding: 20px 16px;
          }

          .search-hero-title {
            font-size: 20px;
          }

          .search-input-shell {
            flex-wrap: wrap;
            padding: 6px 10px;
          }

          .search-submit-main-btn {
            width: 100%;
            margin-left: 0;
            margin-top: 8px;
            justify-content: center;
          }
        }

        @media (max-width: 640px) {
          .products-grid-4 {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}

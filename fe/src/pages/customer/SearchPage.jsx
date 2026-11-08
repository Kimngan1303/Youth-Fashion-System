import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Search,
  Camera,
  Upload,
  UploadCloud,
  X,
  Sparkles,
  Clock,
  Trash2,
  SlidersHorizontal,
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
  const [hybridWeightMode, setHybridWeightMode] = useState("image_priority"); // 70/30 | 50/50 | 30/70

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

  // 1. Cleanup image preview blob URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (
        imagePreview &&
        typeof imagePreview === "string" &&
        imagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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

    // Tính toán trọng số multimodal
    let imgWeight = 0.7;
    let txtWeight = 0.3;
    if (hybridWeightMode === "balanced") {
      imgWeight = 0.5;
      txtWeight = 0.5;
    } else if (hybridWeightMode === "text_priority") {
      imgWeight = 0.3;
      txtWeight = 0.7;
    }

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
        setSearchResults(response.data?.products || []);
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
          total: response.data?.total || response.data?.products?.length || 0,
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
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setErrorMessage("");
    showSuccess("Đã nhận ảnh tìm kiếm! Nhấn 'TÌM KIẾM' để AI phân tích trang phục.");
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
  }, [imagePreview]);

  const removeImage = () => {
    if (
      imagePreview &&
      typeof imagePreview === "string" &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
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

              {/* Preview ảnh nhỏ gọn ngay dưới ô search khi đã chọn ảnh */}
              {imagePreview && (
                <div className="selected-image-bar animate-fade-in">
                  <div className="selected-img-preview-box">
                    <img
                      src={imagePreview}
                      alt="Selected"
                      className="selected-thumb"
                    />
                    <div className="selected-img-info">
                      <span className="selected-img-title">
                        Ảnh mẫu tìm kiếm
                      </span>
                      <span className="selected-img-name">
                        {selectedImage?.name || "Uploaded image"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-selected-img-btn"
                    onClick={removeImage}
                  >
                    <X size={14} /> Gỡ ảnh
                  </button>
                </div>
              )}

              {/* Multimodal Weight Control (Chỉ hiện khi VỪA CÓ ẢNH VỪA CÓ CHỮ) */}
              {selectedImage && queryText.trim() && (
                <div className="multimodal-weight-panel animate-fade-in">
                  <div className="weight-panel-left">
                    <SlidersHorizontal
                      size={15}
                      className="weight-panel-icon"
                    />
                    <span>Tỷ lệ hòa trộn Multimodal (CLIP):</span>
                  </div>
                  <div className="weight-preset-group">
                    <button
                      type="button"
                      className={`weight-preset-chip ${hybridWeightMode === "image_priority" ? "active" : ""}`}
                      onClick={() => setHybridWeightMode("image_priority")}
                    >
                      Ưu tiên ảnh (70/30)
                    </button>
                    <button
                      type="button"
                      className={`weight-preset-chip ${hybridWeightMode === "balanced" ? "active" : ""}`}
                      onClick={() => setHybridWeightMode("balanced")}
                    >
                      Cân bằng (50/50)
                    </button>
                    <button
                      type="button"
                      className={`weight-preset-chip ${hybridWeightMode === "text_priority" ? "active" : ""}`}
                      onClick={() => setHybridWeightMode("text_priority")}
                    >
                      Ưu tiên mô tả (30/70)
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
                        Đa phương thức (Ảnh{" "}
                        {Math.round(
                          (searchMetadata.weights?.image ?? 0.7) * 100,
                        )}
                        % + Text{" "}
                        {Math.round(
                          (searchMetadata.weights?.text ?? 0.3) * 100,
                        )}
                        %)
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
          border-radius: 10px;
          padding: 8px 14px;
        }

        .selected-img-preview-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .selected-thumb {
          width: 44px;
          height: 44px;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .selected-img-info {
          display: flex;
          flex-direction: column;
        }

        .selected-img-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #1e293b;
        }

        .selected-img-name {
          font-size: 11px;
          color: #64748b;
          max-width: 320px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .remove-selected-img-btn {
          background: none;
          border: 1px solid #fecaca;
          color: #dc2626;
          background-color: #fef2f2;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 600;
          padding: 5px 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }

        .remove-selected-img-btn:hover {
          background-color: #fee2e2;
        }

        .multimodal-weight-panel {
          background-color: #faf5ff;
          border: 1px solid #e9d5ff;
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .weight-panel-left {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #6b21a8;
        }

        .weight-panel-icon {
          color: #9333ea;
        }

        .weight-preset-group {
          display: flex;
          gap: 6px;
        }

        .weight-preset-chip {
          background: #ffffff;
          border: 1px solid #d8b4fe;
          color: #6b21a8;
          font-size: 11.5px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .weight-preset-chip.active {
          background: #7c3aed;
          border-color: #7c3aed;
          color: #ffffff;
          box-shadow: 0 2px 5px rgba(124, 58, 237, 0.3);
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

          .multimodal-weight-panel {
            flex-direction: column;
            align-items: flex-start;
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

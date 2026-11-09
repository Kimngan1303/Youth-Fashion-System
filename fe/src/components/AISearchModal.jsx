import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Upload,
  Sparkles,
  Search,
  ArrowRight,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  Layers,
  Image as ImageIcon,
  Type,
} from 'lucide-react';
import { aiService } from '../services/aiService';

const AISearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [suggestedQuery, setSuggestedQuery] = useState(null);
  const [wasCorrected, setWasCorrected] = useState(false);
  const [hybridWeightMode, setHybridWeightMode] = useState('image_priority');
  const [activeSearchMeta, setActiveSearchMeta] = useState(null);

  // Thu hồi Object URL khi component unmount hoặc khi imagePreview thay đổi để chống Memory Leak
  useEffect(() => {
    return () => {
      if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    setSearchResults(null);
    setErrorMessage('');
    setSuggestedQuery(null);
    setWasCorrected(false);
    setActiveSearchMeta(null);
    setHybridWeightMode('image_priority');
    onClose();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const removeImage = () => {
    if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
  };

  const executeSearch = async (targetQuery = null) => {
    const textToSearch = (targetQuery !== null ? targetQuery : queryText).trim();
    if (!textToSearch && !selectedImage) return;

    setIsSearching(true);
    setSearchResults(null);
    setErrorMessage('');

    // Tính toán trọng số cho Multimodal Search
    let imgWeight = 0.7;
    let txtWeight = 0.3;
    if (hybridWeightMode === 'balanced') {
      imgWeight = 0.5;
      txtWeight = 0.5;
    } else if (hybridWeightMode === 'text_priority') {
      imgWeight = 0.3;
      txtWeight = 0.7;
    }

    try {
      let response;
      const topK = 10;

      // 1. Chế độ 3: Kết hợp cả Ảnh và Text (Hybrid Multimodal Search)
      if (selectedImage && textToSearch) {
        response = await aiService.searchHybrid(selectedImage, textToSearch, topK, imgWeight, txtWeight);
      }
      // 2. Chế độ 1: Tìm bằng Ảnh (Visual Search)
      else if (selectedImage) {
        response = await aiService.searchByImage(selectedImage, topK);
      }
      // 3. Chế độ 2: Tìm bằng Text ngữ nghĩa (Semantic Text Search)
      else {
        response = await aiService.searchByText(textToSearch, topK);
      }

      if (response && response.status) {
        const rawProducts = response.data?.products || [];
        const validProducts = rawProducts.filter((p) =>
          typeof p.similarity === 'number' ? p.similarity >= 0.80 : true
        );
        setSearchResults(validProducts);
        const actualType =
          response.data?.search_type ||
          (selectedImage && textToSearch ? 'HYBRID' : selectedImage ? 'IMAGE' : 'TEXT');

        setActiveSearchMeta({
          searchType: actualType,
          weights: response.data?.weights || { image: imgWeight, text: txtWeight },
          query: textToSearch,
        });

        if (response.data?.was_corrected && response.data?.suggested_query) {
          setSuggestedQuery(response.data.suggested_query);
          setWasCorrected(true);
        } else {
          setSuggestedQuery(null);
          setWasCorrected(false);
        }
      } else {
        setErrorMessage(response?.message || 'Có lỗi xảy ra trong quá trình tìm kiếm.');
      }
    } catch (err) {
      console.error('Lỗi gọi AI Search API:', err);
      const apiMsg = err.response?.data?.message || err.message;
      setErrorMessage(`Không thể kết nối dịch vụ AI: ${apiMsg}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePerformSearch = (e) => {
    if (e) e.preventDefault();
    executeSearch();
  };

  const handleApplySuggestion = (suggestion) => {
    setQueryText(suggestion);
    executeSearch(suggestion);
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
    handleClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-group">
            <div className="sparkle-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="modal-title font-serif">Tìm Kiếm Thông Minh Bằng AI</h3>
              <p className="modal-subtitle">
                Hỗ trợ tìm bằng hình ảnh (Visual Search), từ khóa ngữ nghĩa và tìm kiếm kết hợp đa phương thức (CLIP Model)
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={handleClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handlePerformSearch} className="modal-body">
          {/* Upload Drop Zone */}
          <div
            className={`drop-zone ${imagePreview ? 'has-image' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="Preview" className="preview-img" />
                <button type="button" className="remove-img-btn" onClick={removeImage}>
                  <X size={14} /> Gỡ ảnh
                </button>
              </div>
            ) : (
              <label className="upload-label">
                <Upload size={32} className="upload-icon" />
                <span className="upload-text">
                  Kéo thả ảnh mẫu trang phục vào đây hoặc <strong>chọn ảnh từ máy</strong>
                </span>
                <span className="upload-hint">Hỗ trợ JPG, PNG, WEBP (Tối đa 5MB)</span>
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
              </label>
            )}
          </div>

          {/* Combined Text Input */}
          <div className="search-input-group">
            <Search size={18} className="text-input-icon" />
            <input
              type="text"
              placeholder="Nhập mô tả hoặc phong cách (VD: Áo sơ mi trắng, áo khoác dạ dáng dài, quần jeans rách)..."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
            />
            <button
              type="submit"
              className="submit-search-btn"
              disabled={isSearching || (!queryText.trim() && !selectedImage)}
            >
              {isSearching ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang xử lý vector...</span>
                </>
              ) : (
                <>
                  TÌM KIẾM <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Multimodal Weight Controls (chỉ hiện khi có cả Ảnh và Text) */}
          {selectedImage && queryText.trim() && (
            <div className="multimodal-weight-control animate-fade-in">
              <div className="weight-control-label">
                <SlidersHorizontal size={14} className="weight-icon" />
                <span>Trọng số hòa trộn CLIP:</span>
              </div>
              <div className="weight-presets">
                <button
                  type="button"
                  className={`weight-preset-btn ${hybridWeightMode === 'image_priority' ? 'active' : ''}`}
                  onClick={() => setHybridWeightMode('image_priority')}
                  title="70% đặc trưng từ ảnh + 30% từ khóa mô tả"
                >
                  Ưu tiên ảnh (70/30)
                </button>
                <button
                  type="button"
                  className={`weight-preset-btn ${hybridWeightMode === 'balanced' ? 'active' : ''}`}
                  onClick={() => setHybridWeightMode('balanced')}
                  title="50% đặc trưng ảnh + 50% từ khóa mô tả"
                >
                  Cân bằng (50/50)
                </button>
                <button
                  type="button"
                  className={`weight-preset-btn ${hybridWeightMode === 'text_priority' ? 'active' : ''}`}
                  onClick={() => setHybridWeightMode('text_priority')}
                  title="30% đặc trưng ảnh + 70% từ khóa mô tả"
                >
                  Ưu tiên mô tả (30/70)
                </button>
              </div>
            </div>
          )}

          {/* Spell Correction Suggestion Banner */}
          {suggestedQuery && (
            <div className="spell-suggestion-banner animate-fade-in">
              <Sparkles size={16} className="sparkle-hint-icon" />
              <span>
                Ý bạn là:{' '}
                <button
                  type="button"
                  className="spell-suggestion-btn"
                  onClick={() => handleApplySuggestion(suggestedQuery)}
                  title={`Tìm kiếm lại với "${suggestedQuery}"`}
                >
                  {suggestedQuery}
                </button>
                ?
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>

        {/* Results Section */}
        {searchResults !== null && (
          <div className="results-container">
            <div className="results-header">
              <div className="results-header-left">
                <h4 className="results-title font-serif">
                  Kết Quả Tương Đồng ({searchResults.length} sản phẩm)
                </h4>
                {activeSearchMeta && (
                  <span className={`search-mode-badge ${activeSearchMeta.searchType.toLowerCase()}`}>
                    {activeSearchMeta.searchType === 'HYBRID' && (
                      <>
                        <Layers size={12} />
                        Đa phương thức (Ảnh {Math.round((activeSearchMeta.weights?.image ?? 0.7) * 100)}% + Text {Math.round((activeSearchMeta.weights?.text ?? 0.3) * 100)}%)
                      </>
                    )}
                    {activeSearchMeta.searchType === 'IMAGE' && (
                      <>
                        <ImageIcon size={12} />
                        Tìm bằng ảnh
                      </>
                    )}
                    {activeSearchMeta.searchType === 'TEXT' && (
                      <>
                        <Type size={12} />
                        Tìm bằng văn bản
                      </>
                    )}
                  </span>
                )}
              </div>
              <span className="results-note">Xếp hạng theo độ tương đồng Vector Cosine</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="no-results-box">
                <p>Không tìm thấy sản phẩm tương đồng phù hợp trong kho.</p>
                <span>Hãy thử nhập từ khóa mô tả khác hoặc tải ảnh trang phục rõ nét hơn.</span>
              </div>
            ) : (
              <div className="results-grid">
                {searchResults.map((item, index) => {
                  const isTopMatch = index === 0 && parseFloat(item.similarity_percent) > 25;
                  return (
                    <div
                      key={item.product_id}
                      className="result-card"
                      onClick={() => handleProductClick(item.product_id)}
                      title="Bấm để xem chi tiết sản phẩm"
                    >
                      <div className="result-img-box">
                        <img
                          src={item.image_url || 'https://via.placeholder.com/300x400?text=No+Image'}
                          alt={item.product_name}
                          loading="lazy"
                        />
                        <span className={`similarity-badge ${isTopMatch ? 'top-match' : ''}`}>
                          <Sparkles size={11} /> {item.similarity_percent}
                        </span>
                        {isTopMatch ? (
                          <span className="match-tag exact">Khớp cao nhất</span>
                        ) : (
                          <span className="match-tag alt">Gợi ý tương tự</span>
                        )}
                      </div>
                      <div className="result-info">
                        <span className="result-category">{item.category_name}</span>
                        <h5 className="result-name">{item.product_name}</h5>
                        <div className="result-price-row">
                          <span className="result-price">
                            {Number(item.price).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(6px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-content {
          background-color: #ffffff;
          border-radius: 20px;
          max-width: 680px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .header-title-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sparkle-icon-badge {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #d97706;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.15);
        }

        .modal-title {
          font-size: 19px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .modal-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 3px 0 0;
        }

        .close-btn {
          color: #94a3b8;
          padding: 8px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-btn:hover {
          color: #0f172a;
          background-color: #f1f5f9;
        }

        .modal-body {
          padding: 20px 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .drop-zone {
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          padding: 20px;
          text-align: center;
          background-color: #f8fafc;
          transition: all 0.2s;
        }

        .drop-zone:hover {
          border-color: #0f172a;
          background-color: #f1f5f9;
        }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        }

        .upload-icon {
          color: #64748b;
          margin-bottom: 8px;
        }

        .upload-text {
          font-size: 13px;
          color: #334155;
        }

        .upload-hint {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .image-preview-wrapper {
          position: relative;
          display: inline-block;
        }

        .preview-img {
          height: 120px;
          border-radius: 10px;
          object-fit: cover;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .remove-img-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #ef4444;
          color: #ffffff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.4);
        }

        .search-input-group {
          display: flex;
          align-items: center;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 4px 6px 4px 14px;
          background-color: #ffffff;
          transition: border-color 0.2s;
        }

        .search-input-group:focus-within {
          border-color: #0f172a;
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08);
        }

        .text-input-icon {
          color: #94a3b8;
          margin-right: 10px;
        }

        .search-input-group input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 13.5px;
          color: #0f172a;
        }

        .submit-search-btn {
          background-color: #0f172a;
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .submit-search-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .multimodal-weight-control {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .weight-control-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        .weight-icon {
          color: #7c3aed;
        }

        .weight-presets {
          display: flex;
          gap: 6px;
        }

        .weight-preset-btn {
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          color: #64748b;
          font-size: 11.5px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .weight-preset-btn:hover {
          border-color: #94a3b8;
          color: #0f172a;
        }

        .weight-preset-btn.active {
          background-color: #7c3aed;
          border-color: #7c3aed;
          color: #ffffff;
          box-shadow: 0 2px 4px rgba(124, 58, 237, 0.25);
        }

        .spell-suggestion-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
        }

        .sparkle-hint-icon {
          color: #16a34a;
          flex-shrink: 0;
        }

        .spell-suggestion-btn {
          background: none;
          border: none;
          padding: 0 3px;
          font-weight: 700;
          color: #047857;
          text-decoration: underline;
          cursor: pointer;
          font-size: 13px;
          transition: color 0.15s ease;
        }

        .spell-suggestion-btn:hover {
          color: #065f46;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #fef2f2;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 12.5px;
        }

        .results-container {
          padding: 14px 24px 24px;
          border-top: 1px solid #f1f5f9;
          overflow-y: auto;
          max-height: 420px;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .results-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .search-mode-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 20px;
        }

        .search-mode-badge.hybrid {
          background-color: #f5f3ff;
          color: #7c3aed;
          border: 1px solid #ddd6fe;
        }

        .search-mode-badge.image {
          background-color: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .search-mode-badge.text {
          background-color: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .results-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .results-note {
          font-size: 11px;
          color: #94a3b8;
        }

        .no-results-box {
          text-align: center;
          padding: 30px 20px;
          color: #64748b;
          font-size: 13px;
        }

        .no-results-box span {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .result-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background-color: #ffffff;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .result-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }

        .result-img-box {
          position: relative;
          height: 130px;
          background-color: #f8fafc;
        }

        .result-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .similarity-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background-color: rgba(15, 23, 42, 0.88);
          color: #fef3c7;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 7px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(2px);
        }

        .similarity-badge.top-match {
          background-color: rgba(217, 119, 6, 0.95);
          color: #ffffff;
        }

        .match-tag {
          position: absolute;
          bottom: 8px;
          right: 8px;
          font-size: 9px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          color: #ffffff;
        }

        .match-tag.exact {
          background-color: #059669;
        }

        .match-tag.alt {
          background-color: #64748b;
        }

        .result-info {
          padding: 10px;
        }

        .result-category {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          color: #94a3b8;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .result-name {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .result-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .result-price {
          font-size: 12px;
          color: #0f172a;
          font-weight: 700;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AISearchModal;

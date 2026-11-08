import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Sparkles, Search, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { aiService } from '../services/aiService';

const AISearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

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

  const handlePerformSearch = async (e) => {
    e.preventDefault();
    if (!queryText.trim() && !selectedImage) return;

    setIsSearching(true);
    setSearchResults(null);
    setErrorMessage('');

    try {
      let response;
      const topK = 10;

      // 1. Chế độ 3: Kết hợp cả Ảnh và Text (Hybrid Search)
      if (selectedImage && queryText.trim()) {
        response = await aiService.searchHybrid(selectedImage, queryText.trim(), topK);
      }
      // 2. Chế độ 1: Tìm bằng Ảnh (Visual Search)
      else if (selectedImage) {
        response = await aiService.searchByImage(selectedImage, topK);
      }
      // 3. Chế độ 2: Tìm bằng Text ngữ nghĩa (Semantic Text Search)
      else {
        response = await aiService.searchByText(queryText.trim(), topK);
      }

      if (response && response.status) {
        setSearchResults(response.data?.products || []);
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
              <h4 className="results-title font-serif">
                Kết Quả Tương Đồng ({searchResults.length} sản phẩm)
              </h4>
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
          align-items: baseline;
          margin-bottom: 14px;
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

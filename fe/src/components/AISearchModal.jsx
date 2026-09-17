import React, { useState } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, Search, ArrowRight } from 'lucide-react';

const AISearchModal = ({ isOpen, onClose }) => {
  const [queryText, setQueryText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handlePerformSearch = (e) => {
    e.preventDefault();
    if (!queryText && !selectedImage) return;

    setIsSearching(true);
    setSearchResults(null);

    // Simulate FashionCLIP + Qdrant similarity search request
    setTimeout(() => {
      setIsSearching(false);
      setSearchResults([
        {
          id: 1,
          name: 'Classic Suit Blazer Nam Phom Rộng',
          price: '2.450.000đ',
          similarity: '96%',
          image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=400',
          isExactMatch: true
        },
        {
          id: 2,
          name: 'Oversized Charcoal Wool Coat',
          price: '2.890.000đ',
          similarity: '91%',
          image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400',
          isExactMatch: true
        },
        {
          id: 3,
          name: 'Áo Khoác Dạ Tweed Nữ High Fashion',
          price: '2.680.000đ',
          similarity: '84%',
          image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400',
          isExactMatch: false // Alternative product suggestion
        }
      ]);
    }, 1200);
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-group">
            <div className="sparkle-icon-badge">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="modal-title font-serif">Tìm Kiếm Thông Minh AI</h3>
              <p className="modal-subtitle">Tải lên hình ảnh hoặc nhập mô tả để tìm mẫu thời trang tương đồng bằng FashionCLIP</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
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
                <span className="upload-text">Kéo thả ảnh trang phục vào đây hoặc <strong>tải ảnh lên</strong></span>
                <span className="upload-hint">Hỗ trợ định dạng JPG, PNG, WEBP</span>
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
              </label>
            )}
          </div>

          {/* Combined Text Input */}
          <div className="search-input-group">
            <Search size={18} className="text-input-icon" />
            <input 
              type="text" 
              placeholder="Nhập mô tả thêm (VD: Áo blazer dạ màu xám, đầm xếp li)..." 
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
            />
            <button 
              type="submit" 
              className="submit-search-btn"
              disabled={isSearching || (!queryText && !selectedImage)}
            >
              {isSearching ? (
                <span>Đang phân tích vector...</span>
              ) : (
                <>
                  TÌM KIẾM <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Section */}
        {searchResults && (
          <div className="results-container">
            <h4 className="results-title font-serif">Kết Quả Tìm Kiếm Tương Đồng</h4>
            <div className="results-grid">
              {searchResults.map((item) => (
                <div key={item.id} className="result-card">
                  <div className="result-img-box">
                    <img src={item.image} alt={item.name} />
                    <span className="similarity-badge">
                      <Sparkles size={10} /> {item.similarity}
                    </span>
                    {!item.isExactMatch && (
                      <span className="alt-badge">Gợi ý tương tự</span>
                    )}
                  </div>
                  <div className="result-info">
                    <h5 className="result-name">{item.name}</h5>
                    <span className="result-price">{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
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
          background-color: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-content {
          background-color: #ffffff;
          border-radius: 16px;
          max-width: 640px;
          width: 100%;
          box-shadow: var(--shadow-xl);
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
          gap: 12px;
        }

        .sparkle-icon-badge {
          width: 40px;
          height: 40px;
          background-color: #fef3c7;
          color: #d97706;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-title {
          font-size: 18px;
          color: #0f172a;
        }

        .modal-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .close-btn {
          color: #94a3b8;
          padding: 6px;
          border-radius: 50%;
        }

        .close-btn:hover {
          color: #0f172a;
          background-color: #f1f5f9;
        }

        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .drop-zone {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 24px;
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
          margin-bottom: 10px;
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
          height: 140px;
          border-radius: 8px;
          object-fit: cover;
        }

        .remove-img-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #ef4444;
          color: #ffffff;
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .search-input-group {
          display: flex;
          align-items: center;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 4px 6px 4px 12px;
          background-color: #ffffff;
        }

        .text-input-icon {
          color: #94a3b8;
          margin-right: 8px;
        }

        .search-input-group input {
          border: none;
          flex: 1;
          font-size: 13px;
        }

        .submit-search-btn {
          background-color: #0f172a;
          color: #ffffff;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .submit-search-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .results-container {
          padding: 0 24px 24px;
          border-top: 1px solid #f1f5f9;
        }

        .results-title {
          font-size: 15px;
          color: #0f172a;
          margin: 16px 0 12px;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .result-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          background-color: #ffffff;
        }

        .result-img-box {
          position: relative;
          height: 120px;
        }

        .result-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .similarity-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          background-color: rgba(15, 23, 42, 0.85);
          color: #fef3c7;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .alt-badge {
          position: absolute;
          bottom: 6px;
          right: 6px;
          background-color: #d97706;
          color: #ffffff;
          font-size: 9px;
          padding: 2px 5px;
          border-radius: 3px;
        }

        .result-info {
          padding: 8px;
        }

        .result-name {
          font-size: 11px;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .result-price {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default AISearchModal;

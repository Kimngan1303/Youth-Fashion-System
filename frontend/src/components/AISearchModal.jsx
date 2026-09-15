import React, { useState } from 'react';
import { X, UploadCloud, Sparkles, Image as ImageIcon, Search, CheckCircle2 } from 'lucide-react';

export default function AISearchModal({ isOpen, onClose, onSelectResult }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      executeAISearch(reader.result, searchQuery);
    };
    reader.readAsDataURL(file);
  };

  const executeAISearch = (image, query) => {
    setIsSearching(true);
    // Giả lập xử lý AI Semantic Search tương đồng với model CLIP
    setTimeout(() => {
      setIsSearching(false);
      setSearchResults([
        {
          id: 1,
          name: 'Áo Thun Oversize Streetwear Graphic "CYBERPUNK"',
          price: '280.000đ',
          similarity: '96%',
          image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
          matchReason: 'Trùng khớp phong cách Streetwear Graphic & Tone màu đen chủ đạo'
        },
        {
          id: 2,
          name: 'Áo Khoác Varsity Jacket Phối Tay Da',
          price: '590.000đ',
          similarity: '89%',
          image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
          matchReason: 'Phong cách cá tính, phối màu tương đồng 89%'
        },
        {
          id: 3,
          name: 'Quần Jean Ống Rộng Wide-Leg Rách Gối Y2K',
          price: '450.000đ',
          similarity: '84%',
          image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80',
          matchReason: 'Phù hợp phối đồ theo phong cách hình ảnh của bạn'
        }
      ]);
    }, 1200);
  };

  const handleSubmitText = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      executeAISearch(selectedImage, searchQuery);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
            padding: '6px 14px',
            borderRadius: '9999px',
            color: '#4F46E5',
            fontWeight: '600',
            fontSize: '12px',
            marginBottom: '10px'
          }}>
            <Sparkles size={14} />
            <span>AI SEMANTIC SEARCH ENGINE 2.0</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0E0E0E' }}>
            Tìm Kiếm Trang Phục Bằng Hình Ảnh & Ngữ Nghĩa
          </h2>
          <p style={{ fontSize: '13px', color: '#737373', marginTop: '6px' }}>
            Tải lên ảnh outfit bất kỳ hoặc nhập mô tả ngữ nghĩa, AI sẽ tự động phân tích và tìm trang phục tương đồng nhất.
          </p>
        </div>

        {/* Text Input Search */}
        <form onSubmit={handleSubmitText} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{
            position: 'relative',
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', color: '#A1A1AA' }} />
            <input 
              type="text"
              placeholder="Ví dụ: Áo khoác bomber xanh phối tay da phong cách vintage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                borderRadius: '8px',
                border: '1px solid #E4E4E7',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <button 
            type="submit"
            style={{
              background: '#0E0E0E',
              color: '#FFF',
              padding: '0 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            Tìm kiếm
          </button>
        </form>

        {/* Upload Dropzone */}
        {!selectedImage ? (
          <label 
            className="upload-dropzone"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              display: 'block',
              borderColor: dragActive ? '#6366F1' : '#E2E8F0',
              backgroundColor: dragActive ? '#EEF2FF' : '#F8FAFC'
            }}
          >
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}>
                <UploadCloud size={24} color="#4F46E5" />
              </div>
              <div>
                <p style={{ fontWeight: '600', fontSize: '14px', color: '#1E293B' }}>
                  Kéo thả ảnh vào đây hoặc <span style={{ color: '#4F46E5', textDecoration: 'underline' }}>chọn file từ máy</span>
                </p>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                  Hỗ trợ JPG, PNG, WEBP lên tới 10MB
                </p>
              </div>
            </div>
          </label>
        ) : (
          <div style={{
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            maxHeight: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F1F5F9',
            marginBottom: '16px'
          }}>
            <img src={selectedImage} alt="Uploaded preview" style={{ maxHeight: '180px', objectFit: 'contain' }} />
            <button 
              onClick={() => { setSelectedImage(null); setSearchResults([]); }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: '#FFF',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px'
              }}
            >
              Đổi ảnh khác
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {isSearching && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div className="ai-pulse-dot" style={{ margin: '0 auto 12px', width: '16px', height: '16px' }}></div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#4F46E5' }}>
              AI đang phân tích vector màu sắc, họa tiết và phom dáng...
            </p>
          </div>
        )}

        {/* Results */}
        {!isSearching && searchResults.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#737373', marginBottom: '12px' }}>
              Sản phẩm gợi ý có độ tương đồng cao nhất:
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
              {searchResults.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => { if (onSelectResult) onSelectResult(item); onClose(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E5E5E5',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: '#FFF'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4F46E5'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E5E5'}
                >
                  <img src={item.image} alt={item.name} style={{ width: '50px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0E0E0E' }}>{item.name}</h4>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', background: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.similarity} Match
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#737373', marginTop: '2px' }}>{item.matchReason}</p>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0E0E0E' }}>{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

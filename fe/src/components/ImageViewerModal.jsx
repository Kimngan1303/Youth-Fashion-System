import React from 'react';
import { X, Crop, ZoomIn } from 'lucide-react';

/**
 * ImageViewerModal.jsx
 * Modal phóng to xem chi tiết ảnh tìm kiếm chất lượng cao
 */
export default function ImageViewerModal({
  isOpen,
  imageSrc,
  onClose,
  onOpenCropper,
}) {
  if (!isOpen || !imageSrc) return null;

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="image-viewer-header">
          <div className="image-viewer-title-box">
            <ZoomIn size={16} className="text-white" />
            <h4 className="image-viewer-title">Chi tiết ảnh mẫu tìm kiếm</h4>
          </div>

          <div className="image-viewer-header-actions">
            {onOpenCropper && (
              <button
                type="button"
                className="viewer-crop-action-btn"
                onClick={() => {
                  onClose();
                  onOpenCropper();
                }}
                title="Mở công cụ cắt khung trang phục"
              >
                <Crop size={14} /> Cắt ảnh trang phục
              </button>
            )}
            <button
              type="button"
              className="image-viewer-close-btn"
              onClick={onClose}
              title="Đóng (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="image-viewer-body">
          <img
            src={imageSrc}
            alt="Search preview full"
            className="image-viewer-img"
          />
        </div>
      </div>

      <style>{`
        .image-viewer-overlay {
          position: fixed;
          inset: 0;
          z-index: 9998;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .image-viewer-content {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }

        .image-viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: #1e293b;
          border-bottom: 1px solid #334155;
        }

        .image-viewer-title-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .image-viewer-title {
          font-size: 15px;
          font-weight: 600;
          color: #f8fafc;
          margin: 0;
        }

        .image-viewer-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .viewer-crop-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ea580c;
          color: #ffffff;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .viewer-crop-action-btn:hover {
          background: #c2410c;
          transform: translateY(-1px);
        }

        .image-viewer-close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .image-viewer-close-btn:hover {
          color: #ffffff;
          background: #334155;
        }

        .image-viewer-body {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020617;
          overflow: auto;
          max-height: 75vh;
        }

        .image-viewer-img {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}

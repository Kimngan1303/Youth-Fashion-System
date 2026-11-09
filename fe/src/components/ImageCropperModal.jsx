import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crop, X, Check, RotateCcw, ZoomIn } from 'lucide-react';

/**
 * ImageCropperModal.jsx
 * Component cắt ảnh trang phục tương tác theo chuẩn Shopee (Shopee Style Visual Search Cropper).
 * 
 * Tính năng:
 * - Kéo thả và thay đổi kích thước khung cắt tự do trên ảnh
 * - Vùng tối (dim overlay) làm nổi bật trang phục cần nhận diện vector
 * - Thước chia tỉ lệ 3x3 (Rule of thirds grid)
 * - 4 góc (corner handles) và 4 cạnh (edge handles) điều chỉnh mượt mà
 * - Xuất ra file Blob JPEG chất lượng cao (95%) thay thế ảnh tìm kiếm
 */
export default function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  onKeepOriginal,
}) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null); // 'move' | 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r'
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, boxX: 0, boxY: 0, boxW: 0, boxH: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Khởi tạo kích thước khung cắt mặc định (80% ở giữa ảnh) khi ảnh nạp xong
  const handleImageLoaded = (e) => {
    const img = e.target;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    setImageSize({ width: naturalW, height: naturalH });

    const displayedW = img.clientWidth;
    const displayedH = img.clientHeight;
    setDisplaySize({ width: displayedW, height: displayedH });

    // Mặc định chọn 80% diện tích ở chính giữa
    const initW = displayedW * 0.8;
    const initH = displayedH * 0.8;
    const initX = (displayedW - initW) / 2;
    const initY = (displayedH - initH) / 2;

    setCropBox({
      x: Math.max(0, initX),
      y: Math.max(0, initY),
      width: Math.min(displayedW, initW),
      height: Math.min(displayedH, initH),
    });
  };

  // Reset lại crop box về kích thước mặc định
  const handleResetCrop = () => {
    if (displaySize.width > 0 && displaySize.height > 0) {
      const initW = displaySize.width * 0.85;
      const initH = displaySize.height * 0.85;
      setCropBox({
        x: (displaySize.width - initW) / 2,
        y: (displaySize.height - initH) / 2,
        width: initW,
        height: initH,
      });
    }
  };

  // Bắt đầu kéo thả hoặc thay đổi kích thước
  const handleMouseDown = (handle, e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setActiveHandle(handle);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxX: cropBox.x,
      boxY: cropBox.y,
      boxW: cropBox.width,
      boxH: cropBox.height,
    });
  };

  // Touch support cho điện thoại / tablet
  const handleTouchStart = (handle, e) => {
    if (e.touches && e.touches[0]) {
      e.stopPropagation();
      setIsDragging(true);
      setActiveHandle(handle);
      setDragStart({
        mouseX: e.touches[0].clientX,
        mouseY: e.touches[0].clientY,
        boxX: cropBox.x,
        boxY: cropBox.y,
        boxW: cropBox.width,
        boxH: cropBox.height,
      });
    }
  };

  // Xử lý di chuyển chuột trong quá trình kéo
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !activeHandle) return;

      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
      if (clientX === undefined || clientY === undefined) return;

      const deltaX = clientX - dragStart.mouseX;
      const deltaY = clientY - dragStart.mouseY;

      const minSize = 40; // Kích thước tối thiểu của khung cắt (40px)
      const maxW = displaySize.width;
      const maxH = displaySize.height;

      let newX = dragStart.boxX;
      let newY = dragStart.boxY;
      let newW = dragStart.boxW;
      let newH = dragStart.boxH;

      if (activeHandle === 'move') {
        newX = Math.max(0, Math.min(maxW - newW, dragStart.boxX + deltaX));
        newY = Math.max(0, Math.min(maxH - newH, dragStart.boxY + deltaY));
      } else {
        // Xử lý kéo các góc & cạnh
        if (activeHandle.includes('r')) {
          newW = Math.max(minSize, Math.min(maxW - dragStart.boxX, dragStart.boxW + deltaX));
        }
        if (activeHandle.includes('b')) {
          newH = Math.max(minSize, Math.min(maxH - dragStart.boxY, dragStart.boxH + deltaY));
        }
        if (activeHandle.includes('l')) {
          const maxLeftMove = dragStart.boxX + dragStart.boxW - minSize;
          newX = Math.max(0, Math.min(maxLeftMove, dragStart.boxX + deltaX));
          newW = dragStart.boxW + (dragStart.boxX - newX);
        }
        if (activeHandle.includes('t')) {
          const maxTopMove = dragStart.boxY + dragStart.boxH - minSize;
          newY = Math.max(0, Math.min(maxTopMove, dragStart.boxY + deltaY));
          newH = dragStart.boxH + (dragStart.boxY - newY);
        }
      }

      setCropBox({
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      });
    },
    [isDragging, activeHandle, dragStart, displaySize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cập nhật lại display size khi resize màn hình
  useEffect(() => {
    const updateSize = () => {
      if (imageRef.current) {
        const displayedW = imageRef.current.clientWidth;
        const displayedH = imageRef.current.clientHeight;
        setDisplaySize({ width: displayedW, height: displayedH });
      }
    };
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Thực hiện cắt ảnh bằng Canvas HTML5
  const handleConfirmCrop = () => {
    if (!imageRef.current || displaySize.width === 0 || displaySize.height === 0) {
      if (onKeepOriginal) onKeepOriginal();
      else if (onClose) onClose();
      return;
    }

    const img = imageRef.current;
    const scaleX = img.naturalWidth / displaySize.width;
    const scaleY = img.naturalHeight / displaySize.height;

    const naturalCropX = Math.round(cropBox.x * scaleX);
    const naturalCropY = Math.round(cropBox.y * scaleY);
    const naturalCropW = Math.round(cropBox.width * scaleX);
    const naturalCropH = Math.round(cropBox.height * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = naturalCropW;
    canvas.height = naturalCropH;
    const ctx = canvas.getContext('2d');

    // Vẽ vùng được chọn từ ảnh gốc vào Canvas
    ctx.drawImage(
      img,
      naturalCropX,
      naturalCropY,
      naturalCropW,
      naturalCropH,
      0,
      0,
      naturalCropW,
      naturalCropH
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped_fashion_search.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          const croppedUrl = URL.createObjectURL(blob);
          if (onCropComplete) {
            onCropComplete(croppedFile, croppedUrl);
          }
        }
      },
      'image/jpeg',
      0.95
    );
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="shopee-crop-modal-overlay" onClick={onClose}>
      <div className="shopee-crop-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shopee-crop-header">
          <div className="shopee-crop-header-left">
            <div className="shopee-crop-badge">
              <Crop size={14} /> Shopee Visual Search
            </div>
            <h3 className="shopee-crop-title">Cắt khung trang phục</h3>
          </div>
          <button type="button" className="shopee-crop-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Subtitle / Tip */}
        <p className="shopee-crop-hint">
          Kéo thả khung để khoanh vùng đúng chiếc áo, quần hoặc đầm bạn muốn tìm kiếm. Loại bỏ người mẫu và bối cảnh xung quanh giúp AI phân tích chính xác 100%.
        </p>

        {/* Cropper Work Area */}
        <div className="shopee-crop-workspace" ref={containerRef}>
          <div className="shopee-crop-image-wrapper">
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              className="shopee-crop-source-image"
              onLoad={handleImageLoaded}
              draggable={false}
            />

            {/* Khung cắt (Draggable Bounding Box with Box-Shadow Dimming) */}
            {displaySize.width > 0 && (
              <div
                className="shopee-crop-box"
                style={{
                  transform: `translate3d(${cropBox.x}px, ${cropBox.y}px, 0)`,
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`,
                }}
                onMouseDown={(e) => handleMouseDown('move', e)}
                onTouchStart={(e) => handleTouchStart('move', e)}
              >
                {/* 3x3 Grid Lines */}
                <div className="crop-grid-line crop-grid-h1" />
                <div className="crop-grid-line crop-grid-h2" />
                <div className="crop-grid-line crop-grid-v1" />
                <div className="crop-grid-line crop-grid-v2" />

                {/* 4 Corner Handles */}
                <div
                  className="crop-handle handle-tl"
                  onMouseDown={(e) => handleMouseDown('tl', e)}
                  onTouchStart={(e) => handleTouchStart('tl', e)}
                />
                <div
                  className="crop-handle handle-tr"
                  onMouseDown={(e) => handleMouseDown('tr', e)}
                  onTouchStart={(e) => handleTouchStart('tr', e)}
                />
                <div
                  className="crop-handle handle-bl"
                  onMouseDown={(e) => handleMouseDown('bl', e)}
                  onTouchStart={(e) => handleTouchStart('bl', e)}
                />
                <div
                  className="crop-handle handle-br"
                  onMouseDown={(e) => handleMouseDown('br', e)}
                  onTouchStart={(e) => handleTouchStart('br', e)}
                />

                {/* 4 Edge Handles */}
                <div
                  className="crop-handle handle-t"
                  onMouseDown={(e) => handleMouseDown('t', e)}
                  onTouchStart={(e) => handleTouchStart('t', e)}
                />
                <div
                  className="crop-handle handle-b"
                  onMouseDown={(e) => handleMouseDown('b', e)}
                  onTouchStart={(e) => handleTouchStart('b', e)}
                />
                <div
                  className="crop-handle handle-l"
                  onMouseDown={(e) => handleMouseDown('l', e)}
                  onTouchStart={(e) => handleTouchStart('l', e)}
                />
                <div
                  className="crop-handle handle-r"
                  onMouseDown={(e) => handleMouseDown('r', e)}
                  onTouchStart={(e) => handleTouchStart('r', e)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shopee-crop-footer">
          <button
            type="button"
            className="shopee-crop-reset-btn"
            onClick={handleResetCrop}
            title="Đặt lại khung bao phủ toàn ảnh"
          >
            <RotateCcw size={15} /> Đặt lại khung
          </button>

          <div className="shopee-crop-footer-right">
            <button
              type="button"
              className="shopee-crop-cancel-btn"
              onClick={onKeepOriginal || onClose}
            >
              Giữ ảnh gốc
            </button>
            <button
              type="button"
              className="shopee-crop-apply-btn"
              onClick={handleConfirmCrop}
            >
              <Check size={16} /> Xác nhận cắt
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .shopee-crop-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.2s ease-out;
        }

        .shopee-crop-modal-content {
          background: #111827;
          color: #f9fafb;
          border: 1px solid #374151;
          border-radius: 16px;
          max-width: 680px;
          width: 100%;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
          overflow: hidden;
        }

        .shopee-crop-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 10px;
          border-bottom: 1px solid #1f2937;
        }

        .shopee-crop-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .shopee-crop-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: linear-gradient(135deg, #ee4d2d, #ff6b35);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .shopee-crop-title {
          font-size: 17px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .shopee-crop-close-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .shopee-crop-close-btn:hover {
          color: #ffffff;
          background: #374151;
        }

        .shopee-crop-hint {
          font-size: 12.5px;
          color: #9ca3af;
          padding: 8px 20px 12px;
          margin: 0;
          line-height: 1.5;
          border-bottom: 1px solid #1f2937;
        }

        .shopee-crop-workspace {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #030712;
          overflow: hidden;
          max-height: 58vh;
        }

        .shopee-crop-image-wrapper {
          position: relative;
          display: inline-block;
          max-width: 100%;
          max-height: 54vh;
          user-select: none;
        }

        .shopee-crop-source-image {
          display: block;
          max-width: 100%;
          max-height: 54vh;
          object-fit: contain;
          border-radius: 6px;
        }

        /* Khung cắt Bounding Box phong cách Shopee */
        .shopee-crop-box {
          position: absolute;
          top: 0;
          left: 0;
          cursor: move;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65);
          touch-action: none;
        }

        /* Đường kẻ 3x3 (Rule of Thirds) */
        .crop-grid-line {
          position: absolute;
          pointer-events: none;
          background: rgba(255, 255, 255, 0.35);
        }

        .crop-grid-h1 {
          top: 33.33%;
          left: 0;
          right: 0;
          height: 1px;
        }

        .crop-grid-h2 {
          top: 66.66%;
          left: 0;
          right: 0;
          height: 1px;
        }

        .crop-grid-v1 {
          left: 33.33%;
          top: 0;
          bottom: 0;
          width: 1px;
        }

        .crop-grid-v2 {
          left: 66.66%;
          top: 0;
          bottom: 0;
          width: 1px;
        }

        /* 4 góc và 4 cạnh điều chỉnh */
        .crop-handle {
          position: absolute;
          background: #ffffff;
          border: 2px solid #ee4d2d;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
          z-index: 10;
        }

        .handle-tl {
          top: -6px;
          left: -6px;
          width: 14px;
          height: 14px;
          cursor: nwse-resize;
          border-radius: 3px;
        }

        .handle-tr {
          top: -6px;
          right: -6px;
          width: 14px;
          height: 14px;
          cursor: nesw-resize;
          border-radius: 3px;
        }

        .handle-bl {
          bottom: -6px;
          left: -6px;
          width: 14px;
          height: 14px;
          cursor: nesw-resize;
          border-radius: 3px;
        }

        .handle-br {
          bottom: -6px;
          right: -6px;
          width: 14px;
          height: 14px;
          cursor: nwse-resize;
          border-radius: 3px;
        }

        .handle-t {
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 8px;
          cursor: ns-resize;
          border-radius: 4px;
        }

        .handle-b {
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 8px;
          cursor: ns-resize;
          border-radius: 4px;
        }

        .handle-l {
          left: -5px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 24px;
          cursor: ew-resize;
          border-radius: 4px;
        }

        .handle-r {
          right: -5px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 24px;
          cursor: ew-resize;
          border-radius: 4px;
        }

        /* Footer */
        .shopee-crop-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: #111827;
          border-top: 1px solid #1f2937;
        }

        .shopee-crop-reset-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid #374151;
          color: #d1d5db;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .shopee-crop-reset-btn:hover {
          background: #1f2937;
          color: #ffffff;
          border-color: #4b5563;
        }

        .shopee-crop-footer-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .shopee-crop-cancel-btn {
          background: none;
          border: 1px solid transparent;
          color: #9ca3af;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .shopee-crop-cancel-btn:hover {
          color: #ffffff;
          background: #1f2937;
        }

        .shopee-crop-apply-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #ee4d2d, #ff5722);
          color: #ffffff;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(238, 77, 45, 0.35);
          transition: all 0.2s;
        }

        .shopee-crop-apply-btn:hover {
          filter: brightness(1.1);
          box-shadow: 0 6px 16px rgba(238, 77, 45, 0.45);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scan, X, Check, RotateCcw, ChevronRight, Sparkles } from 'lucide-react';

/**
 * ImageCropperModal.jsx
 * Component Focus & Cắt ảnh trang phục tương tác chuẩn Shopee / Google Lens Visual Search.
 * 
 * Tính năng chính:
 * - Tự động nhận diện và focus vào trang phục (Áo hoặc Quần) dựa trên tỉ lệ ảnh
 * - Hiển thị khung focus góc bo màu cam coral (#FF5722) kèm tâm điểm và nút nổi "Tìm sản phẩm >"
 * - Hỗ trợ các thẻ chuyển nhanh: [Áo], [Quần / Váy], [Toàn bộ ảnh]
 * - Click vào bất kỳ vị trí nào trên ảnh để tự động di chuyển tâm focus tới sản phẩm đó
 * - Nút "Đặt lại ảnh": reset khung bao phủ 100% ảnh gốc (trạng thái ban đầu chưa focus)
 * - Nút "Giữ ảnh gốc": sử dụng toàn bộ ảnh gốc không cắt để tìm kiếm
 * - Bảo toàn ảnh gốc chất lượng cao không bị mất khi đổi vùng focus từ áo sang quần
 */
export default function ImageCropperModal({
  isOpen,
  imageSrc,
  initialFocusBox,
  onClose,
  onCropComplete,
  onKeepOriginal,
}) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [activePreset, setActivePreset] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null); // 'move' | 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r'
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, boxX: 0, boxY: 0, boxW: 0, boxH: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Danh sách các vùng focus thông minh theo tỉ lệ trang phục
  const getPresets = useCallback((dispW, dispH) => {
    const ratio = dispH / (dispW || 1);
    if (ratio >= 1.15) {
      // Ảnh người mẫu / toàn thân: chia rõ Áo (trên) và Quần (dưới)
      return [
        {
          id: 'top',
          label: 'Áo',
          icon: '👕',
          box: {
            x: Math.round(dispW * 0.15),
            y: Math.round(dispH * 0.10),
            width: Math.round(dispW * 0.70),
            height: Math.round(dispH * 0.44),
          },
        },
        {
          id: 'bottom',
          label: 'Quần / Váy',
          icon: '👖',
          box: {
            x: Math.round(dispW * 0.20),
            y: Math.round(dispH * 0.50),
            width: Math.round(dispW * 0.60),
            height: Math.round(dispH * 0.44),
          },
        },
        {
          id: 'full',
          label: 'Toàn bộ trang phục',
          icon: '✨',
          box: {
            x: Math.round(dispW * 0.10),
            y: Math.round(dispH * 0.06),
            width: Math.round(dispW * 0.80),
            height: Math.round(dispH * 0.88),
          },
        },
      ];
    } else {
      // Ảnh vuông hoặc ảnh ngang: Sản phẩm đơn hoặc flatlay
      return [
        {
          id: 'center',
          label: 'Sản phẩm chính',
          icon: '✨',
          box: {
            x: Math.round(dispW * 0.10),
            y: Math.round(dispH * 0.10),
            width: Math.round(dispW * 0.80),
            height: Math.round(dispH * 0.80),
          },
        },
        {
          id: 'top',
          label: 'Nửa trên (Áo)',
          icon: '👕',
          box: {
            x: Math.round(dispW * 0.10),
            y: Math.round(dispH * 0.05),
            width: Math.round(dispW * 0.80),
            height: Math.round(dispH * 0.48),
          },
        },
        {
          id: 'bottom',
          label: 'Nửa dưới (Quần)',
          icon: '👖',
          box: {
            x: Math.round(dispW * 0.10),
            y: Math.round(dispH * 0.47),
            width: Math.round(dispW * 0.80),
            height: Math.round(dispH * 0.48),
          },
        },
      ];
    }
  }, []);

  // Khởi tạo kích thước khung cắt mặc định khi ảnh nạp xong
  const handleImageLoaded = (e) => {
    const img = e.target;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    setImageSize({ width: naturalW, height: naturalH });

    const displayedW = img.clientWidth;
    const displayedH = img.clientHeight;
    setDisplaySize({ width: displayedW, height: displayedH });

    // Nếu đã có initialFocusBox từ trước (tỉ lệ 0-1)
    if (initialFocusBox && initialFocusBox.width > 0 && initialFocusBox.height > 0) {
      setCropBox({
        x: Math.round(initialFocusBox.x * displayedW),
        y: Math.round(initialFocusBox.y * displayedH),
        width: Math.round(initialFocusBox.width * displayedW),
        height: Math.round(initialFocusBox.height * displayedH),
      });
      return;
    }

    // Tự động focus thông minh: Ưu tiên chọn 'top' (Áo) nếu là ảnh dáng người, hoặc 'center'
    const presets = getPresets(displayedW, displayedH);
    const defaultPreset = presets[0];
    if (defaultPreset) {
      setCropBox(defaultPreset.box);
      setActivePreset(defaultPreset.id);
    }
  };

  // Chọn nhanh phân loại trang phục (Áo / Quần / Toàn bộ)
  const handleSelectPreset = (preset) => {
    setActivePreset(preset.id);
    setCropBox(preset.box);
  };

  // Đặt lại ảnh (Reset khung cắt về 100% diện tích ảnh gốc ban đầu như ảnh người dùng gửi)
  const handleResetToFullImage = () => {
    if (displaySize.width > 0 && displaySize.height > 0) {
      setActivePreset('reset');
      setCropBox({
        x: 0,
        y: 0,
        width: displaySize.width,
        height: displaySize.height,
      });
    }
  };

  // Bắt đầu kéo thả hoặc thay đổi kích thước
  const handleMouseDown = (handle, e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setActiveHandle(handle);
    setActivePreset(null);
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
      setActivePreset(null);
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

  // Click vào bất kỳ vị trí nào trên ảnh ngoài khung để chuyển tâm focus tới đó
  const handleImageAreaClick = (e) => {
    if (isDragging || !displaySize.width || !displaySize.height) return;
    const imgEl = imageRef.current;
    if (!imgEl) return;

    const rect = imgEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Giữ nguyên kích thước khung, di chuyển tâm đến điểm click
    const halfW = cropBox.width / 2;
    const halfH = cropBox.height / 2;
    const newX = Math.max(0, Math.min(displaySize.width - cropBox.width, clickX - halfW));
    const newY = Math.max(0, Math.min(displaySize.height - cropBox.height, clickY - halfH));

    setCropBox((prev) => ({
      ...prev,
      x: Math.round(newX),
      y: Math.round(newY),
    }));
    setActivePreset(null);
  };

  // Xử lý kéo di chuyển và thay đổi kích thước
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !activeHandle) return;

      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
      if (clientX === undefined || clientY === undefined) return;

      const deltaX = clientX - dragStart.mouseX;
      const deltaY = clientY - dragStart.mouseY;

      const minW = 40;
      const minH = 40;
      const maxW = displaySize.width;
      const maxH = displaySize.height;

      if (activeHandle === 'move') {
        const nextX = Math.max(0, Math.min(maxW - dragStart.boxW, dragStart.boxX + deltaX));
        const nextY = Math.max(0, Math.min(maxH - dragStart.boxH, dragStart.boxY + deltaY));
        setCropBox((prev) => ({ ...prev, x: nextX, y: nextY }));
      } else {
        let newX = dragStart.boxX;
        let newY = dragStart.boxY;
        let newW = dragStart.boxW;
        let newH = dragStart.boxH;

        if (activeHandle.includes('r')) {
          newW = Math.max(minW, Math.min(maxW - newX, dragStart.boxW + deltaX));
        }
        if (activeHandle.includes('b')) {
          newH = Math.max(minH, Math.min(maxH - newY, dragStart.boxH + deltaY));
        }
        if (activeHandle.includes('l')) {
          const maxLeftShift = dragStart.boxX + dragStart.boxW - minW;
          newX = Math.max(0, Math.min(maxLeftShift, dragStart.boxX + deltaX));
          newW = dragStart.boxX + dragStart.boxW - newX;
        }
        if (activeHandle.includes('t')) {
          const maxTopShift = dragStart.boxY + dragStart.boxH - minH;
          newY = Math.max(0, Math.min(maxTopShift, dragStart.boxY + deltaY));
          newH = dragStart.boxY + dragStart.boxH - newY;
        }

        setCropBox({
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      }
    },
    [isDragging, activeHandle, dragStart, displaySize]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setActiveHandle(null);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cắt ảnh bằng HTML5 Canvas và xuất ra File Blob chất lượng cao
  const handleConfirmCrop = () => {
    const img = imageRef.current;
    if (!img || !displaySize.width || !displaySize.height) return;

    const scaleX = img.naturalWidth / displaySize.width;
    const scaleY = img.naturalHeight / displaySize.height;

    const naturalCropX = Math.max(0, Math.round(cropBox.x * scaleX));
    const naturalCropY = Math.max(0, Math.round(cropBox.y * scaleY));
    const naturalCropW = Math.min(img.naturalWidth - naturalCropX, Math.round(cropBox.width * scaleX));
    const naturalCropH = Math.min(img.naturalHeight - naturalCropY, Math.round(cropBox.height * scaleY));

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, naturalCropW);
    canvas.height = Math.max(1, naturalCropH);
    const ctx = canvas.getContext('2d');

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
          const croppedFile = new File([blob], 'focused_fashion_product.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          const croppedUrl = URL.createObjectURL(blob);
          const normalizedBox = {
            x: Number((cropBox.x / displaySize.width).toFixed(4)),
            y: Number((cropBox.y / displaySize.height).toFixed(4)),
            width: Number((cropBox.width / displaySize.width).toFixed(4)),
            height: Number((cropBox.height / displaySize.height).toFixed(4)),
          };
          if (onCropComplete) {
            onCropComplete(croppedFile, croppedUrl, normalizedBox);
          }
        }
      },
      'image/jpeg',
      0.95
    );
  };

  // Xác định vị trí hiển thị hợp lý cho nút pill "Tìm sản phẩm >"
  const isPillOnRight = displaySize.width - (cropBox.x + cropBox.width) >= 140;

  if (!isOpen || !imageSrc) return null;

  const presets = displaySize.width > 0 ? getPresets(displaySize.width, displaySize.height) : [];

  return (
    <div className="shopee-crop-modal-overlay" onClick={onClose}>
      <div className="shopee-crop-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shopee-crop-header">
          <div className="shopee-crop-header-left">
            <div className="shopee-crop-badge">
              <Scan size={14} /> AI Visual Focus
            </div>
            <h3 className="shopee-crop-title">Nhận diện & Focus sản phẩm</h3>
          </div>
          <button type="button" className="shopee-crop-close-btn" onClick={onClose} title="Đóng (Esc)">
            <X size={20} />
          </button>
        </div>

        {/* Quick-switch Smart Preset Tags */}
        <div className="shopee-crop-preset-bar">
          <span className="preset-bar-label">
            <Sparkles size={13} className="text-orange-400" /> Focus nhanh:
          </span>
          <div className="preset-tags-group">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-pill-btn ${activePreset === preset.id ? 'active' : ''}`}
                onClick={() => handleSelectPreset(preset)}
                title={`Nhấn để tự động focus vào ${preset.label}`}
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cropper Work Area */}
        <div className="shopee-crop-workspace" ref={containerRef}>
          <div
            className="shopee-crop-image-wrapper"
            onClick={handleImageAreaClick}
            title="Nhấp vào bất kỳ vị trí nào trên ảnh để di chuyển vùng focus"
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Focus target"
              className="shopee-crop-source-image"
              onLoad={handleImageLoaded}
              draggable={false}
            />

            {/* Khung Focus Shopee / Lens Bounding Box */}
            {displaySize.width > 0 && (
              <div
                className="shopee-focus-box"
                style={{
                  transform: `translate3d(${cropBox.x}px, ${cropBox.y}px, 0)`,
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`,
                }}
                onMouseDown={(e) => handleMouseDown('move', e)}
                onTouchStart={(e) => handleTouchStart('move', e)}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 4 Góc Bo màu Cam Coral (#FF5722) như Google Lens */}
                <div className="lens-corner corner-tl" onMouseDown={(e) => handleMouseDown('tl', e)} onTouchStart={(e) => handleTouchStart('tl', e)} />
                <div className="lens-corner corner-tr" onMouseDown={(e) => handleMouseDown('tr', e)} onTouchStart={(e) => handleTouchStart('tr', e)} />
                <div className="lens-corner corner-bl" onMouseDown={(e) => handleMouseDown('bl', e)} onTouchStart={(e) => handleTouchStart('bl', e)} />
                <div className="lens-corner corner-br" onMouseDown={(e) => handleMouseDown('br', e)} onTouchStart={(e) => handleTouchStart('br', e)} />

                {/* Tâm điểm nhận diện ở chính giữa */}
                <div className="lens-center-dot" />

                {/* Nút nổi "Tìm sản phẩm >" chuẩn Shopee/Lens */}
                <button
                  type="button"
                  className={`lens-floating-pill ${isPillOnRight ? 'pill-right' : 'pill-bottom'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmCrop();
                  }}
                  title="Tìm kiếm ngay sản phẩm này"
                >
                  <Scan size={14} className="pill-scan-icon" />
                  <span>Tìm sản phẩm</span>
                  <ChevronRight size={14} />
                </button>

                {/* 4 Cạnh điều chỉnh kích thước */}
                <div className="lens-edge edge-t" onMouseDown={(e) => handleMouseDown('t', e)} onTouchStart={(e) => handleTouchStart('t', e)} />
                <div className="lens-edge edge-b" onMouseDown={(e) => handleMouseDown('b', e)} onTouchStart={(e) => handleTouchStart('b', e)} />
                <div className="lens-edge edge-l" onMouseDown={(e) => handleMouseDown('l', e)} onTouchStart={(e) => handleTouchStart('l', e)} />
                <div className="lens-edge edge-r" onMouseDown={(e) => handleMouseDown('r', e)} onTouchStart={(e) => handleTouchStart('r', e)} />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shopee-crop-footer">
          <button
            type="button"
            className="shopee-crop-reset-btn"
            onClick={handleResetToFullImage}
            title="Đặt lại ảnh về nguyên bản chưa cắt (100% toàn bộ ảnh)"
          >
            <RotateCcw size={15} /> Đặt lại ảnh
          </button>

          <div className="shopee-crop-footer-right">
            {onKeepOriginal && (
              <button
                type="button"
                className="shopee-crop-cancel-btn"
                onClick={onKeepOriginal}
                title="Sử dụng ảnh gốc nguyên bản không cắt"
              >
                Giữ ảnh gốc
              </button>
            )}
            <button
              type="button"
              className="shopee-crop-apply-btn"
              onClick={handleConfirmCrop}
              title="Xác nhận vùng focus và tiến hành tìm kiếm"
            >
              <Check size={16} /> Áp dụng tìm kiếm
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .shopee-crop-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.88);
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
          max-width: 720px;
          width: 100%;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          overflow: hidden;
        }

        .shopee-crop-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 12px;
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
          background: linear-gradient(135deg, #ff5722, #f97316);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .shopee-crop-title {
          font-size: 16.5px;
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

        /* Preset Bar */
        .shopee-crop-preset-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          background: #182234;
          border-bottom: 1px solid #1f2937;
          overflow-x: auto;
        }

        .preset-bar-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #94a3b8;
          white-space: nowrap;
        }

        .preset-tags-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .preset-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: #1e293b;
          border: 1px solid #334155;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 500;
          border-radius: 999px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .preset-pill-btn:hover {
          background: #334155;
          color: #ffffff;
          border-color: #ff5722;
        }

        .preset-pill-btn.active {
          background: #ff5722;
          color: #ffffff;
          border-color: #ff5722;
          box-shadow: 0 0 10px rgba(255, 87, 34, 0.4);
        }

        /* Cropper Work Area */
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
          cursor: crosshair;
        }

        .shopee-crop-source-image {
          display: block;
          max-width: 100%;
          max-height: 54vh;
          object-fit: contain;
          border-radius: 4px;
        }

        /* Khung Focus Shopee / Lens Bounding Box */
        .shopee-focus-box {
          position: absolute;
          top: 0;
          left: 0;
          cursor: move;
          /* Lớp phủ tối xung quanh ngoài khung */
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65);
          touch-action: none;
          border: 1px dashed rgba(255, 255, 255, 0.25);
        }

        /* 4 Góc Bo màu Cam Coral (#FF5722) như Google Lens */
        .lens-corner {
          position: absolute;
          width: 24px;
          height: 24px;
          border-color: #ff5722;
          border-style: solid;
          pointer-events: auto;
          z-index: 15;
          transition: all 0.15s ease;
        }

        .corner-tl {
          top: -3px;
          left: -3px;
          border-width: 4px 0 0 4px;
          border-top-left-radius: 8px;
          cursor: nwse-resize;
        }

        .corner-tr {
          top: -3px;
          right: -3px;
          border-width: 4px 4px 0 0;
          border-top-right-radius: 8px;
          cursor: nesw-resize;
        }

        .corner-bl {
          bottom: -3px;
          left: -3px;
          border-width: 0 0 4px 4px;
          border-bottom-left-radius: 8px;
          cursor: nesw-resize;
        }

        .corner-br {
          bottom: -3px;
          right: -3px;
          border-width: 0 4px 4px 0;
          border-bottom-right-radius: 8px;
          cursor: nwse-resize;
        }

        .lens-corner:hover {
          filter: brightness(1.2);
          transform: scale(1.1);
        }

        /* Tâm điểm nhận diện ở giữa */
        .lens-center-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.6), 0 0 12px #ff5722;
          pointer-events: none;
          animation: pulseDot 2s infinite ease-in-out;
        }

        @keyframes pulseDot {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.95;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 1;
            box-shadow: 0 0 12px rgba(255, 255, 255, 0.9), 0 0 16px #ff5722;
          }
        }

        /* Nút nổi "Tìm sản phẩm >" */
        .lens-floating-pill {
          position: absolute;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(8px);
          color: #ffffff;
          border: 1px solid rgba(255, 87, 34, 0.6);
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
          transition: all 0.2s ease;
          z-index: 25;
        }

        .pill-right {
          top: 50%;
          left: calc(100% + 12px);
          transform: translateY(-50%);
        }

        .pill-bottom {
          bottom: -44px;
          left: 50%;
          transform: translateX(-50%);
        }

        .lens-floating-pill:hover {
          background: #ff5722;
          border-color: #ff5722;
          transform: translateY(-50%) scale(1.05);
          box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);
        }

        .pill-bottom:hover {
          transform: translateX(-50%) scale(1.05);
        }

        .pill-scan-icon {
          color: #ff5722;
        }

        .lens-floating-pill:hover .pill-scan-icon {
          color: #ffffff;
        }

        /* 4 Cạnh điều chỉnh */
        .lens-edge {
          position: absolute;
          z-index: 10;
        }

        .edge-t {
          top: -4px;
          left: 20px;
          right: 20px;
          height: 8px;
          cursor: ns-resize;
        }

        .edge-b {
          bottom: -4px;
          left: 20px;
          right: 20px;
          height: 8px;
          cursor: ns-resize;
        }

        .edge-l {
          left: -4px;
          top: 20px;
          bottom: 20px;
          width: 8px;
          cursor: ew-resize;
        }

        .edge-r {
          right: -4px;
          top: 20px;
          bottom: 20px;
          width: 8px;
          cursor: ew-resize;
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
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

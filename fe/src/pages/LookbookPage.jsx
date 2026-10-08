/**
 * ==============================================================================
 * TRANG BỘ SƯU TẬP THỜI TRANG (CLIENT LOOKBOOK EDITORIAL PAGE)
 * ==============================================================================
 * 
 * Mục đích file:
 * - Hiển thị bộ sưu tập Lookbook dành cho khách hàng với giao diện tạp chí thời trang cao cấp (Editorial).
 * - Đồng bộ thời gian thực (Real-time) với bảng điều khiển của Quản lý (Manager Dashboard) qua localStorage & Custom Event.
 * - Cho phép khách hàng xem chi tiết trang phục, tag sản phẩm phối đồ, giá combo và bấm đặt mua.
 * 
 * Kiến trúc & Các khối giao diện chính:
 * 1. Khối 1: Thanh tiêu đề phụ (Editorial Bar) & Nút sao chép liên kết chia sẻ.
 * 2. Khối 2: Banner Hero toàn cảnh (Cinematic Hero Banner) giới thiệu chủ đề mùa.
 * 3. Khối 3: Thanh phân loại danh mục trang phục (Filter Tabs) & bộ đếm số lượng look.
 * 4. Khối 4: Look 01 (Vị trí 1) - Thiết kế chủ đạo với điểm chạm tương tác (Hotspots).
 * 5. Khối 5: Look 02 (Vị trí 2) - Thiết kế dạ tiệc đảo chiều (Inverted Card) & trích dẫn thiết kế.
 * 6. Khối 6: Look 03 & 04 (Vị trí 3, 4) - Lưới 2 cột song song thời thượng.
 * 7. Khối 7: Lookbook mở rộng - Tự động hiển thị các Lookbook bổ sung từ quản lý.
 * 8. Khối 8: Cam kết dịch vụ & giá trị thương hiệu (Giao hàng, may đo, đổi trả).
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2,
  ShoppingBag,
  Heart,
  Check,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { lookbookService, getLookbookPositionValue, getLookCodeByPosition } from '../services/lookbookService';
import { useAuth } from '../context/AuthContext';

export default function LookbookPage() {
  const { user, cart, addToCart } = useAuth();
  // ----------------------------------------------------------------------------
  // PHẦN 1: QUẢN LÝ TRẠNG THÁI (STATE) VÀ ĐỒNG BỘ DỮ LIỆU TỪ MYSQL
  // ----------------------------------------------------------------------------
  const [lookbooks, setLookbooks] = useState([]); // Danh sách các lookbook từ MySQL
  const [isLoading, setIsLoading] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState(null); // Điểm chạm tương tác (+) trên ảnh look 01
  const [toastMessage, setToastMessage] = useState(''); // Thông báo nổi góc màn hình khi người dùng thao tác
  const [showVideoModal, setShowVideoModal] = useState(false);

  // [HOOK] Tải dữ liệu lookbook từ MySQL Database và lắng nghe sự kiện đồng bộ
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const res = await lookbookService.getLookbooks({ status: 'published' });
        const items = res?.data || [];
        const published = items
          .filter(item => item.status === 'published')
          .sort((a, b) => getLookbookPositionValue(a.position) - getLookbookPositionValue(b.position));
        setLookbooks(published);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu Lookbook từ MySQL:', err);
        setLookbooks([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Đăng ký nhận thông báo real-time khi Quản lý thêm/sửa/đổi vị trí lookbook
    const handleStorage = (e) => {
      if (e.key === 'lookbook_updated_at') {
        loadData();
      }
    };
    window.addEventListener('lookbook-updated', loadData);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('lookbook-updated', loadData);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // ----------------------------------------------------------------------------
  // PHẦN 2: PHÂN LOẠI & ÁNH XẠ CÁC LOOKBOOK THEO THỨ TỰ VỊ TRÍ ĐIỀU KHIỂN
  // ----------------------------------------------------------------------------
  // - heroItem: Ảnh bìa Banner lớn đầu trang (vị trí 'banner')
  const heroItem = lookbooks.find(l => String(l.position).toLowerCase() === 'banner' || l.type === 'hero') || lookbooks[0];

  // - look1 đến look4: Các look chính cố định chuẩn xác theo số thứ tự vị trí trong Quản Lý
  const look1 = lookbooks.find(l => String(l.position) === '1');
  const look2 = lookbooks.find(l => String(l.position) === '2');
  const look3 = lookbooks.find(l => String(l.position) === '3');
  const look4 = lookbooks.find(l => String(l.position) === '4');

  // - extraLooks: Các lookbook bổ sung (vị trí 5, 6, 7...)
  const extraLooks = lookbooks
    .filter(l =>
      l.id !== heroItem?.id &&
      String(l.position).toLowerCase() !== 'banner' &&
      String(l.position) !== '1' &&
      String(l.position) !== '2' &&
      String(l.position) !== '3' &&
      String(l.position) !== '4'
    )
    .sort((a, b) => getLookbookPositionValue(a.position) - getLookbookPositionValue(b.position));

  // ----------------------------------------------------------------------------
  // PHẦN 3: CÁC HÀM TIỆN ÍCH XỬ LÝ SỰ KIỆN (EVENT HANDLERS)
  // ----------------------------------------------------------------------------
  // Kiểm tra xem sản phẩm đã có trong giỏ hàng hay chưa
  const isProductInCart = (product) => {
    if (!product || !cart) return false;
    const prodId = String(product.product_id || product.id || '').trim();
    const prodName = String(product.name || product.title || product.product_name || '').trim().toLowerCase();
    return cart.some(item => {
      const itemProdId = String(item.productId || item.product_id || item.id || '').trim();
      const itemTitle = String(item.title || item.name || '').trim().toLowerCase();
      if (prodId && (itemProdId === prodId || itemProdId.startsWith(prodId) || prodId.startsWith(itemProdId) || itemProdId.includes(prodId))) {
        return true;
      }
      if (prodName && itemTitle && (prodName === itemTitle || prodName.includes(itemTitle) || itemTitle.includes(prodName))) {
        return true;
      }
      return false;
    });
  };

  // Hiển thị thông báo Toast trong 3 giây
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Thêm 1 sản phẩm gắn tag trực tiếp vào giỏ hàng (nếu đã có trong giỏ thì không thêm được nữa)
  const handleAddToCartSingle = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;

    if (isProductInCart(product)) {
      showToast('Đã thêm vào giỏ hàng sản phẩm này rồi!');
      return;
    }

    const prodId = product.product_id || product.id || 'PROD';
    const title = product.name || product.title || product.product_name || 'Sản phẩm Lookbook';
    const priceVal = product.price_num || (typeof product.price === 'number' ? product.price : parseInt(String(product.price).replace(/\D/g, '')) || 0);

    addToCart({
      id: prodId,
      product_id: prodId,
      title: title,
      name: title,
      price: priceVal,
      image: product.image || product.image_url || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
      sku: product.sku || `YF-${prodId}`,
      categoryName: product.category_name || 'Lookbook Collection'
    });

    showToast(`Đã thêm "${title}" vào giỏ hàng!`);
  };

  // Thêm trọn bộ combo (tất cả các sản phẩm gắn tag chưa có trong giỏ hàng)
  const handleAddComboToCart = (look) => {
    if (!look) return;
    const prods = look.products || [];
    if (prods.length > 0) {
      const prodsToAdd = prods.filter(p => !isProductInCart(p));
      if (prodsToAdd.length === 0) {
        showToast('Tất cả sản phẩm trong bộ phối này đã có trong giỏ hàng rồi!');
        return;
      }

      prodsToAdd.forEach((p, idx) => {
        const prodId = p.product_id || p.id || `LOOK-${look.id}-${idx}`;
        const title = p.name || p.title || p.product_name || `Món phối #${idx + 1}`;
        const priceVal = p.price_num || (typeof p.price === 'number' ? p.price : parseInt(String(p.price).replace(/\D/g, '')) || 0);
        addToCart({
          id: prodId,
          product_id: prodId,
          title: title,
          name: title,
          price: priceVal,
          image: p.image || p.image_url || look.image,
          sku: p.sku || `YF-${prodId}`,
          categoryName: p.category_name || look.season || 'Lookbook Combo'
        });
      });

      if (prodsToAdd.length < prods.length) {
        showToast(`Đã thêm ${prodsToAdd.length} sản phẩm mới vào giỏ hàng (các món khác đã có sẵn)!`);
      } else {
        showToast(`Đã thêm trọn bộ ${getLookCodeByPosition(look.position)} (${prodsToAdd.length} sản phẩm) vào giỏ hàng!`);
      }
    } else {
      const comboId = `LOOK-${look.id}`;
      const isAlready = cart && cart.some(item => item.id === comboId);
      if (isAlready) {
        showToast('Bộ phối này đã có trong giỏ hàng rồi!');
        return;
      }
      const priceVal = typeof look.price === 'number' ? look.price : parseInt(String(look.price).replace(/\D/g, '')) || 2950000;
      addToCart({
        id: comboId,
        product_id: comboId,
        title: look.title,
        name: look.title,
        price: priceVal,
        image: look.image,
        sku: `YF-LOOK-${look.id}`,
        categoryName: look.season || 'Lookbook'
      });
      showToast(`Đã thêm combo "${look.title}" vào giỏ hàng!`);
    }
  };

  // Sao chép liên kết trang hiện tại vào bộ nhớ tạm (Clipboard) để chia sẻ
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Đã sao chép liên kết bộ sưu tập vào bộ nhớ tạm!');
    } else {
      showToast('Đã chia sẻ bộ sưu tập!');
    }
  };

  return (
    <div className="lookbook-view-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="lb-client-toast">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Embedded CSS for Lookbook Luxury Magazine Aesthetics */}
      <style>{`
        .lookbook-view-page {
          background-color: #F8F7F4;
          color: #171614;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          min-height: 100vh;
        }

        /* 1. Breadcrumbs Bar (Trang chủ > Lookbook) */
        .lb-breadcrumb-bar {
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 14px 0;
        }

        .lb-breadcrumb-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
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
          font-size: 10px;
        }

        .bc-current {
          color: #111827;
          font-weight: 700;
        }

        /* 2. Hero Cinematic Banner */
        .lb-hero-editorial {
          position: relative;
          width: 100%;
          min-height: 560px;
          height: 72vh;
          max-height: 740px;
          display: flex;
          align-items: flex-end;
          padding: 60px 48px;
          box-sizing: border-box;
          overflow: hidden;
          background: #111;
        }

        .lb-hero-bg-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 30%;
          filter: brightness(0.85);
          transition: transform 6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lb-hero-editorial:hover .lb-hero-bg-img {
          transform: scale(1.03);
        }

        .lb-hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.85) 100%);
        }

        .lb-hero-content {
          position: relative;
          z-index: 2;
          max-width: 860px;
          color: #FFFFFF;
        }

        .lb-hero-campaign-tag {
          display: inline-block;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          font-weight: 700;
          color: #D6D3D1;
          margin-bottom: 14px;
          background: rgba(20, 20, 20, 0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 5px 14px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        .lb-hero-main-heading {
          font-family: 'Cormorant Garamond', 'Playfair Display', 'Bodoni Moda', Georgia, serif;
          font-size: clamp(38px, 5.5vw, 68px);
          font-weight: 500;
          letter-spacing: 3px;
          line-height: 1.1;
          text-transform: uppercase;
          margin: 0 0 16px 0;
          color: #FFFFFF;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.45);
        }

        .lb-hero-desc {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-size: clamp(16px, 1.9vw, 20px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.92);
          max-width: 680px;
          margin-bottom: 28px;
          font-weight: 400;
          letter-spacing: 0.3px;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.4);
        }

        /* Glassmorphism Audio/Campaign Pill */
        .lb-audio-glass-card {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 8px 16px;
          color: #FFFFFF;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .lb-audio-glass-card:hover {
          background: rgba(255, 255, 255, 0.28);
          transform: translateY(-2px);
        }

        .lb-audio-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: #FFFFFF;
          color: #111111;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* 3. Filter Navigation Tabs */
        .lb-nav-tabs-container {
          position: sticky;
          top: 60px;
          z-index: 20;
          background: #FFFFFF;
          border-bottom: 1px solid #ECEAE4;
          padding: 14px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }

        .lb-filter-pill-group {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
        }

        .lb-filter-pill {
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          color: #57534E;
          padding: 8px 18px;
          border-radius: 999px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .lb-filter-pill:hover {
          background: #F5F4EF;
          color: #111111;
        }

        .lb-filter-pill.active {
          background: #111111;
          color: #FFFFFF;
          font-weight: 600;
        }

        .lb-count-indicator {
          font-size: 12.5px;
          color: #78716C;
          white-space: nowrap;
        }

        /* 4. Main Editorial Content Container */
        .lb-editorial-body {
          max-width: 1240px;
          margin: 0 auto;
          padding: 48px 24px;
          display: flex;
          flex-direction: column;
          gap: 56px;
        }

        /* SECTION 1: Look 01 (Left Photo, Right Card) */
        .lb-split-look-card {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          background: #FFFFFF;
          border: 1px solid #EAE8E1;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }

        .lb-split-look-card.inverted {
          grid-template-columns: 1fr 1.15fr;
        }

        .lb-photo-relative {
          position: relative;
          min-height: 520px;
          background: #E5E2DC;
          overflow: hidden;
        }

        .lb-editorial-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.8s ease;
        }

        .lb-split-look-card:hover .lb-editorial-img {
          transform: scale(1.02);
        }

        /* Interactive Hotspots */
        .lb-hotspot {
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.75);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
          animation: pulseHotspot 2s infinite;
          z-index: 10;
        }

        @keyframes pulseHotspot {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }

        .lb-hotspot-popover {
          position: absolute;
          bottom: 36px;
          left: 50%;
          transform: translateX(-50%);
          background: #111111;
          color: #FFFFFF;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          z-index: 20;
        }

        /* Right Content Details */
        .lb-look-details-col {
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #FFFFFF;
        }

        .lb-look-tag-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .lb-look-category {
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #8C857B;
          font-weight: 700;
        }

        .lb-badge-pill {
          background: #F5F4EF;
          border: 1px solid #E8E6DF;
          color: #44403C;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .lb-look-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(22px, 2.5vw, 28px);
          font-weight: 700;
          color: #111111;
          line-height: 1.25;
          margin: 0 0 14px 0;
        }

        .lb-look-desc {
          font-size: 14px;
          line-height: 1.65;
          color: #57534E;
          margin: 0 0 24px 0;
        }

        .lb-quote-card {
          background: #F9F8F5;
          border-left: 3px solid #111111;
          padding: 14px 18px;
          font-style: italic;
          font-size: 13.5px;
          color: #44403C;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        /* Tagged Products list */
        .lb-products-subheading {
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #78716C;
          margin-bottom: 12px;
        }

        .lb-product-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: #FAFAF9;
          border-radius: 8px;
          border: 1px solid #ECEAE4;
          margin-bottom: 8px;
          transition: all 0.2s ease;
        }

        .lb-product-row:hover {
          background: #F5F4EF;
          border-color: #DFDCD4;
        }

        .lb-product-info-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .lb-product-thumb-img {
          width: 38px;
          height: 38px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid #E5E2DC;
          flex-shrink: 0;
          background: #EAE6DF;
        }

        .lb-product-name {
          color: #1C1917;
          font-weight: 600;
          font-size: 13px;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lb-product-price {
          font-weight: 700;
          color: #111111;
          font-size: 13px;
          white-space: nowrap;
        }

        .btn-add-item-cart {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #111111;
          color: #FFFFFF;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .btn-add-item-cart:hover {
          background: #27272A;
          transform: translateY(-1px);
        }

        .btn-add-item-cart.in-cart {
          background: #DCFCE7;
          color: #15803D;
          border: 1px solid #BBF7D0;
        }

        .btn-add-item-cart.in-cart:hover {
          background: #D1FAE5;
          transform: none;
        }

        .lb-cta-container {
          margin-top: 28px;
        }

        .btn-buy-combo {
          width: 100%;
          background: #111111;
          color: #FFFFFF;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s ease;
        }

        .btn-buy-combo:hover {
          background: #27272A;
          transform: translateY(-1px);
        }

        /* 5. Two-Columns Look Grid */
        .lb-two-cols-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
        }

        .lb-vertical-look-card {
          background: #FFFFFF;
          border: 1px solid #EAE8E1;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
        }

        .lb-vert-img-box {
          position: relative;
          height: 440px;
          background: #EAE6DF;
          overflow: hidden;
        }

        .lb-vert-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex: 1;
        }

        /* 6. Craftsmanship & Backstage Banner */
        .lb-craftsmanship-card {
          background: #F1EFEA;
          border-radius: 12px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          border: 1px solid #E2DFD6;
        }

        .lb-craft-img-box {
          position: relative;
          min-height: 380px;
        }

        .lb-craft-content {
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .lb-stats-3-col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 24px 0;
          padding: 18px 0;
          border-top: 1px solid #DFDCD4;
          border-bottom: 1px solid #DFDCD4;
        }

        .lb-stat-big-num {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #111111;
          line-height: 1;
          margin-bottom: 6px;
        }

        .lb-stat-desc {
          font-size: 11.5px;
          color: #78716C;
          line-height: 1.4;
        }

        /* 7. Value Props Row */
        .lb-value-props-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          padding: 40px 0;
          border-top: 1px solid #EAE7E0;
        }

        .lb-value-prop-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .lb-value-prop-icon {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: #FFFFFF;
          border: 1px solid #E2DFD6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111111;
          flex-shrink: 0;
        }

        .lb-value-prop-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #111111;
          margin-bottom: 4px;
        }

        .lb-value-prop-sub {
          font-size: 11.5px;
          color: #78716C;
          line-height: 1.5;
        }

        /* Toast notification */
        .lb-client-toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          background: #111111;
          color: #FFFFFF;
          padding: 12px 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          font-weight: 500;
          box-shadow: 0 10px 25px rgba(0,0,0,0.25);
          z-index: 9999;
          animation: slideUpToast 0.3s ease;
        }

        @keyframes slideUpToast {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Responsive Breakpoints */
        @media (max-width: 960px) {
          .lb-split-look-card,
          .lb-split-look-card.inverted,
          .lb-craftsmanship-card {
            grid-template-columns: 1fr;
          }
          .lb-two-cols-grid {
            grid-template-columns: 1fr;
          }
          .lb-value-props-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .lb-hero-editorial {
            padding: 40px 24px;
          }
        }

        @media (max-width: 600px) {
          .lb-value-props-grid {
            grid-template-columns: 1fr;
          }
          .lb-stats-3-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ----------------------------------------------------------------------
          KHỐI 1: THANH ĐIỀU HƯỚNG BREADCRUMBS (TRANG CHỦ > LOOKBOOK)
          ---------------------------------------------------------------------- */}
      <div className="lb-breadcrumb-bar">
        <div className="container lb-breadcrumb-content">
          <Link to="/" className="bc-link">TRANG CHỦ</Link>
          <span className="bc-sep">&gt;</span>
          <span className="bc-current">LOOKBOOK</span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '140px 20px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '14px', color: '#78716C', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Đang tải bộ sưu tập thời trang...
          </p>
        </div>
      ) : lookbooks.length === 0 ? (
        /* Giao diện hiển thị khi chưa có bộ sưu tập nào được phát hành */
        <div style={{ textAlign: 'center', padding: '120px 20px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', color: '#111', marginBottom: '12px' }}>
            Chưa có Tuyển Tập Lookbook nào được phát hành
          </h2>
          <p style={{ fontSize: '14px', color: '#78716C', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            Hiện chưa có bộ sưu tập Lookbook nào trong cơ sở dữ liệu. Quý khách vui lòng quay lại sau!
          </p>
          <Link to="/" style={{ padding: '12px 28px', background: '#111', color: '#FFF', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
            VỀ TRANG CHỦ
          </Link>
        </div>
      ) : (
        <>
          {/* ------------------------------------------------------------------
              KHỐI 2: ẢNH BÌA HERO CINEMATIC BANNER (ĐIỀU KHIỂN BỞI VỊ TRÍ BANNER)
              - Ảnh chụp toàn cảnh, tag chiến dịch và mô tả phong cách từ SQL
              ------------------------------------------------------------------ */}
          {heroItem && (
            <section className="lb-hero-editorial">
              {heroItem.image && (
                <img
                  src={heroItem.image}
                  alt={heroItem.title || ''}
                  className="lb-hero-bg-img"
                />
              )}
              <div className="lb-hero-overlay" />

              <div className="lb-hero-content">
                {heroItem.season && (
                  <span className="lb-hero-campaign-tag">
                    {heroItem.season.toUpperCase()}
                  </span>
                )}
                {heroItem.title && (
                  <h1 className="lb-hero-main-heading">
                    {heroItem.title}
                  </h1>
                )}
                {heroItem.description && (
                  <p className="lb-hero-desc">
                    {heroItem.description}
                  </p>
                )}
              </div>
            </section>
          )}


          {/* ------------------------------------------------------------------
              KHỐI 4: THÂN NỘI DUNG CHÍNH (EDITORIAL BODY LOOKS)
              ------------------------------------------------------------------ */}
          <main className="lb-editorial-body">

            {/* --- KHỐI 4.1: LOOK 01 (Điểm Chạm Tương Tác Hotspots) --- */}
            {look1 && (
              <section className="lb-split-look-card">
                {/* Cột ảnh trái với các điểm chạm (+) xem tên phụ kiện */}
                <div className="lb-photo-relative">
                  {look1.image && (
                    <img
                      src={look1.image}
                      alt={look1.title || ''}
                      className="lb-editorial-img"
                    />
                  )}
                  {look1.hotspots?.map((hs, idx) => (
                    <div
                      key={idx}
                      className="lb-hotspot"
                      style={{ top: hs.top, left: hs.left }}
                      onClick={() => setActiveHotspot(activeHotspot === idx ? null : idx)}
                    >
                      +
                      {activeHotspot === idx && (
                        <div className="lb-hotspot-popover">
                          {hs.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Cột thông tin phải: Chi tiết các món đồ & nút Mua trọn bộ */}
                <div className="lb-look-details-col">
                  <div>
                    <div className="lb-look-tag-row">
                      <span className="lb-look-category">
                        {look1.season ? `${look1.season} • ` : ''}{getLookCodeByPosition(look1.position)}
                      </span>
                      {look1.badge && <span className="lb-badge-pill">{look1.badge}</span>}
                    </div>

                    <h2 className="lb-look-title">
                      {look1.title}
                    </h2>

                    {look1.description && (
                      <p className="lb-look-desc">
                        {look1.description}
                      </p>
                    )}

                    {look1.products && look1.products.length > 0 && (
                      <>
                        <div className="lb-products-subheading">DANH SÁCH SẢN PHẨM PHỐI:</div>
                        {look1.products.map((p, i) => {
                          const inCart = isProductInCart(p);
                          return (
                            <div key={i} className="lb-product-row">
                              <div className="lb-product-info-left">
                                {p.image ? (
                                  <img src={p.image} alt={p.name} className="lb-product-thumb-img" />
                                ) : (
                                  <div className="lb-product-thumb-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#8C857B' }}>SP</div>
                                )}
                                <div style={{ minWidth: 0 }}>
                                  <div className="lb-product-name">{p.name}</div>
                                  <div className="lb-product-price">{p.price}</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`btn-add-item-cart ${inCart ? 'in-cart' : ''}`}
                                onClick={(e) => handleAddToCartSingle(e, p)}
                                title={inCart ? `Sản phẩm ${p.name} đã có trong giỏ hàng` : `Thêm ${p.name} vào giỏ hàng`}
                              >
                                {inCart ? <Check size={13} /> : <ShoppingBag size={13} />}
                                <span>{inCart ? 'Đã thêm' : 'Thêm giỏ'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>

                  <div className="lb-cta-container">
                    <button
                      type="button"
                      className="btn-buy-combo"
                      onClick={() => handleAddComboToCart(look1)}
                    >
                      <ShoppingBag size={16} />
                      <span>{look1.ctaText || (look1.price ? `Mua Trọn Bộ Phối Đồ • ${look1.price}` : 'Mua Trọn Bộ Phối Đồ')}</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* --- KHỐI 4.2: LOOK 02 (Thiết Kế Thẻ Đảo Chiều Inverted) --- */}
            {look2 && (
              <section className="lb-split-look-card inverted">
                <div className="lb-look-details-col">
                  <div>
                    <div className="lb-look-tag-row">
                      <span className="lb-look-category">
                        {look2.season ? `${look2.season} • ` : ''}{getLookCodeByPosition(look2.position)}
                      </span>
                      {look2.badge && (
                        <span className="lb-badge-pill" style={{ background: '#DCFCE7', color: '#15803D', borderColor: '#BBF7D0' }}>
                          {look2.badge}
                        </span>
                      )}
                    </div>

                    <h2 className="lb-look-title">
                      {look2.title}
                    </h2>

                    {(look2.description || look2.quote) && (
                      <div className="lb-quote-card">
                        {(() => {
                          const text = look2.description || look2.quote;
                          const trimmed = text.trim();
                          return trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed : `"${trimmed}"`;
                        })()}
                      </div>
                    )}

                    {look2.products && look2.products.length > 0 && (
                      <>
                        <div className="lb-products-subheading">DANH SÁCH SẢN PHẨM PHỐI:</div>
                        {look2.products.map((p, i) => {
                          const inCart = isProductInCart(p);
                          return (
                            <div key={i} className="lb-product-row">
                              <div className="lb-product-info-left">
                                {p.image ? (
                                  <img src={p.image} alt={p.name} className="lb-product-thumb-img" />
                                ) : (
                                  <div className="lb-product-thumb-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#8C857B' }}>SP</div>
                                )}
                                <div style={{ minWidth: 0 }}>
                                  <div className="lb-product-name">{p.name}</div>
                                  <div className="lb-product-price">{p.price}</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`btn-add-item-cart ${inCart ? 'in-cart' : ''}`}
                                onClick={(e) => handleAddToCartSingle(e, p)}
                                title={inCart ? `Sản phẩm ${p.name} đã có trong giỏ hàng` : `Thêm ${p.name} vào giỏ hàng`}
                              >
                                {inCart ? <Check size={13} /> : <ShoppingBag size={13} />}
                                <span>{inCart ? 'Đã thêm' : 'Thêm giỏ'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {(look2.price || look2.stockInfo) && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                        {look2.price && (
                          <span style={{ fontSize: '26px', fontWeight: 700, color: '#111', fontFamily: "'Playfair Display', Georgia, serif" }}>
                            {look2.price}
                          </span>
                        )}
                        {look2.stockInfo && (
                          <span style={{ fontSize: '12px', color: '#B45309', fontWeight: 600 }}>
                            {look2.stockInfo}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="lb-cta-container">
                    <button
                      type="button"
                      className="btn-buy-combo"
                      onClick={() => handleAddComboToCart(look2)}
                    >
                      <ShoppingBag size={16} />
                      <span>{look2.ctaText || 'ĐẶT MUA TRỌN BỘ'}</span>
                    </button>
                  </div>
                </div>

                <div className="lb-photo-relative">
                  {look2.image && (
                    <img
                      src={look2.image}
                      alt={look2.title || ''}
                      className="lb-editorial-img"
                    />
                  )}
                  {look2.badge && (
                    <span
                      className="lb-badge-pill"
                      style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.65)', color: '#FFFFFF', borderColor: 'transparent' }}
                    >
                      {look2.badge}
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* --- KHỐI 4.3: LƯỚI 2 CỘT SONG SONG (LOOK 03 & LOOK 04) --- */}
            {(look3 || look4) && (
              <section className="lb-two-cols-grid">
                {/* Look 03 */}
                {look3 && (
                  <div className="lb-vertical-look-card">
                    <div className="lb-vert-img-box">
                      {look3.image && (
                        <img
                          src={look3.image}
                          alt={look3.title || ''}
                          className="lb-editorial-img"
                        />
                      )}
                      <span className="lb-badge-pill" style={{ position: 'absolute', top: '16px', left: '16px', background: '#FFFFFF' }}>
                        {getLookCodeByPosition(look3.position)}
                      </span>
                    </div>
                    <div className="lb-vert-body">
                      <div>
                        {look3.season && <span className="lb-look-category">{look3.season}</span>}
                        <h3 className="lb-look-title" style={{ fontSize: '20px', margin: '6px 0 10px 0' }}>
                          {look3.title}
                        </h3>
                        {look3.description && (
                          <p className="lb-look-desc" style={{ fontSize: '13px', marginBottom: '16px' }}>
                            {look3.description}
                          </p>
                        )}
                        {look3.products?.map((p, i) => {
                          const inCart = isProductInCart(p);
                          return (
                            <div key={i} className="lb-product-row">
                              <div className="lb-product-info-left">
                                {p.image ? (
                                  <img src={p.image} alt={p.name} className="lb-product-thumb-img" />
                                ) : null}
                                <div style={{ minWidth: 0 }}>
                                  <div className="lb-product-name">{p.name}</div>
                                  <div className="lb-product-price">{p.price}</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`btn-add-item-cart ${inCart ? 'in-cart' : ''}`}
                                onClick={(e) => handleAddToCartSingle(e, p)}
                                title={inCart ? `Sản phẩm ${p.name} đã có trong giỏ hàng` : `Thêm ${p.name} vào giỏ hàng`}
                              >
                                {inCart ? <Check size={12} /> : <ShoppingBag size={12} />}
                                <span>{inCart ? 'Đã thêm' : 'Thêm giỏ'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>{look3.price || ''}</span>
                        <button
                          type="button"
                          className="btn-buy-combo"
                          style={{ width: 'auto', padding: '10px 18px' }}
                          onClick={() => handleAddComboToCart(look3)}
                        >
                          {look3.ctaText || 'Mua Ngay'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Look 04 */}
                {look4 && (
                  <div className="lb-vertical-look-card">
                    <div className="lb-vert-img-box">
                      {look4.image && (
                        <img
                          src={look4.image}
                          alt={look4.title || ''}
                          className="lb-editorial-img"
                        />
                      )}
                      <span className="lb-badge-pill" style={{ position: 'absolute', top: '16px', left: '16px', background: '#FFFFFF' }}>
                        {getLookCodeByPosition(look4.position)}
                      </span>
                    </div>
                    <div className="lb-vert-body">
                      <div>
                        {look4.season && <span className="lb-look-category">{look4.season}</span>}
                        <h3 className="lb-look-title" style={{ fontSize: '20px', margin: '6px 0 10px 0' }}>
                          {look4.title}
                        </h3>
                        {look4.description && (
                          <p className="lb-look-desc" style={{ fontSize: '13px', marginBottom: '16px' }}>
                            {look4.description}
                          </p>
                        )}
                        {look4.products?.map((p, i) => {
                          const inCart = isProductInCart(p);
                          return (
                            <div key={i} className="lb-product-row">
                              <div className="lb-product-info-left">
                                {p.image ? (
                                  <img src={p.image} alt={p.name} className="lb-product-thumb-img" />
                                ) : null}
                                <div style={{ minWidth: 0 }}>
                                  <div className="lb-product-name">{p.name}</div>
                                  <div className="lb-product-price">{p.price}</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`btn-add-item-cart ${inCart ? 'in-cart' : ''}`}
                                onClick={(e) => handleAddToCartSingle(e, p)}
                                title={inCart ? `Sản phẩm ${p.name} đã có trong giỏ hàng` : `Thêm ${p.name} vào giỏ hàng`}
                              >
                                {inCart ? <Check size={12} /> : <ShoppingBag size={12} />}
                                <span>{inCart ? 'Đã thêm' : 'Thêm giỏ'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>{look4.price || ''}</span>
                        <button
                          type="button"
                          className="btn-buy-combo"
                          style={{ width: 'auto', padding: '10px 18px' }}
                          onClick={() => handleAddComboToCart(look4)}
                        >
                          {look4.ctaText || 'Mua Ngay'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* --- KHỐI 4.4: CÁC LOOKBOOK BỔ SUNG (DO QUẢN LÝ THÊM MỚI TẠI MANAGER DASHBOARD) --- */}
            {extraLooks.length > 0 && (
              <section className="lb-two-cols-grid">
                {extraLooks.map((item) => (
                  <div key={item.id} className="lb-vertical-look-card">
                    <div className="lb-vert-img-box">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="lb-editorial-img"
                      />
                      <span className="lb-badge-pill" style={{ position: 'absolute', top: '16px', left: '16px', background: '#FFFFFF' }}>
                        {getLookCodeByPosition(item.position)}
                      </span>
                    </div>
                    <div className="lb-vert-body">
                      <div>
                        <span className="lb-look-category">{item.season || 'BỘ SƯU TẬP'}</span>
                        <h3 className="lb-look-title" style={{ fontSize: '20px', margin: '6px 0 10px 0' }}>
                          {item.title}
                        </h3>
                        <p className="lb-look-desc" style={{ fontSize: '13px', marginBottom: '16px' }}>
                          {item.description}
                        </p>
                        {item.products && item.products.length > 0 && (
                          <div style={{ margin: '10px 0' }}>
                            {item.products.map((p, i) => {
                              const inCart = isProductInCart(p);
                              return (
                                <div key={i} className="lb-product-row">
                                  <div className="lb-product-info-left">
                                    {p.image ? (
                                      <img src={p.image} alt={p.name} className="lb-product-thumb-img" />
                                    ) : null}
                                    <div style={{ minWidth: 0 }}>
                                      <div className="lb-product-name">{p.name}</div>
                                      <div className="lb-product-price">{p.price}</div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className={`btn-add-item-cart ${inCart ? 'in-cart' : ''}`}
                                    onClick={(e) => handleAddToCartSingle(e, p)}
                                    title={inCart ? `Sản phẩm ${p.name} đã có trong giỏ hàng` : `Thêm ${p.name} vào giỏ hàng`}
                                  >
                                    {inCart ? <Check size={12} /> : <ShoppingBag size={12} />}
                                    <span>{inCart ? 'Đã thêm' : 'Thêm giỏ'}</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>{item.price || ''}</span>
                        <button
                          type="button"
                          className="btn-buy-combo"
                          style={{ width: 'auto', padding: '10px 18px' }}
                          onClick={() => handleAddComboToCart(item)}
                        >
                          Mua Ngay
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}


          </main>
        </>
      )}
    </div>
  );
}

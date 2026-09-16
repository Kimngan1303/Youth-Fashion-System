import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Share2, 
  ShoppingBag, 
  Heart, 
  Volume2, 
  VolumeX, 
  Play, 
  Check, 
  Truck, 
  RotateCcw, 
  Scissors, 
  ShieldCheck, 
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { getStoredLookbooks } from '../services/lookbookData';
import { useAuth } from '../context/AuthContext';

export default function LookbookPage() {
  const { user } = useAuth();
  const [lookbooks, setLookbooks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Load published lookbooks
  useEffect(() => {
    const loadData = () => {
      const all = getStoredLookbooks();
      const published = all
        .filter(item => item.status === 'published')
        .sort((a, b) => Number(a.position) - Number(b.position));
      setLookbooks(published);
    };

    loadData();
    window.addEventListener('lookbook-updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('lookbook-updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const primaryLookbook = lookbooks[0] || {};
  const outfits = primaryLookbook.outfits || [];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

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

        /* 1. Sub-Header Editorial Bar */
        .lb-sub-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 32px;
          background: #FFFFFF;
          border-bottom: 1px solid #ECEAE4;
          font-size: 11px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          font-weight: 600;
          color: #78716C;
        }

        .btn-share-editorial {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #44403C;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          transition: color 0.2s;
        }

        .btn-share-editorial:hover {
          color: #111111;
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
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 700;
          color: #E2DFD7;
          margin-bottom: 12px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          padding: 4px 12px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .lb-hero-main-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(38px, 6vw, 68px);
          font-weight: 700;
          letter-spacing: 2px;
          line-height: 1.08;
          text-transform: uppercase;
          margin: 0 0 16px 0;
          color: #FFFFFF;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .lb-hero-desc {
          font-size: clamp(14px, 1.8vw, 17px);
          line-height: 1.6;
          color: #F0EEE9;
          max-width: 640px;
          margin-bottom: 28px;
          font-weight: 300;
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
          padding: 10px 0;
          border-bottom: 1px dashed #E7E5DF;
          font-size: 13.5px;
        }

        .lb-product-name {
          color: #1C1917;
          font-weight: 500;
        }

        .lb-product-price {
          font-weight: 700;
          color: #111111;
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

      {/* 1. Sub-Header Editorial Bar */}
      <div className="lb-sub-bar">
        <span>BỘ SƯU TẬP THU ĐÔNG 2025 • FALL / WINTER EDITORIAL</span>
        <button type="button" className="btn-share-editorial" onClick={handleShare}>
          <Share2 size={13} />
          <span>CHIA SẺ BỘ SƯU TẬP</span>
        </button>
      </div>

      {lookbooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '120px 20px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', color: '#111', marginBottom: '12px' }}>
            Chưa có Tuyển Tập Lookbook nào được phát hành
          </h2>
          <p style={{ fontSize: '14px', color: '#78716C', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            Các bộ sưu tập đã được gỡ bỏ khỏi hệ thống quản lý. Quý khách vui lòng quay lại sau!
          </p>
          <Link to="/" style={{ padding: '12px 28px', background: '#111', color: '#FFF', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
            VỀ TRANG CHỦ
          </Link>
        </div>
      ) : (
        <>
          {/* 2. Hero Cinematic Banner */}
          <section className="lb-hero-editorial">
        <img
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1600"
          alt="L'Automne Éternel Campaign"
          className="lb-hero-bg-img"
        />
        <div className="lb-hero-overlay" />

        <div className="lb-hero-content">
          <span className="lb-hero-campaign-tag">
            BỘ SƯU TẬP MÙA THU ĐÔNG 2025 • CHIẾN DỊCH CHÍNH THỨC
          </span>
          <h1 className="lb-hero-main-heading">
            L'AUTOMNE ÉTERNEL.
          </h1>
          <p className="lb-hero-desc">
            {primaryLookbook.heroSubtitle || "Khúc xạ của thu vĩnh cửu giữa đại lộ Paris — Nơi phong cách hòa cùng nghệ thuật may đo thủ công Pháp."}
          </p>

          {/* Audio / Soundtrack glass pill */}
          <div 
            className="lb-audio-glass-card" 
            onClick={() => {
              setIsPlayingAudio(!isPlayingAudio);
              showToast(isPlayingAudio ? 'Đã tắt âm thanh nền' : 'Đang phát âm thanh Paris Autumn Symphony');
            }}
          >
            <div className="lb-audio-icon-btn">
              {isPlayingAudio ? <Volume2 size={15} /> : <Play size={14} fill="#111" />}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                BẢN GHI PHONG CÁCH
              </div>
              <div style={{ fontSize: '12.5px', color: '#ECEAE4' }}>
                {primaryLookbook.campaignAudio || "Paris Autumn Symphony • 3:42 mins"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Filter Navigation Tabs */}
      <div className="lb-nav-tabs-container">
        <div className="lb-filter-pill-group">
          <button
            type="button"
            className={`lb-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Tất cả trang phục
          </button>
          <button
            type="button"
            className={`lb-filter-pill ${activeFilter === 'coat' ? 'active' : ''}`}
            onClick={() => setActiveFilter('coat')}
          >
            Áo Khoác & Măng Tô
          </button>
          <button
            type="button"
            className={`lb-filter-pill ${activeFilter === 'dress' ? 'active' : ''}`}
            onClick={() => setActiveFilter('dress')}
          >
            Đầm Dạ Tiệc & Lụa
          </button>
          <button
            type="button"
            className={`lb-filter-pill ${activeFilter === 'chic' ? 'active' : ''}`}
            onClick={() => setActiveFilter('chic')}
          >
            Set Phối Parisian Chic
          </button>
          <button
            type="button"
            className={`lb-filter-pill ${activeFilter === 'accessories' ? 'active' : ''}`}
            onClick={() => setActiveFilter('accessories')}
          >
            Phụ Kiện Da & Khăn Len
          </button>
        </div>

        <div className="lb-count-indicator">
          Hiển thị <strong>8/8 Phối Đồ Tuyển Chọn</strong>
        </div>
      </div>

      {/* 4. Main Editorial Looks Content */}
      <main className="lb-editorial-body">

        {/* SECTION 1: LOOK 01 (Camel Belted Cashmere Coat) */}
        <section className="lb-split-look-card">
          <div className="lb-photo-relative">
            <img
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000"
              alt="Look 01 - Coat"
              className="lb-editorial-img"
            />
            {/* Interactive Hotspot 1 on Coat */}
            <div 
              className="lb-hotspot" 
              style={{ top: '38%', left: '46%' }}
              onClick={() => setActiveHotspot(activeHotspot === 1 ? null : 1)}
            >
              +
              {activeHotspot === 1 && (
                <div className="lb-hotspot-popover">
                  Áo Măng Tô Dạ Camel — 3.850.000₫
                </div>
              )}
            </div>

            {/* Interactive Hotspot 2 on Boots */}
            <div 
              className="lb-hotspot" 
              style={{ top: '82%', left: '54%' }}
              onClick={() => setActiveHotspot(activeHotspot === 2 ? null : 2)}
            >
              +
              {activeHotspot === 2 && (
                <div className="lb-hotspot-popover">
                  Bốt Da Nappa Cổ Điển — 2.100.000₫
                </div>
              )}
            </div>
          </div>

          <div className="lb-look-details-col">
            <div>
              <div className="lb-look-tag-row">
                <span className="lb-look-category">PHONG CÁCH THU ĐÔNG • LOOK 01</span>
                <span className="lb-badge-pill">SIGNATURE</span>
              </div>

              <h2 className="lb-look-title">
                Áo Măng Tô Belted Dạ Camel Cashmere Quý Phái Thời Đại
              </h2>

              <p className="lb-look-desc">
                Cắt may thủ công từ 100% len lông cừu Merino pha Cashmere tự nhiên, cổ bẻ kinh điển cùng thắt lưng tôn dáng sang trọng.
              </p>

              <div className="lb-products-subheading">DANH SÁCH SẢN PHẨM PHỐI:</div>
              <div className="lb-product-row">
                <span className="lb-product-name">Áo Măng Tô Dạ Camel Cashmere</span>
                <span className="lb-product-price">3.850.000₫</span>
              </div>
              <div className="lb-product-row">
                <span className="lb-product-name">Áo Len Cổ Lọ Cream Knitwear</span>
                <span className="lb-product-price">950.000₫</span>
              </div>
              <div className="lb-product-row">
                <span className="lb-product-name">Quần Âu Ống Suông Wool Tencel</span>
                <span className="lb-product-price">1.250.000₫</span>
              </div>
            </div>

            <div className="lb-cta-container">
              <button 
                type="button" 
                className="btn-buy-combo"
                onClick={() => showToast('Đã thêm trọn bộ Look 01 (tiết kiệm 10%) vào giỏ hàng!')}
              >
                <ShoppingBag size={16} />
                <span>Mua Trọn Bộ Phối Đồ (Tiết Kiệm 10%) • 5.445.000₫</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 2: LOOK 02 (Emerald Pleated Gown - Inverted Split) */}
        <section className="lb-split-look-card inverted">
          <div className="lb-look-details-col">
            <div>
              <div className="lb-look-tag-row">
                <span className="lb-look-category">DẠ TIỆC & HAUTE COUTURE • LOOK 02</span>
                <span className="lb-badge-pill" style={{ background: '#DCFCE7', color: '#15803D', borderColor: '#BBF7D0' }}>
                  PHIÊN BẢN GIỚI HẠN
                </span>
              </div>

              <h2 className="lb-look-title">
                Đầm Xếp Ly Emerald Lộng Lẫy Tơ Tằm Cao Cấp
              </h2>

              <p className="lb-look-desc">
                Chất tơ tằm dệt ánh ngọc lục bảo rực rỡ, đường xếp ly accordion tỉ mỉ tạo độ xòe bồng bềnh tựa dải sóng khi chuyển động.
              </p>

              <div className="lb-quote-card">
                "Thiết kế được lựa chọn trình diễn tại Paris Fashion Week 2025, mang hơi thở quý phái vượt thời gian."
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '26px', fontWeight: 700, color: '#111', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  2.950.000₫
                </span>
                <span style={{ fontSize: '12px', color: '#B45309', fontWeight: 600 }}>
                  • Chỉ còn 5 chiếc size S, M
                </span>
              </div>
            </div>

            <div className="lb-cta-container">
              <button 
                type="button" 
                className="btn-buy-combo"
                onClick={() => showToast('Đã thêm Đầm Xếp Ly Emerald vào giỏ hàng!')}
              >
                <ShoppingBag size={16} />
                <span>ĐẶT MUA NGAY</span>
              </button>
            </div>
          </div>

          <div className="lb-photo-relative">
            <img
              src="https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000"
              alt="Look 02 - Emerald Gown"
              className="lb-editorial-img"
            />
            <span 
              className="lb-badge-pill" 
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.65)', color: '#FFFFFF', borderColor: 'transparent' }}
            >
              HAUTE COUTURE EDITION
            </span>
          </div>
        </section>

        {/* SECTION 3: TWO COLUMNS (Look 03 Ivory Tweed & Look 04 Charcoal Blazer) */}
        <section className="lb-two-cols-grid">
          {/* Card Left: Ivory Tweed */}
          <div className="lb-vertical-look-card">
            <div className="lb-vert-img-box">
              <img
                src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800"
                alt="Look 03 - Tweed Ivory"
                className="lb-editorial-img"
              />
              <span className="lb-badge-pill" style={{ position: 'absolute', top: '16px', left: '16px', background: '#FFFFFF' }}>
                LOOK 03
              </span>
            </div>
            <div className="lb-vert-body">
              <div>
                <span className="lb-look-category">PARISIAN CHIC</span>
                <h3 className="lb-look-title" style={{ fontSize: '20px', margin: '6px 0 10px 0' }}>
                  Set Áo Tweed Ivory & Quần Âu Cắt May Cổ Điển
                </h3>
                <p className="lb-look-desc" style={{ fontSize: '13px', marginBottom: '16px' }}>
                  Sự tương phản kinh điển giữa trắng kem ngà và đen tuyền, nút kim loại mạ vàng chạm khắc thủ công.
                </p>
                <div className="lb-product-row" style={{ fontSize: '12.5px' }}>
                  <span>Áo Khoác Tweed Ivory Cropped</span>
                  <strong>2.150.000₫</strong>
                </div>
                <div className="lb-product-row" style={{ fontSize: '12.5px' }}>
                  <span>Quần Tây Slim Fit Black</span>
                  <strong>890.000₫</strong>
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>3.040.000₫</span>
                <button 
                  type="button" 
                  className="btn-buy-combo" 
                  style={{ width: 'auto', padding: '10px 18px' }}
                  onClick={() => showToast('Đã thêm Set Áo Tweed Ivory vào giỏ hàng!')}
                >
                  Mua Ngay
                </button>
              </div>
            </div>
          </div>

          {/* Card Right: Charcoal Blazer */}
          <div className="lb-vertical-look-card">
            <div className="lb-vert-img-box">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800"
                alt="Look 04 - Charcoal Blazer"
                className="lb-editorial-img"
              />
              <span className="lb-badge-pill" style={{ position: 'absolute', top: '16px', left: '16px', background: '#FFFFFF' }}>
                LOOK 04
              </span>
            </div>
            <div className="lb-vert-body">
              <div>
                <span className="lb-look-category">MODERN TAILORING</span>
                <h3 className="lb-look-title" style={{ fontSize: '20px', margin: '6px 0 10px 0' }}>
                  Oversized Charcoal Blazer & Minimalist Shirt
                </h3>
                <p className="lb-look-desc" style={{ fontSize: '13px', marginBottom: '16px' }}>
                  Phong thái nữ quyền độc lập và tự do, phom dáng rộng thoải mái cùng đường may vai sắc nét chuẩn quý cô Paris.
                </p>
                <div className="lb-product-row" style={{ fontSize: '12.5px' }}>
                  <span>Áo Blazer Kẻ Sọc Pinstripe</span>
                  <strong>1.950.000₫</strong>
                </div>
                <div className="lb-product-row" style={{ fontSize: '12.5px' }}>
                  <span>Sơ Mi Poplin Cotton Trắng</span>
                  <strong>750.000₫</strong>
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>2.700.000₫</span>
                <button 
                  type="button" 
                  className="btn-buy-combo" 
                  style={{ width: 'auto', padding: '10px 18px' }}
                  onClick={() => showToast('Đã thêm Set Charcoal Blazer vào giỏ hàng!')}
                >
                  Mua Ngay
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: CRAFTSMANSHIP & BACKSTAGE ("Hậu Trường & Kỷ Họa Ý Tưởng") */}
        <section className="lb-craftsmanship-card">
          <div className="lb-craft-img-box">
            <img
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1000"
              alt="Atelier Workshop Paris"
              className="lb-editorial-img"
            />
            <span 
              className="lb-badge-pill" 
              style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.7)', color: '#FFFFFF', borderColor: 'transparent' }}
            >
              XƯỞNG MAY THỦ CÔNG PARIS • ATELIER NO. 12
            </span>
          </div>

          <div className="lb-craft-content">
            <span className="lb-look-category">NGHỆ THUẬT MAY ĐO BESPOKE</span>
            <h2 className="lb-look-title" style={{ fontSize: '28px', margin: '8px 0 14px 0' }}>
              Hậu Trường & Kỷ Họa Ý Tưởng
            </h2>
            <p className="lb-look-desc" style={{ margin: 0 }}>
              Mỗi tác phẩm trong tuyển tập Fall/Winter 2025 là kết tinh của hơn 180 giờ chế tác thủ công, tuyển chọn từ những thước vải tự nhiên thượng hạng nhất từ Ý và Pháp.
            </p>

            <div className="lb-stats-3-col">
              <div>
                <div className="lb-stat-big-num">180h</div>
                <div className="lb-stat-desc">Thời gian may đo & thêu tay chuẩn Haute Couture</div>
              </div>
              <div>
                <div className="lb-stat-big-num">100%</div>
                <div className="lb-stat-desc">Sợi tự nhiên len cừu Merino & Cashmere Ý</div>
              </div>
              <div>
                <div className="lb-stat-big-num">12+</div>
                <div className="lb-stat-desc">Nghệ nhân may đo kinh nghiệm 20 năm tại xưởng</div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-share-editorial"
              style={{ fontSize: '13px', marginTop: '4px', textDecoration: 'underline' }}
              onClick={() => showToast('Đang tải phim tài liệu hậu trường Youth Fashion 2025...')}
            >
              Xem Phim Ngắn Hậu Trường Chiến Dịch →
            </button>
          </div>
        </section>

        {/* SECTION 5: STORE VALUE PROPS / GUARANTEES */}
        <section className="lb-value-props-grid">
          <div className="lb-value-prop-item">
            <div className="lb-value-prop-icon">
              <Truck size={18} />
            </div>
            <div>
              <div className="lb-value-prop-title">Giao Hàng Nhanh</div>
              <div className="lb-value-prop-sub">Miễn phí toàn quốc cho đơn hàng từ 1.000.000₫</div>
            </div>
          </div>

          <div className="lb-value-prop-item">
            <div className="lb-value-prop-icon">
              <RotateCcw size={18} />
            </div>
            <div>
              <div className="lb-value-prop-title">Đổi Hàng 30 Ngày</div>
              <div className="lb-value-prop-sub">Thử đồ tại nhà, hỗ trợ đổi size tận nơi dễ dàng</div>
            </div>
          </div>

          <div className="lb-value-prop-item">
            <div className="lb-value-prop-icon">
              <Scissors size={18} />
            </div>
            <div>
              <div className="lb-value-prop-title">May Đo Riêng (Bespoke)</div>
              <div className="lb-value-prop-sub">Chỉnh sửa phom dáng chuẩn theo số đo của quý khách</div>
            </div>
          </div>

          <div className="lb-value-prop-item">
            <div className="lb-value-prop-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="lb-value-prop-title">Bảo Hành Trọn Đời</div>
              <div className="lb-value-prop-sub">Bảo dưỡng cúc, đường may và chăm sóc vải miễn phí</div>
            </div>
          </div>
        </section>

      </main>
    </>
  )}
</div>
  );
}

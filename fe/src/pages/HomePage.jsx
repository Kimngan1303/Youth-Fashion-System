import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Hammer, Users, Menu, Heart, Star, Edit3, RotateCcw, UserCheck } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const HomePage = ({ onOpenAISearch }) => {
  const newProducts = [
    {
      id: 1,
      name: 'Áo Blazer Oversized',
      price: '1.850.000đ',
      tag: 'MỚI',
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 2,
      name: 'Áo Sơ Mi Linen',
      price: '950.000đ',
      tag: 'MỚI',
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 3,
      name: 'Đầm Lụa Xếp Ly',
      price: '2.450.000đ',
      tag: 'MỚI',
      image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 4,
      name: 'Áo Măng Tô Dạ Tuyết',
      price: '3.200.000đ',
      tag: 'MỚI',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 5,
      name: 'Áo Polo Dệt Kim',
      price: '850.000đ',
      tag: 'MỚI',
      image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=600'
    }
  ];

  return (
    <div className="home-page">
      {/* 1. HERO SECTION (Contained with equal left/right margins) */}
      <section className="container hero-section-wrapper">
        <div className="hero-split-section">
          <div className="hero-left">
            <div className="hero-left-content">
              <span className="hero-subtext">— ĐỊNH HÌNH PHONG CÁCH TỰ TIN</span>
              <h1 className="hero-main-title font-serif">
                Nơi Thời Trang<br />Hội Tụ
              </h1>
              <p className="hero-desc">
                Youth Fashion kiến tạo những thiết kế vượt thời gian, tôn vinh nét trẻ trung và sự tự tin của bạn.
              </p>

              <div className="hero-action-btns">
                <Link to="/products" className="btn-black">
                  KHÁM PHÁ DANH MỤC &rarr;
                </Link>
                <button className="btn-outline-search" onClick={onOpenAISearch}>
                  <Search size={15} /> TÌM KIẾM
                </button>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <img 
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200" 
              alt="Youth Fashion Hero Model" 
              className="hero-img"
            />
          </div>
        </div>
      </section>

      {/* 2. SẢN PHẨM MỚI SECTION (5 Columns) */}
      <section className="section-new-products container">
        <div className="section-title-row">
          <h2 className="section-heading font-serif">SẢN PHẨM MỚI</h2>
          <Link to="/products" className="view-all-btn">
            XEM TẤT CẢ &rarr;
          </Link>
        </div>

        <div className="products-grid-5">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. LOOKBOOK CHIẾN DỊCH THU ĐÔNG 2025 SECTION */}
      <section className="section-lookbook-split container">
        <div className="lookbook-left-card">
          <span className="lookbook-sub">BỘ SƯU TẬP MÙA THU ĐÔNG 2025</span>
          <h2 className="lookbook-title font-serif">
            L'Automne Éternel: Khúc Xạ Của Thu Vĩnh Cửu
          </h2>
          <p className="lookbook-desc">
            Nơi phong cách thanh lịch hòa cùng nghệ thuật may đo thủ công Pháp. Khám phá các thiết kế măng tô dạ Cashmere, đầm xếp ly tơ tằm quý phái cùng phối đồ Parisian Chic đương đại.
          </p>
          <Link to="/lookbook" className="btn-black lookbook-btn">
            KHÁM PHÁ TUYỂN TẬP LOOKBOOK &rarr;
          </Link>
        </div>

        <div className="lookbook-photos-grid">
          <div className="lb-photo-col">
            <img 
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600" 
              alt="Lookbook Coat" 
              className="lb-img"
            />
          </div>
          <div className="lb-photo-col">
            <img 
              src="https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=600" 
              alt="Lookbook Gown" 
              className="lb-img"
            />
          </div>
          <div className="lb-photo-col">
            <img 
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600" 
              alt="Lookbook Tailoring" 
              className="lb-img"
            />
          </div>
        </div>
      </section>



      <style>{`
        .hero-section-wrapper {
          padding-top: 10px;
          padding-bottom: 20px;
        }

        /* 1. Hero Split Section */
        .hero-split-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 520px;
          background-color: #f7f6f2;
          overflow: hidden;
        }

        .hero-left {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 60px 48px;
          background-color: #f7f6f2;
        }

        .hero-left-content {
          max-width: 520px;
        }

        .hero-subtext {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #6b7280;
          display: block;
          margin-bottom: 16px;
        }

        .hero-main-title {
          font-size: 54px;
          font-weight: 500;
          line-height: 1.15;
          color: #111827;
          margin-bottom: 20px;
          font-family: var(--font-serif);
        }

        .hero-desc {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .hero-action-btns {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-outline-search {
          background-color: transparent;
          color: #111827;
          border: 1px solid #d1d5db;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          padding: 13px 26px;
          border-radius: 0px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .btn-outline-search:hover {
          border-color: #111827;
          background-color: #ffffff;
        }

        .hero-right {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 520px;
          overflow: hidden;
        }

        .hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* 2. Section New Products (5 Columns) */
        .section-new-products {
          padding: 32px 48px;
        }

        .section-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-heading {
          font-size: 26px;
          font-weight: 500;
          color: #111827;
          letter-spacing: 1px;
          font-family: var(--font-serif);
          margin: 0;
        }

        .view-all-btn {
          font-size: 11px;
          font-weight: 700;
          color: #111827;
          letter-spacing: 1.5px;
          text-decoration: none;
          transition: color 0.2s;
        }

        .view-all-btn:hover {
          color: #4b5563;
        }

        .products-grid-5 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }

        /* 3. Section About */
        .section-about-container {
          padding-bottom: 70px;
        }

        .about-box {
          background-color: #f7f6f2;
          display: grid;
          grid-template-columns: 1.2fr 1.3fr 1fr;
          align-items: center;
          gap: 40px;
          padding: 36px;
        }

        .about-img-col {
          width: 100%;
          height: 380px;
          overflow: hidden;
        }

        .about-workshop-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .about-text-col {
          display: flex;
          flex-direction: column;
        }

        .about-sublabel {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .about-heading {
          font-size: 32px;
          font-weight: 500;
          line-height: 1.25;
          color: #111827;
          margin-bottom: 16px;
          font-family: var(--font-serif);
        }

        .about-paragraph {
          font-size: 13.5px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .about-btn {
          align-self: flex-start;
        }

        .about-stats-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
          border-left: 1px solid #e5e7eb;
          padding-left: 32px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .stat-icon-wrapper {
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-num {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          line-height: 1.1;
          font-family: var(--font-serif);
        }

        .stat-lbl {
          font-size: 12px;
          color: #6b7280;
        }

        /* 4. Lookbook Section (Flush zero gap photos) */
        .section-lookbook-split {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 0;
          padding-bottom: 70px;
        }

        .lookbook-left-card {
          background-color: #f7f6f2;
          padding: 60px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .lookbook-sub {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #6b7280;
          margin-bottom: 14px;
        }

        .lookbook-title {
          font-size: 32px;
          font-weight: 500;
          line-height: 1.25;
          color: #111827;
          margin-bottom: 16px;
          font-family: var(--font-serif);
        }

        .lookbook-desc {
          font-size: 13.5px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .lookbook-btn {
          align-self: flex-start;
        }

        .lookbook-photos-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
        }

        .lb-photo-col {
          height: 420px;
          overflow: hidden;
        }

        .lb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .grayscale {
          filter: grayscale(100%);
        }



        /* Responsive Breakpoints */
        @media (max-width: 1100px) {
          .products-grid-5 {
            grid-template-columns: repeat(3, 1fr);
          }
          .about-box {
            grid-template-columns: 1fr;
          }
          .about-stats-col {
            border-left: none;
            padding-left: 0;
            flex-direction: row;
            flex-wrap: wrap;
          }
          .section-lookbook-split {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .hero-split-section {
            grid-template-columns: 1fr;
          }
          .hero-left {
            padding: 40px 24px;
          }
          .products-grid-5, .services-bar-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .lookbook-photos-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;

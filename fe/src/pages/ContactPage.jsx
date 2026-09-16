import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Zap, RefreshCw, ShieldCheck } from 'lucide-react';

const ContactPage = () => {
  return (
    <div className="contact-page-bg">
      {/* 1. Breadcrumbs Bar */}
      <div className="contact-breadcrumb-bar">
        <div className="container contact-breadcrumb-content">
          <Link to="/" className="bc-link">TRANG CHỦ</Link>
          <span className="bc-sep">&gt;</span>
          <span className="bc-current">LIÊN HỆ</span>
        </div>
      </div>

      <div className="container contact-main-container">
        {/* 2. Hero Title Section */}
        <section className="contact-hero-section">
          <h1 className="hero-heading font-serif">
            Liên Hệ & Hỗ Trợ Mua Sắm Trực Tuyến
          </h1>
          <div className="heading-accent-line" />

          <p className="hero-description">
            Đội ngũ Chăm sóc Khách hàng Youth Fashion luôn sẵn sàng hỗ trợ tư vấn chọn size, thông tin sản phẩm, đơn hàng trực tuyến, đổi trả và giao hàng nhanh trên toàn quốc.
          </p>

          {/* Contact Highlights Bar */}
          <div className="contact-highlights-bar">
            <div className="highlight-item">
              <span className="green-dot">•</span>
              <span className="hl-label">HOTLINE MUA HÀNG:</span>
              <a href="tel:19008866" className="hl-value">1900 8866</a>
            </div>

            <span className="hl-divider">|</span>

            <div className="highlight-item">
              <span className="hl-label">HỖ TRỢ ĐƠN HÀNG:</span>
              <a href="tel:+842838228999" className="hl-value">+84 28 3822 8999</a>
            </div>

            <span className="hl-divider">|</span>

            <div className="highlight-item">
              <span className="hl-label">EMAIL HỖ TRỢ:</span>
              <a href="mailto:cskh@youthfashion.vn" className="hl-value">cskh@youthfashion.vn</a>
            </div>
          </div>
        </section>

        {/* 3. Customer Service Grid Section */}
        <section className="services-section">
          <div className="section-header-center">
            <span className="section-tag-subtitle">DỊCH VỤ KHÁCH HÀNG TRỰC TUYẾN</span>
            <h2 className="section-main-heading font-serif">
              Mua Sắm An Tâm Cùng Youth Fashion
            </h2>
            <div className="heading-accent-line" />
            <p className="section-sub-desc">
              Trải nghiệm mua sắm trực tuyến tiện lợi, nhanh chóng và tận tâm từ đội ngũ chuyên viên.
            </p>
          </div>

          {/* 4 Feature Cards Grid */}
          <div className="services-cards-grid">
            {/* Card 1 */}
            <div className="service-card">
              <div className="card-top-content">
                <div className="card-icon-box">
                  <MessageSquare size={20} className="card-icon" />
                </div>
                <h3 className="card-title font-serif">Tư Vấn Chọn Size Chuẩn Xác</h3>
                <p className="card-desc">
                  Tư vấn chi tiết số đo, form dáng chuẩn từng trang phục qua Zalo & Chat trực tuyến để bạn chọn được size vừa vặn nhất.
                </p>
              </div>
              <div className="card-bottom">
                <div className="card-separator" />
                <span className="card-tag-link">HỖ TRỢ CHAT 24/7</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="service-card">
              <div className="card-top-content">
                <div className="card-icon-box">
                  <Zap size={20} className="card-icon" />
                </div>
                <h3 className="card-title font-serif">Giao Hàng Hỏa Tốc Toàn Quốc</h3>
                <p className="card-desc">
                  Đóng gói hộp quà cao cấp, giao hàng nhanh 2-4h tại nội thành và 1-2 ngày toàn quốc, cho phép đồng kiểm khi nhận hàng.
                </p>
              </div>
              <div className="card-bottom">
                <div className="card-separator" />
                <span className="card-tag-link">MIỄN PHÍ VẬN CHUYỂN</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="service-card">
              <div className="card-top-content">
                <div className="card-icon-box">
                  <RefreshCw size={20} className="card-icon" />
                </div>
                <h3 className="card-title font-serif">Đổi Hàng Dễ Dàng 30 Ngày</h3>
                <p className="card-desc">
                  Hỗ trợ đổi size, đổi mẫu tận nơi hoàn toàn miễn phí trong vòng 30 ngày nếu không vừa vặn hoặc chưa ưng ý.
                </p>
              </div>
              <div className="card-bottom">
                <div className="card-separator" />
                <span className="card-tag-link">ĐỔI TRẢ MIỄN PHÍ</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="service-card">
              <div className="card-top-content">
                <div className="card-icon-box">
                  <ShieldCheck size={20} className="card-icon" />
                </div>
                <h3 className="card-title font-serif">Chăm Sóc & Bảo Quản Trang Phục</h3>
                <p className="card-desc">
                  Cung cấp hướng dẫn giặt ủi, bảo quản chất liệu lụa, dạ, len cashmere cao cấp và hỗ trợ xử lý phụ kiện trọn đời.
                </p>
              </div>
              <div className="card-bottom">
                <div className="card-separator" />
                <span className="card-tag-link">DỊCH VỤ TẬN TÂM</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .contact-page-bg {
          background-color: #ffffff;
          padding-bottom: 40px;
        }

        /* 1. Breadcrumb Bar */
        .contact-breadcrumb-bar {
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 14px 0;
        }

        .contact-breadcrumb-content {
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

        /* 2. Main Hero Section */
        .contact-hero-section {
          text-align: center;
          padding: 56px 20px 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-heading {
          font-size: 34px;
          font-weight: 500;
          color: #111827;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .heading-accent-line {
          width: 50px;
          height: 1.5px;
          background-color: #111827;
          margin: 0 auto 20px;
        }

        .hero-description {
          font-size: 14px;
          color: #6b7280;
          max-width: 740px;
          line-height: 1.65;
          margin-bottom: 32px;
        }

        /* Contact Highlights Bar */
        .contact-highlights-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          flex-wrap: wrap;
          font-size: 12px;
          color: #374151;
          letter-spacing: 0.3px;
        }

        .highlight-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .green-dot {
          color: #10b981;
          font-size: 14px;
        }

        .hl-label {
          color: #6b7280;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .hl-value {
          color: #111827;
          font-weight: 700;
          text-decoration: none;
        }

        .hl-value:hover {
          text-decoration: underline;
        }

        .hl-divider {
          color: #d1d5db;
          font-size: 14px;
        }

        /* 3. Services Section */
        .services-section {
          padding: 30px 0 50px;
        }

        .section-header-center {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 44px;
        }

        .section-tag-subtitle {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .section-main-heading {
          font-size: 28px;
          font-weight: 500;
          color: #111827;
          margin-bottom: 12px;
        }

        .section-sub-desc {
          font-size: 13.5px;
          color: #6b7280;
          max-width: 600px;
        }

        /* 4 Cards Grid Layout */
        .services-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .service-card {
          background-color: #faf9f5;
          border: 1px solid #e8e7e1;
          border-radius: 10px;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .service-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.05);
          background-color: #ffffff;
          border-color: #d1d5db;
        }

        .card-top-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .card-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111827;
          margin-bottom: 20px;
        }

        .card-title {
          font-size: 17px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 12px;
          line-height: 1.35;
        }

        .card-desc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.55;
        }

        .card-bottom {
          margin-top: 24px;
        }

        .card-separator {
          height: 1px;
          background-color: #e8e7e1;
          margin-bottom: 16px;
        }

        .card-tag-link {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #111827;
          text-transform: uppercase;
        }

        @media (max-width: 1024px) {
          .services-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .services-cards-grid {
            grid-template-columns: 1fr;
          }

          .contact-highlights-bar {
            flex-direction: column;
            gap: 12px;
          }

          .hl-divider {
            display: none;
          }

          .hero-heading {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
};

export default ContactPage;

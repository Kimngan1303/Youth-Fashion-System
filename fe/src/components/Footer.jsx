import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      {/* Top Value Proposition Features Bar */}
      <div className="footer-features-bar">
        <div className="container footer-features-grid">
          <div className="feature-item">
            <div className="feature-icon-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div className="feature-text-content">
              <h5 className="feature-title">CHẤT LƯỢNG THƯỢNG HẠNG</h5>
              <p className="feature-desc">Chất liệu cao cấp & tay nghề thủ công tỉ mỉ từng chi tiết.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
            <div className="feature-text-content">
              <h5 className="feature-title">THIẾT KẾ ĐỘC BẢN</h5>
              <p className="feature-desc">Độc quyền sáng tạo bởi chuyên gia thiết kế hàng đầu.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </div>
            <div className="feature-text-content">
              <h5 className="feature-title">THỜI TRANG BỀN VỮNG</h5>
              <p className="feature-desc">Cam kết quy trình bền vững và có trách nhiệm vì tương lai.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="feature-text-content">
              <h5 className="feature-title">ĐỒNG HÀNH CÙNG KHÁCH HÀNG</h5>
              <p className="feature-desc">Dịch vụ cá nhân hóa & chăm sóc khách hàng tận tâm 24/7.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-main container">
        {/* Brand info */}
        <div className="footer-col brand-col">
          <Link to="/" className="footer-logo">
            <img src="/logo-white.png" alt="Youth Fashion Logo" className="footer-logo-img" />
            <span className="footer-brand-name font-serif">YOUTH FASHION</span>
          </Link>
          <p className="brand-desc">
            Youth Fashion kiến tạo những thiết kế vượt thời gian, tôn vinh nét trẻ trung, bản lĩnh và sự tự tin thanh lịch của bạn.
          </p>
          <div className="social-links">
            <a href="#facebook" aria-label="Facebook" className="social-btn">
              <Facebook size={16} />
            </a>
            <a href="#instagram" aria-label="Instagram" className="social-btn">
              <Instagram size={16} />
            </a>
            <a href="#tiktok" aria-label="TikTok" className="social-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.82V7.58a6.34 6.34 0 0 0-5.46 6.33A6.34 6.34 0 0 0 10.36 20a6.34 6.34 0 0 0 6.34-6.34V8.71a8.3 8.3 0 0 0 4.89 1.58V6.84a4.84 4.84 0 0 1-2-.15z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Column 1: Contact / Info Links */}
        <div className="footer-col">
          <h4 className="footer-title">LIÊN LẠC</h4>
          <ul className="footer-links">
            <li><Link to="/about">Về chúng tôi</Link></li>
            <li><a href="#faq">Câu hỏi thường gặp</a></li>
            <li><Link to="/contact">Liên hệ</Link></li>
          </ul>
        </div>

        {/* Column 2: Collections */}
        <div className="footer-col">
          <h4 className="footer-title">BỘ SƯU TẬP</h4>
          <ul className="footer-links">
            <li><Link to="/products?tag=new">Sản phẩm mới</Link></li>
            <li><Link to="/category/women">Thời trang nữ</Link></li>
            <li><Link to="/category/men">Thời trang nam</Link></li>
          </ul>
        </div>

        {/* Column 3: Advice & Customer Care */}
        <div className="footer-col">
          <h4 className="footer-title">TƯ VẤN</h4>
          <ul className="footer-links">
            <li><a href="#size-guide">Hướng dẫn chọn size</a></li>
            <li><a href="#return-policy">Chính sách đổi trả</a></li>
            <li><a href="#customer-care">Chăm sóc khách hàng</a></li>
          </ul>
        </div>

        {/* Column 4: Info / Newsletter */}
        <div className="footer-col info-col">
          <h4 className="footer-title">THÔNG TIN</h4>
          <p className="info-desc">
            Nhận thông tin sớm nhất về các bộ sưu tập mới, sự kiện và ưu đãi đặc quyền.
          </p>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>© 2026 Youth Fashion. Bảo lưu mọi quyền.</p>
        <div className="legal-links">
          <a href="#privacy">Chính sách bảo mật</a>
          <span className="sep">|</span>
          <a href="#terms">Điều khoản dịch vụ</a>
        </div>
      </div>

      <style>{`
        .footer {
          background-color: #0b0d12;
          color: #9ca3af;
          padding-bottom: 30px;
          margin-top: 0;
        }

        .footer-features-bar {
          background-color: #ffffff;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          padding: 38px 0;
          color: #111827;
          margin-bottom: 0;
        }

        .footer-features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .feature-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111827;
          flex-shrink: 0;
          background-color: #fafafa;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .feature-text-content {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .feature-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #111827;
          margin: 0;
        }

        .feature-desc {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.45;
          margin: 0;
        }

        .footer-main {
          display: grid;
          grid-template-columns: 2.2fr 1fr 1fr 1fr 1.5fr;
          gap: 36px;
          padding-top: 54px;
          padding-bottom: 40px;
          border-bottom: 1px solid #1f2937;
        }

        .brand-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .footer-logo-img {
          height: 36px;
          width: auto;
          object-fit: contain;
        }

        .footer-brand-name {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #ffffff;
          font-family: var(--font-serif);
        }

        .brand-desc {
          font-size: 13px;
          line-height: 1.6;
          color: #9ca3af;
          max-width: 320px;
        }

        .social-links {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }

        .social-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background-color: #ffffff;
          color: #0b0d12;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, background-color 0.2s;
        }

        .social-btn:hover {
          transform: translateY(-2px);
          background-color: #e5e7eb;
        }

        .footer-title {
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.5px;
          margin-bottom: 18px;
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0;
          margin: 0;
        }

        .footer-links a {
          font-size: 13px;
          color: #9ca3af;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: #ffffff;
        }

        .info-col {
          display: flex;
          flex-direction: column;
        }

        .info-desc {
          font-size: 13px;
          line-height: 1.6;
          color: #9ca3af;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 24px;
          font-size: 12px;
          color: #6b7280;
        }

        .legal-links {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .legal-links a {
          color: #6b7280;
          transition: color 0.2s;
        }

        .legal-links a:hover {
          color: #9ca3af;
        }

        .sep {
          color: #374151;
        }

        @media (max-width: 992px) {
          .footer-main {
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;

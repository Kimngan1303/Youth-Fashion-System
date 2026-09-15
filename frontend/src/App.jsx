/* =========================================================================================
 * DỰ ÁN: YOUTH FASHION - WEBSITE THỜI TRANG CHO GIỚI TRẺ TÍCH HỢP AI SEARCH
 * FILE: App.jsx (Mã nguồn trang chủ Homepage hoàn chỉnh theo chuẩn thiết kế)
 * CÔNG NGHỆ: ReactJS, Lucide Icons, CSS Vanilla hiện đại
 * ========================================================================================= */

// =========================================================================================
// PROMPT 1: KHAI BÁO CÁC THƯ VIỆN & COMPONENT BÊN NGOÀI
// - React & useState: Quản lý trạng thái giao diện (mở/đóng modal AI, số lượng giỏ hàng).
// - Lucide-react: Bộ icon vector giao diện người dùng (tìm kiếm, chuông, tin nhắn, túi hàng, tim, user...).
// - AISearchModal: Hộp thoại tìm kiếm thông minh bằng hình ảnh và ngữ nghĩa AI.
// - Logo: Biểu tượng huy hiệu YF 3D và chữ YOUTH FASHION chuẩn nhận diện thương hiệu.
// =========================================================================================
import React, { useState } from 'react';
import { 
  Search, Bell, MessageSquare, ShoppingBag, Heart, User, 
  ArrowRight, Star, RotateCcw,
  Sparkles, Compass, Users, Layers, HeartHandshake
} from 'lucide-react';
import AISearchModal from './components/AISearchModal';
import Logo from './components/Logo';

export default function App() {
  // =======================================================================================
  // PROMPT 2: KHỞI TẠO STATE (TRẠNG THÁI ỨNG DỤNG)
  // - isAISearchOpen: Điều khiển việc bật / tắt popup tìm kiếm bằng hình ảnh AI.
  // - cartCount: Quản lý số lượng sản phẩm hiển thị trên icon giỏ hàng header.
  // =======================================================================================
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(2);

  // =======================================================================================
  // PROMPT 3: DỮ LIỆU SẢN PHẨM MỚI (NEW ARRIVALS - 5 MẪU THEO THIẾT KẾ)
  // - Danh sách 5 sản phẩm thời trang cao cấp bao gồm: ID, Tên, Giá bán, Ảnh minh họa và Nhãn "MỚI".
  // =======================================================================================
  const NEW_ARRIVALS = [
    {
      id: 1,
      name: 'Áo Blazer Oversized',
      price: '1.050.000đ',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=700&q=80',
      badge: 'MỚI'
    },
    {
      id: 2,
      name: 'Áo Sơ Mi Linen',
      price: '650.000đ',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80',
      badge: 'MỚI'
    },
    {
      id: 3,
      name: 'Đầm Lụa Xếp Ly',
      price: '2.450.000đ',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=80',
      badge: 'MỚI'
    },
    {
      id: 4,
      name: 'Áo Măng Tô Dạ Tơ Tằm',
      price: '3.200.000đ',
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=700&q=80',
      badge: 'MỚI'
    },
    {
      id: 5,
      name: 'Áo Polo Dệt Kim',
      price: '850.000đ',
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=700&q=80',
      badge: 'MỚI'
    }
  ];

  // =======================================================================================
  // PROMPT 4: HÀM XỬ LÝ SỰ KIỆN KHI NGƯỜI DÙNG NHẤP VÀO SẢN PHẨM
  // - Tăng số lượng giỏ hàng lên 1 và hiển thị thông báo thêm vào giỏ hàng thành công.
  // =======================================================================================
  const handleProductClick = (item) => {
    setCartCount(prev => prev + 1);
    alert(`Đã thêm "${item.name}" (${item.price}) vào giỏ hàng!`);
  };

  return (
    <div className="page-wrapper">
      {/* ===================================================================================
       * PROMPT 5: THANH THÔNG BÁO CHẠY CHỮ VÔ TẬN TRÊN CÙNG (TOP ANNOUNCEMENT BAR)
       * - Nền đen, chữ xám nhạt, lướt êm ái vô tận từ phải sang trái bằng kỹ thuật Infinite Marquee.
       * - Nội dung cam kết: Miễn phí vận chuyển, Đổi hàng 7 ngày, Thiết kế độc quyền.
       * - Khi rê chuột (hover) vào thì dòng chữ tự động tạm dừng lại để khách hàng dễ đọc.
       * =================================================================================== */}
      <div className="top-bar">
        <div className="marquee-track">
          {/* Nhóm thông điệp 1 */}
          <div className="marquee-group">
            <div className="top-bar-item">
              <span className="top-bar-icon">★</span>
              <span>Miễn phí vận chuyển toàn quốc</span>
            </div>
            <div className="top-bar-item">
              <span className="top-bar-icon">↻</span>
              <span>Đổi hàng trong vòng 7 ngày</span>
            </div>
            <div className="top-bar-item">
              <span className="top-bar-icon">✧</span>
              <span>Thiết kế độc quyền</span>
            </div>
            <div className="top-bar-item">
              <span className="top-bar-icon">★</span>
              <span>Bộ sưu tập mới 2026 // Minimalist Luxury</span>
            </div>
          </div>

          {/* Nhóm thông điệp 2 (Nhân đôi để tạo vòng lặp vô tận liền mạch không giật) */}
          <div className="marquee-group" aria-hidden="true">
            <div className="top-bar-item">
              <span className="top-bar-icon">★</span>
              <span>Miễn phí vận chuyển toàn quốc</span>
            </div>
            <div className="top-bar-item">
              <span className="top-bar-icon">↻</span>
              <span>Đổi hàng trong vòng 7 ngày</span>
            </div>
            <div className="top-bar-item">
              <span className="top-bar-icon">✧</span>
              <span>Thiết kế độc quyền</span>
            </div>
            <div className="top-bar-item">
              <span className="top-bar-icon">★</span>
              <span>Bộ sưu tập mới 2026 // Minimalist Luxury</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================================
       * PROMPT 6: THANH ĐIỀU HƯỚNG CHÍNH (SITE HEADER)
       * - Dàn rộng toàn màn hình: Logo nằm sát bên trái, 6 Icon nằm sát bên phải.
       * - Menu chính ở vị trí trung tâm, cách xa hai bên, bao gồm: TRANG CHỦ, VỀ CHÚNG TÔI, DANH MỤC, LOOKBOOK, LIÊN HỆ.
       * - Cụm 6 icon chức năng có huy hiệu badge số thông báo (Tìm kiếm, Chuông 1, Tin nhắn, Giỏ hàng 2, Tim 2, User).
       * =================================================================================== */}
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            {/* 6.1. Logo & Tên thương hiệu YOUTH FASHION phía bên trái */}
            <a href="/" style={{ textDecoration: 'none' }}>
              <Logo />
            </a>

            {/* 6.2. Menu điều hướng nằm ở giữa với khoảng cách thoáng đãng */}
            <nav>
              <ul className="main-nav">
                <li><a href="#home" className="main-nav-link active">TRANG CHỦ</a></li>
                <li><a href="#about" className="main-nav-link">VỀ CHÚNG TÔI</a></li>
                <li><a href="#products" className="main-nav-link">DANH MỤC</a></li>
                <li><a href="#lookbook" className="main-nav-link">LOOKBOOK</a></li>
                <li><a href="#contact" className="main-nav-link">LIÊN HỆ</a></li>
              </ul>
            </nav>

            {/* 6.3. Cụm Icon hành động và thông báo phía bên phải */}
            <div className="header-actions">
              {/* Nút tìm kiếm (Kích hoạt modal AI Search) */}
              <button className="icon-btn" onClick={() => setIsAISearchOpen(true)} title="Tìm kiếm bằng AI">
                <Search size={19} strokeWidth={1.8} />
              </button>

              {/* Icon thông báo có badge số 1 */}
              <button className="icon-btn" title="Thông báo">
                <Bell size={19} strokeWidth={1.8} />
                <span className="icon-badge">1</span>
              </button>

              {/* Icon tin nhắn chat */}
              <button className="icon-btn" title="Tin nhắn">
                <MessageSquare size={19} strokeWidth={1.8} />
              </button>

              {/* Icon giỏ hàng có badge số */}
              <button className="icon-btn" title="Giỏ hàng">
                <ShoppingBag size={19} strokeWidth={1.8} />
                <span className="icon-badge">{cartCount}</span>
              </button>

              {/* Icon danh sách yêu thích có badge số 2 */}
              <button className="icon-btn" title="Yêu thích">
                <Heart size={19} strokeWidth={1.8} />
                <span className="icon-badge">2</span>
              </button>

              {/* Icon tài khoản người dùng */}
              <button className="icon-btn" title="Tài khoản">
                <User size={19} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================================================
       * PROMPT 7: KHỐI BANNER CHÍNH (HERO SECTION - NƠI THỜI TRANG HỘI TỤ)
       * - Chia làm 2 cột chuẩn thiết kế:
       *   + Cột trái: Slogan "— ĐỊNH HÌNH PHONG CÁCH TỰ TIN", tiêu đề chữ Serif lớn "Nơi Thời Trang Hội Tụ",
       *     đoạn mô tả và 2 nút bấm: "KHÁM PHÁ DANH MỤC" và "TÌM KIẾM (AI)".
       *   + Cột phải: Hình ảnh người mẫu thời trang thanh lịch sải bước trước cửa hàng Dior trên phố châu Âu.
       * =================================================================================== */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero-layout">
            {/* 7.1. Cột nội dung văn bản bên trái */}
            <div className="hero-text-col">
              <div className="hero-tag">
                <span>— ĐỊNH HÌNH PHONG CÁCH TỰ TIN</span>
              </div>

              <h1 className="hero-heading">
                Nơi Thời Trang<br />
                Hội Tụ
              </h1>

              <p className="hero-desc">
                Youth Fashion kiến tạo những thiết kế vượt thời gian, tôn vinh nét trẻ trung và sự tự tin của bạn.
              </p>

              <div className="hero-actions">
                <a href="#products" className="btn-black">
                  <span>KHÁM PHÁ DANH MỤC</span>
                  <ArrowRight size={14} />
                </a>

                <button className="btn-white-search" onClick={() => setIsAISearchOpen(true)}>
                  <Search size={14} />
                  <span>TÌM KIẾM</span>
                </button>
              </div>
            </div>

            {/* 7.2. Cột hình ảnh người mẫu thời trang bên phải */}
            <div className="hero-image-col">
              <img 
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85" 
                alt="Người mẫu diện trang phục thời trang thiết kế thanh lịch sang trọng"
                className="hero-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================================
       * PROMPT 8: KHỐI SẢN PHẨM MỚI (NEW ARRIVALS - 5 CỘT SẢN PHẨM)
       * - Tiêu đề font Serif "SẢN PHẨM MỚI" cùng nút liên kết "XEM TẤT CẢ →".
       * - Lưới 5 sản phẩm hiển thị đầy đủ hình ảnh, nhãn badge đen "MỚI", tên sản phẩm và đơn giá.
       * - Nhấp vào sản phẩm sẽ tự động cập nhật giỏ hàng.
       * =================================================================================== */}
      <section className="section-new-arrivals" id="products">
        <div className="container">
          <div className="section-head-bar">
            <h2 className="heading-serif">SẢN PHẨM MỚI</h2>
            <a href="#products" className="view-all-link">
              <span>XEM TẤT CẢ</span>
              <ArrowRight size={12} />
            </a>
          </div>

          <div className="products-5-grid">
            {NEW_ARRIVALS.map((product) => (
              <div 
                key={product.id} 
                className="product-item"
                onClick={() => handleProductClick(product)}
              >
                <div className="product-item-thumb">
                  <span className="badge-new">{product.badge}</span>
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="product-item-img"
                  />
                </div>
                <h3 className="product-item-title">{product.name}</h3>
                <span className="product-item-price">{product.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================================
       * PROMPT 9: KHỐI VỀ CHÚNG TÔI (ABOUT US - 3 PHÂN VÙNG NỘI DUNG)
       * - Phân vùng 1 (Trái): Hình ảnh xưởng may thiết kế thời trang thủ công Atelier.
       * - Phân vùng 2 (Giữa): Tiêu đề "Kiến Tạo Phong Cách. Khẳng Định Bản Sắc.", nội dung thương hiệu và nút "TÌM HIỂU VỀ CHÚNG TÔI".
       * - Phân vùng 3 (Phải): 4 chỉ số ấn tượng: 10+ Năm kinh nghiệm, 250+ Cửa hàng, 1000+ Thiết kế, 98% Khách hàng hài lòng.
       * =================================================================================== */}
      <section className="section-about" id="about">
        <div className="container">
          <div className="about-grid">
            {/* 9.1. Ảnh xưởng thiết kế thời trang */}
            <div className="about-img-wrap">
              <img 
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=80" 
                alt="Xưởng thiết kế thời trang Youth Fashion"
                className="about-img"
              />
            </div>

            {/* 9.2. Giới thiệu câu chuyện thương hiệu */}
            <div>
              <div className="about-tag">VỀ CHÚNG TÔI</div>
              <h2 className="about-title">
                Kiến Tạo Phong Cách.<br />
                Khẳng Định Bản Sắc.
              </h2>
              <p className="about-p">
                Youth Fashion là thương hiệu thời trang tiên phong mang đến những thiết kế thời thượng, giúp bạn tự tin thể hiện phong cách cá nhân trong từng khoảnh khắc.
              </p>
              <a href="#about" className="btn-black">
                <span>TÌM HIỂU VỀ CHÚNG TÔI</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* 9.3. Bảng 4 số liệu thống kê thành tựu */}
            <div className="metrics-col">
              <div className="metric-item">
                <Compass className="metric-icon" />
                <div>
                  <div className="metric-number">10+</div>
                  <div className="metric-label">Năm kinh nghiệm</div>
                </div>
              </div>

              <div className="metric-item">
                <Users className="metric-icon" />
                <div>
                  <div className="metric-number">250+</div>
                  <div className="metric-label">Cửa hàng toàn quốc</div>
                </div>
              </div>

              <div className="metric-item">
                <Layers className="metric-icon" />
                <div>
                  <div className="metric-number">1000+</div>
                  <div className="metric-label">Thiết kế độc quyền</div>
                </div>
              </div>

              <div className="metric-item">
                <HeartHandshake className="metric-icon" />
                <div>
                  <div className="metric-number">98%</div>
                  <div className="metric-label">Khách hàng hài lòng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================================
       * PROMPT 10: KHỐI BỘ SƯU TẬP LOOKBOOK (LOOKBOOK XUÂN HÈ 2026)
       * - Cột trái: Giới thiệu BST "Thiết Kế Vượt Thời Gian Cho Mọi Khoảnh Khắc" cùng nút "KHÁM PHÁ LOOKBOOK".
       * - Cột phải: Lưới 3 bức ảnh Lookbook người mẫu chụp nghệ thuật phong cách tạp chí thời trang.
       * =================================================================================== */}
      <section className="section-lookbook" id="lookbook">
        <div className="container">
          <div className="lookbook-grid">
            {/* 10.1. Nội dung giới thiệu Lookbook */}
            <div className="lookbook-text-wrap">
              <div className="lookbook-tag">LOOKBOOK XUÂN HÈ 2026</div>
              <h2 className="lookbook-title">
                Thiết Kế Vượt Thời Gian<br />
                Cho Mọi Khoảnh Khắc
              </h2>
              <p className="lookbook-p">
                Khám phá bộ sưu tập Xuân Hè 2026 lấy cảm hứng từ phong cách minimalism sang trọng nhưng không kém phần phóng khoáng.
              </p>
              <a href="#lookbook" className="btn-black">
                <span>KHÁM PHÁ LOOKBOOK</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* 10.2. Lưới 3 hình ảnh người mẫu Lookbook chân dung */}
            <div className="lookbook-photos-grid">
              <div className="lookbook-photo-item">
                <img 
                  src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80" 
                  alt="Lookbook 1"
                  className="lookbook-photo-img"
                />
              </div>
              <div className="lookbook-photo-item">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" 
                  alt="Lookbook 2"
                  className="lookbook-photo-img"
                />
              </div>
              <div className="lookbook-photo-item">
                <img 
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80" 
                  alt="Lookbook 3"
                  className="lookbook-photo-img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================================
       * PROMPT 11: KHỐI 4 CAM KẾT CHẤT LƯỢNG THƯƠNG HIỆU (VALUE PROPOSITIONS)
       * - Dàn rộng toàn màn hình với 4 mục icon tròn viền mảnh:
       *   + CHẤT LƯỢNG THƯỢNG HẠNG: Chất liệu cao cấp & tay nghề thủ công tỉ mỉ từng chi tiết.
       *   + THIẾT KẾ ĐỘC BẢN: Độc quyền sáng tạo bởi chuyên gia thiết kế hàng đầu.
       *   + THỜI TRANG BỀN VỮNG: Cam kết quy trình bền vững và có trách nhiệm vì tương lai.
       *   + ĐỒNG HÀNH CÙNG KHÁCH HÀNG: Dịch vụ cá nhân hóa & chăm sóc khách hàng tận tâm 24/7.
       * =================================================================================== */}
      <section className="section-features">
        <div className="container">
          <div className="features-grid">
            {/* Cam kết 1: Chất lượng thượng hạng */}
            <div className="feature-col">
              <div className="feature-circle-icon">
                <Star size={16} />
              </div>
              <div>
                <h4 className="feature-col-title">CHẤT LƯỢNG THƯỢNG HẠNG</h4>
                <p className="feature-col-desc">
                  Chất liệu cao cấp & tay nghề thủ công tỉ mỉ từng chi tiết.
                </p>
              </div>
            </div>

            {/* Cam kết 2: Thiết kế độc bản */}
            <div className="feature-col">
              <div className="feature-circle-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </div>
              <div>
                <h4 className="feature-col-title">THIẾT KẾ ĐỘC BẢN</h4>
                <p className="feature-col-desc">
                  Độc quyền sáng tạo bởi chuyên gia thiết kế hàng đầu.
                </p>
              </div>
            </div>

            {/* Cam kết 3: Thời trang bền vững */}
            <div className="feature-col">
              <div className="feature-circle-icon">
                <RotateCcw size={16} />
              </div>
              <div>
                <h4 className="feature-col-title">THỜI TRANG BỀN VỮNG</h4>
                <p className="feature-col-desc">
                  Cam kết quy trình bền vững và có trách nhiệm vì tương lai.
                </p>
              </div>
            </div>

            {/* Cam kết 4: Đồng hành cùng khách hàng */}
            <div className="feature-col">
              <div className="feature-circle-icon">
                <User size={16} />
              </div>
              <div>
                <h4 className="feature-col-title">ĐỒNG HÀNH CÙNG KHÁCH HÀNG</h4>
                <p className="feature-col-desc">
                  Dịch vụ cá nhân hóa & chăm sóc khách hàng tận tâm 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================================
       * PROMPT 12: CHÂN TRANG MÀU ĐEN (SITE FOOTER)
       * - Dàn rộng toàn màn hình bằng chuẩn với Header (padding: 0 48px).
       * - 5 cột phân bổ đều đặn và thẳng hàng ngang:
       *   + Cột 1: Logo trắng YOUTH FASHION, đoạn slogan và 3 nút mạng xã hội (Facebook, Instagram, TikTok).
       *   + Cột 2: LIÊN HỆ (Về chúng tôi, Câu hỏi thường gặp, Thông tin liên lạc).
       *   + Cột 3: BỘ SƯU TẬP (Sản phẩm mới, Thời trang nữ, Thời trang nam).
       *   + Cột 4: TƯ VẤN (Hướng dẫn chọn size, Chính sách đổi trả, Chăm sóc khách hàng).
       *   + Cột 5: THÔNG TIN (Nhận thông tin sớm nhất về các bộ sưu tập mới...).
       * - Dòng đáy: Bản quyền 2026 và link Chính sách bảo mật | Điều khoản dịch vụ.
       * =================================================================================== */}
      <footer className="site-footer" id="contact">
        <div className="container">
          <div className="footer-top-grid">
            {/* Cột 1: Thương hiệu, Slogan và Mạng xã hội */}
            <div>
              <div style={{ marginBottom: '18px' }}>
                <Logo light={true} />
              </div>
              <p className="footer-brand-p">
                Youth Fashion kiến tạo những thiết kế vượt thời gian, tôn vinh nét trẻ trung, bản lĩnh và sự tự tin thanh lịch của bạn.
              </p>
              <div className="footer-social-row">
                {/* Nút Facebook */}
                <a href="#" className="social-circle-btn" title="Facebook">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>
                {/* Nút Instagram */}
                <a href="#" className="social-circle-btn" title="Instagram">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                {/* Nút TikTok */}
                <a href="#" className="social-circle-btn" title="TikTok">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68a6.34 6.34 0 0 0 10.86 4.46V12.9a8.16 8.16 0 0 0 5.73 2.25v-3.46a4.85 4.85 0 0 1-3.77-1.39 4.82 4.82 0 0 1-.23-3.61z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Cột 2: Danh mục Liên hệ */}
            <div>
              <h4 className="footer-col-title">LIÊN HỆ</h4>
              <ul className="footer-links-list">
                <li><a href="#about" className="footer-link">Về chúng tôi</a></li>
                <li><a href="#" className="footer-link">Câu hỏi thường gặp</a></li>
                <li><a href="#contact" className="footer-link">Thông tin liên lạc</a></li>
              </ul>
            </div>

            {/* Cột 3: Danh mục Bộ sưu tập */}
            <div>
              <h4 className="footer-col-title">BỘ SƯU TẬP</h4>
              <ul className="footer-links-list">
                <li><a href="#products" className="footer-link">Sản phẩm mới</a></li>
                <li><a href="#products" className="footer-link">Thời trang nữ</a></li>
                <li><a href="#products" className="footer-link">Thời trang nam</a></li>
              </ul>
            </div>

            {/* Cột 4: Danh mục Tư vấn & Hỗ trợ */}
            <div>
              <h4 className="footer-col-title">TƯ VẤN</h4>
              <ul className="footer-links-list">
                <li><a href="#" className="footer-link">Hướng dẫn chọn size</a></li>
                <li><a href="#" className="footer-link">Chính sách đổi trả</a></li>
                <li><a href="#" className="footer-link">Chăm sóc khách hàng</a></li>
              </ul>
            </div>

            {/* Cột 5: Thông báo nhận tin mới */}
            <div>
              <h4 className="footer-col-title">THÔNG TIN</h4>
              <p style={{ fontSize: '12px', color: '#A3A3A3', lineHeight: '1.7' }}>
                Nhận thông tin sớm nhất về các bộ sưu tập mới, sự kiện và ưu đãi độc quyền.
              </p>
            </div>
          </div>

          {/* Dòng bản quyền và điều khoản ở đáy footer */}
          <div className="footer-bottom-bar" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '24px',
            fontSize: '11px',
            color: '#737373'
          }}>
            <span>© 2026 Youth Fashion. Bảo lưu mọi quyền.</span>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <a href="#" style={{ color: '#737373' }}>Chính sách bảo mật</a>
              <span style={{ color: '#404040' }}>|</span>
              <a href="#" style={{ color: '#737373' }}>Điều khoản dịch vụ</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ===================================================================================
       * PROMPT 13: CỬA SỔ POPUP TÌM KIẾM HÌNH ẢNH THÔNG MINH BẰNG AI (AI SEMANTIC SEARCH MODAL)
       * - Tự động kích hoạt khi người dùng nhấn vào nút kính lúp tìm kiếm ở Header hoặc nút Tìm kiếm ở Hero.
       * - Cho phép kéo thả ảnh trang phục, tải ảnh từ máy tính hoặc nhập câu mô tả ngữ nghĩa bằng chữ.
       * =================================================================================== */}
      <AISearchModal 
        isOpen={isAISearchOpen} 
        onClose={() => setIsAISearchOpen(false)} 
        onSelectResult={(item) => alert(`Bạn đã chọn sản phẩm: ${item.name}`)}
      />
    </div>
  );
}

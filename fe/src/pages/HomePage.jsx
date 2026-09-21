import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Hammer, Users, Menu, Heart, Star, Edit3, RotateCcw, UserCheck } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productService } from '../services/productService';
import { getStoredLookbooks, getLookbookPositionValue } from '../services/lookbookData';

const HomePage = ({ onOpenAISearch }) => {
  const [publishedLookbooks, setPublishedLookbooks] = useState([]);

  useEffect(() => {
    const loadLookbooks = () => {
      const all = getStoredLookbooks();
      const published = all
        .filter(item => item.status === 'published')
        .sort((a, b) => getLookbookPositionValue(a.position) - getLookbookPositionValue(b.position));
      setPublishedLookbooks(published);
    };

    loadLookbooks();
    window.addEventListener('lookbook-updated', loadLookbooks);
    window.addEventListener('storage', loadLookbooks);
    return () => {
      window.removeEventListener('lookbook-updated', loadLookbooks);
      window.removeEventListener('storage', loadLookbooks);
    };
  }, []);

  // ----------------------------------------------------------------------------
  // [LOOKBOOK HOMEPAGE QUERY] ĐỒNG BỘ DỮ LIỆU LOOKBOOK VỚI TRANG QUẢN TRỊ:
  // - Lọc ra các lookbook đang kích hoạt (status: 'published').
  // - Bỏ qua ảnh bìa lớn (banner) và hậu trường (backstage) để lấy các trang phục thực tế.
  // - Sắp xếp tăng dần theo số thứ tự vị trí (1, 2, 3...).
  // ----------------------------------------------------------------------------
  const contentLookbooks = publishedLookbooks
    .filter(l => l.position !== 'banner' && l.type !== 'hero' && l.type !== 'backstage')
    .sort((a, b) => Number(a.position) - Number(b.position));

  // Vị trí #1: Lookbook Nổi Bật (hiển thị tiêu đề, mô tả bên trái & ảnh số 1 khung lưới)
  const featuredLookbook = contentLookbooks.find(l => Number(l.position) === 1) || contentLookbooks[0] || null;

  // Vị trí #2: Hiển thị tại ảnh số 2 trong khung lưới ảnh bên phải
  const secondLookbook = contentLookbooks.find(l => Number(l.position) === 2)
    || contentLookbooks.filter(l => l.id !== featuredLookbook?.id)[0]
    || null;

  // Vị trí #3: Hiển thị tại ảnh số 3 trong khung lưới ảnh bên phải
  const thirdLookbook = contentLookbooks.find(l => Number(l.position) === 3)
    || contentLookbooks.filter(l => l.id !== featuredLookbook?.id && l.id !== secondLookbook?.id)[0]
    || null;

  const [newProducts, setNewProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getProducts({ page: 1, limit: 10 });
        const items = res?.data?.products || res?.products || [];
        if (items.length > 0) {
          const mapped = items.map(p => {
            const primaryImg = p.images?.find(i => i.is_primary)?.image_url || p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
            const priceVal = p.variants?.[0]?.price ? Number(p.variants[0].price) : 0;
            return {
              id: p.product_id,
              name: p.product_name,
              price: priceVal > 0 ? priceVal.toLocaleString('vi-VN') + 'đ' : 'Liên hệ',
              tag: 'MỚI',
              image: primaryImg,
            };
          });
          setNewProducts(mapped);
        }
      } catch (err) {
        console.error('Error fetching homepage products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

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

      {/* ----------------------------------------------------------------------
          KHỐI 4: BỘ SƯU TẬP LOOKBOOK TRANG CHỦ (LOOKBOOK SPLIT SECTION)
          - Được điều khiển thời gian thực theo số thứ tự vị trí từ Bảng Quản Trị.
          - Cột trái: Thông tin Lookbook Vị trí #1 (Mùa, Tiêu đề, Mô tả, Nút xem thêm).
          - Cột phải: Khung lưới 3 ảnh tương ứng với Vị trí #1, Vị trí #2 và Vị trí #3.
          ---------------------------------------------------------------------- */}
      {featuredLookbook && (
        <section className="section-lookbook-split container">
          {/* Thẻ mô tả Lookbook chính (Vị trí 1) */}
          <div className="lookbook-left-card">
            <span className="lookbook-sub">
              {featuredLookbook.season ? `BỘ SƯU TẬP • ${featuredLookbook.season.toUpperCase()}` : 'BỘ SƯU TẬP NỔI BẬT'}
            </span>
            <h2 className="lookbook-title font-serif">
              {featuredLookbook.title}
            </h2>
            <p className="lookbook-desc">
              {featuredLookbook.description || "Nơi phong cách thanh lịch hòa cùng nghệ thuật may đo thủ công Pháp. Khám phá các thiết kế thời thượng tôn vinh thần thái của bạn."}
            </p>
            <Link to="/lookbook" className="btn-black lookbook-btn">
              KHÁM PHÁ TUYỂN TẬP LOOKBOOK &rarr;
            </Link>
          </div>

          {/* Lưới 3 ảnh Lookbook tương ứng với các vị trí 1, 2, 3 */}
          <div className="lookbook-photos-grid">
            {/* Ảnh Lookbook Vị trí #1 */}
            <div className="lb-photo-col">
              <img
                src={featuredLookbook.image || "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600"}
                alt={featuredLookbook.title}
                className="lb-img"
              />
            </div>

            {/* Ảnh Lookbook Vị trí #2 */}
            {secondLookbook && (
              <div className="lb-photo-col">
                <img
                  src={secondLookbook.image || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=600"}
                  alt={secondLookbook.title || "Lookbook Highlight 2"}
                  className="lb-img"
                />
              </div>
            )}

            {/* Ảnh Lookbook Vị trí #3 */}
            {thirdLookbook && (
              <div className="lb-photo-col">
                <img
                  src={thirdLookbook.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600"}
                  alt={thirdLookbook.title || "Lookbook Highlight 3"}
                  className="lb-img"
                />
              </div>
            )}
          </div>
        </section>
      )}



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

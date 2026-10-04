import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SIMILAR_PRODUCTS = [
  {
    id: 101,
    tag: 'TAILORED BLAZER',
    title: 'Áo Blazer Dạ Than Phom Oversized',
    desc: 'Dạ len nguyên chất Ý',
    price: 2890000,
    badgeRight: '3 MÀU SẮC',
    badgeRightColor: 'gray',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 102,
    tag: 'HAUTE SOIRÉE DRESS',
    title: 'Đầm Dạ Tiệc Lụa Pleated Emerald',
    desc: 'Lụa tơ tằm dập ly thủ công',
    price: 3450000,
    badgeRight: 'GIỚI HẠN 50 BẢN',
    badgeRightColor: 'gold',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 103,
    tag: 'BESPOKE TAILORING',
    title: 'Quần Tây Ống Rộng Phom Suông',
    desc: 'Vải len pha lụa đứng dáng',
    price: 1890000,
    badgeRight: 'ĐẦY ĐỦ SIZE',
    badgeRightColor: 'gray',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 104,
    tag: 'GENTLEMAN ESSENTIALS',
    title: 'Áo Dệt Kim Polo Navy Cổ Điển',
    desc: 'Sợi Cotton Sea Island siêu mịn',
    price: 1550000,
    badgeRight: 'BEST MATCH',
    badgeRightColor: 'gray',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=800'
  }
];

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedSizes, setSelectedSizes] = useState({});

  const handleSelectSize = (productId, size) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const handleRemoveItem = (product) => {
    toggleWishlist(product);
  };

  const handleAddToCart = (product) => {
    const chosenSize = selectedSizes[product.id] || product.selectedSize || 'M';
    if (addToCart) {
      addToCart(product, chosenSize, 1);
    }
    showSuccess(`Đã thêm "${product.title || product.name}" (Size: ${chosenSize}) vào giỏ hàng!`);
  };

  const handleAddAllToCart = () => {
    const inStockItems = wishlist.filter(item => item.inStock !== false);
    if (inStockItems.length === 0) {
      showError('Hiện không có sản phẩm nào còn hàng để thêm.');
      return;
    }
    if (addToCart) {
      inStockItems.forEach(item => {
        const chosenSize = selectedSizes[item.id] || item.selectedSize || 'M';
        addToCart(item, chosenSize, 1);
      });
    }
    showSuccess(`Đã thêm tất cả ${inStockItems.length} sản phẩm còn hàng vào giỏ hàng thành công!`);
  };

  const toggleSimilarProduct = (prod) => {
    toggleWishlist(prod);
  };

  // Hàm xác định category chuẩn cho bộ lọc
  const getItemCategory = (item) => {
    if (item.category === 'COAT_BLAZER' || item.category === 'DRESS' || item.category === 'PANTS_SKIRT') {
      return item.category;
    }
    const title = (item.title || item.name || '').toLowerCase();
    const cat = (item.categoryName || item.category || '').toLowerCase();
    if (title.includes('áo khoác') || title.includes('blazer') || title.includes('măng tô') || title.includes('tweed') || cat.includes('khoác') || cat.includes('blazer')) {
      return 'COAT_BLAZER';
    }
    if (title.includes('đầm') || title.includes('váy') || cat.includes('đầm') || cat.includes('váy')) {
      return 'DRESS';
    }
    if (title.includes('quần') || cat.includes('quần')) {
      return 'PANTS_SKIRT';
    }
    return 'COAT_BLAZER';
  };

  // Filter items based on selected category tab
  const filteredItems = wishlist.filter(item => {
    if (activeCategory === 'ALL') return true;
    return getItemCategory(item) === activeCategory;
  });

  const countAll = wishlist.length;
  const countCoat = wishlist.filter(i => getItemCategory(i) === 'COAT_BLAZER').length;
  const countDress = wishlist.filter(i => getItemCategory(i) === 'DRESS').length;
  const countPants = wishlist.filter(i => getItemCategory(i) === 'PANTS_SKIRT').length;

  return (
    <div className="wishlist-page-container">
      {/* 1. Breadcrumbs */}
      <nav className="wishlist-breadcrumb">
        <Link to="/" className="breadcrumb-link">TRANG CHỦ</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">
          DANH SÁCH YÊU THÍCH ({countAll < 10 ? `0${countAll}` : countAll} SẢN PHẨM ĐÃ LƯU)
        </span>
      </nav>

      {/* 2. Empty Wishlist State vs Product List */}
      {wishlist.length === 0 ? (
        <div className="wishlist-empty-main">
          <div className="empty-heart-circle">
            <Heart size={36} color="#111827" strokeWidth={1.5} />
          </div>
          <h2 className="empty-main-title font-serif">DANH SÁCH YÊU THÍCH CỦA BẠN ĐANG TRỐNG</h2>
          <p className="empty-main-desc">
            Chưa có sản phẩm nào được lưu. Bạn hãy nhấn vào biểu tượng <strong>trái tim</strong> ở góc trên mỗi sản phẩm khi xem bộ sưu tập để lưu lại những thiết kế bạn ưng ý nhất!
          </p>
          <Link to="/products" className="btn-explore-now">
            KHÁM PHÁ BỘ SƯU TẬP NGAY &rarr;
          </Link>
        </div>
      ) : (
        <>
          {/* Filter Bar & Bulk Actions */}
          <div className="wishlist-toolbar">
            <div className="category-filter-tabs">
              <button
                type="button"
                className={`filter-tab-btn ${activeCategory === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveCategory('ALL')}
              >
                TẤT CẢ ({countAll})
              </button>
              <button
                type="button"
                className={`filter-tab-btn ${activeCategory === 'COAT_BLAZER' ? 'active' : ''}`}
                onClick={() => setActiveCategory('COAT_BLAZER')}
              >
                ÁO KHOÁC &amp; BLAZER ({countCoat})
              </button>
              <button
                type="button"
                className={`filter-tab-btn ${activeCategory === 'DRESS' ? 'active' : ''}`}
                onClick={() => setActiveCategory('DRESS')}
              >
                ĐẦM DẠ TIỆC ({countDress})
              </button>
              <button
                type="button"
                className={`filter-tab-btn ${activeCategory === 'PANTS_SKIRT' ? 'active' : ''}`}
                onClick={() => setActiveCategory('PANTS_SKIRT')}
              >
                QUẦN &amp; CHÂN VÁY ({countPants})
              </button>
            </div>

            <button 
              type="button" 
              className="btn-bulk-add-all"
              onClick={handleAddAllToCart}
            >
              <ShoppingBag size={14} strokeWidth={2} />
              <span>THÊM TẤT CẢ CÒN HÀNG VÀO GIỎ HÀNG</span>
            </button>
          </div>

          {/* 3. Wishlist Items Grid or Category Empty State */}
          {filteredItems.length === 0 ? (
            <div className="wishlist-empty-state">
              <Heart size={44} className="empty-heart-icon" />
              <h3 className="empty-title font-serif">Danh mục này hiện không có sản phẩm yêu thích</h3>
              <p className="empty-sub">Khám phá các bộ sưu tập thời trang thượng hạng của Youth Fashion.</p>
              <button 
                type="button" 
                className="btn-back-all"
                onClick={() => setActiveCategory('ALL')}
              >
                XEM TẤT CẢ SẢN PHẨM YÊU THÍCH
              </button>
            </div>
          ) : (
            <div className="wishlist-grid">
              {filteredItems.map((product) => {
                const currentSize = selectedSizes[product.id] || product.selectedSize || (product.availableSizes ? product.availableSizes[0] : 'M');
                const priceNum = typeof product.price === 'number' 
                  ? product.price 
                  : (parseInt(String(product.price).replace(/\D/g, '')) || 3450000);
                const originalPriceNum = product.originalPrice;

                const skuText = product.sku || (product.id ? `YF-${product.id}` : 'YF-COAT-CAMEL-01');
                const statusText = product.status || 'CÒN HÀNG';
                const badgeTopText = product.badgeTop || product.tag || '-18% ƯU ĐÃI';
                const badgeSubText = product.badgeSub || (badgeTopText.includes('18%') || !product.badgeSub ? 'CASHMERE 100%' : product.badgeSub);
                const sizes = product.availableSizes || ['S', 'M', 'L'];

                // Badge top background color
                const badgeTopBg = product.badgeTopBg || (badgeTopText === '-18% ƯU ĐÃI' ? '#000000' : (badgeTopText === 'BEST SELLER' ? '#92400e' : (badgeTopText === 'GIỚI HẠN 50 BẢN' ? '#7f1d1d' : '#57534e')));
                const badgeTopColor = product.badgeTopColor || '#ffffff';

                // Badge sub background color
                const badgeSubBg = product.badgeSubBg || (badgeSubText === 'CASHMERE 100%' ? '#fce7b2' : (badgeSubText === 'TWEED PHÁP' ? '#fef3c7' : (badgeSubText === 'CHỈ CÒN 2 CHIẾC' ? '#c2410c' : '#f5f5f4')));
                const badgeSubColor = product.badgeSubColor || (badgeSubText === 'CHỈ CÒN 2 CHIẾC' ? '#ffffff' : (badgeSubText === 'CASHMERE 100%' ? '#713f12' : (badgeSubText === 'TWEED PHÁP' ? '#78350f' : '#44403c')));

                // Status text color
                const statusColor = product.statusColor || (statusText === 'SẮP HẾT HÀNG' ? '#c2410c' : (statusText === 'ĐẦY ĐỦ SIZE' ? '#0f766e' : '#15803d'));

                return (
                  <div key={product.id} className="wishlist-card">
                    {/* Ảnh sản phẩm với Badges và nút Trái tim */}
                    <div className="wishlist-card-media">
                      <img src={product.image} alt={product.title || product.name} className="wishlist-card-img" />

                      <div className="wishlist-card-badges">
                        {badgeTopText && (
                          <span 
                            className="badge-discount"
                            style={{ backgroundColor: badgeTopBg, color: badgeTopColor }}
                          >
                            {badgeTopText}
                          </span>
                        )}
                        {badgeSubText && (
                          <span 
                            className="badge-material"
                            style={{ backgroundColor: badgeSubBg, color: badgeSubColor }}
                          >
                            {badgeSubText}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="wishlist-heart-btn"
                        title="Bỏ khỏi yêu thích"
                        onClick={() => handleRemoveItem(product)}
                      >
                        <Heart size={16} fill="#dc2626" color="#dc2626" />
                      </button>
                    </div>

                    {/* Phần dưới ảnh */}
                    <div className="wishlist-card-body">
                      {/* 1. SKU & Trạng thái còn hàng */}
                      <div className="wishlist-meta-row">
                        <span className="wishlist-sku">SKU: {skuText}</span>
                        <span className="wishlist-stock-status" style={{ color: statusColor }}>
                          <span className="stock-dot">•</span> {statusText}
                        </span>
                      </div>

                      {/* 2. Tên sản phẩm */}
                      <h3 className="wishlist-card-title font-serif">
                        {product.title || product.name}
                      </h3>

                      {/* 3. Giá tiền */}
                      <div className="wishlist-price-row">
                        <span className="wishlist-price-current">
                          {priceNum > 0 ? priceNum.toLocaleString('vi-VN') + '₫' : '3.450.000₫'}
                        </span>
                        {originalPriceNum && originalPriceNum > priceNum && (
                          <span className="wishlist-price-original">
                            {originalPriceNum.toLocaleString('vi-VN')}₫
                          </span>
                        )}
                      </div>

                      {/* 4. Kích cỡ: KÍCH CỠ bên trái, S M L bên phải */}
                      <div className="wishlist-size-row">
                        <span className="wishlist-size-label">KÍCH CỠ:</span>
                        <div className="wishlist-size-boxes">
                          {sizes.map((sz) => {
                            const isSelected = currentSize === sz;
                            return (
                              <button
                                key={sz}
                                type="button"
                                className={`size-btn ${isSelected ? 'active' : ''}`}
                                onClick={() => handleSelectSize(product.id, sz)}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 5. Nút Thêm vào giỏ hàng */}
                      <button
                        type="button"
                        className="wishlist-add-cart-btn"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingBag size={14} strokeWidth={2} />
                        <span>THÊM VÀO GIỎ HÀNG</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 4. Section: Sản Phẩm Tương Tự */}
      <section className="similar-products-section">
        <h2 className="similar-section-title font-serif">Sản phẩm tương tự</h2>

        <div className="similar-grid">
          {SIMILAR_PRODUCTS.map((prod) => {
            const isLiked = wishlist.some(i => (typeof i === 'object' ? (i.id === prod.id || i.product_id === prod.id || i.title === prod.title) : i === prod.id));
            const priceNum = typeof prod.price === 'number' ? prod.price : 2890000;

            return (
              <div key={prod.id} className="similar-card">
                <div className="similar-card-media">
                  <img src={prod.image} alt={prod.title} className="similar-card-img" />

                  <button
                    type="button"
                    className="similar-heart-btn"
                    title={isLiked ? 'Bỏ thích' : 'Yêu thích'}
                    onClick={() => toggleSimilarProduct(prod)}
                  >
                    <Heart size={16} fill={isLiked ? '#dc2626' : 'none'} color={isLiked ? '#dc2626' : '#111827'} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="similar-card-body">
                  <span className="similar-card-tag">{prod.tag}</span>
                  <h3 className="similar-card-title font-serif">{prod.title}</h3>
                  <p className="similar-card-desc">{prod.desc}</p>

                  <div className="similar-card-price-row">
                    <span className="similar-card-price">
                      {priceNum.toLocaleString('vi-VN')}₫
                    </span>
                    <span className={`similar-card-badge-right ${prod.badgeRightColor === 'gold' ? 'gold' : ''}`}>
                      {prod.badgeRight}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style>{`
        .wishlist-page-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 24px 72px;
          color: #111827;
          background-color: #ffffff;
        }

        /* 1. Breadcrumbs */
        .wishlist-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .breadcrumb-link {
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }

        .breadcrumb-link:hover {
          color: #111827;
        }

        .breadcrumb-separator {
          color: #9ca3af;
          font-size: 10px;
        }

        .breadcrumb-current {
          color: #111827;
          font-weight: 700;
        }

        /* 2. Toolbar & Category Filters */
        .wishlist-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .category-filter-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-tab-btn {
          height: 38px;
          padding: 0 16px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background-color: #f4f4f5;
          color: #4b5563;
          border: none;
          border-radius: 0;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .filter-tab-btn:hover:not(.active) {
          background-color: #e4e4e7;
          color: #111827;
        }

        .filter-tab-btn.active {
          background-color: #000000;
          color: #ffffff;
        }

        .btn-bulk-add-all {
          height: 38px;
          padding: 0 20px;
          background-color: #000000;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          border: none;
          border-radius: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.2s;
        }

        .btn-bulk-add-all:hover {
          opacity: 0.88;
        }

        /* 3. Wishlist Grid */
        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 48px;
        }

        /* Wishlist Card - Exact match to user photo */
        .wishlist-card {
          background-color: #ffffff;
          border: 1px solid #ebebeb;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: box-shadow 0.2s ease;
        }

        .wishlist-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        /* Khung ảnh */
        .wishlist-card-media {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          background-color: #f3f4f6;
          overflow: hidden;
        }

        .wishlist-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .wishlist-card:hover .wishlist-card-img {
          transform: scale(1.03);
        }

        /* Badges góc trên bên trái */
        .wishlist-card-badges {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          z-index: 2;
        }

        .badge-discount {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.6px;
          padding: 3px 7px;
          text-transform: uppercase;
        }

        .badge-material {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.5px;
          padding: 3px 6px;
          text-transform: uppercase;
        }

        /* Nút trái tim tròn góc trên bên phải */
        .wishlist-heart-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #ffffff;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 3;
          transition: transform 0.15s;
        }

        .wishlist-heart-btn:hover {
          transform: scale(1.1);
        }

        /* Phần DƯỚI ẢNH */
        .wishlist-card-body {
          padding: 14px 12px 14px 12px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        /* Hàng 1: SKU & CÒN HÀNG */
        .wishlist-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .wishlist-sku {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #4b5563;
          text-transform: uppercase;
        }

        .wishlist-stock-status {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .stock-dot {
          font-size: 14px;
          line-height: 1;
        }

        /* Hàng 2: Tên sản phẩm */
        .wishlist-card-title {
          font-size: 17.5px;
          font-weight: 700;
          line-height: 1.25;
          color: #111827;
          margin: 0 0 10px 0;
          min-height: 44px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-family: 'Playfair Display', Georgia, serif;
        }

        /* Hàng 3: Giá tiền */
        .wishlist-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 14px;
        }

        .wishlist-price-current {
          font-size: 18px;
          font-weight: 800;
          color: #000000;
          letter-spacing: -0.2px;
        }

        .wishlist-price-original {
          font-size: 13.5px;
          color: #9ca3af;
          text-decoration: line-through;
          font-weight: 400;
        }

        /* Hàng 4: Kích cỡ */
        .wishlist-size-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          margin-top: auto;
        }

        .wishlist-size-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #4b5563;
          text-transform: uppercase;
        }

        .wishlist-size-boxes {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .size-btn {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          border: none;
          border-radius: 0;
          background-color: #f4f4f5;
          color: #18181b;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .size-btn:hover:not(.active) {
          background-color: #e4e4e7;
        }

        .size-btn.active {
          background-color: #000000;
          color: #ffffff;
        }

        /* Hàng 5: Nút thêm vào giỏ hàng */
        .wishlist-add-cart-btn {
          width: 100%;
          height: 40px;
          background-color: #000000;
          color: #ffffff;
          border: none;
          border-radius: 0;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .wishlist-add-cart-btn:hover {
          opacity: 0.88;
        }

        /* Main Empty State */
        .wishlist-empty-main {
          padding: 60px 24px;
          text-align: center;
          background-color: #fafafa;
          border: 1px dashed #e5e7eb;
          margin: 16px 0 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .empty-heart-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .empty-main-title {
          font-size: 20px;
          letter-spacing: 1px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 10px;
        }

        .empty-main-desc {
          max-width: 540px;
          font-size: 13.5px;
          line-height: 1.6;
          color: #6b7280;
          margin-bottom: 24px;
        }

        .btn-explore-now {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background-color: #111827;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-decoration: none;
          transition: background-color 0.2s, transform 0.2s;
        }

        .btn-explore-now:hover {
          background-color: #000000;
          transform: translateY(-1px);
        }

        /* Empty State */
        .wishlist-empty-state {
          padding: 80px 20px;
          text-align: center;
          background-color: #fafafa;
          border: 1px dashed #e5e7eb;
          margin: 20px 0;
        }

        .empty-heart-icon {
          color: #9ca3af;
          margin-bottom: 16px;
        }

        .empty-title {
          font-size: 22px;
          margin-bottom: 8px;
        }

        .empty-sub {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .btn-back-all {
          padding: 10px 24px;
          background-color: #111827;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          border: none;
          cursor: pointer;
        }

        /* 4. Similar Products Section - Gray background aligns with top 4 cards, content stays indented */
        .similar-products-section {
          background-color: #f7f7f8;
          width: 100%;
          margin: 56px 0 48px 0;
          padding: 36px 36px 44px 36px;
          border-radius: 4px;
        }

        .similar-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 32px;
          font-weight: 500;
          color: #18181b;
          margin: 0 0 24px 0;
          padding: 0;
          text-align: left;
          letter-spacing: -0.3px;
        }

        .similar-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          width: 100%;
          margin: 0;
          padding: 0;
        }

        .similar-card {
          background-color: #ffffff;
          border: 1px solid #ebebeb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          text-decoration: none;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .similar-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        }

        .similar-card-media {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          background-color: #f3f4f6;
          overflow: hidden;
        }

        .similar-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .similar-card:hover .similar-card-img {
          transform: scale(1.03);
        }

        .similar-heart-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #ffffff;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 2;
          transition: transform 0.15s;
        }

        .similar-heart-btn:hover {
          transform: scale(1.1);
        }

        .similar-card-body {
          padding: 16px 16px 18px 16px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .similar-card-tag {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #71717a;
          margin-bottom: 6px;
        }

        .similar-card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 17px;
          font-weight: 700;
          line-height: 1.28;
          color: #18181b;
          margin: 0 0 6px 0;
          min-height: 44px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .similar-card-desc {
          font-size: 12px;
          color: #71717a;
          margin: 0 0 16px 0;
        }

        .similar-card-price-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-top: auto;
        }

        .similar-card-price {
          font-size: 17px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.2px;
        }

        .similar-card-badge-right {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #71717a;
        }

        .similar-card-badge-right.gold {
          color: #b45309;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1100px) {
          .wishlist-grid,
          .similar-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 640px) {
          .wishlist-page-container {
            padding: 16px 16px 48px;
          }
          .wishlist-grid,
          .similar-grid {
            grid-template-columns: 1fr;
          }
          .wishlist-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .btn-bulk-add-all {
            justify-content: center;
          }
          .similar-products-section {
            margin: 36px 0 24px 0;
            padding: 20px 14px;
          }
        }
      `}</style>
    </div>
  );
}

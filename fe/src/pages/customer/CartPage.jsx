import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, RotateCw, ArrowLeft, ShieldCheck, RefreshCw, MessageSquare, Info, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productService } from '../../services/productService';

export default function CartPage() {
  const { 
    cart, 
    cartCount, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    toggleCartItemSelection, 
    toggleSelectAllCart,
    wishlist, 
    toggleWishlist 
  } = useAuth();
  const { showSuccess, showInfo, showError } = useToast();

  const [similarProducts, setSimilarProducts] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [orderNote, setOrderNote] = useState('');

  // Tải danh sách sản phẩm gợi ý trực tiếp từ CSDL MySQL
  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const res = await productService.getProducts({ limit: 4 });
        const items = res.data?.products || res.products || [];
        setSimilarProducts(items);
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm tương tự từ MySQL:', err);
      }
    };
    fetchSimilar();
  }, []);

  const cartItems = cart || [];
  const allSelected = cartItems.length > 0 && cartItems.every(i => i.selected);

  const handleToggleSelectAll = () => {
    if (toggleSelectAllCart) {
      toggleSelectAllCart(!allSelected);
    }
  };

  const handleToggleItem = (id) => {
    if (toggleCartItemSelection) {
      toggleCartItemSelection(id);
    }
  };

  const handleQuantityChange = (id, delta) => {
    if (updateCartQuantity) {
      updateCartQuantity(id, delta);
    }
  };

  const handleRemoveItem = (item) => {
    if (removeFromCart) {
      removeFromCart(item.id);
    }
    showInfo(`Đã xóa "${item.title}" khỏi giỏ hàng.`);
  };

  const handleSaveToWishlist = (item) => {
    toggleWishlist(item);
    showSuccess(`Đã lưu "${item.title}" vào danh sách yêu thích!`);
  };

  const handleClearAll = () => {
    if (cartItems.length === 0) return;
    if (clearCart) {
      clearCart();
    }
    showInfo('Đã làm trống giỏ hàng.');
  };

  const handleApplyVoucher = (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) {
      showError('Vui lòng nhập mã ưu đãi.');
      return;
    }
    const code = voucherCode.trim().toUpperCase();
    if (code === 'YOUTH10') {
      setAppliedVoucher({ code, discountPercent: 10, discountAmount: 0 });
      showSuccess('Đã áp dụng mã giảm giá 10%!');
    } else {
      setAppliedVoucher({ code, discountPercent: 0, discountAmount: 50000 });
      showSuccess(`Đã áp dụng mã ưu đãi ${code}!`);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    showInfo('Đã gỡ mã ưu đãi.');
  };

  const handleCheckout = () => {
    const selectedCount = cartItems.filter(i => i.selected).length;
    if (selectedCount === 0) {
      showError('Vui lòng chọn ít nhất 1 sản phẩm để tiến hành thanh toán.');
      return;
    }
    showSuccess('Đang chuyển hướng tới cổng thanh toán an toàn...');
  };

  // Calculations
  const selectedItems = cartItems.filter(i => i.selected);
  const totalItemsCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const rawProductTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let voucherDiscount = 0;
  if (appliedVoucher && rawProductTotal > 0) {
    if (appliedVoucher.discountPercent) {
      voucherDiscount = Math.round((rawProductTotal * appliedVoucher.discountPercent) / 100);
    } else if (appliedVoucher.discountAmount) {
      voucherDiscount = Math.min(rawProductTotal, appliedVoucher.discountAmount);
    }
  }

  const finalTotal = Math.max(0, rawProductTotal - voucherDiscount);

  // Original saved calculation
  const totalOriginalSaving = selectedItems.reduce((sum, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return sum + (item.originalPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0) + voucherDiscount;

  return (
    <div className="cart-page-container">
      {/* 1. Breadcrumbs */}
      <nav className="cart-breadcrumb">
        <Link to="/" className="breadcrumb-link">TRANG CHỦ</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">
          GIỎ HÀNG ({cartItems.length < 10 ? `0${cartItems.length}` : cartItems.length} SẢN PHẨM)
        </span>
      </nav>

      {/* 2. Page Title */}
      <h1 className="cart-page-title font-serif">Giỏ Hàng Mua Sắm</h1>

      {/* 3. Main Cart Content Layout */}
      {cartItems.length === 0 ? (
        <div className="cart-empty-state">
          <ShoppingBag size={48} color="#9ca3af" strokeWidth={1.5} />
          <h2 className="empty-title font-serif">GIỎ HÀNG CỦA BẠN ĐANG TRỐNG</h2>
          <p className="empty-desc">
            Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các thiết kế thời trang cao cấp của Youth Fashion ngay!
          </p>
          <Link to="/products" className="btn-explore-now">
            KHÁM PHÁ BỘ SƯU TẬP NGAY &rarr;
          </Link>
        </div>
      ) : (
        <div className="cart-layout-grid">
          {/* Left Column: Cart Items Table */}
          <div className="cart-left-col">
            {/* Table Header Row */}
            <div className="cart-table-header">
              <div className="checkbox-label" onClick={handleToggleSelectAll}>
                <button
                  type="button"
                  className={`custom-checkbox-btn ${allSelected ? 'checked' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleToggleSelectAll(); }}
                  aria-label="Chọn tất cả"
                >
                  {allSelected && <Check size={11} strokeWidth={3} color="#ffffff" />}
                </button>
                <span className="th-select-all">CHỌN TẤT CẢ</span>
              </div>
              <span className="th-details-sep">|</span>
              <span className="th-title">SẢN PHẨM &amp; CHI TIẾT</span>
              <span className="th-price">ĐƠN GIÁ</span>
              <span className="th-qty">SỐ LƯỢNG</span>
              <span className="th-subtotal">TẠM TÍNH</span>
            </div>

            {/* Cart Items List */}
            <div className="cart-items-list">
              {cartItems.map((item) => {
                const subtotal = item.price * item.quantity;
                return (
                  <div key={item.id} className="cart-item-card">
                    <div className="cart-item-main-row">
                      {/* Checkbox aligned to top */}
                      <div className="item-checkbox-wrapper">
                        <button
                          type="button"
                          className={`custom-checkbox-btn ${item.selected ? 'checked' : ''}`}
                          onClick={() => handleToggleItem(item.id)}
                          aria-label={`Chọn ${item.title}`}
                        >
                          {item.selected && <Check size={11} strokeWidth={3} color="#ffffff" />}
                        </button>
                      </div>

                      {/* Product Thumbnail */}
                      <div className="item-thumbnail-box">
                        <img src={item.image} alt={item.title} className="item-thumb-img" />
                        {item.badge && (
                          <span 
                            className="item-thumb-badge"
                            style={{ backgroundColor: item.badgeBg || '#000000' }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Product Details Info */}
                      <div className="item-info-col">
                        <span className="item-category-tag">{item.categoryTag}</span>
                        <h3 className="item-name font-serif">{item.title}</h3>
                        <span className="item-sku">SKU: {item.sku}</span>
                        <div className="item-variant-meta">
                          <span className="color-dot" style={{ backgroundColor: item.colorDot }}></span>
                          <span className="color-text">{item.colorName}</span>
                          <span className="variant-sep">|</span>
                          <span className="size-text">Kích cỡ: {item.size}</span>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="item-price-col">
                        <span className="item-price-current">
                          {item.price.toLocaleString('vi-VN')}₫
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="item-price-original">
                            {item.originalPrice.toLocaleString('vi-VN')}₫
                          </span>
                        )}
                      </div>

                      {/* Quantity Controller */}
                      <div className="item-qty-col">
                        <div className="qty-control-box">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="item-subtotal-col">
                        <span className="item-subtotal-val">
                          {subtotal.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>

                    {/* Actions row under item */}
                    <div className="item-actions-row">
                      <button
                        type="button"
                        className="item-action-btn"
                        onClick={() => handleSaveToWishlist(item)}
                      >
                        <Heart size={13} />
                        <span>LƯU VÀO YÊU THÍCH</span>
                      </button>
                      <span className="action-sep">|</span>
                      <button
                        type="button"
                        className="item-action-btn btn-remove"
                        onClick={() => handleRemoveItem(item)}
                      >
                        <Trash2 size={13} />
                        <span>XÓA</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div className="cart-bottom-actions">
              <Link to="/products" className="btn-continue-shopping">
                <ArrowLeft size={14} />
                <span>TIẾP TỤC MUA SẮM</span>
              </Link>

              <div className="cart-bulk-actions">
                <button 
                  type="button" 
                  className="btn-refresh-cart"
                  onClick={() => showInfo('Giỏ hàng đã được làm mới đồng bộ.')}
                >
                  <RotateCw size={13} />
                  <span>CẬP NHẬT GIỎ HÀNG</span>
                </button>
                <button
                  type="button"
                  className="btn-clear-all"
                  onClick={handleClearAll}
                >
                  XÓA TẤT CẢ
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary ("Tóm Tắt Đơn Hàng") */}
          <div className="cart-right-col">
            <div className="order-summary-card">
              <h2 className="summary-title font-serif">Tóm Tắt Đơn Hàng</h2>

              {/* Rows */}
              <div className="summary-rows">
                <div className="summary-row">
                  <span className="row-label">Tổng giá trị sản phẩm ({totalItemsCount})</span>
                  <span className="row-value bold">{rawProductTotal.toLocaleString('vi-VN')}₫</span>
                </div>

                {appliedVoucher && voucherDiscount > 0 && (
                  <div className="summary-row voucher-discount-row">
                    <span className="row-label">
                      Mã giảm giá ({appliedVoucher.code})
                    </span>
                    <span className="row-value discount">
                      -{voucherDiscount.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                )}

                <div className="summary-row shipping-row">
                  <div className="shipping-label-group">
                    <span className="row-label">Vận chuyển hỏa tốc VIP</span>
                    <span className="shipping-subtext">NHẬN HÀNG TRONG 2-4 GIỜ TẠI NỘI THÀNH</span>
                  </div>
                  <span className="row-value shipping-free">MIỄN PHÍ</span>
                </div>
              </div>

              {/* Highlight Total Box */}
              <div className="summary-total-box">
                <div className="total-left">
                  <span className="total-label">TỔNG THANH TOÁN</span>
                  <span className="total-vat">(Đã bao gồm thuế GTGT VAT)</span>
                </div>
                <div className="total-right">
                  <span className="total-amount">{finalTotal.toLocaleString('vi-VN')}₫</span>
                  {totalOriginalSaving > 0 && (
                    <span className="total-savings">
                      Tiết kiệm {totalOriginalSaving.toLocaleString('vi-VN')}₫ so với giá gốc
                    </span>
                  )}
                </div>
              </div>

              {/* Voucher / Coupon Box */}
              <div className="voucher-box">
                <span className="voucher-title">MÃ ƯU ĐÃI</span>
                <p className="voucher-desc">Nhập mã giảm giá hoặc thẻ quà tặng của bạn.</p>
                <form className="voucher-input-group" onSubmit={handleApplyVoucher}>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Nhập mã ưu đãi..."
                    className="voucher-input"
                  />
                  <button type="submit" className="btn-apply-voucher">
                    ÁP DỤNG
                  </button>
                </form>
                {appliedVoucher && (
                  <div className="voucher-applied-tag">
                    <span className="applied-left">
                      <Check size={13} />
                      <span>Voucher {appliedVoucher.code} (-{voucherDiscount.toLocaleString('vi-VN')}₫)</span>
                    </span>
                    <button type="button" className="btn-remove-voucher" onClick={handleRemoveVoucher}>
                      GỠ MÃ
                    </button>
                  </div>
                )}
              </div>

              {/* Order Note Box */}
              <div className="note-box">
                <span className="note-title">GHI CHÚ</span>
                <input
                  type="text"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Ví dụ: Vui lòng đóng gói hộp quà nơ lụa..."
                  className="note-input"
                />
              </div>

              {/* Action Buttons */}
              <div className="summary-action-btns">
                <button
                  type="button"
                  className="btn-checkout"
                  onClick={handleCheckout}
                >
                  TIẾN HÀNH THANH TOÁN &rarr;
                </button>

                <a 
                  href="tel:19001234" 
                  className="btn-contact-consult"
                  onClick={(e) => { e.preventDefault(); showInfo('Hotline tư vấn VIP 24/7: 1900 1234'); }}
                >
                  <MessageSquare size={14} />
                  <span>LIÊN HỆ TƯ VẤN ĐƠN HÀNG</span>
                </a>
              </div>

              {/* Guarantees */}
              <div className="summary-guarantees">
                <div className="guarantee-item">
                  <ShieldCheck size={14} className="g-icon" />
                  <span>Bảo mật giao dịch chuẩn quốc tế.</span>
                </div>
                <div className="guarantee-item">
                  <RefreshCw size={14} className="g-icon" />
                  <span>Chính sách đổi trả miễn phí trong 30 ngày.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Section: Sản Phẩm Tương Tự (Always displayed below cart) */}
      <section className="similar-products-section">
        <h2 className="similar-section-title font-serif">Sản phẩm tương tự</h2>

        <div className="similar-grid">
          {similarProducts.map((p) => {
            const primaryImg = p.images?.find((i) => i.is_primary)?.image_url || p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
            const priceVal = p.variants?.[0]?.price ? Number(p.variants[0].price) : 0;
            const isLiked = wishlist.some((i) => (typeof i === 'object' ? (i.id === p.product_id || i.product_id === p.product_id) : i === p.product_id));

            return (
              <div key={p.product_id} className="similar-card">
                <div className="similar-card-media">
                  <img src={primaryImg} alt={p.product_name} className="similar-card-img" />

                  <button
                    type="button"
                    className="similar-heart-btn"
                    title={isLiked ? 'Bỏ thích' : 'Yêu thích'}
                    onClick={() => toggleWishlist({
                      id: p.product_id,
                      product_id: p.product_id,
                      title: p.product_name,
                      name: p.product_name,
                      price: priceVal,
                      image: primaryImg,
                    })}
                  >
                    <Heart size={16} fill={isLiked ? '#dc2626' : 'none'} color={isLiked ? '#dc2626' : '#111827'} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="similar-card-body">
                  <span className="similar-card-tag">{p.category?.category_name || 'THỜI TRANG'}</span>
                  <h3 className="similar-card-title font-serif">{p.product_name}</h3>
                  <p className="similar-card-desc">{p.brand?.brand_name || 'Youth Fashion'}</p>

                  <div className="similar-card-price-row">
                    <span className="similar-card-price">
                      {priceVal > 0 ? priceVal.toLocaleString('vi-VN') + '₫' : 'Liên hệ'}
                    </span>
                    <span className="similar-card-badge-right">
                      MỚI
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style>{`
        .cart-page-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 24px 72px;
          color: #111827;
          background-color: #ffffff;
        }

        /* 1. Breadcrumbs */
        .cart-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 16px;
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

        /* 2. Page Title */
        .cart-page-title {
          font-size: 36px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 28px 0;
          letter-spacing: -0.5px;
        }

        /* 3. Empty State */
        .cart-empty-state {
          padding: 80px 24px;
          text-align: center;
          background-color: #fafafa;
          border: 1px dashed #e5e7eb;
          margin: 20px 0 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .empty-title {
          font-size: 22px;
          margin: 20px 0 10px;
          color: #111827;
        }

        .empty-desc {
          max-width: 480px;
          font-size: 13.5px;
          color: #6b7280;
          line-height: 1.6;
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
          letter-spacing: 1px;
          text-decoration: none;
          transition: background-color 0.2s;
        }

        .btn-explore-now:hover {
          background-color: #000000;
        }

        /* 4. Cart Layout Grid */
        .cart-layout-grid {
          display: grid;
          grid-template-columns: 1fr 390px;
          gap: 36px;
          align-items: flex-start;
          margin-bottom: 64px;
        }

        /* Table Header */
        .cart-table-header {
          display: flex;
          align-items: center;
          background-color: #f9fafb;
          height: 44px;
          padding: 0 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #4b5563;
          margin-bottom: 16px;
          border: 1px solid #f0f0f0;
        }

        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .custom-checkbox-btn {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1.5px solid #000000;
          background-color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          transition: all 0.15s ease;
          flex-shrink: 0;
          outline: none;
        }

        .custom-checkbox-btn:hover {
          border-color: #000000;
        }

        .custom-checkbox-btn.checked {
          background-color: #000000;
          border-color: #000000;
        }

        .th-select-all {
          text-transform: uppercase;
        }

        .th-details-sep {
          margin: 0 12px;
          color: #d1d5db;
        }

        .th-title {
          text-transform: uppercase;
          flex-grow: 1;
        }

        .th-price {
          width: 120px;
          text-align: right;
          margin-right: 28px;
        }

        .th-qty {
          width: 100px;
          text-align: center;
          margin-right: 20px;
        }

        .th-subtotal {
          width: 130px;
          text-align: right;
        }

        /* Item Cards List */
        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cart-item-card {
          background-color: #ffffff;
          border: 1px solid #ebebeb;
          padding: 20px 20px 14px 20px;
          transition: box-shadow 0.15s ease;
        }

        .cart-item-card:hover {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        }

        .cart-item-main-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .item-checkbox-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: flex-start;
          margin-top: 10px;
          flex-shrink: 0;
        }

        .item-thumbnail-box {
          position: relative;
          width: 90px;
          height: 114px;
          background-color: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .item-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .item-thumb-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
          padding: 3px 8px;
          border-radius: 2px;
          text-transform: uppercase;
          line-height: 1.2;
        }

        .item-info-col {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }

        .item-category-tag {
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #71717a;
          margin-bottom: 4px;
        }

        .item-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16.5px;
          font-weight: 700;
          line-height: 1.28;
          color: #111827;
          margin: 0 0 6px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-sku {
          font-size: 10.5px;
          color: #71717a;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .item-variant-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #4b5563;
        }

        .color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.15);
          display: inline-block;
        }

        .variant-sep {
          color: #d1d5db;
        }

        /* Price Col */
        .item-price-col {
          width: 120px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-price-current {
          font-size: 16px;
          font-weight: 800;
          color: #111827;
        }

        .item-price-original {
          font-size: 12px;
          color: #9ca3af;
          text-decoration: line-through;
          margin-top: 2px;
        }

        /* Quantity Col */
        .item-qty-col {
          width: 100px;
          display: flex;
          justify-content: center;
          flex-shrink: 0;
        }

        .qty-control-box {
          display: inline-flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          height: 32px;
          background-color: #ffffff;
        }

        .qty-btn {
          width: 28px;
          height: 30px;
          background-color: #f4f4f5;
          color: #111827;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .qty-btn:hover:not(:disabled) {
          background-color: #e4e4e7;
        }

        .qty-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .qty-value {
          width: 32px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: #111827;
        }

        /* Subtotal Col */
        .item-subtotal-col {
          width: 130px;
          text-align: right;
          flex-shrink: 0;
        }

        .item-subtotal-val {
          font-size: 18px;
          font-weight: 800;
          color: #000000;
        }

        /* Item Actions Row */
        .item-actions-row {
          border-top: 1px solid #f3f4f6;
          padding-top: 12px;
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 16px;
        }

        .item-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #6b7280;
          cursor: pointer;
          transition: color 0.15s;
        }

        .item-action-btn:hover {
          color: #111827;
        }

        .item-action-btn.btn-remove:hover {
          color: #ef4444;
        }

        .action-sep {
          color: #e5e7eb;
          font-size: 10px;
        }

        /* Bottom Actions Bar */
        .cart-bottom-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
        }

        .btn-continue-shopping {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 18px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          color: #111827;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.15s;
        }

        .btn-continue-shopping:hover {
          border-color: #000000;
        }

        .cart-bulk-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-refresh-cart {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          color: #111827;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-refresh-cart:hover {
          border-color: #000000;
        }

        .btn-clear-all {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #c2410c;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .btn-clear-all:hover {
          opacity: 0.8;
        }

        /* 5. Right Column: Order Summary Card */
        .order-summary-card {
          background-color: #ffffff;
          border: 1px solid #ebebeb;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .summary-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 20px 0;
        }

        .summary-rows {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 20px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 12.5px;
          color: #4b5563;
        }

        .summary-row .row-value.bold {
          font-weight: 800;
          color: #111827;
          font-size: 14px;
        }

        .vip-discount-row .row-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #b45309;
          font-weight: 600;
        }

        .info-icon {
          color: #b45309;
        }

        .vip-discount-row .discount {
          color: #b45309;
          font-weight: 700;
          font-size: 13.5px;
        }

        .shipping-label-group {
          display: flex;
          flex-direction: column;
        }

        .shipping-subtext {
          font-size: 9.5px;
          color: #9ca3af;
          letter-spacing: 0.4px;
          margin-top: 2px;
        }

        .shipping-free {
          color: #b45309;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.5px;
        }

        /* Total Highlight Box */
        .summary-total-box {
          background-color: #f4f4f5;
          padding: 16px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .total-left {
          display: flex;
          flex-direction: column;
        }

        .total-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #111827;
        }

        .total-vat {
          font-size: 9.5px;
          color: #6b7280;
          margin-top: 2px;
        }

        .total-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .total-amount {
          font-size: 22px;
          font-weight: 800;
          color: #000000;
          letter-spacing: -0.3px;
        }

        .total-savings {
          font-size: 10px;
          font-weight: 600;
          color: #b45309;
          margin-top: 2px;
        }

        /* Voucher Box */
        .voucher-box {
          background-color: #fafafa;
          border: 1px solid #f0f0f0;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
        }

        .voucher-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #111827;
          margin-bottom: 4px;
        }

        .voucher-desc {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .voucher-input-group {
          display: flex;
          height: 36px;
          margin-bottom: 10px;
        }

        .voucher-input {
          flex-grow: 1;
          border: 1px solid #d1d5db;
          border-right: none;
          padding: 0 12px;
          font-size: 11.5px;
          color: #111827;
          font-weight: 600;
          text-transform: uppercase;
        }

        .btn-apply-voucher {
          background-color: #000000;
          color: #ffffff;
          padding: 0 16px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-apply-voucher:hover {
          opacity: 0.85;
        }

        .voucher-applied-tag {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #15803d;
          font-weight: 600;
          margin-top: 4px;
        }

        .applied-left {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .btn-remove-voucher {
          font-size: 10px;
          font-weight: 700;
          color: #71717a;
          cursor: pointer;
          text-decoration: underline;
        }

        .btn-remove-voucher:hover {
          color: #ef4444;
        }

        /* Note Box */
        .note-box {
          background-color: #fafafa;
          border: 1px solid #f0f0f0;
          padding: 16px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
        }

        .note-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #111827;
          margin-bottom: 8px;
        }

        .note-input {
          height: 38px;
          border: 1px solid #e5e7eb;
          padding: 0 12px;
          font-size: 11.5px;
          color: #111827;
          background-color: #ffffff;
        }

        /* Action Buttons */
        .summary-action-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .btn-checkout {
          height: 46px;
          background-color: #000000;
          color: #ffffff;
          border: none;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-checkout:hover {
          opacity: 0.88;
        }

        .btn-contact-consult {
          height: 42px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          color: #111827;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-contact-consult:hover {
          border-color: #000000;
        }

        /* Summary Guarantees */
        .summary-guarantees {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid #f3f4f6;
        }

        .guarantee-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #6b7280;
        }

        .g-icon {
          color: #b45309;
        }

        /* 6. Similar Products Section */
        .similar-products-section {
          width: 100%;
          margin: 64px 0 48px 0;
          padding-top: 48px;
          border-top: 1px solid #f3f4f6;
        }

        .similar-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 32px;
          font-weight: 500;
          color: #18181b;
          margin: 0 0 24px 0;
          letter-spacing: -0.3px;
        }

        .similar-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          width: 100%;
        }

        .similar-card {
          background-color: #ffffff;
          border: 1px solid #ebebeb;
          border-radius: 12px;
          overflow: hidden;
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
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }

        .similar-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
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

        /* Responsive */
        @media (max-width: 1024px) {
          .cart-layout-grid {
            grid-template-columns: 1fr;
          }
          .similar-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .cart-table-header {
            display: none;
          }
          .cart-item-main-row {
            flex-wrap: wrap;
          }
          .similar-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

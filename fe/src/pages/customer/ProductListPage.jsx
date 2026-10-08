import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, ChevronLeft, ChevronRight, SlidersHorizontal, Tag, Folder, ShoppingBag, ChevronDown, Check } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { productService } from '../../services/productService';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const PRICE_RANGES = [
  { id: 'under_1m', label: 'Dưới 1.000.000đ', min: 0, max: 1000000 },
  { id: '1m_2.5m', label: '1.000.000đ - 2.500.000đ', min: 1000000, max: 2500000 },
  { id: '2.5m_5m', label: '2.500.000đ - 5.000.000đ', min: 2500000, max: 5000000 },
  { id: 'above_5m', label: 'Trên 5.000.000đ', min: 5000000, max: null },
];

export default function ProductListPage({ onOpenAISearch }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [metaTotal, setMetaTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Draft Filter state (UI selection before clicking Apply)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');
  const [selectedBrands, setSelectedBrands] = useState(
    searchParams.get('brand_ids')
      ? searchParams.get('brand_ids').split(',')
      : searchParams.get('brand_id')
      ? [searchParams.get('brand_id')]
      : []
  );
  const [selectedSize, setSelectedSize] = useState(searchParams.get('size') || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState(searchParams.get('price_range') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  // Applied filter state (filters sent to backend query, updated when Apply or Clear is clicked)
  const [appliedFilters, setAppliedFilters] = useState({
    category_id: searchParams.get('category_id') || '',
    brand_ids: searchParams.get('brand_ids')
      ? searchParams.get('brand_ids').split(',')
      : searchParams.get('brand_id')
      ? [searchParams.get('brand_id')]
      : [],
    size: searchParams.get('size') || '',
    price_range: searchParams.get('price_range') || '',
  });

  // Load Meta (Categories & Brands)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const metaRes = await productService.getMeta();
        if (metaRes.status && metaRes.data) {
          setCategories(metaRes.data.categories || []);
          setBrands(metaRes.data.brands || []);
          setMetaTotal(metaRes.data.totalProducts || 0);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục & thương hiệu:', err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch Products based on page & applied filters & sort
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const currentPriceRange = PRICE_RANGES.find((r) => r.id === appliedFilters.price_range);

      const res = await productService.getProducts({
        page,
        limit: 12, // 12 sản phẩm / trang
        category_id: appliedFilters.category_id || undefined,
        brand_ids: appliedFilters.brand_ids.length > 0 ? appliedFilters.brand_ids.join(',') : undefined,
        size: appliedFilters.size || undefined,
        min_price: currentPriceRange ? currentPriceRange.min : undefined,
        max_price: currentPriceRange && currentPriceRange.max ? currentPriceRange.max : undefined,
        sort: sortBy || undefined,
      });

      const responseData = res.data || res;
      const items = responseData.products || [];
      const pagination = responseData.pagination || { totalPages: 1, total: items.length };

      setProducts(items);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || items.length);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle draft selection changes
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
  };

  const handleSizeToggle = (size) => {
    setSelectedSize((prev) => (prev === size ? '' : size));
  };

  const handleBrandToggle = (brandId) => {
    const bIdStr = String(brandId);
    setSelectedBrands((prev) => {
      if (prev.includes(bIdStr)) {
        return prev.filter((id) => id !== bIdStr);
      } else {
        return [...prev, bIdStr];
      }
    });
  };

  const handlePriceRangeToggle = (rangeId) => {
    setSelectedPriceRange((prev) => (prev === rangeId ? '' : rangeId));
  };

  // Explicitly apply filters only when user clicks "ÁP DỤNG BỘ LỌC"
  const handleApplyFilters = () => {
    setAppliedFilters({
      category_id: selectedCategory,
      brand_ids: selectedBrands,
      size: selectedSize,
      price_range: selectedPriceRange,
    });
    setPage(1);
  };

  // Reset filters
  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedBrands([]);
    setSelectedSize('');
    setSelectedPriceRange('');
    setAppliedFilters({
      category_id: '',
      brand_ids: [],
      size: '',
      price_range: '',
    });
    setSortBy('newest');
    setPage(1);
  };

  return (
    <div className="product-list-page">
      {/* 0. Breadcrumbs Bar (Trang chủ > Danh mục) */}
      <div className="catalog-breadcrumb-bar">
        <div className="container catalog-breadcrumb-content">
          <Link to="/" className="bc-link">TRANG CHỦ</Link>
          <span className="bc-sep">&gt;</span>
          <span className="bc-current">DANH MỤC</span>
        </div>
      </div>

      {/* 1. Header Banner */}
      <section className="catalog-banner">
        <div className="container banner-inner">
          <span className="banner-subtext">YOUTHFASHION COLLECTION</span>
          <h1 className="banner-title font-serif">Tất Cả Sản Phẩm</h1>
          <p className="banner-desc">
            Khám phá tuyển tập trang phục thời thượng, may đo tỉ mỉ mang phong cách trẻ trung và thanh lịch.
          </p>
        </div>
      </section>

      {/* 2. Main Catalog Grid & Sidebar */}
      <div className="container catalog-body">
        {/* Left Sidebar Filter */}
        <aside className="catalog-sidebar">
          {/* 1. DANH MỤC SẢN PHẨM */}
          <div className="filter-section">
            <h3 className="filter-section-title">DANH MỤC SẢN PHẨM</h3>
            <div className="filter-title-line"></div>
            <ul className="category-filter-list">
              <li>
                <button
                  type="button"
                  className={`category-item-row ${selectedCategory === '' ? 'active' : ''}`}
                  onClick={() => handleCategorySelect('')}
                >
                  <span className="cat-name">Tất cả</span>
                  <span className="cat-count">({metaTotal || totalItems})</span>
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.category_id}>
                  <button
                    type="button"
                    className={`category-item-row ${String(selectedCategory) === String(cat.category_id) ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(cat.category_id)}
                  >
                    <span className="cat-name">{cat.category_name}</span>
                    <span className="cat-count">({cat.product_count ?? 0})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. KÍCH CỠ */}
          <div className="filter-section">
            <h3 className="filter-section-title">KÍCH CỠ</h3>
            <div className="filter-title-line"></div>
            <div className="sizes-grid">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`size-grid-btn ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => handleSizeToggle(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* 3. THƯƠNG HIỆU */}
          <div className="filter-section">
            <h3 className="filter-section-title">THƯƠNG HIỆU</h3>
            <div className="filter-title-line"></div>
            <div className="checkbox-filter-list">
              {brands.map((b) => {
                const isChecked = selectedBrands.includes(String(b.brand_id));
                return (
                  <label
                    key={b.brand_id}
                    className="custom-checkbox-row"
                    onClick={(e) => {
                      e.preventDefault();
                      handleBrandToggle(b.brand_id);
                    }}
                  >
                    <div className={`custom-checkbox-box ${isChecked ? 'checked' : ''}`}>
                      {isChecked && <Check size={11} strokeWidth={3.5} color="#ffffff" />}
                    </div>
                    <span className={`custom-checkbox-label ${isChecked ? 'active' : ''}`}>
                      {b.brand_name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4. MỨC GIÁ */}
          <div className="filter-section">
            <h3 className="filter-section-title">MỨC GIÁ</h3>
            <div className="filter-title-line"></div>
            <div className="checkbox-filter-list">
              {PRICE_RANGES.map((range) => {
                const isChecked = selectedPriceRange === range.id;
                return (
                  <label
                    key={range.id}
                    className="custom-checkbox-row"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePriceRangeToggle(range.id);
                    }}
                  >
                    <div className={`custom-checkbox-box ${isChecked ? 'checked' : ''}`}>
                      {isChecked && <Check size={11} strokeWidth={3.5} color="#ffffff" />}
                    </div>
                    <span className={`custom-checkbox-label ${isChecked ? 'active' : ''}`}>
                      {range.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 5. ACTION BUTTONS */}
          <div className="sidebar-action-buttons">
            <button type="button" className="btn-apply-filters" onClick={handleApplyFilters}>
              ÁP DỤNG BỘ LỌC
            </button>
            <button type="button" className="btn-reset-filters" onClick={handleClearFilters}>
              XÓA BỘ LỌC
            </button>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="catalog-content">
          {/* Top Bar Status & Sort */}
          <div className="catalog-topbar">
            <div className="result-count">
              Hiển thị <strong>{products.length}</strong> trên tổng số <strong>{totalItems}</strong> sản phẩm
              {appliedFilters.category_id && categories.find((c) => String(c.category_id) === String(appliedFilters.category_id)) && (
                <span className="active-tag-pill">
                  Danh mục: {categories.find((c) => String(c.category_id) === String(appliedFilters.category_id))?.category_name}
                </span>
              )}
              {appliedFilters.size && (
                <span className="active-tag-pill">
                  Size: {appliedFilters.size}
                </span>
              )}
            </div>

            <div className="sort-group">
              <span className="sort-label">SẮP XẾP:</span>
              <div className="sort-select-wrapper">
                <select
                  id="catalog-sort-select"
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="name_asc">Tên: A - Z</option>
                  <option value="name_desc">Tên: Z - A</option>
                </select>
                <ChevronDown size={14} className="sort-caret" />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="loading-grid">
              <div className="spinner"></div>
              <p>Đang tải dữ liệu sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-products-box">
              <ShoppingBag size={48} strokeWidth={1} color="#9ca3af" />
              <h3 className="empty-title">Không tìm thấy sản phẩm nào</h3>
              <p className="empty-desc">Thử thay đổi từ khóa hoặc lựa chọn bộ lọc khác.</p>
              <button className="btn-black" onClick={handleClearFilters}>
                Xem tất cả sản phẩm
              </button>
            </div>
          ) : (
            <div className="products-grid-4">
              {products.map((p) => {
                const primaryImg = p.images?.find((i) => i.is_primary)?.image_url || p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
                const priceVal = p.variants?.[0]?.price ? Number(p.variants[0].price) : 0;
                const formattedProduct = {
                  id: p.product_id,
                  name: p.product_name,
                  price: priceVal > 0 ? priceVal.toLocaleString('vi-VN') + 'đ' : 'Liên hệ',
                  tag: 'MỚI',
                  image: primaryImg,
                };
                return <ProductCard key={p.product_id} product={formattedProduct} />;
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <button
                className="page-nav-btn"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={16} /> Trước
              </button>

              <div className="page-numbers-group">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    className={`page-number-btn ${pNum === page ? 'active' : ''}`}
                    onClick={() => setPage(pNum)}
                  >
                    {pNum}
                  </button>
                ))}
              </div>

              <button
                className="page-nav-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Sau <ChevronRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .product-list-page {
          background-color: #faf9f6;
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* 0. Breadcrumbs Bar (Trang chủ > Danh mục) */
        .catalog-breadcrumb-bar {
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 14px 0;
        }

        .catalog-breadcrumb-content {
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

        .catalog-banner {
          background-color: #f4f3ee;
          border-bottom: 1px solid #eae8e1;
          padding: 48px 0;
          margin-bottom: 32px;
          text-align: center;
        }

        .banner-subtext {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2.5px;
          color: #78716c;
          display: block;
          margin-bottom: 8px;
        }

        .banner-title {
          font-size: 38px;
          color: #111827;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .banner-desc {
          font-size: 14px;
          color: #6b7280;
          max-width: 540px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .catalog-body {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 36px;
        }

        .catalog-sidebar {
          background: #ffffff;
          border: 1px solid #eae8e1;
          border-radius: 4px;
          padding: 24px 20px;
          align-self: flex-start;
          display: flex;
          flex-direction: column;
          gap: 28px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .filter-section {
          display: flex;
          flex-direction: column;
        }

        .filter-section-title {
          font-family: var(--font-sans), -apple-system, BlinkMacSystemFont, sans-serif !important;
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #000000;
          margin: 0;
          text-transform: uppercase;
          line-height: 1.2;
        }

        .filter-title-line {
          height: 1.5px;
          background-color: #222222;
          margin-top: 8px;
          margin-bottom: 16px;
          width: 100%;
        }

        /* 1. Category list */
        .category-filter-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
        }

        .category-item-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: none;
          border: none;
          padding: 4px 0;
          font-size: 13px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .category-item-row:hover {
          color: #111827;
        }

        .category-item-row.active {
          font-weight: 700;
          color: #111827;
        }

        .category-item-row .cat-name {
          flex: 1;
        }

        .category-item-row .cat-count {
          color: #9ca3af;
          font-size: 12px;
          font-weight: 400;
          margin-left: 8px;
        }

        .category-item-row.active .cat-count {
          color: #6b7280;
          font-weight: 600;
        }

        /* 2. Sizes Grid */
        .sizes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .size-grid-btn {
          height: 38px;
          background: #fafafa;
          border: 1px solid #e5e7eb;
          border-radius: 2px;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .size-grid-btn:hover {
          border-color: #111827;
          color: #111827;
        }

        .size-grid-btn.active {
          background: #000000;
          color: #ffffff;
          border-color: #000000;
          font-weight: 700;
        }

        /* 3. Checkbox Filter Lists */
        .checkbox-filter-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 220px;
          overflow-y: auto;
        }

        .custom-checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }

        .custom-checkbox-box {
          width: 16px;
          height: 16px;
          border: 1.5px solid #d1d5db;
          border-radius: 2px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .custom-checkbox-box.checked {
          background: #000000;
          border-color: #000000;
        }

        .custom-checkbox-label {
          font-size: 13px;
          color: #4b5563;
          transition: color 0.15s;
        }

        .custom-checkbox-row:hover .custom-checkbox-label {
          color: #111827;
        }

        .custom-checkbox-label.active {
          color: #111827;
          font-weight: 500;
        }

        /* 4. Action Buttons */
        .sidebar-action-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }

        .btn-apply-filters {
          width: 100%;
          height: 44px;
          background: #000000;
          color: #ffffff;
          border: 1px solid #000000;
          border-radius: 2px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-apply-filters:hover {
          background: #262626;
        }

        .btn-reset-filters {
          width: 100%;
          height: 44px;
          background: #ffffff;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          border-radius: 2px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-reset-filters:hover {
          border-color: #111827;
          color: #111827;
        }

        .catalog-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .result-count {
          font-size: 13px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .result-count strong {
          color: #111827;
          font-weight: 700;
        }

        .active-tag-pill {
          background: #e5e7eb;
          color: #1f2937;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
          margin-left: 6px;
        }

        .sort-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sort-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          color: #6b7280;
          text-transform: uppercase;
        }

        .sort-select-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .sort-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background: transparent;
          border: none;
          border-bottom: 1px solid #d1d5db;
          border-radius: 0;
          padding: 3px 22px 3px 4px;
          font-size: 13px;
          font-weight: 500;
          color: #111827;
          cursor: pointer;
          outline: none;
          min-width: 120px;
          transition: border-color 0.2s;
        }

        .sort-select:hover,
        .sort-select:focus {
          border-bottom-color: #111827;
        }

        .sort-caret {
          position: absolute;
          right: 2px;
          pointer-events: none;
          color: #6b7280;
        }

        .products-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .loading-grid {
          padding: 60px;
          text-align: center;
          color: #6b7280;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #111827;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-products-box {
          background: #ffffff;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .empty-title {
          font-size: 18px;
          color: #111827;
          margin: 0;
        }

        .empty-desc {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 48px;
        }

        .page-nav-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 14px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-nav-btn:not(:disabled):hover {
          border-color: #111827;
          color: #111827;
        }

        .page-numbers-group {
          display: flex;
          gap: 6px;
        }

        .page-number-btn {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-number-btn:hover {
          border-color: #111827;
        }

        .page-number-btn.active {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }

        @media (max-width: 1024px) {
          .catalog-body {
            grid-template-columns: 1fr;
          }
          .products-grid-4 {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 640px) {
          .products-grid-4 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

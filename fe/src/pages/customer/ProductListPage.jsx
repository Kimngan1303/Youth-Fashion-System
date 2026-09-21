import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, ChevronLeft, ChevronRight, SlidersHorizontal, Tag, Folder, ShoppingBag } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { productService } from '../../services/productService';

export default function ProductListPage({ onOpenAISearch }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand_id') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  // Load Meta (Categories & Brands)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const metaRes = await productService.getMeta();
        if (metaRes.status && metaRes.data) {
          setCategories(metaRes.data.categories || []);
          setBrands(metaRes.data.brands || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục & thương hiệu:', err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch Products based on page & filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts({
        page,
        limit: 12, // 12 sản phẩm / trang -> với 36 sản phẩm sẽ ra đúng 3 trang
        category_id: selectedCategory || undefined,
        brand_id: selectedBrand || undefined,
        search: searchTerm || undefined,
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
  }, [page, selectedCategory, selectedBrand, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync state with URL params
  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleBrandChange = (bId) => {
    setSelectedBrand(bId);
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSearchTerm('');
    setSearchInput('');
    setPage(1);
  };

  return (
    <div className="product-list-page">
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
          <div className="filter-block">
            <div className="filter-header">
              <span className="filter-title font-serif">Bộ Lọc Tìm Kiếm</span>
              {(selectedCategory || selectedBrand || searchTerm) && (
                <button className="clear-filter-btn" onClick={handleClearFilters}>
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="sidebar-search-box">
              <input
                type="text"
                placeholder="Tìm tên sản phẩm..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <Search size={14} />
              </button>
            </form>

            {/* Category Filter List */}
            <div className="filter-group">
              <h4 className="group-label">
                <Folder size={14} /> Danh Mục ({categories.length})
              </h4>
              <ul className="filter-list">
                <li>
                  <button
                    className={`filter-item-btn ${selectedCategory === '' ? 'active' : ''}`}
                    onClick={() => handleCategoryChange('')}
                  >
                    Tất cả danh mục
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.category_id}>
                    <button
                      className={`filter-item-btn ${String(selectedCategory) === String(cat.category_id) ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(cat.category_id)}
                    >
                      {cat.category_name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Brand Filter List */}
            <div className="filter-group">
              <h4 className="group-label">
                <Tag size={14} /> Thương Hiệu ({brands.length})
              </h4>
              <ul className="filter-list">
                <li>
                  <button
                    className={`filter-item-btn ${selectedBrand === '' ? 'active' : ''}`}
                    onClick={() => handleBrandChange('')}
                  >
                    Tất cả thương hiệu
                  </button>
                </li>
                {brands.map((b) => (
                  <li key={b.brand_id}>
                    <button
                      className={`filter-item-btn ${String(selectedBrand) === String(b.brand_id) ? 'active' : ''}`}
                      onClick={() => handleBrandChange(b.brand_id)}
                    >
                      {b.brand_name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="catalog-content">
          {/* Top Bar Status & Total info */}
          <div className="catalog-topbar">
            <div className="result-count">
              Hiển thị <strong>{products.length}</strong> / <strong>{totalItems}</strong> sản phẩm
              {selectedCategory && categories.find(c => String(c.category_id) === String(selectedCategory)) && (
                <span className="active-tag-pill">
                  Danh mục: {categories.find(c => String(c.category_id) === String(selectedCategory))?.category_name}
                </span>
              )}
            </div>

            <div className="topbar-actions">
              {onOpenAISearch && (
                <button className="btn-ai-search" onClick={onOpenAISearch}>
                  <Search size={14} /> Tìm kiếm AI (Hình ảnh / Chữ)
                </button>
              )}
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
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          align-self: flex-start;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
        }

        .filter-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .clear-filter-btn {
          font-size: 11px;
          color: #ef4444;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }

        .sidebar-search-box {
          display: flex;
          align-items: center;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 6px 10px;
          margin-bottom: 24px;
        }

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 12.5px;
          width: 100%;
        }

        .search-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .filter-group {
          margin-bottom: 24px;
        }

        .group-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #374151;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .filter-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 280px;
          overflow-y: auto;
        }

        .filter-item-btn {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 13px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.15s;
        }

        .filter-item-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .filter-item-btn.active {
          background: #111827;
          color: #ffffff;
          font-weight: 600;
        }

        .catalog-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .result-count {
          font-size: 13px;
          color: #4b5563;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .active-tag-pill {
          background: #e5e7eb;
          color: #1f2937;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .btn-ai-search {
          background: #111827;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-ai-search:hover {
          background: #374151;
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

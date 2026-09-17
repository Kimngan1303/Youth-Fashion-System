import React from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const { wishlist, toggleWishlist } = useAuth();
  const isLiked = wishlist.includes(product.id);

  return (
    <div className="product-card">
      <div className="product-img-box">
        <img 
          src={product.image} 
          alt={product.name} 
          className="product-img"
        />

        {/* MỚI Badge */}
        <span className="product-tag">{product.tag || 'MỚI'}</span>

        {/* Favorite heart button */}
        <button 
          className={`favorite-btn ${isLiked ? 'liked' : ''}`}
          onClick={() => toggleWishlist(product.id)}
          title={isLiked ? 'Đã lưu' : 'Thêm vào yêu thích'}
        >
          <Heart size={15} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#111827'} />
        </button>
      </div>

      <div className="product-content">
        <h3 className="product-title font-serif">{product.name}</h3>
        <span className="product-price">{typeof product.price === 'number' ? product.price.toLocaleString('vi-VN') + 'đ' : product.price}</span>
      </div>

      <style>{`
        .product-card {
          background-color: transparent;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          cursor: pointer;
        }

        .product-img-box {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background-color: #f3f4f6;
          margin-bottom: 8px;
        }

        .product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .product-card:hover .product-img {
          transform: scale(1.04);
        }

        .product-tag {
          position: absolute;
          top: 10px;
          left: 10px;
          background-color: #000000;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          padding: 3px 7px;
          text-transform: uppercase;
        }

        .favorite-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s, transform 0.2s;
        }

        .favorite-btn:hover {
          background-color: #ffffff;
          transform: scale(1.1);
        }

        .product-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .product-title {
          font-size: 14px;
          color: #111827;
          font-weight: 500;
          line-height: 1.35;
          font-family: var(--font-serif);
          margin: 0;
        }

        .product-price {
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default ProductCard;

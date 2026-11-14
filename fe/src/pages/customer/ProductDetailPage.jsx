import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Heart, 
  ShoppingBag, 
  Share2, 
  ZoomIn, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Star, 
  Truck, 
  RotateCcw, 
  MessageSquare, 
  Ruler
} from 'lucide-react';
import { productService } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ProductCard from '../../components/ProductCard';
import { getColorHex, isLightColor } from '../../utils/colorUtils';

// Helper lấy danh sách tag đã chọn của đánh giá
const getReviewTags = (rev) => {
  if (Array.isArray(rev?.tags) && rev.tags.length > 0) return rev.tags;
  if (typeof rev?.tags === 'string' && rev.tags.trim()) {
    return rev.tags.split(',').map(s => s.trim()).filter(Boolean);
  }
  const knownTags = ['Chất liệu thượng hạng', 'Đường may tinh xảo', 'Chuẩn phom dáng', 'Đóng gói sang trọng'];
  if (typeof rev?.content === 'string') {
    const matched = knownTags.filter(t => rev.content.includes(t));
    if (matched.length > 0) return matched;
  }
  return [];
};

// Dữ liệu mẫu chuẩn xác theo đúng Figma khi ID trùng hoặc fallback sản phẩm chính
const FIGMA_COAT_DATA = {
  id: 'YF-COAT-CAMEL-01',
  product_name: 'Áo Măng Tô Belted Dạ Camel Cashmere',
  category_name: 'ÁO KHOÁC & MĂNG TÔ',
  brand_name: 'Youth Fashion Atelier',
  badge: 'BEST SELLER',
  collection: 'ATELIER COLLECTION SS25',
  price: 3450000,
  original_price: null,
  discount: null,
  rating: 5.0,
  reviews_count: 0,
  stock_alert: 'Chỉ còn 4 sản phẩm trong kho',
  colors: [
    { id: 'camel', name: 'Camel Tự Nhiên', hex: '#C19A6B', inStock: true },
    { id: 'black', name: 'Đen Tuyển', hex: '#1A1A1A', inStock: true },
    { id: 'charcoal', name: 'Xám Than', hex: '#525252', inStock: true },
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  images: [
    {
      id: 1,
      title: 'Góc chụp chính',
      url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200',
    },
    {
      id: 2,
      title: 'Góc chụp phố dạ dáng dài',
      url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200',
    },
    {
      id: 3,
      title: 'Chi tiết form dáng vai & cúc áo',
      url: 'https://images.unsplash.com/photo-1548624313-039e222d730b?auto=format&fit=crop&q=80&w=1200',
    },
    {
      id: 4,
      title: 'Kiểu dáng suông hiện đại',
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200',
    },
    {
      id: 5,
      title: 'Phối cùng lớp lót tơ tằm',
      url: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=1200',
    },
  ],
  description_heading: 'Tinh hoa may đo Haute Couture cho vẻ đẹp đương đại Á Đông',
  description_p1: 'Được phác thảo từ tinh thần phóng khoáng của những quý cô đại lộ Saint-Germain, mẫu áo Măng Tô Belted Camel Cashmere đại diện cho chuẩn mực may đo thủ công tinh hoa. Từng đường cắt được định hình chính xác trên cấu trúc giải phẫu học cơ thể phụ nữ Á Đông, giúp ôm trọn bờ vai nhưng vẫn giữ được độ rủ thanh thoát, mềm mại tự nhiên trong từng bước chuyển động.',
  craftsmanship_points: [
    {
      title: 'Chất liệu Cashmere tự nhiên cao cấp',
      desc: 'Tuyển chọn từ 85% Cashmere tơ mềm phối 15% Lụa Mulberry, mang lại trọng lượng nhẹ bất ngờ cùng khả năng giữ ấm và cản gió tuyệt hảo.'
    },
    {
      title: 'Lớp lót lụa tơ tằm dệt jacquard',
      desc: 'Mặt trong được may chìm lớp lót tơ tằm dệt họa tiết độc quyền của Atelier Youth Fashion, mềm mượt với làn da và không tĩnh điện vào mùa lạnh.'
    },
    {
      title: 'Khuy sừng tự nhiên chạm khắc laser',
      desc: 'Hàng khuy sừng bò nhập khẩu trực tiếp từ Ý, được gọt giũa và hoàn thiện thủ công với ánh sắc riêng biệt cho từng chiếc áo.'
    },
    {
      title: 'Đai thắt lưng tôn đường cong eo',
      desc: 'Thiết kế kèm đai vải đồng chất với khóa may kép chắc chắn, linh hoạt thắt gọn để tôn dáng hoặc thả suông tạo phong thái tự do, thanh lịch.'
    }
  ],
  reviews: []
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, wishlist, toggleWishlist, addToCart } = useAuth();
  const { showSuccess, showInfo } = useToast();

  const [product, setProduct] = useState(FIGMA_COAT_DATA);
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('camel');
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideTab, setSizeGuideTab] = useState('clothing');

  // Phân loại ngành hàng: Quần áo (clothing), Giày dép (shoes), Phụ kiện (accessory)
  const categoryType = React.useMemo(() => {
    const cat = String(product?.category_name || '').toLowerCase();
    const name = String(product?.product_name || '').toLowerCase();
    const fullText = `${cat} ${name}`;

    if (/giày|sandal|dép|sneaker|guốc|loafer|boot|cao gót/i.test(fullText)) {
      return 'shoes';
    }
    if (/túi|balo|mũ|nón|kính|thắt lưng|ví|khăn|phụ kiện|trang sức|dây chuyền|bông tai|vòng tay|cà vạt/i.test(fullText)) {
      return 'accessory';
    }
    return 'clothing';
  }, [product?.category_name, product?.product_name]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [reviewHelpfulMap, setReviewHelpfulMap] = useState({});

  const getProductReviews = useCallback(() => {
    try {
      const stored = localStorage.getItem('yf_product_reviews');
      const rawReviews = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(rawReviews)) return [];
      const allReviews = rawReviews.map(r => {
        if (!r) return r;
        const c = String(r.content || '').trim();
        const autoTexts = [
          'Chất lượng sản phẩm rất tuyệt vời, đúng kỳ vọng và phom dáng chuẩn!',
          'Chất lượng sản phẩm rất tuyệt vời, đúng với kỳ vọng và phom dáng chuẩn!'
        ];
        if (autoTexts.includes(c) || (Array.isArray(r.tags) && r.tags.length > 0 && c === r.tags.join(', '))) {
          return { ...r, content: '' };
        }
        return r;
      });

      const currentProdId = String(id || product?.id || 'YF-COAT-CAMEL-01').trim();
      const currentProdName = String(product?.product_name || '').toLowerCase().trim();

      // Lọc đánh giá thực tế của sản phẩm
      const matched = allReviews.filter(r => {
        if (!r) return false;
        const rProdId = String(r.product_id || '').trim();
        const rProdName = String(r.product_name || '').toLowerCase().trim();
        const isDefaultView = (!id || id === 'camel-coat' || id === 'default' || id === 'YF-COAT-CAMEL-01');
        if (isDefaultView) {
          return rProdId === 'YF-COAT-CAMEL-01' || rProdId === 'default' || rProdId === 'camel-coat' || !rProdId || (currentProdName && rProdName.includes(currentProdName));
        }
        return rProdId === currentProdId || (currentProdName && rProdName && (rProdName.includes(currentProdName) || currentProdName.includes(rProdName)));
      });
      return matched;
    } catch (e) {
      return [];
    }
  }, [id, product?.id, product?.product_name]);

  const [localReviews, setLocalReviews] = useState(() => getProductReviews());

  // Đồng bộ đánh giá theo thời gian thực (khi người dùng viết review từ mục Đơn hàng của Profile)
  useEffect(() => {
    const refreshReviews = () => {
      setLocalReviews(getProductReviews());
    };
    refreshReviews();

    window.addEventListener('yf_reviews_updated', refreshReviews);
    window.addEventListener('storage', refreshReviews);

    let bc = null;
    try {
      bc = new BroadcastChannel('yf_reviews_sync_channel');
      bc.onmessage = () => {
        refreshReviews();
      };
    } catch (e) {}

    return () => {
      window.removeEventListener('yf_reviews_updated', refreshReviews);
      window.removeEventListener('storage', refreshReviews);
      if (bc) bc.close();
    };
  }, [getProductReviews]);

  const location = useLocation();

  // Tự động cuộn đến mục Đánh Giá Thực Tế khi được điều hướng từ nút Đánh giá ở Đơn hàng
  useEffect(() => {
    if (window.location.hash === '#customer-reviews' || location.hash === '#customer-reviews') {
      const timer = setTimeout(() => {
        const el = document.getElementById('customer-reviews');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [location.hash, location.pathname]);

  const reviewsCount = localReviews.length;
  const averageRating = reviewsCount > 0
    ? (localReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewsCount).toFixed(1)
    : '5.0';
  const satisfiedPercent = reviewsCount > 0
    ? Math.round((localReviews.filter(r => (Number(r.rating) || 5) >= 4).length / reviewsCount) * 100)
    : 100;
  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);
  const [reviewFilterStar, setReviewFilterStar] = useState('all');

  // Fetch product detail from API if id provided
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const fetchProduct = async () => {
      if (!id || id === 'camel-coat' || id === 'default') {
        setProduct(FIGMA_COAT_DATA);
        return;
      }

      setLoading(true);
      try {
        const res = await productService.getProductById(id);
        const data = res.data || res;
        if (data) {
          // Merge API data with Figma design structure
          const imagesList = data.images && data.images.length > 0 
            ? data.images.map((img, idx) => ({
                id: img.image_id || idx,
                title: img.alt_text || `Góc chụp ${idx + 1}`,
                url: img.image_url,
              }))
            : FIGMA_COAT_DATA.images;

          const variantPrices = data.variants?.map(v => Number(v.price)).filter(p => p > 0) || [];
          const primaryPrice = variantPrices.length > 0 ? variantPrices[0] : (Number(data.price) || FIGMA_COAT_DATA.price);

          const cat = String(data.category?.category_name || '').toLowerCase();
          const name = String(data.product_name || '').toLowerCase();
          const fullText = `${cat} ${name}`;
          const isShoeProduct = /giày|sandal|dép|sneaker|guốc|loafer|boot|cao gót/i.test(fullText);
          const isAccessoryProduct = /túi|balo|mũ|nón|kính|thắt lưng|ví|khăn|phụ kiện|trang sức|dây chuyền|bông tai|vòng tay|cà vạt/i.test(fullText);

          const availSizes = data.variants?.map(v => v.size).filter(Boolean) || [];
          let uniqueSizes = [];
          if (isAccessoryProduct) {
            uniqueSizes = [];
          } else if (availSizes.length > 0) {
            uniqueSizes = Array.from(new Set(availSizes));
          } else if (isShoeProduct) {
            uniqueSizes = ['36', '37', '38', '39', '40', '41'];
          } else {
            uniqueSizes = FIGMA_COAT_DATA.sizes;
          }

          const availColors = data.variants?.map(v => v.color).filter(Boolean) || [];
          const uniqueColors = availColors.length > 0 
            ? Array.from(new Set(availColors)).map((cName, idx) => ({
                id: `col-${idx}`,
                name: cName,
                hex: getColorHex(cName),
                inStock: true
              }))
            : FIGMA_COAT_DATA.colors;

          setProduct({
            ...FIGMA_COAT_DATA,
            id: data.product_id || id,
            product_name: data.product_name || FIGMA_COAT_DATA.product_name,
            category_name: data.category?.category_name || FIGMA_COAT_DATA.category_name,
            brand_name: data.brand?.brand_name || FIGMA_COAT_DATA.brand_name,
            price: primaryPrice,
            original_price: null,
            discount: null,
            images: imagesList,
            sizes: uniqueSizes,
            colors: uniqueColors,
            rawVariants: data.variants || [],
            description_p1: data.description || FIGMA_COAT_DATA.description_p1,
          });

          // Lưu vào lịch sử sản phẩm vừa xem (Recently Viewed)
          try {
            const prodIdStr = String(data.product_id || id);
            const primaryImg = imagesList[0] || FIGMA_COAT_DATA.images[0];
            const stored = JSON.parse(localStorage.getItem('youthfashion_recently_viewed') || '[]');
            const updated = [
              {
                product_id: prodIdStr,
                product_name: data.product_name || FIGMA_COAT_DATA.product_name,
                category_name: data.category?.category_name || FIGMA_COAT_DATA.category_name,
                brand_name: data.brand?.brand_name || FIGMA_COAT_DATA.brand_name,
                price: primaryPrice,
                image_url: primaryImg,
              },
              ...stored.filter((p) => String(p.product_id) !== prodIdStr),
            ].slice(0, 10);
            localStorage.setItem('youthfashion_recently_viewed', JSON.stringify(updated));
          } catch (storageErr) {
            // Ignore localStorage quota errors
          }

          if (isAccessoryProduct) {
            setSelectedSize('');
          } else if (uniqueSizes.length > 0) {
            const rawSize = String(location.state?.preSelectedSize || '').replace(/size/i, '').trim();
            const matchedSize = rawSize ? uniqueSizes.find(s => String(s).toLowerCase().trim() === rawSize.toLowerCase()) : null;
            if (matchedSize) {
              setSelectedSize(matchedSize);
            } else {
              setSelectedSize(uniqueSizes[0]);
            }
          }

          if (uniqueColors.length > 0) {
            const rawColor = String(location.state?.preSelectedColor || '').replace(/màu|màu sắc/i, '').trim().toLowerCase();
            const matchedColor = rawColor ? uniqueColors.find(c => String(c.name || '').toLowerCase().trim() === rawColor) : null;
            if (matchedColor) {
              setSelectedColor(matchedColor.id);
            } else {
              setSelectedColor(uniqueColors[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('API getProductById fallback:', err.message);
        if (location.state?.productName) {
          try {
            const searchRes = await productService.getProducts({ search: location.state.productName });
            const list = searchRes.data?.products || searchRes.products || [];
            const matched = list.find(p => p.product_name.toLowerCase().includes(location.state.productName.toLowerCase()));
            if (matched && matched.product_id) {
              const fullDetail = await productService.getProductById(matched.product_id);
              const d = fullDetail?.data || fullDetail;
              if (d && d.product_name) {
                setProduct({
                  ...d,
                  images: d.images?.length > 0 ? d.images.map((img, idx) => ({ id: img.image_id || idx, url: img.image_url })) : FIGMA_COAT_DATA.images,
                  colors: d.variants?.length > 0 ? Array.from(new Set(d.variants.map(v => v.color).filter(Boolean))).map((cName, idx) => ({ id: `col-${idx}`, name: cName, hex: getColorHex(cName) })) : FIGMA_COAT_DATA.colors,
                  sizes: d.variants?.length > 0 ? Array.from(new Set(d.variants.map(v => v.size).filter(Boolean))) : FIGMA_COAT_DATA.sizes,
                });
                return;
              }
            }
          } catch (e) {}
        }
        setProduct(FIGMA_COAT_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Load Similar Products from MySQL / API (ưu tiên cùng category và vector AI)
  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        if (!id) return;
        // 1. Thử gọi API chuyên dụng tìm sản phẩm tương tự
        const res = await productService.getSimilarProducts(id, 4);
        const items = res.data?.products || res.products || res.data || [];
        if (Array.isArray(items) && items.length > 0) {
          const filtered = items.filter(p => String(p.product_id || p.id) !== String(id)).slice(0, 4);
          if (filtered.length > 0) {
            setSimilarProducts(filtered);
            return;
          }
        }
      } catch (err) {
        console.warn('Lỗi gọi API getSimilarProducts, fallback sang cùng danh mục:', err.message);
      }

      // 2. Fallback: Lấy theo category_id của sản phẩm hiện tại
      try {
        const catId = product?.category_id || product?.category?.category_id;
        const res = await productService.getProducts({ category_id: catId, limit: 6 });
        const items = res.data?.products || res.products || [];
        const filtered = items.filter(p => String(p.product_id || p.id) !== String(id)).slice(0, 4);
        if (filtered.length > 0) {
          setSimilarProducts(filtered);
        } else {
          // 3. Fallback lấy sản phẩm mới nhất
          const fallbackRes = await productService.getProducts({ limit: 6 });
          const fallbackItems = fallbackRes.data?.products || fallbackRes.products || [];
          setSimilarProducts(fallbackItems.filter(p => String(p.product_id || p.id) !== String(id)).slice(0, 4));
        }
      } catch (fallbackErr) {
        console.error('Lỗi khi tải sản phẩm tương tự:', fallbackErr);
      }
    };
    fetchSimilar();
  }, [id, product?.category_id]);

  const activeImage = product.images?.[activeImageIndex]?.url || product.images?.[0]?.url;
  const isWishlisted = Boolean(user && wishlist.some(item => (typeof item === 'object' ? (item.id === product.id || item.product_id === product.id) : item === product.id)));

  const currentColorObj = product.colors?.find(c => c.id === selectedColor) || product.colors?.[0];
  const matchedVariant = product.rawVariants?.find(v => 
    String(v.color || '').trim().toLowerCase() === String(currentColorObj?.name || '').trim().toLowerCase() &&
    (!selectedSize || String(v.size || '').trim().toUpperCase() === String(selectedSize || '').trim().toUpperCase())
  ) || product.rawVariants?.[0];

  const currentDisplayPrice = matchedVariant?.price ? Number(matchedVariant.price) : product.price;
  const currentStock = matchedVariant?.stock !== undefined ? Number(matchedVariant.stock) : (product.rawVariants?.length ? 0 : 50);
  const isOutOfStock = currentStock <= 0;

  const stockAlertText = isOutOfStock
    ? 'Hết hàng trong kho'
    : currentStock <= 5
      ? `Chỉ còn ${currentStock} sản phẩm trong kho`
      : `Còn ${currentStock} sản phẩm sẵn sàng giao ngay`;

  const stockDotColor = isOutOfStock ? '#EF4444' : currentStock <= 5 ? '#F59E0B' : '#10B981';

  // Tự động điều chỉnh số lượng chọn không vượt quá tồn kho thực tế
  useEffect(() => {
    if (currentStock <= 0) {
      setQuantity(1);
    } else if (quantity > currentStock) {
      setQuantity(currentStock);
    }
  }, [currentStock]);

  const handleToggleWishlist = () => {
    if (!user) {
      showInfo('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!');
      navigate('/login');
      return;
    }

    const res = toggleWishlist({
      id: product.id,
      product_id: product.id,
      name: product.product_name,
      title: product.product_name,
      price: product.price,
      originalPrice: product.original_price,
      image: activeImage,
      selectedSize,
      colorName: product.colors.find(c => c.id === selectedColor)?.name || 'Camel Tự Nhiên',
    });
    if (res?.wasAdded) {
      showSuccess('Đã thêm sản phẩm vào danh sách yêu thích!');
    } else {
      showInfo('Đã gỡ sản phẩm khỏi danh sách yêu thích.');
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      showInfo('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      navigate('/login');
      return;
    }

    if (isOutOfStock) {
      showError('Sản phẩm với phân loại kích thước/màu sắc này hiện đã hết hàng!');
      return;
    }

    if (quantity > currentStock) {
      showError(`Số lượng chọn vượt quá tồn kho (chỉ còn ${currentStock} sản phẩm)!`);
      return;
    }

    const sizeToAdd = categoryType === 'accessory' ? 'Tiêu chuẩn' : (selectedSize || product.sizes?.[0] || 'Tiêu chuẩn');

    addToCart(
      {
        id: product.id,
        product_id: product.id,
        variant_id: matchedVariant?.variant_id,
        title: product.product_name,
        name: product.product_name,
        price: currentDisplayPrice,
        originalPrice: null,
        stock: currentStock,
        image: activeImage,
        colorName: currentColorObj?.name || 'Mặc định',
        colorDot: currentColorObj?.hex || getColorHex(currentColorObj?.name || ''),
        badge: 'ATELIER',
        categoryTag: product.category_name,
      },
      sizeToAdd,
      quantity
    );

    if (categoryType === 'accessory') {
      showSuccess(`Đã thêm ${quantity} sản phẩm (${currentColorObj?.name || 'Camel'}) vào giỏ hàng!`);
    } else {
      showSuccess(`Đã thêm ${quantity} sản phẩm (${sizeToAdd} - ${currentColorObj?.name || 'Camel'}) vào giỏ hàng!`);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      showInfo('Vui lòng đăng nhập để mua hàng!');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (isOutOfStock) {
      showError('Sản phẩm với phân loại kích thước/màu sắc này hiện đã hết hàng!');
      return;
    }

    if (quantity > currentStock) {
      showError(`Số lượng chọn vượt quá tồn kho (chỉ còn ${currentStock} sản phẩm)!`);
      return;
    }

    const sizeToAdd = categoryType === 'accessory' ? 'Tiêu chuẩn' : (selectedSize || product.sizes?.[0] || 'Tiêu chuẩn');
    const unitPrice = currentDisplayPrice;

    const buyNowItem = {
      id: `${product.id}-${sizeToAdd}-${selectedColor}`,
      product_id: product.id,
      productId: product.id,
      variant_id: matchedVariant?.variant_id || null,
      sku: matchedVariant?.sku_code || 'SKU-001',
      title: product.product_name,
      product_name: product.product_name,
      name: product.product_name,
      price: unitPrice,
      originalPrice: null,
      stock: currentStock,
      image: activeImage,
      size: sizeToAdd,
      color: currentColorObj?.name || 'Mặc định',
      colorName: currentColorObj?.name || 'Mặc định',
      colorDot: currentColorObj?.hex || getColorHex(currentColorObj?.name || ''),
      quantity: Number(quantity) || 1,
      selected: true,
      isBuyNow: true,
    };

    try {
      sessionStorage.setItem('yf_buy_now_item', JSON.stringify(buyNowItem));
    } catch (e) {}

    navigate('/checkout', { state: { buyNowItem } });
  };

  const handleHelpfulClick = (reviewId) => {
    setReviewHelpfulMap(prev => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1
    }));
    showSuccess('Cảm ơn bạn đã gửi phản hồi hữu ích!');
  };

  const displayedReviews = React.useMemo(() => {
    return localReviews.slice(0, 6);
  }, [localReviews]);

  const filteredModalReviews = React.useMemo(() => {
    if (reviewFilterStar === 'all') return localReviews;
    return localReviews.filter(r => Number(r.rating) === Number(reviewFilterStar));
  }, [localReviews, reviewFilterStar]);


  return (
    <div className="product-detail-page">
      {/* 1. Breadcrumbs Nav (Figma Pixel Perfect Match) */}
      <section className="section-breadcrumb">
        <div className="container breadcrumb-container">
          <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <Link to="/" className="bc-link">TRANG CHỦ</Link>
            <span className="bc-arrow">&gt;</span>
            <Link to="/products" className="bc-link">DANH MỤC</Link>
            <span className="bc-arrow">&gt;</span>
            <span className="bc-category">{product.category_name}</span>
            <span className="bc-arrow">&gt;</span>
            <span className="bc-current">{product.product_name}</span>
          </nav>
        </div>
      </section>

      {/* 2. Main Product Showcase Section */}
      <section className="section-product-showcase">
        <div className="container showcase-container">
          {/* LEFT: Thumbnail Column + Large Showcase Image */}
          <div className="gallery-showcase-box">
            {/* Vertical 5-Thumbnail Bar */}
            <div className="thumbnails-column">
              {product.images?.map((img, index) => {
                const isActive = activeImageIndex === index;
                return (
                  <button
                    key={img.id || index}
                    type="button"
                    className={`thumb-button ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(index)}
                    title={img.title}
                  >
                    <img src={img.url} alt={img.title} className="thumb-img" />
                  </button>
                );
              })}
            </div>

            {/* Main Image Display Box */}
            <div className="main-image-display">
              <img 
                src={activeImage} 
                alt={product.product_name} 
                className="showcase-main-img" 
              />

              {/* Atelier Collection SS25 Pill Badge */}
              <div className="collection-badge">
                <span className="collection-badge-text">{product.collection}</span>
              </div>

              {/* Zoom Button with Blur Backdrop */}
              <button
                type="button"
                className="btn-zoom-image"
                onClick={() => setIsZoomOpen(true)}
                title="Phóng to ảnh chất lượng cao"
                aria-label="Phóng to ảnh"
              >
                <ZoomIn size={15} color="#1A1C1A" />
              </button>
            </div>
          </div>

          {/* RIGHT: Product Detail & Purchase Controls */}
          <div className="product-summary-box">
            {/* Header info block */}
            <div className="summary-header-border">
              {/* Badge: BEST SELLER */}
              <div className="badge-best-seller">
                <span>{product.badge}</span>
              </div>

              {/* Title: Áo Măng Tô Belted Dạ Camel Cashmere */}
              <h1 className="product-main-title font-serif">
                {product.product_name}
              </h1>

              {/* Stars & Reviews link */}
              <div className="rating-review-row">
                <div className="stars-group">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={12} 
                      fill={star <= Math.round(Number(averageRating)) ? "#F59E0B" : "none"} 
                      color="#F59E0B" 
                    />
                  ))}
                </div>
                <span className="rating-score">{averageRating}</span>
                <a 
                  href="#customer-reviews" 
                  className="reviews-count-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('customer-reviews')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  ({reviewsCount} đánh giá)
                </a>
              </div>

              {/* Price row */}
              <div className="price-container-row">
                <span className="current-price font-serif">
                  {currentDisplayPrice?.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            {/* Selection form block */}
            <div className="product-controls-wrapper">
              {/* 1. MÀU SẮC */}
              <div className="control-group">
                <div className="control-label-row">
                  <span className="label-title">
                    MÀU SẮC: <strong>{product.colors.find(c => c.id === selectedColor)?.name}</strong>
                  </span>
                  <span className="label-subtext">
                    {product.colors.length} Màu sắc sẵn có
                  </span>
                </div>
                <div className="color-swatches-row">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor === color.id;
                    const isLight = isLightColor(color.hex);
                    return (
                      <button
                        key={color.id}
                        type="button"
                        className={`color-swatch-btn ${isSelected ? 'selected' : ''}`}
                        style={{
                          backgroundColor: color.hex,
                          border: isLight ? '1.5px solid #D1D5DB' : '1px solid transparent',
                        }}
                        onClick={() => setSelectedColor(color.id)}
                        title={color.name}
                      >
                        {isSelected && (
                          <Check
                            size={13}
                            color={isLight ? '#111111' : '#FFFFFF'}
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. CHỌN KÍCH CỠ (Chỉ áp dụng cho Quần áo & Giày dép, Phụ kiện không cần size) */}
              {categoryType !== 'accessory' && product.sizes && product.sizes.length > 0 && (
                <div className="control-group">
                  <div className="control-label-row">
                    <span className="label-title">
                      CHỌN KÍCH CỠ: <strong>{selectedSize}</strong>
                    </span>
                    <button 
                      type="button" 
                      className="btn-size-guide"
                      onClick={() => {
                        setSizeGuideTab(categoryType === 'shoes' ? 'shoes' : 'clothing');
                        setIsSizeGuideOpen(true);
                      }}
                    >
                      <Ruler size={13} />
                      <span>Bảng quy đổi kích cỡ</span>
                    </button>
                  </div>
                  <div className="size-buttons-row">
                    {product.sizes.map((sz) => {
                      const isSelected = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          className={`size-select-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedSize(sz)}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. SỐ LƯỢNG & TÌNH TRẠNG KHO */}
              <div className="quantity-stock-row">
                {/* Stepper */}
                <div className="quantity-stepper">
                  <button
                    type="button"
                    className="qty-step-btn"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                  >
                    -
                  </button>
                  <span className="qty-step-value">{isOutOfStock ? 0 : quantity}</span>
                  <button
                    type="button"
                    className="qty-step-btn"
                    onClick={() => setQuantity(prev => Math.min(currentStock, prev + 1))}
                    disabled={isOutOfStock || quantity >= currentStock}
                  >
                    +
                  </button>
                </div>

                {/* Stock alert pill */}
                <div className="stock-alert-pill">
                  <span className="stock-dot" style={{ backgroundColor: stockDotColor }}></span>
                  <span className="stock-text" style={{ color: isOutOfStock ? '#DC2626' : undefined }}>
                    {stockAlertText}
                  </span>
                </div>
              </div>

              {/* 4. ACTION BUTTONS */}
              <div className="action-buttons-group">
                {/* Row 1: Thêm vào giỏ hàng + Trái tim Yêu thích */}
                <div className="action-row-primary">
                  <button
                    type="button"
                    className="btn-add-to-cart"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    style={isOutOfStock ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#6B7280' } : undefined}
                  >
                    <ShoppingBag size={15} color="#FFFFFF" />
                    <span>{isOutOfStock ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG'}</span>
                  </button>

                  <button
                    type="button"
                    className={`btn-wishlist-toggle ${isWishlisted ? 'liked' : ''}`}
                    onClick={handleToggleWishlist}
                    title={isWishlisted ? 'Đã lưu trong yêu thích' : 'Thêm vào yêu thích'}
                  >
                    <Heart 
                      size={18} 
                      color={isWishlisted ? '#EF4444' : '#1A1C1A'} 
                      fill={isWishlisted ? '#EF4444' : 'none'} 
                    />
                  </button>
                </div>

                {/* Row 2: Mua ngay */}
                <button
                  type="button"
                  className="btn-buy-now"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  style={isOutOfStock ? { opacity: 0.6, cursor: 'not-allowed', borderColor: '#D1D5DB', color: '#9CA3AF' } : undefined}
                >
                  {isOutOfStock ? 'TẠM HẾT HÀNG' : 'MUA NGAY'}
                </button>

                {/* Row 3: Liên hệ người bán */}
                <button
                  type="button"
                  className="btn-contact-seller"
                  onClick={() => navigate('/chat', {
                    state: {
                      initialProduct: {
                        id: product.id || product.product_id,
                        name: product.product_name || product.name,
                        price: product.price,
                        image: activeImage,
                        category: product.category_name,
                        sku: product.sku || `YF-${product.id || product.product_id || 'PROD'}`,
                        description: product.description || product.short_description || 'Thiết kế thời trang cao cấp, chất liệu cao cấp và kiểu dáng hiện đại từ YOUTH FASHION.',
                      }
                    }
                  })}
                >
                  <MessageSquare size={15} color="#1A1C1A" />
                  <span>LIÊN HỆ NGƯỜI BÁN</span>
                </button>
              </div>

              {/* 5. DỊCH VỤ & CHÍNH SÁCH ĐẢM BẢO */}
              <div className="policy-guarantee-card">
                <div className="policy-item">
                  <Truck size={17} className="policy-icon" />
                  <div className="policy-text-box">
                    <h4 className="policy-title">MIỄN PHÍ GIAO HÀNG &amp; THỬ ĐỒ TẠI NHÀ</h4>
                    <p className="policy-desc">
                      Được kiểm tra và mặc thử trước khi thanh toán trên 63 tỉnh thành.
                    </p>
                  </div>
                </div>

                <div className="policy-item">
                  <RotateCcw size={16} className="policy-icon" />
                  <div className="policy-text-box">
                    <h4 className="policy-title">ĐỔI HÀNG TRONG 30 NGÀY</h4>
                    <p className="policy-desc">
                      Hỗ trợ đổi size và kiểu dáng tận nơi hoàn toàn miễn phí.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: Detailed Description & Craftsmanship ("MÔ TẢ CHI TIẾT") */}
      <section className="section-description-tabs">
        <div className="container description-container">
          {/* Tab Header Bar */}
          <div className="tab-nav-bar">
            <span className="tab-btn active">
              MÔ TẢ CHI TIẾT
            </span>
          </div>

          {/* Nội dung chi tiết */}
          <div className="tab-pane-content animate-fade-in">
            <div className="craft-gold-subtitle">
              <span className="gold-line"></span>
              <span className="gold-subtext">CẢM HỨNG THIẾT KẾ &amp; NGHỆ THUẬT CẮT MAY</span>
            </div>

            <h2 className="craft-main-title font-serif">
              {product.description_heading}
            </h2>

            <p className="craft-lead-paragraph">
              {product.description_p1}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Section: Customer Reviews ("FEEDBACK TỪ KHÁCH HÀNG") */}
      <section id="customer-reviews" className="section-customer-reviews">
        <div className="container reviews-container">
          {/* Header Row: Title on Left */}
          <div className="reviews-header-row">
            <div className="reviews-title-block">
              <span className="reviews-gold-sub">FEEDBACK TỪ KHÁCH HÀNG</span>
              <h2 className="reviews-title font-serif">Đánh Giá Thực Tế</h2>
            </div>
          </div>

          {/* Review Cards Grid */}
          <div className="reviews-cards-grid">
            {displayedReviews.length > 0 ? (
              displayedReviews.map((rev) => (
                <div key={rev.id} className="review-card">
                  <div className="review-card-top">
                    {/* Rating Stars & Date */}
                    <div className="review-stars-date">
                      <div className="card-stars">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />
                        ))}
                      </div>
                      <span className="review-date">{rev.date}</span>
                    </div>

                    {/* Reviewer Name */}
                    <div className="reviewer-info-row">
                      <strong className="reviewer-name">{rev.author}</strong>
                    </div>

                    {/* Purchased Variant Tag */}
                    {rev.variant && <span className="review-variant-tag">{rev.variant}</span>}

                    {/* Quick Tags đã tick chọn */}
                    {getReviewTags(rev).length > 0 && (
                      <div className="review-tags-chips">
                        {getReviewTags(rev).map((tag, tIdx) => (
                          <span key={tIdx} className="review-tag-badge">
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Review text */}
                    {(() => {
                      const c = String(rev?.content || '').trim();
                      const autoTexts = [
                        'Chất lượng sản phẩm rất tuyệt vời, đúng kỳ vọng và phom dáng chuẩn!',
                        'Chất lượng sản phẩm rất tuyệt vời, đúng với kỳ vọng và phom dáng chuẩn!'
                      ];
                      if (!c || autoTexts.includes(c) || (Array.isArray(rev.tags) && rev.tags.length > 0 && c === rev.tags.join(', '))) {
                        return null;
                      }
                      return <p className="review-content-text">"{c}"</p>;
                    })()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '48px 24px',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1.5px dashed #E5E7EB',
                margin: '10px 0'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Star size={28} fill="#D97706" color="#D97706" />
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '19px', color: '#1C1917', marginBottom: '8px' }}>
                  Chưa Có Đánh Giá Nào
                </h3>
                <p style={{ color: '#78716C', fontSize: '13.5px', maxWidth: '460px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Sản phẩm chưa có lượt đánh giá thực tế nào. Khi đơn hàng của bạn được giao thành công, hãy bấm nút <strong>"Viết Đánh Giá"</strong> trong mục Quản lý đơn hàng để chia sẻ trải nghiệm thực tế tại đây!
                </p>
              </div>
            )}
          </div>

          {/* Footer Action: Xem tất cả đánh giá (Mở Popup Modal khi có đánh giá) */}
          {localReviews.length > 0 && (
            <div className="reviews-footer-action">
              <button
                type="button"
                className="btn-view-all-reviews"
                onClick={() => setIsAllReviewsModalOpen(true)}
              >
                <span>XEM TẤT CẢ ĐÁNH GIÁ ({localReviews.length})</span>
                <span className="btn-arrow">&rarr;</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 5. Section: Similar Products ("SẢN PHẨM TƯƠNG TỰ") */}
      {similarProducts.length > 0 && (
        <section className="section-similar-products">
          <div className="container">
            <div className="similar-section-header">
              <span className="gold-subtext">BỘ SƯU TẬP LIÊN QUAN</span>
              <h2 className="similar-title font-serif">Sản Phẩm Tương Tự &amp; Phối Đồ</h2>
            </div>

            <div className="similar-products-grid">
              {similarProducts.map((p) => {
                const primaryImg = p.images?.find((i) => i.is_primary)?.image_url || p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
                const priceVal = p.variants?.[0]?.price ? Number(p.variants[0].price) : 0;
                const formattedProduct = {
                  id: p.product_id,
                  name: p.product_name,
                  price: priceVal > 0 ? priceVal.toLocaleString('vi-VN') + 'đ' : 'Liên hệ',
                  tag: p.tag && p.tag !== 'MỚI' ? p.tag : null,
                  image: primaryImg,
                };
                return (
                  <div 
                    key={p.product_id}
                    onClick={() => navigate(`/products/${p.product_id}`)}
                    className="similar-card-wrapper"
                  >
                    <ProductCard product={formattedProduct} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* MODAL 1: High-Resolution Zoom Lightbox */}
      {isZoomOpen && (
        <div className="lightbox-overlay" onClick={() => setIsZoomOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="btn-close-lightbox"
              onClick={() => setIsZoomOpen(false)}
              aria-label="Đóng"
            >
              <X size={24} />
            </button>

            <img 
              src={activeImage} 
              alt={product.product_name} 
              className="lightbox-full-img" 
            />

            <div className="lightbox-nav-buttons">
              <button
                type="button"
                className="btn-lightbox-nav"
                onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1))}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                className="btn-lightbox-nav"
                onClick={() => setActiveImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0))}
              >
                <ChevronRight size={28} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Bảng quy đổi kích cỡ (Quần áo XS-XXL, Giày dép 35-44) */}
      {isSizeGuideOpen && (
        <div className="size-modal-overlay" onClick={() => setIsSizeGuideOpen(false)}>
          <div className="size-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3 className="modal-title font-serif">
                {sizeGuideTab === 'shoes' ? 'Bảng Quy Đổi Kích Cỡ Giày Dép' : 'Bảng Quy Đổi Kích Cỡ Quần Áo'}
              </h3>
              <button 
                type="button" 
                className="btn-modal-close"
                onClick={() => setIsSizeGuideOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Thanh chuyển tab quy đổi kích cỡ */}
            <div className="size-modal-tabs">
              <button
                type="button"
                className={`size-modal-tab-btn ${sizeGuideTab === 'clothing' ? 'active' : ''}`}
                onClick={() => setSizeGuideTab('clothing')}
              >
                Quần Áo (XS - XXL)
              </button>
              <button
                type="button"
                className={`size-modal-tab-btn ${sizeGuideTab === 'shoes' ? 'active' : ''}`}
                onClick={() => setSizeGuideTab('shoes')}
              >
                Giày Dép (35 - 44)
              </button>
            </div>

            {sizeGuideTab === 'clothing' ? (
              <>
                <p className="modal-desc">
                  Thông số chuẩn phom dáng Á Đông đo trực tiếp trên sản phẩm thật (cm). Độ co giãn và sai số cho phép ± 1.5cm.
                </p>

                <div className="table-responsive">
                  <table className="size-guide-table">
                    <thead>
                      <tr>
                        <th>Kích cỡ</th>
                        <th>Rộng Vai</th>
                        <th>Vòng Ngực</th>
                        <th>Vòng Eo</th>
                        <th>Dài Áo / Váy</th>
                        <th>Chiều Cao</th>
                        <th>Cân Nặng Khuyên Dùng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: 'XS', shoulder: '37 cm', bust: '84 - 88 cm', waist: '64 - 68 cm', length: '108 cm', height: '1m50 - 1m55', weight: '42 - 47 kg' },
                        { size: 'S', shoulder: '38 cm', bust: '88 - 92 cm', waist: '68 - 72 cm', length: '110 cm', height: '1m55 - 1m60', weight: '48 - 53 kg' },
                        { size: 'M (Chuẩn)', match: 'M', shoulder: '39 cm', bust: '92 - 96 cm', waist: '72 - 76 cm', length: '112 cm', height: '1m60 - 1m65', weight: '54 - 58 kg' },
                        { size: 'L', shoulder: '40 cm', bust: '96 - 100 cm', waist: '76 - 80 cm', length: '114 cm', height: '1m65 - 1m70', weight: '59 - 64 kg' },
                        { size: 'XL', shoulder: '41.5 cm', bust: '100 - 106 cm', waist: '80 - 86 cm', length: '115 cm', height: '1m70 - 1m75', weight: '65 - 72 kg' },
                        { size: 'XXL', shoulder: '43 cm', bust: '106 - 112 cm', waist: '86 - 92 cm', length: '116 cm', height: '1m75+', weight: '72 - 80 kg' },
                      ].map((row, idx) => {
                        const isRowActive = selectedSize === (row.match || row.size);
                        return (
                          <tr key={idx} className={isRowActive ? 'active-row' : ''}>
                            <td><strong>{row.size}</strong></td>
                            <td>{row.shoulder}</td>
                            <td>{row.bust}</td>
                            <td>{row.waist}</td>
                            <td>{row.length}</td>
                            <td>{row.height}</td>
                            <td>{row.weight}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="modal-footer-note">
                  <span>* Nếu quý khách nằm giữa hai size hoặc cần mặc áo len dày bên trong, chúng tôi khuyên nên chọn tăng 1 size.</span>
                </div>
              </>
            ) : (
              <>
                <p className="modal-desc">
                  Bảng quy đổi kích cỡ chuẩn theo chiều dài bàn chân thực tế (cm). Áp dụng cho giày sneaker, sandal, giày tây và giày cao gót.
                </p>

                <div className="table-responsive">
                  <table className="size-guide-table">
                    <thead>
                      <tr>
                        <th>Size VN / EU</th>
                        <th>Dài Bàn Chân</th>
                        <th>Rộng Bàn Chân</th>
                        <th>Size US</th>
                        <th>Size UK</th>
                        <th>Gợi Ý Phù Hợp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: '35', length: '22.5 cm', width: '8.0 - 8.3 cm', us: '4.5', uk: '3.0', note: 'Bàn chân nhỏ nhắn' },
                        { size: '36', length: '23.0 cm', width: '8.3 - 8.5 cm', us: '5.5', uk: '3.5', note: 'Chuẩn nữ Á Đông' },
                        { size: '37', length: '23.5 cm', width: '8.5 - 8.8 cm', us: '6.0', uk: '4.0', note: 'Chuẩn nữ Á Đông' },
                        { size: '38', length: '24.0 cm', width: '8.8 - 9.0 cm', us: '7.0', uk: '5.0', note: 'Nữ cao / Nam nhỏ' },
                        { size: '39', length: '24.5 cm', width: '9.0 - 9.3 cm', us: '7.5', uk: '5.5', note: 'Unisex phổ thông' },
                        { size: '40', length: '25.0 cm', width: '9.3 - 9.5 cm', us: '8.5', uk: '6.5', note: 'Chuẩn nam giới' },
                        { size: '41', length: '25.5 cm', width: '9.5 - 9.8 cm', us: '9.0', uk: '7.0', note: 'Chuẩn nam giới' },
                        { size: '42', length: '26.0 cm', width: '9.8 - 10.0 cm', us: '9.5', uk: '7.5', note: 'Chuẩn nam giới' },
                        { size: '43', length: '26.5 cm', width: '10.0 - 10.3 cm', us: '10.0', uk: '8.0', note: 'Nam chân lớn' },
                        { size: '44', length: '27.0 cm', width: '10.3 - 10.6 cm', us: '10.5', uk: '8.5', note: 'Nam chân lớn' },
                      ].map((row, idx) => {
                        const isRowActive = selectedSize === row.size;
                        return (
                          <tr key={idx} className={isRowActive ? 'active-row' : ''}>
                            <td><strong>{row.size}</strong></td>
                            <td>{row.length}</td>
                            <td>{row.width}</td>
                            <td>{row.us}</td>
                            <td>{row.uk}</td>
                            <td>{row.note}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="modal-footer-note">
                  <span>* Hướng dẫn đo: Đặt bàn chân trần lên tờ giấy trắng, đánh dấu 2 điểm tại gót chân và ngón chân dài nhất. Đo khoảng cách (cm) và đối chiếu bảng trên. Nếu mu bàn chân dày hoặc bè ngang, khuyến nghị chọn tăng 1 size.</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {/* MODAL 4: Xem tất cả đánh giá từ khách hàng */}
      {isAllReviewsModalOpen && (
        <div className="size-modal-overlay" onClick={() => setIsAllReviewsModalOpen(false)}>
          <div className="size-modal-card all-reviews-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <div>
                <h3 className="modal-title font-serif">Tất Cả Đánh Giá Từ Khách Hàng</h3>
                <span className="modal-sub-count">{localReviews.length} đánh giá đã xác thực • {satisfiedPercent}% hài lòng</span>
              </div>
              <button 
                type="button" 
                className="btn-modal-close"
                onClick={() => setIsAllReviewsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Bộ lọc theo số sao */}
            <div className="size-modal-tabs">
              {[
                { val: 'all', label: `Tất Cả (${localReviews.length})` },
                { val: '5', label: `5 Sao (${localReviews.filter(r => Number(r.rating) === 5).length})` },
                { val: '4', label: `4 Sao (${localReviews.filter(r => Number(r.rating) === 4).length})` },
                { val: '3', label: `3 Sao (${localReviews.filter(r => Number(r.rating) === 3).length})` },
              ].map((tab) => (
                <button
                  key={tab.val}
                  type="button"
                  className={`size-modal-tab-btn ${reviewFilterStar === tab.val ? 'active' : ''}`}
                  onClick={() => setReviewFilterStar(tab.val)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Danh sách đánh giá chi tiết */}
            <div className="modal-reviews-list">
              {filteredModalReviews.map((rev) => (
                <div key={rev.id} className="modal-review-item">
                  <div className="modal-rev-header">
                    <div className="reviewer-info-row">
                      <strong className="reviewer-name">{rev.author}</strong>
                    </div>
                    <div className="modal-rev-meta">
                      <div className="card-stars">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={11} fill="#F59E0B" color="#F59E0B" />
                        ))}
                      </div>
                      <span className="review-date">{rev.date}</span>
                    </div>
                  </div>
                  <span className="review-variant-tag">{rev.variant}</span>
                  {getReviewTags(rev).length > 0 && (
                    <div className="review-tags-chips">
                      {getReviewTags(rev).map((tag, tIdx) => (
                        <span key={tIdx} className="review-tag-badge">
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {(() => {
                    const c = String(rev?.content || '').trim();
                    const autoTexts = [
                      'Chất lượng sản phẩm rất tuyệt vời, đúng kỳ vọng và phom dáng chuẩn!',
                      'Chất lượng sản phẩm rất tuyệt vời, đúng với kỳ vọng và phom dáng chuẩn!'
                    ];
                    if (!c || autoTexts.includes(c) || (Array.isArray(rev.tags) && rev.tags.length > 0 && c === rev.tags.join(', '))) {
                      return null;
                    }
                    return <p className="review-content-text">"{c}"</p>;
                  })()}
                </div>
              ))}
            </div>

            <div className="modal-footer-note">
              <span>* Tất cả đánh giá đều được xác thực từ các đơn hàng thực tế của khách hàng tại Youth Fashion.</span>
            </div>
          </div>
        </div>
      )}

      {/* STYLES: Figma Pixel Match CSS */}
      <style>{`
        /* 0. Base page */
        .product-detail-page {
          background-color: #FAF9F6;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1A1C1A;
          padding-bottom: 80px;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          box-sizing: border-box;
        }

        /* 1. Breadcrumb Section */
        .section-breadcrumb {
          background: #FAF9F6;
          border-bottom: 1px solid #E5E5E5;
          padding: 14px 0;
          box-sizing: border-box;
        }

        .breadcrumb-container {
          padding: 0 48px;
        }

        .breadcrumb-nav {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          font-family: var(--font-sans);
          font-size: 11px;
          line-height: 16px;
          text-transform: uppercase;
        }

        .bc-link {
          color: #737373;
          letter-spacing: 1.98px;
          text-decoration: none;
          transition: color 0.15s;
        }

        .bc-link:hover {
          color: #000000;
        }

        .bc-arrow {
          color: #A3A3A3;
          letter-spacing: 1.98px;
        }

        .bc-category {
          color: #737373;
          letter-spacing: 1.98px;
        }

        .bc-current {
          color: #000000;
          font-weight: 600;
          letter-spacing: 1.98px;
        }

        /* 2. Main Product Showcase Section */
        .section-product-showcase {
          padding: 32px 0 64px;
        }

        .showcase-container {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 40px;
        }

        /* LEFT: Gallery Box */
        .gallery-showcase-box {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 16px;
          width: 689.33px;
          flex-shrink: 0;
        }

        /* Thumbnails vertical column */
        .thumbnails-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 80px;
        }

        .thumb-button {
          box-sizing: border-box;
          width: 80px;
          height: 106.67px;
          padding: 0;
          border: 1px solid #E3E2E0;
          opacity: 0.75;
          background: #FFFFFF;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .thumb-button:hover {
          opacity: 1;
          border-color: #000000;
        }

        .thumb-button.active {
          border: 2px solid #000000;
          opacity: 1;
        }

        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Large Showcase Image */
        .main-image-display {
          position: relative;
          width: 593.33px;
          height: 791.09px;
          background: #F4F3F1;
          box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .showcase-main-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }

        .main-image-display:hover .showcase-main-img {
          transform: scale(1.02);
        }

        .collection-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: #000000;
          padding: 4px 12px;
          z-index: 2;
        }

        .collection-badge-text {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 10px;
          line-height: 15px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #FFFFFF;
        }

        .btn-zoom-image {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 33.5px;
          height: 34.5px;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(6px);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          z-index: 2;
          transition: all 0.2s ease;
        }

        .btn-zoom-image:hover {
          background: rgba(255, 255, 255, 0.98);
          transform: scale(1.08);
        }

        /* RIGHT: Summary Box */
        .product-summary-box {
          flex: 1;
          max-width: 478.67px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .summary-header-border {
          border-bottom: 1px solid #E3E2E0;
          padding-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .badge-best-seller {
          align-self: flex-start;
          background: #EFEEEB;
          padding: 2px 8px;
          border-radius: 2px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.1px;
          text-transform: uppercase;
          color: #444748;
        }

        .product-main-title {
          font-family: 'Playfair Display', serif;
          font-weight: 400;
          font-size: 38px;
          line-height: 46px;
          letter-spacing: -0.4px;
          color: #000000;
          margin: 4px 0 0;
        }

        .rating-review-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }

        .stars-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .rating-score {
          font-size: 12px;
          font-weight: 700;
          color: #1A1C1A;
          letter-spacing: 0.6px;
        }

        .reviews-count-link {
          font-size: 12px;
          color: #444748;
          text-decoration: underline;
          letter-spacing: 0.6px;
          cursor: pointer;
          transition: color 0.15s;
        }

        .reviews-count-link:hover {
          color: #000000;
        }

        .price-container-row {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-top: 12px;
        }

        .current-price {
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          font-size: 30px;
          line-height: 36px;
          color: #000000;
        }

        .original-price {
          font-size: 18px;
          line-height: 28px;
          text-decoration: line-through;
          color: #747878;
        }

        .discount-pill {
          background: rgba(186, 26, 26, 0.1);
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 700;
          line-height: 16px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #BA1A1A;
        }

        /* Controls wrapper */
        .product-controls-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .control-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          line-height: 16px;
          letter-spacing: 0.6px;
        }

        .label-title {
          text-transform: uppercase;
          color: #444748;
        }

        .label-title strong {
          color: #000000;
        }

        .label-subtext {
          color: #444748;
        }

        .btn-size-guide {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          text-decoration: underline;
          color: #000000;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }

        .btn-size-guide:hover {
          color: #775A00;
        }

        /* Color Swatches */
        .color-swatches-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .color-swatch-btn {
          width: 32px;
          height: 32px;
          border-radius: 12px;
          border: 1px solid #E3E2E0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .color-swatch-btn:hover {
          transform: scale(1.08);
        }

        .color-swatch-btn.selected {
          box-shadow: 0px 0px 0px 2px #FFFFFF, 0px 0px 0px 4px #000000;
          border: none;
        }

        /* Size Select Buttons */
        .size-buttons-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .size-select-btn {
          box-sizing: border-box;
          height: 38px;
          border: 1px solid #E3E2E0;
          background: #FFFFFF;
          color: #1A1C1A;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .size-select-btn:hover {
          border-color: #000000;
        }

        .size-select-btn.active {
          background: #000000;
          border: 1px solid #000000;
          color: #FFFFFF;
          font-weight: 600;
          box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
        }

        /* Quantity & Stock */
        .quantity-stock-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .quantity-stepper {
          box-sizing: border-box;
          width: 114px;
          height: 42px;
          background: #FFFFFF;
          border: 1px solid #E3E2E0;
          display: flex;
          align-items: center;
        }

        .qty-step-btn {
          width: 36px;
          height: 40px;
          border: none;
          background: none;
          font-size: 16px;
          color: #444748;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }

        .qty-step-btn:hover:not(:disabled) {
          color: #000000;
          background: #fafafa;
        }

        .qty-step-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .qty-step-value {
          width: 40px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #000000;
        }

        .stock-alert-pill {
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          border-radius: 4px;
        }

        .stock-dot {
          width: 8px;
          height: 8px;
          background: #F59E0B;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .stock-text {
          font-size: 11px;
          font-weight: 500;
          line-height: 16px;
          letter-spacing: 0.275px;
          color: #B45309;
        }

        /* Action Buttons */
        .action-buttons-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 8px;
        }

        .action-row-primary {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-add-to-cart {
          flex: 1;
          height: 48px;
          background: #000000;
          color: #FFFFFF;
          border: none;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1);
          transition: background 0.2s, transform 0.1s;
        }

        .btn-add-to-cart:hover {
          background: #27272a;
        }

        .btn-add-to-cart:active {
          transform: scale(0.99);
        }

        .btn-wishlist-toggle {
          width: 48px;
          height: 48px;
          border: 1px solid #E3E2E0;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-wishlist-toggle:hover {
          border-color: #000000;
          background: #fafafa;
        }

        .btn-wishlist-toggle.liked {
          border-color: #FCA5A5;
          background: #FEF2F2;
        }

        .btn-buy-now {
          width: 100%;
          height: 48px;
          border: 2px solid #000000;
          background: transparent;
          color: #000000;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .btn-buy-now:hover {
          background: #000000;
          color: #FFFFFF;
        }

        .btn-contact-seller {
          width: 100%;
          height: 46px;
          border: 1px solid #E3E2E0;
          background: #FFFFFF;
          color: #1A1C1A;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-contact-seller:hover {
          border-color: #000000;
          background: #fafafa;
        }

        /* Policy & Guarantee Card */
        .policy-guarantee-card {
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid #E3E2E0;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .policy-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .policy-icon {
          color: #000000;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .policy-text-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .policy-title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #000000;
          margin: 0;
        }

        .policy-desc {
          font-size: 12px;
          line-height: 16px;
          color: #444748;
          margin: 0;
        }

        /* 3. Section: Detailed Description & Craftsmanship */
        .section-description-tabs {
          background: #FFFFFF;
          border-top: 1px solid #E3E2E0;
          padding: 64px 0;
        }

        .tab-nav-bar {
          display: flex;
          align-items: center;
          gap: 32px;
          border-bottom: 1px solid #E3E2E0;
          margin-bottom: 40px;
        }

        .tab-btn {
          padding: 0 0 12px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: #71717a;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: #000000;
        }

        .tab-btn.active {
          color: #000000;
          border-bottom: 2px solid #000000;
        }

        .craft-gold-subtitle {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .gold-line {
          width: 32px;
          height: 1px;
          background: #775A00;
        }

        .gold-subtext {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #775A00;
        }

        .craft-main-title {
          font-family: 'Playfair Display', serif;
          font-weight: 400;
          font-size: 36px;
          line-height: 44px;
          color: #000000;
          margin: 0 0 16px;
          max-width: 900px;
        }

        .craft-lead-paragraph {
          font-size: 17px;
          font-weight: 300;
          line-height: 28px;
          letter-spacing: 0.45px;
          color: #1A1C1A;
          max-width: 1040px;
          margin: 0 0 36px;
        }

        .craftsmanship-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .craft-card {
          background: #FAF9F6;
          border: 1px solid #EAE8E1;
          padding: 24px;
          border-radius: 4px;
        }

        .craft-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .craft-card-title {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.4px;
          color: #000000;
          margin: 0;
          text-transform: uppercase;
        }

        .craft-card-desc {
          font-size: 13.5px;
          line-height: 1.6;
          color: #444748;
          margin: 0;
        }

        .care-guide-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
          max-width: 860px;
          margin-top: 24px;
        }

        .care-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }

        .shipping-perks-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-top: 28px;
        }

        .perk-box {
          background: #FAF9F6;
          padding: 24px;
          border: 1px solid #EAE8E1;
        }

        .perk-box h4 {
          font-size: 15px;
          font-weight: 700;
          margin: 12px 0 8px;
          color: #000000;
        }

        .perk-box p {
          font-size: 13px;
          line-height: 1.6;
          color: #4b5563;
          margin: 0;
        }

        /* 4. Section: Customer Reviews */
        .section-customer-reviews {
          background: #F4F3F1;
          border-top: 1px solid #E3E2E0;
          padding: 64px 0;
        }

        .reviews-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .reviews-title-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .reviews-gold-sub {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #775A00;
        }

        .reviews-title {
          font-family: 'Playfair Display', serif;
          font-weight: 400;
          font-size: 40px;
          line-height: 48px;
          letter-spacing: -0.4px;
          color: #000000;
          margin: 0;
        }

        .rating-summary-banner {
          display: flex;
          align-items: center;
          gap: 20px;
          background: #FFFFFF;
          border: 1px solid #E3E2E0;
          padding: 16px 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .rating-score-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-right: 18px;
          border-right: 1px solid #E3E2E0;
        }

        .banner-score {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: 32px;
          line-height: 36px;
          color: #000000;
        }

        .banner-stars {
          display: flex;
          gap: 2px;
          margin-top: 4px;
        }

        .rating-meta-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .meta-verified-text {
          font-size: 12px;
          font-weight: 600;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .meta-satisfaction {
          font-size: 12px;
          color: #444748;
        }

        .btn-write-review {
          background: #000000;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          padding: 10px 18px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
          margin-left: 8px;
        }

        .btn-write-review:hover {
          background: #27272a;
        }

        /* Review Cards Grid */
        .reviews-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .review-card {
          box-sizing: border-box;
          background: #FFFFFF;
          border: 1px solid #E3E2E0;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 240px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .review-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }

        .review-card-top {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .review-stars-date {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-stars {
          display: flex;
          gap: 2px;
        }

        .review-date {
          font-size: 11px;
          color: #888888;
        }

        .reviewer-info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .reviewer-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #000000;
        }

        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          color: #16a34a;
          background: #ecfdf5;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .review-variant-tag {
          font-size: 11.5px;
          color: #6b7280;
        }

        .review-tags-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 6px 0 2px;
        }

        .review-tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: #F9FAFB;
          color: #1F2937;
          border: 1px solid #E5E7EB;
          border-radius: 9999px;
          padding: 2.5px 9px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1px;
        }

        .review-content-text {
          font-size: 13px;
          line-height: 1.6;
          color: #374151;
          font-style: italic;
          margin: 6px 0 0;
        }

        .review-card-bottom {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #F3F4F6;
        }

        .btn-helpful {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }

        .btn-helpful:hover {
          color: #000000;
        }

        .reviews-footer-action {
          display: flex;
          justify-content: center;
          margin-top: 40px;
        }

        .btn-view-all-reviews {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 48px;
          background-color: transparent;
          border: 1px solid #111827;
          color: #111827;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .btn-view-all-reviews:hover {
          background-color: #111827;
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
        }

        .btn-view-all-reviews .btn-arrow {
          font-size: 15px;
          line-height: 1;
          transition: transform 0.2s ease;
        }

        .btn-view-all-reviews:hover .btn-arrow {
          transform: translateX(4px);
        }

        .all-reviews-modal-card {
          max-width: 820px;
        }

        .modal-sub-count {
          display: block;
          font-size: 12px;
          color: #6B7280;
          margin-top: 4px;
        }

        .modal-reviews-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 55vh;
          overflow-y: auto;
          padding-right: 8px;
          margin: 16px 0;
        }

        .modal-review-item {
          background: #FAF9F6;
          border: 1px solid #EAE8E1;
          border-radius: 10px;
          padding: 16px;
        }

        .modal-rev-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .modal-rev-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* 5. Section: Similar Products */
        .section-similar-products {
          padding: 64px 0 24px;
        }

        .similar-section-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .similar-title {
          font-size: 32px;
          color: #000000;
          margin: 6px 0 0;
        }

        .similar-products-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .similar-card-wrapper {
          cursor: pointer;
        }

        /* Lightbox Overlay */
        .lightbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .lightbox-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
        }

        .lightbox-full-img {
          max-width: 100%;
          max-height: 85vh;
          object-fit: contain;
          border-radius: 4px;
        }

        .btn-close-lightbox {
          position: absolute;
          top: -40px;
          right: 0;
          background: none;
          border: none;
          color: #FFFFFF;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-close-lightbox:hover {
          opacity: 0.7;
        }

        .lightbox-nav-buttons {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
          display: flex;
          justify-content: space-between;
          padding: 0 16px;
          pointer-events: none;
        }

        .btn-lightbox-nav {
          pointer-events: auto;
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
          border: none;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: background 0.2s;
        }

        .btn-lightbox-nav:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Size Guide & Review Modal */
        .size-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .size-modal-card {
          background: #FFFFFF;
          max-width: 820px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          position: relative;
        }

        .size-modal-tabs {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #E5E7EB;
          margin-bottom: 18px;
          padding-bottom: 12px;
        }

        .size-modal-tab-btn {
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #6B7280;
          background: #F3F4F6;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .size-modal-tab-btn:hover {
          color: #000000;
          background: #E5E7EB;
        }

        .size-modal-tab-btn.active {
          color: #FFFFFF;
          background: #111827;
          border-color: #111827;
        }

        .review-modal-card {
          max-width: 520px;
          border-radius: 16px;
        }

        .modal-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 16px;
          margin-bottom: 16px;
        }

        .modal-title {
          font-size: 22px;
          color: #111827;
          margin: 0;
        }

        .btn-modal-close {
          background: none;
          border: none;
          color: #6B7280;
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s, color 0.15s;
        }

        .btn-modal-close:hover {
          color: #000000;
          background: #F3F4F6;
        }

        .modal-desc {
          font-size: 13px;
          color: #6B7280;
          margin-bottom: 20px;
        }

        .table-responsive {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
        }

        .size-guide-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
          text-align: center;
        }

        .size-guide-table th {
          background: #F9FAFB;
          color: #111827;
          font-weight: 700;
          padding: 12px 10px;
          border: 1px solid #E5E7EB;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
        }

        .size-guide-table td {
          padding: 12px 10px;
          border: 1px solid #E5E7EB;
          color: #374151;
        }

        .size-guide-table tr.active-row td {
          background: #F3F4F6;
          font-weight: 700;
          color: #000000;
        }

        .modal-footer-note {
          margin-top: 16px;
          font-size: 12px;
          color: #71717A;
          font-style: italic;
        }

        /* Review Modal Form */
        .review-modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #374151;
        }

        .rating-select-stars {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .star-btn-pick {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px;
          transition: transform 0.1s;
        }

        .star-btn-pick:hover {
          transform: scale(1.15);
        }

        .rating-pick-text {
          font-size: 12px;
          color: #775A00;
          font-weight: 600;
          margin-left: 8px;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #D1D5DB;
          font-size: 13px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s;
        }

        .form-input:focus, .form-textarea:focus {
          border-color: #000000;
        }

        .btn-submit-review {
          background: #000000;
          color: #FFFFFF;
          padding: 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.2s;
        }

        .btn-submit-review:hover {
          background: #27272a;
        }

        /* Responsive Layouts */
        @media (max-width: 1080px) {
          .showcase-container {
            flex-direction: column;
            align-items: center;
          }
          .gallery-showcase-box {
            width: 100%;
            max-width: 593px;
          }
          .product-summary-box {
            max-width: 593px;
            width: 100%;
          }
          .reviews-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }
          .reviews-cards-grid {
            grid-template-columns: 1fr;
          }
          .craftsmanship-grid {
            grid-template-columns: 1fr;
          }
          .similar-products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .gallery-showcase-box {
            flex-direction: column-reverse;
          }
          .thumbnails-column {
            flex-direction: row;
            width: 100%;
            overflow-x: auto;
          }
          .thumb-button {
            width: 64px;
            height: 85px;
            flex-shrink: 0;
          }
          .main-image-display {
            width: 100%;
            height: 480px;
          }
          .rating-summary-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .rating-score-col {
            border-right: none;
            padding-right: 0;
            padding-bottom: 12px;
            border-bottom: 1px solid #E3E2E0;
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
          }
          .btn-write-review {
            margin-left: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

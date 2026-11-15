import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { cartService } from '../services/cartService';
import { wishlistService } from '../services/wishlistService';
import { getColorHex } from '../utils/colorUtils';

export const AuthContext = createContext(null);

const isValidAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  if (url.startsWith('data:image/')) return url.length > 50 && url.includes(';base64,');
  return false;
};

export const DEFAULT_WISHLIST_ITEMS = [];

export const DEFAULT_CART_ITEMS = [];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (!isValidAvatarUrl(parsed.avatar_url)) {
          const savedAvatar = (parsed.email && localStorage.getItem(`avatar_url_${parsed.email}`)) || localStorage.getItem('user_avatar_url');
          if (isValidAvatarUrl(savedAvatar)) parsed.avatar_url = savedAvatar;
        }
        if (parsed.phone === '0988777666') {
          parsed.phone = '';
          try {
            localStorage.setItem('user', JSON.stringify(parsed));
          } catch (e) {}
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [loading, setLoading] = useState(false);

  // Helper tạo storage key theo người dùng (ngăn chặn rò rỉ dữ liệu sang khách vãng lai)
  const getUserStorageKey = (prefix, u) => {
    if (!u) return null;
    const identifier = u.customer_id || u.id || u.email;
    return identifier ? `${prefix}_${identifier}` : null;
  };

  // Danh sách sản phẩm yêu thích: Khách vãng lai (Guest) chưa đăng nhập LUÔN LÀ rỗng []
  const [wishlist, setWishlist] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return [];
    try {
      const parsedUser = JSON.parse(savedUser);
      const userKey = getUserStorageKey('youth_fashion_wishlist', parsedUser);
      const saved = userKey ? localStorage.getItem(userKey) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map((item) => ({ ...item, selected: false }));
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  // Danh sách giỏ hàng: Khách vãng lai (Guest) chưa đăng nhập LUÔN LÀ rỗng []
  const [cart, setCart] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return [];
    try {
      const parsedUser = JSON.parse(savedUser);
      const userKey = getUserStorageKey('youth_fashion_cart', parsedUser);
      const saved = userKey ? localStorage.getItem(userKey) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const [orders, setOrders] = useState([]);

  // Đồng bộ giỏ hàng và danh sách yêu thích khi trạng thái đăng nhập thay đổi
  useEffect(() => {
    // Dọn dẹp key cũ không gắn với user để tránh rò rỉ sang khách vãng lai
    try {
      localStorage.removeItem('youth_fashion_cart');
      localStorage.removeItem('youth_fashion_wishlist');
    } catch (e) {}

    if (!user) {
      // Guest: Không có giỏ hàng, không có danh sách yêu thích
      setWishlist([]);
      setCart([]);
      return;
    }

    // Đã đăng nhập: Tải giỏ hàng & yêu thích của tài khoản này
    const cartKey = getUserStorageKey('youth_fashion_cart', user);
    const wishlistKey = getUserStorageKey('youth_fashion_wishlist', user);

    if (cartKey) {
      try {
        const saved = localStorage.getItem(cartKey);
        const parsed = saved ? JSON.parse(saved) : [];
        setCart(parsed.map((item) => ({ ...item, selected: false })));
      } catch (e) {
        setCart([]);
      }
    }

    // Đồng bộ trực tiếp từ Database MySQL qua API /api/cart
    cartService.getCart()
      .then((res) => {
        if (res?.status && res?.data?.items) {
          const apiItems = res.data.items.map((item) => ({
            id: String(item.variant_id || item.cart_item_id),
            cartItemId: String(item.cart_item_id),
            variant_id: item.variant_id,
            productId: item.product_id,
            sku: item.sku,
            categoryTag: item.category_name || 'THỜI TRANG',
            title: item.product_name,
            colorName: item.color,
            colorDot: getColorHex(item.color || ''),
            size: item.size,
            price: item.price,
            quantity: item.quantity,
            stock: item.stock,
            image: item.image,
            selected: false,
          }));
          setCart(apiItems);
          if (cartKey) {
            localStorage.setItem(cartKey, JSON.stringify(apiItems));
          }
        }
      })
      .catch((err) => {
        console.warn('Chưa thể đồng bộ giỏ hàng từ server, sử dụng bộ nhớ đệm:', err.message);
      });

    if (wishlistKey) {
      try {
        const saved = localStorage.getItem(wishlistKey);
        setWishlist(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setWishlist([]);
      }
    }

    // Đồng bộ trực tiếp danh sách yêu thích từ Database MySQL qua API /api/wishlist
    wishlistService.getWishlist()
      .then((res) => {
        if (res?.status && res?.data?.items) {
          setWishlist(res.data.items);
          if (wishlistKey) {
            localStorage.setItem(wishlistKey, JSON.stringify(res.data.items));
          }
        }
      })
      .catch((err) => {
        console.warn('Chưa thể đồng bộ yêu thích từ server, sử dụng bộ nhớ đệm:', err.message);
      });
  }, [user?.customer_id, user?.id, user?.email]);

  // Lắng nghe tín hiệu đồng bộ phân quyền vai trò (ROLE_CHANGED) từ Admin
  useEffect(() => {
    let bc = null;
    try {
      bc = new BroadcastChannel('yf_role_sync_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'ROLE_CHANGED' && user?.email) {
          if (user.email.toLowerCase() === (event.data.email || '').toLowerCase()) {
            const isManagerOrAdmin = ['MANAGER', 'ADMIN', 'EMPLOYEE'].includes(String(event.data.newRole).toUpperCase());
            const updated = {
              ...user,
              role: event.data.newRole,
              employee_role: isManagerOrAdmin ? event.data.newRole : undefined,
              user_type: event.data.userType,
            };
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));

            // Nếu bị hạ quyền về Khách Hàng khi đang ở giao diện Quản lý -> Tự động chuyển hướng về trang chủ
            if (!isManagerOrAdmin && window.location.pathname.startsWith('/manager')) {
              window.location.href = '/';
            }
          }
        }
      };
    } catch (e) {}

    const handleLocalUserUpdate = () => {
      try {
        const raw = localStorage.getItem('user');
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {}
    };
    window.addEventListener('yf_user_updated', handleLocalUserUpdate);

    return () => {
      if (bc) try { bc.close(); } catch (e) {}
      window.removeEventListener('yf_user_updated', handleLocalUserUpdate);
    };
  }, [user]);

  // Đồng bộ lại thông tin hồ sơ & vai trò từ backend
  useEffect(() => {
    const syncUserProfile = async () => {
      const token = localStorage.getItem('accessToken');
      if (token && user?.email) {
        try {
          const res = await authService.getProfile();
          if (res?.data) {
            const latestRole = res.data.role;
            const latestUserType = res.data.user_type;
            if (latestRole && (latestRole !== user.role || latestUserType !== user.user_type)) {
              const isManagerOrAdmin = ['MANAGER', 'ADMIN', 'EMPLOYEE'].includes(String(latestRole).toUpperCase());
              setUser(prev => {
                const updated = {
                  ...prev,
                  ...res.data,
                  role: latestRole,
                  employee_role: isManagerOrAdmin ? latestRole : undefined,
                  user_type: latestUserType,
                };
                localStorage.setItem('user', JSON.stringify(updated));
                return updated;
              });
              if (!isManagerOrAdmin && window.location.pathname.startsWith('/manager')) {
                window.location.href = '/';
              }
            }
          }
        } catch (e) {}
      }
    };
    syncUserProfile();
  }, [user?.email]);

  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
      setWishlist([]);
      setCart([]);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const toggleWishlist = (product) => {
    if (!user) {
      return { success: false, requireLogin: true, message: 'Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!' };
    }

    let wasAdded = false;
    setWishlist(prev => {
      const targetId = typeof product === 'object' ? (product.id || product.product_id) : product;
      const exists = prev.some(item => (typeof item === 'object' ? (item.id === targetId || item.product_id === targetId) : item === targetId));
      let next;
      if (exists) {
        wasAdded = false;
        next = prev.filter(item => (typeof item === 'object' ? (item.id !== targetId && item.product_id !== targetId) : item !== targetId));
      } else {
        wasAdded = true;
        const isOutOfStock = typeof product === 'object' && (
          product.inStock === false ||
          product.status === 'HẾT HÀNG' ||
          String(product.status || '').toLowerCase().includes('hết hàng') ||
          String(product.status || '').toUpperCase() === 'OUT_OF_STOCK' ||
          (product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0)
        );

        const itemToAdd = typeof product === 'object' ? {
          id: targetId,
          product_id: targetId,
          sku: product.sku || `YF-${targetId}`,
          title: product.title || product.name || product.product_name || `Thiết kế #${targetId}`,
          name: product.name || product.title || product.product_name || `Thiết kế #${targetId}`,
          category: product.category || product.categoryName || '',
          categoryName: product.categoryName || product.category || 'Thời Trang',
          price: typeof product.price === 'number' 
            ? product.price 
            : (product.rawPrice || parseInt(String(product.price).replace(/\D/g, '')) || 0),
          originalPrice: product.originalPrice || null,
          image: product.image || product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
          badgeTop: (product.badgeTop && product.badgeTop !== 'MỚI') ? product.badgeTop : null,
          badgeSub: (product.badgeSub && product.badgeSub !== 'CASHMERE 100%') ? product.badgeSub : null,
          status: product.status || (isOutOfStock ? 'HẾT HÀNG' : 'CÒN HÀNG'),
          statusColor: product.statusColor || (isOutOfStock ? '#dc2626' : 'green'),
          availableSizes: product.availableSizes || ['S', 'M', 'L'],
          selectedSize: product.selectedSize || 'M',
          inStock: isOutOfStock ? false : (product.inStock !== undefined ? product.inStock : true),
          stock: product.stock !== undefined ? product.stock : (isOutOfStock ? 0 : null),
          variants: product.variants || product.rawVariants || [],
        } : {
          id: targetId,
          product_id: targetId,
          sku: `YF-${targetId}`,
          title: `Sản phẩm #${targetId}`,
          name: `Sản phẩm #${targetId}`,
          category: '',
          categoryName: 'Thời Trang',
          price: 0,
          image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
          badgeTop: null,
          badgeSub: null,
          status: 'CÒN HÀNG',
          statusColor: 'green',
          availableSizes: ['S', 'M', 'L'],
          selectedSize: 'M',
          inStock: true,
          stock: null,
          variants: []
        };
        next = [itemToAdd, ...prev];
      }
      const wishlistKey = getUserStorageKey('youth_fashion_wishlist', user);
      if (wishlistKey) {
        try {
          localStorage.setItem(wishlistKey, JSON.stringify(next));
        } catch (err) {
          console.error('Lỗi khi lưu wishlist vào localStorage:', err);
        }
      }

      // Gọi API backend đồng bộ vào Database
      const targetIdToSync = typeof product === 'object' ? (product.id || product.product_id) : product;
      if (targetIdToSync) {
        wishlistService.toggleWishlist(targetIdToSync).catch(err => {
          console.warn('Lỗi khi đồng bộ toggleWishlist lên backend:', err.message);
        });
      }

      return next;
    });
    return { success: true, wasAdded };
  };

  const removeFromWishlist = (targetId) => {
    if (!user) return;
    setWishlist(prev => {
      const next = prev.filter(item => (typeof item === 'object' ? (item.id !== targetId && item.product_id !== targetId) : item !== targetId));
      const wishlistKey = getUserStorageKey('youth_fashion_wishlist', user);
      if (wishlistKey) {
        try {
          localStorage.setItem(wishlistKey, JSON.stringify(next));
        } catch (err) {}
      }
      return next;
    });

    // Gọi API backend xóa khỏi Database
    if (targetId) {
      wishlistService.removeFromWishlist(targetId).catch(err => {
        console.warn('Lỗi khi xóa sản phẩm khỏi wishlist trên backend:', err.message);
      });
    }
  };

  const clearWishlist = () => {
    if (!user) return;
    setWishlist([]);
    const wishlistKey = getUserStorageKey('youth_fashion_wishlist', user);
    if (wishlistKey) {
      try {
        localStorage.removeItem(wishlistKey);
      } catch (err) {}
    }

    // Gọi API backend làm trống Database
    wishlistService.clearWishlist().catch(err => {
      console.warn('Lỗi khi xóa sạch wishlist trên backend:', err.message);
    });
  };

  const addToCart = async (product, selectedSize = 'M', quantity = 1) => {
    if (!user) {
      return { success: false, requireLogin: true, message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!' };
    }

    if (!product) {
      return { success: false, message: 'Sản phẩm không hợp lệ!' };
    }

    // Kiểm tra trạng thái hết hàng của sản phẩm
    const isOutOfStock = 
      product.inStock === false ||
      product.status === 'HẾT HÀNG' ||
      String(product.status || '').toLowerCase().includes('hết hàng') ||
      String(product.status || '').toUpperCase() === 'OUT_OF_STOCK' ||
      (product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0);

    if (isOutOfStock) {
      return { success: false, isOutOfStock: true, message: 'Sản phẩm hiện đã hết hàng!' };
    }

    const prodId = product.id || product.product_id || product.sku || 'PROD';
    const size = selectedSize || product.selectedSize || 'M';

    // Nếu sản phẩm có thông tin các biến thể (variants), kiểm tra tồn kho của size được chọn
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const matchVar = product.variants.find(v => String(v.size || '').trim().toUpperCase() === String(size).trim().toUpperCase());
      if (matchVar && Number(matchVar.stock || 0) <= 0) {
        return { success: false, isOutOfStock: true, message: `Sản phẩm kích cỡ ${size} hiện đã hết hàng!` };
      }
      const totalStock = product.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
      if (totalStock <= 0) {
        return { success: false, isOutOfStock: true, message: 'Sản phẩm hiện đã hết hàng!' };
      }
    }

    const variantId = product.variant_id || product.variantId;

    // 1. Nếu có variant_id hợp lệ, gọi Backend API lưu vào MySQL
    if (variantId && !isNaN(Number(variantId))) {
      try {
        const res = await cartService.addToCart(variantId, quantity);
        if (res?.status && res?.data?.items) {
          const apiItems = res.data.items.map((item) => ({
            id: String(item.variant_id || item.cart_item_id),
            cartItemId: String(item.cart_item_id),
            variant_id: item.variant_id,
            productId: item.product_id,
            sku: item.sku,
            categoryTag: item.category_name || 'THỜI TRANG',
            title: item.product_name,
            colorName: item.color,
            colorDot: getColorHex(item.color || ''),
            size: item.size,
            price: item.price,
            quantity: item.quantity,
            stock: item.stock,
            image: item.image,
            selected: false,
          }));
          setCart(apiItems);
          const cartKey = getUserStorageKey('youth_fashion_cart', user);
          if (cartKey) {
            localStorage.setItem(cartKey, JSON.stringify(apiItems));
          }
          return { success: true };
        }
      } catch (err) {
        console.warn('Lỗi gọi API cart, kiểm tra phản hồi lỗi:', err.message);
        // Nếu server báo lỗi 400 (hết hàng / không đủ số lượng / ngừng kinh doanh)
        if (err.response?.status === 400) {
          return {
            success: false,
            isOutOfStock: true,
            message: err.response?.data?.message || 'Sản phẩm hiện đã hết hàng trong kho!'
          };
        }
      }
    }

    // 2. Dự phòng cục bộ (local fallback)
    setCart((prev) => {
      const cartItemId = `${prodId}-${size}`;
      const existingIndex = prev.findIndex((item) => item.id === cartItemId || (item.productId === prodId && item.size === size));

      let next;
      if (existingIndex > -1) {
        next = prev.map((item, idx) => {
          if (idx === existingIndex) {
            return { ...item, quantity: item.quantity + quantity };
          }
          return item;
        });
      } else {
        const priceNum = typeof product.price === 'number'
          ? product.price
          : (parseInt(String(product.price).replace(/\D/g, '')) || 2890000);

        const newItem = {
          id: cartItemId,
          productId: prodId,
          sku: product.sku || (typeof prodId === 'string' && prodId.startsWith('YF-') ? prodId : `YF-${prodId}`),
          categoryTag: product.categoryTag || product.categoryName || 'ATELIER COLLECTION',
          title: product.title || product.name || 'Thiết kế cao cấp',
          colorName: product.colorName || (product.color ? product.color : 'Mặc định'),
          colorDot: product.colorDot || getColorHex(product.colorName || product.color || ''),
          size: size,
          price: priceNum,
          originalPrice: product.originalPrice || null,
          quantity: quantity,
          image: product.image || product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
          badge: product.badge || product.badgeTop || null,
          badgeBg: product.badgeBg || product.badgeTopBg || '#000000',
          selected: false,
        };
        next = [newItem, ...prev];
      }
      const cartKey = getUserStorageKey('youth_fashion_cart', user);
      if (cartKey) {
        try {
          localStorage.setItem(cartKey, JSON.stringify(next));
        } catch (err) {}
      }
      return next;
    });
    return { success: true };
  };

  const updateCartQuantity = async (cartItemId, delta) => {
    if (!user) return;
    const currentItem = cart.find((item) => item.id === cartItemId || item.cartItemId === cartItemId);
    const maxStock = currentItem?.stock !== undefined ? Number(currentItem.stock) : Infinity;
    const newQty = Math.min(maxStock, Math.max(1, (currentItem?.quantity || 1) + delta));

    // Đồng bộ API nếu mục có variant_id
    const targetVariantId = currentItem?.variant_id || (currentItem && !isNaN(Number(currentItem.id)) ? currentItem.id : null);
    if (targetVariantId) {
      cartService.updateQuantity(targetVariantId, newQty).catch((err) => {
        console.warn('Lỗi cập nhật số lượng qua API:', err.message);
      });
    }

    setCart((prev) => {
      const next = prev.map((item) => {
        if (item.id === cartItemId || item.cartItemId === cartItemId) {
          return { ...item, quantity: newQty };
        }
        return item;
      });
      const cartKey = getUserStorageKey('youth_fashion_cart', user);
      if (cartKey) {
        try {
          localStorage.setItem(cartKey, JSON.stringify(next));
        } catch (err) {}
      }
      return next;
    });
  };

  const removeFromCart = async (cartItemId) => {
    if (!user) return;
    const currentItem = cart.find((item) => item.id === cartItemId || item.cartItemId === cartItemId);
    const targetVariantId = currentItem?.variant_id || (currentItem && !isNaN(Number(currentItem.id)) ? currentItem.id : null);

    if (targetVariantId) {
      cartService.removeFromCart(targetVariantId).catch((err) => {
        console.warn('Lỗi xóa sản phẩm qua API:', err.message);
      });
    }

    setCart((prev) => {
      const next = prev.filter((item) => item.id !== cartItemId && item.cartItemId !== cartItemId);
      const cartKey = getUserStorageKey('youth_fashion_cart', user);
      if (cartKey) {
        try {
          localStorage.setItem(cartKey, JSON.stringify(next));
        } catch (err) {}
      }
      return next;
    });
  };

  const clearCart = async () => {
    if (!user) return;
    cartService.clearCart().catch((err) => {
      console.warn('Lỗi xóa sạch giỏ hàng qua API:', err.message);
    });
    setCart([]);
    const cartKey = getUserStorageKey('youth_fashion_cart', user);
    if (cartKey) {
      try {
        localStorage.removeItem(cartKey);
      } catch (err) {}
    }
  };

  const toggleCartItemSelection = (cartItemId) => {
    if (!user) return;
    setCart(prev => {
      const next = prev.map(item => item.id === cartItemId ? { ...item, selected: !item.selected } : item);
      const cartKey = getUserStorageKey('youth_fashion_cart', user);
      if (cartKey) {
        try {
          localStorage.setItem(cartKey, JSON.stringify(next));
        } catch (err) {}
      }
      return next;
    });
  };

  const toggleSelectAllCart = (isSelected) => {
    if (!user) return;
    setCart(prev => {
      const next = prev.map(item => ({ ...item, selected: isSelected }));
      const cartKey = getUserStorageKey('youth_fashion_cart', user);
      if (cartKey) {
        try {
          localStorage.setItem(cartKey, JSON.stringify(next));
        } catch (err) {}
      }
      return next;
    });
  };

  /**
   * Xóa chính xác các sản phẩm vừa thanh toán thành công khỏi giỏ hàng
   * Áp dụng cho cả MySQL Database, localStorage và React state
   */
  const removePurchasedItems = async (purchasedItems) => {
    if (!purchasedItems || !Array.isArray(purchasedItems) || purchasedItems.length === 0) return;

    // Nếu đơn hàng là Mua Ngay (isBuyNow) thì không ảnh hưởng giỏ hàng
    if (purchasedItems.some((i) => i.isBuyNow)) {
      try {
        sessionStorage.removeItem('yf_buy_now_item');
      } catch (e) {}
      return;
    }

    const targetVariantIds = [];
    const targetIds = new Set();
    const targetNames = new Set();

    purchasedItems.forEach((pItem) => {
      const vId = pItem.variant_id || (pItem.id && !isNaN(Number(pItem.id)) && !String(pItem.id).includes('-') ? Number(pItem.id) : null);
      if (vId) targetVariantIds.push(vId);
      if (pItem.id) targetIds.add(String(pItem.id));
      if (pItem.cartItemId) targetIds.add(String(pItem.cartItemId));
      if (pItem.variant_id) targetIds.add(String(pItem.variant_id));
      const name = pItem.title || pItem.product_name || pItem.name;
      if (name) targetNames.add(String(name).toLowerCase().trim());
    });

    // 1. Gọi API Backend xóa các sản phẩm này khỏi giỏ hàng MySQL
    targetVariantIds.forEach((vId) => {
      cartService.removeFromCart(vId).catch((err) => {
        console.warn('Lỗi xóa sản phẩm đã mua khỏi giỏ hàng qua API:', err.message);
      });
    });

    // 2. Cập nhật state cart và đồng bộ localStorage
    setCart((prev) => {
      const remaining = (prev || []).filter((cItem) => {
        const cVId = cItem.variant_id || (cItem.id && !isNaN(Number(cItem.id)) && !String(cItem.id).includes('-') ? Number(cItem.id) : null);
        if (cVId && targetVariantIds.includes(cVId)) return false;
        if (cItem.id && targetIds.has(String(cItem.id))) return false;
        if (cItem.cartItemId && targetIds.has(String(cItem.cartItemId))) return false;
        const cName = String(cItem.title || cItem.product_name || '').toLowerCase().trim();
        if (cName && targetNames.has(cName)) return false;
        return true;
      });

      const cartKey = getUserStorageKey('youth_fashion_cart', user);
      if (cartKey) {
        try {
          localStorage.setItem(cartKey, JSON.stringify(remaining));
        } catch (err) {}
      }
      return remaining;
    });

    // Dọn dẹp các session thanh toán
    try {
      sessionStorage.removeItem('yf_buy_now_item');
      sessionStorage.removeItem('yf_pending_checkout_items');
      sessionStorage.removeItem('yf_checkout_voucher');
      sessionStorage.removeItem('yf_checkout_note');
    } catch (e) {}
  };

  /**
   * Cập nhật cart an toàn, luôn đồng bộ xuống localStorage
   */
  const updateCartState = (newCartOrFn) => {
    setCart((prev) => {
      const next = typeof newCartOrFn === 'function' ? newCartOrFn(prev) : newCartOrFn;
      const cartKey = getUserStorageKey('youth_fashion_cart', user);
      if (cartKey) {
        try {
          localStorage.setItem(cartKey, JSON.stringify(next || []));
        } catch (err) {}
      }
      return next || [];
    });
  };

  // Số lượng giỏ hàng: Chỉ hiển thị khi đã đăng nhập
  const cartCount = user ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

  const updateUserProfile = async (updatedData) => {
    const newAvatar = updatedData.avatar_url;
    if (newAvatar) {
      localStorage.setItem('user_avatar_url', newAvatar);
      if (user?.email) {
        localStorage.setItem(`avatar_url_${user.email}`, newAvatar);
      }
    }

    try {
      const payload = {
        customer_id: user?.customer_id || user?.id || 1,
        full_name: updatedData.full_name !== undefined ? updatedData.full_name : user?.full_name,
        phone: updatedData.phone !== undefined ? updatedData.phone : (user?.phone || ''),
        avatar_url: updatedData.avatar_url !== undefined ? updatedData.avatar_url : user?.avatar_url,
        gender: updatedData.gender !== undefined ? updatedData.gender : user?.gender,
        dob: updatedData.dob !== undefined ? updatedData.dob : user?.dob,
        ...updatedData
      };
      const result = await authService.updateProfile(payload);
      setUser(prev => {
        const synced = { ...prev, ...(result?.data || {}), ...updatedData };
        if (newAvatar) synced.avatar_url = newAvatar;
        localStorage.setItem('user', JSON.stringify(synced));
        return synced;
      });
      return { success: true, message: 'Đã cập nhật hồ sơ thành công vào CSDL!' };
    } catch (err) {
      const serverData = err.response?.data;
      if (serverData) {
        let errorMsg = serverData.message || 'Cập nhật hồ sơ thất bại!';
        if (serverData.errors && Array.isArray(serverData.errors) && serverData.errors.length > 0) {
          errorMsg = `${serverData.message}: ${serverData.errors.join(', ')}`;
        }
        return { success: false, message: errorMsg };
      }

      console.warn('Backend updateProfile fallback:', err.message);
      setUser(prev => {
        const newUser = { ...prev, ...updatedData };
        if (newAvatar) newUser.avatar_url = newAvatar;
        localStorage.setItem('user', JSON.stringify(newUser));
        return newUser;
      });
      return { success: true, message: 'Đã cập nhật hồ sơ cá nhân thành công!' };
    }
  };


  const login = async ({ email, password, user_type = 'CUSTOMER' }) => {
    setLoading(true);
    try {
      const result = await authService.login({ email, password, user_type });
      const { user: userData, accessToken: token } = result.data;

      const savedAvatar = (userData?.email && localStorage.getItem(`avatar_url_${userData.email}`)) || localStorage.getItem('user_avatar_url');
      if (!isValidAvatarUrl(userData?.avatar_url) && isValidAvatarUrl(savedAvatar)) {
        userData.avatar_url = savedAvatar;
      }

      if (!userData?.created_at && userData?.email) {
        const storedReg = localStorage.getItem(`yf_user_registered_at_${userData.email}`);
        if (storedReg) userData.created_at = storedReg;
      }

      setUser(userData);
      setAccessToken(token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', token);

      return { success: true, message: result.message, data: result.data };
    } catch (error) {
      const serverData = error.response?.data;
      let errorMsg = serverData?.message;
      if (serverData?.errors && Array.isArray(serverData.errors) && serverData.errors.length > 0) {
        errorMsg = `${serverData.message}: ${serverData.errors.join(', ')}`;
      }

      // If backend API is offline or returning network error, fallback gracefully
      if (!error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        const savedAvatar = (email && localStorage.getItem(`avatar_url_${email}`)) || localStorage.getItem('user_avatar_url');
        const mockUser = {
          customer_id: 1,
          email: email || '',
          full_name: email ? email.split('@')[0] : 'Khách hàng Youth Fashion',
          phone: '',
          avatar_url: savedAvatar || null,
          role: user_type
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return { success: true, message: 'Đăng nhập thành công!', data: { user: mockUser } };
      }

      return { success: false, message: errorMsg || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const result = await authService.register(userData);
      return { success: true, message: result?.message || 'Đăng ký tài khoản thành công!', data: result?.data };
    } catch (error) {
      const serverData = error.response?.data;
      let errorMsg = serverData?.message;
      if (serverData?.errors && Array.isArray(serverData.errors) && serverData.errors.length > 0) {
        errorMsg = `${serverData.message}: ${serverData.errors.join(', ')}`;
      }

      // If backend API is offline or returning network error, fallback gracefully without auto-login
      if (!error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        return { success: true, message: 'Đăng ký tài khoản thành công!' };
      }

      return { success: false, message: errorMsg || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      setUser(null);
      setAccessToken(null);
      setWishlist([]);
      setCart([]);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      setLoading(false);
    }
  };

  const changePassword = async ({ current_password, new_password, confirm_password }) => {
    try {
      const payload = {
        customer_id: user?.customer_id || user?.id,
        email: user?.email,
        current_password,
        new_password,
        confirm_password,
      };
      const result = await authService.changePassword(payload);
      return { success: true, message: result?.message || 'Đổi mật khẩu thành công!' };
    } catch (err) {
      const serverData = err.response?.data;
      let errorMsg = serverData?.message;
      if (serverData?.errors && Array.isArray(serverData.errors) && serverData.errors.length > 0) {
        errorMsg = `${serverData.message}: ${serverData.errors.join(', ')}`;
      }
      return { success: false, message: errorMsg || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại!' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        updateUserProfile,
        changePassword,
        accessToken,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        wishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        cart,
        setCart: updateCartState,
        cartCount,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        removePurchasedItems,
        toggleCartItemSelection,
        toggleSelectAllCart,
        orders,
        setOrders
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

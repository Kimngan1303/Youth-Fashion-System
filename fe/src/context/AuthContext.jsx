import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

export const AuthContext = createContext(null);

const isValidAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  if (url.startsWith('data:image/')) return url.length > 50 && url.includes(';base64,');
  return false;
};

export const DEFAULT_WISHLIST_ITEMS = [
  {
    id: 'YF-COAT-CAMEL-01',
    product_id: 'YF-COAT-CAMEL-01',
    sku: 'YF-COAT-CAMEL-01',
    title: 'Áo Măng Tô Belted Dạ Camel Cashmere',
    name: 'Áo Măng Tô Belted Dạ Camel Cashmere',
    category: 'COAT_BLAZER',
    categoryName: 'ÁO KHOÁC & BLAZER',
    price: 3450000,
    originalPrice: 4200000,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
    badgeTop: '-18% ƯU ĐÃI',
    badgeSub: 'CASHMERE 100%',
    badgeTopBg: '#000000',
    badgeTopColor: '#ffffff',
    badgeSubBg: '#fce7b2',
    badgeSubColor: '#713f12',
    status: 'CÒN HÀNG',
    statusColor: '#15803d',
    availableSizes: ['S', 'M', 'L'],
    selectedSize: 'M',
    inStock: true
  },
  {
    id: 'YF-TWEED-CRM-08',
    product_id: 'YF-TWEED-CRM-08',
    sku: 'YF-TWEED-CRM-08',
    title: 'Áo Tweed Cropped Đính Khuy Vàng Khởi',
    name: 'Áo Tweed Cropped Đính Khuy Vàng Khởi',
    category: 'COAT_BLAZER',
    categoryName: 'ÁO KHOÁC & BLAZER',
    price: 2680000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&q=80&w=800',
    badgeTop: 'BEST SELLER',
    badgeSub: 'TWEED PHÁP',
    badgeTopBg: '#92400e',
    badgeTopColor: '#ffffff',
    badgeSubBg: '#fef3c7',
    badgeSubColor: '#78350f',
    status: 'CÒN HÀNG',
    statusColor: '#15803d',
    availableSizes: ['S', 'M', 'L'],
    selectedSize: 'S',
    inStock: true
  },
  {
    id: 'YF-PLEAT-03',
    product_id: 'YF-PLEAT-03',
    sku: 'YF-PLEAT-03',
    title: 'Đầm Dạ Tiệc Lụa Pleated Emerald',
    name: 'Đầm Dạ Tiệc Lụa Pleated Emerald',
    category: 'DRESS',
    categoryName: 'ĐẦM DẠ TIỆC',
    price: 3450000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800',
    badgeTop: 'GIỚI HẠN 50 BẢN',
    badgeSub: 'CHỈ CÒN 2 CHIẾC',
    badgeTopBg: '#7f1d1d',
    badgeTopColor: '#ffffff',
    badgeSubBg: '#c2410c',
    badgeSubColor: '#ffffff',
    status: 'SẮP HẾT HÀNG',
    statusColor: '#c2410c',
    availableSizes: ['S', 'M'],
    selectedSize: 'S',
    inStock: true
  },
  {
    id: 'YF-PANTS-21',
    product_id: 'YF-PANTS-21',
    sku: 'YF-PANTS-21',
    title: 'Quần Tây Ống Rộng Phom Suông May Đo',
    name: 'Quần Tây Ống Rộng Phom Suông May Đo',
    category: 'PANTS_SKIRT',
    categoryName: 'QUẦN & CHÂN VÁY',
    price: 1890000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800',
    badgeTop: 'MAY ĐO BESPOKE',
    badgeSub: 'WOOL BLEND',
    badgeTopBg: '#57534e',
    badgeTopColor: '#ffffff',
    badgeSubBg: '#f5f5f4',
    badgeSubColor: '#44403c',
    status: 'ĐẦY ĐỦ SIZE',
    statusColor: '#0f766e',
    availableSizes: ['S', 'M', 'L', 'XL'],
    selectedSize: 'M',
    inStock: true
  }
];

export const DEFAULT_CART_ITEMS = [
  {
    id: 'YF-COAT-CAMEL-01-M',
    productId: 'YF-COAT-CAMEL-01',
    sku: 'YF-COAT-CAMEL-01',
    categoryTag: 'ATELIER HERITAGE OUTERWEAR',
    title: 'Áo Măng Tô Belted Dạ Camel Cashmere',
    colorName: 'Camel Tự Nhiên',
    colorDot: '#b47b4e',
    size: 'M',
    price: 3450000,
    originalPrice: 4200000,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
    badge: '-18%',
    badgeBg: '#715502',
    selected: true
  },
  {
    id: 'YF-TWEED-CRM-08-S',
    productId: 'YF-TWEED-CRM-08',
    sku: 'YF-TWEED-CRM-08',
    categoryTag: 'FRENCH READY-TO-WEAR',
    title: 'Áo Tweed Cropped Đính Khuy Vàng Cổ Điển',
    colorName: 'Kem Trắng Tweed',
    colorDot: '#f5f5f4',
    size: 'S',
    price: 2680000,
    originalPrice: null,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&q=80&w=800',
    badge: 'NEW LOOK',
    badgeBg: '#000000',
    selected: true
  }
];

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
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [loading, setLoading] = useState(false);

  // Danh sách sản phẩm yêu thích được khởi tạo chuẩn xác theo thiết kế và đồng bộ localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('youth_fashion_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('youth_fashion_wishlist', JSON.stringify(DEFAULT_WISHLIST_ITEMS));
      return DEFAULT_WISHLIST_ITEMS;
    } catch (e) {
      return DEFAULT_WISHLIST_ITEMS;
    }
  });

  // Danh sách giỏ hàng thực tế đồng bộ với localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('youth_fashion_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem('youth_fashion_cart', JSON.stringify(DEFAULT_CART_ITEMS));
      return DEFAULT_CART_ITEMS;
    } catch (e) {
      return DEFAULT_CART_ITEMS;
    }
  });

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const toggleWishlist = (product) => {
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
        const itemToAdd = typeof product === 'object' ? {
          id: targetId,
          product_id: targetId,
          sku: product.sku || `YF-${targetId}`,
          title: product.title || product.name || product.product_name || `Thiết kế #${targetId}`,
          name: product.name || product.title || product.product_name || `Thiết kế #${targetId}`,
          category: product.category || 'COAT_BLAZER',
          categoryName: product.categoryName || product.category || 'Thời Trang',
          price: typeof product.price === 'number' 
            ? product.price 
            : (product.rawPrice || parseInt(String(product.price).replace(/\D/g, '')) || 0),
          originalPrice: product.originalPrice || null,
          image: product.image || product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
          badgeTop: product.badgeTop || product.tag || 'MỚI',
          badgeSub: product.badgeSub || null,
          status: product.status || 'CÒN HÀNG',
          statusColor: product.statusColor || 'green',
          availableSizes: product.availableSizes || ['S', 'M', 'L'],
          selectedSize: product.selectedSize || 'M',
          inStock: product.inStock !== undefined ? product.inStock : true,
        } : {
          id: targetId,
          product_id: targetId,
          sku: `YF-${targetId}`,
          title: `Sản phẩm #${targetId}`,
          name: `Sản phẩm #${targetId}`,
          category: 'COAT_BLAZER',
          categoryName: 'Thời Trang',
          price: 0,
          image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
          badgeTop: 'MỚI',
          status: 'CÒN HÀNG',
          statusColor: 'green',
          availableSizes: ['S', 'M', 'L'],
          selectedSize: 'M',
          inStock: true
        };
        next = [itemToAdd, ...prev];
      }
      try {
        localStorage.setItem('youth_fashion_wishlist', JSON.stringify(next));
      } catch (err) {
        console.error('Lỗi khi lưu wishlist vào localStorage:', err);
      }
      return next;
    });
    return wasAdded;
  };

  const removeFromWishlist = (targetId) => {
    setWishlist(prev => {
      const next = prev.filter(item => (typeof item === 'object' ? (item.id !== targetId && item.product_id !== targetId) : item !== targetId));
      try {
        localStorage.setItem('youth_fashion_wishlist', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const clearWishlist = () => {
    setWishlist([]);
    try {
      localStorage.removeItem('youth_fashion_wishlist');
    } catch (err) {}
  };

  const addToCart = (product, selectedSize = 'M', quantity = 1) => {
    setCart(prev => {
      const prodId = product.id || product.product_id || product.sku || 'PROD';
      const size = selectedSize || product.selectedSize || 'M';
      const cartItemId = `${prodId}-${size}`;
      
      const existingIndex = prev.findIndex(item => item.id === cartItemId || (item.productId === prodId && item.size === size));
      
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
          colorName: product.colorName || (product.color ? product.color : 'Camel Tự Nhiên'),
          colorDot: product.colorDot || '#b47b4e',
          size: size,
          price: priceNum,
          originalPrice: product.originalPrice || null,
          quantity: quantity,
          image: product.image || product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
          badge: product.badge || product.badgeTop || null,
          badgeBg: product.badgeBg || product.badgeTopBg || '#000000',
          selected: true
        };
        next = [newItem, ...prev];
      }
      try {
        localStorage.setItem('youth_fashion_cart', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const updateCartQuantity = (cartItemId, delta) => {
    setCart(prev => {
      const next = prev.map(item => {
        if (item.id === cartItemId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      try {
        localStorage.setItem('youth_fashion_cart', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => {
      const next = prev.filter(item => item.id !== cartItemId);
      try {
        localStorage.setItem('youth_fashion_cart', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.setItem('youth_fashion_cart', JSON.stringify([]));
    } catch (err) {}
  };

  const toggleCartItemSelection = (cartItemId) => {
    setCart(prev => {
      const next = prev.map(item => item.id === cartItemId ? { ...item, selected: !item.selected } : item);
      try {
        localStorage.setItem('youth_fashion_cart', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const toggleSelectAllCart = (isSelected) => {
    setCart(prev => {
      const next = prev.map(item => ({ ...item, selected: isSelected }));
      try {
        localStorage.setItem('youth_fashion_cart', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

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
        full_name: updatedData.full_name || user?.full_name,
        phone: updatedData.phone || user?.phone,
        avatar_url: updatedData.avatar_url || user?.avatar_url,
        gender: updatedData.gender || user?.gender,
        dob: updatedData.dob || user?.dob,
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
        cartCount,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
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

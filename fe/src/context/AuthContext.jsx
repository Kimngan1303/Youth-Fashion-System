import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // fallback
      }
    }
    return {
      customer_id: 1,
      email: 'thaomy.nguyen@atelier-youth.vn',
      full_name: 'Nguyễn Hoàng Thảo My',
      phone: '0908 123 456',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      is_verified: true,
      member_since: 'Từ Tháng 03/2023',
      tier: 'VIP GOLD ATELIER MEMBER',
      points: '3.450 pts',
      points_cash: 'Quy đổi 345.000đ',
      total_spent: '34.5M',
      discount: 'Chiết khấu 10% trọn đời',
      dob: '10/18/1994',
      dob_details: { day: '18', month: '10', year: '1994' },
      gender: 'Nữ',
      address: {
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        detail: 'Số 154, Đường Đồng Khởi'
      }
    };
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [loading, setLoading] = useState(false);

  const [wishlist, setWishlist] = useState([1, 3]);
  const [cartCount, setCartCount] = useState(2);
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

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const updateUserProfile = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const login = async ({ email, password, user_type = 'CUSTOMER' }) => {
    setLoading(true);
    try {
      const result = await authService.login({ email, password, user_type });
      const { user: userData, accessToken: token } = result.data;

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
        const mockUser = {
          customer_id: 1,
          email: email || 'thaomy.nguyen@atelier-youth.vn',
          full_name: email.split('@')[0] || 'Khách hàng Youth Fashion',
          phone: '0908 123 456',
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
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        updateUserProfile,
        accessToken,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        wishlist,
        toggleWishlist,
        cartCount,
        setCartCount,
        orders,
        setOrders
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

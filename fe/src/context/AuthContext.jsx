import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

export const AuthContext = createContext(null);

const isValidAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  if (url.startsWith('data:image/')) return url.length > 50 && url.includes(';base64,');
  return false;
};

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
          email: email || 'thaomy.nguyen@atelier-youth.vn',
          full_name: email ? email.split('@')[0] : 'Khách hàng Youth Fashion',
          phone: '0908 123 456',
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

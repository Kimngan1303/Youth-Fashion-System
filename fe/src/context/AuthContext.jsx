import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [loading, setLoading] = useState(false);

  // Listen to silent logout event from axios interceptor
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
      let errorMsg = serverData?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!';
      if (serverData?.errors && Array.isArray(serverData.errors)) {
        errorMsg = `${serverData.message}: ${serverData.errors.join(', ')}`;
      }
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const result = await authService.register(userData);
      return { success: true, message: result.message, data: result.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      return { success: false, message: errorMsg };
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
        accessToken,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

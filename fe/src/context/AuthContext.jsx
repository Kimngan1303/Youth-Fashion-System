import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initial user state matching backend GET /api/customers/me and design mockup
  const [user, setUser] = useState({
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
  });

  const [wishlist, setWishlist] = useState([1, 3]);
  const [cartCount, setCartCount] = useState(2);

  // Orders state initialized as empty according to user request
  const [orders, setOrders] = useState([]);

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

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      updateUserProfile,
      wishlist,
      toggleWishlist,
      cartCount,
      setCartCount,
      orders,
      setOrders
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

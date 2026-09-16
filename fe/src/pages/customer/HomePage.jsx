import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Home Page</h1>
      {user && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#F5F5F4', borderRadius: '8px', maxWidth: '400px' }}>
          <p><strong>Xin chào:</strong> {user.full_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Vai trò:</strong> {user.role || user.user_type}</p>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 16px',
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

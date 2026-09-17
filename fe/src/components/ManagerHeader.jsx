import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Search } from 'lucide-react';

const headerStyles = `
  .top-header-bar {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 12px 28px;
    width: 100%;
    height: 60px;
    background: #FFFFFF;
    border-bottom: 1px solid #E8E6E1;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.02);
  }

  .header-search-box {
    display: flex;
    align-items: center;
    background: #F7F6F3;
    border: 1px solid #E2DFD7;
    border-radius: 8px;
    padding: 8px 14px;
    width: 340px;
    gap: 10px;
  }

  .header-search-input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 13.5px;
    width: 100%;
    color: #1C1917;
    font-family: 'Inter', sans-serif;
  }

  .header-user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-avatar-circle {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 36px;
    height: 36px;
    background: #111111;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 9999px;
    color: #FFFFFF;
    font-weight: 700;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
  }

  .user-info-text {
    display: flex;
    flex-direction: column;
  }

  .user-name {
    font-weight: 700;
    font-size: 13.5px;
    line-height: 18px;
    color: #111111;
  }

  .user-role-label {
    font-weight: 500;
    font-size: 11px;
    line-height: 14px;
    color: #78716C;
  }
`;

export default function ManagerHeader({ 
  searchTerm = '', 
  onSearchChange = null, 
  searchPlaceholder = 'Tìm kiếm trong hệ thống quản trị...' 
}) {
  const { user } = useAuth();
  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'M';

  return (
    <header className="top-header-bar">
      <style>{headerStyles}</style>

      <div className="header-search-box">
        <Search size={16} color="#A8A29E" />
        <input
          className="header-search-input"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={onSearchChange ? (e) => onSearchChange(e.target.value) : undefined}
          readOnly={!onSearchChange}
        />
      </div>

      <div className="header-user-profile">
        <div className="user-avatar-circle">
          {initial}
        </div>
        <div className="user-info-text">
          <span className="user-name">{user?.full_name || 'Quản lý Youth Fashion'}</span>
          <span className="user-role-label">{user?.role || 'Manager / Admin'}</span>
        </div>
      </div>
    </header>
  );
}

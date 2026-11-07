import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = '-- Chọn --',
  disabled = false,
  error = false,
  searchPlaceholder = 'Tìm kiếm nhanh...',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tự động focus vào ô tìm kiếm khi mở
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    const label = typeof opt === 'object' ? (opt.label || opt.name) : opt;
    return String(label).toLowerCase().includes(searchTerm.toLowerCase().trim());
  });

  const selectedLabel = (() => {
    if (!value) return '';
    const match = options.find((opt) => {
      const val = typeof opt === 'object' ? (opt.value || opt.name) : opt;
      return val === value;
    });
    if (!match) return value;
    return typeof match === 'object' ? (match.label || match.name) : match;
  })();

  const handleSelect = (opt) => {
    const val = typeof opt === 'object' ? (opt.value || opt.name) : opt;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${disabled ? 'disabled' : ''} ${className}`}
    >
      {/* Nút bấm hiển thị lựa chọn */}
      <div
        className={`custom-select-trigger ${error ? 'input-error' : ''} ${isOpen ? 'open' : ''}`}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <span className={`trigger-text ${!selectedLabel ? 'placeholder' : ''}`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`select-chevron ${isOpen ? 'rotate' : ''}`}
        />
      </div>

      {/* Menu xổ xuống LUÔN Ở PHÍA DƯỚI, không bị tràn màn hình */}
      {isOpen && (
        <div className="custom-select-dropdown">
          {options.length > 5 && (
            <div className="select-search-box">
              <Search size={13} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="select-search-input"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  title="Xóa tìm kiếm"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          <div className="select-options-list">
            {filteredOptions.length === 0 ? (
              <div className="no-options-found">Không tìm thấy kết quả phù hợp</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const optVal = typeof opt === 'object' ? (opt.value || opt.name) : opt;
                const optLabel = typeof opt === 'object' ? (opt.label || opt.name) : opt;
                const isSelected = optVal === value;

                return (
                  <div
                    key={`${optVal}-${idx}`}
                    className={`select-option-item ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(opt);
                    }}
                  >
                    <span>{optLabel}</span>
                    {isSelected && <Check size={14} className="check-icon" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';

export default function Logo({ size = 'default', light = false, className = '' }) {
  const isLarge = size === 'large';
  const circleSize = isLarge ? 50 : 42;
  const primaryColor = light ? '#FFFFFF' : '#000000';
  const bgColor = light ? '#171717' : '#FFFFFF';

  return (
    <div className={`brand-identity ${className}`} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: isLarge ? '18px' : '15px',
      textDecoration: 'none',
      userSelect: 'none'
    }}>
      {/* 1. Huy hiệu Vòng đôi nổi 3D siêu nét và đậm như ảnh mẫu */}
      <div style={{
        position: 'relative',
        width: `${circleSize}px`,
        height: `${circleSize}px`,
        flexShrink: 0,
        filter: light 
          ? 'drop-shadow(0 2px 6px rgba(255, 255, 255, 0.15))' 
          : 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.22)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))'
      }}>
        <svg 
          width={circleSize} 
          height={circleSize} 
          viewBox="0 0 64 64" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Nền tròn */}
          <circle cx="32" cy="32" r="30" fill={bgColor} />

          {/* Vòng tròn ngoài đậm nét */}
          <circle 
            cx="32" 
            cy="32" 
            r="29" 
            stroke={primaryColor} 
            strokeWidth="3.8" 
          />

          {/* Vòng tròn trong sắc nét */}
          <circle 
            cx="32" 
            cy="32" 
            r="23.5" 
            stroke={primaryColor} 
            strokeWidth="1.8" 
          />

          {/* Chữ lồng YF siêu đậm và nét chuẩn chính xác ở tâm */}
          <g fill={primaryColor} stroke={primaryColor} strokeWidth="0.8">
            <text 
              x="32" 
              y="33.5" 
              textAnchor="middle" 
              dominantBaseline="central"
              fontFamily="'Bodoni Moda', 'Playfair Display', Georgia, serif" 
              fontWeight="900" 
              fontSize="26" 
              letterSpacing="-2.5px"
            >
              YF
            </text>
          </g>
        </svg>
      </div>

      {/* 2. Tên thương hiệu: YOUTH FASHION đậm và nét chuẩn cao cấp */}
      <span style={{
        fontFamily: "'Bodoni Moda', 'Playfair Display', 'Cinzel', Georgia, serif",
        fontWeight: 900,
        fontSize: isLarge ? '23px' : '19.5px',
        lineHeight: 1,
        letterSpacing: '5.8px',
        textTransform: 'uppercase',
        color: primaryColor,
        WebkitTextStroke: light ? '0.4px #FFFFFF' : '0.4px #000000',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        textRendering: 'optimizeLegibility'
      }}>
        YOUTH FASHION
      </span>
    </div>
  );
}

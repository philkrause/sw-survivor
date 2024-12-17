import React from 'react';

interface NoiseOverlayProps {
  variant?: 1 | 2;
}

const NoiseOverlay: React.FC<NoiseOverlayProps> = ({ variant = 1 }) => {
  const className = variant === 1 ? 'noise-overlay' : 'noise-overlay-2';
  
  return (
    <div 
      className={className}
      style={{ 
        position: 'absolute',
        width: variant === 1 ? '400%' : '300%',
        height: variant === 1 ? '400%' : '300%',
        top: variant === 1 ? '-150%' : '-100%',
        left: variant === 1 ? '-150%' : '-100%',
        zIndex: 0,
        background: variant === 1
          ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1000 1000' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter4'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.01 0.05' numOctaves='3' seed='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0.5 0'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='table' tableValues='0.6 0.9'/%3E%3CfeFuncG type='table' tableValues='0.3 0.6'/%3E%3CfeFuncB type='table' tableValues='0 0.2'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter4)'/%3E%3C/svg%3E\")"
          : "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1000 1000' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter5'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='10' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='table' tableValues='0.7 0.9'/%3E%3CfeFuncG type='table' tableValues='0.4 0.7'/%3E%3CfeFuncB type='table' tableValues='0.1 0.3'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter5)'/%3E%3C/svg%3E\")",
        opacity: variant === 1 ? 0.2 : 0.15,
        animation: variant === 1 
          ? 'counter-rotate 180s linear infinite'
          : 'counter-rotate-2 120s linear infinite',
        pointerEvents: 'none',
        mixBlendMode: variant === 1 ? 'overlay' : 'soft-light',
      }}
    />
  );
};

export default NoiseOverlay; 
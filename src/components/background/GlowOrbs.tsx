import React from 'react';

const GlowOrbs: React.FC = () => {
  return (
    <div 
      className="glow-orbs" 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        background: `
          radial-gradient(circle at 20% 30%, rgba(255, 180, 0, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(180, 80, 0, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 60% 20%, rgba(255, 215, 0, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 30% 80%, rgba(200, 100, 0, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 10% 50%, rgba(160, 100, 20, 0.25) 0%, transparent 45%),
          radial-gradient(circle at 90% 40%, rgba(140, 80, 10, 0.25) 0%, transparent 45%),
          radial-gradient(circle at 40% 60%, rgba(120, 60, 20, 0.2) 0%, transparent 40%),
          radial-gradient(circle at 70% 30%, rgba(100, 50, 10, 0.2) 0%, transparent 40%)
        `,
        filter: 'blur(70px)',
        pointerEvents: 'none',
      }}
    />
  );
};

export default GlowOrbs; 
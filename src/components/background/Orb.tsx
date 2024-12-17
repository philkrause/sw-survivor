import React from 'react';

interface OrbProps {
  left: string;
  top: string;
  width: string;
  height: string;
  animation: string;
  animationDelay: string;
  color: string;
}

const Orb: React.FC<OrbProps> = ({
  left,
  top,
  width,
  height,
  animation,
  animationDelay,
  color
}) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    animation: `${animation}, orb-pulse 8s infinite alternate ease-in-out`,
    animationDelay: `${animationDelay}, ${parseInt(animationDelay)}s`,
    borderRadius: '50%',
    opacity: 0.8,
    pointerEvents: 'none',
  };

  return <div className="orb" style={style} />;
};

export default Orb; 
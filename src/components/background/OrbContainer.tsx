import React from 'react';
import Orb from './Orb';

// Define the orb colors
const orbColors = [
  'rgba(255, 180, 0, 0.8)',    // Golden yellow
  'rgba(180, 80, 0, 0.8)',      // Deep amber
  'rgba(255, 215, 0, 0.7)',     // Gold
  'rgba(200, 100, 0, 0.8)',     // Amber
  'rgba(160, 100, 20, 0.7)',    // Bronze
  'rgba(140, 80, 10, 0.7)',     // Dark amber
  'rgba(120, 60, 20, 0.6)',     // Copper
  'rgba(220, 150, 40, 0.7)'     // Light amber
];

// Define the orb configurations
const orbConfigs = [
  { left: '20%', top: '30%', width: '300px', height: '300px', animation: 'orb-float-1 40s infinite ease-in-out', animationDelay: '0s', color: orbColors[0] },
  { left: '80%', top: '70%', width: '350px', height: '350px', animation: 'orb-float-2 50s infinite ease-in-out', animationDelay: '5s', color: orbColors[1] },
  { left: '60%', top: '20%', width: '280px', height: '280px', animation: 'orb-float-3 45s infinite ease-in-out', animationDelay: '2s', color: orbColors[2] },
  { left: '30%', top: '80%', width: '320px', height: '320px', animation: 'orb-float-4 55s infinite ease-in-out', animationDelay: '8s', color: orbColors[3] },
  { left: '10%', top: '50%', width: '250px', height: '250px', animation: 'orb-float-2 48s infinite ease-in-out', animationDelay: '12s', color: orbColors[4] },
  { left: '90%', top: '40%', width: '270px', height: '270px', animation: 'orb-float-3 52s infinite ease-in-out', animationDelay: '7s', color: orbColors[5] },
  { left: '40%', top: '60%', width: '230px', height: '230px', animation: 'orb-float-1 43s infinite ease-in-out', animationDelay: '3s', color: orbColors[6] },
  { left: '70%', top: '30%', width: '200px', height: '200px', animation: 'orb-float-4 47s infinite ease-in-out', animationDelay: '9s', color: orbColors[7] }
];

const OrbContainer: React.FC = () => {
  return (
    <div className="orb-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      {orbConfigs.map((config, index) => (
        <Orb
          key={index}
          left={config.left}
          top={config.top}
          width={config.width}
          height={config.height}
          animation={config.animation}
          animationDelay={config.animationDelay}
          color={config.color}
        />
      ))}
    </div>
  );
};

export default OrbContainer; 
import React, { useEffect } from 'react';
import './App.css';
import Game from './components/Game';
import headerImage from './assets/images/beeware-header.png';
import borderImage from './assets/images/beeware-border.png';

const App: React.FC = () => {
  useEffect(() => {
    const glowOrbs = document.createElement('div');
    glowOrbs.className = 'glow-orbs';
    
    const orbContainer = document.createElement('div');
    orbContainer.className = 'orb-container';
    
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
    
    orbConfigs.forEach(config => {
      const orb = document.createElement('div');
      orb.className = 'orb';
      
      orb.style.left = config.left;
      orb.style.top = config.top;
      orb.style.width = config.width;
      orb.style.height = config.height;
      orb.style.background = `radial-gradient(circle, ${config.color} 0%, transparent 70%)`;
      orb.style.animation = `${config.animation}, orb-pulse 8s infinite alternate ease-in-out`;
      orb.style.animationDelay = `${config.animationDelay}, ${parseInt(config.animationDelay)}s`;
      
      orbContainer.appendChild(orb);
    });
    
    const noiseOverlay = document.createElement('div');
    noiseOverlay.className = 'noise-overlay';
    
    const noiseOverlay2 = document.createElement('div');
    noiseOverlay2.className = 'noise-overlay-2';
    
    const appElement = document.querySelector('.App');
    if (appElement) {
      appElement.appendChild(glowOrbs);
      appElement.appendChild(orbContainer);
      appElement.appendChild(noiseOverlay);
      appElement.appendChild(noiseOverlay2);
    }
    
    return () => {
      if (appElement) {
        if (appElement.contains(glowOrbs)) appElement.removeChild(glowOrbs);
        if (appElement.contains(orbContainer)) appElement.removeChild(orbContainer);
        if (appElement.contains(noiseOverlay)) appElement.removeChild(noiseOverlay);
        if (appElement.contains(noiseOverlay2)) appElement.removeChild(noiseOverlay2);
      }
    };
  }, []);

  return (
    <div className="App">
      <main>
        <div className="game-border-container">
          <img 
            src={borderImage} 
            alt="Game Border" 
            className="game-border"
          />
          <div className="game-header">
            <img 
              src={headerImage} 
              alt="Bee-Ware" 
              className="header-image"
            />
          </div>
          <div className="game-container">
            <Game />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

import React from 'react';
import './App.css';
import Game from './components/Game';
import headerImage from './assets/images/beeware-header.png';
import borderImage from './assets/images/beeware-border.png';
import BackgroundEffects from './components/background/BackgroundEffects';
import './components/background/OrbAnimations.css';

const App: React.FC = () => {
  return (
    <div className="App">
      {/* Background effects rendered as React components */}
      <BackgroundEffects />
      
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

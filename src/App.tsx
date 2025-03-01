import React from 'react';
import './styles/App.css';
import Game from './components/Game';

// Define public paths for images
const headerImage = '/bee-ware/assets/images/ui/beeware-header.png';
const borderImage = '/bee-ware/assets/images/ui/beeware-border.png';

const App: React.FC = () => {
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

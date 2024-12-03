import React from 'react';
import './App.css';
import Game from './components/Game';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Bee-Ware</h1>
      </header>
      <main>
        <Game />
      </main>
    </div>
  );
}

export default App;

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from '../phaser/scenes/MainScene';
import StartScene from '../phaser/scenes/StartScene';

import { GAME_CONFIG } from '../phaser/config/GameConfig';

const Game: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only create the game once
    if (gameRef.current !== null) {
      return;
    }

    // Game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1024,
      height: 768,
      parent: gameContainerRef.current || undefined,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: GAME_CONFIG.DEBUG,
        }
      },
      roundPixels: true,
      pixelArt: true,
      backgroundColor: '#1d1805',
      zoom: 1,
      scene: [StartScene, MainScene],
    };

    // Create new game instance
    gameRef.current = new Phaser.Game(config);

    // Cleanup function
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div ref={gameContainerRef} style={{ width: '100%', height: '100%' }} />;
};

export default Game; 
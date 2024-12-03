import React, { useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

/**
 * Main Game component that will contain the game canvas and logic
 */
const Game: React.FC = () => {
  // Constants for stage dimensions
  const STAGE_WIDTH = 1024;
  const STAGE_HEIGHT = 768;
  
  // Constants for player
  const PLAYER_SIZE = 32;
  const MOVEMENT_SPEED = 5;

  // Player position state
  const [playerPos, setPlayerPos] = useState({
    x: STAGE_WIDTH / 2 - PLAYER_SIZE / 2,
    y: STAGE_HEIGHT / 2 - PLAYER_SIZE / 2
  });

  // Track pressed keys
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  // Update player position based on pressed keys
  const updatePosition = useCallback(() => {
    setPlayerPos(prevPos => {
      let newX = prevPos.x;
      let newY = prevPos.y;

      // Check each movement key and update position accordingly
      if (keys['w'] || keys['arrowup']) {
        newY = Math.max(0, prevPos.y - MOVEMENT_SPEED);
      }
      if (keys['s'] || keys['arrowdown']) {
        newY = Math.min(STAGE_HEIGHT - PLAYER_SIZE, prevPos.y + MOVEMENT_SPEED);
      }
      if (keys['a'] || keys['arrowleft']) {
        newX = Math.max(0, prevPos.x - MOVEMENT_SPEED);
      }
      if (keys['d'] || keys['arrowright']) {
        newX = Math.min(STAGE_WIDTH - PLAYER_SIZE, prevPos.x + MOVEMENT_SPEED);
      }

      return { x: newX, y: newY };
    });
  }, [keys]);

  // Game loop
  useEffect(() => {
    let frameId: number;
    
    const gameLoop = () => {
      updatePosition();
      frameId = requestAnimationFrame(gameLoop);
    };

    frameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [updatePosition]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        setKeys(prev => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        setKeys(prev => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="game-container">
      <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT}>
        <Layer>
          <Rect
            x={playerPos.x}
            y={playerPos.y}
            width={PLAYER_SIZE}
            height={PLAYER_SIZE}
            fill="blue"
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default Game; 
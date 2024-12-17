import React from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import Player from './Player';
import Enemy from './Enemy';
import Projectiles from './game/Projectiles';
import GameOver from './ui/GameOver';
import Score from './ui/Score';
import { useImage } from 'react-konva-utils';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../game/constants';

// Import our custom hooks
import { useKeyboardControls } from './game/useKeyboardControls';
import { usePlayerSystem } from './game/usePlayerSystem';
import { useEnemySystem } from './game/useEnemySystem';
import { useProjectileSystem } from './game/useProjectileSystem';
import { useCollisionSystem } from './game/useCollisionSystem';
import { useGameLoop } from './game/useGameLoop';

// Import background image
import bgImage from '../assets/images/bg.png';

/**
 * Main Game component that will contain the game canvas and logic
 */
const Game: React.FC = () => {
  // Load assets
  const [bgLoaded] = useImage(bgImage);
  
  // Set up input handling
  const keys = useKeyboardControls();
  
  // Set up player system
  const {
    playerPos,
    playerHealth,
    playerPosRef,
    updatePosition,
    damagePlayer,
    isGameOver
  } = usePlayerSystem(keys);
  
  // Set up enemy system
  const {
    enemies,
    updateEnemies,
    damageEnemy,
    score
  } = useEnemySystem(playerPosRef, isGameOver);
  
  // Set up projectile system
  const {
    projectiles,
    updateProjectiles,
    fireProjectile,
    handleProjectileHit
  } = useProjectileSystem(playerPosRef, isGameOver);
  
  // Set up collision detection
  const { checkCollisions } = useCollisionSystem({
    playerPosX: playerPos.x,
    playerPosY: playerPos.y,
    enemies,
    projectiles,
    damagePlayer,
    damageEnemy,
    handleProjectileHit
  });
  
  // Set up the game loop - we'll continue the game loop even when game over
  // so we can still render everything, but individual systems will stop updating
  useGameLoop([
    updatePosition,
    updateEnemies,
    updateProjectiles,
    checkCollisions
  ]);
  
  return (
    <div className="game-container">
      <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT}>
        <Layer>
          {/* Background image */}
          {bgLoaded && (
            <KonvaImage
              image={bgLoaded}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
            />
          )}
          
          {/* Player */}
          <Player 
            x={playerPos.x} 
            y={playerPos.y} 
            health={playerHealth} 
          />
          
          {/* Enemies */}
          {enemies.map(enemy => (
            <Enemy
              key={enemy.id}
              x={enemy.x}
              y={enemy.y}
              health={enemy.health}
            />
          ))}
          
          {/* Projectiles */}
          <Projectiles projectiles={projectiles} />
          
          {/* UI Elements */}
          <Score score={score} />
          <GameOver visible={isGameOver} />
        </Layer>
      </Stage>
    </div>
  );
};

export default Game; 
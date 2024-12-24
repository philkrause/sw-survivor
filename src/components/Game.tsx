import React, { useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import Player from './Player';
import Enemy from './Enemy';
import Projectiles from './game/Projectiles';
import GameOver from './ui/GameOver';
import Score from './ui/Score';
import LevelUp from './ui/LevelUp';
import { useImage } from 'react-konva-utils';
import { STAGE_WIDTH, STAGE_HEIGHT, PROJECTILE_DAMAGE } from '../game/constants';

// Import our custom hooks
import { useKeyboardControls } from './game/useKeyboardControls';
import { usePlayerSystem } from './game/usePlayerSystem';
import { useEnemySystem } from './game/useEnemySystem';
import { useProjectileSystem } from './game/useProjectileSystem';
import { useCollisionSystem } from './game/useCollisionSystem';
import { useGameLoop } from './game/useGameLoop';
import { useLevelSystem } from './game/useLevelSystem';

// Import background image
import bgImage from '../assets/images/bg.png';

/**
 * Main Game component that will contain the game canvas and logic
 */
const Game: React.FC = () => {
  // Load assets
  const [bgLoaded] = useImage(bgImage);
  
  // Game state
  const [isPaused, setIsPaused] = useState(false);
  
  // Set up input handling
  const keys = useKeyboardControls();
  
  // Set up player system
  const {
    playerPos,
    playerHealth,
    playerPosRef,
    updatePosition,
    damagePlayer,
    isGameOver,
    upgradeSpeed
  } = usePlayerSystem(keys);
  
  // Set up projectile system - note: we need to check if isPaused is a valid parameter
  const {
    projectiles,
    updateProjectiles,
    handleProjectileHit
  } = useProjectileSystem(playerPosRef, isGameOver);
  
  // Callbacks for upgrading game stats
  const upgradeAttackSpeed = useCallback(() => {
    console.log('Upgrading attack speed');
    // In a real implementation, we would modify an attack speed value
  }, []);
  
  // Set up enemy system - note: we need to check if isPaused is a valid parameter
  const {
    enemies,
    updateEnemies,
    damageEnemy,
    score
  } = useEnemySystem(playerPosRef, isGameOver);
  
  // Set up level system
  const {
    showLevelUp,
    upgrades,
    handleSelectUpgrade
  } = useLevelSystem({
    score, // Use the actual score from the enemy system
    onUpgradeAttackSpeed: upgradeAttackSpeed,
    onUpgradePlayerSpeed: upgradeSpeed
  });
  
  // Update level system with the current score
  useEffect(() => {
    // We can't directly update the score in the level system,
    // so we'll need to monitor showLevelUp and pause when needed
    if (showLevelUp) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  }, [showLevelUp]);
  
  // Set up collision detection
  const { checkCollisions } = useCollisionSystem({
    playerPosX: playerPos.x,
    playerPosY: playerPos.y,
    enemies,
    projectiles,
    damagePlayer,
    damageEnemy,
    handleProjectileHit,
    projectileDamage: PROJECTILE_DAMAGE
  });
  
  // Define update functions based on pause state
  const updateFunctions = isPaused 
    ? [] // Empty array when paused - no updates
    : [
        updatePosition,
        updateEnemies,
        updateProjectiles,
        checkCollisions
      ];
  
  // Set up the game loop
  useGameLoop(updateFunctions, isPaused);
  
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
          <LevelUp 
            visible={showLevelUp} 
            upgrades={upgrades} 
            onSelect={handleSelectUpgrade} 
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default Game; 
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text } from 'react-konva';
import Player from './Player';
import Enemy from './Enemy';
import Projectiles from './game/Projectiles';
import GameOver from './ui/GameOver';
import Score from './ui/Score';
import LevelUp from './ui/LevelUp';
import { useImage } from 'react-konva-utils';
import { STAGE_WIDTH, STAGE_HEIGHT, ATTACK_RATE, PLAYER_SPEED, PROJECTILE_DAMAGE, DEFAULT_PIERCE, PLAYER_INITIAL_HEALTH } from '../game/constants';

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
  
  // Game configuration (can be modified by level-ups)
  const gameConfig = useRef({
    attackRate: ATTACK_RATE,
    projectileDamage: PROJECTILE_DAMAGE,
    pierce: DEFAULT_PIERCE
  });
  
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
    resetGame,
    increaseSpeed,
    increaseMaxHealth,
    currentMaxHealth
  } = usePlayerSystem(keys);
  
  // Set up enemy system
  const {
    enemies,
    updateEnemies,
    damageEnemy,
    score
  } = useEnemySystem(playerPosRef, isGameOver, isPaused);
  
  // Set up projectile system with refs to dynamic config values
  const {
    projectiles,
    updateProjectiles,
    fireProjectile,
    handleProjectileHit,
    updateAttackRate,
    setCurrentPierce,
    currentAttackRate,
    currentPierce
  } = useProjectileSystem(playerPosRef, isGameOver, isPaused);
  
  // Update projectile system when game config changes
  useEffect(() => {
    if (gameConfig.current.attackRate !== currentAttackRate) {
      updateAttackRate(gameConfig.current.attackRate);
    }
    
    if (gameConfig.current.pierce !== currentPierce) {
      setCurrentPierce(gameConfig.current.pierce);
    }
  }, [gameConfig.current, updateAttackRate, setCurrentPierce, currentAttackRate, currentPierce]);
  
  // Handle applying upgrades to the game
  const applyUpgrade = useCallback((type: string, value: number) => {
    switch (type) {
      case 'attackSpeed':
        gameConfig.current = {
          ...gameConfig.current,
          attackRate: Math.max(50, gameConfig.current.attackRate - value)
        };
        updateAttackRate(gameConfig.current.attackRate);
        console.log(`Attack speed increased! New rate: ${gameConfig.current.attackRate}ms`);
        break;
      case 'moveSpeed':
        increaseSpeed(value);
        console.log(`Movement speed increased!`);
        break;
      case 'projectileDamage':
        gameConfig.current = {
          ...gameConfig.current,
          projectileDamage: gameConfig.current.projectileDamage + value
        };
        console.log(`Damage increased! New damage: ${gameConfig.current.projectileDamage}`);
        break;
      case 'pierce':
        gameConfig.current = {
          ...gameConfig.current,
          pierce: gameConfig.current.pierce + value
        };
        setCurrentPierce(gameConfig.current.pierce);
        console.log(`Pierce increased! New pierce: ${gameConfig.current.pierce}`);
        break;
      case 'health':
        increaseMaxHealth(value);
        console.log(`Max health increased! New max health: ${currentMaxHealth + value}`);
        break;
      default:
        console.warn(`Unknown upgrade type: ${type}`);
    }
    
    // Resume the game after applying the upgrade
    setIsPaused(false);
  }, [increaseSpeed, increaseMaxHealth, currentMaxHealth, updateAttackRate, setCurrentPierce]);
  
  // Set up level system
  const {
    level,
    isLevelingUp,
    levelUpChoices,
    selectUpgrade
  } = useLevelSystem(score, applyUpgrade);
  
  // Pause the game when leveling up
  useEffect(() => {
    setIsPaused(isLevelingUp);
  }, [isLevelingUp]);
  
  // Set up collision detection
  const { checkCollisions } = useCollisionSystem({
    playerPosX: playerPos.x,
    playerPosY: playerPos.y,
    enemies,
    projectiles,
    damagePlayer,
    damageEnemy,
    handleProjectileHit,
    projectileDamage: gameConfig.current.projectileDamage
  });
  
  // Create a reference to the current game config for the collision system
  const gameConfigRef = useRef(gameConfig.current);
  
  // Update the game config reference when it changes
  useEffect(() => {
    gameConfigRef.current = gameConfig.current;
  }, [gameConfig.current]);
  
  // Define update functions based on pause state
  const updateFunctions = isPaused 
    ? [] // Empty array when paused - no updates
    : [
        updatePosition,
        updateEnemies,
        updateProjectiles,
        // Use a wrapper function to ensure we always use the latest game config
        () => checkCollisions()
      ];
  
  // Set up the game loop
  useGameLoop(updateFunctions);

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
          <Score score={score} level={level} />
          <GameOver visible={isGameOver} />
          <LevelUp 
            visible={isLevelingUp} 
            choices={levelUpChoices} 
            onSelect={selectUpgrade} 
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default Game; 
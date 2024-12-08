import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Stage, Layer, Circle } from 'react-konva';
import Player from './Player';
import Enemy from './Enemy';

// Types
interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  directionX: number;
  directionY: number;
}

/**
 * Main Game component that will contain the game canvas and logic
 */
const Game: React.FC = () => {
  // Constants for stage dimensions
  const STAGE_WIDTH = 1024;
  const STAGE_HEIGHT = 768;
  
  // Constants for game elements
  const PLAYER_SIZE = 32;
  const ENEMY_SIZE = 32;
  const PROJECTILE_SIZE = 8;
  const MOVEMENT_SPEED = 5;
  const ENEMY_SPEED = 2; // Slower than player
  const PROJECTILE_SPEED = 8; // Faster than player
  const SPAWN_INTERVAL = 2000; // 2 seconds
  const ATTACK_INTERVAL = 500; // 0.5 seconds
  const PROJECTILE_DAMAGE = 5; // Damage per projectile hit

  // Player position and health state
  const [playerPos, setPlayerPos] = useState({
    x: STAGE_WIDTH / 2 - PLAYER_SIZE / 2,
    y: STAGE_HEIGHT / 2 - PLAYER_SIZE / 2
  });
  const [playerHealth, setPlayerHealth] = useState(100); // Player starts with 100 health

  // Enemy state
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [nextEnemyId, setNextEnemyId] = useState(0);

  // Projectile state
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [nextProjectileId, setNextProjectileId] = useState(0);

  // Track pressed keys
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  // Generate random spawn position on canvas edge
  const generateSpawnPosition = (): { x: number; y: number } => {
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    
    switch (edge) {
      case 0: // top
        return {
          x: Math.random() * (STAGE_WIDTH - ENEMY_SIZE),
          y: 0
        };
      case 1: // right
        return {
          x: STAGE_WIDTH - ENEMY_SIZE,
          y: Math.random() * (STAGE_HEIGHT - ENEMY_SIZE)
        };
      case 2: // bottom
        return {
          x: Math.random() * (STAGE_WIDTH - ENEMY_SIZE),
          y: STAGE_HEIGHT - ENEMY_SIZE
        };
      default: // left
        return {
          x: 0,
          y: Math.random() * (STAGE_HEIGHT - ENEMY_SIZE)
        };
    }
  };

  // Generate random direction for projectile
  const generateRandomDirection = (): { directionX: number, directionY: number } => {
    // Generate random angle in radians
    const angle = Math.random() * Math.PI * 2;
    
    // Convert angle to direction vector
    return {
      directionX: Math.cos(angle),
      directionY: Math.sin(angle)
    };
  };

  // Use refs to access current state values in intervals without dependencies
  const playerPosRef = useRef(playerPos);
  const projectilesRef = useRef(projectiles);

  // Update refs when state changes
  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);

  const nextProjectileIdRef = useRef(nextProjectileId);

  useEffect(() => {
    nextProjectileIdRef.current = nextProjectileId;
  }, [nextProjectileId]);

  // Fire projectile from player
  const fireProjectile = useCallback(() => {
    const direction = generateRandomDirection();
    const currentPlayerPos = playerPosRef.current;
    const currentProjectileId = nextProjectileIdRef.current;
    
    // Create projectile at player center
    const projectileX = currentPlayerPos.x + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
    const projectileY = currentPlayerPos.y + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
    
    setProjectiles(prev => [...prev, {
      id: currentProjectileId,
      x: projectileX,
      y: projectileY,
      directionX: direction.directionX,
      directionY: direction.directionY
    }]);
    
    setNextProjectileId(prev => prev + 1);
  }, []);

  // Check for collision between two rectangles
  const checkCollision = (
    rect1X: number, rect1Y: number, rect1Width: number, rect1Height: number,
    rect2X: number, rect2Y: number, rect2Width: number, rect2Height: number
  ): boolean => {
    return (
      rect1X < rect2X + rect2Width &&
      rect1X + rect1Width > rect2X &&
      rect1Y < rect2Y + rect2Height &&
      rect1Y + rect1Height > rect2Y
    );
  };

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

  // Update enemy positions
  const updateEnemies = useCallback(() => {
    const currentPlayerPos = playerPosRef.current;
    
    setEnemies(prevEnemies => prevEnemies.map(enemy => {
      // Calculate direction to player
      const dx = currentPlayerPos.x - enemy.x;
      const dy = currentPlayerPos.y - enemy.y;
      
      // Normalize direction vector
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance === 0) return enemy; // Avoid division by zero
      
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;
      
      // Update position
      return {
        ...enemy,
        x: enemy.x + normalizedDx * ENEMY_SPEED,
        y: enemy.y + normalizedDy * ENEMY_SPEED
      };
    }));
  }, []);

  // Update projectile positions and check for collisions
  const updateProjectiles = useCallback(() => {
    // First, update projectile positions
    setProjectiles(prevProjectiles => {
      // Move projectiles in their direction
      const updatedProjectiles = prevProjectiles.map(projectile => ({
        ...projectile,
        x: projectile.x + projectile.directionX * PROJECTILE_SPEED,
        y: projectile.y + projectile.directionY * PROJECTILE_SPEED
      }));
      
      // Remove projectiles that are off-screen
      return updatedProjectiles.filter(projectile => 
        projectile.x > -PROJECTILE_SIZE &&
        projectile.x < STAGE_WIDTH &&
        projectile.y > -PROJECTILE_SIZE &&
        projectile.y < STAGE_HEIGHT
      );
    });
  }, []);

  // Check for collisions between projectiles and enemies
  const checkCollisions = useCallback(() => {
    const currentProjectiles = projectilesRef.current;
    let projectilesToRemove: number[] = [];
    
    // Using functional updates to ensure we have the latest state
    setEnemies(currentEnemies => {
      let updatedEnemies = [...currentEnemies];
      let hasChanges = false;
      
      // Check each projectile against each enemy
      currentProjectiles.forEach(projectile => {
        currentEnemies.forEach((enemy, enemyIndex) => {
          if (checkCollision(
            projectile.x, projectile.y, PROJECTILE_SIZE, PROJECTILE_SIZE,
            enemy.x, enemy.y, ENEMY_SIZE, ENEMY_SIZE
          )) {
            // Collision detected
            if (!projectilesToRemove.includes(projectile.id)) {
              projectilesToRemove.push(projectile.id);
            }
            
            // Reduce enemy health
            const updatedHealth = enemy.health - PROJECTILE_DAMAGE;
            hasChanges = true;
            
            if (updatedHealth <= 0) {
              // Enemy is destroyed
              updatedEnemies = updatedEnemies.filter(e => e.id !== enemy.id);
            } else {
              // Update enemy health
              updatedEnemies[enemyIndex] = {
                ...enemy,
                health: updatedHealth
              };
            }
          }
        });
      });
      
      // Return updated enemies or original list if no changes
      return hasChanges ? updatedEnemies : currentEnemies;
    });
    
    // If projectiles hit enemies, remove them
    if (projectilesToRemove.length > 0) {
      setProjectiles(prev => prev.filter(p => !projectilesToRemove.includes(p.id)));
    }
  }, []); // Empty dependency array since we're using refs

  // Create refs for the callback functions
  const updatePositionRef = useRef(updatePosition);
  const updateEnemiesRef = useRef(updateEnemies);
  const updateProjectilesRef = useRef(updateProjectiles);
  const checkCollisionsRef = useRef(checkCollisions);

  // Update refs when functions change
  useEffect(() => {
    updatePositionRef.current = updatePosition;
  }, [updatePosition]);

  useEffect(() => {
    updateEnemiesRef.current = updateEnemies;
  }, [updateEnemies]);

  useEffect(() => {
    updateProjectilesRef.current = updateProjectiles;
  }, [updateProjectiles]);

  useEffect(() => {
    checkCollisionsRef.current = checkCollisions;
  }, [checkCollisions]);

  // Spawn enemy effect
  useEffect(() => {
    const spawnEnemy = () => {
      const spawnPos = generateSpawnPosition();
      setEnemies(prev => [...prev, {
        id: nextEnemyId,
        x: spawnPos.x,
        y: spawnPos.y,
        health: 10 // Enemies start with 10 health
      }]);
      setNextEnemyId(prev => prev + 1);
    };

    const spawnInterval = setInterval(spawnEnemy, SPAWN_INTERVAL);

    return () => {
      clearInterval(spawnInterval);
    };
  }, [nextEnemyId]);

  // Auto attack effect - now using refs to avoid dependency on changing values
  useEffect(() => {
    const attackInterval = setInterval(fireProjectile, ATTACK_INTERVAL);
    
    return () => {
      clearInterval(attackInterval);
    };
  }, [fireProjectile]);

  // Game loop
  useEffect(() => {
    let frameId: number;
    
    const gameLoop = () => {
      updatePositionRef.current();
      updateEnemiesRef.current();
      updateProjectilesRef.current();
      checkCollisionsRef.current(); // Add collision detection to game loop
      frameId = requestAnimationFrame(gameLoop);
    };

    frameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []); // Empty dependency array since we're using refs

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
          {projectiles.map(projectile => (
            <Circle
              key={projectile.id}
              x={projectile.x + PROJECTILE_SIZE / 2}
              y={projectile.y + PROJECTILE_SIZE / 2}
              radius={PROJECTILE_SIZE / 2}
              fill="yellow"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default Game; 
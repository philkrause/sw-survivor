import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';

// Types
interface Enemy {
  id: number;
  x: number;
  y: number;
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

  // Player position state
  const [playerPos, setPlayerPos] = useState({
    x: STAGE_WIDTH / 2 - PLAYER_SIZE / 2,
    y: STAGE_HEIGHT / 2 - PLAYER_SIZE / 2
  });

  // Enemy state
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [nextEnemyId, setNextEnemyId] = useState(0);

  // Projectile state
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [nextProjectileId, setNextProjectileId] = useState(0);

  // Use refs to access current state values in intervals without dependencies
  const playerPosRef = useRef(playerPos);
  const nextProjectileIdRef = useRef(nextProjectileId);

  // Update refs when state changes
  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    nextProjectileIdRef.current = nextProjectileId;
  }, [nextProjectileId]);

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

  // Update enemy positions
  const updateEnemies = useCallback(() => {
    setEnemies(prevEnemies => prevEnemies.map(enemy => {
      // Calculate direction to player
      const dx = playerPos.x - enemy.x;
      const dy = playerPos.y - enemy.y;
      
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
  }, [playerPos.x, playerPos.y]);

  // Update projectile positions
  const updateProjectiles = useCallback(() => {
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

  // Spawn enemy effect
  useEffect(() => {
    const spawnEnemy = () => {
      const spawnPos = generateSpawnPosition();
      setEnemies(prev => [...prev, {
        id: nextEnemyId,
        x: spawnPos.x,
        y: spawnPos.y
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
      updateEnemies();
      updateProjectiles();
      frameId = requestAnimationFrame(gameLoop);
    };

    frameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [updatePosition, updateEnemies, updateProjectiles]);

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
          <Rect
            x={playerPos.x}
            y={playerPos.y}
            width={PLAYER_SIZE}
            height={PLAYER_SIZE}
            fill="blue"
          />
          
          {/* Enemies */}
          {enemies.map(enemy => (
            <Rect
              key={enemy.id}
              x={enemy.x}
              y={enemy.y}
              width={ENEMY_SIZE}
              height={ENEMY_SIZE}
              fill="red"
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
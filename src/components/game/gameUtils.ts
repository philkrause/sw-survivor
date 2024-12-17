import { Position, Direction, Enemy, Projectile } from '../../types/types';
import { 
  STAGE_WIDTH, 
  STAGE_HEIGHT, 
  ENEMY_SIZE, 
  PLAYER_SIZE, 
  PROJECTILE_SIZE 
} from '../../game/constants';
import { randomRange, clamp } from '../../utils/mathUtils';

/**
 * Generate random spawn position on canvas edge
 */
export const generateSpawnPosition = (): Position => {
  const edge = Math.floor(randomRange(0, 4)); // 0: top, 1: right, 2: bottom, 3: left
  
  switch (edge) {
    case 0: // top
      return {
        x: randomRange(0, STAGE_WIDTH - ENEMY_SIZE),
        y: 0
      };
    case 1: // right
      return {
        x: STAGE_WIDTH - ENEMY_SIZE,
        y: randomRange(0, STAGE_HEIGHT - ENEMY_SIZE)
      };
    case 2: // bottom
      return {
        x: randomRange(0, STAGE_WIDTH - ENEMY_SIZE),
        y: STAGE_HEIGHT - ENEMY_SIZE
      };
    default: // left
      return {
        x: 0,
        y: randomRange(0, STAGE_HEIGHT - ENEMY_SIZE)
      };
  }
};

/**
 * Generate random direction for projectile
 */
export const generateRandomDirection = (): Direction => {
  // Generate random angle in radians
  const angle = randomRange(0, Math.PI * 2);
  
  // Convert angle to direction vector
  return {
    directionX: Math.cos(angle),
    directionY: Math.sin(angle)
  };
};

/**
 * Check for collision between two rectangles
 */
export const checkCollision = (
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

/**
 * Ensures a position stays within the game boundaries
 */
export const keepInBounds = (position: Position, entitySize: number): Position => {
  return {
    x: clamp(position.x, 0, STAGE_WIDTH - entitySize),
    y: clamp(position.y, 0, STAGE_HEIGHT - entitySize)
  };
};

/**
 * Calculates the center position of an entity
 */
export const getEntityCenter = (position: Position, entitySize: number): Position => {
  return {
    x: position.x + entitySize / 2,
    y: position.y + entitySize / 2
  };
};

/**
 * Checks if a projectile is off screen
 */
export const isOffScreen = (projectile: Projectile): boolean => {
  return (
    projectile.x < -PROJECTILE_SIZE ||
    projectile.x > STAGE_WIDTH ||
    projectile.y < -PROJECTILE_SIZE ||
    projectile.y > STAGE_HEIGHT
  );
};

/**
 * Calculates movement to approach a target
 */
export const calculateApproachVector = (
  source: Position, 
  target: Position, 
  speed: number
): { deltaX: number, deltaY: number } => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  
  // Normalize the direction vector
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance === 0) return { deltaX: 0, deltaY: 0 };
  
  const normalizedDx = dx / distance;
  const normalizedDy = dy / distance;
  
  return {
    deltaX: normalizedDx * speed,
    deltaY: normalizedDy * speed
  };
}; 
import { Position, Direction } from '../../types/types';
import { STAGE_WIDTH, STAGE_HEIGHT, ENEMY_SIZE } from '../../game/constants';

/**
 * Generate random spawn position on canvas edge
 */
export const generateSpawnPosition = (): Position => {
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

/**
 * Generate random direction for projectile
 */
export const generateRandomDirection = (): Direction => {
  // Generate random angle in radians
  const angle = Math.random() * Math.PI * 2;
  
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
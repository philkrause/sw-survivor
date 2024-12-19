import { useCallback } from 'react';
import { Enemy, Projectile } from '../../types/types';
import { PLAYER_SIZE, ENEMY_SIZE, PROJECTILE_SIZE, PROJECTILE_DAMAGE } from '../../game/constants';
import { checkCollision } from './gameUtils';

interface CollisionSystemProps {
  playerPosX: number;
  playerPosY: number;
  enemies: Enemy[];
  projectiles: Projectile[];
  damagePlayer: (damage: number) => void;
  damageEnemy: (enemyId: number, damage: number) => void;
  handleProjectileHit: (projectileId: number) => void;
  projectileDamage?: number; // Optional parameter for projectile damage
}

/**
 * Custom hook for detecting and handling collisions between game entities
 */
export const useCollisionSystem = ({
  playerPosX,
  playerPosY,
  enemies,
  projectiles,
  damagePlayer,
  damageEnemy,
  handleProjectileHit,
  projectileDamage = PROJECTILE_DAMAGE // Default to constant if not provided
}: CollisionSystemProps) => {
  
  // Check collisions between all game entities
  const checkCollisions = useCallback(() => {
    // Check player-enemy collisions
    enemies.forEach(enemy => {
      const isColliding = checkCollision(
        playerPosX, playerPosY, PLAYER_SIZE, PLAYER_SIZE,
        enemy.x, enemy.y, ENEMY_SIZE, ENEMY_SIZE
      );
      
      if (isColliding) {
        // Player takes damage on collision with enemy
        damagePlayer(1);
      }
    });
    
    // Check projectile-enemy collisions
    projectiles.forEach(projectile => {
      enemies.forEach(enemy => {
        const isColliding = checkCollision(
          projectile.x, projectile.y, PROJECTILE_SIZE, PROJECTILE_SIZE,
          enemy.x, enemy.y, ENEMY_SIZE, ENEMY_SIZE
        );
        
        if (isColliding && projectile.pierceLeft > 0) {
          // Enemy takes damage from projectile
          damageEnemy(enemy.id, projectileDamage);
          
          // Reduce projectile pierce count
          handleProjectileHit(projectile.id);
        }
      });
    });
  }, [playerPosX, playerPosY, enemies, projectiles, damagePlayer, damageEnemy, handleProjectileHit, projectileDamage]);
  
  return {
    checkCollisions
  };
}; 
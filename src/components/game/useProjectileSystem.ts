import { useState, useEffect, useRef, useCallback } from 'react';
import { Projectile, Position } from '../../types/types';
import { 
  PLAYER_SIZE, 
  PROJECTILE_SIZE, 
  PROJECTILE_SPEED, 
  ATTACK_RATE, 
  DEFAULT_PIERCE,
} from '../../game/constants';
import { generateRandomDirection, getEntityCenter, isOffScreen } from './gameUtils';
import { clamp } from '../../utils/mathUtils';

// Helper function to generate unique IDs that don't rely on React state
let globalProjectileId = 1;
const getUniqueProjectileId = () => globalProjectileId++;

/**
 * Custom hook for managing projectile creation and movement
 */
export const useProjectileSystem = (playerPosRef: React.RefObject<Position>, isGameOver: boolean) => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const projectilesRef = useRef(projectiles);
  const attackIntervalRef = useRef<number | null>(null);
  
  // Update refs when state changes
  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);
  
  // Fire projectile from player
  const fireProjectile = useCallback(() => {
    if (!playerPosRef.current || isGameOver) return;
    
    const direction = generateRandomDirection();
    const currentPlayerPos = playerPosRef.current;
    
    // Get player center position using utility function
    const playerCenter = getEntityCenter(currentPlayerPos, PLAYER_SIZE);
    
    // Create projectile at player center
    const projectileX = playerCenter.x - PROJECTILE_SIZE / 2;
    const projectileY = playerCenter.y - PROJECTILE_SIZE / 2;
    
    setProjectiles(prev => [...prev, {
      id: getUniqueProjectileId(),
      x: projectileX,
      y: projectileY,
      directionX: direction.directionX,
      directionY: direction.directionY,
      pierceLeft: DEFAULT_PIERCE
    }]);
    
    console.log('Projectile fired, ID:', globalProjectileId - 1);
  }, [playerPosRef, isGameOver]);
  
  // Update projectile positions
  const updateProjectiles = useCallback(() => {
    if (isGameOver) return;
    
    const currentProjectiles = projectilesRef.current;
    
    // Update projectiles and remove those off-screen
    const updatedProjectiles = currentProjectiles
      .map(projectile => ({
        ...projectile,
        x: projectile.x + projectile.directionX * PROJECTILE_SPEED,
        y: projectile.y + projectile.directionY * PROJECTILE_SPEED
      }))
      .filter(projectile => 
        !isOffScreen(projectile) && projectile.pierceLeft > 0
      );
    
    setProjectiles(updatedProjectiles);
  }, [isGameOver]);
  
  // Set up auto-attack
  useEffect(() => {
    console.log('Setting up projectile attack interval:', ATTACK_RATE);
    
    // Fire immediately to test
    if (!isGameOver) {
      fireProjectile();
      
      // Set up attack interval
      attackIntervalRef.current = setInterval(() => {
        console.log('Attack interval triggered');
        fireProjectile();
      }, ATTACK_RATE);
    }
    
    return () => {
      if (attackIntervalRef.current) {
        console.log('Cleaning up attack interval');
        clearInterval(attackIntervalRef.current);
        attackIntervalRef.current = null;
      }
    };
  }, [fireProjectile, isGameOver]);
  
  // Stop attacks when game is over
  useEffect(() => {
    if (isGameOver && attackIntervalRef.current) {
      clearInterval(attackIntervalRef.current);
      attackIntervalRef.current = null;
    }
  }, [isGameOver]);
  
  // Function to handle a projectile hit
  const handleProjectileHit = useCallback((projectileId: number) => {
    if (isGameOver) return;
    
    setProjectiles(prev => 
      prev.map(projectile => 
        projectile.id === projectileId
          ? { ...projectile, pierceLeft: clamp(projectile.pierceLeft - 1, 0, projectile.pierceLeft) }
          : projectile
      ).filter(projectile => projectile.pierceLeft > 0)
    );
  }, [isGameOver]);
  
  // Reset function for future use
  const resetProjectileSystem = useCallback(() => {
    setProjectiles([]);
    globalProjectileId = 1;
  }, []);
  
  return {
    projectiles,
    updateProjectiles,
    fireProjectile,
    handleProjectileHit,
    resetProjectileSystem
  };
}; 
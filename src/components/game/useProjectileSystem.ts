import { useState, useEffect, useRef, useCallback } from 'react';
import { Projectile, Position } from '../../types/types';
import { 
  PLAYER_SIZE, 
  PROJECTILE_SIZE, 
  PROJECTILE_SPEED, 
  ATTACK_INTERVAL, 
  DEFAULT_PIERCE,
  STAGE_WIDTH,
  STAGE_HEIGHT
} from '../../game/constants';
import { generateRandomDirection } from './gameUtils';

/**
 * Custom hook for managing projectile creation and movement
 */
export const useProjectileSystem = (playerPosRef: React.RefObject<Position>) => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [nextProjectileId, setNextProjectileId] = useState(0);
  
  const projectilesRef = useRef(projectiles);
  const nextProjectileIdRef = useRef(nextProjectileId);
  
  // Update refs when state changes
  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);
  
  useEffect(() => {
    nextProjectileIdRef.current = nextProjectileId;
  }, [nextProjectileId]);
  
  // Fire projectile from player
  const fireProjectile = useCallback(() => {
    if (!playerPosRef.current) return;
    
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
      directionY: direction.directionY,
      pierceLeft: DEFAULT_PIERCE
    }]);
    
    setNextProjectileId(prev => prev + 1);
  }, [playerPosRef]);
  
  // Update projectile positions
  const updateProjectiles = useCallback(() => {
    const currentProjectiles = projectilesRef.current;
    
    // Update projectiles and remove those off-screen
    const updatedProjectiles = currentProjectiles
      .map(projectile => ({
        ...projectile,
        x: projectile.x + projectile.directionX * PROJECTILE_SPEED,
        y: projectile.y + projectile.directionY * PROJECTILE_SPEED
      }))
      .filter(projectile => 
        projectile.x >= -PROJECTILE_SIZE &&
        projectile.x <= STAGE_WIDTH &&
        projectile.y >= -PROJECTILE_SIZE &&
        projectile.y <= STAGE_HEIGHT &&
        projectile.pierceLeft > 0
      );
    
    setProjectiles(updatedProjectiles);
  }, []);
  
  // Set up auto-attack
  useEffect(() => {
    const attackInterval = setInterval(fireProjectile, ATTACK_INTERVAL);
    
    return () => {
      clearInterval(attackInterval);
    };
  }, [fireProjectile]);
  
  // Function to handle a projectile hit
  const handleProjectileHit = useCallback((projectileId: number) => {
    setProjectiles(prev => 
      prev.map(projectile => 
        projectile.id === projectileId
          ? { ...projectile, pierceLeft: projectile.pierceLeft - 1 }
          : projectile
      ).filter(projectile => projectile.pierceLeft > 0)
    );
  }, []);
  
  return {
    projectiles,
    updateProjectiles,
    projectilesRef,
    fireProjectile,
    handleProjectileHit
  };
}; 
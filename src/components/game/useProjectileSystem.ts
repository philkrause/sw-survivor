import { useState, useEffect, useRef, useCallback } from 'react';
import { Projectile, Position } from '../../types/types';
import { 
  PLAYER_SIZE, 
  PROJECTILE_SIZE, 
  PROJECTILE_SPEED, 
  ATTACK_RATE, 
  DEFAULT_PIERCE,
  STAGE_WIDTH,
  STAGE_HEIGHT
} from '../../game/constants';
import { generateRandomDirection, getEntityCenter, isOffScreen } from './gameUtils';
import { clamp } from '../../utils/mathUtils';

// Helper function to generate unique IDs that don't rely on React state
let globalProjectileId = 1;
const getUniqueProjectileId = () => globalProjectileId++;

/**
 * Custom hook for managing projectile creation and movement
 */
export const useProjectileSystem = (
  playerPosRef: React.RefObject<Position>,
  isGameOver: boolean,
  attackRateRef?: React.MutableRefObject<number>,
  pierceRef?: React.MutableRefObject<number>
) => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const projectilesRef = useRef(projectiles);
  const attackIntervalRef = useRef<number | null>(null);
  const [currentAttackRate, setCurrentAttackRate] = useState(ATTACK_RATE);
  const [currentPierce, setCurrentPierce] = useState(DEFAULT_PIERCE);
  
  // Update refs when state changes
  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);
  
  // Update attack rate if provided from outside
  useEffect(() => {
    if (attackRateRef?.current) {
      setCurrentAttackRate(attackRateRef.current);
    }
  }, [attackRateRef?.current]);
  
  // Update pierce if provided from outside
  useEffect(() => {
    if (pierceRef?.current) {
      setCurrentPierce(pierceRef.current);
    }
  }, [pierceRef?.current]);
  
  // Function to update attack rate
  const updateAttackRate = useCallback((newRate: number) => {
    setCurrentAttackRate(newRate);
    
    // Clear and reset the attack interval with the new rate
    if (attackIntervalRef.current) {
      clearInterval(attackIntervalRef.current);
      attackIntervalRef.current = null;
    }
    
    if (!isGameOver) {
      attackIntervalRef.current = setInterval(() => {
        console.log(`Attack interval triggered with rate: ${newRate}ms`);
        fireProjectile();
      }, newRate);
    }
  }, [isGameOver]);
  
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
      pierceLeft: currentPierce
    }]);
    
    console.log('Projectile fired, ID:', globalProjectileId - 1);
  }, [playerPosRef, isGameOver, currentPierce]);
  
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
    console.log('Setting up projectile attack interval:', currentAttackRate);
    
    // Fire immediately to test
    if (!isGameOver) {
      fireProjectile();
      
      // Set up attack interval
      attackIntervalRef.current = setInterval(() => {
        console.log('Attack interval triggered');
        fireProjectile();
      }, currentAttackRate);
    }
    
    return () => {
      if (attackIntervalRef.current) {
        console.log('Cleaning up attack interval');
        clearInterval(attackIntervalRef.current);
        attackIntervalRef.current = null;
      }
    };
  }, [fireProjectile, isGameOver, currentAttackRate]);
  
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
    setCurrentAttackRate(ATTACK_RATE);
    setCurrentPierce(DEFAULT_PIERCE);
    globalProjectileId = 1;
  }, []);
  
  return {
    projectiles,
    updateProjectiles,
    fireProjectile,
    handleProjectileHit,
    resetProjectileSystem,
    updateAttackRate,
    currentAttackRate,
    setCurrentPierce,
    currentPierce
  };
}; 
import { useState, useEffect, useRef, useCallback } from 'react';
import { Enemy, Position } from '../../types/types';
import { ENEMY_SPEED, SPAWN_INTERVAL, ENEMY_SIZE } from '../../game/constants';
import { generateSpawnPosition } from './gameUtils';

/**
 * Custom hook for managing enemy spawning and movement
 */
export const useEnemySystem = (playerPosRef: React.RefObject<Position>) => {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [nextEnemyId, setNextEnemyId] = useState(0);
  
  const enemiesRef = useRef(enemies);
  
  // Update ref when enemies state changes
  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);
  
  // Update enemy positions based on player position
  const updateEnemies = useCallback(() => {
    if (!playerPosRef.current) return;
    
    const currentPlayerPos = playerPosRef.current;
    const currentEnemies = enemiesRef.current;
    
    // Map through enemies and update their positions
    const updatedEnemies = currentEnemies.map(enemy => {
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
    });
    
    setEnemies(updatedEnemies);
  }, [playerPosRef]);
  
  // Spawn enemies at an interval
  useEffect(() => {
    const spawnEnemy = () => {
      const spawnPos = generateSpawnPosition();
      
      setEnemies(prev => [
        ...prev,
        {
          id: nextEnemyId,
          x: spawnPos.x,
          y: spawnPos.y,
          health: 10
        }
      ]);
      
      setNextEnemyId(prev => prev + 1);
    };
    
    // Start the spawn interval
    const spawnInterval = setInterval(spawnEnemy, SPAWN_INTERVAL);
    
    // Clean up the interval on unmount
    return () => {
      clearInterval(spawnInterval);
    };
  }, [nextEnemyId]);
  
  // Function to handle enemy damage or destruction
  const damageEnemy = useCallback((enemyId: number, damage: number) => {
    setEnemies(prev => 
      prev.map(enemy => 
        enemy.id === enemyId 
          ? { ...enemy, health: enemy.health - damage } 
          : enemy
      ).filter(enemy => enemy.health > 0)
    );
  }, []);
  
  return {
    enemies,
    updateEnemies,
    enemiesRef,
    damageEnemy
  };
}; 
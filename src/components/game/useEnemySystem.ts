import { useState, useEffect, useRef, useCallback } from 'react';
import { Enemy, Position } from '../../types/types';
import { ENEMY_SPEED, ENEMY_SIZE, SPAWN_INTERVAL, ENEMY_INITIAL_HEALTH } from '../../game/constants';
import { generateSpawnPosition, calculateApproachVector } from './gameUtils';
import { clamp } from '../../utils/mathUtils';

// Helper function to generate unique IDs that don't rely on React state
let globalEnemyId = 1;
const getUniqueEnemyId = () => globalEnemyId++;

/**
 * Custom hook for managing enemy spawning and movement
 */
export const useEnemySystem = (playerPosRef: React.RefObject<Position>) => {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
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
      // Calculate approach vector using utility function
      const { deltaX, deltaY } = calculateApproachVector(
        { x: enemy.x, y: enemy.y }, 
        currentPlayerPos, 
        ENEMY_SPEED
      );
      
      // Update position
      return {
        ...enemy,
        x: enemy.x + deltaX,
        y: enemy.y + deltaY
      };
    });
    
    setEnemies(updatedEnemies);
  }, [playerPosRef]);
  
  // Function to spawn a single enemy
  const spawnEnemy = useCallback(() => {
    const spawnPos = generateSpawnPosition();
    
    setEnemies(prev => [
      ...prev,
      {
        id: getUniqueEnemyId(), // Use our stable ID generator
        x: spawnPos.x,
        y: spawnPos.y,
        health: ENEMY_INITIAL_HEALTH
      }
    ]);
    
    console.log('Enemy spawned, ID:', globalEnemyId - 1);
  }, []);
  
  // Set up the spawn interval
  useEffect(() => {
    console.log('Setting up enemy spawn interval');
    
    // Spawn first enemy immediately
    spawnEnemy();
    
    // Set up the interval
    const intervalId = window.setInterval(() => {
      console.log('Spawn interval triggered');
      spawnEnemy();
    }, SPAWN_INTERVAL);
    
    // Return cleanup function
    return () => {
      console.log('Cleaning up spawn interval');
      window.clearInterval(intervalId);
    };
  }, [spawnEnemy]); // Include spawnEnemy in dependencies
  
  // Function to handle enemy damage or destruction
  const damageEnemy = useCallback((enemyId: number, damage: number) => {
    setEnemies(prev => 
      prev.map(enemy => 
        enemy.id === enemyId 
          ? { ...enemy, health: clamp(enemy.health - damage, 0, enemy.health) } 
          : enemy
      ).filter(enemy => enemy.health > 0)
    );
  }, []);
  
  return {
    enemies,
    updateEnemies,
    damageEnemy
  };
}; 
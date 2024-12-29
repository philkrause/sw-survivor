import { useState, useEffect, useRef, useCallback } from 'react';
import { Enemy, Position } from '../../types/types';
import { ENEMY_SPEED, SPAWN_INTERVAL, ENEMY_INITIAL_HEALTH } from '../../game/constants';
import { generateSpawnPosition, calculateApproachVector } from './gameUtils';
import { clamp } from '../../utils/mathUtils';

// Helper function to generate unique IDs that don't rely on React state
let globalEnemyId = 1;
const getUniqueEnemyId = () => globalEnemyId++;

/**
 * Custom hook for managing enemy spawning and movement
 */
export const useEnemySystem = (
  playerPosRef: React.RefObject<Position>, 
  isGameOver: boolean,
  isPaused: boolean = false
) => {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const enemiesRef = useRef(enemies);
  const spawnIntervalRef = useRef<number | null>(null);
  
  // Update ref when enemies state changes
  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);
  
  // Update enemy positions based on player position
  const updateEnemies = useCallback(() => {
    if (!playerPosRef.current || isGameOver || isPaused) return;
    
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
  }, [playerPosRef, isGameOver, isPaused]);
  
  // Function to spawn a single enemy
  const spawnEnemy = useCallback(() => {
    if (isGameOver || isPaused) return;
    
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
  }, [isGameOver, isPaused]);
  
  // Set up the spawn interval
  useEffect(() => {
    console.log('Setting up enemy spawn interval');
    
    // Spawn first enemy immediately if not paused
    if (!isGameOver && !isPaused) {
      spawnEnemy();
      
      // Set up the interval
      spawnIntervalRef.current = window.setInterval(() => {
        console.log('Spawn interval triggered');
        spawnEnemy();
      }, SPAWN_INTERVAL);
    }
    
    // Return cleanup function
    return () => {
      if (spawnIntervalRef.current) {
        console.log('Cleaning up spawn interval');
        window.clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
    };
  }, [spawnEnemy, isGameOver, isPaused]);
  
  // Stop spawning when game is over or paused
  useEffect(() => {
    if ((isGameOver || isPaused) && spawnIntervalRef.current) {
      window.clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    } else if (!isGameOver && !isPaused && !spawnIntervalRef.current) {
      // Restart spawning when unpaused
      spawnIntervalRef.current = window.setInterval(() => {
        spawnEnemy();
      }, SPAWN_INTERVAL);
    }
  }, [isGameOver, isPaused, spawnEnemy]);
  
  // Function to handle enemy damage or destruction
  const damageEnemy = useCallback((enemyId: number, damage: number) => {
    if (isGameOver || isPaused) return;
    
    setEnemies(prev => {
      // Check if this enemy will be killed by the damage
      const enemyToKill = prev.find(e => e.id === enemyId && e.health <= damage);
      
      // If we're killing an enemy, increase the score
      if (enemyToKill) {
        setScore(prevScore => prevScore + 1);
      }
      
      return prev.map(enemy => 
        enemy.id === enemyId 
          ? { ...enemy, health: clamp(enemy.health - damage, 0, enemy.health) } 
          : enemy
      ).filter(enemy => enemy.health > 0);
    });
  }, [isGameOver, isPaused]);
  
  // Reset function for future use
  const resetEnemySystem = useCallback(() => {
    setEnemies([]);
    setScore(0);
    globalEnemyId = 1;
  }, []);
  
  return {
    enemies,
    updateEnemies,
    damageEnemy,
    score,
    resetEnemySystem
  };
}; 
import { useState, useEffect, useRef, useCallback } from 'react';
import { Position } from '../../types/types';
import { 
  MOVEMENT_SPEED, 
  PLAYER_SIZE, 
  STAGE_WIDTH, 
  STAGE_HEIGHT,
  PLAYER_INITIAL_HEALTH,
  PLAYER_X,
  PLAYER_Y
} from '../../game/constants';

/**
 * Custom hook for managing player position and health
 */
export const usePlayerSystem = (keys: { [key: string]: boolean }) => {
  // Player position and health state
  const [playerPos, setPlayerPos] = useState<Position>({
    x: PLAYER_X,
    y: PLAYER_Y
  });
  const [playerHealth, setPlayerHealth] = useState(PLAYER_INITIAL_HEALTH);
  
  const playerPosRef = useRef(playerPos);
  
  // Update ref when position changes
  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);
  
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
  
  // Function to damage the player
  const damagePlayer = useCallback((damage: number) => {
    setPlayerHealth(prev => Math.max(0, prev - damage));
  }, []);
  
  return {
    playerPos,
    playerHealth,
    playerPosRef,
    updatePosition,
    damagePlayer
  };
}; 
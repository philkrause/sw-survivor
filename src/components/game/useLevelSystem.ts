import { useState, useEffect, useCallback, useRef } from 'react';
import { Upgrade } from '../../types/types';
import { LEVEL_UP_THRESHOLD, PLAYER_SPEED_UPGRADE, ATTACK_RATE_UPGRADE } from '../../game/constants';

interface LevelSystemProps {
  score: number;
  onUpgradeAttackSpeed: () => void;
  onUpgradePlayerSpeed: () => void;
}

/**
 * Custom hook for managing player level and upgrades
 */
export const useLevelSystem = ({ score, onUpgradeAttackSpeed, onUpgradePlayerSpeed }: LevelSystemProps) => {
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [killsNeededForNextLevel, setKillsNeededForNextLevel] = useState(LEVEL_UP_THRESHOLD);
  const lastProcessedScore = useRef(0);
  
  // Define available upgrades
  const generateUpgrades = useCallback(() => {
    return [
      {
        id: 'attack-speed',
        name: 'Increase Attack Speed',
        description: `Decrease attack interval by ${ATTACK_RATE_UPGRADE}ms`,
        apply: onUpgradeAttackSpeed
      },
      {
        id: 'player-speed',
        name: 'Increase Movement Speed',
        description: `Increase movement speed by ${PLAYER_SPEED_UPGRADE}`,
        apply: onUpgradePlayerSpeed
      }
    ] as Upgrade[];
  }, [onUpgradeAttackSpeed, onUpgradePlayerSpeed]);
  
  // Check for level up
  useEffect(() => {
    // Only process level-up when the score has changed and is at or above the threshold
    if (score > lastProcessedScore.current && score >= killsNeededForNextLevel && !showLevelUp) {
      setShowLevelUp(true);
      lastProcessedScore.current = score;
    }
  }, [score, killsNeededForNextLevel, showLevelUp]);
  
  // Handle upgrade selection
  const handleSelectUpgrade = useCallback((upgrade: Upgrade) => {
    // Apply the upgrade
    upgrade.apply();
    
    // Level up
    setLevel(level => level + 1);
    
    // Set kills needed for next level with a scaling factor based on level
    // This makes later levels require more kills to level up
    setKillsNeededForNextLevel(prevThreshold => {
      // Calculate next threshold to be higher than current score
      // Ensure at least LEVEL_UP_THRESHOLD enemies need to be killed
      const baseIncrease = Math.max(LEVEL_UP_THRESHOLD, Math.floor(level * 1.5));
      return Math.max(score + 1, prevThreshold + baseIncrease);
    });
    
    // Hide level up UI
    setShowLevelUp(false);
  }, [level, score]);
  
  return {
    level,
    showLevelUp,
    upgrades: generateUpgrades(),
    handleSelectUpgrade
  };
}; 
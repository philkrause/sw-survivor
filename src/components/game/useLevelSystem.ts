import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing player levels and upgrades
 */
export const useLevelSystem = (
  score: number,
  onApplyUpgrade: (type: string, value: number) => void
) => {
  const [level, setLevel] = useState(1);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [enemiesKilledSinceLastLevel, setEnemiesKilledSinceLastLevel] = useState(0);
  const [levelUpChoices, setLevelUpChoices] = useState<{ type: string, label: string, value: number }[]>([]);

  // The number of enemies needed to level up (starts at 1 and increases with each level)
  const getRequiredKills = useCallback(() => {
    return Math.max(1, Math.floor(level * 1.5));
  }, [level]);

  // Check if player should level up based on score
  useEffect(() => {
    const requiredKills = getRequiredKills();
    
    if (score > 0 && score > enemiesKilledSinceLastLevel) {
      const newEnemiesKilled = score - enemiesKilledSinceLastLevel;
      
      if (newEnemiesKilled >= requiredKills) {
        // Player has killed enough enemies to level up
        setIsLevelingUp(true);
        setEnemiesKilledSinceLastLevel(score);
        
        // Generate level up choices
        generateLevelUpChoices();
      }
    }
  }, [score, enemiesKilledSinceLastLevel, getRequiredKills]);

  // Generate random level up choices
  const generateLevelUpChoices = useCallback(() => {
    // Define possible upgrades
    const possibleUpgrades = [
      { type: 'attackSpeed', label: 'Increase Attack Speed', value: 50 }, // Reduce attack interval by 50ms
      { type: 'moveSpeed', label: 'Increase Movement Speed', value: 0.5 }, // Increase movement speed by 0.5
      { type: 'projectileDamage', label: 'Increase Damage', value: 2 }, // Increase projectile damage by 2
      { type: 'pierce', label: 'Increase Pierce', value: 1 }, // Increase pierce by 1
      { type: 'health', label: 'Increase Max Health', value: 20 } // Increase max health by 20
    ];

    // Randomly select 2 different upgrades
    const shuffled = [...possibleUpgrades].sort(() => 0.5 - Math.random());
    setLevelUpChoices(shuffled.slice(0, 2));
  }, []);

  // Handle when player selects an upgrade
  const selectUpgrade = useCallback((type: string, value: number) => {
    // Apply the upgrade
    onApplyUpgrade(type, value);
    
    // Increment level
    setLevel(level + 1);
    
    // Close level up UI
    setIsLevelingUp(false);
  }, [onApplyUpgrade, level]);

  return {
    level,
    isLevelingUp,
    levelUpChoices,
    selectUpgrade,
    enemiesKilledSinceLastLevel
  };
}; 
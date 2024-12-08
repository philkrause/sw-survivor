import React from 'react';
import { Circle, Group, Rect } from 'react-konva';
import { ENEMY_SIZE } from '../game/constants';

interface EnemyProps {
  x: number;
  y: number;
  health: number;
}

/**
 * Enemy component - will handle enemy rendering and behavior
 * This is just a placeholder for the future implementation
 */
const Enemy: React.FC<EnemyProps> = ({ x, y, health }) => {
  const HEALTH_BAR_HEIGHT = 5;
  const MAX_HEALTH = 10; // Maximum enemy health
  
  return (
    <Group>
      <Circle
        x={x + ENEMY_SIZE / 2}
        y={y + ENEMY_SIZE / 2}
        radius={ENEMY_SIZE / 2}
        fill="red"
        stroke="black"
        strokeWidth={2}
      />
      
      {/* Health bar background */}
      <Rect
        x={x}
        y={y + ENEMY_SIZE + 5}
        width={ENEMY_SIZE}
        height={HEALTH_BAR_HEIGHT}
        fill="gray"
      />
      
      {/* Health bar */}
      <Rect
        x={x}
        y={y + ENEMY_SIZE + 5}
        width={(health / MAX_HEALTH) * ENEMY_SIZE}
        height={HEALTH_BAR_HEIGHT}
        fill="red"
      />
    </Group>
  );
};

export default Enemy; 
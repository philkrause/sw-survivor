import React from 'react';
import { Group, Rect } from 'react-konva';
import { HEALTH_BAR_HEIGHT } from '../../game/constants';

interface HealthBarProps {
  x: number;
  y: number;
  width: number;
  currentHealth: number;
  maxHealth: number;
  barColor: string;
}

/**
 * Reusable health bar component for game entities
 */
const HealthBar: React.FC<HealthBarProps> = ({
  x,
  y,
  width,
  currentHealth,
  maxHealth,
  barColor
}) => {
  const healthPercentage = Math.max(0, Math.min(1, currentHealth / maxHealth));
  
  return (
    <Group>
      {/* Health bar background */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={HEALTH_BAR_HEIGHT}
        fill="rgba(0, 0, 0, 0.5)"
        cornerRadius={2}
      />
      
      {/* Health bar fill */}
      <Rect
        x={x}
        y={y}
        width={healthPercentage * width}
        height={HEALTH_BAR_HEIGHT}
        fill={barColor}
        cornerRadius={2}
      />
    </Group>
  );
};

export default HealthBar; 
import React from 'react';
import { Circle } from 'react-konva';
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
const Enemy: React.FC<EnemyProps> = ({ x, y, health: _ }) => {
  return (
    <Circle
      x={x}
      y={y}
      radius={ENEMY_SIZE / 2}
      fill="red"
      stroke="black"
      strokeWidth={2}
    />
  );
};

export default Enemy; 
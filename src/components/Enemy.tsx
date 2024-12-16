import React from 'react';
import { Group, Circle, Rect, Line } from 'react-konva';
import { ENEMY_SIZE, HEALTH_BAR_HEIGHT, MAX_ENEMY_HEALTH } from '../game/constants';
import { EnemyProps } from '../types/types';

/**
 * Enemy component - will handle enemy rendering and behavior
 */
const Enemy: React.FC<EnemyProps> = ({ x, y, health }) => {
  const centerX = x + ENEMY_SIZE / 2;
  const centerY = y + ENEMY_SIZE / 2;
  
  return (
    <Group>
      {/* Wasp wings */}
      <Circle
        x={centerX - ENEMY_SIZE/3}
        y={centerY - ENEMY_SIZE/4}
        radius={ENEMY_SIZE/4}
        fill="rgba(255, 255, 255, 0.5)"
        opacity={0.7}
      />
      <Circle
        x={centerX + ENEMY_SIZE/3}
        y={centerY - ENEMY_SIZE/4}
        radius={ENEMY_SIZE/4}
        fill="rgba(255, 255, 255, 0.5)"
        opacity={0.7}
      />
      
      {/* Wasp body */}
      <Circle
        x={centerX}
        y={centerY}
        radius={ENEMY_SIZE / 2}
        fill="#d32f2f" // Flat red color instead of gradient
        stroke="#000000"
        strokeWidth={2}
      />
      
      {/* Wasp stripes */}
      <Line
        points={[
          centerX - ENEMY_SIZE/2, centerY - ENEMY_SIZE/6,
          centerX + ENEMY_SIZE/2, centerY - ENEMY_SIZE/6
        ]}
        stroke="#000000"
        strokeWidth={3}
      />
      <Line
        points={[
          centerX - ENEMY_SIZE/2, centerY + ENEMY_SIZE/8,
          centerX + ENEMY_SIZE/2, centerY + ENEMY_SIZE/8
        ]}
        stroke="#000000"
        strokeWidth={3}
      />
      <Line
        points={[
          centerX - ENEMY_SIZE/2, centerY + ENEMY_SIZE/3,
          centerX + ENEMY_SIZE/2, centerY + ENEMY_SIZE/3
        ]}
        stroke="#000000"
        strokeWidth={3}
      />
      
      {/* Wasp face (eyes) */}
      <Circle
        x={centerX - ENEMY_SIZE/6}
        y={centerY - ENEMY_SIZE/8}
        radius={ENEMY_SIZE/10}
        fill="#ffff00"
      />
      <Circle
        x={centerX + ENEMY_SIZE/6}
        y={centerY - ENEMY_SIZE/8}
        radius={ENEMY_SIZE/10}
        fill="#ffff00"
      />
      
      {/* Stinger */}
      <Line
        points={[
          centerX, centerY + ENEMY_SIZE/2,
          centerX, centerY + ENEMY_SIZE/1.2
        ]}
        stroke="#000000"
        strokeWidth={2}
        lineCap="round"
      />
      
      {/* Health bar background */}
      <Rect
        x={x}
        y={y + ENEMY_SIZE + 15}
        width={ENEMY_SIZE}
        height={HEALTH_BAR_HEIGHT}
        fill="rgba(0, 0, 0, 0.5)"
        cornerRadius={2}
      />
      
      {/* Health bar */}
      <Rect
        x={x}
        y={y + ENEMY_SIZE + 15}
        width={(health / MAX_ENEMY_HEALTH) * ENEMY_SIZE}
        height={HEALTH_BAR_HEIGHT}
        fill="#f44336"
        cornerRadius={2}
      />
    </Group>
  );
};

export default Enemy; 
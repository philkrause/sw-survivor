import React from 'react';
import { Group, Circle, Line } from 'react-konva';
import { ENEMY_SIZE, ENEMY_INITIAL_HEALTH } from '../game/constants';
import { EnemyProps } from '../types/types';
import HealthBar from './ui/HealthBar';
import { calculateEntityCenter, calculateHealthBarPosition, generateRelativeLine } from '../utils/renderUtils';

/**
 * Enemy component - will handle enemy rendering and behavior
 */
const Enemy: React.FC<EnemyProps> = ({ x, y, health }) => {
  const { x: centerX, y: centerY } = calculateEntityCenter(x, y, ENEMY_SIZE);
  const healthBarPos = calculateHealthBarPosition(x, y, ENEMY_SIZE);
  
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
        points={generateRelativeLine(
          centerX, centerY,
          -ENEMY_SIZE/2, -ENEMY_SIZE/6,
          ENEMY_SIZE/2, -ENEMY_SIZE/6
        )}
        stroke="#000000"
        strokeWidth={3}
      />
      <Line
        points={generateRelativeLine(
          centerX, centerY,
          -ENEMY_SIZE/2, ENEMY_SIZE/8,
          ENEMY_SIZE/2, ENEMY_SIZE/8
        )}
        stroke="#000000"
        strokeWidth={3}
      />
      <Line
        points={generateRelativeLine(
          centerX, centerY,
          -ENEMY_SIZE/2, ENEMY_SIZE/3,
          ENEMY_SIZE/2, ENEMY_SIZE/3
        )}
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
        points={generateRelativeLine(
          centerX, centerY,
          0, ENEMY_SIZE/2,
          0, ENEMY_SIZE/1.2
        )}
        stroke="#000000"
        strokeWidth={2}
        lineCap="round"
      />
      
      {/* Health bar */}
      <HealthBar
        x={healthBarPos.x}
        y={healthBarPos.y}
        width={ENEMY_SIZE}
        currentHealth={health}
        maxHealth={ENEMY_INITIAL_HEALTH}
        barColor="#f44336"
      />
    </Group>
  );
};

export default Enemy; 
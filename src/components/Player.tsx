import React from 'react';
import { Group, Circle, Line } from 'react-konva';
import { PLAYER_SIZE, PLAYER_INITIAL_HEALTH } from '../game/constants';
import { PlayerProps } from '../types/types';
import HealthBar from './ui/HealthBar';
import { calculateEntityCenter, calculateHealthBarPosition, generateRelativeLine } from '../utils/renderUtils';

/**
 * Player component - will handle player rendering and movement
 */
const Player: React.FC<PlayerProps> = ({ x, y, health }) => {
  const { x: centerX, y: centerY } = calculateEntityCenter(x, y, PLAYER_SIZE);
  const healthBarPos = calculateHealthBarPosition(x, y, PLAYER_SIZE);
  
  return (
    <Group>
      {/* Bee wings */}
      <Circle
        x={centerX - PLAYER_SIZE/3}
        y={centerY - PLAYER_SIZE/3}
        radius={PLAYER_SIZE/3}
        fill="rgba(255, 255, 255, 0.7)"
        stroke="rgba(255, 255, 255, 0.8)"
        opacity={0.7}
      />
      <Circle
        x={centerX + PLAYER_SIZE/3}
        y={centerY - PLAYER_SIZE/3}
        radius={PLAYER_SIZE/3}
        fill="rgba(255, 255, 255, 0.7)"
        stroke="rgba(255, 255, 255, 0.8)"
        opacity={0.7}
      />
      
      {/* Bee body */}
      <Circle
        x={centerX}
        y={centerY}
        radius={PLAYER_SIZE / 2}
        fill="#f7c33b"
        stroke="#000000"
        strokeWidth={2}
      />
      
      {/* Bee stripes */}
      <Line
        points={generateRelativeLine(
          centerX, centerY,
          -PLAYER_SIZE/2, -PLAYER_SIZE/5,
          PLAYER_SIZE/2, -PLAYER_SIZE/5
        )}
        stroke="#000000"
        strokeWidth={4}
      />
      <Line
        points={generateRelativeLine(
          centerX, centerY,
          -PLAYER_SIZE/2, PLAYER_SIZE/8,
          PLAYER_SIZE/2, PLAYER_SIZE/8
        )}
        stroke="#000000"
        strokeWidth={4}
      />
      
      {/* Bee face (eyes) */}
      <Circle
        x={centerX - PLAYER_SIZE/6}
        y={centerY - PLAYER_SIZE/8}
        radius={PLAYER_SIZE/10}
        fill="#000000"
      />
      <Circle
        x={centerX + PLAYER_SIZE/6}
        y={centerY - PLAYER_SIZE/8}
        radius={PLAYER_SIZE/10}
        fill="#000000"
      />
      
      {/* Stinger */}
      <Line
        points={generateRelativeLine(
          centerX, centerY,
          0, PLAYER_SIZE/2,
          0, PLAYER_SIZE/1.3
        )}
        stroke="#000000"
        strokeWidth={2}
        lineCap="round"
      />
      
      {/* Health bar */}
      <HealthBar
        x={healthBarPos.x}
        y={healthBarPos.y}
        width={PLAYER_SIZE}
        currentHealth={health}
        maxHealth={PLAYER_INITIAL_HEALTH}
        barColor="#4CAF50"
      />
    </Group>
  );
};

export default Player; 
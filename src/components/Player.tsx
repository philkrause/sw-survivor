import React from 'react';
import { Group, Circle, Rect, Line } from 'react-konva';
import { PLAYER_SIZE, HEALTH_BAR_HEIGHT } from '../game/constants';
import { PlayerProps } from '../types/types';

/**
 * Player component - will handle player rendering and movement
 */
const Player: React.FC<PlayerProps> = ({ x, y, health }) => {
  const centerX = x + PLAYER_SIZE / 2;
  const centerY = y + PLAYER_SIZE / 2;
  
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
        points={[
          centerX - PLAYER_SIZE/2, centerY - PLAYER_SIZE/5,
          centerX + PLAYER_SIZE/2, centerY - PLAYER_SIZE/5
        ]}
        stroke="#000000"
        strokeWidth={4}
      />
      <Line
        points={[
          centerX - PLAYER_SIZE/2, centerY + PLAYER_SIZE/8,
          centerX + PLAYER_SIZE/2, centerY + PLAYER_SIZE/8
        ]}
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
        points={[
          centerX, centerY + PLAYER_SIZE/2,
          centerX, centerY + PLAYER_SIZE/1.3
        ]}
        stroke="#000000"
        strokeWidth={2}
        lineCap="round"
      />
      
      {/* Health bar background */}
      <Rect
        x={x}
        y={y + PLAYER_SIZE + 15}
        width={PLAYER_SIZE}
        height={HEALTH_BAR_HEIGHT}
        fill="rgba(0, 0, 0, 0.5)"
        cornerRadius={2}
      />
      
      {/* Health bar */}
      <Rect
        x={x}
        y={y + PLAYER_SIZE + 15}
        width={(health / 100) * PLAYER_SIZE}
        height={HEALTH_BAR_HEIGHT}
        fill="#4CAF50"
        cornerRadius={2}
      />
    </Group>
  );
};

export default Player; 
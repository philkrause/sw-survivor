import React from 'react';
import { Circle } from 'react-konva';
import { PLAYER_SIZE } from '../game/constants';

interface PlayerProps {
  x: number;
  y: number;
  health: number;
}

/**
 * Player component - will handle player rendering and movement
 * This is just a placeholder for the future implementation
 */
const Player: React.FC<PlayerProps> = ({ x, y, health: _ }) => {
  return (
    <Circle
      x={x}
      y={y}
      radius={PLAYER_SIZE / 2}
      fill="blue"
      stroke="white"
      strokeWidth={2}
    />
  );
};

export default Player; 
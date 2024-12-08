import React from 'react';
import { Circle, Group, Rect } from 'react-konva';
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
const Player: React.FC<PlayerProps> = ({ x, y, health }) => {
  const HEALTH_BAR_HEIGHT = 5;
  
  return (
    <Group>
      <Circle
        x={x + PLAYER_SIZE / 2}
        y={y + PLAYER_SIZE / 2}
        radius={PLAYER_SIZE / 2}
        fill="blue"
        stroke="white"
        strokeWidth={2}
      />
      
      {/* Health bar background */}
      <Rect
        x={x}
        y={y + PLAYER_SIZE + 5}
        width={PLAYER_SIZE}
        height={HEALTH_BAR_HEIGHT}
        fill="gray"
      />
      
      {/* Health bar */}
      <Rect
        x={x}
        y={y + PLAYER_SIZE + 5}
        width={(health / 100) * PLAYER_SIZE}
        height={HEALTH_BAR_HEIGHT}
        fill="green"
      />
    </Group>
  );
};

export default Player; 
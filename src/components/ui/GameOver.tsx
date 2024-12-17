import React from 'react';
import { Text, Group, Rect } from 'react-konva';
import { GameOverProps } from '../../types/types';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../../game/constants';

/**
 * Component to display Game Over screen
 */
const GameOver: React.FC<GameOverProps> = ({ visible }) => {
  if (!visible) return null;

  const overlayWidth = STAGE_WIDTH;
  const overlayHeight = STAGE_HEIGHT;
  const messageWidth = 400;
  const messageHeight = 100;
  
  const overlayX = 0;
  const overlayY = 0;
  const messageX = STAGE_WIDTH / 2 - messageWidth / 2;
  const messageY = STAGE_HEIGHT / 2 - messageHeight / 2;
  
  return (
    <Group>
      {/* Semi-transparent overlay */}
      <Rect
        x={overlayX}
        y={overlayY}
        width={overlayWidth}
        height={overlayHeight}
        fill="black"
        opacity={0.7}
      />
      
      {/* Game Over container */}
      <Rect
        x={messageX}
        y={messageY}
        width={messageWidth}
        height={messageHeight}
        fill="#d32f2f"
        shadowColor="black"
        shadowBlur={5}
        shadowOffsetX={3}
        shadowOffsetY={3}
        cornerRadius={10}
      />
      
      {/* Game Over text */}
      <Text
        x={messageX}
        y={messageY + 20}
        width={messageWidth}
        height={messageHeight - 40}
        text="GAME OVER"
        fontSize={36}
        fontFamily="Arial"
        fontStyle="bold"
        fill="white"
        align="center"
        verticalAlign="middle"
      />
      
      {/* Instruction text */}
      <Text
        x={messageX}
        y={messageY + 60}
        width={messageWidth}
        height={40}
        text="Refresh to play again"
        fontSize={16}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

export default GameOver; 
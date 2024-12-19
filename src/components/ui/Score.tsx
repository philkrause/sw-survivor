import React from 'react';
import { Text, Group, Rect } from 'react-konva';
import { ScoreProps } from '../../types/types';

/**
 * Component to display the player's score
 */
const Score: React.FC<ScoreProps> = ({ score, level = 1 }) => {
  const padding = 10;
  const width = 120;
  const height = 40;
  const x = padding;
  const y = padding;
  
  return (
    <Group>
      {/* Score background */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#222222"
        opacity={0.7}
        cornerRadius={5}
      />
      
      {/* Score text */}
      <Text
        x={x + padding}
        y={y}
        width={width - padding * 2}
        height={height}
        text={`Score: ${score}`}
        fontSize={18}
        fontFamily="Arial"
        fontStyle="bold"
        fill="#f7c33b" /* Bee/honey color */
        align="left"
        verticalAlign="middle"
      />
      
      {/* Level text */}
      <Text
        x={x + padding}
        y={y + 20}
        width={width - padding * 2}
        height={height}
        text={`Level: ${level}`}
        fontSize={18}
        fontFamily="Arial"
        fontStyle="bold"
        fill="#f7c33b" /* Bee/honey color */
        align="left"
        verticalAlign="middle"
      />
    </Group>
  );
};

export default Score; 
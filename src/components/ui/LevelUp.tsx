import React from 'react';
import { Text, Group, Rect } from 'react-konva';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../../game/constants';

interface LevelUpProps {
  visible: boolean;
  choices: { type: string; label: string; value: number }[];
  onSelect: (type: string, value: number) => void;
}

const LevelUp: React.FC<LevelUpProps> = ({ visible, choices, onSelect }) => {
  if (!visible) return null;

  // Calculate positioning for the UI elements
  const modalWidth = 400;
  const modalHeight = 300;
  const modalX = (STAGE_WIDTH - modalWidth) / 2;
  const modalY = (STAGE_HEIGHT - modalHeight) / 2;

  // Handle click on an upgrade choice
  const handleClick = (type: string, value: number) => {
    onSelect(type, value);
  };

  return (
    <Group>
      {/* Semi-transparent overlay */}
      <Rect
        x={0}
        y={0}
        width={STAGE_WIDTH}
        height={STAGE_HEIGHT}
        fill="black"
        opacity={0.7}
      />

      {/* Modal background */}
      <Rect
        x={modalX}
        y={modalY}
        width={modalWidth}
        height={modalHeight}
        fill="#222"
        stroke="#ccc"
        strokeWidth={2}
        cornerRadius={5}
      />

      {/* Title */}
      <Text
        x={modalX}
        y={modalY + 20}
        width={modalWidth}
        text="LEVEL UP!"
        fontSize={28}
        fontStyle="bold"
        fill="#FFD700" // Gold color
        align="center"
      />

      {/* Subtitle */}
      <Text
        x={modalX}
        y={modalY + 60}
        width={modalWidth}
        text="Choose an upgrade:"
        fontSize={18}
        fill="#fff"
        align="center"
      />

      {/* Choice 1 Button */}
      <Group
        x={modalX + 50}
        y={modalY + 110}
        width={modalWidth - 100}
        height={50}
        onClick={() => handleClick(choices[0].type, choices[0].value)}
      >
        <Rect
          width={modalWidth - 100}
          height={50}
          fill="#444"
          stroke="#888"
          strokeWidth={1}
          cornerRadius={5}
        />
        <Text
          width={modalWidth - 100}
          height={50}
          text={choices[0].label}
          fontSize={16}
          fill="#fff"
          align="center"
          verticalAlign="middle"
        />
      </Group>

      {/* Choice 2 Button */}
      <Group
        x={modalX + 50}
        y={modalY + 180}
        width={modalWidth - 100}
        height={50}
        onClick={() => handleClick(choices[1].type, choices[1].value)}
      >
        <Rect
          width={modalWidth - 100}
          height={50}
          fill="#444"
          stroke="#888"
          strokeWidth={1}
          cornerRadius={5}
        />
        <Text
          width={modalWidth - 100}
          height={50}
          text={choices[1].label}
          fontSize={16}
          fill="#fff"
          align="center"
          verticalAlign="middle"
        />
      </Group>
    </Group>
  );
};

export default LevelUp; 
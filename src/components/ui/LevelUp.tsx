import React from 'react';
import { Text, Group, Rect } from 'react-konva';
import { LevelUpProps, Upgrade } from '../../types/types';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../../game/constants';

/**
 * Component to display level-up choices
 */
const LevelUp: React.FC<LevelUpProps> = ({ visible, upgrades, onSelect }) => {
  if (!visible || !upgrades.length) return null;

  const containerWidth = 500;
  const containerHeight = 300;
  const containerX = STAGE_WIDTH / 2 - containerWidth / 2;
  const containerY = STAGE_HEIGHT / 2 - containerHeight / 2;
  
  const titleHeight = 60;
  const choiceHeight = 100;
  const choiceWidth = containerWidth - 40;
  const gap = 20;
  
  const handleTouchStart = (upgrade: Upgrade) => {
    onSelect(upgrade);
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
      
      {/* Level-up container */}
      <Rect
        x={containerX}
        y={containerY}
        width={containerWidth}
        height={containerHeight}
        fill="#333333"
        shadowColor="black"
        shadowBlur={10}
        shadowOffsetX={5}
        shadowOffsetY={5}
        cornerRadius={10}
      />
      
      {/* Title */}
      <Rect
        x={containerX}
        y={containerY}
        width={containerWidth}
        height={titleHeight}
        fill="#f7c33b" // Bee/honey color
        cornerRadius={[10, 10, 0, 0]}
      />
      
      <Text
        x={containerX}
        y={containerY}
        width={containerWidth}
        height={titleHeight}
        text="LEVEL UP!"
        fontSize={30}
        fontFamily="Arial"
        fontStyle="bold"
        fill="#333333"
        align="center"
        verticalAlign="middle"
      />
      
      {/* Choices */}
      {upgrades.map((upgrade, index) => {
        const choiceY = containerY + titleHeight + gap + (choiceHeight + gap) * index;
        
        return (
          <Group key={upgrade.id} onClick={() => handleTouchStart(upgrade)}>
            <Rect
              x={containerX + 20}
              y={choiceY}
              width={choiceWidth}
              height={choiceHeight}
              fill="#4a4a4a"
              cornerRadius={5}
              shadowColor="black"
              shadowBlur={5}
              shadowOffsetX={2}
              shadowOffsetY={2}
              onTap={() => handleTouchStart(upgrade)}
            />
            
            <Text
              x={containerX + 40}
              y={choiceY + 15}
              width={choiceWidth - 40}
              text={upgrade.name}
              fontSize={22}
              fontFamily="Arial"
              fontStyle="bold"
              fill="#f7c33b" // Bee/honey color
            />
            
            <Text
              x={containerX + 40}
              y={choiceY + 45}
              width={choiceWidth - 40}
              text={upgrade.description}
              fontSize={16}
              fontFamily="Arial"
              fill="#ffffff"
            />
          </Group>
        );
      })}
    </Group>
  );
};

export default LevelUp; 
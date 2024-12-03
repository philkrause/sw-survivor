import { Stage, Layer, Rect } from 'react-konva';

const GameCanvas: React.FC = () => {
  // Stage dimensions
  const STAGE_WIDTH = 1024;
  const STAGE_HEIGHT = 768;
  
  // Player dimensions and position
  const PLAYER_SIZE = 32;
  const PLAYER_X = STAGE_WIDTH / 2 - PLAYER_SIZE / 2;  // Center X
  const PLAYER_Y = STAGE_HEIGHT / 2 - PLAYER_SIZE / 2; // Center Y

  return (
    <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT}>
      <Layer>
        <Rect
          x={PLAYER_X}
          y={PLAYER_Y}
          width={PLAYER_SIZE}
          height={PLAYER_SIZE}
          fill="blue"
        />
      </Layer>
    </Stage>
  );
};

export default GameCanvas; 
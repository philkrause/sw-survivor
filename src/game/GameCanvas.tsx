import { Stage, Layer, Rect } from 'react-konva';
import { STAGE_WIDTH, STAGE_HEIGHT, PLAYER_SIZE, PLAYER_X, PLAYER_Y } from './constants';

const GameCanvas: React.FC = () => {
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
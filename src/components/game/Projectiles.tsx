import React from 'react';
import { Circle } from 'react-konva';
import { Projectile } from '../../types/types';
import { PROJECTILE_SIZE } from '../../game/constants';

interface ProjectilesProps {
  projectiles: Projectile[];
}

/**
 * Component for rendering all projectiles
 */
const Projectiles: React.FC<ProjectilesProps> = ({ projectiles }) => {
  return (
    <>
      {projectiles.map(projectile => (
        <React.Fragment key={projectile.id}>
          {/* Glow effect */}
          <Circle
            x={projectile.x + PROJECTILE_SIZE / 2}
            y={projectile.y + PROJECTILE_SIZE / 2}
            radius={PROJECTILE_SIZE * 1.2}
            fill="rgba(247, 195, 59, 0.2)"
          />
          {/* Main projectile */}
          <Circle
            x={projectile.x + PROJECTILE_SIZE / 2}
            y={projectile.y + PROJECTILE_SIZE / 2}
            radius={PROJECTILE_SIZE / 2}
            fill="#f7c33b" /* Honey color */
          />
        </React.Fragment>
      ))}
    </>
  );
};

export default Projectiles; 
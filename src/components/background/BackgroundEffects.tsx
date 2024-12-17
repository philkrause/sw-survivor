import React from 'react';
import GlowOrbs from './GlowOrbs';
import OrbContainer from './OrbContainer';
import NoiseOverlay from './NoiseOverlay';

/**
 * Component that combines all background visual effects
 * Replaces the DOM manipulation in the original App.tsx
 */
const BackgroundEffects: React.FC = () => {
  return (
    <>
      <GlowOrbs />
      <OrbContainer />
      <NoiseOverlay variant={1} />
      <NoiseOverlay variant={2} />
    </>
  );
};

export default BackgroundEffects; 
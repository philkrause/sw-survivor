import { useEffect, useRef } from 'react';

/**
 * Custom hook for managing the game loop
 */
export const useGameLoop = (callbacks: (() => void)[]) => {
  // Store refs to callback functions
  const callbackRefs = useRef<(() => void)[]>([]);
  
  // Update the callback refs when dependencies change
  useEffect(() => {
    callbackRefs.current = callbacks;
  }, [callbacks]);
  
  // Set up the game loop
  useEffect(() => {
    let frameId: number;
    
    const gameLoop = () => {
      // Execute all registered callback functions
      callbackRefs.current.forEach(callback => callback());
      
      // Request the next animation frame
      frameId = requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    frameId = requestAnimationFrame(gameLoop);
    
    // Clean up when component unmounts
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []); // Empty dependency array since we're using refs
}; 
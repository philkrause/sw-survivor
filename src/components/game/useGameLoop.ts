import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing the game loop
 */
export const useGameLoop = (callbacks: (() => void)[], isPaused: boolean = false) => {
  const callbackRefs = useRef<(() => void)[]>([]);
  const frameIdRef = useRef<number | null>(null);
  
  // Update the callback refs when dependencies change
  useEffect(() => {
    callbackRefs.current = callbacks;
  }, [callbacks]);
  
  // Game loop function
  const runGameLoop = useCallback(() => {
    // Execute all registered callback functions
    callbackRefs.current.forEach(callback => callback());
    
    // Request the next animation frame
    frameIdRef.current = requestAnimationFrame(runGameLoop);
  }, []);
  
  // Handle pausing and resuming
  useEffect(() => {
    if (isPaused) {
      // Pause the game loop
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    } else {
      // Resume the game loop if not already running
      if (frameIdRef.current === null) {
        frameIdRef.current = requestAnimationFrame(runGameLoop);
      }
    }
  }, [isPaused, runGameLoop]);
  
  // Set up the game loop
  useEffect(() => {
    // Start the game loop (unless initially paused)
    if (!isPaused) {
      frameIdRef.current = requestAnimationFrame(runGameLoop);
    }
    
    // Clean up when component unmounts
    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, [isPaused, runGameLoop]); // Re-run if isPaused changed
}; 
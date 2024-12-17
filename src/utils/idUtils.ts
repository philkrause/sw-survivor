import { useState } from 'react';

/**
 * Hook for generating unique IDs
 * @param initialId Starting ID value (default: 0)
 * @returns An object with the current ID and a function to get the next ID
 */
export const useIdGenerator = (initialId: number = 0) => {
  const [nextId, setNextId] = useState(initialId);
  
  const getNextId = (): number => {
    const id = nextId;
    setNextId(prev => prev + 1);
    return id;
  };
  
  return {
    currentId: nextId,
    getNextId
  };
};

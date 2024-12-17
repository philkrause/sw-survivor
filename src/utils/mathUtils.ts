/**
 * Calculates the Euclidean distance between two points
 * @param x1 The x-coordinate of the first point
 * @param y1 The y-coordinate of the first point
 * @param x2 The x-coordinate of the second point
 * @param y2 The y-coordinate of the second point
 * @returns The distance between the two points
 */
export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Clamps a value between a minimum and maximum value
 * @param value The value to clamp
 * @param min The minimum value
 * @param max The maximum value
 * @returns The clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Generates a random number between min and max (inclusive)
 * @param min The minimum value
 * @param max The maximum value
 * @returns A random number between min and max
 */
export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
}; 
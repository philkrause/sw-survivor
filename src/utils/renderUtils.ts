import { Position } from '../types/types';

/**
 * Calculates the center position of an entity from its top-left position and size
 * @param x Top-left x coordinate
 * @param y Top-left y coordinate
 * @param size Width/height of the entity
 * @returns Position object with the center coordinates
 */
export const calculateEntityCenter = (x: number, y: number, size: number): Position => {
  return {
    x: x + size / 2,
    y: y + size / 2
  };
};

/**
 * Calculates health bar position beneath an entity
 * @param x Top-left x coordinate of the entity
 * @param y Top-left y coordinate of the entity
 * @param entitySize Width/height of the entity
 * @param offset Vertical offset from the bottom of the entity
 * @returns Position object for the health bar
 */
export const calculateHealthBarPosition = (
  x: number, 
  y: number, 
  entitySize: number, 
  offset: number = 15
): Position => {
  return {
    x,
    y: y + entitySize + offset
  };
};

/**
 * Generates points for a line relative to an entity's center
 * @param centerX Center x coordinate of the entity
 * @param centerY Center y coordinate of the entity
 * @param fromOffsetX Starting x offset from center
 * @param fromOffsetY Starting y offset from center
 * @param toOffsetX Ending x offset from center
 * @param toOffsetY Ending y offset from center
 * @returns Array of point coordinates for a line
 */
export const generateRelativeLine = (
  centerX: number,
  centerY: number,
  fromOffsetX: number,
  fromOffsetY: number,
  toOffsetX: number,
  toOffsetY: number
): number[] => {
  return [
    centerX + fromOffsetX,
    centerY + fromOffsetY,
    centerX + toOffsetX,
    centerY + toOffsetY
  ];
}; 
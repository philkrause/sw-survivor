/**
 * Type definitions for the application
 */

// Game entity types
export interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  pierceLeft: number;
}

// Component props types
export interface PlayerProps {
  x: number;
  y: number;
  health: number;
}

export interface EnemyProps {
  x: number;
  y: number;
  health: number;
}

// Position and movement types
export interface Position {
  x: number;
  y: number;
}

export interface Direction {
  directionX: number;
  directionY: number;
} 
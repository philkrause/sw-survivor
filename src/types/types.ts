/**
 * Type definitions for the application
 */

// Base types
export interface Position {
  x: number;
  y: number;
}

export interface Direction {
  directionX: number;
  directionY: number;
}

// Base type for entities with health
export interface EntityProps extends Position {
  health: number;
}

// Game entity with ID type
export interface GameEntity extends Position {
  id: number;
}

// Game entity types
export interface Enemy extends GameEntity {
  health: number;
}

export interface Projectile extends GameEntity {
  directionX: number;
  directionY: number;
  pierceLeft: number;
}

// Component props types
export type PlayerProps = EntityProps;
export type EnemyProps = EntityProps;

// UI props types
export interface GameOverProps {
  visible: boolean;
}

export interface ScoreProps {
  score: number;
}

// Level-up types
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  apply: () => void;
}

export interface LevelUpProps {
  visible: boolean;
  upgrades: Upgrade[];
  onSelect: (upgrade: Upgrade) => void;
} 
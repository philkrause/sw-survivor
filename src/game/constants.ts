/**
 * Game constants and configuration
 */

// Stage dimensions
export const STAGE_WIDTH: number = 1024;
export const STAGE_HEIGHT: number = 768;

// Game settings
export const GAME_WIDTH: number = 800;
export const GAME_HEIGHT: number = 600;

// Player settings
export const PLAYER_SPEED: number = 5;
export const PLAYER_INITIAL_HEALTH: number = 100;
export const PLAYER_SIZE: number = 32;
export const MOVEMENT_SPEED: number = 5;

// Enemy settings
export const ENEMY_SPEED: number = 2;
export const ENEMY_SPAWN_RATE: number = 1000; // ms
export const ENEMY_INITIAL_HEALTH: number = 30;
export const ENEMY_SIZE: number = 32;
export const SPAWN_INTERVAL: number = 2000;

// Weapon settings
export const PROJECTILE_SPEED: number = 8;
export const PROJECTILE_DAMAGE: number = 5;
export const PROJECTILE_SIZE: number = 8;
export const ATTACK_RATE: number = 500;
export const ATTACK_INTERVAL: number = 500;
export const DEFAULT_PIERCE: number = 1;

// Game progression
export const LEVEL_UP_THRESHOLD: number = 100;

// Canvas positioning
export const PLAYER_X: number = STAGE_WIDTH / 2 - PLAYER_SIZE / 2;
export const PLAYER_Y: number = STAGE_HEIGHT / 2 - PLAYER_SIZE / 2;

// UI settings
export const HEALTH_BAR_HEIGHT: number = 5;
export const MAX_ENEMY_HEALTH: number = 10; 
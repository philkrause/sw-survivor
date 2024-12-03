/**
 * Game constants and configuration
 */

// Game settings
export const GAME_WIDTH: number = 800;
export const GAME_HEIGHT: number = 600;

// Player settings
export const PLAYER_SPEED: number = 5;
export const PLAYER_INITIAL_HEALTH: number = 100;
export const PLAYER_SIZE: number = 30;

// Enemy settings
export const ENEMY_SPEED: number = 2;
export const ENEMY_SPAWN_RATE: number = 1000; // ms
export const ENEMY_INITIAL_HEALTH: number = 30;
export const ENEMY_SIZE: number = 25;

// Weapon settings
export const PROJECTILE_SPEED: number = 8;
export const PROJECTILE_DAMAGE: number = 10;
export const PROJECTILE_SIZE: number = 10;
export const ATTACK_RATE: number = 500; // ms

// Game progression
export const LEVEL_UP_THRESHOLD: number = 100; // Score needed to level up 
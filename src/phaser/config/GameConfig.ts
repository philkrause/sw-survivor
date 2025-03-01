/**
 * Main game configuration constants
 */
export const GAME_CONFIG = {
  PLAYER: {
    SPEED: 200,
    SCALE: 0.5,
    DEPTH: 10,
    HITBOX_SCALE: 0.8,
    ATTACK_INTERVAL: 500, // ms between attacks
    MAX_HEALTH: 100, // Maximum player health
    DAMAGE_INTERVAL: 500, // ms between damage ticks when overlapping enemies
    DAMAGE_AMOUNT: 5, // Amount of damage taken per tick
    DAMAGE_TINT: 0xff0000, // Red tint when damaged
    INVULNERABLE_DURATION: 1000, // ms of invulnerability after taking damage
    HEALTH_BAR_WIDTH: 200, // Width of health bar in pixels
    HEALTH_BAR_HEIGHT: 20, // Height of health bar in pixels
    EXPERIENCE: {
      PICKUP_RADIUS: 10, // Radius in pixels for auto-pickup
      MAGNET_RADIUS: 150, // Radius in pixels for experience magnet effect
      MAGNET_SPEED: 300 // Speed at which orbs move toward player when in magnet radius
    }
  },
  ENEMY: {
    SPEED: 120,
    SCALE: 0.4,
    DEPTH: 5,
    SPAWN_INTERVAL: 1000, // ms between spawns
    MAX_COUNT: 50,
    SPAWN_PADDING: 20, // Distance from edge
    HITBOX_SCALE: 0.8,
    TINT: 0xff0000,
    MAX_HEALTH: 3, // Number of hits to defeat an enemy
    DAMAGE_TINT: 0xff8800, // Orange tint when damaged
    KNOCKBACK_FORCE: 150, // Force applied when hit
    KNOCKBACK_DURATION: 200, // ms of knockback effect
    EXPERIENCE_DROP_CHANCE: 1.0 // Chance (0-1) of dropping an experience orb
  },
  EXPERIENCE_ORB: {
    KEY: 'experience_orb',
    SCALE: 0.3,
    DEPTH: 3,
    TINT: 0x00ffff, // Cyan color
    VALUE: 1, // Each orb gives 1 XP, player needs 25 for first level up
    LIFESPAN: 10000, // ms before disappearing
    MAX_COUNT: 100, // Maximum number of orbs
    PULSE_DURATION: 1000, // ms for pulse animation
    PULSE_SCALE: 1.2 // Maximum scale during pulse
  },
  PROJECTILE: {
    PLAYER: {
      KEY: 'player_projectile',
      SPEED: 400,
      SCALE: 0.3,
      DEPTH: 8,
      MAX_COUNT: 100,
      LIFESPAN: 2000, // ms
      TINT: 0xffff00, // Yellow color
      DAMAGE: 1
    }
  },
  UI: {
    TEXT_STYLE: {
      fontSize: '18px',
      color: '#ffffff',
      strokeThickness: 2,
      stroke: '#000000'
    }
  }
};

/**
 * Default camera dimensions if not specified elsewhere
 */
export const DEFAULT_DIMENSIONS = {
  WIDTH: 1024,
  HEIGHT: 768
}; 
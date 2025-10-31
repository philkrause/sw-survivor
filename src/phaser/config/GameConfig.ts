/**
 * Main game configuration constants
 */
export const GAME_CONFIG = {
  DEBUG: false,
  PLAYER: {
    SPEED: 120,
    SCALE: 2,
    DEPTH: 10,
    HITBOX_SCALE: .7,
    ATTACK_INTERVAL: 1000, // ms between attacks
    MAX_HEALTH: 500, // Maximum player health
    DAMAGE_INTERVAL: 500, // ms between damage ticks when overlapping enemies
    DAMAGE_AMOUNT: 5, // Amount of damage taken per tick
    DAMAGE_TINT: 0xff0000, // Red tint when damaged
    INVULNERABLE_DURATION: 20, // ms of invulnerability after taking damage
    HEALTH_BAR_WIDTH: 50, // Width of health bar in pixels
    HEALTH_BAR_HEIGHT: 10, // Height of health bar in pixels
    EXPERIENCE: {
      PICKUP_RADIUS: 100, // Radius in pixels for auto-pickup
      MAGNET_RADIUS: 100, // Radius in pixels for experience magnet effect
      MAGNET_SPEED: 10// Speed at which orbs move toward player when in magnet radius
    }
  },
  ENEMY: {
    SPEED: 50,
    SCALE: 2,
    DEPTH: 5,
    SPAWN_INTERVAL: 1000, // ms between spawns (base interval)
    MAX_COUNT: 150,
    SPAWN_PADDING: 20, // Distance from edge
    HITBOX_SCALE: .01,
    TINT: 0xff0000,
    MAX_HEALTH: 50, // Number of hits to defeat an enemy
    DAMAGE_TINT: 0xff8800, // Orange tint when damaged
    KNOCKBACK_FORCE: 300, // Force applied when hit
    KNOCKBACK_DURATION: 200, // ms of knockback effect
    EXPERIENCE_DROP_CHANCE: 1, // Chance (0-1) of dropping an experience orb
    RELIC_DROP_CHANCE: 0.03, // Chance (0-1) for relic drop on death
    // Spawn rate scaling
    LEVEL_SCALING: {
      REDUCTION_PER_LEVEL: 0.5, // 25% reduction per level
      MIN_REDUCTION_FACTOR: 0.3, // Minimum 30% of base interval
    },
    TIME_SCALING: {
      REDUCTION_PER_MINUTE: 0.25, // 5% reduction per minute elapsed
      MAX_REDUCTION: 0.5, // Maximum 50% reduction from time alone
    },
    // Enemy type unlocks by level
    TYPE_UNLOCKS: {
      dune: 1, // Available from level 1
      storm: 5, // Unlock at level 2
      soldier1: 9, // Unlock at level 3
    },
    // Per-type overrides (multipliers against MAX_HEALTH)
    TYPES: {
      dune: { HEALTH_MULTIPLIER: 0.25 },
      storm: { HEALTH_MULTIPLIER: .5 },
      soldier1: { HEALTH_MULTIPLIER: 1.5 },
    }
  },
  TFIGHTER: {
    SPEED: 50,
    SCALE: 2,
    DEPTH: 7,
    SPAWN_INTERVAL: 5000, // ms between spawns
    MAX_COUNT: 150,
    MIN_LEVEL: 5, // Minimum player level before T-Fighters spawn
    SPAWN_PADDING: 20, // Distance from edge
    HITBOX_SCALE: 1,
    TINT: 0xff0000,
    MAX_HEALTH: 100, // Number of hits to defeat an enemy
    DAMAGE_TINT: 0xff8800, // Orange tint when damaged
    KNOCKBACK_FORCE: 300, // Force applied when hit
    KNOCKBACK_DURATION: 200, // ms of knockback effect
    EXPERIENCE_DROP_CHANCE: 1, // Chance (0-1) of dropping an experience orb
    RELIC_DROP_CHANCE: 0.08 // Chance (0-1) for relic drop on death
  },
  AT: {
    SPAWN_INTERVAL: 2000, // ms between spawns (base interval)
    MAX_COUNT: 10, // Maximum number of AT enemies at once
    MIN_LEVEL: 10, // Minimum player level before AT enemies spawn
    RELIC_DROP_CHANCE: 0.15
  },
  EXPERIENCE_ORB: {
    KEY: 'experience_orb',
    SCALE: 1,
    DEPTH: 3,
    TINT: 0x00ffff, // Cyan color
    VALUE: 2, // Each orb gives 1 XP, player needs 25 for first level up
    LIFESPAN: 30000, // ms before disappearing
    MAX_COUNT: 300, // Maximum number of orbs
    PULSE_DURATION: 1000, // ms for pulse animation
    PULSE_SCALE: 1.2 // Maximum scale during pulse
  },
  BLASTER: {
    PLAYER: {
      KEY: 'blaster',
      SPEED: 500,
      LIFESPAN: 2000, // ms - increased lifespan
      SCALE: 1,
      DAMAGE: 5,
      ROTATEWITHDIRECTION: true,
      MAXSIZE: 50, // increased pool size
      MAX_COUNT: 50, // increased pool size
      TINT: 0xff0000, // red color
      DEPTH: 3,
    },
    ENEMY: {
      KEY: 'enemy_laser', // Use laser.png texture but with unique key
      SPEED: 300,
      LIFESPAN: 3000, // ms - longer lifespan
      SCALE: 0.8,
      DAMAGE: 10,
      ROTATEWITHDIRECTION: true,
      MAXSIZE: 30, // smaller pool size
      MAX_COUNT: 30, // smaller pool size
      TINT: 0xff4444, // slightly different red
      DEPTH: 2,
    },
  },
  FORCE: {
    PLAYER: {
      KEY: 'player_force',
      BASEDAMAGE: 10,
      RADIUS: 10,
      ENDRADIUS: 100,
      STRENGTH: 1,
      FADEDURATION: 500,
      COLOR: 0xaa00ff,
      ALPHA: .5,
      MAXSIZE: 100,
      SCALE: 2,
      DEPTH: 3,
      LIFESPAN: 500, // ms
      TINT: 0xaa00ff, // purple color
    },
  },
  SABER: {
    PLAYER: {
      KEY: 'blue_slash',
      DURATION: 600,
      SCALE: 3,
      DEPTH: 3,
      BASEDAMAGE: 10,
      WIDTH: 50,
      HEIGHT: 50,
      TINT: 100,
      OFFSETX: 100,
      OFFSETY: 8,
      INTERVAL: 2000,
      GROWSCALE: 500, // ms
      DAMAGEMULTIPLIER: 1, // Damage multiplier for saber
    },
  },

  // Ability unlock levels
  ABILITIES: {
    R2D2_UNLOCK_LEVEL: 2, // Level at which R2-D2 ability unlocks
    FORCE_UNLOCK_LEVEL: 2, // Level at which Force ability unlocks
    SABER_UNLOCK_LEVEL: 8, // Level at which Lightsaber ability unlocks
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
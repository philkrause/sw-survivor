import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { normalizeVector } from '../utils/MathUtils';
import { ProjectileSystem } from '../systems/ProjectileSystem'; // adjust path
//import { CollisionSystem } from '../systems/CollisionSystem';
import StartScene from "../scenes/StartScene"


/**
 * Interface for keyboard input keys
 */
export interface GameKeys {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
}

/**
 * Class to manage player-related functionality
 */
export class Player {
  private sprite: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: GameKeys;
  private dead: boolean = false;
  private scene: Phaser.Scene;
  // Blaster properties
  private attackTimer: Phaser.Time.TimerEvent | null = null;
  private projectileSystem: ProjectileSystem | null = null;
  private isFlippedX: boolean = false; // Track if player is flipped horizontally
  public unlockedProjectiles: Set<string> = new Set(); // Track unlocked projectiles
  private currentAnimationKey: string = 'player_walk_right_no_saber'; // Track current animation

  // Upgrade properties

  public saberSpeedMultiplier: number = 1.0;
  public saberDamageMultiplier: number = 1.0;
  public saberCritChance: number = 0; // Crit chance from relics

  // Additional upgrade properties
  public speedMultiplier: number = 1.0;
  public experienceMultiplier: number = 1.0;
  public projectileSpeedMultiplier: number = 1.0;

  private hasForceUpgrade: boolean = false;
  private hasR2D2Upgrade: boolean = false;
  public hasBlasterUpgrade: boolean = true; // Start with blaster unlocked
  private hasSaberUpgrade: boolean = false; // Saber starts locked
  
  // Stress test mode
  private isStressTestMode: boolean = false;
  
  // Relic system
  private relics: Set<string> = new Set(); // Track collected relics
  private damageReduction: number = 0; // Track damage reduction from relics


  public R2D2SpeedMultiplier: number = 1.0;
  private R2D2StrengthMultiplier: number = 1.0;
  public R2D2DamageMultiplier: number = 1.0;


  public forceSpeedMultiplier: number = 1.0;
  private forceStrengthMultiplier: number = 1.0;
  public forceDamageMultiplier: number = 1.0;

  private baseBlasterDamage: number = GAME_CONFIG.BLASTER.PLAYER.DAMAGE;
  private damageBlasterMultiplier: number = 1.0;
  private baseAttackInterval: number = GAME_CONFIG.PLAYER.ATTACK_INTERVAL;
  private baseBlasterAttackInterval: number = 200;

  private blasterSpeedMultiplier: number = .25;
  private projectileCount: number = 1;
  private projectileSizeMultiplier: number = 1.0;
  private lastDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0); // Default facing right

  // Health properties
  private health: number;
  private maxHealth: number;
  private isInvulnerable: boolean = false;
  private invulnerableTimer: Phaser.Time.TimerEvent | null = null;
  private damageTimer: Phaser.Time.TimerEvent | null = null;

  // Movement properties
  private baseSpeed: number = GAME_CONFIG.PLAYER.SPEED;

  // Experience properties
  private experience: number = 0;
  private level: number = 1;
  private experienceToNextLevel: number = 50; // Base experience needed for level 2
  private isLevelingUp: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, projectileSystem: ProjectileSystem) {
    this.scene = scene;
    this.sprite = this.createSprite(x, y);
    this.setupInput();
    
    // Initialize health
    this.maxHealth = GAME_CONFIG.PLAYER.MAX_HEALTH;
    this.health = this.maxHealth;
    this.projectileSystem = projectileSystem

    // Listen for experience collection events
    this.scene.events.on('experience-collected', this.onExperienceCollected, this);

    // Initialize blaster since player starts with it
    this.initProjectilePool();
  }


  // ** ATTACKS ** //
  public initProjectilePool() {
    //console.log("Projectile pool initialized for player");
    if (this.projectileSystem) {
      // Set player reference for speed multiplier
      this.projectileSystem.setPlayer(this);
      
      this.projectileSystem.createPool({
        key: GAME_CONFIG.BLASTER.PLAYER.KEY,
        speed: GAME_CONFIG.BLASTER.PLAYER.SPEED,
        lifespan: GAME_CONFIG.BLASTER.PLAYER.LIFESPAN,
        scale: GAME_CONFIG.BLASTER.PLAYER.SCALE,
        depth: GAME_CONFIG.BLASTER.PLAYER.DEPTH,
        damage: GAME_CONFIG.BLASTER.PLAYER.DAMAGE,
        rotateToDirection: GAME_CONFIG.BLASTER.PLAYER.ROTATEWITHDIRECTION,
        maxSize: GAME_CONFIG.BLASTER.PLAYER.MAX_COUNT,
        maxCount: GAME_CONFIG.BLASTER.PLAYER.MAX_COUNT,
        tint: GAME_CONFIG.BLASTER.PLAYER.TINT
      });

      // Create enemy blaster pool
      this.projectileSystem.createPool({
        key: GAME_CONFIG.BLASTER.ENEMY.KEY,
        speed: GAME_CONFIG.BLASTER.ENEMY.SPEED,
        lifespan: GAME_CONFIG.BLASTER.ENEMY.LIFESPAN,
        scale: GAME_CONFIG.BLASTER.ENEMY.SCALE,
        depth: GAME_CONFIG.BLASTER.ENEMY.DEPTH,
        damage: GAME_CONFIG.BLASTER.ENEMY.DAMAGE,
        rotateToDirection: GAME_CONFIG.BLASTER.ENEMY.ROTATEWITHDIRECTION,
        maxSize: GAME_CONFIG.BLASTER.ENEMY.MAX_COUNT,
        maxCount: GAME_CONFIG.BLASTER.ENEMY.MAX_COUNT,
        tint: GAME_CONFIG.BLASTER.ENEMY.TINT
      });
    }


    // Start attack timer
    this.attackTimer = this.scene.time.addEvent({
      delay: this.getBlasterAttackInterval(),
      callback: () => this.fireProjectile(GAME_CONFIG.BLASTER.PLAYER.KEY),
      callbackScope: this,
      loop: true
    });

    this.scene.events.emit('projectile-pool-initialized');
  }


  // FIRE PROJECTILE LOGIC
  private fireProjectile(type: string): void {
    if (!this.projectileSystem || this.isLevelingUp) return;

    if (!this.hasBlasterUpgrade) {
      console.warn(`Projectile type "${type}" is not unlocked!`);
      return;
    }


    const playerPos = this.getPosition();
    const lastDirection = this.lastDirection.clone();

    // If no movement direction recorded, default to facing right
    if (lastDirection.x === 0 && lastDirection.y === 0) {
      lastDirection.set(1, 0); // Default to facing right
    }

    // Use the player's last movement direction for shooting
    const normalizedDirection = normalizeVector(lastDirection.x, lastDirection.y);
    const dirX = normalizedDirection.x;
    const dirY = normalizedDirection.y;

    // Calculate projectile spawn position (in front of player)
    const projectileOffset = 20; // Distance in front of player
    let projectileSpawnX = playerPos.x + (dirX * projectileOffset);
    let projectileSpawnY = playerPos.y + (dirY * projectileOffset);
    
    // Adjust spawn position based on aiming direction
    if (Math.abs(dirY) > Math.abs(dirX)) {
      // Primarily vertical movement - adjust horizontal offset
      if (dirY < 0) { // Aiming up
        projectileSpawnY -= 5; // Higher up
      } else { // Aiming down
        projectileSpawnY += 15; // Lower down
      }
    } else {
      // Primarily horizontal movement - adjust vertical offset
      projectileSpawnY += 10; // Slightly below center for horizontal shots
    }

    // Calculate angle for spread shots based on movement direction
    const baseAngle = Math.atan2(dirY, dirX);
    // Fire multiple projectiles if projectileCount > 1
    for (let i = 0; i < this.projectileCount; i++) {
      let angle = baseAngle;

      // If multiple projectiles, create a spread pattern
      if (this.projectileCount > 1) {
        // Calculate spread angle based on projectile count
        const spreadAngle = Math.PI / 6; // 30 degrees total spread
        const angleOffset = spreadAngle * (i / (this.projectileCount - 1) - 0.5);
        angle = baseAngle + angleOffset;
      }

      // Calculate direction from angle
      const spreadDirX = Math.cos(angle);
      const spreadDirY = Math.sin(angle);
      // Fire projectile with current damage and size
      const projectile = this.projectileSystem.fire(
        GAME_CONFIG.BLASTER.PLAYER.KEY,
        projectileSpawnX,
        projectileSpawnY,
        spreadDirX,
        spreadDirY,
        'blaster' // Projectile type for damage multiplier
      );

      // Projectile damage is now handled by ProjectileSystem with multipliers
      if (projectile) {

        projectile.setScale(GAME_CONFIG.BLASTER.PLAYER.SCALE * this.projectileSizeMultiplier)

      }
    }
  }


  // setActiveProjectileType(type: string) {
  //   if (this.unlockedProjectiles.has(type)) {
  //     this.activeProjectileType = type;
  //   }
  // }


  public static setupAnimations(scene: Phaser.Scene) {
    // Animation for player walking right
    scene.anims.create({
      key: 'player_walk_right',
      frames: scene.anims.generateFrameNumbers('player_walk_right', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1
    });

    // Animation for player walking up
    scene.anims.create({
      key: 'player_walk_up',
      frames: scene.anims.generateFrameNumbers('player_walk_up', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1
    });

    // Animation for player walking down
    scene.anims.create({
      key: 'player_walk_down',
      frames: scene.anims.generateFrameNumbers('player_walk_down', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1
    });

    // Animation for player walking right with saber
    scene.anims.create({
      key: 'player_walk_right_with_saber',
      frames: scene.anims.generateFrameNumbers('player_walk_right_with_saber', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1
    });
  }
  /**
   * Create and configure the player sprite
   */
  private createSprite(x: number, y: number): Phaser.Physics.Arcade.Sprite {
    const sprite = this.scene.physics.add.sprite(x, y, 'player');

    sprite.setScale(GAME_CONFIG.PLAYER.SCALE);
    sprite.setDepth(GAME_CONFIG.PLAYER.DEPTH);

    // Create a slightly smaller hitbox
    if (sprite.body) {
      const hitboxWidth = sprite.width * GAME_CONFIG.PLAYER.SCALE * GAME_CONFIG.PLAYER.HITBOX_SCALE / 4;
      const hitboxHeight = sprite.height * GAME_CONFIG.PLAYER.SCALE * GAME_CONFIG.PLAYER.HITBOX_SCALE / 1.5;
      sprite.body.setSize(hitboxWidth, hitboxHeight);
    }

    sprite.setDamping(false);
    sprite.setDrag(0);

    // Set initial body offset (default to right-facing)
    sprite.body?.setOffset(10, 10);

    return sprite;
  }


  /**
   * Configure keyboard input and cursor tracking
   */
  private setupInput(): void {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();

    this.wasdKeys = {
      W: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }


  /**
   * Gets the input direction based on keyboard state
   */
  private getInputDirection(): { x: number, y: number } {
    let dirX = 0;
    let dirY = 0;

    const left = this.wasdKeys.A.isDown || this.cursors.left!.isDown;
    const right = this.wasdKeys.D.isDown || this.cursors.right!.isDown;
    const up = this.wasdKeys.W.isDown || this.cursors.up!.isDown;
    const down = this.wasdKeys.S.isDown || this.cursors.down!.isDown;



    // Determine primary direction for sprite selection
    let primaryDirection = 'right'; // default

    // Check if A or left arrow key is pressed (move left)
    if (left && !this.dead) {
      dirX = -1;
      this.sprite.setFlipX(true);  // Flip sprite to face left
      this.sprite.body?.setOffset(15, 10);
      this.isFlippedX = true; // Set flipped state
      primaryDirection = 'left';
    }

    // Check if D or right arrow key is pressed (move right)
    if (right && !this.dead) {
      dirX = 1;
      this.sprite.setFlipX(false);  // Set sprite to face right (default)
      this.sprite.body?.setOffset(10, 10);
      this.isFlippedX = false; // Reset flipped state
      primaryDirection = 'right';
    }

    // Handle vertical movement (up and down)
    if (up && !this.dead) {
      dirY = -1;
      // If moving primarily up, use up sprite
      if (Math.abs(dirY) > Math.abs(dirX)) {
        primaryDirection = 'up';
      }
    }

    if (down && !this.dead) {
      dirY = 1;
      // If moving primarily down, use down sprite
      if (Math.abs(dirY) > Math.abs(dirX)) {
        primaryDirection = 'down';
      }
    }

    // Update sprite texture based on primary direction
    this.updatePlayerSprite(primaryDirection);

    return { x: dirX, y: dirY };
  }

  getFlippedX(): boolean {
    return this.isFlippedX;
  }


  /**
   * Update player sprite animation based on direction
   */
  private updatePlayerSprite(direction: string): void {
    if (!this.sprite || this.dead || !this.sprite.anims) return;

    // Determine animation based on direction and saber status
    if (this.hasSaberUpgrade) {
      // For saber, only use saber animation for horizontal movement
      // For up/down, use regular animations since there's no saber up/down animation
      switch (direction) {
        case 'up':
          this.sprite.anims.play("player_walk_up", true);
          break;
        case 'down':
          this.sprite.anims.play("player_walk_down", true);
          break;
        case 'left':
        case 'right':
        default:
          // Use saber animation for horizontal movement
          this.sprite.anims.play("player_walk_right_with_saber", true);
          break;
      }
    } else {
      // Use appropriate walking animation for each direction
      switch (direction) {
        case 'up':
          this.sprite.anims.play("player_walk_up", true);
          break;
        case 'down':
          this.sprite.anims.play("player_walk_down", true);
          break;
        case 'left':
        case 'right':
        default:
          this.sprite.anims.play("player_walk_right", true);
          break;
      }
    }
  }

  /**
   * Update player sprite based on last direction when not moving
   */
  private updatePlayerSpriteFromLastDirection(): void {
    if (!this.sprite || this.dead || !this.sprite.anims) return;

    // Determine primary direction from lastDirection
    let primaryDirection = 'right'; // default
    
    if (Math.abs(this.lastDirection.y) > Math.abs(this.lastDirection.x)) {
      // Primarily vertical movement
      if (this.lastDirection.y < 0) {
        primaryDirection = 'up';
      } else {
        primaryDirection = 'down';
      }
    } else {
      // Primarily horizontal movement
      if (this.lastDirection.x < 0) {
        primaryDirection = 'left';
      } else {
        primaryDirection = 'right';
      }
    }

    // Use the same logic as updatePlayerSprite but for idle state
    if (this.hasSaberUpgrade) {
      // For saber, only use saber animation for horizontal movement
      // For up/down, use regular animations since there's no saber up/down animation
      switch (primaryDirection) {
        case 'up':
          this.sprite.anims.play("player_walk_up", true);
          break;
        case 'down':
          this.sprite.anims.play("player_walk_down", true);
          break;
        case 'left':
        case 'right':
        default:
          // Use saber animation for horizontal movement
          this.sprite.anims.play("player_walk_right_with_saber", true);
          break;
      }
    } else {
      // Use appropriate walking animation for each direction
      switch (primaryDirection) {
        case 'up':
          this.sprite.anims.play("player_walk_up", true);
          break;
        case 'down':
          this.sprite.anims.play("player_walk_down", true);
          break;
        case 'left':
        case 'right':
        default:
          // For horizontal movement, stop animation when not moving
          this.sprite.anims.stop();
          this.sprite.setTexture('player'); // Set to static sprite
          // Reset body offset to center the health bar based on flip state
          if (this.sprite.flipX) {
            this.sprite.body?.setOffset(15, 10); // Offset for flipped sprite
          } else {
            this.sprite.body?.setOffset(10, 10); // Offset for normal sprite
          }
          break;
      }
    }
  }

  /**
   * Get the player sprite instance
   */
  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  /**
   * Get the player's current position
   */
  getPosition(): { x: number, y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getVelocity(): Phaser.Math.Vector2 {
    if (!this.sprite.body) {
      return new Phaser.Math.Vector2(0, 0);
    }

    return this.sprite.body.velocity;
  }




  /**
   * Apply damage to the player
   */
  takeDamage(amount: number): boolean {
    // Skip if player is invulnerable or in stress test mode
    if (this.isInvulnerable || this.isStressTestMode) {
      return false;
    }

    // Apply damage reduction from relics
    const actualDamage = amount * (1 - this.damageReduction);

    // Reduce health
    this.health = Math.max(0, this.health - actualDamage);

    // Ensure sprite is visible before applying damage effects
    this.sprite.setVisible(true);

    // Apply damage visual effect - DISABLED FOR DEBUGGING
    // this.sprite.setTint(GAME_CONFIG.PLAYER.DAMAGE_TINT);

    // Make player invulnerable temporarily
    this.setInvulnerable(GAME_CONFIG.PLAYER.INVULNERABLE_DURATION);

    // Check if player is defeated
    if (this.health <= 0 && this.dead === false) {
      // Handle player defeat
      this.onDefeat();
      this.dead = true; // Set dead flag to prevent multiple defeats
      return true;
    }

    return false;
  }

  /**
   * Make the player invulnerable for a duration
   */
  private setInvulnerable(duration: number): void {
    this.isInvulnerable = true;

    // Clear any existing invulnerability timer
    if (this.invulnerableTimer) {
      this.invulnerableTimer.destroy();
    }

    // Flash effect during invulnerability
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(duration / 200),
      onComplete: () => {
        this.sprite.alpha = 1;
        this.sprite.setVisible(true); // Ensure sprite is visible
      }
    });

    // Set timer to end invulnerability
    this.invulnerableTimer = this.scene.time.delayedCall(duration, () => {
      this.isInvulnerable = false;
      this.sprite.clearTint();
      this.sprite.alpha = 1;
      this.sprite.setVisible(true); // Ensure sprite is visible
    });
  }

  /**
   * Handle player defeat
   */
  private onDefeat(): void {
    // Stop player movement
    if (this.sprite && this.sprite.body) {
      this.sprite.setVelocity(0, 0);
    }
    const cam = this.scene.cameras.main
    //death animation
    this.deathVisual();
   
    this.sprite.setActive(false).setVisible(false);

    this.scene.add.text(
      cam.scrollX + cam.centerX,
      cam.scrollY + cam.centerY - 25,
      `game over`, {
      fontFamily: 'StarJedi',
      fontSize: '64px',
      color: '#ff0000',
      stroke: '#000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(1000);
    
    this.scene.add.text(
      cam.scrollX + cam.centerX,
      cam.scrollY + cam.centerY + 45,
      `you reached level ${this.level}`, {
      fontFamily: 'StarJedi',
      fontSize: '64px',
      color: '#ff0000',
      stroke: '#000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(1000);

    const startButton = this.scene.add.text(
      cam.scrollX + cam.centerX,
      cam.scrollY + cam.centerY + 115,
      'try again?',
      {
        fontFamily: 'StarJedi',
        fontSize: '64px',
        color: '#ffff00',
        stroke: '#000',
        strokeThickness: 8,
        align: 'center'
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1000);
    

      startButton.on('pointerdown', () => {
        this.scene.scene.stop('MainScene');
        this.scene.scene.remove('StartScene'); // important!
        this.scene.scene.add('StartScene', StartScene, true); // true = auto-start
  });

  // Hover effect
  startButton.on('pointerover', () => startButton.setStyle({ backgroundColor: '#444' }));
  startButton.on('pointerout', () => startButton.setStyle({ backgroundColor: '' }));
        
  
}

  /**
   * Start continuous damage timer (for enemy overlap)
   */
  startDamageTimer(): void {
    // Don't start a new timer if one is already running
    if(this.damageTimer) return;

// Apply initial damage
this.takeDamage(GAME_CONFIG.PLAYER.DAMAGE_AMOUNT);

// Set up timer for continuous damage
this.damageTimer = this.scene.time.addEvent({
  delay: GAME_CONFIG.PLAYER.DAMAGE_INTERVAL,
  callback: () => {
    this.takeDamage(GAME_CONFIG.PLAYER.DAMAGE_AMOUNT);
  },
  callbackScope: this,
  loop: true
});
  }

/**
 * Stop continuous damage timer
 */
stopDamageTimer(): void {
  if(this.damageTimer) {
  this.damageTimer.destroy();
  this.damageTimer = null;
}
  }

/**
 * Check if player is currently overlapping with enemies
 */
setOverlapping(isOverlapping: boolean): void {
  // Skip damage if in stress test mode
  if (this.isStressTestMode) {
    return;
  }
  
  if(isOverlapping) {
    this.startDamageTimer();
  } else {
    this.stopDamageTimer();
  }
}

/**
 * Get current health
 */
getHealth(): number {
  return this.health;
}

/**
 * Get maximum health
 */
getMaxHealth(): number {
  return this.maxHealth;
}

isDead(): boolean {
  return this.dead;
}

  /**
   * Handle experience collection
   */
  private onExperienceCollected(value: number, totalExperience: number): void {
  // Apply experience multiplier to the gained experience
  const multipliedValue = value * this.experienceMultiplier;
  const adjustedTotal = totalExperience - value + multipliedValue;
  
  // Update player experience with multiplied value
  this.experience = adjustedTotal;

  // Check for level up
  this.checkLevelUp();

  // Visual feedback
  this.showExperienceCollectedEffect();
}

  /**
   * Check if player has enough experience to level up
   */
  private checkLevelUp(): void {
  // Use a while loop to handle multiple level-ups at once
    while(this.experience >= this.experienceToNextLevel && !this.isLevelingUp) {
      // Level up
      this.level++;

      // Calculate new experience threshold (increases with each level)
      this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.8);

      // Visual feedback
      this.showLevelUpEffect();

      // Set leveling up flag to prevent multiple level-up screens
      this.isLevelingUp = true;

      // Emit level up event for other systems
      this.scene.events.emit('player-level-up', this.level);

      // Emit event to show upgrade UI
      this.scene.events.emit('show-upgrade-ui');

      if (this.level === 5) {
        this.scene.events.emit('player-level-5', this);
      }
    }
}

  /**
   * Show visual effect when collecting experience
   */
  private showExperienceCollectedEffect(): void {
  // Flash player with cyan tint briefly
  //this.sprite.setTint(GAME_CONFIG.EXPERIENCE_ORB.TINT);

  this.scene.time.delayedCall(100, () => {
    if (this.sprite.active) {
      this.sprite.clearTint();
    }
  });
}

  /**
   * Show visual effect when leveling up
   */
  private showLevelUpEffect(): void {
  // Create a circular flash around the player
  const flash = this.scene.add.circle(
    this.sprite.x,
    this.sprite.y,
    50,
    GAME_CONFIG.EXPERIENCE_ORB.TINT,
    0.7
  );
  flash.setDepth(this.sprite.depth - 1);

  // Expand and fade out
  this.scene.tweens.add({
    targets: flash,
    radius: 150,
    alpha: 0,
    duration: 500,
    onComplete: () => {
      flash.destroy();
    }
  });

  // Show level up text
  const levelText = this.scene.add.text(
    this.sprite.x,
    this.sprite.y - 50,
    `Level Up! ${this.level}`,
    {
      fontSize: '24px',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 4
    }
  ).setOrigin(0.5);

  // Float up and fade out
  this.scene.tweens.add({
    targets: levelText,
    y: this.sprite.y - 100,
    alpha: 0,
    duration: 1000,
    onComplete: () => {
      levelText.destroy();
    }
  });
}

/**
 * Get current experience
 */
getExperience(): number {
  return this.experience;
}

/**
 * Get current level
 */
getLevel(): number {
  return this.level;
}

/**
 * Get experience required for next level
 */
getExperienceToNextLevel(): number {
  return this.experienceToNextLevel;
}

/**
 * Clean up resources
 */
cleanup(): void {
  if(this.attackTimer) {
  this.attackTimer.destroy();
}

if (this.invulnerableTimer) {
  this.invulnerableTimer.destroy();
}

if (this.damageTimer) {
  this.damageTimer.destroy();
}

// Remove event listeners
this.scene.events.off('experience-collected', this.onExperienceCollected, this);
  }

/**
 * Called when an upgrade is selected
 */
onUpgradeSelected(): void {
  // Reset leveling up flag
  this.isLevelingUp = false;

  // Check for additional level-ups
  this.checkLevelUp();
}

/**
 * Increase player's attack speed
 */
increaseBlasterSpeed(multiplier: number): void {
  this.blasterSpeedMultiplier += multiplier;
  // Blaster attack speed multiplier

  // Update attack timer
  if(this.attackTimer) {
  this.attackTimer.destroy(); // Destroy the existing timer
}

const newInterval = this.getBlasterAttackInterval(); // Get the updated interval
  // Blaster speed increased

// Recreate the attack timer with the updated interval
this.attackTimer = this.scene.time.addEvent({
  delay: this.getBlasterAttackInterval(),
  callback: () => this.fireProjectile(GAME_CONFIG.BLASTER.PLAYER.KEY),
  callbackScope: this,
  loop: true
});

  }


//************** */ UPGRADES ****************



/**
 * Get current attack interval in ms
 */
getBlasterAttackInterval(): number {
  // Lower interval means faster attacks
  return this.baseBlasterAttackInterval / this.blasterSpeedMultiplier;
}


getForceInterval(): number {
  // Lower interval means faster attacks
  return this.baseAttackInterval / this.forceSpeedMultiplier;
}

/**
 * Increase number of projectiles fired per attack
 */
increaseProjectileCount(amount: number): void {
  this.projectileCount += amount;
  // Projectile count increased
}

/**
 * Increase projectile size
 */
increaseProjectileSize(multiplier: number): void {
  this.projectileSizeMultiplier += multiplier;
  // Projectile size increased
}

/**
 * Get current projectile size multiplier
 */
getProjectileSizeMultiplier(): number {
  return this.projectileSizeMultiplier;
}


/**
 * Increase movement speed
 */
increaseMovementSpeed(multiplier: number): void {
  this.speedMultiplier += multiplier;
  // Movement speed increased
}

/**
 * Get current movement speed
 */
getSpeed(): number {
  return this.baseSpeed * this.speedMultiplier;
}

/**
 * Set whether player is currently in the level-up state
 */
setLevelingUp(isLevelingUp: boolean): void {
  this.isLevelingUp = isLevelingUp;
}



//Check if player is currently in the level-up state
isInLevelUpState(): boolean {
  return this.isLevelingUp;
}


unlockForceUpgrade(): void {
  this.hasForceUpgrade = true;
}


hasForceAbility(): boolean {
  return this.hasForceUpgrade;
}


unlockProjectile(type: string) {
  this.unlockedProjectiles.add(type);
}

unlockBlasterUpgrade(): void {
  this.hasBlasterUpgrade = true;
}

hasBlasterAbility(): boolean {
  return this.hasBlasterUpgrade;
}

getBlasterDamage(): number {
  return this.baseBlasterDamage * (1 * this.damageBlasterMultiplier);
}

increaseBlasterDamage(multiplier: number): void {
  this.damageBlasterMultiplier += multiplier;
  // Blaster damage increased
}


unlockR2D2Upgrade() {
  this.hasR2D2Upgrade = true;
  // R2D2 upgrade unlocked
}

hasR2D2Ability(): boolean {
  return this.hasR2D2Upgrade;
}

unlockSaberUpgrade(): void {
  this.hasSaberUpgrade = true;
  this.switchToSaberAnimation();
  // Saber upgrade unlocked
}

/**
 * Switch to saber animation
 */
private switchToSaberAnimation(): void {
  this.currentAnimationKey = 'player_walk_right_with_saber';
  // If currently moving, immediately switch to the new animation
  if (this.sprite.anims && this.sprite.anims.isPlaying && this.sprite.anims.exists(this.currentAnimationKey)) {
    this.sprite.anims.play(this.currentAnimationKey, true);
  }
}

hasSaberAbility(): boolean {
  return this.hasSaberUpgrade;
}

/**
 * Add a relic to the player's collection
 */
addRelic(relicId: string): void {
  this.relics.add(relicId);
  this.applyRelicEffect(relicId);
  // Relic collected
}

/**
 * Check if player has a specific relic
 */
hasRelic(relicId: string): boolean {
  return this.relics.has(relicId);
}

/**
 * Apply the effect of a specific relic
 */
private applyRelicEffect(relicId: string): void {
  switch (relicId) {
    case 'kyber_crystal':
      // Increase all weapon damage by 25%
      this.damageBlasterMultiplier *= 1.25;
      this.saberDamageMultiplier *= 1.25;
      this.forceDamageMultiplier *= 1.25;
      this.R2D2DamageMultiplier *= 1.25;
      break;
      
    case 'jedi_robes':
      // Reduce damage taken by 20%
      this.damageReduction += 0.2;
      // Damage reduction increased
      break;
      
    case 'force_sensitivity':
      // Increase Force abilities by 50%
      this.forceDamageMultiplier *= 1.5;
      this.forceSpeedMultiplier *= 1.5;
      break;
      
    case 'droid_companion':
      // R2-D2 abilities 30% more effective
      this.R2D2DamageMultiplier *= 1.3;
      this.R2D2SpeedMultiplier *= 1.3;
      break;
      
    case 'lightsaber_crystal':
      // Saber attacks have 15% chance to crit
      this.saberCritChance += 0.15;
      // Saber crit chance increased
      break;
  }
}

increaseR2D2Damage(multiplier: number): void {
  this.hasR2D2Upgrade = true;
  this.R2D2DamageMultiplier += multiplier;
  // Increased R2D2 damage
}

// Get the multiplier for force strength
getR2D2StrengthMultiplier(): number {
  return this.R2D2StrengthMultiplier;
}


increaseForceDamage(multiplier: number): void {
  this.hasForceUpgrade = true;
  this.forceDamageMultiplier += multiplier;
  // Increased force damage
}

increaseDamageReduction(multiplier: number): void {
  this.damageReduction += multiplier;
  // Increased damage reduction
}

increaseSaberCritChance(multiplier: number): void {
  this.saberCritChance += multiplier;
  // Increased saber crit chance
}

increaseForceSpeed(multiplier: number): void {
  this.forceSpeedMultiplier *= multiplier;
  // Increased force speed
}

// Get the multiplier for force strength
getForceStrengthMultiplier(): number {
  return this.forceStrengthMultiplier;
}


//UPGRADEs
increaseSaberDamage(multiplier: number): void {
  this.saberDamageMultiplier += multiplier;
  // Increased saber damage
}

increaseSaberSpeed(multiplier: number): void {
  this.saberSpeedMultiplier *= multiplier;
  // Increased saber speed
}

deathVisual(): void {
  const scene = this.scene;

  // Create a graphics object to generate a cyan circle texture
  const graphics = scene.make.graphics({ x: 0, y: 0 });
  graphics.fillStyle(0x00ffff); // Cyan
  graphics.fillCircle(8, 8, 8); // Circle radius 8
  graphics.generateTexture('cyan_circle', 16, 16);
  graphics.destroy();

  // Number of particles
  const numParticles = 20;

  for(let i = 0; i <numParticles; i++) {
  // Create a sprite at player's position
  if (this.sprite.body) {
    const particle = scene.physics.add.image(this.sprite.body.x, this.sprite.body.y, 'cyan_circle');

    // Scale it if needed
    particle.setScale(2);

    // Random velocity in all directions
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.Between(500, 1000);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    particle.setVelocity(vx, vy);

    // Optional: Fade and destroy after time
    scene.tweens.add({
      targets: particle,
      alpha: 0,
      scale: 0,
      duration: 900,
      repeat: false,
      onComplete: () => {
        particle.destroy();
        this.scene.physics.pause();
        this.scene.time.paused = true; // Pause the game
      }
    });
  }
}
  }



  update(): void {

  // Skip update if player is in level-up state
  if(this.isLevelingUp) {
    if (this.sprite && this.sprite.body) {
      this.sprite.setVelocity(0, 0);
    }
    return;
  }

  

  const direction = this.getInputDirection();
  if (direction.x !== 0 || direction.y !== 0) {
    this.lastDirection.copy(direction);
  }

  if (direction.x !== 0 || direction.y !== 0) {
    // Normalize for diagonal movement
    const normalized = normalizeVector(direction.x, direction.y);

    // Apply movement with speed multiplier
    if (this.sprite && this.sprite.body) {
      // Ensure sprite/body are enabled without logging
      if (!this.sprite.active) {
        this.sprite.setActive(true);
      }
      if (!this.sprite.body.enable) {
        this.sprite.body.enable = true;
      }

      this.sprite.setVelocity(
        normalized.x * this.getSpeed(),
        normalized.y * this.getSpeed()
      );
    }
  } else {
    // No input, stop movement but maintain last direction sprite
    if (this.sprite && this.sprite.body) {
      this.sprite.setVelocity(0, 0);
    }
    
    // Set animation based on last direction when not moving
    this.updatePlayerSpriteFromLastDirection();
  }


  }

  /**
   * Increase movement speed
   */
  increaseSpeed(multiplier: number): void {
    this.speedMultiplier += multiplier;
  }

  /**
   * Increase max health
   */
  increaseMaxHealth(amount: number): void {
    this.maxHealth += amount;
    this.health = Math.min(this.health + amount, this.maxHealth); // Also heal by the same amount
  }

  /**
   * Increase experience gain multiplier
   */
  increaseExperienceGain(multiplier: number): void {
    this.experienceMultiplier += multiplier;
  }

  /**
   * Increase projectile speed multiplier
   */
  increaseProjectileSpeed(multiplier: number): void {
    this.projectileSpeedMultiplier += multiplier;
  }

  /**
   * Set stress test mode (makes player invulnerable)
   */
  setStressTestMode(enabled: boolean): void {
    this.isStressTestMode = enabled;
  }

  /**
   * Check if stress test mode is active
   */
  isStressTestActive(): boolean {
    return this.isStressTestMode;
  }

} 
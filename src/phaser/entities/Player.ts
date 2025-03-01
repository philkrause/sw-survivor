import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { normalizeVector } from '../utils/MathUtils';
import { ProjectileSystem } from '../systems/ProjectileSystem';

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
  private scene: Phaser.Scene;
  
  // Attack properties
  private attackTimer: Phaser.Time.TimerEvent | null = null;
  private projectileSystem: ProjectileSystem | null = null;
  private cursorPosition: { x: number, y: number } = { x: 0, y: 0 };
  private baseDamage: number = GAME_CONFIG.PROJECTILE.PLAYER.DAMAGE;
  private damageMultiplier: number = 1.0;
  private baseAttackInterval: number = GAME_CONFIG.PLAYER.ATTACK_INTERVAL;
  private attackSpeedMultiplier: number = 1.0;
  private projectileCount: number = 1;
  private projectileSizeMultiplier: number = 1.0;
  
  // Health properties
  private health: number;
  private maxHealth: number;
  private isInvulnerable: boolean = false;
  private invulnerableTimer: Phaser.Time.TimerEvent | null = null;
  private damageTimer: Phaser.Time.TimerEvent | null = null;
  
  // Movement properties
  private baseSpeed: number = GAME_CONFIG.PLAYER.SPEED;
  private speedMultiplier: number = 1.0;
  
  // Experience properties
  private experience: number = 0;
  private level: number = 1;
  private experienceToNextLevel: number = 25; // Base experience needed for level 2
  private isLevelingUp: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = this.createSprite(x, y);
    this.setupInput();
    
    // Initialize health
    this.maxHealth = GAME_CONFIG.PLAYER.MAX_HEALTH;
    this.health = this.maxHealth;
    
    // Listen for experience collection events
    this.scene.events.on('experience-collected', this.onExperienceCollected, this);
  }

  /**
   * Create and configure the player sprite
   */
  private createSprite(x: number, y: number): Phaser.Physics.Arcade.Sprite {
    const sprite = this.scene.physics.add.sprite(x, y, 'player');
    
    sprite.setScale(GAME_CONFIG.PLAYER.SCALE);
    sprite.setDepth(GAME_CONFIG.PLAYER.DEPTH);
    sprite.setCollideWorldBounds(true);
    
    // Create a slightly smaller hitbox
    if (sprite.body) {
      sprite.body.setSize(
        sprite.width * GAME_CONFIG.PLAYER.HITBOX_SCALE, 
        sprite.height * GAME_CONFIG.PLAYER.HITBOX_SCALE
      );
    }
    
    sprite.setDamping(false);
    sprite.setDrag(0);
    
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
    
    // Track cursor position
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Convert screen position to world position
      this.cursorPosition.x = pointer.worldX;
      this.cursorPosition.y = pointer.worldY;
    });
  }

  /**
   * Gets the input direction based on keyboard state
   */
  private getInputDirection(): { x: number, y: number } {
    let dirX = 0;
    let dirY = 0;
    
    if (this.wasdKeys.A.isDown || this.cursors.left!.isDown) {
      dirX = -1;
    } else if (this.wasdKeys.D.isDown || this.cursors.right!.isDown) {
      dirX = 1;
    }
    
    if (this.wasdKeys.W.isDown || this.cursors.up!.isDown) {
      dirY = -1;
    } else if (this.wasdKeys.S.isDown || this.cursors.down!.isDown) {
      dirY = 1;
    }
    
    return { x: dirX, y: dirY };
  }

  /**
   * Update player movement based on input
   */
  update(): void {
    // Skip update if player is in level-up state
    if (this.isLevelingUp) {
      this.sprite.setVelocity(0, 0);
      return;
    }
    
    const direction = this.getInputDirection();
    
    if (direction.x !== 0 || direction.y !== 0) {
      // Normalize for diagonal movement
      const normalized = normalizeVector(direction.x, direction.y);
      
      // Apply movement with speed multiplier
      this.sprite.setVelocity(
        normalized.x * this.getSpeed(),
        normalized.y * this.getSpeed()
      );
    } else {
      // No input, stop movement
      this.sprite.setVelocity(0, 0);
    }
  }
  
  /**
   * Set up automatic attacks using the projectile system
   */
  setupAttacks(projectileSystem: ProjectileSystem): void {
    this.projectileSystem = projectileSystem;
    
    // Create a projectile pool for player projectiles
    this.projectileSystem.createPool({
      key: GAME_CONFIG.PROJECTILE.PLAYER.KEY,
      maxSize: GAME_CONFIG.PROJECTILE.PLAYER.MAX_COUNT,
      speed: GAME_CONFIG.PROJECTILE.PLAYER.SPEED,
      lifespan: GAME_CONFIG.PROJECTILE.PLAYER.LIFESPAN,
      scale: GAME_CONFIG.PROJECTILE.PLAYER.SCALE,
      depth: GAME_CONFIG.PROJECTILE.PLAYER.DEPTH,
      tint: GAME_CONFIG.PROJECTILE.PLAYER.TINT,
      damage: this.baseDamage,
      rotateToDirection: true
    });
    
    // Start attack timer
    this.attackTimer = this.scene.time.addEvent({
      delay: this.getAttackInterval(),
      callback: this.fireProjectile,
      callbackScope: this,
      loop: true
    });
  }
  
  /**
   * Fire a projectile toward the cursor position
   */
  private fireProjectile(): void {
    if (!this.projectileSystem || this.isLevelingUp) return;
    
    const playerPos = this.getPosition();
    
    // Calculate direction vector to cursor
    const dirX = this.cursorPosition.x - playerPos.x;
    const dirY = this.cursorPosition.y - playerPos.y;
    
    // Calculate angle for spread shots
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
      const projectile = this.projectileSystem.fireProjectile(
        GAME_CONFIG.PROJECTILE.PLAYER.KEY,
        playerPos.x,
        playerPos.y,
        spreadDirX,
        spreadDirY
      );
      
      // Set damage and size for the projectile
      if (projectile) {
        (projectile as any).damage = this.getDamage();
        projectile.setScale(GAME_CONFIG.PROJECTILE.PLAYER.SCALE * this.projectileSizeMultiplier);
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
  
  /**
   * Apply damage to the player
   */
  takeDamage(amount: number): boolean {
    // Skip if player is invulnerable
    if (this.isInvulnerable) {
      return false;
    }
    
    // Reduce health
    this.health = Math.max(0, this.health - amount);
    
    // Apply damage visual effect
    this.sprite.setTint(GAME_CONFIG.PLAYER.DAMAGE_TINT);
    
    // Make player invulnerable temporarily
    this.setInvulnerable(GAME_CONFIG.PLAYER.INVULNERABLE_DURATION);
    
    // Check if player is defeated
    if (this.health <= 0) {
      // Handle player defeat
      this.onDefeat();
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
      }
    });
    
    // Set timer to end invulnerability
    this.invulnerableTimer = this.scene.time.delayedCall(duration, () => {
      this.isInvulnerable = false;
      this.sprite.clearTint();
      this.sprite.alpha = 1;
    });
  }
  
  /**
   * Handle player defeat
   */
  private onDefeat(): void {
    // Stop player movement
    this.sprite.setVelocity(0, 0);
    
    // Visual effect for defeat
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // Game over logic would go here
        // For now, just show a message using the scene's showMessage method if available
        const mainScene = this.scene.scene.get('MainScene');
        if (mainScene && typeof (mainScene as any).gameUI?.showMessage === 'function') {
          (mainScene as any).gameUI.showMessage('Game Over!', 5000);
        }
      }
    });
  }
  
  /**
   * Start continuous damage timer (for enemy overlap)
   */
  startDamageTimer(): void {
    // Don't start a new timer if one is already running
    if (this.damageTimer) return;
    
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
    if (this.damageTimer) {
      this.damageTimer.destroy();
      this.damageTimer = null;
    }
  }
  
  /**
   * Check if player is currently overlapping with enemies
   */
  setOverlapping(isOverlapping: boolean): void {
    if (isOverlapping) {
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
  
  /**
   * Handle experience collection
   */
  private onExperienceCollected(_value: number, totalExperience: number): void {
    // Update player experience
    this.experience = totalExperience;
    
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
    while (this.experience >= this.experienceToNextLevel && !this.isLevelingUp) {
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
    }
  }
  
  /**
   * Show visual effect when collecting experience
   */
  private showExperienceCollectedEffect(): void {
    // Flash player with cyan tint briefly
    this.sprite.setTint(GAME_CONFIG.EXPERIENCE_ORB.TINT);
    
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
    if (this.attackTimer) {
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
   * Increase player's projectile damage
   */
  increaseDamage(multiplier: number): void {
    this.damageMultiplier += multiplier;
    console.log(`Damage increased to ${this.getDamage()}`);
  }
  
  /**
   * Get current damage value
   */
  getDamage(): number {
    return this.baseDamage * this.damageMultiplier;
  }
  
  /**
   * Increase player's attack speed
   */
  increaseAttackSpeed(multiplier: number): void {
    this.attackSpeedMultiplier += multiplier;
    
    // Update attack timer
    if (this.attackTimer) {
      this.attackTimer.destroy();
      
      // Create new timer with updated interval
      this.attackTimer = this.scene.time.addEvent({
        delay: this.getAttackInterval(),
        callback: this.fireProjectile,
        callbackScope: this,
        loop: true
      });
    }
    
    console.log(`Attack speed increased to ${1 / this.getAttackInterval() * 1000} attacks/sec`);
  }
  
  /**
   * Get current attack interval in ms
   */
  getAttackInterval(): number {
    // Lower interval means faster attacks
    return this.baseAttackInterval / this.attackSpeedMultiplier;
  }
  
  /**
   * Increase number of projectiles fired per attack
   */
  increaseProjectileCount(amount: number): void {
    this.projectileCount += amount;
    console.log(`Projectile count increased to ${this.projectileCount}`);
  }
  
  /**
   * Increase projectile size
   */
  increaseProjectileSize(multiplier: number): void {
    this.projectileSizeMultiplier += multiplier;
    console.log(`Projectile size increased to ${this.projectileSizeMultiplier}x`);
  }
  
  /**
   * Get current projectile size multiplier
   */
  getProjectileSizeMultiplier(): number {
    return this.projectileSizeMultiplier;
  }
  
  /**
   * Increase maximum health
   */
  increaseMaxHealth(amount: number): void {
    this.maxHealth += amount;
    
    // Also heal the player by the same amount
    this.health = Math.min(this.health + amount, this.maxHealth);
    
    // Update UI
    this.scene.events.emit('player-health-changed', this.health, this.maxHealth);
    
    console.log(`Max health increased to ${this.maxHealth}`);
  }
  
  /**
   * Increase movement speed
   */
  increaseMovementSpeed(multiplier: number): void {
    this.speedMultiplier += multiplier;
    console.log(`Movement speed increased to ${this.getSpeed()}`);
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
  
  /**
   * Check if player is currently in the level-up state
   */
  isInLevelUpState(): boolean {
    return this.isLevelingUp;
  }
} 
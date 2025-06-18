import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { normalizeVector } from '../utils/MathUtils';
import { ProjectileSystem } from '../systems/ProjectileSystem'; // adjust path
//import { CollisionSystem } from '../systems/CollisionSystem';


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

  // Upgrade properties

  public saberSpeedMultiplier: number = 1.0;
  public saberDamageMultiplier: number = 1.0;

  private hasForceUpgrade: boolean = false;
  private hasR2D2Upgrade: boolean = false;
  public hasBlasterUpgrade: boolean = false;


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
  private speedMultiplier: number = 1.0;

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
    //this.collisionSystem = new CollisionSystem(this.scene);

    // Listen for experience collection events
    this.scene.events.on('experience-collected', this.onExperienceCollected, this);

  }


  // ** ATTACKS ** //
  public initProjectilePool() {
    console.log("Projectile pool initialized for player");
    if (this.projectileSystem) {
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

    if (lastDirection.x === 0 && lastDirection.y === 0) {
      console.warn('Invalid direction, defaulting to (1, 0)');
      lastDirection.set(1, 1);
    }

    const randomAngle = Math.random() * Math.PI * 2; // Random angle between 0 and 2π (0 to 360 degrees)
    const dirX = Math.cos(randomAngle); // X component of the random direction
    const dirY = Math.sin(randomAngle); // Y component of the random direction

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
      const projectile = this.projectileSystem.fire(
        GAME_CONFIG.BLASTER.PLAYER.KEY,
        playerPos.x,
        playerPos.y,
        spreadDirX,
        spreadDirY
      );

      // Set damage and size for the projectile
      if (projectile) {
        //(projectile as any).damage = this.getBlasterDamage();
        projectile.setData('damage', this.getBlasterDamage());

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
    scene.anims.create({
      key: 'player_walk_right',
      frames: scene.anims.generateFrameNumbers('player_walk_right', { start: 0, end: 3 }),
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
    //sprite.setCollideWorldBounds(true);a

    // Create a slightly smaller hitbox
    if (sprite.body) {
      const hitboxWidth = sprite.width * GAME_CONFIG.PLAYER.SCALE * GAME_CONFIG.PLAYER.HITBOX_SCALE / 4;
      const hitboxHeight = sprite.height * GAME_CONFIG.PLAYER.SCALE * GAME_CONFIG.PLAYER.HITBOX_SCALE / 1.5;

      sprite.body.setSize(hitboxWidth, hitboxHeight);
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

    // Check if A or left arrow key is pressed (move left)
    if (left && !this.dead) {
      dirX = -1;
      this.sprite.setFlipX(true);  // Flip sprite to face left
      this.sprite.body?.setOffset(15, 10)
      this.sprite.anims.play("player_walk_right", true);
      this.isFlippedX = true; // Set flipped state
    }

    // Check if D or right arrow key is pressed (move right)
    if (right && !this.dead) {
      this.sprite.body?.setOffset(10, 10)
      dirX = 1;
      this.sprite.setFlipX(false);  // Set sprite to face right (default)
      this.sprite.anims.play("player_walk_right", true);
      this.isFlippedX = false; // Reset flipped state
    }

    // Handle vertical movement (up and down)
    if (up && !this.dead) {
      dirY = -1;
      this.sprite.anims.play("player_walk_right", true);
    }

    if (down && !this.dead) {
      dirY = 1;
      this.sprite.anims.play("player_walk_right", true);
    }


    return { x: dirX, y: dirY };
  }

  getFlippedX(): boolean {
    return this.isFlippedX;
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

    //death animation
    this.deathVisual();

    const mainScene = this.scene.scene.get('MainScene');
    this.sprite.setActive(false).setVisible(false);
    if (mainScene && typeof (mainScene as any).gameUI?.showMessage === 'function') {
      (mainScene as any).gameUI.showMessage('Game Over!', 0, "#ff0000", "48px");
    }
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

  isDead(): boolean {
    return this.dead;
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
   * Increase player's attack speed
   */
  increaseBlasterSpeed(multiplier: number): void {
    this.blasterSpeedMultiplier += multiplier;
    console.log("Blaster attack speed multiplier: " + this.blasterSpeedMultiplier);

    // Update attack timer
    if (this.attackTimer) {
      this.attackTimer.destroy(); // Destroy the existing timer
    }

    const newInterval = this.getBlasterAttackInterval(); // Get the updated interval
    console.log(`Blaster speed increased to ${(1 / newInterval) * 1000} attacks/sec`);

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
    console.log(`Blaster damage increased to ${this.getBlasterDamage()}`);
  }


  unlockR2D2Upgrade() {
    this.hasR2D2Upgrade = true;
    console.log("R2D2 upgrade unlocked");
  }

  hasR2D2Ability(): boolean {
    return this.hasR2D2Upgrade;
  }

  increaseR2D2Damage(multiplier: number): void {
    this.hasR2D2Upgrade = true;
    this.R2D2DamageMultiplier += multiplier;
    console.log("Increased R2D2 damage: " + this.R2D2DamageMultiplier); // Add debug here
  }

  // Get the multiplier for force strength
  getR2D2StrengthMultiplier(): number {
    return this.R2D2StrengthMultiplier;
  }


  increaseForceDamage(multiplier: number): void {
    this.hasForceUpgrade = true;
    this.forceDamageMultiplier += multiplier;
    console.log("Increased force damage: " + this.forceDamageMultiplier); // Add debug here
  }

  increaseForceSpeed(multiplier: number): void {
    this.forceSpeedMultiplier *= multiplier;
    console.log("Increased force speed: " + this.forceSpeedMultiplier); // Add debug here
  }

  // Get the multiplier for force strength
  getForceStrengthMultiplier(): number {
    return this.forceStrengthMultiplier;
  }


  //UPGRADEs
  increaseSaberDamage(multiplier: number): void {
    this.saberDamageMultiplier += multiplier;
    console.log("Increased saber damage: " + this.saberDamageMultiplier); // Add debug here
  }

  increaseSaberSpeed(multiplier: number): void {
    this.saberSpeedMultiplier *= multiplier;
    console.log("Increased saber speed: " + this.saberSpeedMultiplier); // Add debug here
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

    for (let i = 0; i < numParticles; i++) {
      // Create a sprite at player's position
      if(this.sprite.body) {
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
    if (this.isLevelingUp) {
      this.sprite.setVelocity(0, 0);
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
      this.sprite.setVelocity(
        normalized.x * this.getSpeed(),
        normalized.y * this.getSpeed()
      );
    } else {
      // No input, stop movement
      this.sprite.setVelocity(0, 0);
    }


  }




} 
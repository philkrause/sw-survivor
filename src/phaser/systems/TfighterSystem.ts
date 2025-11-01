import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
//import { getRandomEdgePosition } from '../utils/MathUtils';
import { ExperienceSystem } from './ExperienceSystem';
import { Player } from '../entities/Player';

/**
 * System responsible for enemy spawning, movement, and management
 */
export class TfighterSystem {
  private scene: Phaser.Scene;
  private enemies: Phaser.Physics.Arcade.Group;
  private spawnTimer: Phaser.Time.TimerEvent;
  private target: Phaser.Physics.Arcade.Sprite;
  private player: Player;
  private experienceSystem: ExperienceSystem | null = null;

  // Tracking active enemies for improved performance
  private activeEnemies: Set<Phaser.Physics.Arcade.Sprite> = new Set();
  private cameraRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
  private visibleEnemies: Array<Phaser.Physics.Arcade.Sprite> = [];

  // tracking enemies that are off screen 
  private offscreenTimers: Map<Phaser.Physics.Arcade.Sprite, number> = new Map();

  // Health bars for enemies
  private healthBars: Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.Graphics> = new Map();

  // Buffer to avoid allocations in update loop
  private vectorBuffer = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, target: Phaser.Physics.Arcade.Sprite, player: Player) {
    this.scene = scene;
    this.target = target;
    this.player = player;

    // Initialize enemy group with preallocated pool
    this.enemies = this.createEnemyGroup();

    // T-fighters don't collide with each other (removed collision)

    // Pre-populate the object pool to avoid runtime allocations
    this.prepopulateEnemyPool();

    // Ensure all enemies are properly deactivated initially
    this.deactivateAllEnemies();

    // Set up spawn timer
    this.spawnTimer = this.startSpawnTimer();
  }

  /**
 * Returns enemies near a given point within a radius
 */
  getEnemiesNear(x: number, y: number, radius: number): Phaser.Physics.Arcade.Sprite[] {
    const result: Phaser.Physics.Arcade.Sprite[] = [];
    const radiusSq = radius * radius;

    for (const enemy of this.activeEnemies) {
      if (!enemy.active) continue;

      const dx = enemy.x - x;
      const dy = enemy.y - y;

      // Square distance check for better performance
      if (dx * dx + dy * dy <= radiusSq) {

        result.push(enemy);
      }
    }

    return result;
  }



  /**
   * Create the enemy physics group with pooling
   */
  private createEnemyGroup(): Phaser.Physics.Arcade.Group {
    return this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: GAME_CONFIG.TFIGHTER.MAX_COUNT,
      runChildUpdate: false
    });
  }



  /**
   * Prepopulate the enemy pool to avoid runtime allocations
   */
  private prepopulateEnemyPool(): void {
    // Preallocate enemy objects to avoid allocations during gameplay
    for (let i = 0; i < GAME_CONFIG.TFIGHTER.MAX_COUNT; i++) {

      const enemy = this.scene.physics.add.sprite(0,0, 'tfighter');
      enemy.setVisible(false);
      enemy.setAlpha(0); // for extra safety
      enemy.setActive(false);
      enemy.disableBody(true, true);
      
      
      // Configure enemy properties once
      this.configureEnemyProperties(enemy);
    }
  }

  /**
   * Start the enemy spawning timer
   */
  private startSpawnTimer(): Phaser.Time.TimerEvent {
    // Calculate spawn interval based on player level
    const spawnInterval = this.calculateSpawnInterval();

    return this.scene.time.addEvent({
      delay: spawnInterval,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
  }

  private calculateSpawnInterval(): number {
    const baseInterval = GAME_CONFIG.TFIGHTER.SPAWN_INTERVAL;
    const playerLevel = this.player.getLevel();

    // Reduce spawn interval by 15% per level (minimum 30% of base interval)
    const reductionFactor = Math.max(0.3, 1 - (playerLevel - 1) * 0.25);

    return Math.floor(baseInterval * reductionFactor);
  }

  /**
   * Update spawn timer when player levels up
   * Should be called when player level changes
   */
  updateSpawnRate(): void {
    // Destroy existing timer
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }

    
    // Create new timer with updated interval
    this.spawnTimer = this.startSpawnTimer();

  }



  private createSpawnZones():{ x: number; y: number; }[] {     

    const cam = this.scene.cameras.main;
    const padding = GAME_CONFIG.TFIGHTER.SPAWN_PADDING || 100;
    // Define spawn zones just off-screen (left, right, top, bottom)
    return [
      {
        x: Phaser.Math.Between(cam.scrollX - padding * 2, cam.scrollX - padding),
        y: Phaser.Math.Between(cam.scrollY - padding, cam.scrollY + cam.height + padding)
      }, // Left
      {
        x: Phaser.Math.Between(cam.scrollX + cam.width + padding, cam.scrollX + cam.width + padding * 2),
        y: Phaser.Math.Between(cam.scrollY - padding, cam.scrollY + cam.height + padding)
      }, // Right
      {
        x: Phaser.Math.Between(cam.scrollX - padding, cam.scrollX + cam.width + padding),
        y: Phaser.Math.Between(cam.scrollY - padding * 2, cam.scrollY - padding)
      }, // Top
      {
        x: Phaser.Math.Between(cam.scrollX - padding, cam.scrollX + cam.width + padding),
        y: Phaser.Math.Between(cam.scrollY + cam.height + padding, cam.scrollY + cam.height + padding * 2)
      } // Bottom
    ];

  }

  /**
   * Spawn a new enemy at a random edge position
   */
  private spawnEnemy(): void {
    // Don't spawn if we've reached the maximum number of enemies
    if (this.getEnemyCount() >= GAME_CONFIG.TFIGHTER.MAX_COUNT) {
      return;
    }

    // Don't spawn T-fighters until player reaches minimum level
    if (this.player.getLevel() < GAME_CONFIG.TFIGHTER.MIN_LEVEL) {
      return;
    }

    let type = "tfighter"; // Default enemy type

    const spawnZones = this.createSpawnZones()

    // Pick a random spawn position
    const { x, y } = Phaser.Utils.Array.GetRandom(spawnZones);

    // Get an inactive enemy from the pool
    const enemy = this.enemies.get() as Phaser.Physics.Arcade.Sprite;

    if (enemy) {
      this.activateEnemy(enemy, x, y, type);
    }
  }




  /**
   * Activate an enemy from the pool with specific position
   */
  private activateEnemy(enemy: Phaser.Physics.Arcade.Sprite, x: number, y: number, type: string): void {
    enemy.setScale(1.5)
    enemy.setPosition(x, y);
    enemy.setActive(true);
    enemy.setDepth(50);
    enemy.setVisible(true);

    if (enemy.body)
      enemy.body.enable = true;// Activate the physics body

    // Reset health to max and track per-enemy maxHealth for correct bar scaling
    (enemy as any).health = GAME_CONFIG.ENEMY.MAX_HEALTH;
    (enemy as any).maxHealth = (enemy as any).health;

    enemy.setTexture(type);
    
    // Resize collider box here
    if (enemy.body) {
      enemy.body.setSize(16, 16);
      enemy.body.checkCollision.none = false;
    }

    // Create or update health bar
    this.createOrUpdateHealthBar(enemy);
    this.launchEnemy(enemy);

    // Add to our tracking set for faster iteration
    this.activeEnemies.add(enemy);

    // Set enemy type for identification
    (enemy as any).enemyType = type;

  }


  /**
   * Deactivate an enemy and return it to the pool
   */
  public deactivateEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {

    enemy.setActive(false);
    enemy.setVisible(false);
    enemy.setVelocity(0, 0);
    if (enemy.body)
      enemy.body.enable = false; // Deactivate the physics body
    //enemy.body.enable = false;// Disables the physics body

    // Remove health bar
    const healthBar = this.healthBars.get(enemy);
    if (healthBar) {
      healthBar.setVisible(false);
    }

    this.activeEnemies.delete(enemy);
  }

  /**
   * Deactivate all enemies in the pool
   */
  private deactivateAllEnemies(): void {
    const enemies = this.enemies.getChildren();
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i] as Phaser.Physics.Arcade.Sprite;
      this.deactivateEnemy(enemy);
    }
  }

  /**
   * Configure an enemy sprite with appropriate properties
   * Only needs to be done once when enemy is first created
   */
  private configureEnemyProperties(enemy: Phaser.Physics.Arcade.Sprite): void {
    const scale = 0.1;
    enemy.setDepth(GAME_CONFIG.TFIGHTER.DEPTH);
    (enemy as any).health = GAME_CONFIG.TFIGHTER.MAX_HEALTH;
    (enemy as any).maxHealth = (enemy as any).health;

    // Resize collider box here
    if (enemy.body) {
        enemy.body.updateFromGameObject();
        const width = enemy.width * scale;
        const height = enemy.height * scale;
        enemy.body.setSize(width, height);
    }

    // enemy.setOffset(
    //   (enemy.displayWidth - enemy.width) / 4,
    //   (enemy.displayHeight - enemy.height) / 4
    // );

  }

  /**
   * Basic movement for off-screen enemies (less accurate but more efficient)
   */
  private moveOffscreenEnemyBasic(enemy: Phaser.Physics.Arcade.Sprite): void {
    // Simplified movement toward player (less frequent updates, less precision)
    if (Math.random() < 0.1) { // Only update direction occasionally
      this.vectorBuffer.x = this.target.x - enemy.x;
      this.vectorBuffer.y = this.target.y - enemy.y;

      const length = Math.sqrt(
        this.vectorBuffer.x * this.vectorBuffer.x +
        this.vectorBuffer.y * this.vectorBuffer.y
      );

      if (length > 0) {
        enemy.setVelocity(
          (this.vectorBuffer.x / length) * GAME_CONFIG.TFIGHTER.SPEED * 0.8,
          (this.vectorBuffer.y / length) * GAME_CONFIG.TFIGHTER.SPEED * 0.8
        );
      }
    }
  }

  /**
   * Move an enemy toward the target (player) - accurate version for visible enemies
   */
  private launchEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    const cam = this.scene.cameras.main;
  
    // Target position (center of screen)
    const centerX = cam.scrollX + cam.width / 2;
    const centerY = cam.scrollY + cam.height / 2;
  
    // Direction from enemy to center
    const dx = centerX - enemy.x;
    const dy = centerY - enemy.y;
    const len = Math.sqrt(dx * dx + dy * dy);
  
    if (len > 0 && enemy.body) {
      const speed = 150;
      const vx = (dx / len) * speed;
      const vy = (dy / len) * speed;
      enemy.setVelocity(vx, vy);
    }
  }
  
  
  /**
   * Set the experience system reference
   */
  setExperienceSystem(experienceSystem: ExperienceSystem): void {
    this.experienceSystem = experienceSystem;
  }

  public showDamageNumber(scene: Phaser.Scene, x: number, y: number, damage: number, isCritical = false): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '24px',
      color: isCritical ? '#ff3333' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      fontFamily: 'Arial'
    };

    if (!damage) return;
    const text = scene.add.text(x, y, damage.toString(), style)
      .setDepth(100) // above other sprites
      .setOrigin(0.5);

    // Animate up and fade
    scene.tweens.add({
      targets: text,
      y: y - 20,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }


  /**
   * Apply damage to an enemy and handle effects
   * Returns true if the enemy was defeated
   */
  damageEnemy(enemy: Phaser.Physics.Arcade.Sprite, damage: number, knockbackForce?: number, isCritical = false): boolean {
    if (!enemy.active) return false;

    (enemy as any).health -= damage;
    this.updateHealthBar(enemy);

    if ((enemy as any).health <= 0) {
      this.showDamageNumber(this.scene, enemy.x, enemy.y - 10, damage, isCritical);
      this.dropExperienceOrb(enemy);
      this.dropRelic(enemy);
      this.deactivateEnemy(enemy);

      return true;
    }

    if (knockbackForce && enemy.body) {
      const vx = enemy.body.velocity.x;
      const vy = enemy.body.velocity.y;
      const length = Math.sqrt(vx * vx + vy * vy);

      if (length > 0) {
        const knockbackX = -(vx / length) * knockbackForce;
        const knockbackY = -(vy / length) * knockbackForce;
        const duration = GAME_CONFIG.TFIGHTER.KNOCKBACK_DURATION;

        // Calculate target position
        const targetX = enemy.x + knockbackX * (duration / 1000); // scale by duration
        const targetY = enemy.y + knockbackY * (duration / 1000);

        this.scene.tweens.add({
          targets: enemy,
          x: targetX,
          y: targetY,
          ease: 'Quad.easeOut',
          duration: duration,
          onComplete: () => {
            // Optionally do something after knockback
          }
        });
      }
    }

    this.showDamageNumber(this.scene, enemy.x, enemy.y - 10, damage, isCritical);

    return false;
  }


  /**
   * Drop an experience orb at the enemy's position
   */
  public dropExperienceOrb(enemy: Phaser.Physics.Arcade.Sprite): void {
    // Skip if no experience system is set
    if (!this.experienceSystem) return;

    // Spawn multiple orbs with small spread so they don't stack
    const numOrbs = 5;
    for (let i = 0; i < numOrbs; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 18; // 6..24px
      const ox = Math.cos(angle) * radius;
      const oy = Math.sin(angle) * radius;
      this.experienceSystem.spawnOrb(enemy.x + ox, enemy.y + oy);
    }
    // Add a small visual effect
    this.createDeathEffect(enemy.x, enemy.y);

  }

  /**
   * Drop a relic at the enemy's position (higher chance for T-fighters)
   */
  public dropRelic(enemy: Phaser.Physics.Arcade.Sprite): void {
    // Configurable chance to drop a relic from T-fighters
    if (Math.random() < GAME_CONFIG.TFIGHTER.RELIC_DROP_CHANCE) {
      //console.log("T-fighter dropping relic at:", enemy.x, enemy.y);
      this.scene.events.emit('relic-dropped', enemy.x, enemy.y);
    }
  }

  /**
   * Create a visual effect when an enemy is defeated
   */
  private createDeathEffect(x: number, y: number): void {
    // Emit event for particle effects system to handle
    this.scene.events.emit('enemy-death', x, y, 'tie_fighter');
  }

  /**
   * Create or update a health bar for an enemy
   */
  private createOrUpdateHealthBar(enemy: Phaser.Physics.Arcade.Sprite): void {
    let healthBar = this.healthBars.get(enemy);
    if (!healthBar) {
      // Create new health bar
      healthBar = this.scene.add.graphics();
      this.healthBars.set(enemy, healthBar);
    }

    // Update health bar appearance
    this.updateHealthBar(enemy);

    // Position the health bar
    this.updateHealthBarPosition(enemy);
  }

  /**
   * Update health bar appearance based on current health
   */
  public updateHealthBar(enemy: Phaser.Physics.Arcade.Sprite): void {
    const healthBar = this.healthBars.get(enemy);
    if (!healthBar) return;

    // Clear previous graphics
    healthBar.clear();

    // Get current health percentage
    const health = (enemy as any).health || GAME_CONFIG.TFIGHTER.MAX_HEALTH;
    const maxHealth = (enemy as any).maxHealth || GAME_CONFIG.TFIGHTER.MAX_HEALTH;
    const healthPercent = Math.max(0, Math.min(1, health / maxHealth));

    // Set health bar dimensions
    const width = 30;
    const height = 4;

    // Draw background (empty health)
    healthBar.fillStyle(0x222222, 0.8);
    healthBar.fillRect(-width / 2, -20, width, height);

    // Draw health (filled portion)
    if (healthPercent > 0) {
      // Color based on health percentage
      if (healthPercent > 0.6) {
        healthBar.fillStyle(0x00ff00, 0.8); // Green
      } else if (healthPercent > 0.3) {
        healthBar.fillStyle(0xffff00, 0.8); // Yellow
      } else {
        healthBar.fillStyle(0xff0000, 0.8); // Red
      }

      healthBar.fillRect(-width / 2, -20, width * healthPercent, height);
    }

    // Set depth to ensure it renders above the enemy
    healthBar.setDepth(GAME_CONFIG.TFIGHTER.DEPTH + 1);
  }

  /**
   * Update health bar position to follow the enemy
   */
  private updateHealthBarPosition(enemy: Phaser.Physics.Arcade.Sprite): void {
    const healthBar = this.healthBars.get(enemy);
    if (!healthBar) return;

    healthBar.setPosition(enemy.x, enemy.y);
    healthBar.setVisible(true);
  }

   /**
   * Update all active enemies - optimized for large quantities
   */
   update(_time: number, _delta: number): void {
    // Update camera rectangle for visibility checks
    const camera = this.scene.cameras.main;
    if (camera) {
      this.cameraRect.setTo(
        camera.scrollX - 100, // Buffer zone outside camera
        camera.scrollY - 100,
        camera.width + 200,
        camera.height + 200
      );
    }

    // Clear visible enemies array without allocating new one
    this.visibleEnemies.length = 0;

    // Process active enemies
    for (const enemy of this.activeEnemies) {
      
      //const type = (enemy as any).enemyType;
      
      // Only process on-screen enemies or those close to screen
      if (Phaser.Geom.Rectangle.Contains(this.cameraRect, enemy.x, enemy.y)) {
        this.visibleEnemies.push(enemy);
                
       
        //this.moveEnemyTowardTarget(enemy);

        // adjust to your preferred sizeate health bar position
        this.updateHealthBarPosition(enemy);
      } else {
        // Optionally apply simplified physics for off-screen enemies
        this.moveOffscreenEnemyBasic(enemy);

        // Hide health bar for off-screen enemies
        const healthBar = this.healthBars.get(enemy);
        if (healthBar) {
          healthBar.setVisible(false);
        }

        const isVisibleToCamera =
          enemy.x + enemy.width > camera.worldView.left &&
          enemy.x - enemy.width < camera.worldView.right &&
          enemy.y + enemy.height > camera.worldView.top &&
          enemy.y - enemy.height < camera.worldView.bottom;


        //if enemy is off screen for 2 seconds despawn enemy
        if (!isVisibleToCamera) {
          const elapsed = this.offscreenTimers.get(enemy) || 0;
          const newElapsed = elapsed + _delta;
          this.offscreenTimers.set(enemy, newElapsed);

          if (newElapsed > 10) {
            this.deactivateEnemy(enemy);
            this.offscreenTimers.delete(enemy);
            this.activeEnemies.delete(enemy);
          } 
          } else {
            //if back on screen reset the timer
            this.offscreenTimers.delete(enemy);
        }
        
  
      }
    }
  }


  /**
   * Clean up and destroy enemies if necessary
   */
  cleanup(): void {
    // Stop the spawn timer
    this.spawnTimer.destroy();

    // Deactivate all enemies
    for (const enemy of this.activeEnemies) {
      this.deactivateEnemy(enemy);
    }

    // Clean up health bars
    for (const healthBar of this.healthBars.values()) {
      healthBar.destroy();
    }
    this.healthBars.clear();
  }

  /**
   * Get the enemy group for collision detection
   */
  getEnemyGroup(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  /**
   * Get array of visible enemies for optimized collision
   */
  getVisibleEnemies(): Array<Phaser.Physics.Arcade.Sprite> {
    return this.visibleEnemies;
  }

  /**
   * Set a new target for enemies to follow
   */
  setTarget(target: Phaser.Physics.Arcade.Sprite): void {
    this.target = target;
  }

  /**
   * Apply stress test configuration
   */
  setStressTestConfig(config: {
    spawnInterval: number;
    maxCount: number;
  }): void {
    // Update spawn timer
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
    this.spawnTimer = this.scene.time.addEvent({
      delay: config.spawnInterval,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });

    // Update max count (resize group if needed)
    if (config.maxCount > this.enemies.maxSize) {
      this.enemies.maxSize = config.maxCount;
    }
  }

  /**
   * Get current T-fighter count
   */
  getEnemyCount(): number {
    return this.activeEnemies.size;
  }

  /**
   * Get total T-fighter count including inactive
   */
  getTotalEnemyCount(): number {
    return this.enemies.children.size;
  }
} 
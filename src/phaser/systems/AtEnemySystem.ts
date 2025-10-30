import Phaser from 'phaser';
import { ExperienceSystem } from './ExperienceSystem';
import { Player } from '../entities/Player';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * System responsible for AT enemy spawning, movement, and management
 * Independent system for complete control over AT enemy behavior
 */
export class AtEnemySystem {
  private scene: Phaser.Scene;
  private enemies: Phaser.Physics.Arcade.Group;
  private spawnTimer: Phaser.Time.TimerEvent;
  private target: Phaser.Physics.Arcade.Sprite;
  private experienceSystem: ExperienceSystem | null = null;

  // Tracking active enemies for improved performance
  private activeEnemies: Set<Phaser.Physics.Arcade.Sprite> = new Set();
  private cameraRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
  private visibleEnemies: Array<Phaser.Physics.Arcade.Sprite> = [];
  private spawnZones: Array<{ x: number, y: number }> = [];
  
  // Tracking enemies that are off screen 
  private offscreenTimers: Map<Phaser.Physics.Arcade.Sprite, number> = new Map();

  // Health bars for enemies
  private healthBars: Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.Graphics> = new Map();
  private healthBarsEnabled: boolean = true;


  // AT-specific properties
  private maxHealth: number = 50; // Higher health than regular enemies
  private damage: number = 15; // Higher damage
  private speed: number = 60; // Slower than regular enemies
  private scale: number = 0.4; // Even bigger size (320px -> 128px)
  
  // Shooting properties
  private shootingInterval: number = 3000; // ms between shooting attempts
  private shootingRange: number = 400; // Distance at which AT will try to shoot (much further)
  private shootingDuration: number = 1000; // How long AT stays still while shooting
  private projectileSystem: any = null; // Will be set by MainScene

  constructor(scene: Phaser.Scene, target: Phaser.Physics.Arcade.Sprite, _player: Player) {
    this.scene = scene;
    this.target = target;

    // Initialize enemy group with preallocated pool
    this.enemies = this.createEnemyGroup();

    // Set up collisions - AT enemies collide with themselves
    this.scene.physics.add.collider(this.enemies, this.enemies);

    // Pre-populate the object pool to avoid runtime allocations
    this.prepopulateEnemyPool();

    // Set up spawn timer (spawn less frequently than regular enemies)
    this.spawnTimer = this.startSpawnTimer();

    // Initialize spawn zones
    this.initializeSpawnZones();

    // Set up camera rectangle for culling
    this.updateCameraRect();
  }

  /**
   * Create the enemy group with object pooling
   */
  private createEnemyGroup(): Phaser.Physics.Arcade.Group {
    return this.scene.physics.add.group({
      defaultKey: 'at_enemy',
      maxSize: 50, // Smaller pool since AT enemies are rarer
      runChildUpdate: false // We'll handle updates manually for better control
    });
  }

  /**
   * Set up AT enemy animations
   */
  public static setupAtEnemyAnimations(scene: Phaser.Scene) {
    scene.anims.create({
      key: 'at_enemy',
      frames: scene.anims.generateFrameNumbers('at_enemy', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
  }

  /**
   * Pre-populate the enemy pool
   */
  private prepopulateEnemyPool(): void {
    for (let i = 0; i < 20; i++) {
      const enemy = this.enemies.get();
      if (enemy) {
        enemy.setActive(false);
        enemy.setVisible(false);
        enemy.setPosition(-1000, -1000); // Place off-screen
      }
    }
  }

  /**
   * Start the spawn timer
   */
  private startSpawnTimer(): Phaser.Time.TimerEvent {
    return this.scene.time.addEvent({
      delay: 3000, // Spawn every 3 seconds
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Initialize spawn zones around the camera
   */
  private initializeSpawnZones(): void {
    this.updateSpawnZones();
  }

  /**
   * Update spawn zones based on camera position
   */
  private updateSpawnZones(): void {
    const camera = this.scene.cameras.main;
    const margin = 200; // Distance from camera edge to spawn enemies
    
    this.spawnZones = [
      // Left side
      { x: camera.scrollX - margin, y: camera.centerY },
      // Right side
      { x: camera.scrollX + camera.width + margin, y: camera.centerY },
      // Top side
      { x: camera.centerX, y: camera.scrollY - margin },
      // Bottom side
      { x: camera.centerX, y: camera.scrollY + camera.height + margin }
    ];
  }

  /**
   * Update camera rectangle for culling
   */
  private updateCameraRect(): void {
    const camera = this.scene.cameras.main;
    this.cameraRect.setTo(
      camera.scrollX - 100,
      camera.scrollY - 100,
      camera.width + 200,
      camera.height + 200
    );
  }

  /**
   * Spawn a new AT enemy
   */
  private spawnEnemy(): void {
    if (this.enemies.countActive() >= 10) { // Max 10 AT enemies at once
      return;
    }

    // Update spawn zones
    this.updateSpawnZones();

    // Choose a random spawn zone
    const spawnZone = Phaser.Utils.Array.GetRandom(this.spawnZones);
    
    // Get enemy from pool
    const enemy = this.enemies.get();
    if (!enemy) return;

    // Configure enemy
    enemy.setActive(true);
    enemy.setVisible(true);
    enemy.setPosition(spawnZone.x, spawnZone.y);
    enemy.setScale(this.scale);
    
    // Set up physics body - narrower width, same height
    if (enemy.body) {
      enemy.body.setSize(enemy.width * 0.5, enemy.height * 0.8); // 50% width, 80% height
      enemy.body.setOffset(enemy.width * 0.25, enemy.height * 0.1); // Center the narrower hitbox
    }

    // Set enemy properties
    (enemy as any).health = this.maxHealth;
    (enemy as any).maxHealth = this.maxHealth;
    (enemy as any).damage = this.damage;
    (enemy as any).speed = this.speed;
    (enemy as any).lastDamageTime = 0;
    
    // Set shooting properties
    (enemy as any).isShooting = false;
    (enemy as any).lastShotTime = 0;
    (enemy as any).shootingStartTime = 0;

    // Start animation
    // Ensure animation exists before trying to play it
    if (!this.scene.anims.exists('at_enemy')) {
      if (this.scene.textures.exists('at_enemy')) {
        this.scene.anims.create({
          key: 'at_enemy',
          frames: this.scene.anims.generateFrameNumbers('at_enemy', { start: 0, end: 3 }),
          frameRate: 8,
          repeat: -1
        });
        console.log('AT enemy animation created');
      }
    }
    
    // Play animation
    if (this.scene.anims.exists('at_enemy')) {
      enemy.anims.play('at_enemy', true);
    } else {
      // Fallback to static texture
      enemy.setTexture('at_enemy', 0);
      console.log('Using static texture as fallback');
    }

    // Add to active enemies
    this.activeEnemies.add(enemy);

    // Create health bar if enabled
    if (this.healthBarsEnabled) {
      this.createHealthBar(enemy);
    }
  }

  /**
   * Create health bar for enemy
   */
  private createHealthBar(enemy: Phaser.Physics.Arcade.Sprite): void {
    const healthBar = this.scene.add.graphics();
    healthBar.setScrollFactor(0); // Fix to camera
    healthBar.setDepth(1500); // Above regular enemies
    this.healthBars.set(enemy, healthBar);
    this.updateHealthBar(enemy);
  }

  /**
   * Update health bar for enemy
   */
  private updateHealthBar(enemy: Phaser.Physics.Arcade.Sprite): void {
    const healthBar = this.healthBars.get(enemy);
    if (!healthBar || !enemy.active) return;

    const camera = this.scene.cameras.main;
    const x = enemy.x - camera.scrollX - 20;
    const y = enemy.y - camera.scrollY - 30;
    
    healthBar.clear();
    
    const healthPercent = (enemy as any).health / (enemy as any).maxHealth;
    const width = 40;
    const height = 4;
    
    // Background
    healthBar.fillStyle(0x222222, 0.8);
    healthBar.fillRect(x, y, width, height);
    
    // Health
    if (healthPercent > 0) {
      if (healthPercent > 0.6) {
        healthBar.fillStyle(0x00ff00, 0.8); // Green
      } else if (healthPercent > 0.3) {
        healthBar.fillStyle(0xffff00, 0.8); // Yellow
      } else {
        healthBar.fillStyle(0xff0000, 0.8); // Red
      }
      healthBar.fillRect(x, y, width * healthPercent, height);
    }
    
    // Border
    healthBar.lineStyle(1, 0xffffff, 1);
    healthBar.strokeRect(x, y, width, height);
  }

  /**
   * Damage an AT enemy
   */
  public damageEnemy(enemy: Phaser.Physics.Arcade.Sprite, damage: number, knockbackForce?: number, isCritical = false): boolean {
    if (!enemy.active) return false;

    (enemy as any).health -= damage;

    // Show floating damage number
    this.showDamageNumber(this.scene, enemy.x, enemy.y - 10, damage, isCritical);
    
    // Only update health bar if enabled
    if (this.healthBarsEnabled) {
      this.updateHealthBar(enemy);
    }
    
    // Apply knockback if specified
    if (knockbackForce && enemy.body) {
      const dx = enemy.x - this.target.x;
      const dy = enemy.y - this.target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const knockbackX = (dx / distance) * knockbackForce;
        const knockbackY = (dy / distance) * knockbackForce;
        enemy.setVelocity(knockbackX, knockbackY);
      }
    }
    
    // Check if enemy is dead
    if ((enemy as any).health <= 0) {
      // Also show number on death for emphasis
      this.showDamageNumber(this.scene, enemy.x, enemy.y - 10, damage, isCritical);
      this.killEnemy(enemy);
      return true;
    }
    
    return false;
  }

  /**
   * Show floating damage number above enemy
   */
  private showDamageNumber(scene: Phaser.Scene, x: number, y: number, damage: number, isCritical = false): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '24px',
      color: isCritical ? '#ff3333' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      fontFamily: 'Arial'
    };

    if (!damage) return;
    const text = scene.add.text(x, y, damage.toString(), style)
      .setDepth(100)
      .setOrigin(0.5);

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
   * Kill an AT enemy
   */
  private killEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    // Emit death event
    this.scene.events.emit('enemy-death', enemy.x, enemy.y, 'at_enemy');
    
    // Drop experience
    this.dropExperience(enemy);
    
    // Drop relic (higher chance than regular enemies)
    this.dropRelic(enemy);
    
    // Remove from active enemies
    this.activeEnemies.delete(enemy);
    
    // Remove health bar
    const healthBar = this.healthBars.get(enemy);
    if (healthBar) {
      healthBar.destroy();
      this.healthBars.delete(enemy);
    }
    
    // Remove from offscreen timers
    this.offscreenTimers.delete(enemy);
    
    // Return to pool
    enemy.setActive(false);
    enemy.setVisible(false);
    enemy.setPosition(-1000, -1000);
  }

  /**
   * Drop experience when enemy dies
   */
  private dropExperience(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (this.experienceSystem) {
      // Spawn multiple orbs with small spread so they don't stack
      const numOrbs = 5;
      for (let i = 0; i < numOrbs; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 6 + Math.random() * 18; // 6..24px
        const ox = Math.cos(angle) * radius;
        const oy = Math.sin(angle) * radius;
        this.experienceSystem.spawnOrb(enemy.x + ox, enemy.y + oy);
      }
    }
  }

  /**
   * Drop relic when enemy dies
   */
  private dropRelic(enemy: Phaser.Physics.Arcade.Sprite): void {
    // Configurable chance to drop a relic from AT enemies
    if (Math.random() < GAME_CONFIG.AT.RELIC_DROP_CHANCE) {
      this.scene.events.emit('relic-dropped', enemy.x, enemy.y);
    }
  }

  /**
   * Update all AT enemies
   */
  public update(): void {
    this.updateCameraRect();
    
    // Update visible enemies
    this.visibleEnemies = Array.from(this.activeEnemies).filter((enemy: Phaser.Physics.Arcade.Sprite) => 
      enemy.active && this.cameraRect.contains(enemy.x, enemy.y)
    );
    
    // Update each visible enemy
    this.visibleEnemies.forEach(enemy => {
      this.updateEnemy(enemy);
    });
    
    // Clean up off-screen enemies
    this.cleanupOffscreenEnemies();
  }

  /**
   * Update individual enemy
   */
  private updateEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (!enemy.active) return;
    
    const currentTime = this.scene.time.now;
    const dx = this.target.x - enemy.x;
    const dy = this.target.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if enemy should start shooting
    if (!(enemy as any).isShooting && 
        distance <= this.shootingRange && 
        currentTime - (enemy as any).lastShotTime >= this.shootingInterval) {
      this.startShooting(enemy);
    }
    
    // Handle shooting state
    if ((enemy as any).isShooting) {
      if (currentTime - (enemy as any).shootingStartTime >= this.shootingDuration) {
        this.stopShooting(enemy);
      } else {
        // Stay still while shooting
        enemy.setVelocity(0, 0);
      }
    } else {
      // Normal movement towards player
      if (distance > 0) {
        const speed = (enemy as any).speed;
        const moveX = (dx / distance) * speed;
        const moveY = (dy / distance) * speed;
        
        enemy.setVelocity(moveX, moveY);
        
        // Flip sprite based on movement direction
        if (moveX > 0) {
          enemy.setFlipX(true); // Moving right - flip to face right
        } else if (moveX < 0) {
          enemy.setFlipX(false); // Moving left - no flip to face left
        }
      }
    }
    
    // Update health bar position
    if (this.healthBarsEnabled) {
      this.updateHealthBar(enemy);
    }
  }

  /**
   * Clean up enemies that have been off-screen too long
   */
  private cleanupOffscreenEnemies(): void {
    const currentTime = this.scene.time.now;
    const maxOffscreenTime = 5000; // 5 seconds
    
    this.activeEnemies.forEach(enemy => {
      if (!this.cameraRect.contains(enemy.x, enemy.y)) {
        if (!this.offscreenTimers.has(enemy)) {
          this.offscreenTimers.set(enemy, currentTime);
        } else {
          const offscreenTime = currentTime - this.offscreenTimers.get(enemy)!;
          if (offscreenTime > maxOffscreenTime) {
            this.killEnemy(enemy);
          }
        }
      } else {
        this.offscreenTimers.delete(enemy);
      }
    });
  }

  /**
   * Set experience system reference
   */
  public setExperienceSystem(experienceSystem: ExperienceSystem): void {
    this.experienceSystem = experienceSystem;
  }

  /**
   * Get number of active AT enemies
   */
  public getEnemyCount(): number {
    return this.enemies.countActive();
  }

  /**
   * Get total number of AT enemies (including inactive)
   */
  public getTotalEnemyCount(): number {
    return this.enemies.getLength();
  }

  /**
   * Set stress test configuration
   */
  public setStressTestConfig(config: {
    spawnInterval: number;
    maxCount: number;
    healthBarsEnabled: boolean;
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

    // Store health bars setting
    this.healthBarsEnabled = config.healthBarsEnabled;
  }

  /**
   * Get the enemy group for collision detection
   */
  public getEnemyGroup(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  /**
   * Get visible enemies for collision detection
   */
  public getVisibleEnemies(): Phaser.Physics.Arcade.Sprite[] {
    return this.visibleEnemies;
  }

  /**
   * Start shooting state for enemy
   */
  private startShooting(enemy: Phaser.Physics.Arcade.Sprite): void {
    (enemy as any).isShooting = true;
    (enemy as any).shootingStartTime = this.scene.time.now;
    (enemy as any).lastShotTime = this.scene.time.now;
    
    // Fire projectile
    this.fireProjectile(enemy);
  }

  /**
   * Stop shooting state for enemy
   */
  private stopShooting(enemy: Phaser.Physics.Arcade.Sprite): void {
    (enemy as any).isShooting = false;
  }

  /**
   * Fire projectile from enemy
   */
  private fireProjectile(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (!this.projectileSystem) return;
    
    const dx = this.target.x - enemy.x;
    const dy = this.target.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      // Normalize direction
      const dirX = dx / distance;
      const dirY = dy / distance;
      
      // Fire enemy projectile using enemy laser pool
      this.projectileSystem.fire(
        'enemy_laser', // Use enemy laser pool (laser.png texture)
        enemy.x,
        enemy.y,
        dirX,
        dirY,
        'enemy_blaster' // Projectile type for enemy shots
      );
    }
  }

  /**
   * Set projectile system reference for shooting
   */
  public setProjectileSystem(projectileSystem: any): void {
    this.projectileSystem = projectileSystem;
  }

  /**
   * Clean up the system
   */
  public destroy(): void {
    // Destroy spawn timer
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
    
    // Destroy health bars
    this.healthBars.forEach(healthBar => healthBar.destroy());
    this.healthBars.clear();
    
    // Clear active enemies
    this.activeEnemies.clear();
    this.visibleEnemies = [];
    this.offscreenTimers.clear();
  }
}

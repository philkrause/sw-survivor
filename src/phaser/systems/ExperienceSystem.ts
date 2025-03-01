import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * System responsible for managing experience orbs
 * Handles spawning, collection, and player experience
 */
export class ExperienceSystem {
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private experienceOrbs: Phaser.Physics.Arcade.Group;
  private playerExperience: number = 0;
  
  // Tracking active orbs for improved performance
  private activeOrbs: Set<Phaser.Physics.Arcade.Sprite> = new Set();
  private cameraRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
  
  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;
    
    // Create the experience orb texture
    this.createOrbTexture();
    
    // Initialize experience orb group with pooling
    this.experienceOrbs = this.createOrbGroup();
    
    // Pre-populate the object pool to avoid runtime allocations
    this.prepopulateOrbPool();
  }
  
  /**
   * Create a circular texture for experience orbs
   */
  private createOrbTexture(): void {
    // Skip if texture already exists
    if (this.scene.textures.exists(GAME_CONFIG.EXPERIENCE_ORB.KEY)) {
      return;
    }
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0 });
    
    // Draw a filled circle
    graphics.fillStyle(0xffffff); // White (will be tinted later)
    graphics.fillCircle(8, 8, 8); // 16x16 circle
    
    // Generate texture from graphics
    graphics.generateTexture(GAME_CONFIG.EXPERIENCE_ORB.KEY, 16, 16);
    graphics.destroy();
  }
  
  /**
   * Create the experience orb physics group with pooling
   */
  private createOrbGroup(): Phaser.Physics.Arcade.Group {
    return this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: GAME_CONFIG.EXPERIENCE_ORB.MAX_COUNT,
      runChildUpdate: false // We'll handle updates manually
    });
  }
  
  /**
   * Prepopulate the orb pool to avoid runtime allocations
   */
  private prepopulateOrbPool(): void {
    for (let i = 0; i < GAME_CONFIG.EXPERIENCE_ORB.MAX_COUNT; i++) {
      const orb = this.experienceOrbs.create(0, 0, GAME_CONFIG.EXPERIENCE_ORB.KEY) as Phaser.Physics.Arcade.Sprite;
      orb.setActive(false);
      orb.setVisible(false);
      
      // Configure orb properties once
      this.configureOrbProperties(orb);
    }
  }
  
  /**
   * Configure an orb sprite with appropriate properties
   */
  private configureOrbProperties(orb: Phaser.Physics.Arcade.Sprite): void {
    orb.setScale(GAME_CONFIG.EXPERIENCE_ORB.SCALE);
    orb.setDepth(GAME_CONFIG.EXPERIENCE_ORB.DEPTH);
    orb.setTint(GAME_CONFIG.EXPERIENCE_ORB.TINT);
    
    // Store the orb's value
    (orb as any).value = GAME_CONFIG.EXPERIENCE_ORB.VALUE;
    
    // Store creation time for lifespan tracking
    (orb as any).createdAt = 0;
  }
  
  /**
   * Spawn an experience orb at the given position
   */
  spawnOrb(x: number, y: number): void {
    // Get an inactive orb from the pool
    const orb = this.experienceOrbs.get(x, y, GAME_CONFIG.EXPERIENCE_ORB.KEY) as Phaser.Physics.Arcade.Sprite;
    
    if (!orb) {
      // Pool is exhausted
      return;
    }
    
    // Activate the orb
    this.activateOrb(orb, x, y);
    
    // Add pulse animation
    this.scene.tweens.add({
      targets: orb,
      scale: GAME_CONFIG.EXPERIENCE_ORB.PULSE_SCALE * GAME_CONFIG.EXPERIENCE_ORB.SCALE,
      duration: GAME_CONFIG.EXPERIENCE_ORB.PULSE_DURATION / 2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  /**
   * Activate an orb from the pool
   */
  private activateOrb(orb: Phaser.Physics.Arcade.Sprite, x: number, y: number): void {
    orb.setPosition(x, y);
    orb.setActive(true);
    orb.setVisible(true);
    orb.setVelocity(0, 0);
    orb.setScale(GAME_CONFIG.EXPERIENCE_ORB.SCALE);
    orb.setTint(GAME_CONFIG.EXPERIENCE_ORB.TINT);
    
    // Mark creation time for lifespan tracking
    (orb as any).createdAt = this.scene.time.now;
    
    // Add to tracking set
    this.activeOrbs.add(orb);
  }
  
  /**
   * Deactivate an orb and return it to the pool
   */
  private deactivateOrb(orb: Phaser.Physics.Arcade.Sprite): void {
    orb.setActive(false);
    orb.setVisible(false);
    orb.setVelocity(0, 0);
    
    // Stop any tweens
    this.scene.tweens.killTweensOf(orb);
    
    // Remove from tracking set
    this.activeOrbs.delete(orb);
  }
  
  /**
   * Update experience orbs - handle lifespan and collection
   */
  update(): void {
    // Update camera rectangle for visibility checks
    const camera = this.scene.cameras.main;
    if (camera) {
      this.cameraRect.setTo(
        camera.scrollX - 100,
        camera.scrollY - 100,
        camera.width + 200,
        camera.height + 200
      );
    }
    
    // Get player position
    const playerX = this.player.x;
    const playerY = this.player.y;
    
    // Process active orbs
    for (const orb of this.activeOrbs) {
      // Check lifespan
      const createdAt = (orb as any).createdAt;
      const age = this.scene.time.now - createdAt;
      
      if (age >= GAME_CONFIG.EXPERIENCE_ORB.LIFESPAN) {
        this.deactivateOrb(orb);
        continue;
      }
      
      // Check if orb is on screen
      if (!Phaser.Geom.Rectangle.Contains(this.cameraRect, orb.x, orb.y)) {
        continue; // Skip off-screen orbs
      }
      
      // Calculate distance to player
      const dx = playerX - orb.x;
      const dy = playerY - orb.y;
      const distSquared = dx * dx + dy * dy;
      
      // Check for pickup
      const pickupRadiusSquared = GAME_CONFIG.PLAYER.EXPERIENCE.PICKUP_RADIUS * GAME_CONFIG.PLAYER.EXPERIENCE.PICKUP_RADIUS;
      if (distSquared <= pickupRadiusSquared) {
        // Collect the orb
        this.collectOrb(orb);
        continue;
      }
      
      // Check for magnet effect
      const magnetRadiusSquared = GAME_CONFIG.PLAYER.EXPERIENCE.MAGNET_RADIUS * GAME_CONFIG.PLAYER.EXPERIENCE.MAGNET_RADIUS;
      if (distSquared <= magnetRadiusSquared) {
        // Calculate direction to player
        const dist = Math.sqrt(distSquared);
        const dirX = dx / dist;
        const dirY = dy / dist;
        
        // Move toward player
        orb.setVelocity(
          dirX * GAME_CONFIG.PLAYER.EXPERIENCE.MAGNET_SPEED,
          dirY * GAME_CONFIG.PLAYER.EXPERIENCE.MAGNET_SPEED
        );
      } else {
        // Stop movement if outside magnet radius
        orb.setVelocity(0, 0);
      }
    }
  }
  
  /**
   * Collect an experience orb
   */
  private collectOrb(orb: Phaser.Physics.Arcade.Sprite): void {
    // Add experience
    this.playerExperience += (orb as any).value;
    
    // Visual feedback
    this.scene.tweens.add({
      targets: orb,
      scale: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.deactivateOrb(orb);
      }
    });
    
    // Emit event for other systems to react
    this.scene.events.emit('experience-collected', (orb as any).value, this.playerExperience);
  }
  
  /**
   * Get the player's current experience
   */
  getExperience(): number {
    return this.playerExperience;
  }
  
  /**
   * Get the experience orb group for collision detection
   */
  getOrbGroup(): Phaser.Physics.Arcade.Group {
    return this.experienceOrbs;
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    // Deactivate all orbs
    for (const orb of this.activeOrbs) {
      this.scene.tweens.killTweensOf(orb);
      this.deactivateOrb(orb);
    }
  }
} 
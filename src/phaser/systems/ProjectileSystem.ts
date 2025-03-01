import Phaser from 'phaser';

/**
 * Configuration for projectile pools
 */
export interface ProjectilePoolConfig {
  key: string;           // Texture key for this type of projectile
  maxSize: number;       // Maximum number of this projectile type
  speed: number;         // Movement speed
  lifespan: number;      // How long the projectile lives in ms
  scale: number;         // Visual scale
  depth: number;         // Render depth
  tint?: number;         // Optional color tint
  damage?: number;       // Damage value
  rotateToDirection?: boolean; // Whether projectile should rotate to face movement direction
}

/**
 * Manages efficient creation and recycling of game projectiles
 * Optimized for handling hundreds of active projectiles
 */
export class ProjectileSystem {
  private scene: Phaser.Scene;
  private projectilePools: Map<string, Phaser.Physics.Arcade.Group> = new Map();
  private poolConfigs: Map<string, ProjectilePoolConfig> = new Map();
  
  // Optimization: Reuse vector calculations to reduce garbage collection
  private vectorBuffer = { x: 0, y: 0 };
  private visibleProjectiles: Phaser.Physics.Arcade.Sprite[] = [];
  private cameraRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * Create a new projectile pool of a specific type
   */
  createPool(config: ProjectilePoolConfig): void {
    // Store config for later reference
    this.poolConfigs.set(config.key, config);
    
    // Create physics group for this projectile type
    const group = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: config.maxSize,
      active: false,
      visible: false,
      key: config.key
    });
    
    // Pre-populate pool with inactive projectiles
    for (let i = 0; i < config.maxSize; i++) {
      const projectile = group.create(0, 0, config.key) as Phaser.Physics.Arcade.Sprite;
      
      // Make sure projectile is not null before configuring
      if (projectile) {
        this.configureProjectile(projectile, config);
        projectile.setActive(false);
        projectile.setVisible(false);
        
        // Store lifespan data in a custom property
        (projectile as any).lifespan = config.lifespan;
        (projectile as any).createdAt = 0;
      }
    }
    
    this.projectilePools.set(config.key, group);
  }
  
  /**
   * Configure a projectile with its base properties
   */
  private configureProjectile(
    projectile: Phaser.Physics.Arcade.Sprite, 
    config: ProjectilePoolConfig
  ): void {
    projectile.setScale(config.scale);
    projectile.setDepth(config.depth);
    
    if (config.tint !== undefined) {
      projectile.setTint(config.tint);
    }
    
    // Store the projectile type on the instance for later reference
    (projectile as any).projectileType = config.key;
    (projectile as any).damage = config.damage || 1;
    (projectile as any).rotateToDirection = config.rotateToDirection || false;
  }
  
  /**
   * Fire a projectile from a specific position in a specific direction
   */
  fireProjectile(
    type: string, 
    x: number, 
    y: number, 
    directionX: number, 
    directionY: number
  ): Phaser.Physics.Arcade.Sprite | null {
    // Get the group for this projectile type
    const group = this.projectilePools.get(type);
    const config = this.poolConfigs.get(type);
    
    if (!group || !config) {
      console.warn(`Projectile pool for type "${type}" doesn't exist`);
      return null;
    }
    
    // Get an inactive projectile from the pool
    const projectile = group.get(x, y) as Phaser.Physics.Arcade.Sprite;
    
    if (!projectile) {
      // Pool is exhausted
      return null;
    }
    
    // Activate and configure the projectile
    projectile.setActive(true);
    projectile.setVisible(true);
    
    // Ensure consistent appearance by re-applying scale and tint
    projectile.setScale(config.scale);
    if (config.tint !== undefined) {
      projectile.setTint(config.tint);
    }
    
    // Normalize direction vector
    this.vectorBuffer.x = directionX;
    this.vectorBuffer.y = directionY;
    
    const length = Math.sqrt(
      this.vectorBuffer.x * this.vectorBuffer.x +
      this.vectorBuffer.y * this.vectorBuffer.y
    );
    
    if (length > 0) {
      this.vectorBuffer.x /= length;
      this.vectorBuffer.y /= length;
    }
    
    // Set velocity based on normalized direction and speed
    projectile.setVelocity(
      this.vectorBuffer.x * config.speed,
      this.vectorBuffer.y * config.speed
    );
    
    // Rotate projectile to face movement direction if needed
    if ((projectile as any).rotateToDirection) {
      projectile.rotation = Math.atan2(directionY, directionX);
    }
    
    // Mark creation time for lifespan tracking
    (projectile as any).createdAt = this.scene.time.now;
    
    return projectile;
  }
  
  /**
   * Update projectiles, handling lifespan and screen bounds
   */
  update(): void {
    // Update camera rectangle for visibility checks
    const camera = this.scene.cameras.main;
    if (camera) {
      this.cameraRect.setTo(
        camera.scrollX - 50,
        camera.scrollY - 50,
        camera.width + 100,
        camera.height + 100
      );
    }
    
    // Clear visible projectiles array
    this.visibleProjectiles.length = 0;
    
    // Process each projectile pool
    for (const [_, group] of this.projectilePools) {
      // Update active projectiles in this group
      const projectiles = group.getChildren();
      
      for (let i = 0; i < projectiles.length; i++) {
        const projectile = projectiles[i] as Phaser.Physics.Arcade.Sprite;
        
        if (!projectile.active) continue;
        
        // Check lifespan
        const lifespan = (projectile as any).lifespan;
        const createdAt = (projectile as any).createdAt;
        const age = this.scene.time.now - createdAt;
        
        if (age >= lifespan) {
          this.deactivateProjectile(projectile);
          continue;
        }
        
        // Check if the projectile is visible on screen
        if (Phaser.Geom.Rectangle.Contains(this.cameraRect, projectile.x, projectile.y)) {
          this.visibleProjectiles.push(projectile);
        } else {
          // Off-screen projectile - check if it's too far (cull distance)
          const cullDistance = 300; // Pixels beyond screen edge to cull
          
          const minX = this.cameraRect.x - cullDistance;
          const maxX = this.cameraRect.x + this.cameraRect.width + cullDistance;
          const minY = this.cameraRect.y - cullDistance;
          const maxY = this.cameraRect.y + this.cameraRect.height + cullDistance;
          
          if (projectile.x < minX || projectile.x > maxX || 
              projectile.y < minY || projectile.y > maxY) {
            // Projectile is too far off-screen, cull it
            this.deactivateProjectile(projectile);
          }
        }
      }
    }
  }
  
  /**
   * Deactivate a projectile and return it to its pool
   */
  deactivateProjectile(projectile: Phaser.Physics.Arcade.Sprite): void {
    projectile.setActive(false);
    projectile.setVisible(false);
    projectile.setVelocity(0, 0);
  }
  
  /**
   * Get all visible projectiles for collision checks
   */
  getVisibleProjectiles(): Phaser.Physics.Arcade.Sprite[] {
    return this.visibleProjectiles;
  }
  
  /**
   * Get a specific projectile group
   */
  getProjectileGroup(type: string): Phaser.Physics.Arcade.Group | undefined {
    return this.projectilePools.get(type);
  }
  
  /**
   * Get all projectile groups
   */
  getAllProjectileGroups(): Phaser.Physics.Arcade.Group[] {
    return Array.from(this.projectilePools.values());
  }
  
  /**
   * Clean up all projectiles
   */
  cleanup(): void {
    for (const [_, group] of this.projectilePools) {
      const projectiles = group.getChildren();
      
      for (let i = 0; i < projectiles.length; i++) {
        const projectile = projectiles[i] as Phaser.Physics.Arcade.Sprite;
        this.deactivateProjectile(projectile);
      }
    }
  }
} 
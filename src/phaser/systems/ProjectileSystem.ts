import Phaser from 'phaser';

/**
 * Configuration for projectile pools
 */
export interface ProjectileConfig {
  key: string;
  speed: number;
  lifespan: number;
  scale: number;
  damage: number;
  rotateToDirection: boolean;
  maxSize: number;
  maxCount: number;
  tint?: number;
  depth: number;
}


/**
 * Manages efficient creation and recycling of game projectiles
 * Optimized for handling hundreds of active projectiles
 */
export class ProjectileSystem {
  private scene: Phaser.Scene;
  public pools: Map<string, Phaser.Physics.Arcade.Group> = new Map();
  private configs: Map<string, ProjectileConfig> = new Map();
  private vectorBuffer = new Phaser.Math.Vector2();
  private visibleProjectiles: Phaser.Physics.Arcade.Sprite[] = [];



  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Get the camera's world view dimensions
    const camera = this.scene.cameras.main;
    console.log( `Camera dimensions: ${camera.width}x${camera.height}`);
  }



  createPool(config: ProjectileConfig): void {
    this.configs.set(config.key, config);

    const group = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: config.maxSize,
      active: false,
      visible: false,
      key: config.key
    });

    for (let i = 0; i < config.maxSize; i++) {
      const projectile = group.create(0, 0, config.key) as Phaser.Physics.Arcade.Sprite;

      // Make sure projectile is not null before configuring
      if (projectile) {
        projectile.setActive(false);
        projectile.setVisible(false);
        projectile.setScale(config.scale);
        projectile.setDepth(config.depth);

        if (config.tint !== undefined) {
          projectile.setTint(config.tint);
        }

        if (projectile.body) {
          projectile.body.enable = false; // Disable physics body initially
          projectile.body.setSize(projectile.width, projectile.height); // Set proper body size
        }

        // Store lifespan data in a custom property
        (projectile as any).lifespan = config.lifespan;
        (projectile as any).createdAt = 0;
      }
    }


    this.pools.set(config.key, group);
  }

  // private configureProjectile(
  //   projectile: Phaser.Physics.Arcade.Sprite,
  //   config: ProjectileConfig
  // ): void {
  //   projectile.setScale(config.scale);
  //   projectile.setDepth(config.depth);

  //   if (config.tint !== undefined) {
  //     projectile.setTint(config.tint);
  //   }

  //   // Store the projectile type on the instance for later reference
  //   (projectile as any).projectileType = config.key;
  //   (projectile as any).rotateToDirection = config.rotateToDirection || false;
  // }


  fire(
    key: string,
    x: number,
    y: number,
    dirX: number,
    dirY: number
  ): Phaser.Physics.Arcade.Sprite | null {
    const group = this.pools.get(key);
    const config = this.configs.get(key);

    if (!group || !config) {
      console.log("GROUP OR CONFIG NOT FOUND", group, config);
      return null;
    }

    const projectile = group.get(x, y) as Phaser.Physics.Arcade.Sprite;
    if (!projectile) {
      console.warn("PROJECTILE IN GROUP NOT FOUND");
      return null;
    }

    // Reset and configure the projectile
    projectile.setActive(true).setVisible(true);
    projectile.setPosition(x, y); // Set position
    projectile.setTexture(config.key); // Ensure the correct texture is applied
    projectile.setScale(config.scale);
    projectile.setDepth(config.depth);
    
    // Apply tint if specified
    if (config.tint !== undefined) {
      projectile.setTint(config.tint);
    }
    
    if (projectile.body) {
      projectile.body.enable = true; // Enable physics body
      projectile.setVelocity(0, 0); // Reset velocity
      projectile.body.setSize(projectile.width, projectile.height); // Ensure proper body size
    }

    // Set velocity based on direction
    const dir = this.vectorBuffer.set(dirX, dirY).normalize();
    projectile.setVelocity(dir.x * config.speed, dir.y * config.speed);

    // Set rotation if needed
    if (config.rotateToDirection) {
      projectile.setRotation(Math.atan2(dirY, dirX));
    }

    // Set custom data
    projectile.setData('lifespan', config.lifespan);
    projectile.setData('createdAt', this.scene.time.now);
    projectile.setData('damage', config.damage || 1);

    return projectile;
  }

  update(): void {
    // Clear visible projectiles array
    this.visibleProjectiles.length = 0;
    // Get the camera's world bounds
    const cameraBounds = this.scene.cameras.main.worldView;

    // Process each projectile pool
    for (const [_, group] of this.pools) {
      const projectiles = group.getChildren();
      for (let i = 0; i < projectiles.length; i++) {
        const projectile = projectiles[i] as Phaser.Physics.Arcade.Sprite;

        // Skip inactive projectiles
        if (!projectile.active) continue;
        
        if (
          projectile.x < cameraBounds.left || // Off-screen (left)
          projectile.x > cameraBounds.right || // Off-screen (right)
          projectile.y < cameraBounds.top || // Off-screen (top)
          projectile.y > cameraBounds.bottom // Off-screen (bottom)
        ) {
          this.deactivate(projectile);
          continue;
        }

        // Add to visible projectiles array if still active and on-screen
        this.visibleProjectiles.push(projectile);
      }
    }
  }

  deactivate(projectile: Phaser.Physics.Arcade.Sprite): void {
    
    if (!projectile.active) {
      console.log("projectile off screen")
      // If the projectile is already inactive, skip deactivation
      console.warn(`Attempted to deactivate an already inactive projectile at (${projectile.x}, ${projectile.y})`);
      return;
    }

    // Mark the projectile as inactive and invisible
    projectile.setActive(false).setVisible(false);

    if (projectile.body) {
      projectile.body.enable = false; // Disable physics body
      projectile.setVelocity(0, 0); // Reset velocity
    }

  }

  getVisibleProjectiles(): Phaser.Physics.Arcade.Sprite[] {
    return this.visibleProjectiles;
  }


  // /**
  //  * Get a specific projectile group
  //  */
  getProjectileGroup(key: string): Phaser.Physics.Arcade.Group | undefined {
    return this.pools.get(key);
  }

  // /**
  //  * Get all projectile groups
  //  */
  getAllProjectileGroups(): Phaser.Physics.Arcade.Group[] {
    return Array.from(this.pools.values());
  }

  // /**
  //  * Clean up all projectiles
  //  */
  cleanup(): void {
    for (const [_, group] of this.pools) {
      const projectiles = group.getChildren();

      for (let i = 0; i < projectiles.length; i++) {
        const projectile = projectiles[i] as Phaser.Physics.Arcade.Sprite;
        this.deactivate(projectile);
      }
    }
  }
} 
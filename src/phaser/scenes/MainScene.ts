import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnemySystem } from '../systems/EnemySystem';
import { GameUI } from '../ui/GameUI';
import { AssetManager } from '../systems/AssetManager';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { SaberSystem } from '../systems/SaberSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ForceSystem } from '../systems/ForceSystem';
import { R2D2System } from '../systems/R2D2System';


import { ExperienceSystem } from '../systems/ExperienceSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { UpgradeUI } from '../ui/UpgradeUI';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * Main game scene that coordinates all game systems and entities
 */
export default class MainScene extends Phaser.Scene {
  // Core systems
  private assetManager!: AssetManager;
  private player!: Player;
  private enemySystem!: EnemySystem;
  private collisionSystem!: CollisionSystem;
  private projectileSystem!: ProjectileSystem;
  private forceSystem!: ForceSystem;
  private saberSystem!: SaberSystem;
  private escapeKey!: Phaser.Input.Keyboard.Key;

  private R2D2System!: R2D2System;

  private experienceSystem!: ExperienceSystem;
  private upgradeSystem!: UpgradeSystem;
  private gameUI!: GameUI;
  private upgradeUI!: UpgradeUI;
  private background!: Phaser.GameObjects.TileSprite;
  // Game state
  private isPaused: boolean = false;

  // Performance tracking
  private perfText!: Phaser.GameObjects.Text;
  private lastFpsUpdate: number = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  /**
   * Preload all game assets
   */
  preload(): void {
    // Initialize asset manager and load assets
    this.assetManager = new AssetManager(this);
    this.assetManager.preloadAssets();

  }




  /**
   * Create game objects and initialize systems
   */
  create(): void {
    // Create the game world
    this.assetManager = new AssetManager(this);
    this.assetManager.createWorld();

    // Get the center coordinates for player placement
    const centerX = this.assetManager.getCameraWidth() / 2;
    const centerY = this.assetManager.getCameraHeight() / 2;


    if (this.input.keyboard) {
      this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    } else {
      console.warn("Keyboard input plugin not available");
    }


    // Create a tileSprite background
    this.background = this.add.tileSprite(
      0,
      0,
      this.cameras.main.width, // Full camera width
      this.cameras.main.height, // Full camera height
      'background' // Key for the background image
    )
      .setOrigin(0) // Align the background to the top-left corner
      .setScrollFactor(0) // Keep the background static relative to the camera
      .setScale(2); // Scale the background for zoom effect




    // ****** Instatiate SYSTEMS******   

    this.projectileSystem = new ProjectileSystem(this);

    this.player = new Player(this, centerX, centerY, this.projectileSystem);
    
    this.enemySystem = new EnemySystem(this, this.player.getSprite(), this.player);
    
    this.forceSystem = new ForceSystem(this, this.enemySystem, this.player);

    this.R2D2System = new R2D2System(this, this.enemySystem, this.player);

    this.saberSystem = new SaberSystem(this, this.enemySystem, this.player);

    this.collisionSystem = new CollisionSystem(this);
    

    this.events.on('projectile-pool-initialized', this.setupProjectileCollisions, this);

    // this.collisionSystem.setupEnemyEnemyCollision(
    //   this.enemySystem.getEnemyGroup(),
    //   this.filterEnemyCollisions.bind(this),
    // );

    this.collisionSystem.setupPlayerEnemyCollision(
      this.player.getSprite(),
      this.enemySystem.getEnemyGroup()
    );


    // Create player at center of screen 
    this.cameras.main.startFollow(this.player.getSprite(), true, 0.1, 0.1);




    //setup animations
    Player.setupAnimations(this);
    EnemySystem.setupEnemyAnimations(this);



    //setup saber attacks
    this.saberSystem.startAutoSlash(() => {
      const playerBody = this.player.getSprite();

      return {
        x: playerBody.x,
        y: playerBody.y,
        facingLeft: playerBody.flipX
      };
    });


    // Create experience system
    this.experienceSystem = new ExperienceSystem(this, this.player.getSprite());

    // Connect enemy system to experience system
    this.enemySystem.setExperienceSystem(this.experienceSystem);

    // Create upgrade system
    this.upgradeSystem = new UpgradeSystem(this, this.player);

    // Set up optimized collisions
    this.collisionSystem = new CollisionSystem(this);


    // Create game UI
    this.gameUI = new GameUI(this, this.player);

    // Create upgrade UI
    this.upgradeUI = new UpgradeUI(this, this.upgradeSystem);

    // Listen for upgrade UI events
    this.events.on('show-upgrade-ui', this.showUpgradeUI, this);

    // Listen for player level up events to adjust enemy spawn rate
    this.events.on('player-level-up', this.onPlayerLevelUp, this);

    // Add performance monitor
    this.perfText = this.add.text(10, this.cameras.main.height - 30, 'FPS: 0', {
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#000000'
    });
    this.perfText.setScrollFactor(0);


  }


  public setupProjectileCollisions(): void {
    // We'll use overlap instead of collider for better control
    // and only check collisions between visible enemies and player

    // Basic physics collisions between enemies for minimal physics interactions
    this.physics.add.collider(
      this.enemySystem.getEnemyGroup(),
      this.enemySystem.getEnemyGroup(),
      undefined,
      // Only perform collision for visible enemies that are close to each other 
      this.filterEnemyCollisions as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      this
    );

    // Set up projectile-enemy collisions for each projectile type
    const projectileGroup = this.projectileSystem.getProjectileGroup(GAME_CONFIG.BLASTER.PLAYER.KEY);

    if (projectileGroup) {
      this.physics.add.overlap(
        projectileGroup,
        this.enemySystem.getEnemyGroup(),
        this.handleProjectileEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        // Only check collisions for active projectiles and enemies
        (projectile, enemy) => {
          return (projectile as Phaser.Physics.Arcade.Sprite).active &&
            (enemy as Phaser.Physics.Arcade.Sprite).active;
        },
        this
      );
    }
  }

  /**
   * Handle collision between projectile and enemy
   */
  private handleProjectileEnemyCollision(
    projectile: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ): void {
    const p = projectile as Phaser.Physics.Arcade.Sprite;
    const e = enemy as Phaser.Physics.Arcade.Sprite;

    const damage: number = p.getData('damage');
    const isCritical: boolean = p.getData('critical') ?? false;
    this.enemySystem.damageEnemy(e, damage, 0, isCritical);
    this.projectileSystem.deactivate(p);
  }


  /**
   * Custom filter to optimize enemy-enemy collisions
   * Only performs collision checks when necessary
   */
  private filterEnemyCollisions(
    obj1: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    obj2: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ): boolean {
    // Skip collision checks between enemies that are far apart
    // This greatly reduces the number of collision checks
    const e1 = obj1 as Phaser.Physics.Arcade.Sprite;
    const e2 = obj2 as Phaser.Physics.Arcade.Sprite;

    // Skip inactive enemies
    if (!e1.active || !e2.active) {
      return false;
    }

    // Calculate squared distance
    const dx = e1.x - e2.x;
    const dy = e1.y - e2.y;
    const distSquared = dx * dx + dy * dy;

    // Only collide if they're close enough (avoid sqrt for performance)
    // Assuming enemies are about 32 pixels wide
    const collisionThreshold = 32; // 2x enemy width

    return distSquared < (collisionThreshold * collisionThreshold);
  }

  /**
   * Check for collisions between player and enemies
   */
  private checkPlayerEnemyCollisions(): void {
    const enemies = this.enemySystem.getVisibleEnemies();
    const playerBody = this.player.getSprite().body as Phaser.Physics.Arcade.Body;

    let isOverlapping = false;

    const playerRect = new Phaser.Geom.Rectangle(
      playerBody.x,
      playerBody.y,
      playerBody.width,
      playerBody.height
    );

    for (const enemy of enemies) {
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;

      const enemyRect = new Phaser.Geom.Rectangle(
        enemyBody.x,
        enemyBody.y,
        enemyBody.width,
        enemyBody.height
      );

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerRect, enemyRect)) {
        isOverlapping = true;
        break;
      }
    }

    this.player.setOverlapping(isOverlapping);
  }

  /**
   * Show the upgrade UI and pause the game
   */
  private showUpgradeUI(): void {
    // Pause the game
    this.pauseGame();

    this.upgradeSystem.dropFallingSprites(this, "byoda", 300)
    
    // Show upgrade UI
    this.upgradeUI.show(3, (upgradeId: string) => {
      // Apply the selected upgrade
      if (upgradeId) {
        this.upgradeSystem.applyUpgrade(upgradeId);
      }

      this.upgradeSystem.stopFallingSprites();
      // Resume the game
      this.resumeGame();

      // Notify player that upgrade is complete
      this.player.onUpgradeSelected();
    });
  }

  /**
   * Pause the game
   */
  private pauseGame(): void {
    this.isPaused = true;

    // Pause physics
    this.physics.pause();

    // Pause all timers
    this.time.paused = true;
  }

  /**
   * Resume the game
   */
  private resumeGame(): void {
    this.isPaused = false;

    // Resume physics
    this.physics.resume();

    // Resume all timers
    this.time.paused = false;
  }



  /**as
   * Main update loop
   */
  update(time: number, _delta: number): void {

    if(this.player.isDead()) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      if (this.isPaused) {
        this.resumeGame();
      } else {
        this.pauseGame();
      }
    }



    // Skip update if game is paused
    if (this.isPaused) return;

    // Update player
    this.player.update();

    const parallaxFactor = 0.5; // Adjust this factor to control the scrolling speed
    this.background.tilePositionX = this.cameras.main.scrollX * parallaxFactor;
    this.background.tilePositionY = this.cameras.main.scrollY * parallaxFactor;


    if (this.player.hasBlasterAbility())
      this.projectileSystem.update();

    // Update enemy system
    this.enemySystem.update(time, _delta);

    // Update experience system
    this.experienceSystem.update();

    //Update R2D2 system
    if (this.player.hasR2D2Ability()) {
      if (!this.R2D2System.isActive()) {
        this.R2D2System.unlockAndActivate();
      }

      this.R2D2System.update(_delta);
    }


    if (this.player.hasForceAbility()) {
      this.forceSystem.update(time);
    }



    // Check for collisions between player and enemies
    this.checkPlayerEnemyCollisions();

    // Update UI elements
    this.updateUI();

    // Update FPS counter every 500ms
    if (time - this.lastFpsUpdate > 500) {
      this.updateFpsCounter();
      this.lastFpsUpdate = time;
    }

  }

  /**
   * Update UI elements
   */
  private updateUI(): void {

    // Update enemy count
    //this.gameUI.updateEnemyCount(this.enemySystem.getEnemyCount());

    // Update player health
    this.gameUI.updateHealth(this.player.getHealth(), this.player.getMaxHealth());

    // Update player level
    //this.gameUI.updateLevel(this.player.getLevel());

    // Update experience bards
    this.gameUI.updateExperience(
      this.player.getExperience(),
      this.player.getExperienceToNextLevel(),
      this.player.getLevel()
    );
  }

  /**
   * Update the FPS counter
   */
  private updateFpsCounter(): void {
    this.perfText.setText(`FPS: ${Math.round(this.game.loop.actualFps)} | Enemies: ${this.enemySystem.getEnemyCount()} | Level: ${this.player.getLevel()}`);
  }

  /**
   * Clean up resources before scene shutdown
   */
  shutdown(): void {
    // Remove event listeners
    this.events.off('show-upgrade-ui', this.showUpgradeUI, this);
    this.events.off('player-level-up', this.onPlayerLevelUp, this);
  }

  /**
   * Handle player level up event
   */
  private onPlayerLevelUp(level: number): void {
    // Update enemy spawn rate based on new player level
    this.enemySystem.updateSpawnRate();

    console.log(`Player reached level ${level}! Adjusting enemy spawn rate.`);
  }
} 
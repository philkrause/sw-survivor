import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnemySystem } from '../systems/EnemySystem';
import { AtEnemySystem } from '../systems/AtEnemySystem';
import { GameUI } from '../ui/GameUI';
import { AssetManager } from '../systems/AssetManager';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { SaberSystem } from '../systems/SaberSystem';
import { ForceSystem } from '../systems/ForceSystem';
import { TfighterSystem } from '../systems/TfighterSystem';

import { R2D2System } from '../systems/R2D2System';
import { RelicSystem } from '../systems/RelicSystem';
import { ParticleEffects } from '../systems/ParticleEffects';

import { ExperienceSystem } from '../systems/ExperienceSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { UpgradeUI } from '../ui/UpgradeUI';
import { PauseMenu } from '../ui/PauseMenu';
import { GAME_CONFIG } from '../config/GameConfig';
import { PerformanceMonitor } from '../systems/PerformanceMonitor';
import { StressTestController } from '../systems/StressTestController';
import StartScene from './StartScene';

/**
 * Main game scene that coordinates all game systems and entities
 */
export default class MainScene extends Phaser.Scene {
  // Core systems
  private assetManager!: AssetManager;
  private player!: Player;
  private enemySystem!: EnemySystem;
  private atEnemySystem!: AtEnemySystem;
  private projectileSystem!: ProjectileSystem;
  private tfighterSystem!: TfighterSystem;
  private forceSystem!: ForceSystem;
  private saberSystem!: SaberSystem;
  private escapeKey!: Phaser.Input.Keyboard.Key;
  private R2D2System!: R2D2System;
  private relicSystem!: RelicSystem;
  private particleEffects!: ParticleEffects;

  private experienceSystem!: ExperienceSystem;
  private upgradeSystem!: UpgradeSystem;
  private gameUI!: GameUI;
  private upgradeUI!: UpgradeUI;
  private pauseMenu!: PauseMenu;
  private background!: Phaser.GameObjects.TileSprite;
  
  // Stress testing systems
  private performanceMonitor!: PerformanceMonitor;
  private stressTestController!: StressTestController;
  
  // Game state
  private isPaused: boolean = false;

  // Performance tracking
  private perfText!: Phaser.GameObjects.Text;
  private lastFpsUpdate: number = 0;
  private music!: Phaser.Sound.BaseSound;

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
    this.load.audio('game', '../../../assets/audio/sw-song1.mp3');
    this.load.audio('swing', '../../../assets/audio/swing.mp3');
  }




  /**
   * Create game objects and initialize systems
   */
  create(): void {
    // stop menu music
    
    if (this.music) {
      this.music.stop();
    }


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


    // music
    this.music = this.sound.add('game', {
      loop: true,     // makes it loop
      volume: 0     // Start muted
    });

    this.music.play();

    // ****** Instatiate SYSTEMS******   

    this.projectileSystem = new ProjectileSystem(this);

    this.player = new Player(this, centerX, centerY, this.projectileSystem);
    
    this.enemySystem = new EnemySystem(this, this.player.getSprite(), this.player);

    this.atEnemySystem = new AtEnemySystem(this, this.player.getSprite(), this.player);

    this.tfighterSystem = new TfighterSystem(this, this.player.getSprite(), this.player);

    this.forceSystem = new ForceSystem(this, this.enemySystem, this.tfighterSystem, this.player);

    this.R2D2System = new R2D2System(this, this.enemySystem, this.tfighterSystem, this.player);

    this.saberSystem = new SaberSystem(this, this.enemySystem, this.tfighterSystem, this.player );
    
    // Setup projectile collisions immediately after systems are created
    this.setupProjectileCollisions();





    // Create player at center of screen 
    this.cameras.main.startFollow(this.player.getSprite(), true, 0.1, 0.1);



    //setup animations
    Player.setupAnimations(this);
    EnemySystem.setupEnemyAnimations(this);
    AtEnemySystem.setupAtEnemyAnimations(this);
    
    //setup saber attacks - only start if player has saber ability
    this.events.on('upgrade-saber', () => {
      const playerBody = this.player.getSprite();

      this.saberSystem.startAutoSlash(() => ({
        x: playerBody.x,
        y: playerBody.y,
        facingLeft: playerBody.flipX
      }))
    });
    




    // Create experience system
    this.experienceSystem = new ExperienceSystem(this, this.player.getSprite());

    // Connect enemy system to experience system
    this.enemySystem.setExperienceSystem(this.experienceSystem);
    this.atEnemySystem.setExperienceSystem(this.experienceSystem);
    this.tfighterSystem.setExperienceSystem(this.experienceSystem);

    // Connect AT enemy system to projectile system for shooting
    this.atEnemySystem.setProjectileSystem(this.projectileSystem);


    // Create upgrade system
    this.upgradeSystem = new UpgradeSystem(this, this.player);


    // Create game UI
    this.gameUI = new GameUI(this, this.player);

    // Create relic system (needs GameUI reference)
    this.relicSystem = new RelicSystem(this, this.player, this.gameUI, this.upgradeSystem);

    // Initialize particle effects system
    this.particleEffects = new ParticleEffects(this);

    // Initialize stress testing systems
    this.performanceMonitor = new PerformanceMonitor(this);
    this.stressTestController = new StressTestController(this);
    
    // Set up stress test controller with system references
    this.stressTestController.setSystemReferences(
      this.player,
      this.enemySystem,
      this.atEnemySystem,
      this.tfighterSystem,
      this.projectileSystem,
      this.experienceSystem,
      this.particleEffects,
      this.relicSystem
    );

    // Create upgrade UI
    this.upgradeUI = new UpgradeUI(this, this.upgradeSystem);

    // Initialize pause menu
    this.pauseMenu = new PauseMenu(this, {
      onResume: () => this.resumeGame(),
      onVolumeChange: (volume: number) => this.setMusicVolume(volume),
      onQuit: () => this.quitToMenu()
    });

    // Listen for upgrade UI events
    this.events.on('show-upgrade-ui', this.showUpgradeUI, this);

    // Listen for player level up events to adjust enemy spawn rate
    this.events.on('player-level-up', this.onPlayerLevelUp, this);

    // Listen for particle effect events
    this.events.on('enemy-death', (x: number, y: number, enemyType: string) => {
      this.particleEffects.createDeathEffect(x, y, enemyType);
    });

    this.events.on('projectile-hit', (x: number, y: number, isCritical: boolean) => {
      this.particleEffects.createHitEffect(x, y, isCritical);
    });

    this.events.on('saber-hit', (x: number, y: number, isCritical: boolean) => {
      this.particleEffects.createSaberImpact(x, y, isCritical);
    });

    this.events.on('force-push', (x: number, y: number) => {
      this.particleEffects.createForceEffect(x, y);
    });

    this.events.on('level-up', (x: number, y: number) => {
      this.particleEffects.createLevelUpEffect(x, y);
    });

    this.events.on('relic-collected', (x: number, y: number) => {
      this.particleEffects.createRelicEffect(x, y);
    });

    this.events.on('damage-number', (x: number, y: number, damage: number, isCritical: boolean) => {
      this.particleEffects.createDamageNumber(x, y, damage, isCritical);
    });

    // this.events.once('player-level-5', (player: Player) => {
    // });
    

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
    //console.log("Setting up projectile collisions");
    
    // Set up projectile-enemy collisions for each projectile type
    const projectileGroup = this.projectileSystem.getProjectileGroup(GAME_CONFIG.BLASTER.PLAYER.KEY);

    if (projectileGroup) {
      //console.log("Setting up projectile-enemy collisions for blaster projectiles");
      //console.log("Projectile group size:", projectileGroup.getLength());
      //console.log("Enemy group size:", this.enemySystem.getEnemyGroup().getLength());
      
      this.physics.add.overlap(
        projectileGroup,
        this.enemySystem.getEnemyGroup(),
        this.handleProjectileEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        // Only check collisions for active projectiles and enemies
        (projectile, enemy) => {
          const pActive = (projectile as Phaser.Physics.Arcade.Sprite).active;
          const eActive = (enemy as Phaser.Physics.Arcade.Sprite).active;
          return pActive && eActive;
        },
        this
      );  
    } else {
      console.error("Projectile group not found!");
    }

    if (projectileGroup) {
      this.physics.add.overlap(
        projectileGroup,
        this.tfighterSystem.getEnemyGroup(),
        this.handleProjectileTfighterCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        // Only check collisions for active projectiles and enemies
        (projectile, enemy) => {
          return (projectile as Phaser.Physics.Arcade.Sprite).active &&
            (enemy as Phaser.Physics.Arcade.Sprite).active;
        },
        this
      );
    }

    // AT enemy collision detection
    if (projectileGroup) {
      this.physics.add.overlap(
        projectileGroup,
        this.atEnemySystem.getEnemyGroup(),
        this.handleProjectileAtEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        // Only check collisions for active projectiles and enemies
        (projectile, enemy) => {
          return (projectile as Phaser.Physics.Arcade.Sprite).active &&
            (enemy as Phaser.Physics.Arcade.Sprite).active;
        },
        this
      );
    }
    
    // Set up collisions between ground-based enemies
    // AT enemies collide with regular enemies (both are ground-based)
    this.physics.add.collider(
      this.atEnemySystem.getEnemyGroup(),
      this.enemySystem.getEnemyGroup()
    );
    
    // Set up collision detection for enemy projectiles hitting player
    const enemyProjectileGroup = this.projectileSystem.getProjectileGroup('enemy_laser');
    if (enemyProjectileGroup) {
      this.physics.add.overlap(
        enemyProjectileGroup,
        this.player.getSprite(),
        this.handleEnemyProjectilePlayerCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        (player,projectile) => {
          // Ensure both bodies are active; note: params are in the same order as overlap objs
          const projActive = (projectile as Phaser.Physics.Arcade.Sprite).active;
          const plyrActive = (player as Phaser.Physics.Arcade.Sprite).active;
          return projActive && plyrActive;
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
    
    // Emit hit effect event
    this.events.emit('projectile-hit', e.x, e.y, isCritical);
    
    this.enemySystem.damageEnemy(e, damage, 0, isCritical);

    this.projectileSystem.deactivate(p);
  }

  private handleProjectileTfighterCollision(
    projectile: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ): void {
    const p = projectile as Phaser.Physics.Arcade.Sprite;
    const e = enemy as Phaser.Physics.Arcade.Sprite;

    const damage: number = p.getData('damage');
    const isCritical: boolean = p.getData('critical') ?? false;
    
    // Emit hit effect event
    this.events.emit('projectile-hit', e.x, e.y, isCritical);
    
    this.tfighterSystem.damageEnemy(e, damage, 0, isCritical);

    this.projectileSystem.deactivate(p);
  }

  /**
   * Handle collision between projectile and AT enemy
   */
  private handleProjectileAtEnemyCollision(
    projectile: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ): void {
    const p = projectile as Phaser.Physics.Arcade.Sprite;
    const e = enemy as Phaser.Physics.Arcade.Sprite;

    const damage: number = p.getData('damage');
    const isCritical: boolean = p.getData('critical') ?? false;
    
    // Emit hit effect event
    this.events.emit('projectile-hit', e.x, e.y, isCritical);
    
    // Damage the AT enemy
    const isDead = this.atEnemySystem.damageEnemy(e, damage, 50, isCritical);
    
    if (isDead) {
      // Emit death effect event
      this.events.emit('enemy-death', e.x, e.y, 'at_enemy');
    }
    
    // Deactivate projectile
    this.projectileSystem.deactivate(p);
  }

  /**
   * Handle collision between enemy projectile and player
   */
  private handleEnemyProjectilePlayerCollision(player: Phaser.Physics.Arcade.Sprite, projectile: Phaser.Physics.Arcade.Sprite): void {
    // Check if projectile is still active (prevent multiple hits)
    if (!projectile.active) {
      return;
    }
    
    // Deactivate the projectile IMMEDIATELY to prevent multiple hits
    this.projectileSystem.deactivate(projectile);
    
    // Deal damage to player
    const damage = 10; // AT enemy projectile damage
    this.player.takeDamage(damage);
    
    // Emit hit effect
    this.events.emit('projectile-hit', projectile.x, projectile.y, false);
  }

    
  /**
   * Check for collisions between player and enemies
   */
  private checkPlayerEnemyCollisions(...enemyGroups: Phaser.Physics.Arcade.Sprite[][]): void {
    const playerSprite = this.player.getSprite();
    if (!playerSprite || !playerSprite.body) {
      return; // Skip collision check if player sprite or body is not available
    }
    
    const playerBody = playerSprite.body as Phaser.Physics.Arcade.Body;
    const playerRect = new Phaser.Geom.Rectangle(
      playerBody.x,
      playerBody.y,
      playerBody.width,
      playerBody.height
    );
  
    let isOverlapping = false;
  
    for (const group of enemyGroups) {
      for (const enemy of group) {
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
      if (isOverlapping) break;
    }
    
    this.player.setOverlapping(isOverlapping);
  }
  

  /**
   * Show the upgrade UI and pause the game
   */
  private showUpgradeUI(): void {
    // Pause the game without showing pause menu
    this.pauseGameWithoutMenu();

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

    // Show pause menu
    this.pauseMenu.show();
  }

  private pauseGameWithoutMenu(): void {
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

    // Hide pause menu
    this.pauseMenu.hide();

    // Ensure UI elements reappear
    if (this.gameUI && (this.gameUI as any).ensureUIVisible) {
      (this.gameUI as any).ensureUIVisible();
      // Force a health/exp redraw using current values
      this.gameUI.updateHealth(this.player.getHealth(), this.player.getMaxHealth());
      this.gameUI.updateExperience(this.player.getExperience(), this.player.getExperienceToNextLevel());
    }

    // Ensure stress test UI reappears
    if (this.stressTestController && (this.stressTestController as any).ensureUIVisible) {
      (this.stressTestController as any).ensureUIVisible();
    }
  }

  /**
   * Set music volume
   */
  private setMusicVolume(volume: number): void {
    if (this.music) {
      (this.music as Phaser.Sound.WebAudioSound).setVolume(volume);
    }
    // Store volume for future music
    this.sound.volume = volume;
  }

  /**
   * Quit to main menu
   */
  private quitToMenu(): void {
    this.pauseMenu.hide();
    this.scene.stop('MainScene');
    this.scene.remove('StartScene');
    this.scene.add('StartScene', StartScene, true);
  }

  /**as
   * Main update loop
   */
  update(time: number, _delta: number): void {

    if(this.player.isDead()) {
      return;
    }

    // Disable ESC while relic screen is open or while paused
    const relicOpen = this.relicSystem && this.relicSystem.isScreenOpen && this.relicSystem.isScreenOpen();
    if (!this.isPaused && !relicOpen) {
      if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
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

    // Update enemy systems
    this.enemySystem.update(time, _delta);
    this.atEnemySystem.update();
    this.tfighterSystem.update(time, _delta);


    // Update experience system
    this.experienceSystem.update();

    // Update performance monitoring
    const totalEnemies = this.enemySystem.getEnemyCount() + this.atEnemySystem.getEnemyCount() + this.tfighterSystem.getEnemyCount();
    this.performanceMonitor.update(totalEnemies);

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
    this.checkPlayerEnemyCollisions(this.enemySystem.getVisibleEnemies());

    // Check AT enemy collisions
    this.checkPlayerEnemyCollisions(this.atEnemySystem.getVisibleEnemies());

    if(this.tfighterSystem)
      this.checkPlayerEnemyCollisions(this.tfighterSystem.getVisibleEnemies());

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

    // Update game timer
    this.gameUI.updateTimer();
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
    this.tfighterSystem.updateSpawnRate();
    
    // Emit level up particle effect
    const playerPos = this.player.getPosition();
    this.events.emit('level-up', playerPos.x, playerPos.y);
    
    console.log(`Player reached level ${level}! Adjusting enemy spawn rate.`);
  }

  destroy(): void {
    // Clean up event listeners
    this.events.off('show-upgrade-ui', this.showUpgradeUI, this);
    
    // Clean up stress testing systems
    if (this.performanceMonitor) {
      this.performanceMonitor.hide();
    }
    if (this.stressTestController) {
      this.stressTestController.destroy();
    }
    
    // Clean up pause menu
    if (this.pauseMenu) {
      this.pauseMenu.cleanup();
    }
  }
} 
import Phaser from 'phaser';
import { DEFAULT_DIMENSIONS } from '../config/GameConfig';

/**
 * Manages loading and creating game assets
 */
export class AssetManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Preload all game assets
   */
  preloadAssets(): void {


    // ********** PLAYER **********
    this.scene.load.image('player', 'assets/images/game/luke1_start_blaster2.png');

    // Load both player spritesheets
    this.scene.load.spritesheet('player_walk_right_no_saber', 'assets/images/game/luke1_walk_right_blaster2.png', {
      frameWidth: 36,
      frameHeight: 34
    });

    this.scene.load.spritesheet('player_walk_right_with_saber', 'assets/images/game/luke1_walk_right_trim.png', {
      frameWidth: 36,
      frameHeight: 34
    });


    // ************** PLAYER ATTACKS **********
    this.scene.load.image('sword', 'assets/images/game/sword_attack.png');

    this.scene.load.image('blue_slash', 'assets/images/game/blue_slash_inv.png');

    this.scene.load.image('blaster', 'assets/images/game/laser.png');

    this.scene.load.spritesheet('force_anim', 'assets/images/game/force_anim1.png', {
      frameWidth: 48,
      frameHeight: 41
    });


    this.scene.load.image('r2d2', 'assets/images/game/r2d2.png');

    this.scene.load.image('bb88', 'assets/images/game/bb88.png');

    this.scene.load.image('tfighter', 'assets/images/game/tfighter_resize.png');

    this.scene.load.image('blue_particle', 'assets/images/game/blue.png');

    // ************* EXTRAS **************
    this.scene.load.image('byoda', 'assets/images/game/babyyoda.png');

    // ************* ENEMIES **************
    this.scene.load.spritesheet('storm', 'assets/images/game/storm_walk.png', {
      frameWidth: 31,
      frameHeight: 25
    });

    this.scene.load.spritesheet('soldier1', 'assets/images/game/soldier1_walk.png', {
      frameWidth: 21,
      frameHeight: 25
    });

    this.scene.load.image('dune', 'assets/images/game/dune.png');


    this.scene.load.image('enemy', 'assets/images/game/enemy.png');

    // ****** ENVIRONMENT *******

    // Load world background
    this.scene.load.image('background', 'assets/images/game/desertlevel1.png');
    
    // ****** PARTICLES *******

    this.scene.load.image('spark', 'assets/images/game/spark1.png');

    // ****** RELICS & CHESTS *******
    this.scene.load.image('chest', 'assets/images/game/chest.png');
    this.scene.load.image('chest_open', 'assets/images/game/chest_open.png');
    this.scene.load.spritesheet('relics', 'assets/images/game/relics.png', {
      frameWidth: 16,
      frameHeight: 16
    });

    // Create upgrade icons
    this.createUpgradeIcons();
  }




  /**
   * Create the game world
   */
  createWorld(): void {
    const width = this.getCameraWidth();
    const height = this.getCameraHeight();

    const backgroundScaleFactor = 2; // Adjust the scale factor for the background

    // Add and scale the background
    const background = this.scene.add.image(width / 2, height / 2, 'background')
      .setOrigin(0.5, 0.5) // Center the background
      .setScale(backgroundScaleFactor); // Scale the background independently

    // Background dimensions after scaling

    // Create player animations
    this.createPlayerAnimations();
  }

  /**
   * Create player animations
   */
  private createPlayerAnimations(): void {
    console.log("Creating player animations...");
    
    // Create animation for player without saber (3 frames: 0-2)
    this.scene.anims.create({
      key: 'player_walk_right_no_saber',
      frames: this.scene.anims.generateFrameNumbers('player_walk_right_no_saber', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1
    });

    // Create animation for player with saber (3 frames: 0-2)
    this.scene.anims.create({
      key: 'player_walk_right_with_saber',
      frames: this.scene.anims.generateFrameNumbers('player_walk_right_with_saber', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1
    });
    
    console.log("Player animations created successfully");
  }

  /**
   * Create upgrade icons as textures
   */
  private createUpgradeIcons(): void {
    // Create damage icon (red sword)
    this.createIconTexture('damage_icon', 0xff0000);

    // Create attack speed icon (yellow lightning)
    this.createIconTexture('speed_icon', 0xffff00);

    // Create multi-shot icon (blue triple dots)
    this.createIconTexture('multishot_icon', 0x0000ff);

    // Create size icon (green circle)
    this.createIconTexture('size_icon', 0x00ff00);

    // Create health icon (pink heart)
    this.createIconTexture('health_icon', 0xff00ff);

    // Create movement icon (cyan boots)
    this.createIconTexture('movement_icon', 0x00ffff);

    // Create saber unlock icon (blue lightsaber)
    this.createIconTexture('saber_icon', 0x0088ff);

    // Create force unlock icon (purple force)
    this.createIconTexture('force_unlock_icon', 0xaa00ff);

    // Create R2D2 icon (silver droid)
    this.createIconTexture('r2d2_icon', 0xcccccc);

    // Create blaster unlock icon (red blaster)
    this.createIconTexture('blaster_unlock_icon', 0xff0000);

    // Create relic icon (golden star)
    this.createIconTexture('relic_icon', 0xffd700);
  }

  /**
   * Create a simple colored icon texture
   */
  private createIconTexture(key: string, color: number): void {
    // Skip if texture already exists
    if (this.scene.textures.exists(key)) {
      return;
    }

    const graphics = this.scene.make.graphics({ x: 0, y: 0 });

    // Draw a filled circle with border
    graphics.fillStyle(color, 1);
    graphics.fillCircle(32, 32, 28);

    // Add border
    graphics.lineStyle(4, 0xffffff, 1);
    graphics.strokeCircle(32, 32, 28);

    // Generate texture
    graphics.generateTexture(key, 64, 64);
    graphics.destroy();
  }

  /**
   * Get camera width
   */
  getCameraWidth(): number {
    return this.scene.cameras.main?.width || DEFAULT_DIMENSIONS.WIDTH;
  }

  /**
   * Get camera height
   */
  getCameraHeight(): number {
    return this.scene.cameras.main?.height || DEFAULT_DIMENSIONS.HEIGHT;
  }
} 
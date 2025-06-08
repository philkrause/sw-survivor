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
    this.scene.load.image('player', 'assets/images/game/luke.png');

    this.scene.load.spritesheet('player_walk_right', 'assets/images/game/luke1_walk_right_trim.png', {
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

    this.scene.load.image('enemy', 'assets/images/game/enemy.png');

    // ****** ENVIRONMENT *******

    // Load world background
    this.scene.load.image('background', 'assets/images/game/desertlevel1.png');

    // ****** PARTICLES *******

    this.scene.load.image('spark', 'assets/images/game/spark1.png');


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

    console.log(`Background dimensions after scaling: (${background.displayWidth}, ${background.displayHeight})`);
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
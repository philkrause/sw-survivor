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
    // Load player sprite
    this.scene.load.image('player', 'assets/images/game/player.png');
    
    // Load enemy sprite
    this.scene.load.image('enemy', 'assets/images/game/enemy.png');
    
    // Load world background
    this.scene.load.image('background', 'assets/images/game/game-bg.png');
    
    // Create upgrade icons
    this.createUpgradeIcons();
  }
  
  /**
   * Create the game world
   */
  createWorld(): void {
    const width = this.getCameraWidth();
    const height = this.getCameraHeight();
    
    // Add background image
    this.scene.add.image(width / 2, height / 2, 'background')
      .setDisplaySize(width, height);
    
    // Set world physics boundaries
    this.scene.physics.world.setBounds(0, 0, width, height);
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
import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * Manages all UI elements in the game
 */
export class GameUI {
  private scene: Phaser.Scene;
  private enemyCountText: Phaser.GameObjects.Text;
  private healthText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private experienceBar: Phaser.GameObjects.Graphics;
  private healthBar: Phaser.GameObjects.Graphics;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Create UI elements
    this.createInstructionText();
    this.enemyCountText = this.createEnemyCounterText();
    this.healthText = this.createHealthText();
    this.levelText = this.createLevelText();
    this.healthBar = this.createHealthBar();
    this.experienceBar = this.createExperienceBar();
    
    // Listen for level up events
    this.scene.events.on('player-level-up', this.onPlayerLevelUp, this);
  }
  
  /**
   * Create instruction text for the player
   */
  private createInstructionText(): void {
    // Movement instructions
    this.scene.add.text(16, 16, 'Use WASD or Arrow keys to move', GAME_CONFIG.UI.TEXT_STYLE);
    
    // Enemy info
    this.scene.add.text(16, 40, 'Enemies will spawn around the edges', GAME_CONFIG.UI.TEXT_STYLE);
    
    // Health info
    this.scene.add.text(16, 64, 'Avoid enemies to prevent taking damage', GAME_CONFIG.UI.TEXT_STYLE);
    
    // Experience info
    this.scene.add.text(16, 88, 'Collect cyan orbs for experience', GAME_CONFIG.UI.TEXT_STYLE);
  }
  
  /**
   * Create a text display for the enemy counter
   */
  private createEnemyCounterText(): Phaser.GameObjects.Text {
    return this.scene.add.text(16, 112, 'Enemies: 0', GAME_CONFIG.UI.TEXT_STYLE);
  }
  
  /**
   * Create a text display for player health
   */
  private createHealthText(): Phaser.GameObjects.Text {
    return this.scene.add.text(16, 136, 'Health: 100/100', GAME_CONFIG.UI.TEXT_STYLE);
  }
  
  /**
   * Create a text display for player level
   */
  private createLevelText(): Phaser.GameObjects.Text {
    return this.scene.add.text(16, 160, 'Level: 1', GAME_CONFIG.UI.TEXT_STYLE);
  }
  
  /**
   * Create a health bar
   */
  private createHealthBar(): Phaser.GameObjects.Graphics {
    const healthBar = this.scene.add.graphics();
    healthBar.setScrollFactor(0); // Fix to camera
    healthBar.setDepth(1000); // Increase depth to ensure visibility
    return healthBar;
  }
  
  /**
   * Create an experience bar
   */
  private createExperienceBar(): Phaser.GameObjects.Graphics {
    const experienceBar = this.scene.add.graphics();
    experienceBar.setScrollFactor(0); // Fix to camera
    experienceBar.setDepth(1000); // Increase depth to ensure visibility
    return experienceBar;
  }
  
  /**
   * Update the enemy counter display
   */
  updateEnemyCount(count: number): void {
    this.enemyCountText.setText(`Enemies: ${count}`);
  }
  
  /**
   * Update the health display
   */
  updateHealth(current: number, max: number): void {
    this.healthText.setText(`Health: ${current}/${max}`);
    this.updateHealthBar(current, max);
  }
  
  /**
   * Update the health bar
   */
  private updateHealthBar(current: number, max: number): void {
    const healthBar = this.healthBar;
    
    // Clear previous graphics
    healthBar.clear();
    
    // Calculate health percentage
    const healthPercent = Math.max(0, Math.min(1, current / max));
    
    // Get dimensions
    const width = GAME_CONFIG.PLAYER.HEALTH_BAR_WIDTH;
    const height = GAME_CONFIG.PLAYER.HEALTH_BAR_HEIGHT;
    
    // Position at bottom-center of screen
    const x = (this.scene.cameras.main.width - width) / 2;
    const y = this.scene.cameras.main.height - height - 40; // 40px from bottom
    
    // Draw background (empty health)
    healthBar.fillStyle(0x222222, 0.8);
    healthBar.fillRect(x, y, width, height);
    
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
      
      healthBar.fillRect(x, y, width * healthPercent, height);
    }
    
    // Add border
    healthBar.lineStyle(2, 0xffffff, 1);
    healthBar.strokeRect(x, y, width, height);
    
    // Add text
    const healthText = `${current}/${max}`;
    
    // Remove any existing text
    const existingText = this.scene.children.getByName('health-text');
    if (existingText) {
      existingText.destroy();
    }
    
    // Add new text
    this.scene.add.text(x + width / 2, y + height / 2, healthText, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setName('health-text').setScrollFactor(0).setDepth(1000);
  }
  
  /**
   * Update the level display
   */
  updateLevel(level: number): void {
    this.levelText.setText(`Level: ${level}`);
  }
  
  /**
   * Update the experience bar
   */
  updateExperience(current: number, nextLevel: number, level: number): void {
    const experienceBar = this.experienceBar;
    
    // Clear previous graphics
    experienceBar.clear();
    
    // Calculate experience percentage
    const expPercent = Math.min(1, current / nextLevel);
    
    // Set dimensions
    const width = GAME_CONFIG.PLAYER.HEALTH_BAR_WIDTH;
    const height = 10;
    
    // Position at bottom-center of screen, below health bar
    const x = (this.scene.cameras.main.width - width) / 2;
    const y = this.scene.cameras.main.height - height - 10; // 10px from bottom
    
    // Draw background (empty experience)
    experienceBar.fillStyle(0x222222, 0.8);
    experienceBar.fillRect(x, y, width, height);
    
    // Draw filled portion
    experienceBar.fillStyle(GAME_CONFIG.EXPERIENCE_ORB.TINT, 0.8);
    experienceBar.fillRect(x, y, width * expPercent, height);
    
    // Add border
    experienceBar.lineStyle(1, 0xffffff, 1);
    experienceBar.strokeRect(x, y, width, height);
    
    // Add text
    experienceBar.lineStyle(1, 0xffffff, 0); // Set line width to 1 and alpha to 0 to effectively disable the line
    const expText = `Level ${level}: ${current}/${nextLevel} XP`;
    
    // Remove any existing text
    const existingText = this.scene.children.getByName('exp-text');
    if (existingText) {
      existingText.destroy();
    }
    
    // Add new text
    this.scene.add.text(x + width / 2, y + height / 2, expText, {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setName('exp-text').setScrollFactor(0).setDepth(1000);
  }
  
  /**
   * Handle player level up event
   */
  private onPlayerLevelUp(level: number): void {
    // Update level text
    this.updateLevel(level);
    
    // Show level up message
    this.showMessage(`Level Up! ${level}`, 2000);
  }
  
  /**
   * Add a temporary message to the screen
   */
  showMessage(message: string, duration: number = 2000): void {
    const text = this.scene.add.text(
      this.scene.cameras.main.width / 2, 
      this.scene.cameras.main.height / 2,
      message,
      {
        ...GAME_CONFIG.UI.TEXT_STYLE,
        fontSize: '24px'
      }
    ).setOrigin(0.5);
    
    // Fade out and destroy after duration
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      }
    });
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    // Remove event listeners
    this.scene.events.off('player-level-up', this.onPlayerLevelUp, this);
    
    // Remove any dynamic text
    const expText = this.scene.children.getByName('exp-text');
    if (expText) {
      expText.destroy();
    }
    
    const healthText = this.scene.children.getByName('health-text');
    if (healthText) {
      healthText.destroy();
    }
  }
} 
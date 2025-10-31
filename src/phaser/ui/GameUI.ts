import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { Player } from '../entities/Player';


/**
 * Manages all UI elements in the game
 */
export class GameUI {
  private scene: Phaser.Scene;
  //private enemyCountText: Phaser.GameObjects.Text;
  //private healthText: Phaser.GameObjects.Text;
  //private levelText: Phaser.GameObjects.Text;
  private experienceBar: Phaser.GameObjects.Graphics;
  private healthBar: Phaser.GameObjects.Graphics;
  private player: Player;
  private relicDisplay: Phaser.GameObjects.Container;
  private gameTimer: Phaser.GameObjects.Text;
  private startTime: number;
  private killCounterSprite: Phaser.GameObjects.Image | null = null;
  private killCounterText: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    // Create UI elements
    //this.createInstructionText();
    //this.enemyCountText = this.createEnemyCounterText();
    //this.healthText = this.createHealthText();
    //this.levelText = this.createLevelText();
    this.healthBar = this.createHealthBar();
    this.experienceBar = this.createExperienceBar();
    this.relicDisplay = this.createRelicDisplay();
    this.gameTimer = this.createGameTimer();
    this.createKillCounter();
    this.startTime = this.scene.time.now;
    
    // Listen for level up events
    this.scene.events.on('player-level-up', this.onPlayerLevelUp, this);
  }

  /** Ensure core UI elements are visible and recreated if needed */
  public ensureUIVisible(): void {
    if (!this.healthBar || !(this.healthBar as any).scene) {
      this.healthBar = this.createHealthBar();
    }
    if (!this.experienceBar || !(this.experienceBar as any).scene) {
      this.experienceBar = this.createExperienceBar();
    }
    this.healthBar.setVisible(true);
    this.experienceBar.setVisible(true);
    // Keep relic display and timer visible as appropriate
    if (this.gameTimer && (this.gameTimer as any).scene) {
      this.gameTimer.setVisible(true);
    } else {
      this.gameTimer = this.createGameTimer();
    }
    // Recreate kill counter if needed
    if (!this.killCounterText || !(this.killCounterText as any).scene) {
      this.createKillCounter();
    } else {
      this.killCounterText.setVisible(true);
      if (this.killCounterSprite) {
        this.killCounterSprite.setVisible(true);
      }
    }
  }
  
  /**
   * Create instruction text for the player
   */
  // private createInstructionText(): void {
  //   // Movement instructions
  //   this.scene.add.text(16, 16, 'Use WASD or Arrow keys to move', GAME_CONFIG.UI.TEXT_STYLE);
    
  //   // Enemy info
  //   this.scene.add.text(16, 40, 'Enemies will spawn around the edges', GAME_CONFIG.UI.TEXT_STYLE);
    
  //   // Health info
  //   this.scene.add.text(16, 64, 'Avoid enemies to prevent taking damage', GAME_CONFIG.UI.TEXT_STYLE);
    
  //   // Experience info
  //   this.scene.add.text(16, 88, 'Collect cyan orbs for experience', GAME_CONFIG.UI.TEXT_STYLE);
  // }
  
  /**
   * Create a text display for the enemy counter
   */
  // private createEnemyCounterText(): Phaser.GameObjects.Text {
  //   return this.scene.add.text(16, 112, 'Enemies: 0', GAME_CONFIG.UI.TEXT_STYLE);
  // }
  
  /**
   * Create a text display for player health
   */
  // private createHealthText(): Phaser.GameObjects.Text {
  //   return this.scene.add.text(16, 136, 'Health: 100/100', GAME_CONFIG.UI.TEXT_STYLE);
  // }
  
  /**
   * Create a text display for player level
   */
  // private createLevelText(): Phaser.GameObjects.Text {
  //   return this.scene.add.text(16, 160, 'Level: 1', GAME_CONFIG.UI.TEXT_STYLE);
  // }
  
  /**
   * Create a health bar
   */
  private createHealthBar(): Phaser.GameObjects.Graphics {
    const healthBar = this.scene.add.graphics();
    healthBar.setScrollFactor(0); // Fix to camera
    healthBar.setDepth(2000); // Higher depth to stay above pause menu
    return healthBar;
  }
  
  /**
   * Create an experience bar
   */
  private createExperienceBar(): Phaser.GameObjects.Graphics {
    const experienceBar = this.scene.add.graphics();
    experienceBar.setScrollFactor(0); // Fix to camera
    experienceBar.setDepth(2000); // Higher depth to stay above pause menu
    return experienceBar;
  }
  
  /**
   * Create relic display container
   */
  private createRelicDisplay(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    container.setScrollFactor(0); // Fix to camera
    container.setDepth(2000); // Higher depth to stay above pause menu
    container.setVisible(false); // Start hidden
    return container;
  }
  
  /**
   * Update the enemy counter display
   */
  // updateEnemyCount(count: number): void {
  //   this.enemyCountText.setText(`Enemies: ${count}`);
  // }
  
  /**
   * Update the health display
   */
  updateHealth(current: number, max: number): void {
    //this.healthText.setText(`Health: ${current}/${max}`);
    this.updateHealthBar(current, max);
  }
  
  /**
   * Update the health bar
   */
  private updateHealthBar(current: number, max: number): void {
    const healthBar = this.healthBar;
    const cameraBounds = this.scene.cameras.main

    let x = cameraBounds.scrollX - 40;
    let y = cameraBounds.scrollY - 30;
    // Clear previous graphics
    healthBar.clear();
    
    // Calculate health percentage
    const healthPercent = Math.max(0, Math.min(1, current / max));
    
    // Get dimensions
    const width = GAME_CONFIG.PLAYER.HEALTH_BAR_WIDTH;
    const height = GAME_CONFIG.PLAYER.HEALTH_BAR_HEIGHT;

    // Camera

    // Position at bottom of players position
    const playerPos =  this.player.getPosition();
    

    // x = playerPos.x - cameraBounds.scrollX - 40; // Centered horizontally
    // y = playerPos.y  - cameraBounds.scrollY + 40; 

    const offsetX = this.player.getFlippedX() ? -10 : -40;
    x = playerPos.x - cameraBounds.scrollX + offsetX;
    y = playerPos.y - cameraBounds.scrollY + 40;

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
    //const healthText = `${current}/${max}`;
    
    // Remove any existing text
    const existingText = this.scene.children.getByName('health-text');
    if (existingText) {
      existingText.destroy();
    }
    
    // Add new text
    // this.scene.add.text(x + width / 2, y + height / 2, healthText, {
    //   fontSize: '12px',
    //   color: '#ffffff',
    //   fontStyle: 'bold'
    // }).setOrigin(0.5).setName('health-text').setScrollFactor(0).setDepth(1000);
  }
  
  /**
   * Update the level display
   */
  // updateLevel(level: number): void {
  //   this.levelText.setText(`Level: ${level}`);
  // }
  
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
    const width = this.scene.cameras.main.width;
    const height = 30;
    
    // Position at bottom-center of screen, below health bar
    const x = (this.scene.cameras.main.width - width) / 2;
    const y = 0;
    
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
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setName('exp-text').setScrollFactor(0).setDepth(2000);
  }
  
  /**
   * Handle player level up event
   */
  private onPlayerLevelUp(level: number): void {
    // Update level text
    //this.updateLevel(level);
    
    // Show level up message
    this.showMessage(`Level Up! ${level}`, 2000, "0x00ff00", "32px");
  }
  
  /**
   * Add a temporary message to the screen
   */
  showMessage(
    message: string, 
    duration: number = 2000, 
    color: string = "0x00ffff", 
    size: string = "32px", 
  ): void {

    const cameraBounds = this.scene.cameras.main.worldView;
    
    const text = this.scene.add.text(
      cameraBounds.centerX, 
      cameraBounds.centerY,
      message,
      {
        ...GAME_CONFIG.UI.TEXT_STYLE,
        fontSize: size
      }
    ).setOrigin(0.5).setAlpha(1).setColor(color).setDepth(2000);
    
    // Fade out and destroy after duration
    if(duration > 0) {
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
  }
  
  /**
   * Show a relic in the UI
   */
  showRelic(relicId: string, relicName: string, relicDescription: string): void {
    //console.log("GameUI.showRelic called:", relicName, relicDescription);
    
    // Clear existing relic display
    this.relicDisplay.removeAll(true);
    
    // Position below experience bar
    const x = 20; // Left side of screen
    const y = 50; // Below experience bar
    
    // Position the container at the correct location
    this.relicDisplay.setPosition(x, y);
    
    // Create background (positioned relative to container at 0,0)
    const bg = this.scene.add.rectangle(0, 0, 200, 60, 0x1d1805, 0.9);
    bg.setStrokeStyle(2, 0xf0c040);
    bg.setScrollFactor(0); // Fix to camera viewport
    bg.setDepth(2000); // Ensure it's above other UI elements
    this.relicDisplay.add(bg);
    
    // Create relic sprite - map relic ID to sprite frame (positioned relative to container)
    const relicFrame = this.getRelicFrame(relicId);
    console.log("Creating relic sprite for ID:", relicId, "frame:", relicFrame);
    const relicSprite = this.scene.add.sprite(-60, 0, 'relics');
    relicSprite.setFrame(relicFrame);
    relicSprite.setScale(2);
    relicSprite.setScrollFactor(0); // Fix to camera viewport
    relicSprite.setDepth(2000); // Ensure it's above other UI elements
    relicSprite.setVisible(true); // Ensure it's visible
    relicSprite.setAlpha(1); // Ensure full opacity
    this.relicDisplay.add(relicSprite);
    console.log("Relic sprite created:", relicSprite.visible, relicSprite.alpha, relicSprite.frame.name);
    
    // Create relic name text (positioned relative to container)
    const nameText = this.scene.add.text(20, -10, relicName, {
      fontSize: '16px',
      color: '#f0c040',
      fontStyle: 'bold',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2
    });
    nameText.setOrigin(0, 0.5);
    nameText.setScrollFactor(0); // Fix to camera viewport
    nameText.setDepth(2001); // Ensure it's above other UI elements
    this.relicDisplay.add(nameText);
    
    // Create relic description text (positioned relative to container)
    const descText = this.scene.add.text(20, 10, relicDescription, {
      fontSize: '12px',
      color: '#ffffff',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 1
    });
    descText.setOrigin(0, 0.5);
    descText.setScrollFactor(0); // Fix to camera viewport
    descText.setDepth(2001); // Ensure it's above other UI elements
    this.relicDisplay.add(descText);
    
    // Show the display
    this.relicDisplay.setVisible(true);
    console.log("Relic display set to visible, container children:", this.relicDisplay.list.length);
    console.log("Relic display position:", this.relicDisplay.x, this.relicDisplay.y);
    console.log("Relic display visible:", this.relicDisplay.visible);
    console.log("Relic display alpha:", this.relicDisplay.alpha);
    console.log("Relic sprite position:", relicSprite.x, relicSprite.y);
    console.log("Relic sprite visible:", relicSprite.visible);
  }

  /**
   * Map relic ID to sprite frame number
   */
  private getRelicFrame(relicId: string): number {
    const relicFrameMap: { [key: string]: number } = {
      'jedi_robes': 0,
      'lightsaber_crystal': 1,
      'force_medallion': 2,
      'blaster_mod': 3,
      'r2d2_upgrade': 4,
      'speed_boosters': 5,
      'armor_plating': 6,
      'energy_core': 7,
      'reflex_enhancer': 8,
      'shield_generator': 9
    };
    
    return relicFrameMap[relicId] || 0; // Default to frame 0 if not found
  }

  /**
   * Create the game timer display
   */
  private createGameTimer(): Phaser.GameObjects.Text {
    const timer = this.scene.add.text(
      this.scene.cameras.main.width / 2, // Center horizontally
      40, // Below the experience bar
      '00:00',
      {
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    
    timer.setOrigin(0.5, 0.5);
    timer.setScrollFactor(0); // Fix to camera viewport
    timer.setDepth(2000); // Above other UI elements
    
    return timer;
  }

  /**
   * Create the kill counter display
   */
  private createKillCounter(): void {
    const screenWidth = this.scene.cameras.main.width;
    const x = screenWidth * 0.75; // 3/4 on the right side
    const y = 40; // Same height as timer

    // Create skull sprite if texture exists
    if (this.scene.textures.exists('skull')) {
      this.killCounterSprite = this.scene.add.image(x - 25, y, 'skull');
      this.killCounterSprite.setOrigin(0, 0.5);
      this.killCounterSprite.setScrollFactor(0); // Fix to camera viewport
      this.killCounterSprite.setDepth(2000); // Above other UI elements
      this.killCounterSprite.setScale(2); // Scale if needed
    }

    // Create kill count text
    this.killCounterText = this.scene.add.text(
      x, // Position next to skull
      y,
      '0',
      {
        fontSize: '24px',
        color: '#ffffff',
        align: 'left',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    
    this.killCounterText.setOrigin(0, 0.5);
    this.killCounterText.setScrollFactor(0); // Fix to camera viewport
    this.killCounterText.setDepth(2000); // Above other UI elements
  }

  /**
   * Update the kill counter display
   */
  public updateKillCount(count: number): void {
    // Recreate if destroyed
    if (!this.killCounterText || !(this.killCounterText as any).scene) {
      this.createKillCounter();
      // Update immediately after recreation
      if (this.killCounterText) {
        this.killCounterText.setText(count.toString());
      }
      return;
    }

    if (!this.killCounterText.active) {
      return;
    }

    // Update text
    this.killCounterText.setText(count.toString());
  }

  /**
   * Update the game timer
   */
  public updateTimer(): void {
    // Safeguard: recreate timer text if it was destroyed during pause UI
    if (!this.gameTimer || !(this.gameTimer as any).scene) {
      this.gameTimer = this.createGameTimer();
    }
    if (!this.gameTimer.active) {
      return;
    }
    
    const elapsedTime = this.scene.time.now - this.startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    this.gameTimer.setText(timeString);
  }

  /**
   * Get the current game time in milliseconds
   */
  public getGameTime(): number {
    return this.scene.time.now - this.startTime;
  }

  /**
   * Get the current game time formatted as MM:SS
   */
  public getFormattedTime(): string {
    const elapsedTime = this.getGameTime();
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
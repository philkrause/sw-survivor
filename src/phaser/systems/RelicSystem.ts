import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { UpgradeSystem } from './UpgradeSystem';
import { GameUI } from '../ui/GameUI';

export class RelicSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private upgradeSystem: UpgradeSystem;
  private activeRelics: Phaser.Physics.Arcade.Group;
  private availableRelicIds: string[] = [];
  private isShowingRelicScreen: boolean = false;
  private animationTimeoutId: number | null = null;
  private selectedRelicId: string | null = null;
  private isAnimationComplete: boolean = false;
  private gameUI: GameUI;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;

  constructor(scene: Phaser.Scene, player: Player, gameUI: GameUI) {
    this.scene = scene;
    this.player = player;
    this.gameUI = gameUI;
    this.upgradeSystem = new UpgradeSystem(scene, player);
    this.activeRelics = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    });

    this.scene.events.on('relic-dropped', this.spawnRelic, this);
    this.scene.physics.add.overlap(this.player.getSprite(), this.activeRelics, this.handleRelicPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    this.initializeAvailableRelics();
  }

  private initializeAvailableRelics(): void {
    // Get all upgrades that are marked as relics and are available
    this.availableRelicIds = this.upgradeSystem.getAllUpgrades()
      .filter(upgrade => upgrade.isRelic && upgrade.isAvailable?.(this.player))
      .map(relic => relic.id);
    
    console.log("RelicSystem initialized with available relics:", this.availableRelicIds);
    console.log("All upgrades:", this.upgradeSystem.getAllUpgrades().map(u => ({ id: u.id, name: u.name, isRelic: u.isRelic, available: u.isAvailable?.(this.player) })));
  }

  /**
   * Spawn a relic chest at the specified position with floating arrow
   */
  private spawnRelic(x: number, y: number): void {
    console.log("RelicSystem.spawnRelic called at:", x, y);
    console.log("Available relics:", this.availableRelicIds);
    
    if (this.availableRelicIds.length === 0) {
      console.warn("No relics available to drop.");
      return;
    }

    console.log("Spawning relic chest at:", x, y);

    // Create chest sprite
    const chest = this.scene.physics.add.sprite(x, y, 'chest');
    chest.setScale(1.2);
    chest.setDepth(5);
    
    // Add physics body
    if (chest.body) {
      chest.body.setSize(24, 20);
    }

    // Add chest data
    chest.setData('collected', false);

    // Add to group
    this.activeRelics.add(chest);

    // Create floating arrow above chest
    const arrow = this.scene.add.sprite(x, y - 30, 'relic_icon');
    arrow.setScale(0.8);
    arrow.setDepth(6);
    arrow.setTint(0xffd700); // Golden color
    
    // Floating animation for arrow
    this.scene.tweens.add({
      targets: arrow,
      y: y - 40,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Chest pulsing animation
    this.scene.tweens.add({
      targets: chest,
      scale: 1.4,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Add collection collision with player - REMOVED: handled by group overlap in constructor
    // this.scene.physics.add.overlap(
    //   chest,
    //   this.player.getSprite(),
    //   this.handleRelicPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
    //   undefined,
    //   this
    // );

    // Auto-collect after 30 seconds if not picked up
    this.scene.time.delayedCall(30000, () => {
      if (chest.active && !chest.getData('collected')) {
        arrow.destroy();
        chest.destroy();
      }
    });
  }

  /**
   * Handle relic pickup collision
   */
  private handleRelicPickup(chest: Phaser.Types.Physics.Arcade.GameObjectWithBody, _player: Phaser.Types.Physics.Arcade.GameObjectWithBody): void {
    const chestSprite = chest as Phaser.Physics.Arcade.Sprite;
    this.collectRelic(chestSprite);
  }

  /**
   * Handle relic collection - show slot machine screen
   */
  private collectRelic(chest: Phaser.Physics.Arcade.Sprite): void {
    if (chest.getData('collected') || this.isShowingRelicScreen) {
      return;
    }

    chest.setData('collected', true);
    this.isShowingRelicScreen = true;
    this.selectedRelicId = null; // Reset for new relic selection
    this.isAnimationComplete = false; // Reset animation state

    // Remove the chest from the world after collection
    chest.destroy();

    // Pause the game completely to prevent damage during relic screen
    this.scene.physics.pause();
    this.scene.time.paused = true;

    // Show relic selection screen
    this.showRelicSelectionScreen(chest.x, chest.y);
  }

  /**
   * Show slot machine-style relic selection screen
   */
  private showRelicSelectionScreen(_x: number, _y: number): void {
    console.log("showRelicSelectionScreen called");
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    // Create dark overlay
    const overlay = this.scene.add.rectangle(centerX, centerY, this.scene.cameras.main.width, this.scene.cameras.main.height, 0x000000, 0.7);
    overlay.setDepth(3000).setScrollFactor(0);

    // Create title
    const title = this.scene.add.text(centerX, centerY - 200, 'RELIC DISCOVERED!', {
      fontSize: '32px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(3001).setScrollFactor(0);

    // Create chest below relic display
    const chestSprite = this.scene.add.sprite(centerX, centerY + 120, 'chest_open');
    chestSprite.setScale(2);
    chestSprite.setDepth(3002).setScrollFactor(0);

    // Create relic display area
    const relicDisplay = this.scene.add.sprite(centerX, centerY + 50, 'relics');
    relicDisplay.setScale(4);
    relicDisplay.setDepth(3003).setScrollFactor(0);
    relicDisplay.setTint(0xffffff); // Make sure it's visible
    relicDisplay.setAlpha(1); // Ensure full opacity
    
    console.log("Created relic display sprite, frame count:", relicDisplay.texture.frameTotal);
    console.log("Relic display position:", centerX, centerY + 50);
    
    // Test: Show a specific frame to make sure spritesheet is working
    relicDisplay.setFrame(0);
    console.log("Set initial frame to 0");

    // Create instruction text
    const instruction = this.scene.add.text(centerX, centerY + 200, 'Press SPACE to claim your relic!', {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(3001).setScrollFactor(0);

    // Start slot machine animation
    this.startSlotMachineAnimation(relicDisplay, () => {
      // Animation complete - show final relic
      console.log("Animation complete callback called - about to call showFinalRelic");
      this.isAnimationComplete = true;
      this.showFinalRelic(relicDisplay, overlay, title, chestSprite, instruction);
    });

    // Add space key listener
    this.spaceKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) || null;
    this.spaceKey?.on('down', () => {
      if (this.isShowingRelicScreen && this.isAnimationComplete) {
        console.log("Space key pressed - claiming relic");
        this.claimRelic(relicDisplay, overlay, title, chestSprite, instruction);
      } else if (this.isShowingRelicScreen && !this.isAnimationComplete) {
        console.log("Space key pressed but animation not complete yet");
      }
    });
  }

  /**
   * Start slot machine animation cycling through relics
   */
  private startSlotMachineAnimation(relicDisplay: Phaser.GameObjects.Sprite, onComplete: () => void): void {
    console.log("Starting slot machine animation");
    let currentFrame = 0;
    const totalFrames = 60; // Total relics in spritesheet
    let animationSpeed = 50; // Much faster initial speed
    const maxCycles = 1; // Only 1 cycle - very short
    let frameCount = 0;
    const totalFramesToShow = maxCycles * totalFrames + Math.floor(totalFrames * 0.3); // Show 1.3 cycles
    
    console.log("Animation parameters:", {
      totalFrames,
      maxCycles,
      totalFramesToShow,
      initialSpeed: animationSpeed
    });

    const animate = () => {
      if (frameCount >= totalFramesToShow) {
        console.log("Slot machine animation complete");
        onComplete();
        return;
      }

      relicDisplay.setFrame(currentFrame);
      if (frameCount % 30 === 0) { // Log every 30 frames
        console.log(`Animation frame ${frameCount}: showing frame ${currentFrame}`);
      }
      currentFrame = (currentFrame + 1) % totalFrames;
      frameCount++;

      // Much faster speeds overall
      if (frameCount < totalFramesToShow * 0.6) {
        // First 60% - very fast
        animationSpeed = 50;
      } else if (frameCount < totalFramesToShow * 0.9) {
        // Next 30% - medium speed
        animationSpeed = 100;
      } else {
        // Final 10% - slower but still fast
        animationSpeed = 200;
      }

      this.animationTimeoutId = setTimeout(animate, animationSpeed) as unknown as number;
    };

    animate();
  }

  /**
   * Show the final selected relic
   */
  private showFinalRelic(relicDisplay: Phaser.GameObjects.Sprite, _overlay: Phaser.GameObjects.Rectangle, _title: Phaser.GameObjects.Text, _chestSprite: Phaser.GameObjects.Sprite, instruction: Phaser.GameObjects.Text): void {
    console.log("showFinalRelic called, availableRelicIds:", this.availableRelicIds);
    
    // Select random relic using a more reliable method
    const randomIndex = Math.floor(Math.random() * this.availableRelicIds.length);
    const randomRelicId = this.availableRelicIds[randomIndex];
    console.log("Selected relic ID:", randomRelicId, "at index:", randomIndex);
    
    const relicUpgrade = this.upgradeSystem.getUpgradeById(randomRelicId);

    if (!relicUpgrade) {
      console.error(`Relic upgrade with ID ${randomRelicId} not found.`);
      console.log("Available upgrades:", this.upgradeSystem.getAllUpgrades().map(u => u.id));
      return;
    }

    console.log("Found relic upgrade:", relicUpgrade.name);

    // Map relic ID to a specific frame (for now, use modulo to distribute across frames)
    const relicIndex = this.availableRelicIds.indexOf(randomRelicId);
    const finalFrame = relicIndex % 60; // Map to available frames
    relicDisplay.setFrame(finalFrame);

    // Add glow effect
    const glow = this.scene.add.sprite(relicDisplay.x, relicDisplay.y, 'relics');
    glow.setScale(4.5);
    glow.setDepth(1002).setScrollFactor(0);
    glow.setTint(0xffd700);
    glow.setAlpha(0.5);

    // Pulsing glow animation
    this.scene.tweens.add({
      targets: glow,
      scale: 5,
      alpha: 0.8,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Update instruction to show relic name and stat boost
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;
    
    instruction.setText(`${relicUpgrade.name}\n${relicUpgrade.description}\n\nPress SPACE to claim!`);
    instruction.setPosition(centerX, centerY + 200);
    instruction.setFontSize('18px');
    instruction.setColor('#ffd700');
    instruction.setStroke('#000000', 3);
    instruction.setAlign('center');
    instruction.setScrollFactor(0);

    // Store the selected relic for claiming
    this.selectedRelicId = randomRelicId;
    console.log("showFinalRelic: stored selectedRelicId:", randomRelicId, "in class property");
  }

  /**
   * Claim the selected relic
   */
  private claimRelic(relicDisplay: Phaser.GameObjects.Sprite, overlay: Phaser.GameObjects.Rectangle, title: Phaser.GameObjects.Text, chestSprite: Phaser.GameObjects.Sprite, instruction: Phaser.GameObjects.Text): void {
    // Get the selected relic ID that was stored during showFinalRelic
    const selectedRelicId = this.selectedRelicId;
    console.log("claimRelic called, selectedRelicId:", selectedRelicId);
    
    if (!selectedRelicId) {
      console.error("No relic selected - selectedRelicId is null");
      return;
    }
    
    const relicUpgrade = this.upgradeSystem.getUpgradeById(selectedRelicId);

    if (!relicUpgrade) {
      console.error(`Relic upgrade with ID ${selectedRelicId} not found.`);
      return;
    }

    // Apply the relic effect
    this.upgradeSystem.applyUpgrade(selectedRelicId);

    // Clean up screen elements
    console.log("Destroying relic screen elements...");
    console.log("relicDisplay before destroy:", relicDisplay.active, relicDisplay.visible);
    overlay.destroy();
    title.destroy();
    chestSprite.destroy();
    instruction.destroy();
    relicDisplay.destroy();
    console.log("All relic screen elements destroyed");

    // Clean up any running animation
    if (this.animationTimeoutId !== null) {
      clearTimeout(this.animationTimeoutId);
      this.animationTimeoutId = null;
    }

    // Resume game completely
    this.scene.physics.resume();
    this.scene.time.paused = false;
    this.isShowingRelicScreen = false;
    this.selectedRelicId = null; // Reset for next relic

    // Show collection effect - removed floating effect, will show in UI instead
    // this.showRelicCollectedEffect(this.player.getSprite().x, this.player.getSprite().y, relicUpgrade.name);
    
    // Show relic in UI instead
    console.log("Calling gameUI.showRelic with:", relicUpgrade.name, relicUpgrade.description);
    console.log("gameUI object:", this.gameUI);
    console.log("gameUI.showRelic method:", typeof this.gameUI.showRelic);
    this.gameUI.showRelic(selectedRelicId, relicUpgrade.name, relicUpgrade.description);

    // Remove space key listener
    if (this.spaceKey) {
      this.spaceKey.off('down');
      this.spaceKey = null;
    }
  }


  cleanup(): void {
    this.scene.events.off('relic-dropped', this.spawnRelic, this);
    this.activeRelics.clear(true, true);
  }
}
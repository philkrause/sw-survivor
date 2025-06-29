import Phaser from 'phaser';
import { Player } from '../entities/Player';
/**
 * Represents an upgrade that can be chosen by the player
 */
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  maxLevel: number;
  apply: (player: Player) => void;
  isAvailable?: (player: Player) => boolean;
}

/**
 * System responsible for managing available upgrades and their effects
 */
export class UpgradeSystem {
  private player: Player;
  private scene: Phaser.Scene;
  private availableUpgrades: Upgrade[] = [];
  private acquiredUpgrades: Map<string, number> = new Map();
  private fallingTweens: Phaser.Tweens.Tween[] = [];
  private spriteGroup: Phaser.GameObjects.Group; // Group to hold falling sprites
  // Group to hold falling sprites


  constructor(scene: Phaser.Scene, player: Player) {
    this.player = player;
    this.spriteGroup = scene.add.group(); // Initialize the group
    this.scene = scene;
    // Initialize available upgrades
    this.initializeUpgrades();
  }

  /**
   * Initialize the list of available upgrades
   */



  private initializeUpgrades(): void {

    // SABER UPGRADES
    this.availableUpgrades.push({
      id: 'saber_speed',
      name: 'Increase Saber Speed',
      description: "Increase Saber Interval by 10%",
      icon: 'saber_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        player.increaseSaberSpeed(0.9);
        this.scene.events.emit('upgrade-saber');
      },
      isAvailable: () => true
    });

    this.availableUpgrades.push({
      id: 'saber_damage',
      name: 'Increase Saber Damage',
      description: "Increase Saber Damage by 15%",
      icon: 'saber_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        console.log("The increase saber damage function was called")
        player.increaseSaberDamage(0.25);  // Activate the saber and set strength
      },
      isAvailable: () => true // ✅ Evaluated when needed
    });

    // ** THE FORCE **
    this.availableUpgrades.push({
      id: 'unlock_force',
      name: 'Unlock The Force',
      description: "Damage and push back enemies.",
      icon: 'force_unlock_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.unlockForceUpgrade();
      }
    });
    // // Add attack speed upgrade
    this.availableUpgrades.push({
      id: 'force_speed',
      name: 'Increase Force Speed',
      description: "Increase Force Interval by 10%",
      icon: 'speed_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        player.increaseForceSpeed(0.9);  // Activate the force and set strength
      },
      isAvailable: (player) => player.hasForceAbility() // ✅ Evaluated when needed
    });

    this.availableUpgrades.push({
      id: 'force_damage',
      name: 'Increase Force Damage',
      description: "Increase Force Damage by 15%",
      icon: 'speed_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        console.log("The increase force damage function was called")
        player.increaseForceDamage(0.25);  // Activate the force and set strength
      },
      isAvailable: (player) => player.hasForceAbility() // ✅ Evaluated when needed
    });

    this.availableUpgrades.push({
      id: 'force_radius',
      name: 'Increase Force Radius',
      description: "Increase Force Radius by 15%",
      icon: 'speed_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        console.log("The increase force radius function was called")
        player.increaseForceDamage(0.25);  // Activate the force and set strength
      },
      isAvailable: (player) => player.hasForceAbility() // ✅ Evaluated when needed
    });

    // // ** R2D2 **
    this.availableUpgrades.push({
      id: 'r2d2_droid',
      name: 'Deploy R2-D2 Droid',
      description: "Deploys R2-D2 that damages nearby enemies.",
      icon: 'r2d2_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.unlockR2D2Upgrade();
      },
      isAvailable: () => true,
    });

    this.availableUpgrades.push({
      id: 'r2d2_damage',
      name: 'Increase R2-D2 Damage',
      description: "Increase R2-D2 damage.",
      icon: 'r2d2_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        player.increaseR2D2Damage(2);
      },
      isAvailable: (player) => player.hasR2D2Ability()
    });



    // ** BLASTER **
    this.availableUpgrades.push({
      id: 'unlock_blaster',
      name: 'Unlock The Blaster',
      description: "Shoot A Laser Pistol.",
      icon: 'blaster_unlock_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        //setup projectile config
        player.initProjectilePool();
        player.unlockBlasterUpgrade();
        player.unlockProjectile("blaster")
      },
      isAvailable: () => true
    });

    this.availableUpgrades.push({
      id: 'damage',
      name: 'Increased Blaster Damage',
      description: 'Increase projectile damage by 25%',
      icon: 'damage_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        player.increaseBlasterDamage(.75);
      },
      isAvailable: (player) => player.hasBlasterAbility() // ✅ Evaluated when needed
    });


    //Add attack speed upgrade
    this.availableUpgrades.push({
      id: 'projectile_speed',
      name: 'Blaster Attack Speed',
      description: 'Increase attack speed by 15%',
      icon: 'speed_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        player.increaseBlasterSpeed(0.15);
      },
      isAvailable: (player) => player.hasBlasterAbility()
    });

    // Add projectile count upgrade
    this.availableUpgrades.push({
      id: 'projectile_count',
      name: 'Multi-Shot',
      description: 'Fire an additional projectile',
      icon: 'multishot_icon',
      level: 0,
      maxLevel: 10,
      apply: (player) => {
        player.increaseProjectileCount(1);
      },
      isAvailable: (player) => player.hasBlasterAbility()
    });

    //Add health upgrade
    this.availableUpgrades.push({
      id: 'max_health',
      name: 'Max Health',
      description: 'Increase maximum health by 20',
      icon: 'health_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        player.increaseMaxHealth(20);
      },
      isAvailable: () => true // ✅ Evaluated when needed
    });

    // //Add movement speed upgrade
    this.availableUpgrades.push({
      id: 'movement_speed',
      name: 'Movement Speed',
      description: 'Increase movement speed by 10%',
      icon: 'movement_icon',
      level: 0,
      maxLevel: 3,
      apply: (player) => {
        player.increaseMovementSpeed(0.1);
      },
      isAvailable: () => true // ✅ Evaluated when needed
    });
  }

  /**
   * Get a random selection of upgrades to choose from
   */
  getRandomUpgrades(count: number = 4): Upgrade[] {
    // Filter upgrades that haven't reached max level
    const availableUpgrades = this.availableUpgrades.filter(upgrade => {
      const currentLevel = this.acquiredUpgrades.get(upgrade.id) || 0;
      //check if the upgrade is available
      const isUnlocked = upgrade.isAvailable ? upgrade.isAvailable(this.player) : true;
      return currentLevel < upgrade.maxLevel && isUnlocked;
    });

    // If no upgrades available, return empty array
    if (availableUpgrades.length === 0) {
      return [];
    }

    // Shuffle available upgrades
    const shuffled = [...availableUpgrades].sort(() => Math.random() - 0.5);

    // Return requested number of upgrades (or all if less are available)
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Apply an upgrade to the player
   */
  applyUpgrade(upgradeId: string): void {
    // Find the upgrade
    const upgrade = this.availableUpgrades.find(u => u.id === upgradeId);
    console.log("Upgrade ID: ", upgradeId)
    if (!upgrade) {
      console.warn(`Upgrade with id ${upgradeId} not found`);
      return;
    }

    // Get current level of this upgrade
    const currentLevel = this.acquiredUpgrades.get(upgradeId) || 0;

    // Check if already at max level
    if (currentLevel >= upgrade.maxLevel) {
      console.warn(`Upgrade ${upgradeId} already at max level`);
      return;
    }

    // Apply the upgrade effect
    upgrade.apply(this.player);

    // Update acquired upgrades
    this.acquiredUpgrades.set(upgradeId, currentLevel + 1);

    console.log(`Applied upgrade: ${upgrade.name} (Level ${currentLevel + 1})`);
  }

  /**
   * Get the current level of an upgrade
   */
  getUpgradeLevel(upgradeId: string): number {
    return this.acquiredUpgrades.get(upgradeId) || 0;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Clear upgrade data
    this.availableUpgrades = [];
    this.acquiredUpgrades.clear();
  }


  dropFallingSprites(scene: Phaser.Scene, spriteKey: string, count: number): boolean {
    const cameraHeight = scene.cameras.main.height;
    const cameraWidth = scene.cameras.main.width;

    const cameraX = scene.cameras.main.scrollX; // Camera's X position in the world
    const cameraY = scene.cameras.main.scrollY; // Camera's Y position in the world


    for (let i = 0; i < count; i++) {
      // Create a sprite at a random position at the top of the visible area
      const sprite = scene.add.sprite(
        Phaser.Math.Between(cameraX, cameraX + cameraWidth), // Random X position within the camera's view
        Phaser.Math.Between(cameraY - cameraHeight, cameraY - 50), // Completely above the visible area
        spriteKey // Sprite texture key
      ).setScale(2);

      this.spriteGroup.add(sprite);

      // Set random spin and scale
      sprite.setAngle(Phaser.Math.Between(0, 360)); // Random initial rotation
      sprite.setScale(Phaser.Math.FloatBetween(.5, 1.5)); // Random initial scale

      // Animate the sprite falling
      const fallingTween = scene.tweens.add({
        targets: sprite,
        y: cameraY + cameraHeight,
        angle: 0, // Spin 360 degrees
        duration: Phaser.Math.Between(4000, 6000), // Random fall duration
        loop: -1,
        ease: 'Linear',
        onComplete: () => {
          // Shrink the sprite as it approaches the bottom
          const shrinkTween = scene.tweens.add({
            targets: sprite,
            scale: 0, // Shrink to 0
            duration: 500, // Shrink duration
            ease: 'Linear',
            onComplete: () => {
              sprite.destroy(); // Destroy the sprite
            }
          });

          // Store the shrink tween reference
          this.fallingTweens.push(shrinkTween);
        }
      });

      // Store the falling tween reference
      this.fallingTweens.push(fallingTween);
    }

    return true;
  }


  stopFallingSprites(): void {
    this.spriteGroup.clear(true, true); // Destroy all sprites in the group

    this.fallingTweens.forEach((tween) => tween.stop());
    this.fallingTweens = []; // Clear the tween references
    console.log('All falling sprites stopped.');
  }


} 
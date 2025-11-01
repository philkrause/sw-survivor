import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GAME_CONFIG } from '../config/GameConfig';
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
  isRelic?: boolean; // Marks this as a relic upgrade
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
      name: 'Jedi Reflex Training',
      description: "Increase Saber Interval by 10%",
      icon: 'saber_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        player.increaseSaberSpeed(0.9);
        this.scene.events.emit('upgrade-saber');
      },
      isAvailable: (player) => player.hasSaberAbility()
    });

    this.availableUpgrades.push({
      id: 'saber_damage',
      name: 'Lightsaber Mastery',
      description: "Increase Saber Damage by 15%",
      icon: 'saber_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        console.log("The increase saber damage function was called")
        player.increaseSaberDamage(0.25);  // Activate the saber and set strength
      },
      isAvailable: (player) => player.hasSaberAbility()
    });

    // ** SABER UNLOCK **
    this.availableUpgrades.push({
      id: 'unlock_saber',
      name: 'Lightsaber Unlock',
      description: "Unlock the legendary lightsaber weapon.",
      icon: 'saber_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.unlockSaberUpgrade();
        this.scene.events.emit('upgrade-saber');
      },
      isAvailable: (player) => player.getLevel() >= GAME_CONFIG.ABILITIES.SABER_UNLOCK_LEVEL
    });

    // ** THE FORCE UNLOCK **
    this.availableUpgrades.push({
      id: 'unlock_force',
      name: 'Force Awakens',
      description: "Damage and push back enemies.",
      icon: 'force_unlock_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.unlockForceUpgrade();
      },
      isAvailable: (player) => player.getLevel() >= GAME_CONFIG.ABILITIES.FORCE_UNLOCK_LEVEL
    });
    // // Add attack speed upgrade
    this.availableUpgrades.push({
      id: 'force_speed',
      name: 'Force Meditation',
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
      name: 'Force Mastery',
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

    // this.availableUpgrades.push({
    //   id: 'force_radius',
    //   name: 'Increase Force Radius',
    //   description: "Increase Force Radius by 15%",
    //   icon: 'speed_icon',
    //   level: 0,
    //   maxLevel: 5,
    //   apply: (player) => {
    //     console.log("The increase force radius function was called")
    //     player.increaseForceDamage(1.25);  // Activate the force and set strength
    //   },
    //   isAvailable: (player) => player.hasForceAbility() // ✅ Evaluated when needed
    // });

    // ** R2D2 UNLOCK **
    this.availableUpgrades.push({
      id: 'r2d2_droid',
      name: 'Unlock R2-D2',
      description: "Deploys R2-D2 that damages nearby enemies.",
      icon: 'r2d2_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.unlockR2D2Upgrade();
      },
      isAvailable: (player) => player.getLevel() >= GAME_CONFIG.ABILITIES.R2D2_UNLOCK_LEVEL
    });

    this.availableUpgrades.push({
      id: 'r2d2_damage',
      name: 'Droid Combat Protocols',
      description: "Increase R2-D2 damage by 25%.",
      icon: 'r2d2_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        player.increaseR2D2Damage(.25);
      },
      isAvailable: (player) => player.hasR2D2Ability()
    });

    // ** BB-8 UNLOCK **
    this.availableUpgrades.push({
      id: 'unlock_bb8',
      name: 'BB-88 Deploy',
      description: "Deploy BB-88 for rolling slash attacks.",
      icon: 'bb88_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.unlockBB8Upgrade();
        this.scene.events.emit('upgrade-bb8');
      },
      isAvailable: (player) => player.getLevel() >= GAME_CONFIG.ABILITIES.BB8_UNLOCK_LEVEL
    });

    // ** BB-8 UPGRADES **
    this.availableUpgrades.push({
      id: 'bb8_speed',
      name: 'BB-8 Acceleration',
      description: "Increase BB-8 attack speed by 15%.",
      icon: 'speed_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        player.increaseBB8Speed(0.85); // Reduces interval by 15%
      },
      isAvailable: (player) => player.hasBB8Ability()
    });

    this.availableUpgrades.push({
      id: 'bb8_damage',
      name: 'BB-8 Combat Training',
      description: "Increase BB-8 damage by 25%.",
      icon: 'damage_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        player.increaseBB8Damage(.25);
      },
      isAvailable: (player) => player.hasBB8Ability()
    });

    // ** BLASTER **
    this.availableUpgrades.push({
      id: 'damage',
      name: 'Blaster Calibration',
      description: 'Increase projectile damage by 25%',
      icon: 'damage_icon',
      level: 0,
      maxLevel: 5,
      apply: (player) => {
        player.increaseBlasterDamage(1.25);
      },
      isAvailable: (player) => player.hasBlasterAbility() // ✅ Evaluated when needed
    });


    //Add attack speed upgrade
    this.availableUpgrades.push({
      id: 'projectile_speed',
      name: 'Rapid Fire Training',
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
      name: 'Chewbaccas Mod',
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
      name: 'Jedi Endurance',
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
      name: 'Moon Boots',
      description: 'Increase movement speed by 15%',
      icon: 'movement_icon',
      level: 0,
      maxLevel: 3,
      apply: (player) => {
        player.increaseMovementSpeed(0.15);
      },
      isAvailable: () => true // ✅ Evaluated when needed
    });

    // RELIC UPGRADES - These are special items that drop from enemies
    this.availableUpgrades.push({
      id: 'jedi_robes',
      name: 'Jedi Robes',
      description: 'Ancient robes that reduce incoming damage by 15%',
      icon: 'jedi_robes_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.increaseDamageReduction(0.15);
      },
      isAvailable: () => true,
      isRelic: true
    });

    this.availableUpgrades.push({
      id: 'lightsaber_crystal',
      name: 'Lightsaber Crystal',
      description: 'A rare crystal that increases saber critical hit chance by 20%',
      icon: 'crystal_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.increaseSaberCritChance(0.20);
      },
      isAvailable: (player) => player.hasSaberAbility(),
      isRelic: true
    });

    this.availableUpgrades.push({
      id: 'force_medallion',
      name: 'Force Medallion',
      description: 'A medallion that increases force damage by 25%',
      icon: 'medallion_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.increaseForceDamage(0.25);
      },
      isAvailable: (player) => player.hasForceAbility(),
      isRelic: true
    });

    this.availableUpgrades.push({
      id: 'r2d2_upgrade',
      name: 'R2-D2 Enhancement',
      description: 'An enhancement that increases R2-D2 damage by 30%',
      icon: 'r2d2_upgrade_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.increaseR2D2Damage(0.30);
      },
      isAvailable: (player) => player.hasR2D2Ability(),
      isRelic: true
    });

    // Add more creative relics focused on speed, defense, and other stats
    this.availableUpgrades.push({
      id: 'speed_boosters',
      name: 'Speed Boosters',
      description: 'Jet boots that increase movement speed by 25%',
      icon: 'speed_boosters_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.increaseSpeed(0.25);
      },
      isAvailable: () => true,
      isRelic: true
    });

    this.availableUpgrades.push({
      id: 'armor_plating',
      name: 'Armor Plating',
      description: 'Heavy armor that increases max health by 50',
      icon: 'armor_plating_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.increaseMaxHealth(50);
      },
      isAvailable: () => true,
      isRelic: true
    });

    this.availableUpgrades.push({
      id: 'energy_core',
      name: 'Energy Core',
      description: 'A power core that increases experience gain by 30%',
      icon: 'energy_core_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.increaseExperienceGain(0.30);
      },
      isAvailable: () => true,
      isRelic: true
    });

    this.availableUpgrades.push({
      id: 'reflex_enhancer',
      name: 'Reflex Enhancer',
      description: 'A neural implant that increases projectile speed by 40%',
      icon: 'reflex_enhancer_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.increaseProjectileSpeed(0.40);
      },
      isAvailable: (player) => player.hasBlasterAbility(),
      isRelic: true
    });

    this.availableUpgrades.push({
      id: 'shield_generator',
      name: 'Shield Generator',
      description: 'A personal shield that reduces damage by 20%',
      icon: 'shield_generator_icon',
      level: 0,
      maxLevel: 1,
      apply: (player) => {
        player.increaseDamageReduction(0.20);
      },
      isAvailable: () => true,
      isRelic: true
    });
  }

  /**
   * Get a random selection of upgrades to choose from
   */
  getRandomUpgrades(count: number = 4): Upgrade[] {
    // Filter upgrades that haven't reached max level and are NOT relics
    const availableUpgrades = this.availableUpgrades.filter(upgrade => {
      const currentLevel = this.acquiredUpgrades.get(upgrade.id) || 0;
      //check if the upgrade is available
      const isUnlocked = upgrade.isAvailable ? upgrade.isAvailable(this.player) : true;
      // Exclude relics from level-up screen (relics are only available from relic chests)
      const isNotRelic = !upgrade.isRelic;
      return currentLevel < upgrade.maxLevel && isUnlocked && isNotRelic;
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
    //console.log("Upgrade ID: ", upgradeId)
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

    // Emit event for UI to update upgrade icons
    this.scene.events.emit('upgrade-applied', upgradeId);

    //console.log(`Applied upgrade: ${upgrade.name} (Level ${currentLevel + 1})`);
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
    //console.log('All falling sprites stopped.');
  }

  /**
   * Get all available upgrades (for RelicSystem)
   */
  getAllUpgrades(): Upgrade[] {
    return this.availableUpgrades;
  }

  /**
   * Get upgrade by ID (for RelicSystem)
   */
  getUpgradeById(id: string): Upgrade | undefined {
    return this.availableUpgrades.find(upgrade => upgrade.id === id);
  }
} 
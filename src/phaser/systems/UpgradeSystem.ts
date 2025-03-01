import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { ProjectileSystem } from './ProjectileSystem';

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
  apply: (player: Player, _projectileSystem: ProjectileSystem) => void;
}

/**
 * System responsible for managing available upgrades and their effects
 */
export class UpgradeSystem {
  private player: Player;
  private projectileSystem: ProjectileSystem;
  private availableUpgrades: Upgrade[] = [];
  private acquiredUpgrades: Map<string, number> = new Map();
  
  constructor(_scene: Phaser.Scene, player: Player, projectileSystem: ProjectileSystem) {
    this.player = player;
    this.projectileSystem = projectileSystem;
    
    // Initialize available upgrades
    this.initializeUpgrades();
  }
  
  /**
   * Initialize the list of available upgrades
   */
  private initializeUpgrades(): void {
    // Add damage upgrade
    this.availableUpgrades.push({
      id: 'damage',
      name: 'Increased Damage',
      description: 'Increase projectile damage by 25%',
      icon: 'damage_icon',
      level: 0,
      maxLevel: 5,
      apply: (player, _projectileSystem) => {
        player.increaseDamage(0.25);
      }
    });
    
    // Add attack speed upgrade
    this.availableUpgrades.push({
      id: 'attack_speed',
      name: 'Attack Speed',
      description: 'Increase attack speed by 15%',
      icon: 'speed_icon',
      level: 0,
      maxLevel: 5,
      apply: (player, _projectileSystem) => {
        player.increaseAttackSpeed(0.15);
      }
    });
    
    // Add projectile count upgrade
    this.availableUpgrades.push({
      id: 'projectile_count',
      name: 'Multi-Shot',
      description: 'Fire an additional projectile',
      icon: 'multishot_icon',
      level: 0,
      maxLevel: 3,
      apply: (player, _projectileSystem) => {
        player.increaseProjectileCount(1);
      }
    });
    
    // Add projectile size upgrade
    this.availableUpgrades.push({
      id: 'projectile_size',
      name: 'Larger Projectiles',
      description: 'Increase projectile size by 20%',
      icon: 'size_icon',
      level: 0,
      maxLevel: 3,
      apply: (player, _projectileSystem) => {
        player.increaseProjectileSize(0.2);
      }
    });
    
    // Add health upgrade
    this.availableUpgrades.push({
      id: 'max_health',
      name: 'Max Health',
      description: 'Increase maximum health by 20',
      icon: 'health_icon',
      level: 0,
      maxLevel: 5,
      apply: (player, _projectileSystem) => {
        player.increaseMaxHealth(20);
      }
    });
    
    // Add movement speed upgrade
    this.availableUpgrades.push({
      id: 'movement_speed',
      name: 'Movement Speed',
      description: 'Increase movement speed by 10%',
      icon: 'movement_icon',
      level: 0,
      maxLevel: 3,
      apply: (player, _projectileSystem) => {
        player.increaseMovementSpeed(0.1);
      }
    });
  }
  
  /**
   * Get a random selection of upgrades to choose from
   */
  getRandomUpgrades(count: number = 3): Upgrade[] {
    // Filter upgrades that haven't reached max level
    const availableUpgrades = this.availableUpgrades.filter(upgrade => {
      const currentLevel = this.acquiredUpgrades.get(upgrade.id) || 0;
      return currentLevel < upgrade.maxLevel;
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
    upgrade.apply(this.player, this.projectileSystem);
    
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
} 
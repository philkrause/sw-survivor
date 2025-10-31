import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnemySystem } from '../systems/EnemySystem';
import { TfighterSystem } from '../systems/TfighterSystem';

import { GAME_CONFIG } from '../config/GameConfig';

export interface ForcePoolConfig {
  key?: string;
  baseDamage?: number; // Base damage value
  radius?: number;
  endradius?: number;
  strength?: number;
  fadeduration?: number;
  color?: number;
  alpha?: number;
  maxSize?: number;
  scale?: number;
  depth?: number;
  lifespan?: number;
  tint?: number;
  damage?: number;
}

export class ForceSystem {
  private scene: Phaser.Scene;
  private enemySystem: EnemySystem;
  private tfighterSystem: TfighterSystem;

  private player: Player;

  private forceConfig: ForcePoolConfig = {
    key: GAME_CONFIG.FORCE.PLAYER.KEY,
    baseDamage: GAME_CONFIG.FORCE.PLAYER.BASEDAMAGE,
    radius: GAME_CONFIG.FORCE.PLAYER.RADIUS,
    endradius: GAME_CONFIG.FORCE.PLAYER.ENDRADIUS,
    strength: GAME_CONFIG.FORCE.PLAYER.STRENGTH,
    fadeduration: GAME_CONFIG.FORCE.PLAYER.FADEDURATION,
    color: GAME_CONFIG.FORCE.PLAYER.COLOR,
    alpha: GAME_CONFIG.FORCE.PLAYER.ALPHA,
    maxSize: GAME_CONFIG.FORCE.PLAYER.MAXSIZE,
    scale: GAME_CONFIG.FORCE.PLAYER.SCALE,
    depth: GAME_CONFIG.FORCE.PLAYER.DEPTH,
    lifespan: GAME_CONFIG.FORCE.PLAYER.LIFESPAN,
    tint: GAME_CONFIG.FORCE.PLAYER.TINT,
  };

  private lastForceTime = 0;
  private baseForceInterval = 2000;
  private staticIndicator: Phaser.GameObjects.Graphics | null = null;
  private indicatorRadius: number = 60; // Static indicator radius


  constructor(scene: Phaser.Scene, enemySystem: EnemySystem, tfighterSystem: TfighterSystem, player: Player) {
    this.scene = scene;
    this.enemySystem = enemySystem;
    this.tfighterSystem = tfighterSystem;
    this.player = player;

    // Create static indicator circle
    this.createStaticIndicator();
  }


  applyForce(time: number): void {
    if (!this.player) {
      console.error('Player is not initialized.');
      return;  // Early exit if player is undefined
    }

    const { x, y } = this.player.getPosition();
    const enemies = this.enemySystem.getVisibleEnemies();
    const tfighters = this.tfighterSystem.getVisibleEnemies();

    // Emit force push particle effect
    this.scene.events.emit('force-push', x, y);

    enemies.forEach(enemy => {
      const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);

      if (dist - 10 <= this.forceConfig.endradius!) {
        this.enemySystem.damageEnemy(
          enemy,
          this.forceConfig.baseDamage! * this.player.forceDamageMultiplier,
          20,
          false
        );
      }
    });

    tfighters.forEach(enemy => {
      const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);

      if (dist - 10 <= this.forceConfig.endradius!) {
        this.tfighterSystem.damageEnemy(
          enemy,
          this.forceConfig.baseDamage! * this.player.forceDamageMultiplier,
          20,
          false
        );
      }
    });

    this.createVisualEffect(x, y, this.forceConfig);
    this.lastForceTime = time;
  }



  /**
   * Create static indicator circle to show player has force ability
   */
  private createStaticIndicator(): void {
    // Destroy existing indicator if it exists
    if (this.staticIndicator) {
      this.staticIndicator.destroy();
    }

    this.staticIndicator = this.scene.add.graphics();
    this.staticIndicator.setDepth((this.forceConfig.depth ?? 10) - 1); // Slightly below the pulsing effect
    this.updateStaticIndicator();
  }

  /**
   * Update static indicator position and visibility
   */
  private updateStaticIndicator(): void {
    if (!this.staticIndicator || !this.player) {
      return;
    }

    // Only show if player has force ability
    if (!this.player.hasForceAbility()) {
      this.staticIndicator.clear();
      this.staticIndicator.setVisible(false);
      return;
    }

    this.staticIndicator.setVisible(true);
    const { x, y } = this.player.getPosition();

    // Clear previous drawing
    this.staticIndicator.clear();

    // Draw static circle outline (not filled, just stroke)
    // Use force color but with a more subtle appearance
    const strokeWidth = 2;
    const alpha = 0.6; // More subtle than the pulsing effect
    
    this.staticIndicator.lineStyle(strokeWidth, this.forceConfig.color!, alpha);
    this.staticIndicator.strokeCircle(x, y, this.indicatorRadius);
  }

  private createVisualEffect(x: number, y: number, config: ForcePoolConfig): void {
    const circle = this.scene.add.circle(
      x,
      y,
      config.radius,
      config.color,
      config.alpha
    );

    circle.setDepth(config.depth ?? 10);
    circle.setBlendMode(Phaser.BlendModes.ADD);
    circle.setStrokeStyle(2, 0xffffff, 1);

    this.scene.tweens.add({
      targets: circle,
      radius: config.endradius,
      alpha: 0,
      duration: config.fadeduration,
      onComplete: () => {
        circle.destroy();
      }
    });

  }



  update(time: number): void {
    // Update static indicator position and visibility
    this.updateStaticIndicator();

    const actualInterval = this.baseForceInterval * this.player.forceSpeedMultiplier;
    if (time - this.lastForceTime >= actualInterval) {
      this.applyForce(time);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.staticIndicator) {
      this.staticIndicator.destroy();
      this.staticIndicator = null;
    }
  }
  
}

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


  constructor(scene: Phaser.Scene, enemySystem: EnemySystem, tfighterSystem: TfighterSystem, player: Player) {
    this.scene = scene;
    this.enemySystem = enemySystem;
    this.tfighterSystem = tfighterSystem;
    this.player = player;

  }


  applyForce(time: number): void {
    if (!this.player) {
      console.error('Player is not initialized.');
      return;  // Early exit if player is undefined
    }

    const { x, y } = this.player.getPosition();
    const enemies = this.enemySystem.getVisibleEnemies();
    const tfighters = this.tfighterSystem.getVisibleEnemies();

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
    const actualInterval = this.baseForceInterval * this.player.forceSpeedMultiplier;
    if (time - this.lastForceTime >= actualInterval) {
      this.applyForce(time);
    }
  }
  
}

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { EnemySystem } from './EnemySystem';
import { TfighterSystem } from './TfighterSystem';

import { Player } from '../entities/Player';

export interface SaberSlashConfig {
  key: string;                // Texture key
  duration: number;           // Animation duration (ms)
  scale: number;              // Initial scale
  depth: number;              // Render depth
  basedamage: number;             // Damage dealt
  width: number;              // Hitbox width
  height: number;             // Hitbox height
  offsetX: number;           // X offset from player
  offsetY: number;           // Y offset from player
  growScale: number;         // Optional: final scale
  interval: number;          // For auto attacks
  damageMultiplier?: number; // Damage multiplier
}

export class SaberSystem {
  private scene: Phaser.Scene;
  private slashes: Phaser.GameObjects.Sprite[] = [];
  private slashTimer?: Phaser.Time.TimerEvent;
  private enemySystem: EnemySystem;
  private tfighterSystem: TfighterSystem;
  private player: Player;



  // DEFAULT SABER CONFIG
  private saberSlashConfig: SaberSlashConfig = {
    key: 'blue_slash',
    duration: GAME_CONFIG.SABER.PLAYER.DURATION,
    scale: GAME_CONFIG.SABER.PLAYER.SCALE,
    depth: GAME_CONFIG.SABER.PLAYER.DEPTH,
    basedamage: GAME_CONFIG.SABER.PLAYER.BASEDAMAGE,
    width: GAME_CONFIG.SABER.PLAYER.WIDTH,
    height: GAME_CONFIG.SABER.PLAYER.HEIGHT,
    offsetX: GAME_CONFIG.SABER.PLAYER.OFFSETX,
    offsetY: GAME_CONFIG.SABER.PLAYER.OFFSETY,
    interval: GAME_CONFIG.SABER.PLAYER.INTERVAL,
    growScale: GAME_CONFIG.SABER.PLAYER.GROWSCALE,
    damageMultiplier: GAME_CONFIG.SABER.PLAYER.DAMAGEMULTIPLIER,
  };


  constructor(scene: Phaser.Scene, enemySystem: EnemySystem, tfighterSystem: TfighterSystem, player: Player) {
    this.scene = scene;
    this.enemySystem = enemySystem;
    this.tfighterSystem = tfighterSystem;
    this.player = player;
    this.slashTimer = undefined;
  }


  /**
   * Starts repeating saber attacks.
   */
  startAutoSlash(
    getPlayerData: () => { x: number; y: number; facingLeft: boolean },
    onHit?: (hitbox: Phaser.Geom.Rectangle) => void
  ): void {

    if (this.slashTimer) {
      this.slashTimer.destroy();
    }


    this.slashTimer = this.scene.time.addEvent({
      delay: this.saberSlashConfig.interval * this.player.saberSpeedMultiplier,
      loop: true,
      callback: () => {
        const { x, y, facingLeft } = getPlayerData();
        const angle = facingLeft ? Math.PI : 0;
        this.slash(x, y, angle, onHit);
      }
    });
  }

  /**
   * Triggers a single saber slash.
   */
  slash(
    x: number,
    y: number,
    angle: number,
    onHit?: (hitbox: Phaser.Geom.Rectangle) => void
  ): void {
    const flipped = angle === Math.PI;
    const offsetX = this.saberSlashConfig.offsetX * (flipped ? -1 : 1);
    const offsetY = this.saberSlashConfig.offsetY;

    const slash = this.scene.add.sprite(x + offsetX, y + offsetY, this.saberSlashConfig.key)
      .setScale(this.saberSlashConfig.scale)
      .setDepth(this.saberSlashConfig.depth)
      .setAlpha(1)
      .setFlipX(flipped);

    this.slashes.push(slash);

    const hitbox = new Phaser.Geom.Rectangle(
      slash.x - slash.width * 1.5,
      slash.y - slash.height / 2,
      slash.width * 2.5,
      slash.height
    );

    // Debug see hitbox
    if (GAME_CONFIG.DEBUG) {
      const graphics = this.scene.add.graphics();
      graphics.lineStyle(2, 0xff0000, 1); // red outline
      graphics.strokeRectShape(hitbox); // draw the rectangle
    }


    if (onHit) onHit(hitbox);
    // Get enemies from the enemy system using the hitbox
    const enemies = this.enemySystem.getEnemiesNear(slash.x, slash.y, 100); // Adjust the radius as needed
    const tfighters = this.tfighterSystem.getEnemiesNear(slash.x, slash.y, 100); // Adjust the radius as needed
    let dmgData = this.calculateSlashDamage(this.saberSlashConfig);
    
    
    const dmg = dmgData.damage;
    const isCritical = dmgData.isCritical;

    // Deal damage to each enemy using the enemySystem
    enemies.forEach((enemy) => {

      this.enemySystem.damageEnemy(enemy, dmg, 0, isCritical);
    });

    tfighters.forEach((enemy) => {

      this.tfighterSystem.damageEnemy(enemy, dmg, 0, isCritical);
    });



    slash.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: slash,
      scale: this.saberSlashConfig.scale,
      alpha: 0,
      duration: this.saberSlashConfig.duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        slash.destroy();
        this.slashes = this.slashes.filter(s => s !== slash);
      }
    });

    const flash = this.scene.add.circle(slash.x, slash.y, 0, 0xffffff, 0.3);
    flash.setDepth(slash.depth - 1);

    this.scene.tweens.add({
      targets: flash,
      radius: 40,
      alpha: 0,
      duration: 200,
      ease: 'Expo.easeOut',
      onComplete: () => flash.destroy()
    });

  }

  private calculateSlashDamage(config: SaberSlashConfig): { damage: number; isCritical: boolean } {
    const base = config.basedamage;
    const damageMultiplier = this.player.saberDamageMultiplier;
    const critChance = 0.2;
    const critMultiplier = 1.5;

    let damage = (base) * damageMultiplier;
    let isCritical = false;

    if (Math.random() < critChance) {
      damage *= critMultiplier;
      isCritical = true;
    }

    return {
      damage: Math.round(damage),
      isCritical
    };
  }

  slashEffects() {

  }



  /**
   * Stops the auto slashing timer.
   */
  stopAutoSlash(): void {
    if (this.slashTimer) {
      this.slashTimer.remove(false);
      this.slashTimer = undefined;
    }
  }

  /**
   * Cleans up all slashes and timers.
   */
  cleanup(): void {
    this.slashes.forEach(s => s.destroy());
    this.slashes = [];
    this.stopAutoSlash();
  }







}

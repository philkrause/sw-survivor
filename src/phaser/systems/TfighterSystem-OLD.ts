import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { EnemySystem } from './EnemySystem';
import { ProjectileSystem } from './ProjectileSystem';
import { ExperienceSystem } from './ExperienceSystem';




export class TfighterSystem {
  private scene: Phaser.Scene;
  private timerEvent: Phaser.Time.TimerEvent;
  private cameraRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
  private hasEnteredScreen: boolean = false;
  private visibleTfighters: Array<Phaser.Physics.Arcade.Sprite> = [];
  private enemySystem: EnemySystem;
  private projectileSystem: ProjectileSystem
  private activeEnemies: Set<Phaser.Physics.Arcade.Sprite> = new Set();
  private healthBars: Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.Graphics> = new Map();
  private experienceSystem: ExperienceSystem | null = null;
  private vectorBuffer = { x: 0, y: 0 };
  private spawnZones: Array<{ x: number, y: number }> = [];

  constructor(scene: Phaser.Scene, enemySystem: EnemySystem, projectileSystem: ProjectileSystem) {
    this.scene = scene;;
    this.enemySystem = enemySystem;
    this.projectileSystem = projectileSystem;

    this.timerEvent = this.scene.time.addEvent({
      delay: 10000,
      callback: this.spawnWave,
      callbackScope: this,
      loop: true
    });
  }

  private createSpawnZones():{ x: number; y: number; }[] {     

    const cam = this.scene.cameras.main;
    const padding = GAME_CONFIG.ENEMY.SPAWN_PADDING || 100;

    // Define spawn zones just off-screen (left, right, top, bottom)
    return this.spawnZones = [
      {
        x: Phaser.Math.Between(cam.scrollX - padding * 2, cam.scrollX - padding),
        y: Phaser.Math.Between(cam.scrollY - padding, cam.scrollY + cam.height + padding)
      }, // Left
      {
        x: Phaser.Math.Between(cam.scrollX + cam.width + padding, cam.scrollX + cam.width + padding * 2),
        y: Phaser.Math.Between(cam.scrollY - padding, cam.scrollY + cam.height + padding)
      }, // Right
      {
        x: Phaser.Math.Between(cam.scrollX - padding, cam.scrollX + cam.width + padding),
        y: Phaser.Math.Between(cam.scrollY - padding * 2, cam.scrollY - padding)
      }, // Top
      {
        x: Phaser.Math.Between(cam.scrollX - padding, cam.scrollX + cam.width + padding),
        y: Phaser.Math.Between(cam.scrollY + cam.height + padding, cam.scrollY + cam.height + padding * 2)
      } // Bottom
    ];

  }

  private spawnWave(): void {

    const spawnZones = this.createSpawnZones();

    const spawnCenter = Phaser.Utils.Array.GetRandom(spawnZones);


    const formation = [3, 4, 3]; // Top, middle, bottom row
    const rowSpacing = 50;       // Vertical spacing between rows
    const colSpacing = 50;       // Horizontal spacing between fighters

        const tfighter = this.scene.physics.add.sprite(spawnCenter.x, spawnCenter.y, 'tfighter');
        tfighter.setActive(true);
        tfighter.setVisible(true);
        tfighter.setCollideWorldBounds(false);
        tfighter.setScale(0.1);
        tfighter.setDepth(20);
        if (tfighter)
          this.activateEnemy(tfighter, tfighter.x, tfighter.y);
    // for (let r = 0; r < formation.length; r++) {
    //   const numInRow = formation[r];
    //   const rowY = spawnCenter.y + (r - 1) * rowSpacing; // middle row at center

    //   for (let i = 0; i < numInRow; i++) {
    //     const colX = spawnCenter.x + (i - (numInRow - 1) / 2) * colSpacing;

    //     const tfighter = this.scene.physics.add.sprite(colX, rowY, 'tfighter');
    //     tfighter.setActive(true);
    //     tfighter.setVisible(true);
    //     tfighter.setCollideWorldBounds(false);
    //     tfighter.setScale(0.1);
    //     tfighter.setDepth(20);

    
    //     if (tfighter)
    //       this.activateEnemy(tfighter, tfighter.x, tfighter.y);
    //   }
    // }
  }

    private moveEnemy(tfighter: Phaser.Physics.Arcade.Sprite): void {
      const cam = this.scene.cameras.main;

      const centerX = cam.scrollX + cam.width / 2;
      const centerY = cam.scrollY + cam.height / 2;
      const dx = centerX 
      const dy = centerY
      const len = Math.sqrt(dx * dx + dy * dy);

        const vx = (dx / len) * 150;
        const vy = (dy / len) * 150;

        if(len > 0 && tfighter.body)
          tfighter.setVelocity(vx, vy);
    }



  private activateEnemy(enemy: Phaser.Physics.Arcade.Sprite, x: number, y: number): void {
    enemy.setPosition(x, y);
    enemy.setActive(true);
    enemy.setVisible(true);
    if (enemy.body)
      enemy.body.enable = true;// Activate the physics body
    //enemy.setVelocity(0, 0);

    // Reset any enemy state that needs resetting
    //enemy.setTint(GAME_CONFIG.ENEMY.TINT);

    // Reset health to max
    (enemy as any).health = GAME_CONFIG.ENEMY.MAX_HEALTH;


    // Resize collider box here
    // if (enemy.body) {
    //   enemy.body.setSize(16, 16);
    // }

    // Create or update health bar
    this.createOrUpdateHealthBar(enemy);

    // Add to our tracking set for faster iteration
    this.activeEnemies.add(enemy);

  }

  getEnemiesNear(x: number, y: number, radius: number): Phaser.Physics.Arcade.Sprite[] {
    const result: Phaser.Physics.Arcade.Sprite[] = [];

    const radiusSq = radius * radius;
    for (const enemy of this.activeEnemies) {
      if (!enemy.active) continue;

      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distSq = dx * dx + dy * dy;
      console.log(`checking ${enemy.x},${enemy.y} against ${x},${y}, dist=${Math.sqrt(distSq)}`);
      // Square distance check for better performance
      if (dx * dx + dy * dy <= radiusSq) {
        result.push(enemy);
      }
    }

    return result;
  }

  getVisibleTfighter(): Array<Phaser.Physics.Arcade.Sprite> {
    return this.visibleTfighters;
  }



  // Optional method to clean up the group or stop spawning
  public destroy(): void {
    this.timerEvent?.remove();
    console.log("Destroying TfighterSystem and clearing group");
  }

  private deactivateEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {

    enemy.setActive(false);
    enemy.setVisible(false);
    if (enemy.body) {
      enemy.body.enable = false; // Deactivate the physics body
      enemy.setVelocity(0, 0);
    //enemy.body.enable = false;// Disables the physics body
    }
    // Remove health bar
    const healthBar = this.healthBars.get(enemy);
    if (healthBar) {
      healthBar.setVisible(false);
    }

    this.activeEnemies.delete(enemy);
  }


  public dropExperienceOrb(enemy: Phaser.Physics.Arcade.Sprite): void {
    // Skip if no experience system is set
    if (!this.experienceSystem) return;

    // Check drop chance
    //if (Math.random() <= GAME_CONFIG.ENEMY.EXPERIENCE_DROP_CHANCE) {
    // Spawn experience orb at enemy position
    this.experienceSystem.spawnOrb(enemy.x, enemy.y);
    // Add a small visual effect
    this.createDeathEffect(enemy.x, enemy.y);

  }

  private createDeathEffect(x: number, y: number): void {
    // Create particles for death effect
    const particles = this.scene.add.particles(x, y, GAME_CONFIG.EXPERIENCE_ORB.KEY, {
      speed: { min: 50, max: 100 },
      scale: { start: 0.2, end: 0 },
      quantity: 5,
      lifespan: 500,
      tint: 0xFFD700
    });

    // Auto-destroy after animation completes
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
  }


  damageEnemy(enemy: Phaser.Physics.Arcade.Sprite, damage: number, knockbackForce?: number, isCritical = false): boolean {
    if (!enemy.active) return false;

    (enemy as any).health -= damage;
    this.updateHealthBar(enemy);

    if ((enemy as any).health <= 0) {
      this.showDamageNumber(this.scene, enemy.x, enemy.y - 10, damage, isCritical);
      this.dropExperienceOrb(enemy);
      this.deactivateEnemy(enemy);

      return true;
    }

    // enemy.setTint(GAME_CONFIG.ENEMY.DAMAGE_TINT);
    // this.scene.time.delayedCall(200, () => {
    //   if (enemy.active) {
    //     enemy.setTint(GAME_CONFIG.ENEMY.TINT);
    //   }
    // });

    if (knockbackForce && enemy.body) {
      const vx = enemy.body.velocity.x;
      const vy = enemy.body.velocity.y;
      const length = Math.sqrt(vx * vx + vy * vy);

      if (length > 0) {
        const knockbackX = -(vx / length) * knockbackForce;
        const knockbackY = -(vy / length) * knockbackForce;
        const duration = GAME_CONFIG.ENEMY.KNOCKBACK_DURATION;

        // Calculate target position
        const targetX = enemy.x + knockbackX * (duration / 1000); // scale by duration
        const targetY = enemy.y + knockbackY * (duration / 1000);

        this.scene.tweens.add({
          targets: enemy,
          x: targetX,
          y: targetY,
          ease: 'Quad.easeOut',
          duration: duration,
          onComplete: () => {
            // Optionally do something after knockback
          }
        });
      }
    }

    this.showDamageNumber(this.scene, enemy.x, enemy.y - 10, damage, isCritical);

    return false;
  }

  public showDamageNumber(scene: Phaser.Scene, x: number, y: number, damage: number, isCritical = false): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '24px',
      color: isCritical ? '#ff3333' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      fontFamily: 'Arial'
    };

    if (!damage) return;
    const text = scene.add.text(x, y, damage.toString(), style)
      .setDepth(100) // above other sprites
      .setOrigin(0.5);

    // Animate up and fade
    scene.tweens.add({
      targets: text,
      y: y - 20,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private createOrUpdateHealthBar(enemy: Phaser.Physics.Arcade.Sprite): void {
    let healthBar = this.healthBars.get(enemy);

    if (!healthBar) {
      // Create new health bar
      healthBar = this.scene.add.graphics();
      this.healthBars.set(enemy, healthBar);
    }

    // Update health bar appearance
    this.updateHealthBar(enemy);

    // Position the health bar
    this.updateHealthBarPosition(enemy);
  }


  private updateHealthBar(enemy: Phaser.Physics.Arcade.Sprite): void {
    const healthBar = this.healthBars.get(enemy);
    if (!healthBar) return;

    // Clear previous graphics
    healthBar.clear();

    // Get current health percentage
    const health = (enemy as any).health || 0;
    const maxHealth = GAME_CONFIG.ENEMY.MAX_HEALTH;
    const healthPercent = Math.max(0, Math.min(1, health / maxHealth));

    // Set health bar dimensions
    const width = 30;
    const height = 4;

    // Draw background (empty health)
    healthBar.fillStyle(0x222222, 0.8);
    healthBar.fillRect(-width / 2, -20, width, height);

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

      healthBar.fillRect(-width / 2, -20, width * healthPercent, height);
    }

    // Set depth to ensure it renders above the enemy
    healthBar.setDepth(GAME_CONFIG.ENEMY.DEPTH + 1);
  }

  private updateHealthBarPosition(enemy: Phaser.Physics.Arcade.Sprite): void {
    const healthBar = this.healthBars.get(enemy);
    if (!healthBar) return;

    healthBar.setPosition(enemy.x, enemy.y);
    healthBar.setVisible(true);
  }


  update(): void {
    this.visibleTfighters.length = 0;

    for (const tfighter of this.activeEnemies) {

      const camera = this.scene.cameras.main;
      if (camera) {
        this.cameraRect.setTo(
          camera.scrollX - 100, // Buffer zone outside camera
          camera.scrollY - 100,
          camera.width + 200,
          camera.height + 200
        );
      } 

      this.moveEnemy(tfighter)

      this.updateHealthBarPosition(tfighter);

      // Clear visible enemies array without allocating new one
      const isVisibleToCamera =
        tfighter.x + tfighter.width > camera.worldView.left &&
        tfighter.x - tfighter.width < camera.worldView.right &&
        tfighter.y + tfighter.height > camera.worldView.top &&
        tfighter.y - tfighter.height < camera.worldView.bottom;

      if (isVisibleToCamera) {
        (tfighter as any).hasEnteredScreen = true;
        this.visibleTfighters.push(tfighter as Phaser.Physics.Arcade.Sprite);
      }


      const hasExited =
        !isVisibleToCamera && (tfighter as any).hasEnteredScreen;

      if (hasExited) {
        tfighter.destroy();
        this.deactivateEnemy(tfighter)
      }

    };
  }

}

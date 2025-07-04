import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnemySystem } from '../systems/EnemySystem';
import { TfighterSystem } from '../systems/TfighterSystem';

export class R2D2System {
    private scene: Phaser.Scene;
    private enemySystem: EnemySystem;
    private tfighterSystem: TfighterSystem;
    private player: Player;
    private sprite?: Phaser.GameObjects.Sprite;
    private angle = 0;
    private radius = 70;
    private speed = 3; // radians per frame
    private active = false;
    private damage = 10;

    //tracking enemies that are hit
    private lastAngle: number = 0;
    private hitEnemiesThisRevolution: WeakSet<Phaser.GameObjects.GameObject> = new WeakSet();
    

    constructor(scene: Phaser.Scene, enemySystem: EnemySystem, tfighterSystem: TfighterSystem, player: Player) {
        this.scene = scene;
        this.enemySystem = enemySystem;
        this.tfighterSystem = tfighterSystem;
        this.player = player;


    }



    unlockAndActivate() {
        const { x, y } = this.player.getPosition();

        this.sprite = this.scene.add.sprite(x, y, 'r2d2');
        this.sprite.setScale(1.5);
        this.sprite.setDepth(5);
        
        this.active = true;
    }


    isActive(): boolean {
        return this.active;
    }


    update(delta: number): void {
        if (!this.active || !this.sprite || !this.player) return;

        // 1. Store previous angle and advance current angle
        this.lastAngle = this.angle;
        this.angle += this.speed * (delta / 1000);
        this.angle %= 2 * Math.PI;
        const dmg = this.damage * this.player.R2D2DamageMultiplier
        // 2. Detect if we started a new revolution
        if (this.angle < this.lastAngle) {
            this.hitEnemiesThisRevolution = new WeakSet();
        }

        // 3. Orbit logic
        const { x, y } = this.player.getPosition();
        const px = x + Math.cos(this.angle) * this.radius;
        const py = y + Math.sin(this.angle) * this.radius;
        this.sprite.setPosition(px, py);

        // 4. Damage logic
        const enemies = this.enemySystem.getVisibleEnemies();
        const tfighters = this.tfighterSystem.getVisibleEnemies();
        
        enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
            if (dist < 30 && !this.hitEnemiesThisRevolution.has(enemy)) {
                
                this.enemySystem.damageEnemy(enemy, dmg, 0, false);
                this.hitEnemiesThisRevolution.add(enemy);
            }
        });

        tfighters.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
            if (dist < 30 && !this.hitEnemiesThisRevolution.has(enemy)) {
                
                this.enemySystem.damageEnemy(enemy, dmg, 0, false);
                this.hitEnemiesThisRevolution.add(enemy);
            }
        });
    }
}

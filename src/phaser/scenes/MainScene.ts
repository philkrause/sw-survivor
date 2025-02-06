import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private playerSpeed: number = 300;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5AoEFSw76XxeigAAABJQTFRFAAAApxifpxifpxifpxifpxifi5MtmAAAAAV0Uk5TAP//8A5t+68AAAABYktHRACIBR1IAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAFUlEQVRIx2NgGAWjYBSMglEwCoYlAAAfgAABRDl7AgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMC0xMC0wNFQyMTo0NDo1OSswMDowMIYnMV8AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjAtMTAtMDRUMjE6NDQ6NTkrMDA6MDD3eondAAAAAElFTkSuQmCC');
    
    this.load.image('background', 'assets/images/bg.png');
  }

  create() {
    this.createWorld();
    
    this.createPlayer();
    
    this.setupInput();
    
    this.add.text(16, 16, 'Use WASD or Arrow keys to move', {
      fontSize: '18px',
      color: '#ffffff',
      strokeThickness: 2,
      stroke: '#000000'
    });
  }

  createWorld() {
    const width = this.cameras.main!.width;
    const height = this.cameras.main!.height;
    
    this.add.image(width / 2, height / 2, 'background')
      .setDisplaySize(width, height);
      
    this.physics.world.setBounds(0, 0, width, height);
  }

  createPlayer() {
    const centerX = this.cameras.main!.width / 2;
    const centerY = this.cameras.main!.height / 2;
    
    this.player = this.physics.add.sprite(centerX, centerY, 'player');
    this.player.setScale(0.5);
    this.player.setDepth(10); // Ensure player is above other elements
    
    this.player.setCollideWorldBounds(true);
    this.player.body!.setSize(this.player.width * 0.8, this.player.height * 0.8); // Slightly smaller hitbox
    this.player.setDamping(false);
    this.player.setDrag(0);
  }

  setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    this.wasdKeys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }

  update() {
    this.handlePlayerMovement();
  }

  handlePlayerMovement() {
    let dirX = 0;
    let dirY = 0;
    
    if (this.wasdKeys.A.isDown || this.cursors.left!.isDown) {
      dirX = -1;
    } else if (this.wasdKeys.D.isDown || this.cursors.right!.isDown) {
      dirX = 1;
    }
    
    if (this.wasdKeys.W.isDown || this.cursors.up!.isDown) {
      dirY = -1;
    } else if (this.wasdKeys.S.isDown || this.cursors.down!.isDown) {
      dirY = 1;
    }
    
    if (dirX !== 0 && dirY !== 0) {
      const length = Math.sqrt(dirX * dirX + dirY * dirY);
      dirX /= length;
      dirY /= length;
    }
    
    this.player.setVelocity(
      dirX * this.playerSpeed,
      dirY * this.playerSpeed
    );
  }
} 
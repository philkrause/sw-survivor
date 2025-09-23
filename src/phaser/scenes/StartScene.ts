import Phaser from 'phaser';
import MainScene from './MainScene';


export default class StartScene extends Phaser.Scene {
  private music!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'StartScene' });

  }

  preload() {
    console.log('📦 preload StartScene');
    this.load.image('starfield', '../../../assets/images/game/startmenu_back.png');
    this.load.image('darthback', '../../../assets/images/game/darth_back.png');
  }

  create() {
    this.sound.stopAll();

    if (this.music) {
      this.music.stop();
    }

    console.log('🎬 create StartScene');

    const darthimage = this.add.image(this.scale.width/8, 0, 'darthback')
      .setOrigin(0) 
      .setDepth(1) 
      .setScale(1.5)     // Align top-left if needed
      .setAlpha(0);       // Start fully transparent
    
    // Fade in
    this.tweens.add({
      targets: darthimage,
      alpha: .75,           // End at fully opaque
      duration: 3000,     // Fade-in duration in ms (1 second)
      ease: 'Linear'
    });

    this.add.image(0, 0, 'starfield').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    // Yellow Star Wars text
    // Wait for StarJedi font to fully load before adding text
    document.fonts.load('64px StarJedi').then(() => {
      console.log('✅ StarJedi font ready');

      this.add.text(this.scale.width / 2, 100, 'star wars', {
        fontFamily: 'StarJedi',
        fontSize: '64px',
        color: '#ffff00',
        stroke: '#000',
        strokeThickness: 8,
        align: 'center'
      }).setOrigin(0.5).setDepth(2);

      this.add.text(this.scale.width / 2, 180, 'survivor', {
        fontFamily: 'StarJedi',
        fontSize: '64px',
        color: '#ffff00',
        stroke: '#000',
        strokeThickness: 8,
        align: 'center'
      }).setOrigin(0.5).setDepth(2);


      // Start Button
      const startButton = this.add.text(this.scale.width / 2, 500, 'START', {
        fontFamily: 'StarJedi',
        fontSize: '64px',
        color: '#ffff00',
        stroke: '#000',
        strokeThickness: 8,
        align: 'center'
      }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true });

      // const optionsButton = this.add.text(this.scale.width / 2, 600, 'options', {
      //   fontFamily: 'StarJedi',
      //   fontSize: '64px',
      //   color: '#ffff00',
      //   stroke: '#000',
      //   strokeThickness: 8,
      //   align: 'center'
      // }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true });


      startButton.on('pointerdown', () => {
        this.scene.stop('StartScene');
        this.scene.remove('MainScene');
        this.scene.add('MainScene', MainScene, true); // auto-start it

      });

      // optionsButton.on('pointerdown', () => {
      //   this.scene.stop('StartScene');
      //   this.scene.remove('MainScene');
      //   this.scene.add('MainScene', MainScene, true); // auto-start it

      // });



      // Hover effect
      startButton.on('pointerover', () => startButton.setStyle({ backgroundColor: '#444' }));
      startButton.on('pointerout', () => startButton.setStyle({ backgroundColor: '' }));
      //optionsButton.on('pointerover', () => optionsButton.setStyle({ backgroundColor: '#444' }));
      //optionsButton.on('pointerout', () => optionsButton.setStyle({ backgroundColor: '' }));
    });

  }



}

import Phaser from 'phaser';
import MainScene from './MainScene';


export default class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  preload() {
    console.log('📦 preload StartScene');
    this.load.image('starfield', '../../../assets/images/game/startmenu_back.png');
    
  }

  create() {
    console.log('🎬 create StartScene');


    this.add.image(0, 0, 'starfield').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    // Yellow Star Wars text
    // Wait for StarJedi font to fully load before adding text
    document.fonts.load('64px StarJedi').then(() => {
      console.log('✅ StarJedi font ready');

      const title = this.add.text(this.scale.width / 2, 300, 'star wars survivor', {
        fontFamily: 'StarJedi',
        fontSize: '64px',
        color: '#ffff00',
        stroke: '#000',
        strokeThickness: 8,
        align: 'center'
      }).setOrigin(0.5);

      // Start Button
      const startButton = this.add.text(this.scale.width / 2, 400, 'START', {
        fontFamily: 'StarJedi',
        fontSize: '64px',
        color: '#ffff00',
        stroke: '#000',
        strokeThickness: 8,
        align: 'center'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      startButton.on('pointerdown', () => {
          this.scene.stop('StartScene');
          this.scene.remove('MainScene');
          this.scene.add('MainScene', MainScene, true); // auto-start it

      });

            // Hover effect
      startButton.on('pointerover', () => startButton.setStyle({ backgroundColor: '#444' }));
      startButton.on('pointerout', () => startButton.setStyle({ backgroundColor: '#222' }));
    });







  }

}

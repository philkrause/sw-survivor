import Phaser from 'phaser';

export interface PauseMenuOptions {
  onResume: () => void;
  onVolumeChange: (volume: number) => void;
  onQuit: () => void;
}

export class PauseMenu {
  private scene: Phaser.Scene;
  private options: PauseMenuOptions;
  private isVisible: boolean = false;
  private selectedIndex: number = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private volumeSlider!: Phaser.GameObjects.Graphics;
  private volumeSliderBg!: Phaser.GameObjects.Graphics;
  private volumeText!: Phaser.GameObjects.Text;
  private title!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Rectangle;
  private currentVolume: number = 1.0;
  private isVolumeSelected: boolean = false;

  constructor(scene: Phaser.Scene, options: PauseMenuOptions) {
    this.scene = scene;
    this.options = options;
    this.setupKeyboardInput();
  }

  private setupKeyboardInput(): void {
    this.scene.input.keyboard?.on('keydown', this.handleKeyDown, this);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isVisible) return;

    if (this.isVolumeSelected) {
      this.handleVolumeInput(event);
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.updateSelection();
        break;
      case 'ArrowDown':
        this.selectedIndex = Math.min(this.menuItems.length - 1, this.selectedIndex + 1);
        this.updateSelection();
        break;
      case 'Enter':
        this.selectMenuItem();
        break;
      case 'Escape':
        this.options.onResume();
        break;
    }
  }

  private handleVolumeInput(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        this.currentVolume = Math.max(0, this.currentVolume - 0.1);
        this.updateVolumeSlider();
        this.options.onVolumeChange(this.currentVolume);
        break;
      case 'ArrowRight':
        this.currentVolume = Math.min(1, this.currentVolume + 0.1);
        this.updateVolumeSlider();
        this.options.onVolumeChange(this.currentVolume);
        break;
      case 'Enter':
      case 'Escape':
        this.isVolumeSelected = false;
        this.updateSelection();
        break;
    }
  }

  private selectMenuItem(): void {
    switch (this.selectedIndex) {
      case 0: // Resume
        this.options.onResume();
        break;
      case 1: // Quit
        this.options.onQuit();
        break;
    }
  }

  public show(): void {
    if (this.isVisible) return;
    this.isVisible = true;
    this.selectedIndex = 0;
    this.isVolumeSelected = false;

    // Check if StarJedi font is already loaded, otherwise wait for it
    console.log('Loading StarJedi font for PauseMenu...');
    if (document.fonts.check('48px StarJedi')) {
      console.log('StarJedi font already loaded for PauseMenu');
      this.createMenuElements();
    } else {
      document.fonts.load('48px StarJedi').then(() => {
        console.log('StarJedi font loaded for PauseMenu');
        this.createMenuElements();
      }).catch((error) => {
        console.error('Failed to load StarJedi font:', error);
        // Fallback: create menu anyway
        this.createMenuElements();
      });
    }
  }

  private createMenuElements(): void {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    // Create dark overlay
    this.overlay = this.scene.add.rectangle(centerX, centerY, this.scene.cameras.main.width, this.scene.cameras.main.height, 0x000000, 0.8);
    this.overlay.setDepth(1000).setScrollFactor(0);

    // Create title
    this.title = this.scene.add.text(centerX, centerY - 150, 'paused', {
      fontFamily: 'StarJedi',
      fontSize: '48px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    // Create menu items
    const menuItems = ['resume'];
    this.menuItems = [];

    menuItems.forEach((item, index) => {
      const text = this.scene.add.text(centerX, centerY - 50 + (index * 60), item, {
        fontFamily: 'StarJedi',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

      // Make resume button clickable
      if (item === 'resume') {
        text.setInteractive();
        text.on('pointerdown', () => {
          this.options.onResume();
        });
      }

      this.menuItems.push(text);
    });

    // Create quit button at bottom of screen
    const backButton = this.scene.add.text(centerX, this.scene.cameras.main.centerY + (this.scene.cameras.main.height / 2) - 80, 'quit', {
      fontFamily: 'StarJedi',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);
    
    // Make quit button interactive
    backButton.setInteractive();
    backButton.on('pointerdown', () => {
      this.options.onQuit();
    });
    
    this.menuItems.push(backButton);

    // Create volume slider
    this.createVolumeSlider(centerX, centerY + 50);

    this.updateSelection();
  }

  private createVolumeSlider(x: number, y: number): void {
    const screenWidth = this.scene.cameras.main.width;
    const leftThird = screenWidth / 3;
    const rightThird = screenWidth * 2 / 3;
    
    // Volume label - positioned in left third
    this.volumeText = this.scene.add.text(leftThird, y, 'volume', {
      fontFamily: 'StarJedi',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    // Slider background
    this.volumeSliderBg = this.scene.add.graphics();
    this.volumeSliderBg.setDepth(1001).setScrollFactor(0);
    
    // Slider
    this.volumeSlider = this.scene.add.graphics();
    this.volumeSlider.setDepth(1001).setScrollFactor(0);

    // Make slider interactive - positioned in right third
    this.volumeSliderBg.setInteractive(
      new Phaser.Geom.Rectangle(rightThird - 100, y - 10, 200, 20),
      Phaser.Geom.Rectangle.Contains
    );
    
    this.volumeSliderBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isVolumeSelected = true;
      this.updateVolumeFromPointer(pointer);
    });
    
    this.volumeSliderBg.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && this.isVolumeSelected) {
        this.updateVolumeFromPointer(pointer);
      }
    });
    
    this.volumeSliderBg.on('pointerup', () => {
      this.isVolumeSelected = false;
      this.updateSelection();
    });

    this.updateVolumeSlider();
  }

  private updateVolumeFromPointer(pointer: Phaser.Input.Pointer): void {
    const screenWidth = this.scene.cameras.main.width;
    const rightThird = screenWidth * 2 / 3;
    const sliderWidth = 200;
    const sliderLeft = rightThird - 100;
    
    // Calculate volume based on mouse position
    const relativeX = pointer.x - sliderLeft;
    this.currentVolume = Math.max(0, Math.min(1, relativeX / sliderWidth));
    
    this.updateVolumeSlider();
    this.options.onVolumeChange(this.currentVolume);
  }

  private updateVolumeSlider(): void {
    const screenWidth = this.scene.cameras.main.width;
    const rightThird = screenWidth * 2 / 3;
    const sliderY = this.scene.cameras.main.height / 2 + 50;
    const sliderWidth = 200;
    const sliderHeight = 20;

    // Clear previous graphics
    this.volumeSliderBg.clear();
    this.volumeSlider.clear();

    // Draw background
    this.volumeSliderBg.fillStyle(0x333333);
    this.volumeSliderBg.fillRect(rightThird - 100, sliderY - sliderHeight / 2, sliderWidth, sliderHeight);

    // Draw border
    this.volumeSliderBg.lineStyle(2, 0xffffff);
    this.volumeSliderBg.strokeRect(rightThird - 100, sliderY - sliderHeight / 2, sliderWidth, sliderHeight);

    // Draw volume fill
    const fillWidth = sliderWidth * this.currentVolume;
    this.volumeSlider.fillStyle(this.isVolumeSelected ? 0xffff00 : 0x00ff00);
    this.volumeSlider.fillRect(rightThird - 100, sliderY - sliderHeight / 2, fillWidth, sliderHeight);
  }

  private updateSelection(): void {
    this.menuItems.forEach((item, index) => {
      if (index === this.selectedIndex && !this.isVolumeSelected) {
        item.setStyle({
          color: '#ffff00',
          strokeThickness: 4
        });
      } else {
        item.setStyle({
          color: '#ffffff',
          strokeThickness: 2
        });
      }
    });

    // Update volume slider appearance
    this.updateVolumeSlider();
  }

  public hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;

    // Explicitly destroy all menu elements
    if (this.overlay) {
      this.overlay.destroy();
    }
    if (this.title) {
      this.title.destroy();
    }
    if (this.volumeText) {
      this.volumeText.destroy();
    }
    if (this.volumeSliderBg) {
      this.volumeSliderBg.destroy();
    }
    if (this.volumeSlider) {
      this.volumeSlider.destroy();
    }

    // Destroy all menu items
    this.menuItems.forEach(item => {
      if (item) {
        item.destroy();
      }
    });

    // Remove all remaining menu elements
    this.scene.children.list.forEach(child => {
      if (child.depth >= 1000) {
        child.destroy();
      }
    });

    this.menuItems = [];
  }

  public setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.isVisible) {
      this.updateVolumeSlider();
    }
  }

  public cleanup(): void {
    this.scene.input.keyboard?.off('keydown', this.handleKeyDown, this);
    this.hide();
  }
}

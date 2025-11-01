import Phaser from 'phaser';
import { Upgrade, UpgradeSystem } from '../systems/UpgradeSystem';

/**
 * UI component for displaying and selecting upgrades
 */
export class UpgradeUI {
  private scene: Phaser.Scene;
  private upgradeSystem: UpgradeSystem;
  private container: Phaser.GameObjects.Container;
  private titleText: Phaser.GameObjects.Text;
  private upgradeCards: Phaser.GameObjects.Container[] = [];
  private isVisible: boolean = false;
  private onUpgradeSelected: (upgradeId: string) => void;
  private overlay!: Phaser.GameObjects.Rectangle;
  private selectedCardIndex: number = 0;
  private selectionHighlight: Phaser.GameObjects.Rectangle | null = null;
  private keys: Phaser.Input.Keyboard.Key[] = [];
  private upgrades: Upgrade[] = [];

  constructor(scene: Phaser.Scene, upgradeSystem: UpgradeSystem) {
    this.scene = scene;
    this.upgradeSystem = upgradeSystem;

    // Create container for all UI elements
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(100);
    this.container.setVisible(false);


    //this.container.add(this.background);

    // Create title text
    this.titleText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      100,
      'LEVEL UP! Choose an upgrade:',
      {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 5,
          fill: true
        }
      }
    );
    this.titleText.setOrigin(0.5);
    this.container.add(this.titleText);

    // Set default callback
    this.onUpgradeSelected = () => { };
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const total = this.upgradeCards.length;

    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      this.selectedCardIndex = (this.selectedCardIndex + 1) % total;
      this.updateSelectionHighlight();
    } else if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      this.selectedCardIndex = (this.selectedCardIndex - 1 + total) % total;
      this.updateSelectionHighlight();
    } else if (event.key === 'Enter' || event.key === ' ') {
      // Allow both Enter and Spacebar to select upgrade
      const upgrade = this.upgrades[this.selectedCardIndex];
      this.onUpgradeSelected(upgrade.id);
      this.hide();
    }
  }



  /**
   * Show the upgrade selection UI with random upgrades
   */
  show(count: number = 3, callback: (upgradeId: string) => void): void {
    if (this.isVisible) return;

    this.keys = [
      this.scene.input.keyboard!.addKey('LEFT'),
      this.scene.input.keyboard!.addKey('RIGHT'),
      this.scene.input.keyboard!.addKey('A'),
      this.scene.input.keyboard!.addKey('D'),
      this.scene.input.keyboard!.addKey('ENTER'),
      this.scene.input.keyboard!.addKey('SPACE')
    ];

    this.scene.input.keyboard!.on('keydown', this.handleKeyDown, this);
    // Store callback
    this.onUpgradeSelected = callback;

    // Get random upgrades
    const upgrades = this.upgradeSystem.getRandomUpgrades(count);

    // If no upgrades available, call callback with null
    if (upgrades.length === 0) {
      callback('');
      return;
    }

    // Clear any existing upgrade cards
    this.clearUpgradeCards();

    // Create upgrade cards
    this.createUpgradeCards(upgrades);

    // Show the container
    this.container.setVisible(true);
    this.isVisible = true;

    // Animate the container
    this.animateIn();
  }


  /**
   * Hide the upgrade selection UI
   */
  hide(): void {
    if (!this.isVisible) return;

    // Animate out
    this.animateOut(() => {
      // Hide the container
      this.container.setVisible(false);
      this.isVisible = false;

      // Clear upgrade cards
      this.clearUpgradeCards();
    });

    this.container.setVisible(false);

    // Clean up input
    this.scene.input.keyboard!.off('keydown', this.handleKeyDown, this);
    this.keys.forEach(key => key.destroy());
    this.keys = [];
  }


  private updateSelectionHighlight(): void {
    const selectedCard = this.upgradeCards[this.selectedCardIndex];
    if (this.selectionHighlight && selectedCard) {
      this.selectionHighlight.setPosition(selectedCard.x, selectedCard.y);
      this.container.bringToTop(this.selectionHighlight); // Make sure highlight stays on top
    }
  }

  /**
   * Clear all upgrade cards
   */
  private clearUpgradeCards(): void {
    this.upgradeCards.forEach(card => {
      card.destroy();
    });
    this.upgradeCards = [];
  }


  /**
   * Create upgrade cards for the given upgrades
   */
  private createUpgradeCards(upgrades: Upgrade[]): void {



    const cardWidth = 250;
    const cardHeight = 300;
    const cardSpacing = 30;

    // Calculate total width of all cards including spacing
    const totalWidth = (cardWidth * upgrades.length) + (cardSpacing * (upgrades.length - 1));



    // Calculate starting X position to center all cards
    const cam = this.scene.cameras.main;
    const startX = cam.scrollX + (cam.width - totalWidth) / 2 + (cardWidth / 2);
    const startY = cam.scrollY + cam.height / 2;

    this.upgrades = upgrades;
    this.selectedCardIndex = 0;

    this.upgrades.forEach((upgrade, index) => {
      // Create card container
      const card = this.scene.add.container(
        startX + (cardWidth + cardSpacing) * index,
        startY
      );

      // Create card background
      const cardBg = this.scene.add.rectangle(
        0, 0, cardWidth, cardHeight, 0x1d1805, 0.9
      );
      cardBg.setStrokeStyle(4, 0xf0c040);
      card.add(cardBg);

      // Create upgrade name text
      const nameText = this.scene.add.text(
        0, -cardHeight / 2 + 40,
        upgrade.name,
        {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
          align: 'center',
          stroke: '#000000',
          strokeThickness: 2
        }
      );
      nameText.setOrigin(0.5);
      card.add(nameText);

      // Create level text
      const currentLevel = this.upgradeSystem.getUpgradeLevel(upgrade.id);
      const levelText = this.scene.add.text(
        0, -cardHeight / 2 + 70,
        `Level ${currentLevel} → ${currentLevel + 1}`,
        {
          fontSize: '18px',
          color: '#f0c040',
          align: 'center'
        }
      );
      levelText.setOrigin(0.5);
      card.add(levelText);

      // Create description text
      const descText = this.scene.add.text(
        0, 0,
        upgrade.description,
        {
          fontSize: '18px',
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: cardWidth - 40 }
        }
      );
      descText.setOrigin(0.5);
      card.add(descText);

      // Create select button
      const selectButton = this.scene.add.rectangle(
        0, cardHeight / 2 - 40,
        cardWidth - 40, 50,
        0x00aa00, 1
      );
      selectButton.setStrokeStyle(2, 0xffffff);
      selectButton.setInteractive({ useHandCursor: true });
      card.add(selectButton);

      // Create select button text
      const buttonText = this.scene.add.text(
        0, cardHeight / 2 - 40,
        'SELECT',
        {
          fontSize: '20px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }
      );
      buttonText.setOrigin(0.5);
      card.add(buttonText);

      // Add hover effect
      selectButton.on('pointerover', () => {
        selectButton.setFillStyle(0x00cc00);
        card.setScale(1.05);
      });

      selectButton.on('pointerout', () => {
        selectButton.setFillStyle(0x00aa00);
        card.setScale(1);
      });

      // Add click handler
      selectButton.on('pointerdown', () => {
        this.onUpgradeSelected(upgrade.id);
        this.hide();
      });

      // Add card to container
      this.container.add(card);
      this.upgradeCards.push(card);

      // Start with scale 0 for animation
      card.setScale(0);

      if (index === 0) {

        // Cleanup old highlight if it exists
        if (this.selectionHighlight) {
          this.selectionHighlight.destroy();
          this.selectionHighlight = null;
        }
        this.selectionHighlight = this.scene.add.rectangle(
          card.x, card.y,
          cardWidth + 10, cardHeight + 10,
          0xffff00, 0.25
        ).setStrokeStyle(4, 0xffff00).setOrigin(0.5);

        this.container.add(this.selectionHighlight);
      }

    });
  }

  /**
   * Animate the UI in
   */
  private animateIn(): void {
    // Animate background
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: { from: 0, to: 0.7 },
      duration: 300,
      ease: 'Power2'
    });

    // Animate title
    this.scene.tweens.add({
      targets: this.titleText,
      y: { from: 0, to: 100 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.out'
    });

    // Animate cards with delay between each
    this.upgradeCards.forEach((card, index) => {
      this.scene.tweens.add({
        targets: card,
        scale: { from: 0, to: 1 },
        duration: 400,
        delay: 200 + index * 100,
        ease: 'Back.out'
      });
    });
  }

  /**
   * Animate the UI out
   */
  private animateOut(onComplete: () => void): void {
    // Animate background
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: { from: 0.7, to: 0 },
      duration: 300,
      ease: 'Power2'
    });

    // Animate title
    this.scene.tweens.add({
      targets: this.titleText,
      y: { from: 100, to: 0 },
      alpha: { from: 1, to: 0 },
      duration: 300,
      ease: 'Back.in'
    });

    // Animate cards with delay between each
    const lastCardIndex = this.upgradeCards.length - 1;

    this.upgradeCards.forEach((card, index) => {
      this.scene.tweens.add({
        targets: card,
        scale: { from: 1, to: 0 },
        duration: 300,
        delay: index * 100,
        ease: 'Back.in',
        onComplete: index === lastCardIndex ? onComplete : undefined
      });
    });
  }



  /**
   * Clean up resources
   */
  cleanup(): void {
    // Clear any existing upgrade cards
    this.clearUpgradeCards();

    // Destroy container and all children
    this.container.destroy();
  }
} 
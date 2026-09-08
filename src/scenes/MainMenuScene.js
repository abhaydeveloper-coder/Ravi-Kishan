import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Add the start screen image, centered
        const startScreen = this.add.image(width / 2, height / 2, 'start_screen');
        
        // Scale it to cover the screen
        const scaleX = width / startScreen.width;
        const scaleY = height / startScreen.height;
        const scale = Math.max(scaleX, scaleY);
        startScreen.setScale(scale);

        // Make the whole screen interactive to start the game
        const zone = this.add.zone(width / 2, height / 2, width, height)
            .setInteractive({ useHandCursor: true });

        // Hover effect for the whole screen (optional, but good for cursor feedback)
        zone.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

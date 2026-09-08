import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load the game assets
        this.load.image('background', '/assets/images/background.png');
        this.load.image('start_screen', '/assets/images/start_screen.png');
        this.load.image('coin', '/assets/images/coin.png');
        this.load.image('heart', '/assets/images/heart.png');
        this.load.image('pause', '/assets/images/pause.jpg');
        this.load.image('ravi',   '/assets/images/ravi.png');
        this.load.image('modi',   '/assets/images/modi.png');
        this.load.image('shivji', '/assets/images/shivji.png');
        // Money_Follows audio is loaded via native HTML5 Audio API in GameScene
        // (Phaser Web Audio does not support .mpeg format)
    }

    create() {
        this.scene.start('MainMenuScene');
    }
}

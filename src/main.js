import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'app',
    width: 540,
    height: 960,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MainMenuScene, GameScene]
};

export default new Phaser.Game(config);

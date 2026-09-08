import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // Road scroll speed
        this.ROAD_SCROLL_SPEED = 0.05;

        // Coin approach speed (gives ~280 px/sec visual travel)
        this.COIN_SPEED = 1.0;

        // Pseudo-3D camera config
        this.horizonY  = 400;
        this.camHeight = 560;
        this.zMax      = 100;
        this.zMin      = 0.5;

        // Road lane markings
        this.markings       = [];
        this.markingSpacing = 4.0;
        this.markingLength  = 2.0;

        // 3-D world X coords
        this.roadEdges    = [-260, 260];
        this.laneDividers = [-86.6, 86.6];
        this.laneCenters  = [-173.3, 0, 173.3]; // LEFT, CENTER, RIGHT

        // Player state
        this.playerZ       = 1.6;
        this.currentLane   = 1;   // start center
        this.raviMoveTween = null;

        // Coin / score state
        this.score     = 0;
        this.laneQueue = [];

        // Modi obstacle state
        this.MODI_SPEED    = 0.93; // ~260 px/sec visual travel
        this.activeModi    = null;
        this.modiLaneQueue = [];

        // Shivji special collectible state
        this.SHIVJI_SPEED    = 0.89; // ~250 px/sec visual travel
        this.activeShivji    = null; // single active Shivji sprite
        this.shivjiLaneQueue = [];

        // ── Lives / collision state ─────────────────────────────────────────
        this.lives          = 3;
        this.isInvincible   = false; // cooldown flag – prevents multi-frame damage
        this.isGameOver     = false;
    }

    // ── Project 3-D (x, z) → 2-D screen coords ──────────────────────────────
    getScreenCoords(x, z) {
        return {
            x:     270 + (x / z),
            y:     this.horizonY + (this.camHeight / z),
            scale: 1 / z
        };

        // Pause state
        this.isPaused          = false;
        this.pauseOverlayGroup = null; // holds all pause-popup display objects
    }

    // ── create ───────────────────────────────────────────────────────────────
    create() {
        const { width, height } = this.scale;

        // Reset all state on (re)create
        this.score        = 0;
        this.lives        = 3;
        this.isInvincible = false;
        this.isGameOver   = false;
        this.isPaused     = false;
        this.pauseOverlayGroup = null;
        this.activeCoin   = null;
        this.activeModi   = null;
        this.markings     = [];
        this.laneQueue    = [];
        this.modiLaneQueue = [];
        this.currentLane  = 1;

        // Coin-collect sound via native HTML5 Audio (Phaser Web Audio rejects .mpeg)
        // Native Audio handles .mpeg perfectly in all modern browsers.
        try {
            if (this.coinSound) {
                this.coinSound.pause();
                this.coinSound = null;
            }
            this.coinSound = new Audio('/assets/audio/Money_Follows.mpeg');
            this.coinSound.volume = 0.6;
            this.coinSound.preload = 'auto';
        } catch (e) {
            this.coinSound = null;
        }

        // Shivji-collect sound via native HTML5 Audio
        try {
            if (this.shivjiSound) {
                this.shivjiSound.pause();
                this.shivjiSound = null;
            }
            this.shivjiSound = new Audio('/assets/audio/Gotteshwarya.mpeg');
            this.shivjiSound.volume = 0.7;
            this.shivjiSound.preload = 'auto';
        } catch (e) {
            this.shivjiSound = null;
        }

        // Modi-collision sound via native HTML5 Audio
        try {
            if (this.modiSound) {
                this.modiSound.pause();
                this.modiSound = null;
            }
            this.modiSound = new Audio('/assets/audio/Modi.mpeg');
            this.modiSound.volume = 0.7;
            this.modiSound.preload = 'auto';
        } catch (e) {
            this.modiSound = null;
        }

        // Background
        this.add.image(width / 2, height / 2, 'background')
            .setDisplaySize(width, height).setDepth(-10);

        // Road markings graphics layer
        this.graphics = this.add.graphics().setDepth(0);

        // Seed lane markings
        for (let z = this.zMin; z < this.zMax; z += this.markingSpacing) {
            this.markings.push(z);
        }

        // Pre-compute screen X for each of Ravi's 3 lanes
        const lc = this.laneCenters;
        const pz = this.playerZ;
        this.laneScreenX   = [
            this.getScreenCoords(lc[0], pz).x,
            this.getScreenCoords(lc[1], pz).x,
            this.getScreenCoords(lc[2], pz).x
        ];
        this.playerScreenY = this.getScreenCoords(lc[1], pz).y;

        // ── Ravi (single sprite, never recreated) ────────────────────────────
        this.ravi = this.physics.add.image(
            this.laneScreenX[1], this.playerScreenY, 'ravi'
        );
        this.ravi.setOrigin(0.5, 1);
        this.ravi.setDepth(100 - pz);
        this.ravi.displayWidth = 160;
        this.ravi.scaleY       = this.ravi.scaleX;
        this.ravi.body.updateFromGameObject();

        // ── Keyboard controls (registered once) ──────────────────────────────
        this.input.keyboard.on('keydown-LEFT', () => {
            if (this.isGameOver || this.isPaused) return;
            if (this.currentLane > 0) {
                this.currentLane--;
                this._moveRavi();
            }
        });
        this.input.keyboard.on('keydown-RIGHT', () => {
            if (this.isGameOver || this.isPaused) return;
            if (this.currentLane < 2) {
                this.currentLane++;
                this._moveRavi();
            }
        });

        // ── Touch / Swipe controls (mobile responsive) ────────────────────────
        this.swipeStartX = 0;
        this.swipeStartY = 0;
        this.isSwiping = false;

        this.input.on('pointerdown', (pointer) => {
            this.swipeStartX = pointer.x;
            this.swipeStartY = pointer.y;
            this.isSwiping = true;
        });

        this.input.on('pointerup', (pointer) => {
            if (!this.isSwiping) return;
            this.isSwiping = false;

            if (this.isGameOver || this.isPaused) {
                this.swipeStartX = 0;
                this.swipeStartY = 0;
                return;
            }

            const swipeEndX = pointer.x;
            const swipeEndY = pointer.y;

            const horizontalDistance = swipeEndX - this.swipeStartX;
            const verticalDistance = swipeEndY - this.swipeStartY;

            const absX = Math.abs(horizontalDistance);
            const absY = Math.abs(verticalDistance);

            // Only trigger a lane change when abs(horizontalDistance) >= 50 and abs(horizontalDistance) > abs(verticalDistance)
            if (absX >= 50 && absX > absY) {
                if (horizontalDistance < 0) {
                    // Swipe LEFT -> move one lane left
                    if (this.currentLane > 0) {
                        this.currentLane--;
                        this._moveRavi();
                    }
                } else if (horizontalDistance > 0) {
                    // Swipe RIGHT -> move one lane right
                    if (this.currentLane < 2) {
                        this.currentLane++;
                        this._moveRavi();
                    }
                }
            }

            // Reset the swipe state after every gesture
            this.swipeStartX = 0;
            this.swipeStartY = 0;
        });

        this.input.on('pointercancel', () => {
            this.isSwiping = false;
            this.swipeStartX = 0;
            this.swipeStartY = 0;
        });

        this._refillLaneQueue();
        this._queueCoin();

        // ── Modi system ───────────────────────────────────────────────────────
        this._refillModiLaneQueue();
        this._queueModi();

        // ── Shivji special collectible system ─────────────────────────────────
        this.activeShivji    = null;
        this.shivjiLaneQueue = [];
        this._refillShivjiLaneQueue();
        this._queueShivji();

        // ── HUD ───────────────────────────────────────────────────────────────
        this._createHUD();
    }

    // ── Smooth lane tween for Ravi ────────────────────────────────────────────
    _moveRavi() {
        if (this.raviMoveTween) this.raviMoveTween.stop();
        this.raviMoveTween = this.tweens.add({
            targets:  this.ravi,
            x:        this.laneScreenX[this.currentLane],
            duration: 180,
            ease:     'Sine.easeOut'
        });
    }

    // ── Coin lane queue ───────────────────────────────────────────────────────
    _refillLaneQueue() {
        const arr = [0, 1, 2];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        if (arr[0] === this.lastUsedLane && arr.length > 1) {
            [arr[0], arr[1]] = [arr[1], arr[0]];
        }
        this.laneQueue = arr;
    }

    _queueCoin() {
        if (this.isGameOver) return;
        if (this.activeCoin) return;
        const delay = Phaser.Math.Between(1000, 1300);
        this.time.delayedCall(delay, this._spawnCoin, [], this);
    }

    _spawnCoin() {
        if (this.isGameOver) return;
        if (this.activeCoin) return;

        if (this.laneQueue.length === 0) this._refillLaneQueue();
        const lane = this.laneQueue.shift();
        this.lastUsedLane = lane;

        const startZ = 80;
        const pos    = this.getScreenCoords(this.laneCenters[lane], startZ);

        const coin = this.add.image(pos.x, pos.y, 'coin');
        coin.setOrigin(0.5, 0.5);
        coin.displayWidth = 18;
        coin.scaleY       = coin.scaleX;
        coin.setDepth(100 - startZ);
        coin.setAlpha(1);
        coin._lane      = lane;
        coin._z         = startZ;
        coin._collected = false;

        this.activeCoin = coin;
    }

    _collectCoin() {
        const coin = this.activeCoin;
        if (!coin || coin._collected) return;
        coin._collected = true;
        this.activeCoin = null;

        this.score += 10;
        this.scoreText.setText(this.score.toString());

        // Play Money_Follows via native Audio — restart from beginning if already playing
        if (this.coinSound) {
            try {
                this.coinSound.currentTime = 0;
                this.coinSound.play().catch(() => {}); // .catch() silences autoplay policy errors
            } catch (e) {}
        }

        this.tweens.add({
            targets:  coin,
            scaleX:   coin.scaleX * 1.6,
            scaleY:   coin.scaleY * 1.6,
            alpha:    0,
            y:        coin.y - 70,
            duration: 280,
            ease:     'Power2',
            onComplete: () => {
                coin.destroy();
                this._queueCoin();
            }
        });
    }

    _missCoin() {
        const coin = this.activeCoin;
        if (!coin) return;
        this.activeCoin = null;
        coin.destroy();
        this._queueCoin();
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODI OBSTACLE SYSTEM
    // ════════════════════════════════════════════════════════════════════════

    _refillModiLaneQueue() {
        const arr = [0, 1, 2];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        if (arr[0] === this.lastModiLane && arr.length > 1) {
            [arr[0], arr[1]] = [arr[1], arr[0]];
        }
        this.modiLaneQueue = arr;
    }

    _queueModi() {
        if (this.isGameOver) return;
        if (this.activeModi) return;
        const delay = Phaser.Math.Between(4000, 6000);
        this.time.delayedCall(delay, this._spawnModi, [], this);
    }

    _spawnModi() {
        if (this.isGameOver) return;
        if (this.activeModi) return;

        if (this.modiLaneQueue.length === 0) this._refillModiLaneQueue();
        const lane = this.modiLaneQueue.shift();
        this.lastModiLane = lane;

        const startZ = 80;
        const pos    = this.getScreenCoords(this.laneCenters[lane], startZ);

        const modi = this.add.image(pos.x, pos.y, 'modi');
        modi.setOrigin(0.5, 1);
        modi.displayWidth = 20;
        modi.scaleY       = modi.scaleX;
        modi.setDepth(100 - startZ);
        modi.setAlpha(1);
        modi._lane = lane;
        modi._z    = startZ;

        this.activeModi = modi;
    }

    _removeModi() {
        const modi = this.activeModi;
        if (!modi) return;
        this.activeModi = null;
        modi.destroy();
        this._queueModi();
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHIVJI SPECIAL COLLECTIBLE SYSTEM
    // ════════════════════════════════════════════════════════════════════════

    _refillShivjiLaneQueue() {
        const arr = [0, 1, 2];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        if (arr[0] === this.lastShivjiLane && arr.length > 1) {
            [arr[0], arr[1]] = [arr[1], arr[0]];
        }
        this.shivjiLaneQueue = arr;
    }

    // Spawn Shivji every 8–12 s. Never double-queue.
    _queueShivji() {
        if (this.isGameOver)   return;
        if (this.activeShivji) return;
        const delay = Phaser.Math.Between(8000, 12000);
        this.time.delayedCall(delay, this._spawnShivji, [], this);
    }

    _spawnShivji() {
        if (this.isGameOver)   return;
        if (this.activeShivji) return;

        // Pop next lane from Shivji's own shuffled queue
        if (this.shivjiLaneQueue.length === 0) this._refillShivjiLaneQueue();
        const lane = this.shivjiLaneQueue.shift();
        this.lastShivjiLane = lane;

        const startZ = 80; // far horizon
        const pos    = this.getScreenCoords(this.laneCenters[lane], startZ);

        // Create sprite immediately at horizon position — NEVER at (0,0)
        const shivji = this.add.image(pos.x, pos.y, 'shivji');
        shivji.setOrigin(0.5, 1);           // anchor at feet
        shivji.displayWidth = 18;           // tiny at horizon
        shivji.scaleY       = shivji.scaleX;
        shivji.setDepth(100 - startZ);
        shivji.setAlpha(1);
        shivji._lane = lane;
        shivji._z    = startZ;

        this.activeShivji = shivji;
    }

    // Called from update() when Ravi reaches Shivji in the same lane
    _collectShivji() {
        const shivji = this.activeShivji;
        if (!shivji) return;
        this.activeShivji = null;

        // +20 reward — updates the same HUD coin counter used by coins
        this.score += 20;
        this.scoreText.setText(this.score.toString());

        // Play Gotteshwarya audio — restart from beginning if already playing
        if (this.shivjiSound) {
            try {
                this.shivjiSound.currentTime = 0;
                this.shivjiSound.play().catch(() => {});
            } catch (e) {}
        }

        // Pop-and-fade the Shivji sprite
        this.tweens.add({
            targets:  shivji,
            scaleX:   shivji.scaleX * 2.0,
            scaleY:   shivji.scaleY * 2.0,
            alpha:    0,
            duration: 400,
            ease:     'Power2',
            onComplete: () => {
                shivji.destroy();
                this._queueShivji();
            }
        });

        // Trigger the visual + text celebration
        this._showGoteshwaryaEffect();
    }

    // Called from update() when Shivji passes the player uncollected
    _missShivji() {
        const shivji = this.activeShivji;
        if (!shivji) return;
        this.activeShivji = null;
        shivji.destroy();
        this._queueShivji();
    }

    // ── GOTESHWARYA MODE visual effect ────────────────────────────────────────
    _showGoteshwaryaEffect() {
        const { width, height } = this.scale;
        const cx = width  / 2;
        const effectDepth = 300;

        // 1. Brief blue screen flash
        const flash = this.add.graphics();
        flash.fillStyle(0x4488ff, 0.35);
        flash.fillRect(0, 0, width, height);
        flash.setDepth(effectDepth);
        flash.setScrollFactor(0);
        this.tweens.add({
            targets:  flash,
            alpha:    0,
            duration: 500,
            ease:     'Power2',
            onComplete: () => flash.destroy()
        });

        // 2. Blue burst ring around Ravi
        const ring = this.add.graphics();
        ring.lineStyle(6, 0x66aaff, 1);
        ring.strokeCircle(this.ravi.x, this.ravi.y - 60, 10);
        ring.setDepth(effectDepth + 1);
        this.tweens.add({
            targets:  ring,
            scaleX:   8,
            scaleY:   8,
            alpha:    0,
            duration: 700,
            ease:     'Power2',
            onComplete: () => ring.destroy()
        });

        // 3. Sparkle stars — 6 small circles flying outward
        for (let i = 0; i < 6; i++) {
            const angle  = (i / 6) * Math.PI * 2;
            const star   = this.add.graphics();
            star.fillStyle(0xaaddff, 1);
            star.fillCircle(0, 0, 6);
            star.setPosition(this.ravi.x, this.ravi.y - 60);
            star.setDepth(effectDepth + 2);
            this.tweens.add({
                targets:  star,
                x:        this.ravi.x + Math.cos(angle) * 90,
                y:        (this.ravi.y - 60) + Math.sin(angle) * 90,
                alpha:    0,
                scaleX:   0,
                scaleY:   0,
                duration: 800,
                ease:     'Power2',
                onComplete: () => star.destroy()
            });
        }

        // 4. GOTESHWARYA MODE! text — bold pop-in then fade
        const txt = this.add.text(cx, height * 0.22, '✨ GOTESHWARYA MODE! ✨', {
            fontSize:        '28px',
            fontStyle:       'bold',
            color:           '#aaddff',
            stroke:          '#000033',
            strokeThickness: 5,
            shadow: { offsetX: 0, offsetY: 0, color: '#66ccff', blur: 16, fill: true }
        }).setOrigin(0.5, 0.5)
          .setDepth(effectDepth + 3)
          .setScrollFactor(0)
          .setScale(0.1)
          .setAlpha(0);

        // Pop in
        this.tweens.add({
            targets:  txt,
            scaleX:   1.1,
            scaleY:   1.1,
            alpha:    1,
            duration: 250,
            ease:     'Back.easeOut',
            onComplete: () => {
                // Settle
                this.tweens.add({
                    targets:  txt,
                    scaleX:   1.0,
                    scaleY:   1.0,
                    duration: 150,
                    onComplete: () => {
                        // Hold then fade out
                        this.time.delayedCall(900, () => {
                            this.tweens.add({
                                targets:  txt,
                                alpha:    0,
                                y:        txt.y - 30,
                                duration: 500,
                                ease:     'Power2',
                                onComplete: () => txt.destroy()
                            });
                        });
                    }
                });
            }
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // LIVES / COLLISION SYSTEM
    // ════════════════════════════════════════════════════════════════════════

    _hitByModi() {
        // Invincibility cooldown – only one damage event per 900ms
        if (this.isInvincible) return;
        this.isInvincible = true;

        // Remove exactly 1 life
        this.lives--;
        this._updateHearts();

        // Play Modi collision audio — fires inside invincibility gate so it
        // can NEVER repeat during the cooldown window (same guard as lives--).
        if (this.modiSound) {
            try {
                this.modiSound.currentTime = 0;
                this.modiSound.play().catch(() => {});
            } catch (e) {}
        }

        // Remove the Modi that hit Ravi
        const modi = this.activeModi;
        this.activeModi = null;
        if (modi) modi.destroy();

        if (this.lives <= 0) {
            // ── Game Over ────────────────────────────────────────────────────
            this._triggerGameOver();
        } else {
            // ── Damage flash + cooldown ───────────────────────────────────────
            this.tweens.add({
                targets:   this.ravi,
                alpha:     0.15,
                duration:  80,
                yoyo:      true,
                repeat:    4,          // flashes ~5 times over ~700 ms
                ease:      'Linear',
                onComplete: () => {
                    this.ravi.setAlpha(1);
                    this.isInvincible = false; // cooldown ends
                    this._queueModi();         // restart Modi cycle
                }
            });
        }
    }

    _updateHearts() {
        // Show only `this.lives` hearts; hide the rest
        for (let i = 0; i < this.heartSprites.length; i++) {
            this.heartSprites[i].setVisible(i < this.lives);
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // GAME OVER
    // ════════════════════════════════════════════════════════════════════════

    _triggerGameOver() {
        this.isGameOver = true;
        this.isInvincible = true;

        // Stop any active tween on Ravi
        if (this.raviMoveTween) {
            this.raviMoveTween.stop();
            this.raviMoveTween = null;
        }

        // Destroy active coin immediately
        if (this.activeCoin) {
            this.activeCoin.destroy();
            this.activeCoin = null;
        }

        // Destroy active Modi immediately
        if (this.activeModi) {
            this.activeModi.destroy();
            this.activeModi = null;
        }

        // Short delay before popup so the final flash finishes
        this.time.delayedCall(400, this._showGameOverPopup, [], this);
    }

    _showGameOverPopup() {
        const { width, height } = this.scale;
        const cx = width  / 2;
        const cy = height / 2;
        const popupDepth = 500;

        // ── Dark semi-transparent overlay ─────────────────────────────────────
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.72);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(popupDepth);
        overlay.setScrollFactor(0);

        // ── Popup card ────────────────────────────────────────────────────────
        const cardW = 320, cardH = 380;
        const cardX = cx - cardW / 2;
        const cardY = cy - cardH / 2;

        const card = this.add.graphics();
        card.fillStyle(0x1a1a2e, 1);
        card.fillRoundedRect(cardX, cardY, cardW, cardH, 24);
        card.lineStyle(3, 0xe94560, 1);
        card.strokeRoundedRect(cardX, cardY, cardW, cardH, 24);
        card.setDepth(popupDepth + 1);
        card.setScrollFactor(0);

        // ── GAME OVER title ───────────────────────────────────────────────────
        this.add.text(cx, cardY + 55, 'GAME OVER', {
            fontSize:        '38px',
            fontStyle:       'bold',
            color:           '#e94560',
            stroke:          '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5, 0.5).setDepth(popupDepth + 2).setScrollFactor(0);

        // ── Divider line ──────────────────────────────────────────────────────
        const div = this.add.graphics();
        div.lineStyle(2, 0xe94560, 0.5);
        div.lineBetween(cardX + 30, cardY + 90, cardX + cardW - 30, cardY + 90);
        div.setDepth(popupDepth + 2).setScrollFactor(0);

        // ── Score label ───────────────────────────────────────────────────────
        this.add.text(cx, cardY + 135, 'FINAL SCORE', {
            fontSize: '18px', color: '#aaaacc', fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setDepth(popupDepth + 2).setScrollFactor(0);

        this.add.text(cx, cardY + 190, this.score.toString(), {
            fontSize:        '56px',
            fontStyle:       'bold',
            color:           '#ffffff',
            stroke:          '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0.5).setDepth(popupDepth + 2).setScrollFactor(0);

        // ── RESTART button ────────────────────────────────────────────────────
        this._makeButton(cx, cardY + 275, 220, 52, 'RESTART', 0x16213e, 0x0f3460,
            popupDepth + 3, () => {
                this.scene.restart();
            });

        // ── MAIN MENU button ──────────────────────────────────────────────────
        this._makeButton(cx, cardY + 340, 220, 44, 'MAIN MENU', 0x0d0d0d, 0x333355,
            popupDepth + 3, () => {
                this.scene.start('MainMenuScene');
            });
    }

    // Helper: draws a rounded rectangle button with centred label + pointer events
    _makeButton(cx, cy, w, h, label, fillColor, hoverColor, depth, callback) {
        const bx = cx - w / 2;
        const by = cy - h / 2;

        const bg = this.add.graphics();
        bg.fillStyle(fillColor, 1);
        bg.fillRoundedRect(bx, by, w, h, h / 2);
        bg.lineStyle(2, 0xffffff, 0.3);
        bg.strokeRoundedRect(bx, by, w, h, h / 2);
        bg.setDepth(depth).setScrollFactor(0);

        const txt = this.add.text(cx, cy, label, {
            fontSize: '20px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5, 0.5).setDepth(depth + 1).setScrollFactor(0);

        // Invisible hit zone for interaction
        const zone = this.add.zone(cx, cy, w, h)
            .setInteractive({ useHandCursor: true })
            .setDepth(depth + 2).setScrollFactor(0);

        zone.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(hoverColor, 1);
            bg.fillRoundedRect(bx, by, w, h, h / 2);
            bg.lineStyle(2, 0xffffff, 0.5);
            bg.strokeRoundedRect(bx, by, w, h, h / 2);
            txt.setScale(1.05);
        });
        zone.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(fillColor, 1);
            bg.fillRoundedRect(bx, by, w, h, h / 2);
            bg.lineStyle(2, 0xffffff, 0.3);
            bg.strokeRoundedRect(bx, by, w, h, h / 2);
            txt.setScale(1);
        });
        zone.on('pointerdown', () => {
            txt.setScale(0.95);
        });
        zone.on('pointerup', () => {
            txt.setScale(1);
            callback();
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // PAUSE SYSTEM
    // ════════════════════════════════════════════════════════════════════════

    _togglePause() {
        if (this.isPaused) {
            this._resumeGame();
        } else {
            this._pauseGame();
        }
    }

    _pauseGame() {
        if (this.isPaused || this.isGameOver) return;
        this.isPaused = true;

        // Freeze all Phaser tweens and time events
        this.tweens.pauseAll();
        this.time.paused = true;

        this._showPausePopup();
    }

    _resumeGame() {
        if (!this.isPaused) return;

        // Destroy every pause-popup object
        if (this.pauseOverlayGroup) {
            this.pauseOverlayGroup.forEach(obj => {
                if (obj && obj.destroy) obj.destroy();
            });
            this.pauseOverlayGroup = null;
        }

        // Unfreeze Phaser tweens and time events
        this.time.paused = false;
        this.tweens.resumeAll();

        this.isPaused = false;
    }

    _showPausePopup() {
        const { width, height } = this.scale;
        const cx = width  / 2;
        const cy = height / 2;
        const popupDepth = 500;
        this.pauseOverlayGroup = [];

        // ── Dark semi-transparent overlay ─────────────────────────────────────
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.65);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(popupDepth).setScrollFactor(0);
        this.pauseOverlayGroup.push(overlay);

        // ── Popup card ────────────────────────────────────────────────────────
        const cardW = 300, cardH = 320;
        const cardX = cx - cardW / 2;
        const cardY = cy - cardH / 2;

        const card = this.add.graphics();
        card.fillStyle(0x1a1a2e, 1);
        card.fillRoundedRect(cardX, cardY, cardW, cardH, 22);
        card.lineStyle(3, 0x4488ff, 1);
        card.strokeRoundedRect(cardX, cardY, cardW, cardH, 22);
        card.setDepth(popupDepth + 1).setScrollFactor(0);
        this.pauseOverlayGroup.push(card);

        // ── PAUSED title ──────────────────────────────────────────────────────
        const title = this.add.text(cx, cardY + 60, 'PAUSED', {
            fontSize:        '40px',
            fontStyle:       'bold',
            color:           '#4488ff',
            stroke:          '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5, 0.5).setDepth(popupDepth + 2).setScrollFactor(0);
        this.pauseOverlayGroup.push(title);

        // ── Divider ───────────────────────────────────────────────────────────
        const div = this.add.graphics();
        div.lineStyle(2, 0x4488ff, 0.4);
        div.lineBetween(cardX + 30, cardY + 95, cardX + cardW - 30, cardY + 95);
        div.setDepth(popupDepth + 2).setScrollFactor(0);
        this.pauseOverlayGroup.push(div);

        // ── RESUME button ─────────────────────────────────────────────────────
        this._makePauseButton(
            cx, cardY + 180, 220, 54, 'RESUME', 0x0f3460, 0x1a5a9a,
            popupDepth + 3,
            () => this._resumeGame()
        );

        // ── RESTART button ────────────────────────────────────────────────────
        this._makePauseButton(
            cx, cardY + 252, 220, 46, 'RESTART', 0x16213e, 0x333355,
            popupDepth + 3,
            () => {
                this.isPaused = false;        // clear flag before restart
                this.time.paused = false;     // unfreeze timers
                this.tweens.resumeAll();      // unfreeze tweens
                this.scene.restart();
            }
        );
    }

    // Like _makeButton but also tracks objects in pauseOverlayGroup for cleanup
    _makePauseButton(cx, cy, w, h, label, fillColor, hoverColor, depth, callback) {
        const bx = cx - w / 2;
        const by = cy - h / 2;

        const bg = this.add.graphics();
        bg.fillStyle(fillColor, 1);
        bg.fillRoundedRect(bx, by, w, h, h / 2);
        bg.lineStyle(2, 0xffffff, 0.25);
        bg.strokeRoundedRect(bx, by, w, h, h / 2);
        bg.setDepth(depth).setScrollFactor(0);
        this.pauseOverlayGroup.push(bg);

        const txt = this.add.text(cx, cy, label, {
            fontSize: '22px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5, 0.5).setDepth(depth + 1).setScrollFactor(0);
        this.pauseOverlayGroup.push(txt);

        const zone = this.add.zone(cx, cy, w, h)
            .setInteractive({ useHandCursor: true })
            .setDepth(depth + 2).setScrollFactor(0);
        this.pauseOverlayGroup.push(zone);

        zone.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(hoverColor, 1);
            bg.fillRoundedRect(bx, by, w, h, h / 2);
            bg.lineStyle(2, 0xffffff, 0.4);
            bg.strokeRoundedRect(bx, by, w, h, h / 2);
            txt.setScale(1.05);
        });
        zone.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(fillColor, 1);
            bg.fillRoundedRect(bx, by, w, h, h / 2);
            bg.lineStyle(2, 0xffffff, 0.25);
            bg.strokeRoundedRect(bx, by, w, h, h / 2);
            txt.setScale(1);
        });
        zone.on('pointerdown', () => txt.setScale(0.95));
        zone.on('pointerup',   () => { txt.setScale(1); callback(); });
    }

    // ════════════════════════════════════════════════════════════════════════
    // HUD
    // ════════════════════════════════════════════════════════════════════════

    _createHUD() {
        const { width } = this.scale;
        const hudY  = 50;
        const depth = 200;

        // Score panel (top-left)
        const lp = this.add.graphics();
        lp.fillStyle(0x000000, 0.6);
        lp.fillRoundedRect(15, hudY - 23, 150, 46, 23);
        lp.setScrollFactor(0).setDepth(depth);

        this.add.image(40, hudY, 'coin')
            .setDisplaySize(40, 40).setScrollFactor(0).setDepth(depth);

        this.scoreText = this.add.text(70, hudY, '0', {
            fontSize: '30px', color: '#ffffff',
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth);

        // Pause button (top-center) — wired to toggle pause
        const pb  = this.add.image(width / 2, hudY, 'pause')
            .setDisplaySize(46, 46).setInteractive({ useHandCursor: true })
            .setScrollFactor(0).setDepth(depth);
        const bsx = pb.scaleX, bsy = pb.scaleY;
        pb.on('pointerover',  () => pb.setScale(bsx * 1.1, bsy * 1.1));
        pb.on('pointerout',   () => pb.setScale(bsx, bsy));
        pb.on('pointerdown',  () => pb.setScale(bsx * 0.9, bsy * 0.9));
        pb.on('pointerup',    () => {
            pb.setScale(bsx * 1.1, bsy * 1.1);
            if (!this.isGameOver) this._togglePause();
        });

        // Hearts panel (top-right)
        const hpW = 140, hpX = width - hpW - 15;
        const rp  = this.add.graphics();
        rp.fillStyle(0x000000, 0.6);
        rp.fillRoundedRect(hpX, hudY - 23, hpW, 46, 23);
        rp.setScrollFactor(0).setDepth(depth);

        // Store heart sprites so we can show/hide them on damage
        this.heartSprites = [];
        for (let i = 0; i < 3; i++) {
            const h = this.add.image(hpX + 30 + i * 40, hudY, 'heart')
                .setDisplaySize(32, 32).setScrollFactor(0).setDepth(depth);
            this.heartSprites.push(h);
        }
    }

    // ── update ────────────────────────────────────────────────────────────────
    update(time, delta) {
        // Clamp delta: prevents tab-switch teleports
        if (delta > 50) delta = 16.6;

        // ── If game is over, freeze everything ────────────────────────────────
        if (this.isGameOver) return;

        // ── If manually paused, freeze everything ─────────────────────────────
        if (this.isPaused) return;

        this.graphics.clear();

        const moveAmt     = this.ROAD_SCROLL_SPEED * (delta / 16.6);
        const coinMoveAmt = this.COIN_SPEED         * (delta / 16.6);

        // ── 1. Road lane markings ─────────────────────────────────────────────
        for (let i = 0; i < this.markings.length; i++) {
            this.markings[i] -= moveAmt;
            if (this.markings[i] < this.zMin) {
                this.markings[i] += (this.zMax - this.zMin);
            }

            const zS = this.markings[i];
            const zE = zS + this.markingLength;
            if (zE > this.zMax) continue;

            const alpha = Phaser.Math.Clamp((this.zMax - zS) / (this.zMax - 20), 0, 1);
            this.graphics.fillStyle(0xffffff, alpha);

            this.laneDividers.forEach(x => {
                const hw = 4;
                const p1 = this.getScreenCoords(x - hw, zS);
                const p2 = this.getScreenCoords(x + hw, zS);
                const p3 = this.getScreenCoords(x + hw, zE);
                const p4 = this.getScreenCoords(x - hw, zE);
                this.graphics.beginPath();
                this.graphics.moveTo(p1.x, p1.y);
                this.graphics.lineTo(p2.x, p2.y);
                this.graphics.lineTo(p3.x, p3.y);
                this.graphics.lineTo(p4.x, p4.y);
                this.graphics.closePath();
                this.graphics.fillPath();
            });
        }

        // ── 2. Ravi physics body sync ─────────────────────────────────────────
        this.ravi.body.updateFromGameObject();

        // ── 3. Coin movement & collection ─────────────────────────────────────
        const coin = this.activeCoin;
        if (coin && !coin._collected) {
            coin._z -= coinMoveAmt;

            if (coin._lane === this.currentLane && coin._z <= this.playerZ + 1.0) {
                this._collectCoin();
            } else if (coin._z < this.zMin) {
                this._missCoin();
            } else {
                const c = this.getScreenCoords(this.laneCenters[coin._lane], coin._z);
                coin.setPosition(c.x, c.y - 40 * c.scale);
                coin.setDepth(100 - coin._z);
                coin.rotation += 0.05 * (delta / 16.6);

                let t = Phaser.Math.Clamp((80 - coin._z) / (80 - 1.6), 0, 1);
                coin.displayWidth = Phaser.Math.Linear(18, 120, t);
                coin.scaleY       = coin.scaleX;
            }
        }

        // ── 4. Modi obstacle movement & collision ─────────────────────────────
        const modi = this.activeModi;
        if (modi) {
            const modiMoveAmt = this.MODI_SPEED * (delta / 16.6);
            modi._z -= modiMoveAmt;

            if (modi._z < this.zMin) {
                // Modi passed player without collision
                this._removeModi();
            } else {
                const m = this.getScreenCoords(this.laneCenters[modi._lane], modi._z);
                modi.setPosition(m.x, m.y);
                modi.setDepth(100 - modi._z);

                const targetW = Phaser.Math.Linear(20, 160,
                    Phaser.Math.Clamp((80 - modi._z) / (80 - 1.6), 0, 1));
                modi.displayWidth = targetW;
                modi.scaleY       = modi.scaleX;

                // ── COLLISION: same lane AND Modi reached Ravi's depth ────────
                // Only fires if Ravi is not currently invincible (cooldown)
                if (!this.isInvincible &&
                    modi._lane === this.currentLane &&
                    modi._z   <= this.playerZ + 2.0) {
                    this._hitByModi();
                }
            }
        }

        // ── 5. Shivji special collectible movement & collection ───────────────
        const shivji = this.activeShivji;
        if (shivji) {
            const shivjiMoveAmt = this.SHIVJI_SPEED * (delta / 16.6);
            shivji._z -= shivjiMoveAmt;

            // COLLECT: same lane AND Shivji reached Ravi's depth
            if (shivji._lane === this.currentLane && shivji._z <= this.playerZ + 1.5) {
                this._collectShivji();
            } else if (shivji._z < this.zMin) {
                // MISS: Shivji passed player without collection
                this._missShivji();
            } else {
                // Project Shivji along its fixed lane through perspective
                const s = this.getScreenCoords(this.laneCenters[shivji._lane], shivji._z);

                // Anchor at feet — same as Ravi/Modi
                shivji.setPosition(s.x, s.y);

                // Depth sort
                shivji.setDepth(100 - shivji._z);

                // Perspective scale: 18px tiny at horizon → 140px near player (120–150px range)
                let t = Phaser.Math.Clamp((80 - shivji._z) / (80 - 1.6), 0, 1);
                shivji.displayWidth = Phaser.Math.Linear(18, 140, t);
                shivji.scaleY       = shivji.scaleX; // preserve aspect ratio
            }
        }
    }
}

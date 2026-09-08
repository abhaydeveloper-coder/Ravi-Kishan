# RAVI KISHAN MEME RUN - Project Specification

## 1. Project Overview
"RAVI KISHAN MEME RUN" is a completely frontend-only browser-based 2D/2.5D endless runner game developed as a college IT project. It features a portrait/mobile-game layout (9:16 aspect ratio) built with HTML, CSS, Vanilla JavaScript, Phaser 3, and Vite. There is no backend, database, authentication, or use of external APIs. The game incorporates meme elements and Indian cultural references in a humorous, non-political arcade style.

## 2. Game Objective
The objective is to survive as long as possible, collect ₹ coins, achieve a high score, and avoid losing all 3 lives by dodging or striking the main obstacle (Modi Ji) while navigating a 3-lane road.

## 3. Core Gameplay Loop
- The player character (Ravi Kishan) continuously runs forward automatically.
- The environment scrolls towards the player to simulate forward movement.
- Obstacles (Modi Ji), Collectibles (₹ Coins), and Special Items (Shivji) spawn in the distance and move towards the player.
- The player changes lanes or performs a strike to interact with these entities.
- The game gradually increases in speed to ramp up difficulty.
- The loop ends when the player loses all 3 lives.

## 4. Game States
- **Boot/Load:** Loading assets (images, audio).
- **Main Menu:** Title screen with "Play" button, How To Play instructions.
- **Playing:** Active gameplay state.
- **Paused:** Game paused with a resume option.
- **Game Over:** Final score display, restart button, and return to main menu option.

## 5. Player Controls
- **Desktop:** Left/Right arrow keys (lane change), 'Z' or 'X' key (strike). *(Note: Jump is an optional future feature)*.
- **Mobile:** Swipe Left/Right (lane change), Tap (strike).

## 6. Player Character Specification
- **Character:** Ravi Kishan.
- **Visual Style:** Semi-realistic 3D cartoon/caricature visual style matching the reference image. Sprite must have a transparent background.
- **Position:** Fixed at the bottom/front of the screen. Separate sprite from the background.
- **Movement:** Snaps to 1 of exactly 3 lanes. 
- **Action:** Can perform a "strike" action to interact with specific entities.

## 7. Enemy Specification
- **Main Enemy:** Modi Ji.
- **Visual Style:** Semi-realistic 3D cartoon/caricature visual style with transparent background. Separate sprite.
- **Behavior:** Spawns randomly in one of the three lanes and moves towards the player.
- **Interaction (Collision):** Player loses 1 life, screen shakes/flashes (programmatic), collision sound plays, player gets brief invincibility.
- **Interaction (Strike):** If the player strikes the enemy, triggers funny impact effect, displays "BHARAT JHUKEGA NAHI!", plays sound, and gameplay continues without losing a life.

## 8. Coin Specification
- **Type:** ₹ Coin.
- **Visual Style:** Separate sprite with transparent background. Coin rotation should be done programmatically in Phaser.
- **Behavior:** Spawns in lanes.
- **Interaction:** Collecting increases the score/coin count. Plays a coin sound and creates a programmatic golden particle effect.
- **Special Event:** Occasional triggering of "MONEY FOLLOWS MY BROTHER" visual/audio meme cue.

## 9. Shivji Specification
- **Type:** Special Collectible.
- **Visual Style:** Separate sprite with transparent background.
- **Behavior:** Appears occasionally in the lanes.
- **Interaction:** Collecting it triggers a special visual/audio effect, displaying "GOTESHWARYA MODE!". It acts purely as a special visual collectible/effect (no invincibility or score multiplier).

## 10. Road/Environment Specification
- **Perspective:** 2.5D or pseudo-3D scrolling effect (portrait 9:16).
- **Lanes:** Exactly 3 distinct lanes.
- **Scenery:** Indian environment, trees, Indian flags on the sides, India Gate-like landmark in the distance.
- **Implementation:** Separate background and road assets that scroll to simulate forward movement, independently from the character and object sprites.

## 11. HUD Specification
- **Top-Left:** Current Score / Coin Count.
- **Top-Center:** Pause Button.
- **Top-Right:** Life count (exactly 3 hearts).

## 12. Life System
- Player starts with exactly 3 lives.
- Displayed as 3 heart icons in the HUD.
- Colliding with the main enemy (without striking) deducts 1 life.
- Game Over triggers when lives reach 0.

## 13. Collision System
- Simple Phaser Arcade Physics objects/groups.
- Checks overlaps between player and coins/enemies/Shivji.
- Handles invincibility frames (i-frames) after taking damage to prevent instant multi-hits.

## 14. Strike System
- A timed action triggered by the player.
- Has a short animation and a hitbox in front of the player.
- If it connects with Modi Ji, it nullifies the damage and triggers the "BHARAT JHUKEGA NAHI!" meme effect.

## 15. Score System
- **Passive:** Score increases gradually based on distance traveled / time survived.
- **Active:** Collecting ₹ coins adds a flat bonus to the score.

## 16. Difficulty Progression
- Game speed (scroll speed and spawn rate) increases gradually over time or based on score milestones.

## 17. Sound Requirements
- Background music (upbeat arcade track).
- Coin collection sound.
- Collision/damage sound.
- Strike impact sound.
- "GOTESHWARYA MODE!" activation sound.
- "MONEY FOLLOWS MY BROTHER" meme audio cue.
- UI clicks (buttons).
*(Note: Only placeholder or royalty-free sounds to be used initially).*

## 18. Visual/Asset Requirements
**Visual Style:** Semi-realistic 3D cartoon/caricature. All characters/objects must be separate sprites with transparent backgrounds, not pre-baked into the environment. Programmatic effects (glow, particles, screen shake, coin rotation) should be used wherever practical.

**Simplified Initial Asset Plan:**
- `ravi.png`
- `modi.png`
- `coin.png`
- `shivji.png`
- `heart.png`
- `pause.jpg`
- Road/background assets (scrolling layers)

## 19. Suggested Folder Structure
```text
/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js
│   ├── gameConfig.js
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── MenuScene.js
│   │   ├── GameScene.js
│   │   ├── PauseScene.js
│   │   └── GameOverScene.js
│   ├── objects/
│   │   ├── Player.js
│   │   ├── Enemy.js
│   │   └── Collectible.js
│   ├── systems/
│   │   └── ScoreManager.js
│   └── utils/
│       └── constants.js
└── public/
    ├── assets/
    │   ├── images/
    │   ├── audio/
    │   └── fonts/
    └── style.css
```

## 20. Phaser Architecture
- Use Phaser 3 Scene Manager to handle flow (Boot -> Menu -> Game -> GameOver).
- Use simple Phaser Arcade Physics objects and groups for entity management (no complex object pooling).
- Use Phaser Tweens and programmatic effects for animations (screen shake, programmatic coin rotation, glows, and particle emitters).
- Use Arcade Physics for simple collision/overlap detection.

## 21. Development Phases
- **Phase 1:** Project setup + Phaser + basic canvas.
- **Phase 2:** Three-lane road + scrolling movement.
- **Phase 3:** Ravi player + lane movement.
- **Phase 4:** ₹ coins + score.
- **Phase 5:** Modi obstacle + collision + exactly 3 lives.
- **Phase 6:** Shivji collectible.
- **Phase 7:** Strike mechanic + meme effects.
- **Phase 8:** Main menu + How To Play + Pause + Game Over.
- **Phase 9:** Sound + particles + animations + polish.
- **Phase 10:** Mobile controls + responsive layout + final testing.

## 22. Testing Checklist
- [ ] Game runs locally via `npm run dev`.
- [ ] Layout maintains 9:16 aspect ratio on desktop and mobile.
- [ ] Lane changes are snappy and stay within the 3 lanes.
- [ ] Strike mechanic successfully nullifies enemy collisions.
- [ ] Taking damage deducts exactly 1 life and gives i-frames.
- [ ] Game Over triggers correctly at 0 lives.
- [ ] Score increments properly.
- [ ] Visual effects (screen shake, particles, rotation) are functioning.

## 23. Future Improvements
- Jump mechanic to clear specific ground obstacles.
- Shivji mechanical effects (invincibility, score multiplier).
- Global Leaderboards.
- Progressive environment changes (day/night cycle).

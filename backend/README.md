# Python Game Logic Demonstration
# Ravi Kishan Meme Run

## ⚠️ Important Note
This `backend` folder is **NOT** the actual backend of the browser game. The browser game is completely self-contained using Phaser.js and Vite.

This is a **Python-based demonstration/prototype** of the game's logical systems. It was created specifically for **Industrial Training documentation and presentation purposes** to clearly explain the game's core logic in a simple, beginner-friendly programming language.

## 🕹️ How it Works

The files in this folder demonstrate the conceptual rules that govern the game:

- **Player Movement (`player.py`)**: Restricts the character to a 3-lane system (Left, Center, Right) and prevents moving out of bounds. It also handles the life tracking system.
- **Scoring (`score_manager.py` & `constants.py`)**: Manages the accumulation of points based on game constants. Collecting a ₹ Coin awards +10 points, while collecting the rare Shivji awards +20 points.
- **Collisions & Interactions (`collision.py`)**: Defines what happens when the player touches an entity. Hitting the Modi obstacle removes a life. However, if the player uses the Strike mechanic, they shout "BHARAT JHUKEGA NAHI!" and safely bypass the obstacle without losing a life.
- **Game Over Condition (`game_logic.py`)**: Tracks the player's life count. When lives drop to 0, the game loop ends, triggering the Game Over sequence and displaying the final score.

## 🚀 How to Run the Demo

To test the logic yourself, simply run the main demonstration script from your terminal:

```bash
python backend/game_logic.py
```

Follow the on-screen menu to move the player, collect items, interact with obstacles, and see how the internal game logic updates the player's state in real-time.

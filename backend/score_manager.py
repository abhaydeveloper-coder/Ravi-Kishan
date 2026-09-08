# score_manager.py
# This file contains the ScoreManager class to handle scoring rules.

from constants import COIN_SCORE, SHIVJI_SCORE

class ScoreManager:
    def __init__(self):
        # Start with a score of 0
        self.score = 0

    def add_coin(self, player):
        # Add coin score and update the player's score
        self.score += COIN_SCORE
        player.score = self.score
        print(f"Coin collected! +{COIN_SCORE}")
        print(f"Current Score: {self.score}")

    def add_shivji(self, player):
        # Add shivji score and update the player's score
        self.score += SHIVJI_SCORE
        player.score = self.score
        print(f"Shivji collected! +{SHIVJI_SCORE}")
        print(f"✨ GOTESHWARYA MODE! ✨")
        print(f"Current Score: {self.score}")

    def get_score(self):
        # Return the current score
        return self.score

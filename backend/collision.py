# collision.py
# This file demonstrates the game's interaction and collision logic conceptually.

def check_coin_collision(player, score_manager):
    # Conceptual logic for picking up a coin
    print(f"\n[EVENT] {player.name} touched a ₹ Coin!")
    score_manager.add_coin(player)

def check_shivji_collision(player, score_manager):
    # Conceptual logic for picking up Shivji
    print(f"\n[EVENT] {player.name} touched Shivji!")
    score_manager.add_shivji(player)

def check_modi_collision(player):
    # Conceptual logic for hitting Modi (Obstacle)
    print(f"\n[EVENT] {player.name} collided with Modi!")
    player.take_damage()

def check_strike_modi(player):
    # Conceptual logic for the strike mechanic
    print(f"\n[EVENT] {player.name} used Strike on Modi!")
    print("BHARAT JHUKEGA NAHI!")
    print("No lives were lost.")

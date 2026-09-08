# game_logic.py
# Main demonstration script for the game logic.

from player import Player
from score_manager import ScoreManager
from collision import (
    check_coin_collision,
    check_shivji_collision,
    check_modi_collision,
    check_strike_modi
)

def display_status(player, score_manager):
    # Show the current state of the player
    print("\n" + "="*40)
    print("       RAVI KISHAN MEME RUN")
    print("       GAME LOGIC DEMO")
    print("="*40)
    print(f"Player: {player.name}")
    print(f"Lives: {player.lives}")
    print(f"Score: {score_manager.get_score()}")
    print(f"Lane: {player.get_lane_name()}")
    print("="*40)

def main():
    # Initialize the player and score manager
    ravi = Player()
    score_mgr = ScoreManager()

    while ravi.is_alive():
        display_status(ravi, score_mgr)
        
        print("\nChoose an action:")
        print("1. Move Left")
        print("2. Move Right")
        print("3. Collect ₹ Coin")
        print("4. Collect Shivji")
        print("5. Hit Modi")
        print("6. Strike Modi")
        print("7. Show Player Status")
        print("8. Exit")

        choice = input("Enter your choice (1-8): ").strip()

        if choice == "1":
            ravi.move_left()
        elif choice == "2":
            ravi.move_right()
        elif choice == "3":
            check_coin_collision(ravi, score_mgr)
        elif choice == "4":
            check_shivji_collision(ravi, score_mgr)
        elif choice == "5":
            check_modi_collision(ravi)
        elif choice == "6":
            check_strike_modi(ravi)
        elif choice == "7":
            # Just loop back and display status
            pass
        elif choice == "8":
            print("\nExiting demonstration...")
            break
        else:
            print("\nInvalid choice. Please enter a number between 1 and 8.")

    if not ravi.is_alive():
        print("\n" + "="*40)
        print("             GAME OVER")
        print("="*40)
        print(f"Final Score: {score_mgr.get_score()}")
        print("Thank you for playing the Python logic demo!")

if __name__ == "__main__":
    main()

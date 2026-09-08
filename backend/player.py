# player.py
# This file contains the Player class representing Ravi Kishan.

from constants import LANE_LEFT, LANE_CENTER, LANE_RIGHT, STARTING_LIVES, PLAYER_NAME

class Player:
    def __init__(self):
        # Initial properties for Ravi Kishan
        self.name = PLAYER_NAME
        self.current_lane = LANE_CENTER
        self.lives = STARTING_LIVES
        self.score = 0

    def move_left(self):
        # Move left only if not already in the leftmost lane
        if self.current_lane > LANE_LEFT:
            self.current_lane -= 1
            print(f"{self.name} moved LEFT. Current Lane: {self.get_lane_name()}")
        else:
            print(f"{self.name} is already in the leftmost lane! Cannot move further left.")

    def move_right(self):
        # Move right only if not already in the rightmost lane
        if self.current_lane < LANE_RIGHT:
            self.current_lane += 1
            print(f"{self.name} moved RIGHT. Current Lane: {self.get_lane_name()}")
        else:
            print(f"{self.name} is already in the rightmost lane! Cannot move further right.")

    def take_damage(self):
        # Reduce lives by 1 when taking damage
        if self.lives > 0:
            self.lives -= 1
            print(f"Ouch! {self.name} lost a life! Remaining Lives: {self.lives}")

    def is_alive(self):
        # Player is alive if lives are greater than 0
        return self.lives > 0

    def get_lane_name(self):
        # Helper to get the human-readable name of the lane
        if self.current_lane == LANE_LEFT:
            return "LEFT"
        elif self.current_lane == LANE_CENTER:
            return "CENTER"
        elif self.current_lane == LANE_RIGHT:
            return "RIGHT"
        return "UNKNOWN"

import math
import random
import time
from dataclasses import dataclass


@dataclass
class Vector3:
    x: float
    y: float
    z: float

    def add(self, other):
        self.x += other.x
        self.y += other.y
        self.z += other.z

    def multiply_scalar(self, scalar):
        return Vector3(self.x * scalar, self.y * scalar, self.z * scalar)

    def length(self):
        return math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z)

    def clone(self):
        return Vector3(self.x, self.y, self.z)


class Ball:
    def __init__(self):
        # TODO: Replace these with your actual configuration values
        self.ARENA_WIDTH = 26.0  # Width of the arena
        self.ARENA_DEPTH = 40.0  # Depth of the arena
        self.PADDLE_WIDTH = 5.0  # Width of paddle
        self.PADDLE_HEIGHT = 1.0  # Height of paddle
        self.BALL_RADIUS = 0.3  # Radius of ball

        # Configuration for ball physics
        self.conf = {
            "speed": {
                "initialMin": 0.5,
                "initialMax": 0.6,
                "max": 1.5,
                "incrementFactor": 1.03,
                "deltaFactor": 30,
            }
        }

        # Ball state
        self.position = Vector3(0, 2.7, 0)
        self.velocity = self._random_initial_velocity()
        self.is_falling = False
        self.elapsed_time = 0
        self.bounces = 0
        self.last_collision = {"side": None, "time": 0}
        self.collision_cooldown = 0.1

    def _random_initial_velocity(self):
        """Generate random initial velocity similar to Three.js implementation"""
        while True:
            x = random.uniform(
                self.conf["speed"]["initialMin"], self.conf["speed"]["initialMax"]
            ) * random.choice([-1, 1])

            y = random.uniform(
                self.conf["speed"]["initialMin"], self.conf["speed"]["initialMax"]
            ) * random.choice([-1, 1])

            if abs(x) > 0.01 or abs(y) > 0.01:
                break

        self.bounces = 0
        initial_speed = math.sqrt(x * x + y * y)
        self.bounces_needed = math.log(
            self.conf["speed"]["max"] / initial_speed
        ) / math.log(self.conf["speed"]["incrementFactor"])

        return Vector3(x, 0, y)

    def check_paddle_collision(self, paddle_x, side):
        """Check collision with paddle using position-based detection"""
        # Determine paddle boundaries based on side

        if side == "left":
            paddle_z = -self.ARENA_DEPTH / 2
        else:  # right
            paddle_z = self.ARENA_DEPTH / 2

        # Check if ball is at paddle's z-position
        if (side == "left" and self.position.z <= paddle_z + self.BALL_RADIUS) or (
            side == "right" and self.position.z >= paddle_z - self.BALL_RADIUS
        ):

            # Check if ball is within paddle's vertical range
            if abs(self.position.x - paddle_x) <= (
                self.PADDLE_WIDTH / 2 + self.BALL_RADIUS
            ):

                return True
        return False

    def bounce(self, side, paddle_pos=None):
        """Handle bounce physics"""
        current_time = time.time()
        if (
            side == self.last_collision["side"]
            and current_time - self.last_collision["time"] < self.collision_cooldown
        ):
            return

        self.last_collision["side"] = side
        self.last_collision["time"] = current_time

        if side in ["left", "right"]:
            if paddle_pos is not None:
                # Calculate angle based on hit position
                relative_position = self.position.x - paddle_pos["x"]
                normalized_position = relative_position / (self.PADDLE_WIDTH / 2)
                max_angle = math.pi / 4  # 45 degrees
                new_angle = normalized_position * max_angle

                current_speed = self.velocity.length()
                y_direction = 1 if side == "left" else -1

                self.velocity.x = current_speed * math.sin(new_angle)
                self.velocity.z = y_direction * abs(current_speed * math.cos(new_angle))

                # Speed up ball after paddle hits
                self.bounces += 1
                if self.bounces < self.bounces_needed:
                    current_speed *= self.conf["speed"]["incrementFactor"]
                    self.velocity = self.velocity.multiply_scalar(
                        self.conf["speed"]["incrementFactor"]
                    )

        elif side in ["top", "bottom"]:
            self.velocity.x *= -1

    def update(self, delta_time):
        """Update ball position and handle falling state"""
        if self.is_falling:
            if self.position.y <= -1:
                self.velocity.y *= 0.7
                self.velocity.x *= 0.85
                self.velocity.z *= 0.85

            scaled_velocity = self.velocity.multiply_scalar(
                delta_time * self.conf["speed"]["deltaFactor"]
            )
            self.position.add(scaled_velocity)

            self.elapsed_time += delta_time
            if self.elapsed_time >= 1.5:
                self.reset()
                return "point_scored"
        else:
            scaled_velocity = self.velocity.multiply_scalar(
                delta_time * self.conf["speed"]["deltaFactor"]
            )
            self.position.add(scaled_velocity)

            # Check if ball is out of arena
            if (
                self.position.z < -self.ARENA_DEPTH / 2
                or self.position.z > self.ARENA_DEPTH / 2
            ):
                self.start_falling()

        return "continue"

    def start_falling(self):
        """Start falling state when ball goes out of bounds"""
        if not self.is_falling:
            self.elapsed_time = 0
            self.is_falling = True
            self.velocity = self.velocity.multiply_scalar(0.7)
            self.velocity.y = -0.2

    def reset(self):
        """Reset ball to initial state"""
        self.elapsed_time = 0
        self.is_falling = False
        self.position = Vector3(0, 2.7, 0)
        self.velocity = self._random_initial_velocity()

    def get_current_position(self):
        """Get current ball state for network transmission"""
        return {
            "x": float(self.position.x),
            "y": float(self.position.y),
            "z": float(self.position.z),
            "vel_x": float(self.velocity.x),
            "vel_y": float(self.velocity.y),
            "vel_z": float(self.velocity.z),
        }

class Paddle:
    def __init__(self, initial_x=0):
        self.x = initial_x
        # These values should match your game's configuration
        self.MOVE_SPEED = 30  # Matches your deltaFactor
        # TODO: Replace these values with your actual sizes
        self.ARENA_WIDTH = 24.0  # Set this to (arena_width - border_width * 2)
        self.PADDLE_WIDTH = 6.0  # Set this to paddle_width

    def move(self, direction, delta_time):
        """
        Update paddle position based on direction and delta time

        Args:
            direction (str): "up" or "down"
            delta_time (float): Time since last update in seconds
        """
        movement = self.MOVE_SPEED * delta_time

        if direction == "up":
            self.x += movement
        elif direction == "down":
            self.x -= movement

        self._clamp_position()
        # print(f"paddl: {self.x}")

        return self.x

    def _clamp_position(self):
        """Constrain paddle position within arena bounds"""
        if self.ARENA_WIDTH is None or self.PADDLE_WIDTH is None:
            print("Cannot clamp")
            return  # Skip clamping if dimensions aren't set

        half_arena_width = self.ARENA_WIDTH / 2
        half_paddle_width = self.PADDLE_WIDTH / 2

        self.x = max(
            -half_arena_width + half_paddle_width,
            min(half_arena_width - half_paddle_width, self.x),
        )

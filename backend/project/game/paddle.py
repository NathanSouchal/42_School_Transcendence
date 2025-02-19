class Paddle:
    def __init__(self, initial_x=0):
        self.x = initial_x
        self.MOVE_SPEED = 30
        self.ARENA_WIDTH = 24.0
        self.PADDLE_WIDTH = 6.0
        self.isResetting = False
        self.resetDirection = None

    def move(self, direction, delta_time):
        movement = self.MOVE_SPEED * delta_time

        if self.isResetting:
            return
        if direction == "up":
            self.x += movement
        elif direction == "down":
            self.x -= movement
        self._clamp_position()
        return self.x

    def _clamp_position(self):
        if self.ARENA_WIDTH is None or self.PADDLE_WIDTH is None:
            return

        half_arena_width = self.ARENA_WIDTH / 2
        half_paddle_width = self.PADDLE_WIDTH / 2

        self.x = max(
            -half_arena_width + half_paddle_width,
            min(half_arena_width - half_paddle_width, self.x),
        )

    def chooseResetDir(self):
        if self.x >= -0.1 and self.x <= 0.1:
            self.isResetting = False
            return
        self.isResetting = True
        self.resetDirection = "up" if self.x < 0 else "down"

    def reset(self, delta_time):
        if self.x >= -0.1 and self.x <= 0.1:
            self.isResetting = False
            return
        if (self.resetDirection == "up" and self.x >= 0.1) or (
            self.resetDirection == "down" and self.x <= -0.1
        ):
            self.isResetting = False
            self.resetDirection = None
            return

        movement = self.MOVE_SPEED * 2 * delta_time
        direction = self.resetDirection

        if direction == "up":
            self.x += movement
        elif direction == "down":
            self.x -= movement
        self._clamp_position()
        return self.x

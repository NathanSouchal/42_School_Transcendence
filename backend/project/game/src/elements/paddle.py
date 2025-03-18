class Paddle:
    def __init__(self, initial_x=0):
        self.pos = initial_x
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
            self.pos += movement
        elif direction == "down":
            self.pos -= movement
        self._clamp_position()
        return self.pos

    def _clamp_position(self):
        if self.ARENA_WIDTH is None or self.PADDLE_WIDTH is None:
            return

        half_arena_width = self.ARENA_WIDTH / 2
        half_paddle_width = self.PADDLE_WIDTH / 2

        self.pos = max(
            -half_arena_width + half_paddle_width,
            min(half_arena_width - half_paddle_width, self.pos),
        )

    def chooseResetDir(self):
        if self.pos >= -0.1 and self.pos <= 0.1:
            self.isResetting = False
            return
        self.isResetting = True
        self.resetDirection = "up" if self.pos < 0 else "down"

    def reset(self, delta_time):
        if self.pos >= -0.1 and self.pos <= 0.1:
            self.isResetting = False
            return
        if (self.resetDirection == "up" and self.pos >= 0.1) or (
            self.resetDirection == "down" and self.pos <= -0.1
        ):
            self.isResetting = False
            self.resetDirection = None
            return

        movement = self.MOVE_SPEED * 2 * delta_time
        direction = self.resetDirection

        if direction == "up":
            self.pos += movement
        elif direction == "down":
            self.pos -= movement
        self._clamp_position()
        return self.pos

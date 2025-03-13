import time
import asyncio

from .utils import GameMode


class Loop:
    def __init__(self, consumer):
        self.consumer = consumer

    async def game_loop(self, room):
        try:
            last_time = time.time()
            was_paused = False
            while True:
                if room in self.consumer.rooms:
                    is_paused = (
                        self.consumer.game_mode == GameMode.LOCAL
                        and self.consumer.rooms[self.consumer.room]["isPaused"] == True
                    )
                    if is_paused:
                        was_paused = True
                        await asyncio.sleep(1 / 60)
                        continue
                    if was_paused:
                        last_time = time.time()
                        was_paused = False

                    current_time = time.time()
                    delta_time = current_time - last_time
                    last_time = current_time

                    if "ball" not in self.consumer.rooms[room]:
                        print(f"ERREUR: Aucune balle trouvee pour la salle {room}")
                        continue
                    ball = self.consumer.rooms[room]["ball"]
                    if self.consumer.rooms[room]["positions"]["paddle_left"] is None:
                        self.consumer.rooms[room]["positions"]["paddle_left"] = 0
                    if self.consumer.rooms[room]["positions"]["paddle_right"] is None:
                        self.consumer.rooms[room]["positions"]["paddle_right"] = 0

                    left_paddle_pos = self.consumer.rooms[room]["positions"][
                        "paddle_left"
                    ]
                    right_paddle_pos = self.consumer.rooms[room]["positions"][
                        "paddle_right"
                    ]
                    ball_state = ball.update(delta_time)
                    self.consumer.rooms[room]["positions"][
                        "ball"
                    ] = ball.get_current_position()
                    wall_collision, paddle_collision = ball.check_collision(
                        left_paddle_pos, right_paddle_pos
                    )

                    try:
                        if wall_collision or paddle_collision:
                            await self.consumer.send_helpers.send_collision(
                                ball.position, paddle_collision
                            )

                            if paddle_collision:
                                ball.bounce(
                                    paddle_collision,
                                    (
                                        left_paddle_pos
                                        if paddle_collision == "left"
                                        else right_paddle_pos
                                    ),
                                )
                            elif wall_collision:
                                ball.bounce(wall_collision)

                    except Exception as e:
                        print(f"Error here: {e}")

                    if (
                        ball_state == "point_scored_left"
                        or ball_state == "point_scored_right"
                    ):
                        await self.resetPositions(delta_time)
                        if self.consumer.game_mode != GameMode.BACKGROUND:
                            await self.consumer.send_helpers.send_point_scored(
                                ball_state
                            )

                    await self.consumer.send_helpers.send_positions()

                await asyncio.sleep(1 / 60)

        except asyncio.CancelledError:
            print(f"game_loop anulle pour la salle {room}")
            pass
        except Exception as e:
            print(f"Error in game loop: {e}")

    async def resetPositions(self, delta_time):
        paddle_left = self.consumer.rooms[self.consumer.room]["paddles"]["left"]
        paddle_right = self.consumer.rooms[self.consumer.room]["paddles"]["right"]

        paddle_left.chooseResetDir()
        paddle_right.chooseResetDir()

        while paddle_left.isResetting or paddle_right.isResetting:
            self.consumer.rooms[self.consumer.room]["positions"]["paddle_left"] = (
                paddle_left.reset(delta_time)
            )
            self.consumer.rooms[self.consumer.room]["positions"]["paddle_right"] = (
                paddle_right.reset(delta_time)
            )
            await self.consumer.send_helpers.send_positions()
            await asyncio.sleep(1 / 60)
        self.consumer.rooms[self.consumer.room]["ball"].reset()

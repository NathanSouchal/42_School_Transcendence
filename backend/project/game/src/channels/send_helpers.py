import json
import time

from ..utils import GameMode, NumericEncoder


class SendHelpers:
    def __init__(self, consumer):
        self.consumer = consumer

    async def send_message(self, message_type, data):
        if self.consumer.game_mode is not GameMode.ONLINE:
            await self.consumer.send(
                text_data=json.dumps(
                    {"type": message_type, **data},
                    cls=NumericEncoder,
                )
            )
        else:
            await self.consumer.channel_layer.group_send(
                self.consumer.room,
                {"type": message_type, **data},
            )

    async def send_positions(self):
        current_time = time.time()
        positions = self.consumer.rooms[self.consumer.room]["positions"]
        print(f"sending positions: {positions}")
        await self.send_message(
            "positions", {"positions": positions, "timestamp": current_time}
        )

    async def send_collision(self, collision_point, touched_paddle):
        collision_data = {
            "point": {
                "x": collision_point.x,
                "y": collision_point.y,
                "z": collision_point.z,
            },
            "touchedPaddle": touched_paddle,
        }
        await self.send_message("collision", {"collision": collision_data})

    async def send_point_scored(self, ball_state):
        scored_side = "left" if ball_state == "point_scored_left" else "right"
        await self.send_message("scored_side", {"scored_side": scored_side})

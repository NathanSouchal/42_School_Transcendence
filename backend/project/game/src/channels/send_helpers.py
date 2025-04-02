import asyncio
import json
import time

from ..utils import GameMode, NumericEncoder


class SendHelpers:
    def __init__(self, consumer):
        self.consumer = consumer

    async def send_message(self, message_type, data, shouldBroadcast=True):
        if self.consumer.game_mode is not GameMode.ONLINE:
            await self.consumer.send(
                text_data=json.dumps(
                    {"type": message_type, **data},
                    cls=NumericEncoder,
                )
            )
        elif shouldBroadcast is True:
            await self.consumer.channel_layer.group_send(
                self.consumer.room,
                {"type": message_type, **data},
            )
        else:
            for player in self.consumer.rooms[self.consumer.room]["players"]:
                if player["channel_name"] != self.consumer.channel_name:
                    await self.consumer.channel_layer.send(
                        player["channel_name"],
                        {"type": message_type, **data},
                    )

    async def send_positions(self):
        current_time = time.time()
        positions = self.consumer.rooms[self.consumer.room]["positions"]
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

    async def send_connection_issue(self, connectionIssue):
        await self.send_message(
            "connectionIssue", {"connectionIssue": connectionIssue}, False
        )

    async def send_pong(self):
        await self.send_message("pong", {})

    async def send_players_ready(self):
        await self.send_message("players_ready", {})

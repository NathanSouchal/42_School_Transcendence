import json

from ..utils import NumericEncoder, GameMode


class SendHelpers:

    def __init__(self, consumer):
        self.consumer = consumer

    async def send_point_scored(self, ball_state):
        scored_side = "left" if ball_state == "point_scored_left" else "right"

        if self.consumer.game_mode != GameMode.ONLINE:
            await self.consumer.send(
                text_data=json.dumps(
                    {
                        "type": "scored_side",
                        "scored_side": scored_side,
                    },
                    cls=NumericEncoder,
                )
            )
        else:
            await self.consumer.channel_layer.group_send(
                self.consumer.room,
                {
                    "type": "scored_side",
                    "scored_side": scored_side,
                },
            )

    async def scored_side(self, event):
        await self.consumer.send(
            text_data=json.dumps(
                {
                    "type": "scored_side",
                    "scored_side": event["scored_side"],
                },
                cls=NumericEncoder,
            )
        )

    async def send_collision(self, collision, touchedPaddle):
        collision_data = {
            "point": {
                "x": collision.x,
                "y": collision.y,
                "z": collision.z,
            },
            "touchedPaddle": touchedPaddle,
        }

        if self.consumer.game_mode is not GameMode.ONLINE:
            await self.consumer.send(
                text_data=json.dumps(
                    {
                        "type": "collision",
                        "collision": collision_data,
                    },
                    cls=NumericEncoder,
                )
            )
        else:
            await self.consumer.channel_layer.group_send(
                self.consumer.room,
                {
                    "type": "collision",
                    "collision": collision_data,
                },
            )

    async def collision(self, event):
        await self.consumer.send(
            text_data=json.dumps(
                {
                    "type": "collision",
                    "collision": event["collision"],
                },
                cls=NumericEncoder,
            )
        )

    async def send_positions(self):
        positions = self.consumer.rooms[self.consumer.room]["positions"]
        if self.consumer.game_mode is not GameMode.ONLINE:
            await self.consumer.send(
                text_data=json.dumps(
                    {
                        "type": "positions",
                        "positions": positions,
                    },
                    cls=NumericEncoder,
                )
            )
        else:
            await self.consumer.channel_layer.group_send(
                self.consumer.room,
                {
                    "type": "positions",
                    "positions": positions,
                },
            )

    async def positions(self, event):
        await self.consumer.send(
            text_data=json.dumps(
                {
                    "type": "positions",
                    "positions": event["positions"],
                },
                cls=NumericEncoder,
            )
        )

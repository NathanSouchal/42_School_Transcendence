import json
from decimal import Decimal

from channels.generic.websocket import AsyncWebsocketConsumer


# Define NumericEncoder at module level
class NumericEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (Decimal, float)):
            return float(obj)
        return super().default(obj)


class GameState(AsyncWebsocketConsumer):
    async def connect(self):
        print(f"Attempting connection")
        self.room_name = "game_room"
        self.room_group_name = "pong_game"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"Consumer connected")

        self.state = {
            "paddle_left": {"x": 0.0},
            "paddle_right": {"x": 0.0},
            "ball": {
                "x": 0.0,
                "y": 0.0,
                "z": 0.0,
                "vel_x": 0.0,
                "vel_y": 0.0,
                "vel_z": 0.0,
            },
        }

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            # print(f"Received data: {data}")

            message_type = data.get("type")
            if message_type == "paddle_left":
                self.state["paddle_left"]["x"] = float(data["pos"]["x"])
            elif message_type == "paddle_right":
                self.state["paddle_right"]["x"] = float(data["pos"]["x"])
            elif message_type == "ball":
                ball_pos = data.get("pos", {})
                for key, value in ball_pos.items():
                    self.state["ball"][key] = float(value)

            await self.channel_layer.group_send(
                self.room_group_name, {"type": "game_state_update", "state": self.state}
            )
        except Exception as e:
            print(f"Error processing message: {e}")

    async def game_state_update(self, event):
        await self.send(text_data=json.dumps(event["state"], cls=NumericEncoder))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

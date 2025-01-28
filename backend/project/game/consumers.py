# consumers.py (Django Channels)
import json

from channels.generic.websocket import AsyncWebsocketConsumer


class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.game_state = {
            "ball": {"x": 0, "y": 0, "z": 0},
            "paddle_left": {"z": 0},
            "paddle_right": {"z": 0},
        }

    async def receive(self, text_data):
        data = json.loads(text_data)

        print(f"Received data: {data}")

        if "paddle_left" in data:
            self.game_state["paddle_left"]["x"] = data["paddle_left"]["x"]
        if "paddle_right" in data:
            self.game_state["paddle_right"]["x"] = data["paddle_right"]["x"]

        await self.send(text_data=json.dumps(self.game_state))

    async def disconnect(self, close_code):
        pass

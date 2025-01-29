import json

from channels.generic.websocket import AsyncWebsocketConsumer


class GameState(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        print(f"Consumer connected")
        self.state = {
            "paddle_left": {"x": 0},
            "paddle_right": {"x": 0},
            "ball": {"x": 0, "y": 0, "z": 0, "vel_x": 0, "vel_y": 0, "vel_z": 0},
        }

    async def receive(self, text_data):
        data = json.loads(text_data)

        # print(f"Received data: {data}")

        if "paddle_left" in data:
            self.state["paddle_left"]["x"] = data["paddle_left"]["x"]
        if "paddle_right" in data:
            self.state["paddle_right"]["x"] = data["paddle_right"]["x"]
        if "ball" in data:
            self.state["ball"]["x"] = data["ball"]["x"]
            self.state["ball"]["y"] = data["ball"]["y"]
            self.state["ball"]["z"] = data["ball"]["z"]

        await self.send(text_data=json.dumps(self.state))

    async def disconnect(self, close_code):
        pass

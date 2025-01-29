import json

from channels.generic.websocket import AsyncWebsocketConsumer


class GameState(AsyncWebsocketConsumer):
    async def connect(self):
        # Join game room
        self.room_name = "game_room"
        self.room_group_name = "pong_game"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()
        # print(f"Consumer connected")
        self.state = {
            "paddle_left": {"x": 0},
            "paddle_right": {"x": 0},
            "ball": {"x": 0, "y": 0, "z": 0, "vel_x": 0, "vel_y": 0, "vel_z": 0},
        }

    async def receive(self, text_data):
        data = json.loads(text_data)
        # print(f"Received data: {data}")

        # Update state based on received data
        message_type = data.get("type")
        if message_type == "paddle_left":
            self.state["paddle_left"]["x"] = data["pos"]["x"]
        elif message_type == "paddle_right":
            self.state["paddle_right"]["x"] = data["pos"]["x"]
        elif message_type == "ball":
            ball_pos = data.get("pos", {})
            self.state["ball"].update(ball_pos)

        # Broadcast the updated state to all clients
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "game_state_update", "state": self.state}
        )

    async def game_state_update(self, event):
        await self.send(text_data=json.dumps(event["state"]))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

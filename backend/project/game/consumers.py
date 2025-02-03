import json
from decimal import Decimal

from channels.generic.websocket import AsyncWebsocketConsumer


class NumericEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (Decimal, float)):
            return float(obj)
        return super().default(obj)


class GameState(AsyncWebsocketConsumer):
    rooms = {}

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"pong_game_{self.room_name}"
        is_local_game = (
            self.scope.get("query_params", {}).get("local", "false") == "true"
        )
        if self.room_group_name not in self.rooms:
            self.rooms[self.room_group_name] = {
                "players": [],
                "score": {"left": 0, "right": 0},
                "game_status": "waiting",
                "state": {
                    "paddle_left": {"x": 0},
                    "paddle_right": {"x": 0},
                    "ball": {
                        "x": 0,
                        "y": 0,
                        "z": 0,
                        "vel_x": 0,
                        "vel_y": 0,
                        "vel_z": 0,
                    },
                },
            }
        if is_local_game:
            self.rooms[self.room_group_name]["game_status"] = "playing"

        if len(self.rooms[self.room_group_name]["players"]) < 2:
            self.player_side = (
                "left"
                if len(self.rooms[self.room_group_name]["players"]) == 0
                else "right"
            )
            self.rooms[self.room_group_name]["players"].append(self.channel_name)
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
            await self.send(
                json.dumps({"type": "game_start", "side": self.player_side})
            )
            if len(self.rooms[self.room_group_name]["players"]) == 2:
                self.rooms[self.room_group_name]["game_status"] = "playing"
                await self.start_game()
        else:
            await self.close()

    async def start_game(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_state", "state": self.rooms[self.room_group_name]["state"]},
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")
            room_state = self.rooms[self.room_group_name]["state"]  # Get room state

            if message_type == "state":
                message_element = data.get("element")
                if message_element == "paddle_left":
                    room_state["paddle_left"]["x"] = float(data["pos"]["x"])
                elif message_element == "paddle_right":
                    room_state["paddle_right"]["x"] = float(data["pos"]["x"])
                elif message_element == "ball":
                    ball_pos = data.get("pos", {})
                    for key, value in ball_pos.items():
                        room_state["ball"][key] = float(value)

                await self.channel_layer.group_send(
                    self.room_group_name, {"type": "game_state", "state": room_state}
                )

            elif message_type == "game_status":
                game_status = self.rooms[self.room_group_name]["game_status"]
                await self.channel_layer.group_send(
                    self.room_group_name, {"type": "game_status", "status": game_status}
                )

        except Exception as e:
            print(f"Error processing message: {e}")

    async def game_state(self, event):
        await self.send(
            text_data=json.dumps(
                {"type": "game_state", "state": event["state"]}, cls=NumericEncoder
            )
        )

    async def game_status(self, event):
        await self.send(
            text_data=json.dumps({"type": "game_status", "status": event["status"]})
        )

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name") and self.room_group_name in self.rooms:
            if self.channel_name in self.rooms[self.room_group_name]["players"]:
                self.rooms[self.room_group_name]["players"].remove(self.channel_name)

            if not self.rooms[self.room_group_name]["players"]:
                del self.rooms[self.room_group_name]
            else:
                self.rooms[self.room_group_name]["game_status"] = "waiting"
                await self.channel_layer.group_send(
                    self.room_group_name, {"type": "game_status", "status": "waiting"}
                )

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

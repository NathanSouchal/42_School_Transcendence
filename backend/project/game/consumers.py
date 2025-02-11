import json
import uuid
from decimal import Decimal
from enum import Enum, auto
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer


class GameMode(Enum):
    LOCAL = auto()
    ONLINE = auto()
    BACKGROUND = auto()


class NumericEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (Decimal, float)):
            return float(obj)
        return super().default(obj)


class GameState(AsyncWebsocketConsumer):
    rooms = {}

    DEFAULT_STATE = {
        "players": [],
        "score": {"left": 0, "right": 0},
        "status": "waiting",
        "positions": {
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

    async def connect(self):
        query_params = parse_qs(self.scope["query_string"].decode("utf-8"))

        room_type = query_params.get("type", [None])[0]

        print(f"Launching consumer: room_type is {room_type}")

        if room_type == "online":
            self.game_mode = GameMode.ONLINE
        elif room_type == "bg":
            self.game_mode = GameMode.BACKGROUND
        else:
            self.game_mode = GameMode.LOCAL

        await self.setup_room()

    async def setup_room(self):
        if self.game_mode == GameMode.ONLINE:
            for room_name, room_data in self.rooms.items():
                if len(room_data["players"]) < 2:
                    self.room = room_name.split("_")[-1]
            self.room = uuid.uuid4()
        else:
            self.room = uuid.uuid4()

        await self.accept()

        if self.room not in self.rooms:
            self.rooms[self.room] = self.DEFAULT_STATE.copy()
        await self.channel_layer.group_add(self.room, self.channel_name)

        if self.game_mode == GameMode.ONLINE:
            await self.manage_online_players()

    async def manage_online_players(self):
        if len(self.rooms[self.room]["players"]) < 2:
            self.player_side = (
                "left" if len(self.rooms[self.room]["players"]) == 0 else "right"
            )
            self.rooms[self.room]["players"].append(self.channel_name)
            print(f"Waiting for second player")

            if len(self.rooms[self.room]["players"]) == 2:
                await self.channel_layer.group_send(
                    self.room, {"type": "match_found", "side": self.player_side}
                )
                print(f"Second player has been found")
                self.rooms[self.room]["status"] = "playing"
        else:
            await self.close()

    async def match_found(self, event):
        isSourceOfTruth = event["side"] == "left"
        await self.send(
            json.dumps(
                {
                    "type": "hasFoundOpponent",
                    "side": event["side"],
                    "isSourceOfTruth": isSourceOfTruth,
                }
            )
        )

    async def positions(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "positions",
                    "data": event["positions"],
                },
                cls=NumericEncoder,
            )
        )

    async def status(self, event):
        await self.send(
            text_data=json.dumps(
                {"type": "status", "data": event.get("status", "waiting")}
            )
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            positions = self.rooms[self.room]["positions"]

            if message_type == "positions":
                message_element = data.get("element")
                if message_element == "paddle_left":
                    positions["paddle_left"]["x"] = float(data["pos"]["x"])
                elif message_element == "paddle_right":
                    positions["paddle_right"]["x"] = float(data["pos"]["x"])
                elif message_element == "ball":
                    ball_pos = data.get("pos", {})
                    for key, value in ball_pos.items():
                        positions["ball"][key] = float(value)

                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "positions",
                            "positions": positions,
                        },
                        cls=NumericEncoder,
                    )
                )

        except Exception as e:
            print(f"Error processing message: {text_data}")
            print(f"Exception details: {str(e)}")

    async def disconnect(self, close_code):
        if self.room in self.rooms:
            if self.channel_name in self.rooms[self.room]["players"]:
                self.rooms[self.room]["players"].remove(self.channel_name)

            if not self.rooms[self.room]["players"]:
                del self.rooms[self.room]
            else:
                self.rooms[self.room]["status"] = "waiting"

        await self.channel_layer.group_discard(self.room, self.channel_name)

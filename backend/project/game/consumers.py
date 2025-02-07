import json
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
        # Parse the query string from the scope
        query_params = parse_qs(self.scope["query_string"].decode("utf-8"))

        # Retrieve the 'type' parameter from the query string
        room_type = query_params.get("type", [None])[0]

        print(f"Launching consumer: room_type is {room_type}")

        if room_type == "online":
            self.game_mode = GameMode.ONLINE
        elif room_type == "bg":
            self.game_mode = GameMode.BACKGROUND
        else:
            self.game_mode = GameMode.LOCAL

        # Assign room and setup connection
        await self.setup_room()

    async def setup_room(self):
        if self.game_mode == GameMode.ONLINE:
            await self.setup_online_room()
        elif self.game_mode == GameMode.BACKGROUND:
            await self.setup_background_room()
        else:  # Local mode
            await self.setup_local_room()

    async def setup_local_room(self):
        self.room = f"local_game_{id(self)}"

        await self.accept()
        await self.initialize_room(self.room)

    async def setup_online_room(self):
        await self.accept()

        # Use room_id from URL if provided, else match or create
        self.session = self.scope["url_route"]["kwargs"].get("room_id")
        if not self.session:
            self.session = self.match_or_create_online_room()

        self.room = f"online_game_{self.session}"

        await self.initialize_room(self.room)
        await self.manage_online_players()

    async def setup_background_room(self):
        self.room = "background_game"

        await self.accept()
        await self.initialize_room(self.room)

    def match_or_create_online_room(self):
        for room_name, room_data in self.rooms.items():
            if len(room_data["players"]) < 2:
                return room_name.split("_")[-1]
        return f"room_{len(self.rooms) + 1}"

    async def initialize_room(self, room_name):
        if room_name not in self.rooms:
            self.rooms[room_name] = self.DEFAULT_STATE.copy()

        await self.channel_layer.group_add(room_name, self.channel_name)

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
        await self.send(json.dumps({"type": "hasFoundOpponent", "data": event["side"]}))

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

            if self.game_mode == GameMode.ONLINE:
                message_origin = data.get("origin")
                if not message_origin or message_origin not in ["left", "right"]:
                    return

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

                await self.channel_layer.group_send(
                    self.room,
                    {
                        "type": "positions",
                        "positions": positions,
                    },
                )

        except Exception as e:
            print(f"Error processing message: {text_data}")
            print(f"Exception details: {str(e)}")

    async def disconnect(self, close_code):
        # Remove player from room
        if self.room in self.rooms:
            if self.channel_name in self.rooms[self.room]["players"]:
                self.rooms[self.room]["players"].remove(self.channel_name)

            # Clean up room if empty
            if not self.rooms[self.room]["players"]:
                del self.rooms[self.room]
            else:
                self.rooms[self.room]["status"] = "waiting"

        # Discard from channel layer
        await self.channel_layer.group_discard(self.room, self.channel_name)

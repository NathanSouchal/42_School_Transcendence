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
    pending_room = None
    local_state = {
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
        is_local_game = (
            self.scope.get("query_params", {}).get("local", "true") == "true"
        )
        print(f"Connecting to {'local' if is_local_game else 'online'} game")

        # if is_local_game:
        #     await self.setup_local_room()
        # else:
        await self.setup_online_rooms()

    async def setup_local_room(self):
        self.session = "local_session"
        self.room = "local_room"
        self.is_local = True

        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()
        # print("Local game consumer connected on ", self.channel)

    async def setup_online_rooms(self):
        self.session = self.scope["url_route"]["kwargs"].get("room_id")
        self.is_local = False

        if not self.session:
            if GameState.pending_room:
                self.session = GameState.pending_room
                GameState.pending_room = None
            else:
                self.session = f"room_{len(GameState.rooms) + 1}"
                GameState.pending_room = self.session

        self.room = f"pong_game_{self.session}"

        if self.room not in GameState.rooms:
            GameState.rooms[self.room] = {
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

        if len(GameState.rooms[self.room]["players"]) < 2:
            self.player_side = (
                "left" if len(GameState.rooms[self.room]["players"]) == 0 else "right"
            )
            print(f"{self.player_side}")
            GameState.rooms[self.room]["players"].append(self.channel_name)

            await self.channel_layer.group_add(self.room, self.channel_name)
            await self.accept()

            await self.send(
                json.dumps(
                    {
                        "type": "startOnlineGame",
                        "data": {"side": self.player_side, "game_mode": "OnlinePVP"},
                    }
                )
            )

            if len(GameState.rooms[self.room]["players"]) == 2:
                print(f"room is {GameState.rooms[self.room]}")
                print(f"Number of instantiated rooms: {len(GameState.rooms)}")
                GameState.rooms[self.room]["status"] = "playing"
                await self.start_game()
        else:
            await self.close()

    async def start_game(self):
        print(f"starting online game")
        await self.channel_layer.group_send(
            self.room, {"type": "status", "status": "startOnlineGame"}
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
        # print(f"Sending status: {event}")
        if not self.is_local:
            # print(f"Status update for room: {GameState.rooms[self.room]}")
            await self.send(
                text_data=json.dumps({"type": "status", "data": event["status"]})
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if self.is_local:
                positions = self.local_state["positions"]
            else:
                positions = GameState.rooms[self.room]["positions"]

            if message_type == "positions":
                message_element = data.get("element")
                message_origin = data.get("origin")
                if message_element == "paddle_left" and message_origin == "left":
                    positions["paddle_left"]["x"] = float(data["pos"]["x"])
                elif message_element == "paddle_right" and message_origin == "right":
                    positions["paddle_right"]["x"] = float(data["pos"]["x"])
                elif message_element == "ball" and message_origin == "left":
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

            elif message_type == "status" and not self.is_local:
                status = GameState.rooms[self.room]["status"]
                await self.channel_layer.group_send(
                    self.room,
                    {
                        "type": "status",
                        "status": status,
                    },
                )

        except Exception as e:
            print(f"Error processing message: {text_data}")
            print(f"Exception details: {str(e)}")

    async def disconnect(self, close_code):
        if not self.is_local and hasattr(self, "room"):
            if self.room in GameState.rooms:
                if self.channel_name in GameState.rooms[self.room]["players"]:
                    GameState.rooms[self.room]["players"].remove(self.channel_name)

                if not GameState.rooms[self.room]["players"]:
                    del GameState.rooms[self.room]
                    if GameState.pending_room == self.session:
                        GameState.pending_room = None
                else:
                    GameState.rooms[self.room]["status"] = "waiting"
                    await self.channel_layer.group_send(
                        self.room,
                        {"type": "status", "data": "waiting"},
                    )

        await self.channel_layer.group_discard(self.room, self.channel_name)

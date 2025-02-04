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

    async def connect(self):
        is_local_game = (
            self.scope.get("query_params", {}).get("local", "true") == "true"
        )
        print(f"Connecting to {'local' if is_local_game else 'online'} game")

        if is_local_game:
            await self.setup_local_room()
        else:
            await self.setup_online_rooms()

    async def setup_local_room(self):
        self.room_name = "local_game_room"
        self.room_group_name = "pong_game_local"
        self.is_local = True

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print("Local game consumer connected")

    async def setup_online_rooms(self):
        self.room_name = self.scope["url_route"]["kwargs"].get("room_id")
        self.is_local = False

        if not self.room_name:
            if GameState.pending_room:
                self.room_name = GameState.pending_room
                GameState.pending_room = None
            else:
                self.room_name = f"room_{len(GameState.rooms) + 1}"
                GameState.pending_room = self.room_name

        self.room_group_name = f"pong_game_{self.room_name}"

        if self.room_group_name not in GameState.rooms:
            GameState.rooms[self.room_group_name] = {
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

        if len(GameState.rooms[self.room_group_name]["players"]) < 2:
            self.player_side = (
                "left"
                if len(GameState.rooms[self.room_group_name]["players"]) == 0
                else "right"
            )
            GameState.rooms[self.room_group_name]["players"].append(self.channel_name)

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()

            await self.send(
                json.dumps({"type": "game_start", "side": self.player_side})
            )

            if len(GameState.rooms[self.room_group_name]["players"]) == 2:
                print("Online PvP game starting")
                GameState.rooms[self.room_group_name]["game_status"] = "playing"
                await self.start_game()
        else:
            await self.close()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if self.is_local:
                room_state = self.local_state["state"]
            else:
                room_state = GameState.rooms[self.room_group_name]["state"]

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

            elif message_type == "game_status" and not self.is_local:
                game_status = GameState.rooms[self.room_group_name]["game_status"]
                await self.channel_layer.group_send(
                    self.room_group_name, {"type": "game_status", "status": game_status}
                )

        except Exception as e:
            print(f"Error processing message: {text_data}")
            print(f"Exception details: {str(e)}")

    async def game_state(self, event):
        await self.send(
            text_data=json.dumps(
                {"type": "game_state", "state": event["state"]}, cls=NumericEncoder
            )
        )

    async def game_status(self, event):
        if not self.is_local:
            print(f"Status update for room: {GameState.rooms[self.room_group_name]}")
        await self.send(
            text_data=json.dumps({"type": "game_status", "status": event["status"]})
        )

    async def disconnect(self, close_code):
        if not self.is_local and hasattr(self, "room_group_name"):
            if self.room_group_name in GameState.rooms:
                if (
                    self.channel_name
                    in GameState.rooms[self.room_group_name]["players"]
                ):
                    GameState.rooms[self.room_group_name]["players"].remove(
                        self.channel_name
                    )

                if not GameState.rooms[self.room_group_name]["players"]:
                    del GameState.rooms[self.room_group_name]
                    if GameState.pending_room == self.room_name:
                        GameState.pending_room = None
                else:
                    GameState.rooms[self.room_group_name]["game_status"] = "waiting"
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {"type": "game_status", "status": "waiting"},
                    )

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

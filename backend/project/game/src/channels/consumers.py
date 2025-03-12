import asyncio
import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer

from .send_helpers import SendHelpers
from .room_initialization import RoomInitialization
from ..utils import GameMode
from ..loop import Loop


class GameState(AsyncWebsocketConsumer):
    rooms = {}
    game_loops = {}

    DEFAULT_STATE = {
        "players": [],
        "score": {"left": 0, "right": 0},
        "game_mode": "null",
        "isPaused": "false",
        "positions": {
            "paddle_left": 0,
            "paddle_right": 0,
            "ball": {
                "x": 0,
                "y": 0,
                "z": 0,
                "vel_x": 0,
                "vel_y": 0,
                "vel_z": 0,
            },
        },
        "paddles": {},
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_initialization = RoomInitialization(self)
        self.send_helpers = SendHelpers(self)
        self.loop = Loop(self)

    async def connect(self):
        print(f"🔗 WebSocket CONNECTED: {self.scope['client']}")
        query_params = parse_qs(self.scope["query_string"].decode("utf-8"))
        room_type = query_params.get("type", [None])[0]

        if room_type == "online":
            self.game_mode = GameMode.ONLINE
        elif room_type == "bg":
            self.game_mode = GameMode.BACKGROUND
        else:
            self.game_mode = GameMode.LOCAL
        self.room = None
        await self.room_initialization.setup_room()

    async def disconnect(self, close_code):
        print(f"❌ WebSocket DISCONNECTED: {self.scope['client']}, Code: {close_code}")
        if close_code is None:
            print("⚠️ WebSocket fermé sans code, peut-être une déconnexion inattendue ?")

        # termine proprement la tache manage_online_players qui tourne en arriere plan
        if hasattr(self, "manage_task"):
            self.manage_task.cancel()
            try:
                await self.manage_task
            except asyncio.CancelledError:
                print("manage_online_players cancelled properly")

        if hasattr(self, "room") and self.room and self.room in self.rooms:
            # Trouver et retirer le joueur de la room
            leaving_player = next(
                (
                    player
                    for player in self.rooms[self.room]["players"]
                    if player["channel_name"] == self.channel_name
                ),
                None,
            )

        if leaving_player:
            print(f"Removing player {leaving_player['username']} from room {self.room}")
            self.rooms[self.room]["players"].remove(leaving_player)

        # Supprimer la room si elle est vide
        if not self.rooms[self.room]["players"]:
            print(f"Room {self.room} is now empty. Deleting it.")
            del self.rooms[self.room]

        # Retirer le joueur du groupe Channels
        if self.channel_layer is not None:
            await self.channel_layer.group_discard(self.room, self.channel_name)
        else:
            print("⚠️ Erreur: `channel_layer` est None")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)

            if data.get("type") == "paddle_move":
                direction = data.get("direction")
                side = data.get("side")
                delta_time = float(data.get("deltaTime"))
                positions = self.rooms[self.room]["positions"]
                positions[f"paddle_{side}"] = self.rooms[self.room]["paddles"][
                    side
                ].move(direction, delta_time)
                self.rooms[self.room]["positions"]["ball"] = self.rooms[self.room][
                    "ball"
                ].get_current_position()
            elif data.get("type") == "pausedOrUnpaused":
                self.rooms[self.room]["isPaused"] = data.get("bool")
        except Exception as e:
            print(f"Error processing message: {text_data}")
            print(f"Exception details: {str(e)}")

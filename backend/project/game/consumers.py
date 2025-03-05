import asyncio
import copy
import json
import time
import uuid
from decimal import Decimal
from enum import Enum, auto
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer

from .ball import Ball
from .paddle import Paddle


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

    async def connect(self):
        print(f"🔗 WebSocket CONNECTED: {self.scope['client']}")
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
        roomFound = False
        if self.game_mode == GameMode.ONLINE:
            for room_name, room_data in self.rooms.items():
                if (
                    len(room_data["players"]) < 2
                    and room_data["game_mode"] == GameMode.ONLINE
                ):
                    self.room = room_name
                    roomFound = True
                    break
        if not roomFound or self.game_mode != GameMode.ONLINE:
            self.room = str(uuid.uuid4())
        await self.accept()

        if self.room not in self.rooms:
            await self.initializeRoom()

        if self.channel_layer is not None:
            await self.channel_layer.group_add(self.room, self.channel_name)
        else:
            print("⚠️ Erreur: `channel_layer` est None. Channels est-il bien configuré ?")

        if self.channel_name not in self.rooms[self.room]["players"]:
            self.rooms[self.room]["players"].append(self.channel_name)

        # Lancement en tâche de fond pour pouvoir l'annuler facilement en cas de déconnexion
        if self.game_mode == GameMode.ONLINE:
            self.manage_task = asyncio.create_task(self.manage_online_players())
        else:
            self.isSourceOfTruth = False

        print(f"rooms number: {len(self.rooms)}")
        for room, details in self.rooms.items():
            print(f"Room {room}: {details['players']}")
        if self.room not in self.game_loops:
            print(f"🚀 Lancement du game_loop pour la salle {self.room}")
            self.game_loops[self.room] = asyncio.create_task(self.game_loop(self.room))
            print(f"✅ game_loop lancé avec succès pour {self.room}")
        else:
            print(f"⚠️ game_loop déjà actif pour {self.room}")

    async def initializeRoom(self):
        self.rooms[self.room] = copy.deepcopy(self.DEFAULT_STATE)
        self.rooms[self.room]["game_mode"] = self.game_mode
        try:
            self.rooms[self.room]["paddles"] = {
            "left": Paddle(initial_x=0),
            "right": Paddle(initial_x=0),
            }
            self.rooms[self.room]["ball"] = Ball()
            print(f"✅ Balle créée pour la salle {self.room}: {self.rooms[self.room]['ball']}")
        except Exception as e:
            print(f"⚠️ Erreur lors de l'initialisation de la salle : {e}")
            del self.rooms[self.room]  # Supprime la salle corrompue


    async def manage_online_players(self):
        print(
            f"Going inside manage_online_players with {len(self.rooms[self.room]['players'])}"
        )
        if len(self.rooms[self.room]["players"]) <= 2:
            if len(self.rooms[self.room]["players"]) == 1:
                self.player_side = "left"
                self.isSourceOfTruth = True
                print(f"Assigned players to left side")
            else:
                self.player_side = "right"
                self.isSourceOfTruth = False
                print(f"Assigned players to right side")

            while (
                self.room in self.rooms
                and len(self.rooms[self.room]["players"]) < 2
                and len(self.rooms[self.room]["players"]) > 0
            ):
                print(f"Waiting for second player, this is {self.channel_name}")
                await asyncio.sleep(2)

            print(f"outt!!!!! {len(self.rooms[self.room]['players'])}")

            if len(self.rooms[self.room]["players"]) == 2:
                # sending only to one player, as both of them will go through this function eventually
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "hasFoundOpponent",
                            "side": self.player_side,
                            "isSourceOfTruth": self.isSourceOfTruth,
                        },
                        cls=NumericEncoder,
                    )
                )
                print(f"Second player has been found")
        else:
            await self.close()

    async def game_loop(self, room):
        try:
            last_time = time.time()
            while True:
                if room in self.rooms:
                    # print(f"isPaused ? {self.rooms[self.room]['isPaused']}")
                    if (self.game_mode == GameMode.LOCAL) and self.rooms[self.room][
                        "isPaused"
                    ]:
                        await asyncio.sleep(1 / 60)
                        continue
                    current_time = time.time()
                    delta_time = current_time - last_time
                    last_time = current_time

                    if "ball" not in self.rooms[room]:
                        print(f"ERREUR: Aucune balle trouvee pour la salle {room}")
                        continue
                    ball = self.rooms[room]["ball"]
                    print(f"🎾 Avant update: Ball position = {ball.position}")
                    print(f"Appel de Ball.update() avec delta_time={delta_time}")
                    left_paddle_pos = self.rooms[room]["positions"]["paddle_left"]
                    right_paddle_pos = self.rooms[room]["positions"]["paddle_right"]

                    if left_paddle_pos is None:
                        print(f"Left paddle position is None, using default 0")
                        left_paddle_pos = 0
                        self.rooms[room]["positions"]["paddle_left"] = 0

                    if right_paddle_pos is None:
                        print(f"Right paddle position is None, using default 0")
                        right_paddle_pos = 0
                        self.rooms[room]["positions"]["paddle_right"] = 0

                    ball_state = ball.update(delta_time)
                    self.rooms[room]["positions"]["ball"] = ball.get_current_position()
                    print(f"🎾 Après update: Ball position = {self.rooms[room]['positions']['ball']}")
                    wall_collision, paddle_collision = ball.check_collision(
                        left_paddle_pos, right_paddle_pos
                    )

                    try:
                        if wall_collision or paddle_collision:
                            await self.sendCollision(ball.position.x)

                            if paddle_collision:
                                ball.bounce(
                                    paddle_collision,
                                    (
                                        left_paddle_pos
                                        if paddle_collision == "left"
                                        else right_paddle_pos
                                    ),
                                )
                            elif wall_collision:
                                ball.bounce(wall_collision)

                    except Exception as e:
                        print(f"Error here: {e}")

                    if (
                        ball_state == "point_scored_left"
                        or ball_state == "point_scored_right"
                    ):
                        await self.resetPositions(delta_time)
                        if self.game_mode != GameMode.BACKGROUND:
                            await self.sendPointScored(ball_state)

                    await self.sendPositions()

                await asyncio.sleep(1 / 60)

        except asyncio.CancelledError:
            print(f"game_loop anulle pour la salle {room}")
            pass
        except Exception as e:
            print(f"Error in game loop: {e}")

    async def resetPositions(self, delta_time):
        paddle_left = self.rooms[self.room]["paddles"]["left"]
        paddle_right = self.rooms[self.room]["paddles"]["right"]

        paddle_left.chooseResetDir()
        paddle_right.chooseResetDir()

        while paddle_left.isResetting or paddle_right.isResetting:
            self.rooms[self.room]["positions"]["paddle_left"] = paddle_left.reset(
                delta_time
            )
            self.rooms[self.room]["positions"]["paddle_right"] = paddle_right.reset(
                delta_time
            )
            await self.sendPositions()
            await asyncio.sleep(1 / 60)
        self.rooms[self.room]["ball"].reset()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            print(f"📩 Message reçu : {data}")

            if data.get("type") == "paddle_move":
                direction = data.get("direction")
                side = data.get("side")
                delta_time = float(data.get("deltaTime"))
                positions = self.rooms[self.room]["positions"]
                print(f"🎮 Avant mise à jour: paddle_{side} = {positions[f'paddle_{side}']}")
                positions[f"paddle_{side}"] = self.rooms[self.room]["paddles"][
                    side
                ].move(direction, delta_time)
                print(f"✅ Après mise à jour: paddle_{side} = {self.rooms[self.room]['positions'][f'paddle_{side}']}")
                print(f"⚽ Avant mise à jour du paddle, position balle = {self.rooms[self.room]['positions']['ball']}")
                self.rooms[self.room]["positions"]["ball"] = self.rooms[self.room]["ball"].get_current_position()
                print(f"⚽ Après mise à jour du paddle, position balle = {self.rooms[self.room]['positions']['ball']}")  # ✅ DEBUG
                await self.sendPositions()
                print(f"📤 Envoi des nouvelles positions après paddle_move")
            elif data.get("type") == "pausedOrUnpaused":
                self.rooms[self.room]["isPaused"] = data.get("bool")
                print(f"{data.get('bool')}")
        except Exception as e:
            print(f"Error processing message: {text_data}")
            print(f"Exception details: {str(e)}")

    async def sendPointScored(self, ball_state):
        scored_side = "left" if ball_state == "point_scored_left" else "right"

        if self.game_mode != GameMode.ONLINE:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "scored_side",
                        "scored_side": scored_side,
                    },
                    cls=NumericEncoder,
                )
            )
        else:
            await self.channel_layer.group_send(
                self.room,
                {
                    "type": "scored_side",
                    "scored_side": scored_side,
                },
            )

    async def scored_side(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "scored_side",
                    "scored_side": event["scored_side"],
                },
                cls=NumericEncoder,
            )
        )

    async def sendCollision(self, collision):
        if self.game_mode is not GameMode.ONLINE:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "collision",
                        "collision": collision,
                    },
                    cls=NumericEncoder,
                )
            )
        else:
            await self.channel_layer.group_send(
                self.room,
                {
                    "type": "collision",
                    "collision": collision,
                },
            )

    async def collision(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "collision",
                    "collision": event["collision"],
                },
                cls=NumericEncoder,
            )
        )

    async def sendPositions(self):
        positions = self.rooms[self.room]["positions"]
        print(f"📤 Envoi des positions mises à jour : {positions}")  # ✅ DEBUG
        print(f"⚽ Position actuelle de la balle : {self.rooms[self.room]['positions']['ball']}")
        if self.game_mode is not GameMode.ONLINE:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "positions",
                        "positions": positions,
                    },
                    cls=NumericEncoder,
                )
            )
        else:
            await self.channel_layer.group_send(
                self.room,
                {
                    "type": "positions",
                    "positions": positions,
                },
            )

    async def positions(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "positions",
                    "positions": event["positions"],
                },
                cls=NumericEncoder,
            )
        )

    async def disconnect(self, close_code):
        print(f"❌ WebSocket DISCONNECTED: {self.scope['client']}, Code: {close_code}")
        print("      player disconnected !!")
        if close_code is None:
            print("⚠️ WebSocket fermé sans code, peut-être une déconnexion inattendue ?")

        # termine proprement la tache manage_online_players qui tourne en arriere plan
        if hasattr(self, "manage_task"):
            self.manage_task.cancel()
            try:
                await self.manage_task
            except asyncio.CancelledError:
                print("manage_online_players cancelled properly")

        if hasattr(self, "room") and self.room in self.rooms:
            if self.channel_name in self.rooms[self.room]["players"]:
                self.rooms[self.room]["players"].remove(self.channel_name)

            if not self.rooms[self.room]["players"]:
                del self.rooms[self.room]

        await self.channel_layer.group_discard(self.room, self.channel_name)

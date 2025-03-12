import uuid
import json
import asyncio
import copy
from ..utils import GameMode, NumericEncoder
from ..elements.ball import Ball
from ..elements.paddle import Paddle


class RoomInitialization:
    def __init__(self, consumer):
        self.consumer = consumer

    async def setup_room(self):
        user = self.consumer.scope["user"]
        if not user.is_authenticated:
            print("User not logged in, room access denied")
            await self.consumer.close()
            return

        roomFound = False
        if self.consumer.game_mode == GameMode.ONLINE:
            for room_name, room_data in self.consumer.rooms.items():
                if (
                    len(room_data["players"]) < 2
                    and room_data["game_mode"] == GameMode.ONLINE
                ):
                    if all(
                        player["user_id"] is not None for player in room_data["players"]
                    ):
                        self.consumer.room = room_name
                        roomFound = True
                        break
        if not roomFound or self.consumer.game_mode != GameMode.ONLINE:
            self.consumer.room = str(uuid.uuid4())
        await self.consumer.accept()

        if self.consumer.room not in self.consumer.rooms:
            await self.initializeRoom()

        if self.consumer.channel_layer is not None:
            await self.consumer.channel_layer.group_add(
                self.consumer.room, self.consumer.channel_name
            )
        else:
            print(
                "⚠️ Erreur: `channel_layer` est None. Channels est-il bien configuré ?"
            )

        player_info = {
            "channel_name": self.consumer.channel_name,
            "user_id": user.id if user.is_authenticated else None,
            "username": user.username if user.is_authenticated else "Anonymous",
        }

        if player_info not in self.consumer.rooms[self.consumer.room]["players"]:
            self.consumer.rooms[self.consumer.room]["players"].append(player_info)

        # Lancement en tâche de fond pour pouvoir l'annuler facilement en cas de déconnexion
        if self.consumer.game_mode == GameMode.ONLINE:
            self.consumer.manage_task = asyncio.create_task(
                self.consumer.manage_online_players()
            )
        else:
            self.consumer.isSourceOfTruth = False

        # print(f"rooms number: {len(self.consumer.rooms)}")
        for room, details in self.consumer.rooms.items():
            print(f"Room {room}: {details['players']}")
        if self.consumer.room not in self.consumer.game_loops:
            print(f"🚀 Lancement du game_loop pour la salle {self.consumer.room}")
            self.consumer.game_loops[self.consumer.room] = asyncio.create_task(
                self.consumer.loop.game_loop(self.consumer.room)
            )
        else:
            print(f"⚠️ game_loop déjà actif pour {self.consumer.room}")

    async def initializeRoom(self):
        self.consumer.rooms[self.consumer.room] = copy.deepcopy(
            self.consumer.DEFAULT_STATE
        )
        self.consumer.rooms[self.consumer.room]["game_mode"] = self.consumer.game_mode
        try:
            self.consumer.rooms[self.consumer.room]["paddles"] = {
                "left": Paddle(initial_x=0),
                "right": Paddle(initial_x=0),
            }
            self.consumer.rooms[self.consumer.room]["ball"] = Ball()
        except Exception as e:
            print(f"⚠️ Erreur lors de l'initialisation de la salle : {e}")
            del self.consumer.rooms[self.consumer.room]  # Supprime la salle corrompue

    async def manage_online_players(self):
        if len(self.consumer.rooms[self.consumer.room]["players"]) <= 2:
            if len(self.consumer.rooms[self.consumer.room]["players"]) == 1:
                self.consumer.player_side = "left"
                self.consumer.isSourceOfTruth = True
                print(f"Assigned players to left side")
            else:
                self.consumer.player_side = "right"
                self.consumer.isSourceOfTruth = False
                print(f"Assigned players to right side")

            while (
                self.consumer.room in self.consumer.rooms
                and len(self.consumer.rooms[self.consumer.room]["players"]) < 2
                and len(self.consumer.rooms[self.consumer.room]["players"]) > 0
            ):
                print(
                    f"Waiting for second player, this is {self.consumer.channel_name}"
                )
                await asyncio.sleep(2)

            if len(self.consumer.rooms[self.consumer.room]["players"]) == 2:
                if all(
                    player["user_id"] is not None
                    for player in self.consumer.rooms[self.consumer.room]["players"]
                ):
                    # sending only to one player, as both of them will go through this function eventually
                    opponent_index = 1 if self.consumer.player_side == "left" else 0
                    opponent = self.consumer.rooms[self.consumer.room]["players"][
                        opponent_index
                    ]
                    print(f"Envoi des infos de l'adversaire: {opponent}")
                    await self.consumer.send_helpers.send(
                        text_data=json.dumps(
                            {
                                "type": "hasFoundOpponent",
                                "side": self.consumer.player_side,
                                "isSourceOfTruth": self.consumer.isSourceOfTruth,
                                "opponent_id": str(
                                    self.consumer.rooms[self.consumer.room]["players"][
                                        1 if self.consumer.player_side == "left" else 0
                                    ]["user_id"]
                                ),
                                "opponent_username": self.consumer.rooms[
                                    self.consumer.room
                                ]["players"][
                                    1 if self.consumer.player_side == "left" else 0
                                ][
                                    "username"
                                ],
                            },
                            cls=NumericEncoder,
                        )
                    )
                    print(f"Second player has been found")
            else:
                await self.consumer.close()

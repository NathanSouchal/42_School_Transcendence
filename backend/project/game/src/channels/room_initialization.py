import asyncio
import copy
import json
import uuid

from ..elements.ball import Ball
from ..elements.paddle import Paddle
from ..utils import GameMode, NumericEncoder


class RoomInitialization:
    def __init__(self, consumer):
        self.consumer = consumer
        self.previous_room = None

    async def setup_room(self):
        user = self.consumer.scope["user"]
        if self.consumer.game_mode == GameMode.ONLINE and not user.is_authenticated:
            await self.consumer.close()
            return

        await self.erase_rooms_containing_player(user)
        await self.cleanup_empty_rooms()

        roomFound = False
        if self.consumer.game_mode == GameMode.ONLINE:
            for room_name, room_data in self.consumer.rooms.items():
                if (
                    len(room_data["players"]) < 2
                    and room_data["game_mode"] == GameMode.ONLINE
                    and all(
                        player["user_id"] is not None for player in room_data["players"]
                    )
                    and all(
                        player["user_id"] != user.id for player in room_data["players"]
                    )
                ):
                    self.consumer.room = room_name
                    roomFound = True
                    print(f"✅ Found available room: {room_name}")
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
                "⚠️ `channel_layer` is None"
            )

        player_info = {
            "channel_name": self.consumer.channel_name,
            "user_id": user.id if user.is_authenticated else None,
            "username": user.username if user.is_authenticated else "Anonymous",
        }

        if player_info not in self.consumer.rooms[self.consumer.room]["players"]:
            self.consumer.rooms[self.consumer.room]["players"].append(player_info)

        if self.consumer.game_mode == GameMode.ONLINE:
            self.consumer.manage_task = asyncio.create_task(
                self.manage_online_players()
            )
        else:
            self.consumer.isSourceOfTruth = False

        for room, details in self.consumer.rooms.items():
            print(f"Room {room}: {details['players']}")
        if self.consumer.room not in self.consumer.game_loops:
            print(f"🚀 launching game_loop for room {self.consumer.room}")
            self.consumer.game_loops[self.consumer.room] = asyncio.create_task(
                self.consumer.loop.game_loop(self.consumer.room)
            )
        else:
            print(f"⚠️ game_loop already active for {self.consumer.room}")

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
            print(f"⚠️ Error when initializing room : {e}")
            del self.consumer.rooms[self.consumer.room]

    async def manage_online_players(self):
        self.previous_room = (
            self.consumer.room
            if self.consumer.game_mode == GameMode.BACKGROUND
            else None
        )
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
                if self.consumer.game_mode == GameMode.ONLINE:
                    opponent_index = 1 if self.consumer.player_side == "left" else 0
                    opponent = self.consumer.rooms[self.consumer.room]["players"][
                        opponent_index
                    ]
                    await self.consumer.send(
                        text_data=json.dumps(
                            {
                                "type": "hasFoundOpponent",
                                "side": self.consumer.player_side,
                                "isSourceOfTruth": self.consumer.isSourceOfTruth,
                                "opponent_id": str(opponent["user_id"]),
                                "opponent_username": opponent["username"],
                            },
                            cls=NumericEncoder,
                        )
                    )
                    print("Second player has been found")
                else:
                    if self.previous_room:
                        print(f"Stopping BACKGROUND room {self.previous_room}")
                        del self.consumer.rooms[self.previous_room]
                        self.previous_room = None
                        opponent_index = 1 if self.consumer.player_side == "left" else 0
                        opponent = self.consumer.rooms[self.consumer.room]["players"][
                            opponent_index
                        ]
                        await self.consumer.send(
                            text_data=json.dumps(
                                {
                                    "type": "hasFoundOpponent",
                                    "side": self.consumer.player_side,
                                    "isSourceOfTruth": self.consumer.isSourceOfTruth,
                                    "opponent_id": str(opponent["user_id"]),
                                    "opponent_username": opponent["username"],
                                },
                                cls=NumericEncoder,
                            )
                        )
                        print("Second player has been found")
            else:
                await self.reactivate_background_mode()

    async def reactivate_background_mode(self):
        if self.consumer.room in self.consumer.game_loops:
            self.consumer.game_loops[self.consumer.room].cancel()
            try:
                await self.consumer.game_loops[self.consumer.room]
            except asyncio.CancelledError:
                print(f"Old game_loop cancelled for room {self.consumer.room}")
            del self.consumer.game_loops[self.consumer.room]

        await self.initializeRoom()

        print(f"🚀 Restarting game loop for BACKGROUND room {self.consumer.room}")
        self.consumer.game_loops[self.consumer.room] = asyncio.create_task(
            self.consumer.loop.game_loop(self.consumer.room)
        )

    async def erase_rooms_containing_player(self, user):
        if user.id is None:
            return

        for room_name, room_data in self.consumer.rooms.items():
            for player in list(room_data["players"]):
                if player["user_id"] == user.id:
                    room_data["players"].remove(player)
                    print(f"Removed user {user.username} from room {room_name}")


    async def cleanup_empty_rooms(self):
        empty_rooms = [
            room_name
            for room_name, room_data in self.consumer.rooms.items()
            if len(room_data["players"]) == 0
        ]
        for room_name in empty_rooms:
            del self.consumer.rooms[room_name]
            if room_name in self.consumer.game_loops:
                self.consumer.game_loops[room_name].cancel()
                del self.consumer.game_loops[room_name]

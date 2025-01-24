import json

from channels.generic.websocket import AsyncWebsocketConsumer


class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_room = "pong_game"
        await self.channel_layer.group_add(self.game_room, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.game_room, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        game_event = data.get("type")

        if game_event == "player_move":
            await self.channel_layer.group_send(
                self.game_room,
                {
                    "type": "update_player_position",
                    "player": data["player"],
                    "y": data["y"],
                },
            )

    async def update_player_position(self, event):
        await self.send(
            text_data=json.dumps(
                {"type": "player_move", "player": event["player"], "y": event["y"]}
            )
        )

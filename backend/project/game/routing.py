from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"^wss/game/(?P<room_id>[^/]+)?/?$", consumers.GameState.as_asgi()),
]

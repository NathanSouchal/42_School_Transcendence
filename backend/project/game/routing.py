from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/pong/room1/$", consumers.GameState.as_asgi()),
]

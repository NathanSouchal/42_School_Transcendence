from django.urls import re_path

from .src.channels import consumers

websocket_urlpatterns = [
    re_path(r"^ws/game/(?P<room_id>[^/]+)?/?$", consumers.GameState.as_asgi()),
]

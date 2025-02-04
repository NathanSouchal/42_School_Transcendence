from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/local/(?P<room_id>[^/]+)/$", consumers.GameState.as_asgi()),
    re_path(r"^ws/online/(?P<room_id>[^/]+)?/?$", consumers.GameState.as_asgi()),
    re_path(r"^ws/bg/$", consumers.GameState.as_asgi()),
]

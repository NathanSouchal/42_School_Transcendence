from django.contrib import admin
from django.urls import path
from django.conf.urls import include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/', include("api.router.user_router")),
    path('api/game/', include("api.router.game_router")),
    path('api/auth/', include("api.router.auth_router")),
    path('api/tournament/', include("api.router.tournament_router")),
    path('api/match/', include("api.router.match_router")),
    path('api/stats/', include("api.router.stats_router")),
    path('api/match-history/', include("api.router.match_history_router")),
    path('api/friend-requests/', include("api.router.friend_requests_router")),
    path('api/friends/', include("api.router.friends_router")),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

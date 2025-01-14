from django.contrib import admin
from django.urls import path
from django.conf.urls import include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('user/', include("api.router.user_router")),
    path('game/', include("api.router.game_router")),
    path('auth/', include("api.router.auth_router")),
    path('tournament/', include("api.router.tournament_router")),
    path('match/', include("api.router.match_router")),
    path('stats/', include("api.router.stats_router")),
    path('match-history/', include("api.router.match_history_router"))
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

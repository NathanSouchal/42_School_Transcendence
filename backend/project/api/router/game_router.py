from django.urls import path
from api.views import GameView, GameListView

urlpatterns = [
	path('<int:id>/', GameView.as_view(), name = 'game_detail'),
	path('list/', GameListView.as_view(), name = 'game_list')
]

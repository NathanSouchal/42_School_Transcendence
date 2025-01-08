from django.urls import path
from api.views import TournamentListView, TournamentView

urlpatterns = [
	path('<int:id>/', TournamentView.as_view(), name = 'TournamentView'),
	path('list/', TournamentListView.as_view(), name = 'TournamentListView'),
]

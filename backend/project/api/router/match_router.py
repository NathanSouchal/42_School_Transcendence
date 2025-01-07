from django.urls import path
from api.views import MatchView, MatchListView

urlpatterns = [
	path('<int:id>/', MatchView.as_view(), name = 'MatchView'),
	path('list/', MatchListView.as_view(), name = 'MatchListView'),
]

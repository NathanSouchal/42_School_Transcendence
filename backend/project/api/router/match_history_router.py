from django.urls import path
from api.views import MatchHistoryView

urlpatterns = [
	path('<uuid:id>/', MatchHistoryView.as_view(), name = 'match_history'),
]

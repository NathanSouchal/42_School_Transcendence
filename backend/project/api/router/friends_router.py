from django.urls import path
from api.views import FriendsView

urlpatterns = [
	path('<int:id>/', FriendsView.as_view(), name = 'friends_router'),
]

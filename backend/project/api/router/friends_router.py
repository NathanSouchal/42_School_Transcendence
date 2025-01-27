from django.urls import path
from api.views import FriendsView, FriendView

urlpatterns = [
	path('<int:id>/', FriendsView.as_view(), name = 'friends_router'),
	path('friend/<int:friend_id>/', FriendView.as_view(), name = 'friend_route')
]

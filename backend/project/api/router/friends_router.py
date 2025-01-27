from django.urls import path
from api.views import FriendListView, FriendView

urlpatterns = [
	path('list/<int:id>/', FriendListView.as_view(), name = 'friend_list_route'),
	path('friend/<int:friend_id>/', FriendView.as_view(), name = 'friend_route')
]

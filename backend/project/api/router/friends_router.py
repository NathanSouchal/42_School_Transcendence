from django.urls import path
from api.views import FriendListView, FriendView

urlpatterns = [
	path('list/<uuid:id>/', FriendListView.as_view(), name = 'friend_list_route'),
	path('friend/<uuid:friend_id>/', FriendView.as_view(), name = 'friend_route')
]

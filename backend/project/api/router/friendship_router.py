from django.urls import path
from api.views import FriendshipView, FriendshipListView

urlpatterns = [
	path('<int:id>/', FriendshipView.as_view(), name = 'Friendship_detail'),
	path('list/', FriendshipListView.as_view(), name = 'Friendship_list')
]

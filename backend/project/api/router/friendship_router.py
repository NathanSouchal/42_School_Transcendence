from django.urls import path
from api.views import FriendshipView, FriendshipListView, FriendshipByUserView

urlpatterns = [
	path('<int:id>/', FriendshipView.as_view(), name = 'Friendship_detail'),
	path('list/', FriendshipListView.as_view(), name = 'Friendship_list'),
	path('byuser/<int:id>/', FriendshipByUserView.as_view(), name = 'FriendshipByUser'),
]

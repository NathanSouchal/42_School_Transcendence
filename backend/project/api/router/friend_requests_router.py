from django.urls import path
from api.views import FriendRequestView, FriendRequestCreateView, FriendRequestsByUserView

urlpatterns = [
	path('<int:id>/', FriendRequestView.as_view(), name = 'friend_request_detail'),
	path('create/', FriendRequestCreateView.as_view(), name = 'friend_request_create'),
	path('byuser/<int:id>/', FriendRequestsByUserView.as_view(), name = 'friend_requests_by_user'),
]

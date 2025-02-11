from django.urls import path
from api.views import UserView, UserListView, PublicUserView, UserByNameView

urlpatterns = [
	path('<uuid:id>/', UserView.as_view(), name='user_detail'),
	path('<str:username>/', UserByNameView.as_view(), name='user_detail'),
	path('list/', UserListView.as_view(), name='user_list'),
	path('public-profile/<uuid:id>/', PublicUserView.as_view(), name='user_list'),
]

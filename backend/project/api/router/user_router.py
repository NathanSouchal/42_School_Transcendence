from django.urls import path
from api.views import RegisterView, LoginView, UserView, UserListView, PublicUserView, UserByNameView

urlpatterns = [
	path('register/', RegisterView.as_view(), name='register'),
	path('login/', LoginView.as_view(), name='login'),
	path('<int:id>/', UserView.as_view(), name='user_detail'),
	path('<str:username>/', UserByNameView.as_view(), name='user_detail'),
	path('list/', UserListView.as_view(), name='user_list'),
	path('public-profile/<int:id>/', PublicUserView.as_view(), name='user_list'),
]

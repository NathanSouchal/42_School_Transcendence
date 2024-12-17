from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import RefreshTokenView, AccessTokenView

urlpatterns = [
	# path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('custom-token/refresh/', RefreshTokenView.as_view(), name='custom_token_refresh'),
    path('custom-token/access/', AccessTokenView.as_view(), name='custom_token_access'),
]

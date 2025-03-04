from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import RefreshTokenView, AccessTokenView, RegisterView, LoginView, LogoutView, IsAuthView, Verify2FAView, GenerateTOTPQRCodeView

urlpatterns = [
	# path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('custom-token/refresh/', RefreshTokenView.as_view(), name='custom_token_refresh'),
    path('custom-token/access/', AccessTokenView.as_view(), name='custom_token_access'),
	path('register/', RegisterView.as_view(), name='register'),
	path('login/', LoginView.as_view(), name='login'),
	path('logout/', LogoutView.as_view(), name='logout'),
	path('is-auth/', IsAuthView.as_view(), name='is_auth'),
	path('verify-2fa/', Verify2FAView.as_view(), name='verify_2FA_view'),
	path('generate-qrcode/', GenerateTOTPQRCodeView.as_view(), name='generate_totpqrcode_view'),
]

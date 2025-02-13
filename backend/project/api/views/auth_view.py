from rest_framework import status
import random
from django.utils.timezone import now
from django.core.mail import send_mail
from twilio.rest import Client
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from api.models import RefreshToken as UserRefreshToken
from api.serializers import UserSerializer
from api.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from django.db import transaction
from api.authentication import CookieJWTAuthentication
from django.db import IntegrityError
from rest_framework_simplejwt.tokens import RefreshToken as SimpleJWTRefreshToken, TokenError
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

class RegisterView(APIView):
	serializer_class = UserSerializer
	permission_classes = [AllowAny]

	def post(self, request):
		serializer = UserSerializer(data=request.data)
		username = request.data.get('username')
		password = request.data.get('password')
		print(f"Registering user: {username}, Password: {password}")
		if serializer.is_valid():
			try:
				serializer.save()
				return Response({'message': 'User registered'}, status=status.HTTP_201_CREATED)
			except IntegrityError:
				return Response(
                    {'error': 'Username is already taken.'},
                    status=status.HTTP_409_CONFLICT
                )
			except Exception as e:
				return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
	serializer_class = UserSerializer
	permission_classes = [AllowAny]

	def post(self, request):
		username = request.data.get('username')
		password = request.data.get('password')
		print(f"Authenticating user: {username}")
		print(f"Authenticating password: {password}")
		user = authenticate(username=username, password=password)
		if user is None:
			return Response({'error': 'Wrong credentials'}, status=status.HTTP_401_UNAUTHORIZED)
		if user.two_factor_method and user.two_factor_method != "none":
			request.session['pre_auth_user'] = str(user.id)
			if user.two_factor_method == "email":
				# self.send_email_otp(user)
				return Response({"message": "2FA_REQUIRED", "method": "email"}, status=status.HTTP_200_OK)

			if user.two_factor_method == "sms":
				if not user.phone_number:
					return Response({"error": "No phone number associated with this account"}, status=status.HTTP_400_BAD_REQUEST)
				self.send_sms_otp(user)
				return Response({"message": "2FA_REQUIRED", "method": "sms"}, status=status.HTTP_200_OK)

			if user.two_factor_method == "TOTP":
				return Response({"message": "2FA_REQUIRED", "method": "TOTP"}, status=status.HTTP_200_OK)

		return self.generate_jwt_response(user)

	def send_email_otp(self, user):
		code = random.randint(100000, 999999)
		user.email_otp = code
		user.otp_created_at = now()
		user.save()
		send_mail('Your 2FA verification code', f'Your 2FA verification code is : {code}', settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False,)

	def send_sms_otp(self, user):
		code = random.randint(100000, 999999)
		user.email_otp = code
		user.otp_created_at = now()
		user.save()
		client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
		client.message.create(body=f"Your 2FA code is : {code}", from_=settings.TWILIO_PHONE_NUMBER, to=user.phone_number,)


	def generate_jwt_response(self, user):
		try:
			refresh_token = user.refresh_token.token
			print(f"Existing refresh token: {refresh_token}")
			outstanding_token = OutstandingToken.objects.get(token=refresh_token)
			BlacklistedToken.objects.create(token=outstanding_token)
			print("Existing refresh token blacklisted.")
		except (UserRefreshToken.DoesNotExist, OutstandingToken.DoesNotExist):
			pass

		new_refresh_token = SimpleJWTRefreshToken.for_user(user)
		UserRefreshToken.objects.update_or_create(user=user, defaults={'token': str(new_refresh_token)})

		response = Response({
			'user': UserSerializer(user).data,
			'message': 'Authentification complète'
		}, status=status.HTTP_200_OK)

		# Ajouter les cookies sécurisés
		response.set_cookie(
		key='access_token',
		value=str(new_refresh_token.access_token),
		httponly=True,
		secure=True,
		samesite='None',
		max_age=10 * 60  # 10 minutes
		)
		response.set_cookie(
		key='refresh_token',
		value=str(new_refresh_token),
		httponly=True,
		secure=True,
		samesite='None',
		max_age=7 * 24 * 60 * 60  # 7 jours
		)
		return response

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def post(self, request):
        try:
            user = request.user
            try:
                old_refresh_token = user.refresh_token.token
                outstanding_token = OutstandingToken.objects.get(token=old_refresh_token)
                print(f"Old refresh token found: {old_refresh_token}")
                BlacklistedToken.objects.create(token=outstanding_token)
                user.refresh_token.delete()
                print("Old refresh token blacklisted.")
            except (UserRefreshToken.DoesNotExist, OutstandingToken.DoesNotExist):
                print("No refresh token found in DB for this user.")
                pass

            response = Response({'message': 'User disconnected'}, status=status.HTTP_200_OK)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            return response
        except Exception as e:
            print(f"Logout error: {e}")
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshTokenView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def post(self, request):
        print(f"Cookies reçus : {request.COOKIES}")
        user = request.user
        old_refresh_token = request.COOKIES.get('refresh_token')
        if not old_refresh_token:
            return Response({'detail': 'Refresh token not found'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            stored_refresh_token = user.refresh_token.token
            if old_refresh_token != stored_refresh_token:
                return Response({'detail': 'Invalid refresh token (mismatch)'}, status=status.HTTP_401_UNAUTHORIZED)

            outstanding_token = OutstandingToken.objects.get(token=stored_refresh_token)
            BlacklistedToken.objects.create(token=outstanding_token)
            user.refresh_token.delete()

            new_refresh_token = SimpleJWTRefreshToken.for_user(user)
            UserRefreshToken.objects.create(user=user, token=str(new_refresh_token))

            response = Response({
				'user': UserSerializer(user).data,
				'message': 'New refresh token generated'
			}, status=status.HTTP_200_OK)

            response.set_cookie(
				key='refresh_token',
				value=str(new_refresh_token),
				httponly=True,
				secure=True,
				samesite='None',
				max_age=7 * 24 * 60 * 60
			)
            return response
        except OutstandingToken.DoesNotExist:
            return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            print(f"Refresh Token error: {e}")
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AccessTokenView(APIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        cookie_refresh_token = request.COOKIES.get('refresh_token')
        if not cookie_refresh_token:
            return Response({'error': 'Refresh token not found'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            db_refresh_token = UserRefreshToken.objects.get(token=cookie_refresh_token)
            user = db_refresh_token.user

            try:
                token_instance = SimpleJWTRefreshToken(cookie_refresh_token)
            except TokenError:
                return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
            try:
                outstanding_token = OutstandingToken.objects.get(jti=token_instance['jti'])
                if BlacklistedToken.objects.filter(token=outstanding_token).exists():
                    return Response({'error': 'Token is already blacklisted'}, status=status.HTTP_401_UNAUTHORIZED)
            except OutstandingToken.DoesNotExist:
                return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

            refresh_token_instance = SimpleJWTRefreshToken.for_user(user)
            new_access_token = str(refresh_token_instance.access_token)
            response = Response({
                'user': UserSerializer(user).data,
				'message': 'Access token successfully refreshed.'
			}, status=status.HTTP_200_OK)
            response.set_cookie(
				key='access_token',
				value=new_access_token,
				httponly=True,
				secure=True,
				samesite='None',
				max_age=10 * 60
			)
            return response
        except UserRefreshToken.DoesNotExist:
            return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            print(f"Access Token error: {e}")
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class IsAuth(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			user = request.user
			return Response({'user authenticated': UserSerializer(user).data, 'user_id': user.id}, status=status.HTTP_200_OK)
		except AuthenticationFailed:
			return Response({'error': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

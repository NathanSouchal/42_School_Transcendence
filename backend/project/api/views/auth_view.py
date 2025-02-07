from rest_framework import status
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
            print("Received data:", request.data)
            username = request.data.get('username')
            password = request.data.get('password')
            print(f"Authenticating user: {username}")
            print(f"Authenticating password: {password}")
            user = authenticate(username=username, password=password)
            if user:
                try:
                    refresh_token = user.refresh_token
                    print(f"Existing refresh token: {refresh_token.token}")
                except UserRefreshToken.DoesNotExist:
                    refresh_token = UserRefreshToken.objects.create(user=user)
                    print(f"New refresh token created for user {user.username}")
                if refresh_token and refresh_token.token:
                   old_refresh_token = refresh_token.token
                   if not BlacklistedToken.objects.filter(token=old_refresh_token).exists():
                      refresh_token_instance = SimpleJWTRefreshToken(old_refresh_token)
                      refresh_token_instance.blacklist()
                      print("Old refresh token blacklisted.")

                # Créer un nouveau refresh token pour l'utilisateur
                new_refresh_token = SimpleJWTRefreshToken.for_user(user)
                refresh_token.token = str(new_refresh_token)
                refresh_token.save()

                # Construire la réponse de succès
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

        # Si l'authentification échoue
            return Response({'error': 'Wrong credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def post(self, request):
        try:
            user = request.user
            try:
                old_refresh_token = user.refresh_token
                if old_refresh_token:
                    refresh_token = SimpleJWTRefreshToken(old_refresh_token.token)
                    refresh_token.blacklist()
                    print("Old refresh token blacklisted.")
            except UserRefreshToken.DoesNotExist:
				# Aucun ancien refresh token à mettre en blacklist
                pass

            response = Response({'message': 'User disconnected'}, status=status.HTTP_200_OK)
            response.delete_cookie('access_token', httponly=True, secure=True, samesite='None')
            response.delete_cookie('refresh_token', httponly=True, secure=True, samesite='None')
            return response
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshTokenView(APIView):
	permission_classes = [IsAuthenticated]
	authentication_classes = [CookieJWTAuthentication]

	def post(self, request):
		print(f"Cookies reçus : {request.COOKIES}")
		# here check if user ?
		user = request.user
		old_refresh_token = request.COOKIES.get('refresh_token')
		if not old_refresh_token:
			return Response({'detail': 'Refresh token not found'}, status=status.HTTP_401_UNAUTHORIZED)
		try:
			stored_refresh_token = user.refresh_token.token
			if old_refresh_token != stored_refresh_token:
				return Response({'detail': 'Invalid refresh token (mismatch)'}, status=status.HTTP_401_UNAUTHORIZED)

            # Vérification et blacklisting de l'ancien token
			try:
				outstanding_token = OutstandingToken.objects.get(token=user.refresh_token.token)
				if not outstanding_token:
					return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
				if BlacklistedToken.objects.filter(token=outstanding_token).exists():
					return Response({'error': 'Token is already blacklisted'}, status=status.HTTP_401_UNAUTHORIZED)

					# Blacklister et supprimer l'ancien refresh token
				SimpleJWTRefreshToken(user.refresh_token.token).blacklist()
				print("Old refresh token blacklisted.")
				user.refresh_token.delete()
			except AttributeError:
				return Response({'error': 'Error checking token blacklist'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

			# Générer un nouveau token
			new_refresh_token = SimpleJWTRefreshToken.for_user(user)

			# Remplacer le nouveau token en base
			with transaction.atomic():
				user.refresh_token.token = str(new_refresh_token)
				user.refresh_token.save()

			# Construire la réponse
			response = Response({
				'user': UserSerializer(user).data,
				'message': 'New refresh token generated'
			}, status=status.HTTP_200_OK)

			# Mettre à jour les cookies
			response.set_cookie(
				key='refresh_token',
				value=str(new_refresh_token),
				httponly=True,
				secure=True,
				samesite='None',
				max_age=7 * 24 * 60 * 60
			)
			return response
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AccessTokenView(APIView):
	serializer_class = UserSerializer
	permission_classes = [AllowAny]

	def post(self, request):
		cookie_refresh_token = request.COOKIES.get('refresh_token')
		if not cookie_refresh_token:
			return Response({'detail': 'Refresh token not found'}, status=status.HTTP_401_UNAUTHORIZED)
		try:
			db_refresh_token = UserRefreshToken.objects.get(token=cookie_refresh_token)
			user = db_refresh_token.user
			if cookie_refresh_token != str(db_refresh_token.token):
				return Response({'detail': 'Invalid refresh token (mismatch)'}, status=status.HTTP_401_UNAUTHORIZED)
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
				max_age=15 * 60
			)
			return response
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class IsAuth(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			user = request.user
			return Response({'user authenticated': UserSerializer(user).data}, status=status.HTTP_200_OK)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

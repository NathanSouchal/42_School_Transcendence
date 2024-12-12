from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.core.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken as SimpleJWTRefreshToken
from api.models import Game, User, RefreshToken
from api.serializers import UserSerializer
from api.serializers import GameSerializer
from api.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import Http404
from django.db.models import ProtectedError


class RegisterView(APIView):
	serializer_class = UserSerializer
	permission_classes = [AllowAny]

	def post(self, request):
		serializer = UserSerializer(data=request.data)
		username = request.data.get('username')
		password = request.data.get('password')
		print(f"Registering user: {username}, Password: {password}")
		if serializer.is_valid():
			serializer.save()
			return Response({'message': 'User registered'}, status=status.HTTP_201_CREATED)
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
			refresh = SimpleJWTRefreshToken.for_user(user)
			refresh_token, created = RefreshToken.objects.get_or_create(user=user, defaults={'token': str(refresh)})
			refresh_token.token = str(refresh)
			refresh_token.save()
			response = Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'message': 'Authentification complete'
            }, status=status.HTTP_200_OK)

			response.set_cookie(
				key='access_token',
				value=str(refresh.access_token),  # Le refresh token
				httponly=True,  # Empêche l'accès via JavaScript
				secure=True,  # Assure le transport uniquement via HTTPS
				samesite='Strict',  # Bloque les cookies cross-site (modifiez à `Strict` selon vos besoins)
				max_age=15 * 60  # Durée de validité en secondes
			)
			return response
		return Response({'error': 'Wrong credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class RefreshTokenView(APIView):
	def post(self, request):
		refresh_token = request.COOKIES.get('refresh_token')
		if not refresh_token:
			return Response({'detail': 'Refresh token not found'}, status=status.HTTP_401_UNAUTHORIZED)
		try:
			token = RefreshToken(refresh_token)
			new_access_token = str(token.access_token)
			return Response({'access': new_access_token}, status=status.HTTP_200_OK)
		except Exception as e:
			return Response({'detail': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

class UserView(APIView):
	serializer_class = UserSerializer
	permission_classes = [IsAuthenticated]
	authentication_classes = [JWTAuthentication]

	def get(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			return Response({'user': UserSerializer(user).data}, status=status.HTTP_200_OK)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'user': UserSerializer(user).data, 'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def delete(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			user.delete()
			return Response({'user': UserSerializer(user).data, 'message': f'User with id {id} has been deleted.'}, status=status.HTTP_200_OK)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'user': UserSerializer(user).data, 'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def put(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			user.username = request.data.get('username')
			user.save()
			return Response({'user': UserSerializer(user).data, 'message': 'User modified'}, status=status.HTTP_200_OK)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'user': UserSerializer(user).data, 'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			users = User.objects.all()
			serialized_users = UserSerializer(users, many=True)
			return Response({'users': serialized_users.data}, status=status.HTTP_200_OK)
		except Exception as e:
			return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        try:
            game = get_object_or_404(Game, id=id)
            return Response({'game': GameSerializer(game).data}, status=status.HTTP_200_OK)
        except Http404:
            return Response({'error': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, id=None):
        try:
            game = get_object_or_404(Game, id=id)
            serializer = GameSerializer(game, data=request.data, partial=True)
            if serializer.is_valid():
                game = serializer.save()
                return Response({'game': GameSerializer(game).data, 'message': f'Game with id {id} has been modified.'}, status=status.HTTP_200_OK)
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Http404:
            return Response({'error': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, id=None):
        try:
            game = get_object_or_404(Game, id=id)
            game.delete()
            return Response({'message': f'Game with id {id} has been deleted.'}, status=status.HTTP_200_OK)
        except Http404:
            return Response({'error': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND)
        except ProtectedError as protected_error:
            return Response({'error': f'Deletion failed due to related objects: {str(protected_error)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GameListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			games = Game.objects.all()
			serialized_games = GameSerializer(games, many=True)
			return Response({'games': serialized_games.data}, status=status.HTTP_200_OK)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def post(self, request):
		try:
			serializer = GameSerializer(data=request.data)
			if serializer.is_valid():
				game = serializer.save()
				return Response({'game': GameSerializer(game).data, 'message': 'Game created successfully.'}, status=status.HTTP_201_CREATED)
			return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

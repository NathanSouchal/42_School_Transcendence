from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken as SimpleJWTRefreshToken
from api.models import Game, User, Tournament, Match
from api.models import RefreshToken as UserRefreshToken
from api.serializers import UserSerializer, TournamentSerializer, GameSerializer, MatchSerializer
from api.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.http import Http404
from django.db.models import ProtectedError
from api.authentication import CookieJWTAuthentication
from .models import RefreshToken as UserRefreshToken
from django.db import IntegrityError


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
				old_refresh_token = user.refresh_token
				if old_refresh_token:
					# Mettre l'ancien refresh token en blacklist
					refresh_token = SimpleJWTRefreshToken(old_refresh_token.token)
					refresh_token.blacklist()  # Si vous avez activé le blacklisting des tokens
					print("Old refresh token blacklisted.")
			except UserRefreshToken.DoesNotExist:
				# Aucun ancien refresh token à mettre en blacklist
				pass
			refresh = SimpleJWTRefreshToken.for_user(user)
			refresh_token, created = UserRefreshToken.objects.get_or_create(user=user, defaults={'token': str(refresh)})
			refresh_token.token = str(refresh)
			refresh_token.save()
			response = Response({
				'user': UserSerializer(user).data,
				'message': 'Authentification complete'
			}, status=status.HTTP_200_OK)

			response.set_cookie(
				key='access_token',
				value=str(refresh.access_token),  # Le refresh token
				httponly=True,  # Empêche l'accès via JavaScript
				secure=True,  # Assure le transport uniquement via HTTPS
				samesite='None',  # Bloque les cookies cross-site (modifiez à `Strict` selon vos besoins)
				max_age=1 * 60  # Durée de validité en secondes
			)
			response.set_cookie(
				key='refresh_token',
				value=str(refresh),  # Le refresh token
				httponly=True,  # Empêche l'accès via JavaScript
				secure=True,  # Assure le transport uniquement via HTTPS
				samesite='None',  # Bloque les cookies cross-site (modifiez à `Strict` selon vos besoins)
				max_age=7 * 24 * 60 * 60  # Durée de validité en secondes
			)
			return response
		return Response({'error': 'Wrong credentials'}, status=status.HTTP_401_UNAUTHORIZED)

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
			# Valider et révoquer l'ancien token
			refresh_token_instance = SimpleJWTRefreshToken(old_refresh_token)
			refresh_token_instance.blacklist()
			print("Old refresh token blacklisted.")

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
			return Response({'detail': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

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
			return Response({'detail': 'Invalid refresh token', 'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class UserView(APIView):
	serializer_class = UserSerializer
	permission_classes = [IsAuthenticated]

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
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
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
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
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
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def delete(self, request, id=None):
		try:
			game = get_object_or_404(Game, id=id)
			game.delete()
			return Response({'message': f'Game with id {id} has been deleted.'}, status=status.HTTP_200_OK)
		except Http404:
			return Response({'error': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
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
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def post(self, request):
		try:
			serializer = GameSerializer(data=request.data)
			if serializer.is_valid():
				game = serializer.save()
				return Response({'game': GameSerializer(game).data, 'message': 'Game created successfully.'}, status=status.HTTP_201_CREATED)
			return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TournamentView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, id=None):
		try:
			tournament = get_object_or_404(Tournament, id=id)
			return Response({'tournament': TournamentSerializer(tournament).data}, status=status.HTTP_200_OK)
		except Http404:
			return Response({'error': 'Tournament not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def put(self, request, id=None):
		try:
			tournament = get_object_or_404(Tournament, id=id)
			serializer = TournamentSerializer(tournament, data=request.data, partial=True)
			if serializer.is_valid():
				tournament = serializer.save()
				return Response({'tournament': TournamentSerializer(tournament).data, 'message': f'Tournament with id {id} has been modified.'}, status=status.HTTP_200_OK)
			return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		except Http404:
			return Response({'error': 'Tournament not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def delete(self, request, id=None):
		try:
			tournament = get_object_or_404(Tournament, id=id)
			tournament.delete()
			return Response({'message': f'Tournament with id {id} has been deleted.'}, status=status.HTTP_200_OK)
		except Http404:
			return Response({'error': 'Tournament not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except ProtectedError as protected_error:
			return Response({'error': f'Deletion failed due to related objects: {str(protected_error)}'}, status=status.HTTP_400_BAD_REQUEST)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		
class TournamentListView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		try:
			tournaments = Tournament.objects.all()
			serialized_tournaments = TournamentSerializer(tournaments, many=True)
			return Response({'tournaments': serialized_tournaments.data}, status=status.HTTP_200_OK)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		
	def post(self, request):
		try:
			serializer = TournamentSerializer(data=request.data)
			if serializer.is_valid():
				tournament = serializer.save()
				tournament.start_tournament()
				firstMatch = Match.objects.get(id = tournament.rounds_tree[0][0])
				return Response(
                    {'message': 'Tournament created successfully', 'tournament': TournamentSerializer(tournament).data,
					 'FirstMatch': MatchSerializer(firstMatch).data},
                    status=status.HTTP_201_CREATED)
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.core.exceptions import PermissionDenied
from api.models import User
from api.models import Game
from api.serializers import UserSerializer
from api.serializers import GameSerializer
from api.permissions import IsAuthenticated
# from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


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

@method_decorator(csrf_exempt, name='dispatch')
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
			refresh = RefreshToken.for_user(user)
			return Response({'user': UserSerializer(user).data, 'refresh': str(refresh), 'access': str(refresh.access_token), 'message': 'Authentification complete'}, status=status.HTTP_200_OK)
		return Response({'error': 'Wrong credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class UserView(APIView):
	serializer_class = UserSerializer
	permission_classes = [IsAuthenticated]

	def get(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			refresh = RefreshToken.for_user(user)
			return Response({'user': UserSerializer(user).data, 'refresh': str(refresh), 'access': str(refresh.access_token)}, status=status.HTTP_200_OK)
		except Exception as e:
			refresh = RefreshToken.for_user(user)
			return Response({'user': UserSerializer(user).data, 'refresh': str(refresh), 'access': str(refresh.access_token), 'error': f'An error has occured : {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def delete(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			user.delete()
			refresh = RefreshToken.for_user(user)
			return Response({'user': UserSerializer(user).data, 'refresh': str(refresh), 'access': str(refresh.access_token), 'message': f'User with id {id} has been deleted.'}, status=status.HTTP_200_OK)

		except Exception as e:
			refresh = RefreshToken.for_user(user)
			return Response({'user': UserSerializer(user).data, 'refresh': str(refresh), 'access': str(refresh.access_token), 'error': f'An error has occured : {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def put(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			user.username = request.data.get('username')
			#user.password = request.data.get('password')
			user.save()
			refresh = RefreshToken.for_user(user)
			return Response({'user': UserSerializer(user).data, 'refresh': str(refresh), 'access': str(refresh.access_token), 'message': 'User modified'}, status=status.HTTP_200_OK)
		except Exception as e:
			refresh = RefreshToken.for_user(user)
			return Response({'user': UserSerializer(user).data, 'refresh': str(refresh), 'access': str(refresh.access_token), 'error': f'An error has occured : {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        game = get_object_or_404(Game, id=id)
        return Response({'game': GameSerializer(game).data}, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = GameSerializer(data=request.data)
        if serializer.is_valid():
            game = serializer.save()
            return Response({'game': GameSerializer(game).data, 'message': 'Game created successfully.'}, status=status.HTTP_201_CREATED)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, id=None):
        game = get_object_or_404(Game, id=id)
        serializer = GameSerializer(game, data=request.data, partial=True)  # partial=True permet de ne mettre à jour que certains champs
        if serializer.is_valid():
            game = serializer.save()
            return Response({'game': GameSerializer(game).data, 'message': f'Game with id {id} has been modified.'}, status=status.HTTP_200_OK)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id=None):
        game = get_object_or_404(Game, id=id)
        game.delete()
        return Response({'message': f'Game with id {id} has been deleted.'}, status=status.HTTP_200_OK)

class GameListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			games = Game.objects.all()
			serialized_games = GameSerializer(games, many=True)
			return Response({'users': serialized_games.data}, status=status.HTTP_200_OK)
		except Exception as e:
			return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from django.shortcuts import get_object_or_404
from api.models import Game
from api.serializers import GameSerializer
from api.permissions import IsAuthenticated
from django.http import Http404
from django.db.models import ProtectedError



class GameView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, id=None):
		try:
			game = get_object_or_404(Game, id=id)
			if request.user != game.player1 and request.user != game.player2 and not request.user.is_superuser:
				return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
			return Response({'game': GameSerializer(game).data}, status=status.HTTP_200_OK)
		except Http404:
			return Response({'error': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def put(self, request, id=None):
		try:
			if not request.user.is_superuser:
				return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
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
			if not request.user.is_superuser:
				return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
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
			if not request.user.is_superuser:
				return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
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
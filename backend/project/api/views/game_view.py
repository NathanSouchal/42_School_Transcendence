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
from rest_framework.permissions import AllowAny
from api.models import Stats


class GameView(APIView):
	permission_classes = [AllowAny]

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
	permission_classes = [AllowAny]

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
				game.player1.match_history.add(game)
				if game.player2:
					game.player2.match_history.add(game)
				self.update_stats(game)
				return Response({'game': GameSerializer(game).data, 'message': 'Game created successfully.'}, status=status.HTTP_201_CREATED)
			return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			print(f'An unexpected error occurred: {str(e)}')
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


	def update_stats(self, game):

		def update_player_stats(player, score, opponent_score):
			if player:
				stats, created = Stats.objects.get_or_create(user=player)

				if score > opponent_score:
					stats.wins += 1
				else:
					stats.losses += 1

				stats.last_game = game
				stats.nb_games = stats.calculate_nb_games()
				stats.win_ratio = stats.calculate_ratio()

				total_score = ((stats.nb_games - 1) * stats.average_score) + score
				stats.average_score = round(total_score / stats.nb_games, 2) if stats.nb_games > 0 else 0

				stats.save()

		update_player_stats(game.player1, game.score_player1, game.score_player2)
		update_player_stats(game.player2, game.score_player2, game.score_player1)

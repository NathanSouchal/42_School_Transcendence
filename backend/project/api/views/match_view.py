from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from django.shortcuts import get_object_or_404
from api.models import Match, Tournament
from api.serializers import MatchSerializer, TournamentSerializer
from rest_framework.permissions import AllowAny
from django.http import Http404


class MatchView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, id=None):
		try:
			match = get_object_or_404(Match, id=id)
			return Response({'match': MatchSerializer(match).data}, status=status.HTTP_200_OK)
		except Http404:
			return Response({'error': 'Match not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def put(self, request, id=None):
		try:
			match = get_object_or_404(Match, id=id)
			serializer = MatchSerializer(match, data=request.data, partial=True)
			if serializer.is_valid():
				match = serializer.save()
				if match.winner:
					match.put_winner_on_next_match()
					nextMatchToPlay = match.tournament.find_next_match_to_play(id)
					if nextMatchToPlay is None:
						match.tournament.is_finished
						return Response({'tournamentIsFinished': True, 'tournament': TournamentSerializer(match.tournament).data, 'message': 'tournament is finished.'}, status=status.HTTP_200_OK)
					return Response({'tournamentIsFinished': False, 'nextMatchToPlay': MatchSerializer(nextMatchToPlay).data, 'tournament': TournamentSerializer(nextMatchToPlay.tournament).data,
					   'message': f'Match with id {id} has been modified.'}, status=status.HTTP_200_OK)
				return Response({'match': MatchSerializer(match).data, 'message': f'Match with id {id} has been modified.'}, status=status.HTTP_200_OK)
			return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		except Http404:
			return Response({'error': 'Match not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MatchListView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		try:
			matches = Match.objects.all()
			serialized_matches = MatchSerializer(matches, many=True)
			return Response({'matches': serialized_matches.data}, status=status.HTTP_200_OK)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

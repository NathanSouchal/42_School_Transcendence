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
			# if request.user != match.tournament.creator and not request.user.is_superuser:
			# 	return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
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
			# if request.user != match.tournament.creator and not request.user.is_superuser:
			# 	return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
			serializer = MatchSerializer(match, data=request.data, partial=True)
			if serializer.is_valid():
				match = serializer.save()
				if match.winner:
					match.put_winner_on_next_match()
					nextMatchToPlay = match.tournament.find_next_match_to_play(id)
					if nextMatchToPlay is None:
						match.tournament.is_finished
						return Response({'tournamentIsFinished': True, 'tournament': TournamentSerializer(nextMatchToPlay.tournament).data, 'message': 'tournament is finished.'}, status=status.HTTP_200_OK)
					return Response({'tournamentIsFinished': False,'nextMatchToPlay': MatchSerializer(nextMatchToPlay).data, 'tournament': TournamentSerializer(nextMatchToPlay.tournament).data,
					   'message': f'Match with id {id} has been modified.'}, status=status.HTTP_200_OK)
				return Response({'match': MatchSerializer(match).data, 'message': f'Match with id {id} has been modified.'}, status=status.HTTP_200_OK)
			return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		except Http404:
			return Response({'error': 'Match not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	# Pas de delete, car un match sera delete seulement si son tournoi l'est, sinon il peut y avoir des problemes si un match est supprime au milieu d'un tournoi en cours
	# def delete(self, request, id=None):
	# 	try:
	# 		match = get_object_or_404(Match, id=id)
	# 		match.delete()
	# 		return Response({'message': f'Match with id {id} has been deleted.'}, status=status.HTTP_200_OK)
	# 	except Http404:
	# 		return Response({'error': 'Match not found.'}, status=status.HTTP_404_NOT_FOUND)
	# 	except AuthenticationFailed as auth_error:
	# 		return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
	# 	except ProtectedError as protected_error:
	# 		return Response({'error': f'Deletion failed due to related objects: {str(protected_error)}'}, status=status.HTTP_400_BAD_REQUEST)
	# 	except Exception as e:
	# 		return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		
class MatchListView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		try:
			# if not request.user.is_superuser:
			# 	return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
			matches = Match.objects.all()
			serialized_matches = MatchSerializer(matches, many=True)
			return Response({'matches': serialized_matches.data}, status=status.HTTP_200_OK)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		
	# Pas de post car un match peut etre creer seulement dans le cadre d'un tournoi

	# def post(self, request):
	# 	try:
	# 		serializer = MatchSerializer(data=request.data)
	# 		if serializer.is_valid():
	# 			match = serializer.save()
	# 			return Response(
    #                 {'message': 'Match created successfully', 'match': MatchSerializer(match).data},
    #                 status=status.HTTP_201_CREATED)
	# 		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	# 	except AuthenticationFailed as auth_error:
	# 		return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
	# 	except Exception as e:
	# 		return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
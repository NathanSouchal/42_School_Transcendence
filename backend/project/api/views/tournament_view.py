from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from django.shortcuts import get_object_or_404
from api.models import Tournament, Match
from api.serializers import TournamentSerializer, MatchSerializer
from rest_framework.permissions import AllowAny
from django.http import Http404
from django.db.models import ProtectedError


class TournamentView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, id=None):
		try:
			tournament = get_object_or_404(Tournament, id=id)
			firstMatch = Match.objects.get(id = tournament.rounds_tree[0][0])
			# if request.user != tournament.creator and not request.user.is_superuser:
			# 	return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
			return Response({'tournament': TournamentSerializer(tournament).data}, status=status.HTTP_200_OK)
		except Http404:
			return Response({'error': 'Tournament not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def put(self, request, id=None):
		try:
			# if not request.user.is_superuser:
			# 	return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
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
			# if not request.user.is_superuser:
			# 	return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
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
			# if not request.user.is_superuser:
			# 	return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
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
			print(f"Data : ${request.data}")
			if serializer.is_valid():
				tournament = serializer.save()
				tournament.start_tournament()
				print(f"Name: {tournament.name}")
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

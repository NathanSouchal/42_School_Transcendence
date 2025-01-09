from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from django.shortcuts import get_object_or_404
from api.models import User
from api.serializers import UserSerializer
from api.permissions import IsAuthenticated
from django.http import Http404
from django.db.models import ProtectedError
from rest_framework.permissions import AllowAny

class MatchHistoryView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			return Response({'match_history': UserSerializer(user).data['match_history']}, status=status.HTTP_200_OK)
		except Http404:
			return Response({'error': 'Match history not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from django.shortcuts import get_object_or_404
from api.models import User, Friendship
from api.serializers import UserSerializer
from api.permissions import IsAuthenticated
from django.http import Http404
from django.db.models import ProtectedError
from rest_framework.permissions import AllowAny
from django.db.models import Q

class FriendsView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			return Response({'friends': UserSerializer(user).data['friends']}, status=status.HTTP_200_OK)
		except Http404:
			return Response({'error': 'Match history not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FriendView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, friend_id):
		try:
			user = request.user
			friend = get_object_or_404(User, id=friend_id)
			if friend in user.friends.all():
				serializer = UserSerializer(friend)
				return (Response({"Friend": serializer.data}))
			else:
				return Response({"error": "This user is not in your friend list"}, status=status.HTTP_403_FORBIDDEN)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def delete(self, request, friend_id):
		try:
			user = request.user
			friend = get_object_or_404(User, id=friend_id)
			friendship = Friendship.objects.filter(Q(from_user=user, to_user=friend) | Q(from_user=friend, to_user=user)).first()
			if friendship:
				friendship.delete()
				user.friends.remove(friend)
				friend.friends.remove(user)
				return (Response({"message": "Friend deleted"}, status=status.HTTP_200_OK))
			else:
				return Response({"error": "This user is not in your friend list"}, status=status.HTTP_403_FORBIDDEN)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

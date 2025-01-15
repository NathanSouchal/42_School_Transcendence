from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from django.shortcuts import get_object_or_404
from api.models import User
from api.serializers import UserSerializer
from api.permissions import IsAuthenticated


class UserView(APIView):
	serializer_class = UserSerializer
	permission_classes = [IsAuthenticated]

	def get(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			if request.user != user and not request.user.is_superuser:
				return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
			return Response({'user': UserSerializer(user).data}, status=status.HTTP_200_OK)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def delete(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			if request.user != user and not request.user.is_superuser:
				return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
			user.delete()
			return Response({'user': UserSerializer(user).data, 'message': f'User with id {id} has been deleted.'}, status=status.HTTP_200_OK)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def put(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			if request.user != user and not request.user.is_superuser:
				return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
			# print(f"Data: {request.data}")
			serializer = UserSerializer(user, data=request.data, partial=True)
			if serializer.is_valid():
				user = serializer.save()
				return Response({'user': UserSerializer(user).data, 'message': 'User modified'}, status=status.HTTP_200_OK)
			return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			if not request.user.is_superuser:
				return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
			users = User.objects.all()
			serialized_users = UserSerializer(users, many=True)
			return Response({'users': serialized_users.data}, status=status.HTTP_200_OK)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

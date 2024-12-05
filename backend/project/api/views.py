from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.core.exceptions import PermissionDenied
from api.models import User
from api.serializers import UserSerializer
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



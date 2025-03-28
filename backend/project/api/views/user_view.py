from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from django.http import Http404
from api.models import User
from api.serializers import UserSerializer, PublicUserSerializer, SimpleUserSerializer
from api.permissions import IsAuthenticated
from django.http import Http404
import base64
import imghdr
from django.core.files.base import ContentFile
from django.db import IntegrityError


class UserView(APIView):
	serializer_class = UserSerializer
	permission_classes = [AllowAny]

	def get(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			return Response({'user': UserSerializer(user).data}, status=status.HTTP_200_OK)
		except ValueError:
			return Response({'error': 'Invalid UUID format'}, status=status.HTTP_400_BAD_REQUEST)
		except Http404:
			return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			print(f"Get User error: {e}")
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def delete(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			user.friends.clear()
			user.match_history.clear()
			user.delete()
			return Response({'message': f'User with id {id} has been deleted.'}, status=status.HTTP_200_OK)
		except Http404:
			return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			print(f"Delete user error: {e}")
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	def put(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			two_factor_method = request.data.get('two_factor_method')
			if two_factor_method == 'sms' and not request.data.get('phone_number', '').strip():
				return Response({'no_phone_number': 'No phone number provided'}, status=status.HTTP_400_BAD_REQUEST)
			elif two_factor_method == 'email' and not request.data.get('email', '').strip():
				return Response({'no_email': 'No email provided'}, status=status.HTTP_400_BAD_REQUEST)
			avatar_base64 = request.data.get('avatar')
			if avatar_base64:
				try:
					# Décoder l'image Base64
					format, imgstr = avatar_base64.split(';base64,')
					ext = format.split('/')[-1]  # Obtenir l'extension (ex: "jpeg", "png")
					allowed_types = ['jpeg', 'jpg', 'png']
					max_size = 5 * 1024 * 1024  # 5MB
					if ext.lower() not in allowed_types:
						return Response({'wrong_avatar': 'Only JPG and PNG files are allowed'}, status=status.HTTP_400_BAD_REQUEST)
					# Convertir Base64 en données binaires
					image_data = base64.b64decode(imgstr)
					# Vérifier la taille de l'image
					if len(image_data) > max_size:
						return Response({'wrong_avatar': "File size can't exceed 5MB"}, status=status.HTTP_400_BAD_REQUEST)
					# Vérifier si l'image est bien une image
					img_type = imghdr.what(None, h=image_data)
					if img_type not in allowed_types:
						return Response({'wrong_avatar': 'Invalid image format'}, status=status.HTTP_400_BAD_REQUEST)
					# Si tout est bon, enregistrer l'avatar en tant que fichier Django
					file_name = f"user_{user.id}.{ext}"
					user.avatar.save(file_name, ContentFile(image_data), save=True)
				except (ValueError, TypeError, IndexError, base64.binascii.Error):
					return Response({'wrong_avatar': 'Invalid image data'}, status=status.HTTP_400_BAD_REQUEST)
			serializer = UserSerializer(user, data=request.data, partial=True)
			if serializer.is_valid():
				user = serializer.save()
				return Response({'user': UserSerializer(user).data, 'message': 'User modified'}, status=status.HTTP_200_OK)
			return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		except Http404:
			return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except IntegrityError:
			return Response({'error': 'Username or alias already exists'}, status=status.HTTP_409_CONFLICT)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			users = User.objects.all()
			serialized_users = UserSerializer(users, many=True)
			return Response({'users': serialized_users.data}, status=status.HTTP_200_OK)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PublicUserView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, id=None):
		try:
			user = get_object_or_404(User, id=id)
			return Response({'user': PublicUserSerializer(user).data}, status=status.HTTP_200_OK)
		except Http404:
			return Response({'error': 'User not found'},status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserByNameView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, username):
		try:
			user = get_object_or_404(User, username=username)
			return Response({'user': SimpleUserSerializer(user).data}, status=status.HTTP_200_OK)
		except Http404:
			return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
		except AuthenticationFailed as auth_error:
			return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

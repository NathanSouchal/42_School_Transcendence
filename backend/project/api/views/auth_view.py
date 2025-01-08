from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from api.models import RefreshToken as UserRefreshToken
from api.serializers import UserSerializer
from api.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from django.db import transaction
from api.authentication import CookieJWTAuthentication
from django.db import IntegrityError
from rest_framework_simplejwt.tokens import RefreshToken as SimpleJWTRefreshToken

class RegisterView(APIView):
	serializer_class = UserSerializer
	permission_classes = [AllowAny]

	def post(self, request):
		serializer = UserSerializer(data=request.data)
		username = request.data.get('username')
		password = request.data.get('password')
		print(f"Registering user: {username}, Password: {password}")
		if serializer.is_valid():
			try:
				serializer.save()
				return Response({'message': 'User registered'}, status=status.HTTP_201_CREATED)
			except IntegrityError:
				return Response(
                    {'error': 'Username is already taken.'},
                    status=status.HTTP_409_CONFLICT
                )
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
			try:
				old_refresh_token = user.refresh_token
				if old_refresh_token:
					# Mettre l'ancien refresh token en blacklist
					refresh_token = SimpleJWTRefreshToken(old_refresh_token.token)
					refresh_token.blacklist()  # Si vous avez activé le blacklisting des tokens
					print("Old refresh token blacklisted.")
			except UserRefreshToken.DoesNotExist:
				# Aucun ancien refresh token à mettre en blacklist
				pass
			refresh = SimpleJWTRefreshToken.for_user(user)
			refresh_token, created = UserRefreshToken.objects.get_or_create(user=user, defaults={'token': str(refresh)})
			refresh_token.token = str(refresh)
			refresh_token.save()
			response = Response({
				'user': UserSerializer(user).data,
				'message': 'Authentification complete'
			}, status=status.HTTP_200_OK)

			response.set_cookie(
				key='access_token',
				value=str(refresh.access_token),  # Le refresh token
				httponly=True,  # Empêche l'accès via JavaScript
				secure=True,  # Assure le transport uniquement via HTTPS
				samesite='None',  # Bloque les cookies cross-site (modifiez à `Strict` selon vos besoins)
				max_age=10 * 60  # Durée de validité en secondes
			)
			response.set_cookie(
				key='refresh_token',
				value=str(refresh),  # Le refresh token
				httponly=True,  # Empêche l'accès via JavaScript
				secure=True,  # Assure le transport uniquement via HTTPS
				samesite='None',  # Bloque les cookies cross-site (modifiez à `Strict` selon vos besoins)
				max_age=7 * 24 * 60 * 60  # Durée de validité en secondes
			)
			return response
		return Response({'error': 'Wrong credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class RefreshTokenView(APIView):
	permission_classes = [IsAuthenticated]
	authentication_classes = [CookieJWTAuthentication]

	def post(self, request):
		print(f"Cookies reçus : {request.COOKIES}")
		user = request.user

		old_refresh_token = request.COOKIES.get('refresh_token')
		if not old_refresh_token:
			return Response({'detail': 'Refresh token not found'}, status=status.HTTP_401_UNAUTHORIZED)
		try:
			stored_refresh_token = user.refresh_token.token

			if old_refresh_token != stored_refresh_token:
				return Response({'detail': 'Invalid refresh token (mismatch)'}, status=status.HTTP_401_UNAUTHORIZED)
			# Valider et révoquer l'ancien token
			refresh_token_instance = SimpleJWTRefreshToken(old_refresh_token)
			refresh_token_instance.blacklist()
			print("Old refresh token blacklisted.")

			# Générer un nouveau token
			new_refresh_token = SimpleJWTRefreshToken.for_user(user)

			# Remplacer le nouveau token en base
			with transaction.atomic():
				user.refresh_token.token = str(new_refresh_token)
				user.refresh_token.save()

			# Construire la réponse
			response = Response({
				'user': UserSerializer(user).data,
				'message': 'New refresh token generated'
			}, status=status.HTTP_200_OK)

			# Mettre à jour les cookies
			response.set_cookie(
				key='refresh_token',
				value=str(new_refresh_token),
				httponly=True,
				secure=True,
				samesite='None',
				max_age=7 * 24 * 60 * 60
			)
			return response
		except Exception as e:
			return Response({'detail': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

class AccessTokenView(APIView):
	serializer_class = UserSerializer
	permission_classes = [AllowAny]

	def post(self, request):
		cookie_refresh_token = request.COOKIES.get('refresh_token')
		if not cookie_refresh_token:
			return Response({'detail': 'Refresh token not found'}, status=status.HTTP_401_UNAUTHORIZED)
		try:
			db_refresh_token = UserRefreshToken.objects.get(token=cookie_refresh_token)
			user = db_refresh_token.user
			if cookie_refresh_token != str(db_refresh_token.token):
				return Response({'detail': 'Invalid refresh token (mismatch)'}, status=status.HTTP_401_UNAUTHORIZED)
			refresh_token_instance = SimpleJWTRefreshToken.for_user(user)
			new_access_token = str(refresh_token_instance.access_token)
			response = Response({
				'user': UserSerializer(user).data,
				'message': 'Access token successfully refreshed.'
			}, status=status.HTTP_200_OK)
			response.set_cookie(
				key='access_token',
				value=new_access_token,
				httponly=True,
				secure=True,
				samesite='None',
				max_age=15 * 60
			)
			return response
		except Exception as e:
			return Response({'detail': 'Invalid refresh token', 'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
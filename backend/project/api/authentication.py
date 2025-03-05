from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
	def authenticate(self, request):
		# Vérifier si le cookie "access_token" est présent
		token = request.COOKIES.get('access_token')
		if token is None:
			return None  # Aucun token trouvé dans les cookies
		try:
			# Valider et décoder le token JWT
			validated_token = self.get_validated_token(token)
			user = self.get_user(validated_token)
			print(f"User authenticated : {user.username}")
			return (user, validated_token)
		except Exception as e:
			print(f"Unknown JWTCookie : {e}")
			return None


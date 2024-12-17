from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
	def authenticate(self, request):
		# Vérifier si le cookie "access_token" est présent
		token = request.COOKIES.get('access_token')
		if token is None:
			print("Aucun token trouvé dans les cookies")
			return None  # Aucun token trouvé dans les cookies
		try:
			# Valider et décoder le token JWT
			validated_token = self.get_validated_token(token)
			user = self.get_user(validated_token)
			print(f"Utilisateur authentifié : {user.username}")
			return (user, validated_token)
		except Exception as e:
			print(f"Erreur lors de l'authentification : {e}")
			return None


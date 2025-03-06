from django.utils.timezone import now
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from channels.db import database_sync_to_async

class UpdateLastSeenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Si le header Authorization est absent, on le crée à partir du cookie "access_token"
        if 'HTTP_AUTHORIZATION' not in request.META:
            token = request.COOKIES.get('access_token')
            if token:
                request.META['HTTP_AUTHORIZATION'] = f"Bearer {token}"

        # On force l'authentification via JWT
        jwt_auth = JWTAuthentication()
        try:
            result = jwt_auth.authenticate(request)  # Retourne (user, token) ou None
            if result is not None:
                user, token = result
                request.user = user  # Assigne l'utilisateur authentifié
        except AuthenticationFailed:
            pass  # En cas d'échec, request.user reste AnonymousUser

        # Si l'utilisateur est authentifié, mettre à jour son last_seen
        if request.user.is_authenticated:
            request.user.last_seen = now()
            request.user.save()

        return self.get_response(request)


class JWTAuthMiddleware:
    """Middleware WebSocket pour authentifier les utilisateurs via JWT dans les cookies.
       Permet aussi aux utilisateurs anonymes d'accéder aux WebSockets.
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Récupérer les cookies des headers WebSocket
        headers = dict(scope.get("headers", []))
        cookies = self.get_cookies_from_headers(headers)

        token = cookies.get("access_token")
        if token:
            user = await self.get_user_from_token(token)
        else:
            user = AnonymousUser()  # Si aucun token, utilisateur anonyme

        scope["user"] = user  # Assigne l'utilisateur (auth ou anonyme) à la connexion WebSocket

        return await self.inner(scope, receive, send)

    def get_cookies_from_headers(self, headers):
        """Extraire les cookies des headers WebSocket."""
        cookies_header = headers.get(b"cookie", b"").decode()
        cookies = {}
        for cookie in cookies_header.split(";"):
            parts = cookie.strip().split("=", 1)
            if len(parts) == 2:
                key, value = parts
                cookies[key] = value
        return cookies

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Vérifier et récupérer l'utilisateur depuis le token JWT."""
        jwt_auth = JWTAuthentication()
        try:
            validated_token = jwt_auth.get_validated_token(token)
            return jwt_auth.get_user(validated_token)
        except AuthenticationFailed:
            return AnonymousUser()  # Si le token est invalide, renvoyer un AnonymousUser


from django.utils.timezone import now
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

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

from django.utils.timezone import now
from django.contrib.auth.middleware import get_user

class UpdateLastSeenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = get_user(request)  # ✅ Garantit que request.user est bien chargé
        print(f"USERNAME: {user.username if user.is_authenticated else 'Anonymous'} | is_authenticated: {user.is_authenticated}")

        if user.is_authenticated:
            user.last_seen = now()
            user.save()

        return self.get_response(request)

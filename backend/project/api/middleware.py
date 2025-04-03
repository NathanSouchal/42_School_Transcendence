from django.utils.timezone import now
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from channels.db import database_sync_to_async

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        cookies = self.get_cookies_from_headers(headers)

        token = cookies.get("access_token")
        if token:
            user = await self.get_user_from_token(token)
        else:
            user = AnonymousUser()

        scope["user"] = user

        return await self.inner(scope, receive, send)

    def get_cookies_from_headers(self, headers):
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
        jwt_auth = JWTAuthentication()
        try:
            validated_token = jwt_auth.get_validated_token(token)
            return jwt_auth.get_user(validated_token)
        except AuthenticationFailed:
            return AnonymousUser()


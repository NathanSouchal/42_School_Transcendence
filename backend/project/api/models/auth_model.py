from django.db import models
from .user_model import User

class RefreshToken(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='refresh_token')
	token = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

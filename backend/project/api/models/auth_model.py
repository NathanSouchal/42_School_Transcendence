from django.db import models
from .user_model import User

class RefreshToken(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='refresh_token')
	token = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)


"""
OneToOneField : crée une relation de type "un à un" entre un User et une instance de RefreshToken.
Cela signifie qu'un utilisateur ne peut avoir qu'un seul refresh token, et un refresh token appartient
à un seul utilisateur.
on_delete=models.CASCADE : indique que si un User est supprimé, l'enregistrement correspondant dans
RefreshToken sera également supprimé automatiquement (effet "cascade")
related_name='refresh_token' : permet d'accéder facilement au RefreshToken d'un User via une relation inversée.
On peut accéder au token d'un User avec user.refresh_token.
"""
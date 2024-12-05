from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
	def create_user(self, username, password=None, **extra_fields):
		if not username:
			raise ValueError('No username')
		user = self.model(username=username, **extra_fields)
		user.set_password(password)
		user.save(using=self._db)
		return user

	def create_superuser(self, username, password=None, **extra_fields):
		extra_fields.setdefault('is_staff', True)
		extra_fields.setdefault('is_superuser', True)
		return self.create_user(username, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
	username = models.CharField(max_length=100, unique=True)
	is_active = models.BooleanField(default=True)
	is_staff = models.BooleanField(default=False)

	objects = UserManager()

	USERNAME_FIELD = 'username'

	def __str__(self):
		return self.username

class Game(models.Model):
	player1 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='games_as_player1') # on_delete=models.SET_NULL : Si un utilisateur est supprimé, ce champ sera null.
	player2 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='games_as_player2')
	score_player1 = models.IntegerField(default=0)
	score_player2 = models.IntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.player1} vs {self.player2} - {self.score_player1}:{self.score_player2}"

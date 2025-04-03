from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.apps import apps
from django.conf import settings
import uuid
import pyotp
import os
from django.utils.timezone import now
from api.utils import sanitize_input
from game.src.channels.consumers import GameState

"""
models -> Importé depuis Django, contient les outils nécessaires pour définir des modèles
(tables de la base de données) dans Django

AbstractBaseUser -> Une classe Django permettant de personnaliser le modèle utilisateur
tout en conservant les fonctionnalités de base comme la gestion des mots de passe

BaseUserManager -> Une classe utilisée pour personnaliser le gestionnaire (Manager) des
utilisateurs (inclut la création d utilisateurs normaux et de super-utilisateurs)

PermissionsMixin -> Ajoute des champs et des méthodes pour gérer les permissions et groupes
des utilisateurs, tels que is_superuser, groups, et user_permissions
"""

class UserManager(BaseUserManager):
	def create_user(self, username, password=None, **extra_fields):
		if not username:
			raise ValueError('No username')

		user = self.model(username=username, **extra_fields)
		user.set_password(password)
		user.save(using=self._db)

		# Récupérer le modèle Stats dynamiquement pour éviter l'importation circulaire
		Stats = apps.get_model('api', 'Stats')
		stats = Stats.objects.create(user=user)

		user.user_stats = stats
		user.save(using=self._db)
		return user

	def create_superuser(self, username, password=None, **extra_fields):
		extra_fields.setdefault('is_staff', True)
		extra_fields.setdefault('is_superuser', True)
		return self.create_user(username, password, **extra_fields)

def file_location(instance, filename, **kwargs):
	file_path = f"{instance.username}/avatar-{filename}"
	return file_path

class User(AbstractBaseUser, PermissionsMixin):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	user_stats = models.OneToOneField('api.Stats', on_delete=models.CASCADE, null=True, blank=True, related_name='stats_user')
	username = models.CharField(max_length=100, unique=True)
	alias = models.CharField(max_length=100, unique=True, null=True)
	avatar = models.ImageField(upload_to=file_location, null=True, blank=True)
	match_history = models.ManyToManyField('api.Game', blank=True, related_name='match_history')
	friends = models.ManyToManyField('self', blank=True, symmetrical=True) #symmetrical permet que si un user1 est ajoute aux friends de user2, user2 sera ajoute a ceux de user1
	is_staff = models.BooleanField(default=False)
	last_seen = models.DateTimeField(default=now)
	lang = models.CharField(max_length=3, default="EN")

	TWO_FACTOR_CHOICES = [
		('email', 'Email'),
		('sms', 'SMS'),
		('TOTP', 'Google Authenticator'),
		('none', 'None'),
	]

	two_factor_method = models.CharField(
		max_length=10,
		choices=TWO_FACTOR_CHOICES,
		null=True,
		blank=True,
		help_text="2FA method choosed by user"
	)

	email_otp = models.CharField(max_length=6, null=True, blank=True)  # Stocke le code temporaire envoyé par email
	sms_otp = models.CharField(max_length=6, null=True, blank=True)  # Stocke le code temporaire envoyé par SMS
	phone_number = models.CharField(max_length=15, null=True, blank=True, help_text="Required for SMS 2FA")
	email = models.CharField(max_length=50, null=True, blank=True, help_text="Required for Email 2FA")
	otp_created_at = models.DateTimeField(null=True, blank=True, help_text="Time when OTP was generated")
	totp_secret = models.CharField(max_length=32, blank=True, null=True)

	objects = UserManager()

	USERNAME_FIELD = 'username'

	def __str__(self):
		return self.username

	def delete_old_avatar(self):
		if self.pk:
			try:
				old_avatar = User.objects.get(pk=self.pk).avatar
				if old_avatar and old_avatar != self.avatar:
					if not str(old_avatar.path).startswith(os.path.join(settings.MEDIA_ROOT, 'defaults')):
						if os.path.isfile(old_avatar.path):
							os.remove(old_avatar.path)
			except User.DoesNotExist:
				pass

	def save(self, *args, **kwargs):
		self.username = sanitize_input(self.username)
		self.alias = sanitize_input(self.alias) if self.alias else None
		self.email = sanitize_input(self.email) if self.email else None
		self.phone_number = sanitize_input(self.phone_number) if self.phone_number else None

		self.delete_old_avatar()
		super().save(*args, **kwargs)

	def generate_totp_secret(self):
		""" Génère une nouvelle clé secrète pour TOTP """
		self.totp_secret = pyotp.random_base32()
		self.save()

	def get_totp_uri(self):
		""" Retourne l'URI pour Google Authenticator """
		return f"otpauth://totp/MyApp:{self.username}?secret={self.totp_secret}&issuer=MyApp"

	def verify_totp(self, otp_code):
		""" Vérifie si le code entré par l'utilisateur est valide """
		if not self.totp_secret:
			return False
		totp = pyotp.TOTP(self.totp_secret)
		return totp.verify(otp_code)  # Vérifie le code TOTP actuel

	def is_online(self):
		for room_name, room_data in GameState.rooms.items():
			for player in room_data["players"]:
				if player.get("user_id") == self.id:
					return True
		return False
		# return (now() - self.last_seen).seconds < 120

"""
def create_user(self, username, password=None, **extra_fields):

password=None : Le mot de passe est facultatif (il sera haché s'il est fourni)
**extra_fields : Capture tous les champs supplémentaires passés à la méthode
self.model : Référence le modèle User. Cela permet de créer une instance utilisateur en passant
les champs username et extra_fields
La méthode set_password hache le mot de passe avant de le sauvegarder
using=self._db garantit que l utilisateur est sauvegardé dans la base de données principale


class User(AbstractBaseUser, PermissionsMixin):

bstractBaseUser : Fournit les fonctionnalités de base pour un utilisateur (authentification,
gestion des mots de passe, etc.)
PermissionsMixin : Ajoute des fonctionnalités pour la gestion des permissions
objects = UserManager() : emplace le gestionnaire par défaut par votre gestionnaire personnalisé
USERNAME_FIELD = 'username' : Indique que username est utilisé comme identifiant principal pour
l authentification (au lieu de l email, par exemple)
def __str__(self):
    return self.username : Définit comment l'utilisateur sera affiché lorsqu'il sera converti en chaîne de caractères.
"""

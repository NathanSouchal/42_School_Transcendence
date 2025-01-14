from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

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
		return user

	def create_superuser(self, username, password=None, **extra_fields):
		extra_fields.setdefault('is_staff', True)
		extra_fields.setdefault('is_superuser', True)
		return self.create_user(username, password, **extra_fields)

def file_location(instance, filename, **kwargs):
	file_path = f"{instance.username}/avatar-{filename}"
	return file_path

class User(AbstractBaseUser, PermissionsMixin):
	user_stats = models.OneToOneField('api.Stats', on_delete=models.CASCADE, null=True, blank=True, related_name='stats_user')
	username = models.CharField(max_length=100, unique=True)
	avatar = models.ImageField(upload_to=file_location, null=True, blank=True)
	match_history = models.ManyToManyField('api.Game', blank=True, related_name='match_history')
	is_active = models.BooleanField(default=True)
	is_staff = models.BooleanField(default=False)

	objects = UserManager()

	USERNAME_FIELD = 'username'

	def __str__(self):
		return self.username

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

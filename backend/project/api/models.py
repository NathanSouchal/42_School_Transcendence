from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import math
import random

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

class User(AbstractBaseUser, PermissionsMixin):
	username = models.CharField(max_length=100, unique=True)
	is_active = models.BooleanField(default=True)
	is_staff = models.BooleanField(default=False)

	objects = UserManager()

	USERNAME_FIELD = 'username'

	def __str__(self):
		return self.username

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

class Game(models.Model):
	player1 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='games_as_player1') # on_delete=models.SET_NULL : Si un utilisateur est supprimé, ce champ sera null.
	player2 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='games_as_player2')
	score_player1 = models.IntegerField(default=0)
	score_player2 = models.IntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.player1} vs {self.player2} - {self.score_player1}:{self.score_player2}"

	
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

class Tournament(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # participants = models.ManyToManyField(User, related_name='tournaments')
    participants = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, default='not_started')
    number_of_players = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    rounds_tree = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.name

    def generate_match_by_round(self, nb_rounds, current_round_nb):
        nb_matches = 2 ** (nb_rounds - current_round_nb)
        current_round_lst = []
        for i in range(1, nb_matches + 1):
            if current_round_nb == 1:
                match = Match.objects.create(
                    tournament = self,
                    round_number = current_round_nb,
                    player1 = self.participants[(i * 2) - 2],
                    player2 = self.participants[(i * 2) - 1],
                )
            else:
                match = Match.objects.create(
                    tournament = self,
                    round_number = current_round_nb,
                )
            current_round_lst.append(match.id)
        self.rounds_tree.append(current_round_lst)
        self.save()             

    def assign_next_matches(self):
        for round_index in range(len(self.rounds_tree) - 1):
            i_next_round = 0
            for i_current_round in range(len(self.rounds_tree[round_index])):
                match = Match.objects.get(id = self.rounds_tree[round_index][i_current_round])
                match.next_match = Match.objects.get(id = self.rounds_tree[round_index + 1][i_next_round])
                match.save()
                if i_current_round % 2 == 1:
                    i_next_round += 1
    
    def start_tournament(self):
        random.shuffle(self.participants)
        nb_rounds = int(math.log2(self.number_of_players))
        # On genere ici tous les matchs avec les players et le round et on remplit l'arbre round par round
        for i in range(1, nb_rounds + 1):
             self.generate_match_by_round(nb_rounds, i)
        # Ici se fait l'attribution des next_match en se basant sur l'arbre
        self.assign_next_matches()
        self.status = 'in progress'
        self.save()

    def find_next_match_to_play(self, id_last_match):
        last_match = Match.objects.get(id=id_last_match)
        next_match = None
        current_round_index = last_match.round_number - 1
        if current_round_index >= len(self.rounds_tree):
            return None
        current_round = self.rounds_tree[current_round_index]
        if id_last_match in current_round:
            i = current_round.index(id_last_match)
            if i + 1 < len(current_round):
                next_match = Match.objects.get(id=current_round[i + 1])
            else:
                next_round_index = current_round_index + 1
                if next_round_index < len(self.rounds_tree):
                    next_round = self.rounds_tree[next_round_index]
                    if next_round:
                        next_match = Match.objects.get(id=next_round[0])
        return next_match

    def is_finished(self)
      self.status = 'finished'


class Match(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    round_number = models.PositiveIntegerField(default=1)
    # player1 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='match_as_player1')
    # player2 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='match_as_player2')
    player1 = models.CharField(max_length=50, blank=True, null=True)
    player2 = models.CharField(max_length=50, blank=True, null=True)
    # winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='match_winner', blank=True)
    winner = models.CharField(max_length=50, blank=True, null=True)
    next_match = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='previous_matches')
    score_player1 = models.PositiveIntegerField(default=0)
    score_player2 = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Match {self.id} - Round {self.round_number} - {self.tournament.name}"

    def put_winner_on_next_match(self):
        if self.next_match and self.winner:
            if self.next_match.player1 is None:
                self.next_match.player1 = self.winner
            else:
                self.next_match.player2 = self.winner
            self.next_match.save()
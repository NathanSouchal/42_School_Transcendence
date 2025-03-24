from django.db import models
import math
import random
from .user_model import User
from .match_model import Match
from api.utils import sanitize_input
import uuid


class Tournament(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	name = models.CharField(max_length=100, unique=True, default='unnamed')
	creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
	# participants = models.ManyToManyField(User, related_name='tournaments')
	participants = models.JSONField(default=list, blank=True)
	status = models.CharField(max_length=20, default='not_started')
	number_of_players = models.PositiveIntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)
	rounds_tree = models.JSONField(default=list, blank=True)

	def __str__(self):
		return self.name

	def save(self, *args, **kwargs):
		# Nettoyage des champs textuels avant d'enregistrer
		self.name = sanitize_input(self.name)
		self.status = sanitize_input(self.status)

		# Nettoyer les données JSON si elles contiennent du texte
		if isinstance(self.participants, list):
			self.participants = [sanitize_input(p) if isinstance(p, str) else p for p in self.participants]

		if isinstance(self.rounds_tree, list):
			self.rounds_tree = [sanitize_input(r) if isinstance(r, str) else r for r in self.rounds_tree]

		super().save(*args, **kwargs)

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
		self.name = f'Tournament nº{self.id}'
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

	def is_finished(self):
		self.status = 'finished'

from django.db import models
from .user_model import User

class Game(models.Model):
	player1 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='games_as_player1') # on_delete=models.SET_NULL : Si un utilisateur est supprimé, ce champ sera null.
	player2 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='games_as_player2')
	score_player1 = models.IntegerField(default=0)
	score_player2 = models.IntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.player1} vs {self.player2} - {self.score_player1}:{self.score_player2}"
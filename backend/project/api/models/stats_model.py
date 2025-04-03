from django.db import models
from api.models import Game, User

class Stats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stats')
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    last_game = models.ForeignKey(Game, on_delete=models.SET_NULL, null=True)
    win_ratio = models.FloatField(null=True, blank=True)
    nb_games = models.PositiveIntegerField(default=0)
    average_score = models.FloatField(default=0.0)

    def calculate_ratio(self):
        if self.losses == 0:
            return float(self.wins)
        return round(self.wins / self.losses, 2)

    def calculate_nb_games(self):
        return self.wins + self.losses

    def save(self, *args, **kwargs):
        self.win_ratio = self.calculate_ratio()
        self.nb_games = self.calculate_nb_games()
        super().save(*args, **kwargs)


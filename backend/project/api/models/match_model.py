from django.db import models

class Match(models.Model):
    tournament = models.ForeignKey('api.Tournament', on_delete=models.CASCADE, related_name='matches')
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
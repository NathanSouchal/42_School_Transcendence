from django.db import models
from .user_model import User


class Friendship(models.Model):
    from_user = models.ForeignKey(
        User, related_name='friendship_sent', on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        User, related_name='friendship_received', on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)

    class Meta:
        # unique_together = ('from_user', 'to_user')  # Empêche les doublons d'invitation
        constraints = [
        models.UniqueConstraint(
            fields=['from_user', 'to_user'],
            name='unique_friendship'
        ),
        models.UniqueConstraint(
            fields=['to_user', 'from_user'],
            name='unique_reverse_friendship'
        ),
    ]

    def accept(self):
        self.accepted = True
        self.save()
        # Ajouter l'amitié validée au ManyToManyField
        self.from_user.friends.add(self.to_user)
        self.to_user.friends.add(self.from_user)

    def decline(self):
        self.delete()

from django.db import models
from .user_model import User


class FriendRequest(models.Model):
    from_user = models.ForeignKey(
        User, related_name='friend_request_sent', on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        User, related_name='friend_request_received', on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)

    class Meta:
        constraints = [
        models.UniqueConstraint(
            fields=['from_user', 'to_user'],
            name='unique_friend_request'
        ),
        models.UniqueConstraint(
            fields=['to_user', 'from_user'],
            name='unique_reverse_friend_request'
        ),
    ]

    def accept(self):
        self.accepted = True
        self.save()
        self.from_user.friends.add(self.to_user)
        self.to_user.friends.add(self.from_user)

    def decline(self):
        self.delete()

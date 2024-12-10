from rest_framework import serializers;
from api.models import User;
from api.models import Game

class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ['id', 'username', 'password']
		extra_kwargs = {'password': {'write_only': True}}

	def create(self, validated_data):
		user = User.objects.create_user(**validated_data)
		return user
	
class GameSerializer(serializers.ModelSerializer):
    # Utilisation de PrimaryKeyRelatedField pour accepter les IDs dans la requête et trouver l'instance de User correspondante
    player1 = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    player2 = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Game
        fields = ['id', 'player1', 'player2', 'score_player1', 'score_player2', 'created_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Modifier la représentation pour inclure les usernames au lieu des IDs
        representation['player1'] = instance.player1.username if instance.player1 else None
        representation['player2'] = instance.player2.username if instance.player2 else None
        return representation




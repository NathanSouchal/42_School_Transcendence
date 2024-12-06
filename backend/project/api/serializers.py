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
    class Meta:
        model = Game
        fields = ['id', 'player1', 'player2', 'score_player1', 'score_player2', 'created_at']

	# methode qui est appelee lorsqu'une instance de game est convertit en reponse JSON,
    # ici on la modifie afin que le champ player corresponde au username du player et non son id
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['player1'] = instance.player1.username if instance.player1 else None
        representation['player2'] = instance.player2.username if instance.player2 else None
        return representation



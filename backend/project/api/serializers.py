from rest_framework import serializers;
from api.models import Game, User, Tournament, Match, Stats, Friendship

class GameSerializer(serializers.ModelSerializer):
    # Utilisation de PrimaryKeyRelatedField pour accepter les IDs dans la requête et trouver l'instance de User correspondante
    player1 = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    player2 = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Game
        fields = '__all__'
        read_only_fields = ['created_at', 'id']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Modifier la représentation pour inclure les usernames au lieu des IDs
        representation['player1'] = instance.player1.username if instance.player1 else None
        representation['player2'] = instance.player2.username if instance.player2 else None
        return representation


class UserSerializer(serializers.ModelSerializer):
    match_history = GameSerializer(many=True, read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'is_superuser', 'password', 'match_history', 'friends']
        extra_kwargs = {
            'password': {'write_only': True},
            'is_superuser': {'read_only': True}  # Empêche la modification via l'API
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

"""
	serializer: convertit des objets Python (ici des instances de modeles) en format JSON ou autre

	fields = ['id', 'username', 'password'] -> on selectionne les champs du modele User qui seront
	inclus dans la representation JSON

	extra_kwargs = {'password': {'write_only': True}} -> ici on personnalise le comportement du champ
	password, on le passe en ecriture seule. Il peut être transmis dans une requête login par exemple
	mais il ne sera jamais retourné dans la réponse JSON (on le protege d'etre expose)

	create() est la methode appelee pour creer un nouvel objet utilisateur (POST ou PUT sur un User
	arrive ici pour sauvegarder les donnees). **validated_data est un déballage (unpacking) du dictionnaire
	validated_data qui contient par exemple {username='john', password='securepassword'}
	User.objects.create_user(**validated_data) -> User.UserManager().create_user

	La méthode par défaut de DRF pour create ne sait pas comment gérer les mots de passe (les hacher)
	En remplaçant cette méthode, on personnalise la manière dont un utilisateur est créé.
"""



class MatchSerializer(serializers.ModelSerializer):

    class Meta:
        model = Match
        fields = '__all__'
        read_only_fields = ['created_at', 'id']

class TournamentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tournament
        fields = '__all__'
        read_only_fields = ['created_at', 'id']

class StatsSerializer(serializers.ModelSerializer):

    class Meta:
        model = Stats
        fields = '__all__'

class FriendshipSerializer(serializers.ModelSerializer):

    class Meta:
        model = Friendship
        fields = '__all__'
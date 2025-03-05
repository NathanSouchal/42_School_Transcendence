from rest_framework import serializers;
from api.models import Game, User, Tournament, Match, Stats, FriendRequest
from drf_extra_fields.fields import Base64ImageField
from django.core.validators import RegexValidator
import re

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

class SimpleUserSerializer(serializers.ModelSerializer):
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'is_online']

    def get_is_online(self, obj):
        return obj.is_online()

class UserSerializer(serializers.ModelSerializer):
    # id = serializers.UUIDField(format='hex')
    username = serializers.CharField(min_length=4, max_length=10, required=True, error_messages={'min_length': 'Username must be a least 4 characters long', 'max_length': 'Username must be at maximum 10 characters long'})
    alias = serializers.CharField(min_length=4, max_length=10, required=False, error_messages={'min_length': 'Alias must be a least 4 characters long', 'max_length': 'Alias must be at maximum 10 characters long'})
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True, validators=[
            RegexValidator(
                r'^\+33[1-9]\d{8}$',
                message="Wrong phone number format"
            )
        ])
    match_history = GameSerializer(many=True, read_only=True)
    friends = SimpleUserSerializer(many=True, read_only=True)
    avatar = Base64ImageField(required=False)

    class Meta:
        model = User
        # fields = ['id', 'username', 'is_superuser', 'password', 'avatar', 'match_history']
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True},
            'is_superuser': {'read_only': True}  # Empêche la modification via l'API
        }

    def validate_phone_number(self, value):
        regex = r'^\+33[1-9]\d{8}$'
        if value and not re.match(regex, value):
            raise serializers.ValidationError(
				"Phone number format (ex: +33606060606)"
			)
        return value

    def create(self, validated_data):
        avatar = validated_data.get('avatar', None)
        if not avatar:
            validated_data['avatar'] = "defaults/bob.jpg"
        alias = validated_data.get('alias', None)
        if not alias:
            validated_data['alias'] = validated_data.get('username')
        lang = validated_data.get('lang', None)
        if not lang:
            validated_data['lang'] = "EN"
        user = User.objects.create_user(**validated_data)
        return user

class PublicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'avatar', 'username', 'alias']

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
        fields = ['id', 'round_number', 'player1', 'player2', 'winner', 'score_player1', 'score_player2', 'next_match']
        read_only_fields = ['created_at', 'id']

class TournamentSerializer(serializers.ModelSerializer):
    rounds_tree = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = '__all__'
        read_only_fields = ['created_at', 'id']

    def get_rounds_tree(self, obj):
        serialized_rounds_tree = []

        for round_ids in obj.rounds_tree:
            matches = Match.objects.filter(id__in=round_ids)
            serialized_matches = MatchSerializer(matches, many=True).data
            serialized_rounds_tree.append(serialized_matches)

        return serialized_rounds_tree


class StatsSerializer(serializers.ModelSerializer):

    class Meta:
        model = Stats
        fields = '__all__'
        read_only_fields = ['id']

class FriendRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendRequest
        fields = '__all__'
        read_only_fields = ['id']

    def to_representation(self, instance):
        """
        Cette méthode est utilisée pour la sérialisation (GET).
        Elle retourne les détails utilisateur plutôt que leurs IDs.
        """
        data = super().to_representation(instance)
        data['from_user'] = SimpleUserSerializer(instance.from_user).data
        data['to_user'] = SimpleUserSerializer(instance.to_user).data
        return data

    def create(self, validated_data):
        """
        Cette méthode est utilisée pour la désérialisation (POST).
        Elle accepte uniquement les IDs des utilisateurs.
        """
        from_user = validated_data.pop('from_user')
        to_user = validated_data.pop('to_user')
        if from_user == to_user:
            raise serializers.ValidationError(
                {"to_user": "You cannot send a friend request to yourself."}
            )
        if FriendRequest.objects.filter(from_user=to_user, to_user=from_user, accepted=False).exists():
            raise serializers.ValidationError(
                {"to_user": "This user has already sent you a friend request. Accept it instead."}
            )
        if from_user.friends.filter(id=to_user.id).exists():
            raise serializers.ValidationError(
                {"to_user": "You are already friends with this user."}
            )
        return FriendRequest.objects.create(from_user=from_user, to_user=to_user, **validated_data)


"""
Pourquoi extraire from_user et to_user avec .pop()  ?

Les champs comme from_user et to_user sont des relations ForeignKey,
et nous avons besoin de passer leurs valeurs explicitement (des instances du modèle User) à la méthode FriendRequest.objects.create().
En les extrayant avec .pop(), nous préparons ces champs pour les utiliser comme arguments distincts lors de la création.
Si nous ne les extrayons pas, et que nous essayons de passer tout validated_data directement à FriendRequest.objects.create(),
Django essaiera de traiter from_user et to_user comme des champs ordinaires, ce qui peut entraîner des erreurs.
"""

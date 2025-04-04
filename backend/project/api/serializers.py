from django.core.exceptions import ValidationError
from rest_framework import serializers;
from api.models import Game, User, Tournament, Match, Stats, FriendRequest
from drf_extra_fields.fields import Base64ImageField
from django.core.validators import RegexValidator
import re

class GameSerializer(serializers.ModelSerializer):
    player1 = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    player2 = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Game
        fields = '__all__'
        read_only_fields = ['created_at', 'id']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
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

FORBIDDEN_USERNAMES = {"Computer"}

class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(min_length=4, max_length=10, required=True, validators=[
            RegexValidator(
                regex=r'^\w+$',
                message="Username can only contain letters, numbers, and underscores"
            )
        ], error_messages={'min_length': 'Username must be a least 4 characters long', 'max_length': 'Username must be at maximum 10 characters long'})
    alias = serializers.CharField(min_length=4, max_length=10, required=False, validators=[
            RegexValidator(
                regex=r'^\w+$',
                message="Alias can only contain letters, numbers, and underscores"
            )
        ], error_messages={'min_length': 'Alias must be a least 4 characters long', 'max_length': 'Alias must be at maximum 10 characters long'})
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True, validators=[
            RegexValidator(
                r'^\+33[1-9]\d{8}$',
                message="Phone number must start with +33"
            )
        ])
    friends = SimpleUserSerializer(many=True, read_only=True)
    avatar = Base64ImageField(required=False)


    def to_representation(self, instance):
        representation = super().to_representation(instance)
        sorted_games = instance.match_history.order_by('-created_at')
        representation['match_history'] = GameSerializer(sorted_games, many=True).data
        return representation

    def validate_username(self, value):
        if value.lower() in FORBIDDEN_USERNAMES:
            raise ValidationError("This username is not allowed")
        return value

    def validate_alias(self, value):
        if value and value.lower() in FORBIDDEN_USERNAMES:
            raise ValidationError("This alias is not allowed")
        return value

    class Meta:
        model = User
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True},
            'is_superuser': {'read_only': True}
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

	def validate_participants(self, value):
		if not isinstance(value, list):
			raise serializers.ValidationError("Participants must be a list")

		for name in value:
			if not re.fullmatch(r'^\w+$', name):
				raise serializers.ValidationError(
					f"Invalid participant name : only letters, numbers and underscores are allowed"
				)

			if len(name) < 4:
				raise serializers.ValidationError(
					f"Player name must be at least 4 characters long"
				)
			if len(name) > 10:
				raise serializers.ValidationError(
					f"Player name must be at most 10 characters long"
				)

		if len(value) != len(set(value)):
			raise serializers.ValidationError("Duplicate participants are not allowed")

		return value


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
        data = super().to_representation(instance)
        data['from_user'] = SimpleUserSerializer(instance.from_user).data
        data['to_user'] = SimpleUserSerializer(instance.to_user).data
        return data

    def create(self, validated_data):
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
        if FriendRequest.objects.filter(from_user=from_user, to_user=to_user).exists():
            raise serializers.ValidationError(
                {"to_user": "Friend request already exists."}
            )
        return FriendRequest.objects.create(from_user=from_user, to_user=to_user, **validated_data)

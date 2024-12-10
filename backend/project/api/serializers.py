from rest_framework import serializers;
from api.models import User

class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ['id', 'username', 'password']
		extra_kwargs = {'password': {'write_only': True}}

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

# Démarrage du projet en mode développement
dev:
	@docker compose -f docker-compose.yml up -d --build

# Démarrage du projet en mode production
prod:
	@docker compose -f docker-compose.prod.yml up -d --build

# Arrêter les conteneurs
down:
	@docker compose down

# Arrêter uniquement les conteneurs en cours d'exécution
stop:
	@docker compose stop

# Redémarrer les conteneurs sans rebuild
start:
	@docker compose start

# Voir les conteneurs en cours d'exécution
status:
	@docker ps

# Nettoyer les conteneurs, images et volumes (supprime TOUT sauf les volumes persistants)
clean:
	@docker compose down
	@docker system prune -a -f
	@docker buildx prune -af
	# @docker volume rm transcendence_postgres_data

# Supprimer et relancer les conteneurs (équivalent à clean + up)
re: clean dev

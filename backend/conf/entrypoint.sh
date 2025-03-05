#!/bin/bash

set -e  # Arrête le script si une commande échoue

# Vérifie si POSTGRES_HOST est défini ; sinon, charge le fichier .env
if [ -z "${POSTGRES_HOST}" ]; then
    echo "Environment variables not set. Loading from .env file..."
    if [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
    else
        echo "Error: .env file not found and environment variables are not set."
        exit 1
    fi
else
    echo "Environment variables already set. Skipping .env file loading."
fi

echo "Waiting for PostgreSQL to be ready..."

# Boucle jusqu'à ce que PostgreSQL soit prêt
while ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" > /dev/null 2>&1; do
    sleep 1
done

echo "PostgreSQL is ready!"

# forcer la creation des migrations par precaution
python project/manage.py makemigrations

# Appliquer les migrations
python project/manage.py migrate

# Exécuter la commande de population
python project/manage.py populate_db

# Démarrer le serveur
exec "$@"

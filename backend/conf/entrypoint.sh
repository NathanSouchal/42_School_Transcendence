#!/bin/sh

#echo "Waiting for PostgreSQL..."
#while ! python -c "import psycopg2; psycopg2.connect('dbname=mydatabase user=userdb host=localhost password=CfTnNsTranscendence')" 2>/dev/null; do
  #  sleep 1
#done
#echo "PostgreSQL is up - executing commands"
sleep 5

cd /app

echo "Applying database migrations..."
python3 project/manage.py migrate

echo "Populating database if necessary..."
python3 project/manage.py shell < conf/populate_db.py

echo "Starting Django server..."
exec "$@"

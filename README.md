#BACKEND
source env/bin/activate
pip install -r requirements.txt
python3 manage.py runserver

python manage.py makemigrations
python manage.py migrate

#DELETE AND RECREATE DATABASE
rm db.sqlite3
find . -path "_/migrations/_.py" -not -name "**init**.py" -delete
find . -path "_/migrations/_.pyc" -delete
python manage.py makemigrations
python manage.py migrate

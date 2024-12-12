## BACKEND

#### Activate env

```sh
source env/bin/activate
```

#### Install requirements

```sh
pip install -r requirements.txt
```

#### Update migrations

```sh
python manage.py makemigrations
python manage.py migrate
```

#### Run server

```sh
python3 manage.py runserver
```

#### DELETE AND RECREATE DATABASE

```sh
rm db.sqlite3
find . -path "_/migrations/_.py" -not -name "**init**.py" -delete
find . -path "_/migrations/_.pyc" -delete
python manage.py makemigrations
python manage.py migrate
```

## FRONTEND

#### Install node modules

```sh
npm i
```

#### Run server

```sh
npm start
```

#### Create a self-signed ssl certificate :

```sh
mkdir -p ./ssl
openssl req -x509 -newkey rsa:4096 -keyout ./ssl/key.pem -out ./ssl/cert.pem -days 365 -nodes
```

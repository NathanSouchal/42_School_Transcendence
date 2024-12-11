from django.contrib.auth.models import User
from decouple import config

def run():
    try:
        username = config('DJANGO_SUPERUSER_USERNAME')
        password = config('DJANGO_SUPERUSER_PASSWORD')
        email = None

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username, email, password)
            print("Superuser created.")
        else:
            print("Superuser already exists.")
    except KeyError as e:
        print(f"Missing environment variable: {e}")

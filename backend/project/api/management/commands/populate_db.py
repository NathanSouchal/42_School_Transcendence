from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decouple import config

class Command(BaseCommand):
    help = 'Populate the database with initial data, including the superuser'

    def handle(self, *args, **kwargs):
        try:
            User = get_user_model()
            username = config('DJANGO_SUPERUSER_USERNAME')
            password = config('DJANGO_SUPERUSER_PASSWORD')

            if not User.objects.filter(username=username).exists():
                User.objects.create_superuser(username=username, password=password)
                self.stdout.write(self.style.SUCCESS("Superuser created."))
            else:
                self.stdout.write(self.style.WARNING("Superuser already exists."))

            self.stdout.write(self.style.SUCCESS("Database population complete."))
        except KeyError as e:
            self.stderr.write(f"Missing environment variable: {e}")
        except Exception as e:
            self.stderr.write(f"Error during database population: {e}")

#!/usr/bin/env python
import os
import sys

import django
from django.core.management import call_command

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
    django.setup()

    os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

    call_command("runserver", "0.0.0.0:8000", use_reloader=True)

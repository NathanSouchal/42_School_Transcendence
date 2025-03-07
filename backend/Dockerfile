FROM python:3.10.12

WORKDIR /app

ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# mode Prode
# COPY . .
# RUN chmod +x conf/entrypoint.sh

# mode Dev
VOLUME /app
COPY conf/entrypoint.sh /app/conf/entrypoint.sh
RUN chmod +x /app/conf/entrypoint.sh


EXPOSE 8000

ENTRYPOINT ["/app/conf/entrypoint.sh"]

ENV PYTHONPATH=/app:/app/project


CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "project.asgi:application"]



FROM python:3.10.12

WORKDIR /app

ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Add watchdog for file watching
RUN pip install watchdog[watchmedo]

VOLUME /app

COPY conf/entrypoint.sh /app/conf/entrypoint.sh

RUN chmod +x /app/conf/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/conf/entrypoint.sh"]

ENV PYTHONPATH=/app:/app/project

CMD ["python", "runserver_hotreload.py"]

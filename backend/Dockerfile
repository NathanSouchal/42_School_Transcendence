FROM python:3.13

WORKDIR /app

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt


COPY . .

RUN chmod +x conf/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["conf/entrypoint.sh"]

CMD ["python3", "project/manage.py", "runserver", "0.0.0.0:8000"]

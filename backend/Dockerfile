FROM python:3.13

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY conf/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY conf/populate_db.py /populate_db.py
RUN chmod +x /populate_db.py

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["python3", "project/manage.py", "runserver", "0.0.0.0:8000"]

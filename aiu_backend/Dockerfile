FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# system deps for mysqlclient
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

CMD ["bash", "-c", \
     "until nc -z $MYSQL_HOST $MYSQL_PORT; do echo 'Waiting for MySQL...'; sleep 1; done && \
      python manage.py migrate && \
      python manage.py collectstatic --noinput && \
      gunicorn aiu_backend.wsgi:application --bind 0.0.0.0:8000"]

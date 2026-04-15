release: cd backend && python manage.py migrate --noinput
web: cd backend && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
worker: cd backend && celery -A backend worker -l info
beat: cd backend && celery -A backend beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler

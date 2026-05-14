#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

VPS_HOST="root@185.220.204.247"
APP_DIR="/var/www/usafilink"

# Build frontend locally with correct API URL
cd frontend
npm install
VITE_API_URL=http://185.220.204.247/api/ npm run build
cd ..

# Sync built frontend to VPS
rsync -av --delete frontend/dist/ "$VPS_HOST:$APP_DIR/frontend/dist/"

# Sync backend source to VPS before installing dependencies/restarting.
rsync -av --delete \
  --exclude '.env' \
  --exclude 'db.sqlite3' \
  --exclude 'media/' \
  --exclude 'staticfiles/' \
  --exclude '__pycache__/' \
  backend/ "$VPS_HOST:$APP_DIR/backend/"

# Update backend on the VPS and restart the actual service
ssh "$VPS_HOST" bash <<'REMOTE'
cd /var/www/usafilink/backend
source /var/www/usafilink/.venv/bin/activate
set -a
[ -f .env ] && . ./.env
set +a
pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput

chown -R www-data:www-data /var/www/usafilink/frontend/dist /var/www/usafilink/backend/staticfiles
find /var/www/usafilink/frontend/dist -type d -exec chmod 755 {} \;
find /var/www/usafilink/frontend/dist -type f -exec chmod 644 {} \;
find /var/www/usafilink/backend/staticfiles -type d -exec chmod 755 {} \;
find /var/www/usafilink/backend/staticfiles -type f -exec chmod 644 {} \;

echo "Detecting backend service..."
service_name=$(systemctl list-units --type=service | grep -iE 'gunicorn|usafilink|backend' | awk '{print $1}' | head -n 1 || true)

if [ -n "$service_name" ]; then
  echo "Restarting $service_name"
  systemctl restart "$service_name"
else
  echo "No backend service detected. Run service check manually."
fi

for celery_service in usafilink-celery.service usafilink-celerybeat.service; do
  if systemctl list-unit-files "$celery_service" >/dev/null 2>&1; then
    sed -i 's/-A backend worker/-A backend.celery:app worker/g' "/etc/systemd/system/$celery_service"
    sed -i 's/-A backend beat/-A backend.celery:app beat/g' "/etc/systemd/system/$celery_service"
    echo "Restarting $celery_service"
    systemctl restart "$celery_service"
  fi
done

systemctl reload nginx || echo "nginx reload failed"
REMOTE
#         Clivemisiko2512 
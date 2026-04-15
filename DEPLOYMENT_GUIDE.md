# UsafiLink Deployment Guide

## Deployment Architecture
- **Frontend**: React + Vite deployed on **Vercel**
- **Backend**: Django + Celery deployed on **Railway**
- **Database**: MySQL on Railway
- **Redis**: Redis on Railway (for Celery broker & cache)

---

## 1. Deploy Backend on Railway

### Prerequisites
- Railway account (railway.app)
- GitHub repo connected

### Steps:

1. Go to [Railway.app](https://railway.app) and sign in
2. Click **+ New Project** → **Deploy from GitHub repo**
3. Select the `UsafiLink` repository
4. Railway will auto-detect the Django app

### Configure Services

#### a. Web Service (Django)
- **Root Directory**: `backend`
- **Start Command**: Will be auto-detected from Procfile

#### b. Add MySQL Database
1. In Railway dashboard, click **+ Add**
2. Select **MySQL**
3. Configure:
   - **Database Name**: `usafilink_db`
   - Railway will auto-generate credentials

#### c. Add Redis Service
1. Click **+ Add**
2. Select **Redis**
3. Railway will auto-generate connection string

---

## 2. Environment Variables Setup

### Add to Railway:

In the **Variables** tab of your Railway project, add:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-railway-domain.railway.app

# Database (Railway auto-provides these)
DB_NAME=usafilink_db
DB_USER=root
DB_PASSWORD=${{Mysql.PASSWORD}}
DB_HOST=${{Mysql.PRIVATE_URL}}
DB_PORT=3306

# Redis (Railway auto-provides this)
REDIS_URL=${{Redis.PRIVATE_URL}}
CELERY_BROKER_URL=${{Redis.PRIVATE_URL}}/0
CELERY_RESULT_BACKEND=${{Redis.PRIVATE_URL}}/0

# M-Pesa Credentials
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-passkey
MPESA_INITIATOR_NAME=your-name
MPESA_INITIATOR_PASSWORD=your-password

# Africa's Talking
AFRICASTALKING_API_KEY=your-key
AFRICASTALKING_USERNAME=Usafilink

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

DEFAULT_FROM_EMAIL=your-email@gmail.com

# Callback URL (replace with your Railway domain)
MPESA_ENV=production
MPESA_CALLBACK_URL=https://your-domain.railway.app/api/payments/mpesa/callback/
```

---

## 3. Configure Celery Workers

### Add Worker Service:
1. In Railway, click **+ Add**
2. Select **Cron Job** or **Service**
3. Configure:
   - **Name**: `celery-worker`
   - **Command**: `cd backend && celery -A backend worker -l info`
   - **Replicas**: 1

### Add Celery Beat (Scheduler):
1. Click **+ Add**
2. **Name**: `celery-beat`
3. **Command**: `cd backend && celery -A backend beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler`

---

## 4. Database Migrations

After deployment, run migrations:

```bash
# In Railway logs/terminal
cd backend
python manage.py migrate
python manage.py createsuperuser  # Create admin user
```

Or via Railway CLI:
```bash
railway run python backend/manage.py migrate
railway run python backend/manage.py createsuperuser
```

---

## 5. Deploy Frontend on Vercel

### Setup:
1. Go to [Vercel.com](https://vercel.com)
2. Import `UsafiLink` GitHub repository
3. Configure:
   - **Framework**: Vite (or auto-detect)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Environment Variables (Vercel):
Add in Vercel dashboard:
```env
VITE_API_BASE_URL=https://your-railway-domain.railway.app/api
```

---

## 6. Update Frontend API Configuration

Edit `frontend/src/api/axiosConfig.js`:
```javascript
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

---

## 7. Celery Task Execution in Production

### Monitoring:
- Check Celery worker logs in Railway dashboard
- Monitor Celery tasks via Django admin

### Common Issues:

**Worker not picking up tasks:**
- Verify Redis connection: `REDIS_URL` is correct
- Check worker logs in Railway
- Ensure `CELERY_BROKER_URL` is set

**Tasks not running at scheduled times:**
- Verify Beat service is running
- Database must be accessible for scheduler
- Check `django-celery-beat` migrations

---

## 8. Testing Production Deployment

### Test M-Pesa Integration:
```bash
# Use production credentials
# Verify callback URL is correct
# Test payment flow end-to-end
```

### Test Celery Tasks:
```bash
# SSH into Railway
railway run python backend/manage.py shell

# Test a task
from bookings.tasks import send_booking_notification
send_booking_notification.delay(booking_id=1)
```

---

## 9. Monitoring & Logs

### Railway Dashboard:
- View real-time logs for each service
- Monitor CPU/Memory usage
- Check deployment history

### Access Logs:
```bash
# Via Railway CLI
railway logs -s web           # Django logs
railway logs -s celery-worker # Celery worker logs
railway logs -s celery-beat   # Celery Beat logs
railway logs -s mysql         # Database logs
```

---

## 10. Troubleshooting

### 502 Bad Gateway
- Check if `web` service is running
- Verify database connection
- Review Django logs

### Celery Tasks Not Running
- Verify Redis is running
- Check worker service logs
- Ensure Beat service has access to database

### Database Connection Issues
- Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD`
- Ensure database migrations have run
- Check network access to MySQL

---

## Additional Notes

- **CORS**: Ensure `CORS_ALLOWED_ORIGINS` includes your Vercel domain
- **Static Files**: Django will serve static files via Whitenoise
- **Media Files**: Consider using S3 or similar for uploaded files
- **SSL**: Railway provides auto SSL/TLS

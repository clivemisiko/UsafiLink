# Railway Deployment Checklist

## Pre-Deployment Checklist

### Backend Setup
- [ ] Commit all changes to GitHub
- [ ] Update `backend/requirements.txt` with new dependencies
- [ ] Verify `Procfile` is in root directory
- [ ] Verify `runtime.txt` specifies Python 3.11.9
- [ ] Test local deployment: `gunicorn backend.wsgi:application`

### Frontend Setup
- [ ] Verify `frontend/package.json` has build script
- [ ] Verify `frontend/vercel.json` is configured
- [ ] Test build locally: `npm run build`

---

## Step 1: Deploy on Railway

### 1.1 Create Railway Project
1. Go to https://railway.app
2. Click **"+ New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize GitHub and select `UsafiLink`
5. Railway will auto-detect the Django app

### 1.2 Configure Services

#### Added Services Automatically:
- **Web Service** (Django app)

#### Services You Need to Add:
1. **MySQL Database**
   - Click **"+ Add"** → **"MySQL"**
   - Name: `mysql`
   - Railway generates credentials

2. **Redis Cache**
   - Click **"+ Add"** → **"Redis"**
   - Name: `redis`
   - Railway generates connection URL

3. **Celery Worker**
   - Click **"+ Add"** → **"Cron Job"** or **"Service"**
   - Name: `worker`
   - Command: `cd backend && celery -A backend worker -l info`
   - Don't set a cron schedule (needs to run continuously)

4. **Celery Beat (Scheduler)**
   - Click **"+ Add"** → **"Service"** or **"Cron Job"**
   - Name: `beat`
   - Command: `cd backend && celery -A backend beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler`

---

## Step 2: Set Environment Variables

In **Railway Dashboard** → **Your Project** → **Variables**:

### Required Variables:

```plaintext
# Django
SECRET_KEY=[generate a strong secret key]
DEBUG=False
ALLOWED_HOSTS=your-railway-domain.railway.app
USE_MYSQL=True

# Database (reference Railway's MySQL service variables)
DB_NAME=${{Mysql.MYSQL_DATABASE}}
DB_USER=${{Mysql.MYSQL_USER}}
DB_PASSWORD=${{Mysql.MYSQL_PASSWORD}}
DB_HOST=${{Mysql.MYSQL_HOST}}
DB_PORT=3306

# Redis (reference Railway's Redis service variables)
REDIS_URL=${{Redis.REDIS_URL}}
CELERY_BROKER_URL=${{Redis.REDIS_URL}}/0
CELERY_RESULT_BACKEND=${{Redis.REDIS_URL}}/0
CELERY_TASK_ALWAYS_EAGER=False

# M-Pesa Configuration
MPESA_CONSUMER_KEY=[your key]
MPESA_CONSUMER_SECRET=[your secret]
MPESA_SHORTCODE=174379
MPESA_PASSKEY=[your passkey]
MPESA_INITIATOR_NAME=Clive@misiko2512
MPESA_INITIATOR_PASSWORD=[your password]
MPESA_ENV=production
MPESA_CALLBACK_URL=https://your-railway-domain.railway.app/api/payments/mpesa/callback/

# Africa's Talking
AFRICASTALKING_API_KEY=[your key]
AFRICASTALKING_USERNAME=Usafilink

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=[your gmail]
EMAIL_HOST_PASSWORD=[app-specific password from Gmail]
DEFAULT_FROM_EMAIL=[your email]
```

---

## Step 3: First Deployment

### Option A: Automatic (Railway Auto-Deploy)
1. Railway auto-deploys when you push to GitHub
2. View logs in Railway dashboard

### Option B: Manual Deployment
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link [project-id]

# Deploy
railway up
```

---

## Step 4: Run Database Migrations

After deployment:

```bash
# Option 1: Via Railway CLI
railway run python backend/manage.py migrate

# Option 2: Via Railway Dashboard
# Go to Service → Web → Run Command
# Enter: python backend/manage.py migrate
```

### Create Superuser
```bash
railway run python backend/manage.py createsuperuser
```

---

## Step 5: Verify Services

### Check Web Service
- Go to Railway dashboard → web service
- Copy the domain URL
- Visit: `https://your-domain.railway.app/api/`
- Should see Django REST Framework interface

### Check Celery Worker
- Go to **worker** service → **Logs**
- Should see "celery@..." worker started message

### Check Celery Beat
- Go to **beat** service → **Logs**
- Should see heartbeat messages (every 2 seconds)

### Check Redis
- Go to **redis** → **Logs**
- Should show connection accepted messages

---

## Step 6: Deploy Frontend on Vercel

### 6.1 Connect Frontend to Vercel
1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import `UsafiLink` from GitHub (or link manually)
4. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install` or `npm ci`

### 6.2 Set Environment Variables
In **Vercel Dashboard** → **Settings** → **Environment Variables**:

```plaintext
VITE_API_BASE_URL=https://your-railway-domain.railway.app/api
```

### 6.3 Deploy
- Click **"Deploy"**
- Wait for deployment to complete
- Vercel provides a domain (e.g., `your-app.vercel.app`)

---

## Step 7: Update Backend CORS Settings

In **Railway dashboard** → **web service** → **Variables**:

Add:
```plaintext
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

Then redeploy the web service.

---

## Step 8: Test the Application

### Test API
```bash
curl -X GET https://your-railway-domain.railway.app/api/
```

### Test Frontend
Visit: `https://your-app.vercel.app`

### Test M-Pesa Callback
1. Make a test payment on frontend
2. Check Railway → web → Logs for callback
3. Verify payment updates in Django admin

### Test Celery Task
```bash
# Via Railway CLI
railway run python backend/manage.py shell

# In shell
from bookings.tasks import send_booking_notification
send_booking_notification.delay(booking_id=1)

# Check worker logs - should see task execution
```

---

## Troubleshooting

### 502 Bad Gateway
```
Check: Web service logs for Django errors
Fix: Ensure migrations ran, database is connected
```

### Celery tasks not running
```
Check: Worker and Beat logs (should show "started")
Check: Redis connection (REDIS_URL format)
Fix: Restart worker service in Railway
```

### Database connection fails
```
Check: DB_HOST is private URL (not public)
Check: DB_NAME, DB_USER, DB_PASSWORD match Railway MySQL service
Fix: Redeploy web service after updating variables
```

### Static files not loading
```
Check: Frontend build artifacts in dist/
Fix: Ensure STATIC_ROOT is set correctly in settings.py
```

---

## Production Monitoring

### Logs
```bash
# View all service logs
railway logs

# Watch specific service
railway logs -s web
railway logs -s worker
railway logs -s beat
```

### Health Checks
- **Web**: Django admin at `https://your-domain.railway.app/admin/`
- **Redis**: Test via Django shell
- **MySQL**: Test via Django ORM

### Performance Monitoring
- Railway dashboard shows CPU/Memory/Disk usage
- Monitor response times in Django logs
- Check Celery task queue depth in worker logs

---

## Next Steps (Lipa na Dev Integration)

After production is stable:
1. [ ] Integrate Lipa na Dev as M-Pesa provider
2. [ ] Update MPESA_CALLBACK_URL to Lipa na Dev endpoint
3. [ ] Test payment flow with Lipa na Dev
4. [ ] Update frontend Lipa na Dev checkout button

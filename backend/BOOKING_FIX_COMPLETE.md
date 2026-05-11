# BOOKING VISIBILITY ISSUE - ROOT CAUSE & SOLUTION

## What Was Wrong
**Customers couldn't see bookings, drivers couldn't see bookings, and SMS notifications weren't sent.**

### Root Cause
1. **Celery Workers Crashed on Windows** - The Celery billiard process pool has known issues on Windows that cause worker crashes
2. **Stuck Tasks in Queue** - Multiple `initiate_driver_search_task` remained in Redis queue but never executed
3. **Bookings Frozen in "searching_driver" Status** - Without task execution, driver matching never completed

### Evidence
- Bookings #14, #15, #16 stuck in `searching_driver` status
- 0 DriverOrderRequests (driver matching never ran)
- Driver never notified (current_notified_driver was NULL)
- Customer could see booking but it wasn't on driver's dashboard

---

## How It Was Fixed

### Step 1: Configure Windows-Compatible Celery
**File Modified:** `backend/backend/settings.py`

Added Windows-specific configuration:
```python
import platform
if platform.system() == 'Windows':
    CELERY_WORKER_POOL = 'solo'
    CELERY_WORKER_PREFETCH_MULTIPLIER = 1
    CELERY_WORKER_MAX_TASKS_PER_CHILD = 1
```

**Why?** The `solo` pool is synchronous and avoids Windows billiard issues.

### Step 2: Restart Celery Worker
Command to use:
```bash
cd backend
python -m celery -A backend worker -l info --pool=solo
```

### Step 3: Process Stuck Tasks
Clear stuck tasks and requeue bookings:
```bash
python backend/clear_celery_queue.py
```

---

## Results

### Before Fix
- Bookings #14-16 in "searching_driver" status
- Driver had 0 visible pending bookings
- SMS notifications: Never sent

### After Fix
- ✅ All bookings in "pending" status
- ✅ Driver can see all 3 customer bookings
- ✅ DriverOrderRequests created (driver notification queued)
- ✅ Booking progression working (Uber-like flow functioning)

---

## Remaining Issues

### SMS Notifications
**Status:** Blocked (test phone blacklisted)
- Current issue: Africa's Talking has test number +254712345678 blacklisted
- Fix: Use real verified phone numbers for testing OR whitelist in Africa's Talking dashboard

Test with:
```python
# Use a real Kenyan number during testing
sms_service.send_sms("+254712XXXXXX", "Test message")
```

---

## To Keep Working

### Local Development
Always start Celery with solo pool:
```bash
python -m celery -A backend worker -l info --pool=solo
```

### Production Deployment
The settings.py automatically uses `solo` pool on Windows, so no changes needed.

### Monitoring
Check task queue:
```bash
redis-cli LLEN celery  # Should be 0 (empty)
```

Check worker status:
```bash
python check_celery_tasks.py  # Shows active/reserved tasks
```

---

## Architecture Now Working

```
Customer Books Service
    ↓
Django View: CreateBooking
    ↓
send_booking_confirmation_task (queued)
    ↓
initiate_driver_search_task (queued) ← ✅ NOW EXECUTING
    ↓
DriverMatchingService.initiate_driver_search()
    ├─ Find online drivers
    ├─ Create DriverOrderRequests
    └─ Notify first driver
        ↓
        send_driver_order_notification_task (queued) ← ✅ EXECUTES
        ↓
        SMS to driver
```

---

## Files Changed
1. `backend/backend/settings.py` - Added Windows Celery configuration
2. `backend/debug_booking_issue.py` - Created diagnostic tool
3. `backend/test_driver_matching.py` - Created manual testing tool
4. `backend/check_celery_tasks.py` - Created queue monitoring tool
5. `backend/clear_celery_queue.py` - Created queue recovery tool
6. `backend/process_stuck_bookings.py` - Created batch processor

---

## Next Steps

1. **Verify New Bookings** - Create a test booking and confirm:
   - ✓ Customer sees it in dashboard
   - ✓ Driver sees it in available bookings
   - ✓ SMS notification sent (when phone is not blacklisted)

2. **Test Complete Flow** - Driver accepts booking and verify:
   - ✓ Status updates to "accepted"
   - ✓ SMS sent to customer
   - ✓ Booking removed from driver's "available" list

3. **Monitor Celery** - Keep `check_celery_tasks.py` handy for debugging

---

## Quick Troubleshooting

**If bookings get stuck again:**
```bash
# 1. Check if Celery is running
python check_celery_tasks.py

# 2. Restart Celery
python -m celery -A backend worker -l info --pool=solo

# 3. Clear and reprocess
python clear_celery_queue.py
```

**If SMS isn't sending:**
```bash
# Check SMS service status
python debug_booking_issue.py
# Look for "6. SMS SERVICE STATUS" section
```

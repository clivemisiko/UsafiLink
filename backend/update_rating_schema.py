import os
import django
import sqlite3

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

# Connect to the SQLite database
db_path = 'db.sqlite3'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Add columns to the rating table if they don't already exist
try:
    # Check current schema
    cursor.execute("PRAGMA table_info(bookings_rating)")
    columns = [row[1] for row in cursor.fetchall()]
    
    # List of columns to add
    columns_to_add = [
        ('is_reviewed_by_admin', 'BOOLEAN DEFAULT 0'),
        ('admin_response', 'TEXT'),
        ('reviewed_by_id', 'INTEGER'),
        ('reviewed_at', 'DATETIME'),
        ('is_flagged', 'BOOLEAN DEFAULT 0'),
        ('flag_reason', 'VARCHAR(255)'),
    ]
    
    for col_name, col_type in columns_to_add:
        if col_name not in columns:
            cursor.execute(f"ALTER TABLE bookings_rating ADD COLUMN {col_name} {col_type}")
            print(f"✓ Added column: {col_name}")
        else:
            print(f"✓ Column already exists: {col_name}")
    
    conn.commit()
    print("\n✓ Database schema updated successfully!")
    
except Exception as e:
    print(f"✗ Error updating schema: {e}")
    conn.rollback()
finally:
    conn.close()

# test_admin.py
import requests
import json

# Login first
login_url = "http://localhost:8000/api/users/login/"
login_data = {
    "username": "admin",
    "password": "admin123"  # Change to your password
}

print("1. Logging in...")
login_response = requests.post(login_url, json=login_data)
print(f"Login Status: {login_response.status_code}")

if login_response.status_code == 200:
    token_data = login_response.json()
    access_token = token_data.get('access')
    print(f"Access Token: {access_token[:50]}...")
    
    # Test admin endpoint
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("\n2. Testing admin dashboard...")
    dashboard_response = requests.get(
        "http://localhost:8000/api/admin/dashboard/",
        headers=headers
    )
    print(f"Dashboard Status: {dashboard_response.status_code}")
    print(f"Dashboard Response: {dashboard_response.text[:200]}...")
    
    print("\n3. Testing admin users...")
    users_response = requests.get(
        "http://localhost:8000/api/admin/users/",
        headers=headers
    )
    print(f"Users Status: {users_response.status_code}")
    print(f"Users Response: {users_response.text[:200]}...")
    
else:
    print(f"Login failed: {login_response.text}")
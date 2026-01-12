import re
from datetime import datetime

def format_phone_number(phone_number):
    """
    Format phone number for M-PESA (2547XXXXXXXX format).
    """
    # Remove any non-digit characters
    phone = re.sub(r'\D', '', phone_number)
    
    # Convert to 254 format
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif phone.startswith('254'):
        pass  # Already in correct format
    else:
        # Assume it's already in international format without +
        if len(phone) == 9:
            phone = '254' + phone
    
    # Ensure it's 12 digits (254 + 9 digits)
    if len(phone) != 12:
        raise ValueError(f"Invalid phone number length: {phone}")
    
    return phone

def validate_mpesa_response(response):
    """
    Validate M-PESA API response.
    """
    if not isinstance(response, dict):
        return False
    
    response_code = response.get('ResponseCode')
    if response_code is None:
        return False
    
    # ResponseCode '0' means success for STK Push
    return response_code == '0'

def generate_transaction_reference(booking_id):
    """
    Generate a unique transaction reference.
    """
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    return f"EXHAUST{booking_id:06d}{timestamp[-6:]}"

def calculate_convenience_fee(amount, payment_method='mpesa'):
    """
    Calculate convenience fee for payment.
    """
    if payment_method == 'mpesa':
        # M-PESA charges based on amount tiers
        if amount <= 100:
            return 0
        elif amount <= 500:
            return 5
        elif amount <= 1000:
            return 10
        elif amount <= 1500:
            return 15
        elif amount <= 2500:
            return 25
        elif amount <= 3500:
            return 35
        elif amount <= 5000:
            return 50
        elif amount <= 7500:
            return 75
        elif amount <= 10000:
            return 100
        elif amount <= 15000:
            return 150
        elif amount <= 20000:
            return 200
        else:
            return 200 + ((amount - 20000) // 10000 * 50)
    else:
        return 0

def is_business_hours():
    """
    Check if current time is within business hours.
    """
    now = datetime.now()
    weekday = now.weekday()  # Monday = 0, Sunday = 6
    
    # Business hours: Mon-Sat, 8AM to 6PM
    if weekday == 6:  # Sunday
        return False
    
    hour = now.hour
    return 8 <= hour < 18
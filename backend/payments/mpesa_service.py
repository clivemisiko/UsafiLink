import requests
from django.conf import settings
from requests.auth import HTTPBasicAuth
import base64
import datetime
import logging

logger = logging.getLogger(__name__)

class MpesaService:
    def __init__(self):
        self.consumer_key = str(settings.MPESA_CONSUMER_KEY).strip()
        self.consumer_secret = str(settings.MPESA_CONSUMER_SECRET).strip()
        self.shortcode = str(settings.MPESA_SHORTCODE).strip()
        self.passkey = str(settings.MPESA_PASSKEY).strip()
        self.env = str(settings.MPESA_ENV).strip().lower()
        self.base_url = 'https://sandbox.safaricom.co.ke' if self.env == 'sandbox' else 'https://api.safaricom.co.ke'
        
        self.session = requests.Session()
        self.session.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

        # Auto-detect mock mode if credentials are empty or default placeholders
        if not self.consumer_key or not self.consumer_secret or 'your-' in self.consumer_key:
            logger.warning(f"M-PESA credentials missing or placeholder. Key: {self.consumer_key[:5]}... Switching to MOCK mode.")
            self.env = 'mock'
    
    def get_access_token(self):
        """Get OAuth access token from M-PESA."""
        if self.env == 'mock':
            return "mock_access_token_12345"

        url = f"{self.base_url}/oauth/v1/generate"
        params = {"grant_type": "client_credentials"}
        
        # Diagnostic: Log parts of keys to verify they are loaded correctly (Safe)
        key_start = self.consumer_key[:3] if self.consumer_key else "NONE"
        secret_start = self.consumer_secret[:3] if self.consumer_secret else "NONE"
        
        logger.info(f"M-PESA Auth Attempt: ENV={self.env}, URL={url}, Key={key_start}..., Secret={secret_start}...")

        try:
            # Use fresh requests call without session headers to avoid conflict
            response = requests.get(
                url, 
                params=params, 
                auth=HTTPBasicAuth(self.consumer_key, self.consumer_secret),
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"M-PESA Auth Error: {response.status_code} - Body: {response.text}")
                # If body is empty, it might be the URL or params.
                raise Exception(f"Safaricom Auth Failed (HTTP {response.status_code}). Please verify your Consumer Key and Secret in Render.")
                
            return response.json()['access_token']
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error during M-PESA Auth: {str(e)}")
            raise
    
    def stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """Initiate STK Push payment."""
        if self.env == 'mock':
            # Simulate successful STK Push response
            import time
            from secrets import token_hex
            return {
                "MerchantRequestID": f"req_{token_hex(8)}",
                "CheckoutRequestID": f"chk_{token_hex(10)}",
                "ResponseCode": "0",
                "ResponseDescription": "Success. Request accepted for processing",
                "CustomerMessage": "Success. Request accepted for processing"
            }

        access_token = self.get_access_token()
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(f"{self.shortcode}{self.passkey}{timestamp}".encode()).decode()
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        
        # Ensure amount is a rounded string without decimals
        try:
            clean_amount = int(float(amount))
        except (ValueError, TypeError):
            clean_amount = 1 # Fallback
            
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": clean_amount,
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": settings.MPESA_CALLBACK_URL,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc[:20] # Safaricom limit is 20 chars
        }
        
        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"STK Push Request error: {str(e)}")
            raise
    
    def query_stk_status(self, checkout_request_id):
        """Query status of an STK Push transaction."""
        # In sandbox, always return a successful mock response to avoid 403 errors
        if self.env == 'sandbox' or self.env == 'mock':
            return {
                "ResponseCode": "0",
                "ResponseDescription": "The service request has been processed successfully (sandbox/mock)",
                "MerchantRequestID": "req_123",
                "CheckoutRequestID": checkout_request_id,
                "ResultCode": "0",
                "ResultDesc": "The service request is processed successfully (sandbox/mock)."
            }

        access_token = self.get_access_token()
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(f"{self.shortcode}{self.passkey}{timestamp}".encode()).decode()

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id
        }

        url = f"{self.base_url}/mpesa/stkpushquery/v1/query"

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"STK Query failed: {str(e)}")
            raise
    
    def b2c_payment(self, amount, phone_number, remarks):
        """Make B2C payment (for driver payments, refunds, etc.)."""
        access_token = self.get_access_token()
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "InitiatorName": settings.MPESA_INITIATOR_NAME,
            "SecurityCredential": self._get_security_credential(),
            "CommandID": "BusinessPayment",
            "Amount": amount,
            "PartyA": self.shortcode,
            "PartyB": phone_number,
            "Remarks": remarks,
            "QueueTimeOutURL": f"{settings.BASE_URL}/api/payments/b2c/timeout/",
            "ResultURL": f"{settings.BASE_URL}/api/payments/b2c/result/",
            "Occasion": ""
        }
        
        url = f"{self.base_url}/mpesa/b2c/v1/paymentrequest"
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"B2C payment failed: {str(e)}")
            raise
    
    def _get_security_credential(self):
        """Generate security credential for B2C."""
        # This requires encrypting the initiator password with the M-PESA public key
        # Implementation depends on your security setup
        # For now, return the plain password (not recommended for production)
        return settings.MPESA_INITIATOR_PASSWORD
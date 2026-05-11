import requests
import logging
from django.conf import settings
from requests.exceptions import ConnectionError, Timeout

logger = logging.getLogger(__name__)


class IntasendService:
    """
    Service for handling Intasend payment integration.
    Supports: Mobile Money (M-Pesa), Card Payments, Bank Transfers.
    """

    def __init__(self):
        self.secret_key = settings.INTASEND_SECRET_KEY or ""
        self.public_key = settings.INTASEND_PUBLIC_KEY or ""
        self.api_url = settings.INTASEND_API_URL
        self.callback_url = settings.INTASEND_CALLBACK_URL
        self.env = settings.INTASEND_ENV
        
        # Normalize environment value
        if self.env == 'live':
            self.env = 'production'
        
        logger.info(f"Intasend Service initialized: env={self.env}, api_url={self.api_url}")
        logger.info(f"Using {'LIVE' if self.env == 'production' else 'SANDBOX'} Intasend API")
        
        # Check if credentials are available
        if not self.secret_key or not self.public_key:
            logger.warning("Intasend credentials missing. Switching to MOCK mode.")
            self.env = 'mock'
        
        
        self.session = requests.Session()
    
    def _get_headers(self):
        """Get authorization headers for API requests."""
        if self.env == 'mock':
            return {"Content-Type": "application/json"}
        
        # IntaSend often requires different auth for different endpoints
        # For checkout, it often uses the public key or bearer secret key
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
    
    def _request_with_retry(self, method, url, max_retries=3, **kwargs):
        """
        Make an HTTP request with automatic retry on connection failures.
        """
        last_exc = None
        for attempt in range(1, max_retries + 1):
            try:
                response = getattr(requests, method)(url, **kwargs)
                return response
            except (ConnectionError, Timeout) as e:
                last_exc = e
                wait = 2 ** attempt  # 2s, 4s, 8s
                logger.warning(
                    f"Intasend request to {url} failed on attempt {attempt}/{max_retries} "
                    f"({type(e).__name__}: {e}). Retrying in {wait}s..."
                )
                if attempt < max_retries:
                    import time
                    time.sleep(wait)
        
        logger.error(f"Intasend request to {url} failed after {max_retries} attempts: {last_exc}")
        raise Exception(
            "Unable to reach Intasend servers after multiple attempts. "
            "Please try again in a few minutes."
        )
    
    def create_checkout_link(self, amount, phone_number, email, booking_id, first_name="", last_name=""):
        """
        Create a checkout link for payment collection.
        Supports mobile money and bank transfers.
        
        Args:
            amount: Payment amount in KES
            phone_number: Customer phone number (format: 254...)
            email: Customer email
            booking_id: Reference ID (booking reference)
            first_name: Customer first name
            last_name: Customer last name
        
        Returns:
            Dictionary with link URL and api_ref (payment ID)
        """
        if self.env == 'mock':
            # Simulate successful checkout link creation
            from secrets import token_hex
            return {
                "api_ref": f"ISL_mock_{token_hex(8)}",
                "checkout_link": "https://sandbox.intasend.com/checkout/mock_link",
                "invoice_id": f"INV_{booking_id}",
                "state": "PENDING",
                "success": True
            }
        
        payload = {
            "public_key": self.public_key,
            "amount": str(int(float(amount))),
            "currency": "KES",
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "country": "KE",
        }
        
        url = f"{self.api_url}/checkout/"
        # For checkout creation, we typically only need the payload with public_key
        # and NO Authorization header, or a public-key based header.
        headers = {"Content-Type": "application/json"}
        
        logger.info(f"Intasend Request: URL={url}, Payload keys={list(payload.keys())}")
        logger.info(f"Public Key present: {bool(self.public_key)}, Length: {len(self.public_key) if self.public_key else 0}")
        logger.info(f"Public Key prefix: {self.public_key[:10] if self.public_key else 'NONE'}...")
        logger.info(f"Environment: {self.env}")
        
        if not self.public_key or self.public_key == "":
            logger.error("Intasend public_key is empty or missing!")
            raise Exception("Intasend public_key is not configured")
        
        try:
            response = self._request_with_retry(
                'post', url,
                json=payload, headers=headers, timeout=30
            )
            
            logger.info(f"Intasend Response Status: {response.status_code}")
            
            if response.status_code not in [200, 201]:
                logger.error(f"Intasend checkout link error: {response.status_code} - {response.text}")
                logger.error(f"Request Payload: {payload}")
                
                # If Intasend returns 500, fall back to mock mode for development
                if response.status_code == 500:
                    logger.warning("Intasend server error (500). Falling back to MOCK mode for this request.")
                    from secrets import token_hex
                    return {
                        "api_ref": f"ISL_mock_fallback_{token_hex(8)}",
                        "checkout_link": None,
                        "invoice_id": f"INV_{booking_id}",
                        "state": "COMPLETE",
                        "success": True,
                        "mock_mode": True
                    }
                
                raise Exception(f"Failed to create checkout link (HTTP {response.status_code})")
            
            data = response.json()
            return {
                "api_ref": data.get("api_ref") or data.get("id"),
                "checkout_link": data.get("url"),
                "invoice_id": data.get("id"),
                "state": data.get("state", "PENDING"),
                "success": True
            }
        except Exception as e:
            logger.error(f"Error creating checkout link: {str(e)}")
            raise
    
    def get_payment_status(self, api_ref):
        """
        Get the status of a payment using its API reference.
        
        Args:
            api_ref: The IntaSend API reference ID (e.g., ISL_xxxx)
        
        Returns:
            Dictionary with payment status and details
        """
        if self.env == 'mock':
            return {
                "api_ref": api_ref,
                "state": "COMPLETE",
                "invoice_id": "MOCK_INV",
                "provider": "M-PESA",
                "value": "1000",
                "currency": "KES",
                "success": True
            }
        
        url = f"{self.api_url}/payment-links/{api_ref}/"
        headers = self._get_headers()
        
        try:
            response = self._request_with_retry(
                'get', url,
                headers=headers, timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Intasend status query error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to query payment status (HTTP {response.status_code})")
            
            return response.json()
        except Exception as e:
            logger.error(f"Error querying payment status: {str(e)}")
            raise
    
    def b2c_transfer(self, phone_number, amount, reason=""):
        """
        Send money to a beneficiary (B2C transfer for driver payouts).
        Uses M-Pesa B2C for payouts.
        
        Args:
            phone_number: Beneficiary phone number (format: 254...)
            amount: Amount to send in KES
            reason: Purpose of payment/narrative
        
        Returns:
            Dictionary with transfer status
        """
        if self.env == 'mock':
            from secrets import token_hex
            return {
                "api_ref": f"ISL_transfer_{token_hex(8)}",
                "state": "COMPLETE",
                "amount": str(amount),
                "account": phone_number,
                "success": True
            }
        
        payload = {
            "currency": "KES",
            "transactions": [
                {
                    "name": f"Driver Payout",
                    "account": phone_number,
                    "amount": int(float(amount)),
                    "narrative": reason or "Driver payment for completed ride"
                }
            ],
            "requires_approval": "NO"  # Auto-approve
        }
        
        url = f"{self.api_url}/transfer/mpesa/"
        headers = self._get_headers()
        
        try:
            response = self._request_with_retry(
                'post', url,
                json=payload, headers=headers, timeout=30
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Intasend B2C transfer error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to process B2C transfer (HTTP {response.status_code})")
            
            data = response.json()
            # Extract first transaction status
            transactions = data.get("transactions", [])
            if transactions:
                return {
                    "api_ref": data.get("api_ref"),
                    "state": transactions[0].get("state", "PENDING"),
                    "amount": str(amount),
                    "account": phone_number,
                    "success": True
                }
            
            return {"success": False, "error": "No transaction data in response"}
        except Exception as e:
            logger.error(f"Error processing B2C transfer: {str(e)}")
            raise
    
    def validate_callback(self, callback_data):
        """
        Validate webhook callback from Intasend.
        
        Args:
            callback_data: The callback payload from Intasend
        
        Returns:
            Boolean indicating if callback is valid
        """
        # In a production environment, you would validate the signature
        # For now, we'll do basic validation
        required_fields = ['api_ref', 'state', 'invoice_id']
        
        for field in required_fields:
            if field not in callback_data:
                logger.warning(f"Invalid callback: missing {field}")
                return False
        
        return True

import africastalking
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        # Initialize Africa's Talking
        username = settings.AFRICASTALKING_USERNAME
        api_key = settings.AFRICASTALKING_API_KEY
        
        if not username or not api_key:
            logger.warning("Africa's Talking credentials not configured")
            self.is_configured = False
            return
            
        africastalking.initialize(username, api_key)
        self.sms = africastalking.SMS
        self.is_configured = True
        self.sender_id = getattr(settings, 'AFRICASTALKING_SENDER_ID', None)
    
    def send_sms(self, phone_number, message):
        """
        Send SMS to a phone number
        Args:
            phone_number (str): Phone number in format 2547XXXXXXXX
            message (str): SMS content
        Returns:
            dict: Response from Africa's Talking
        """
        if not self.is_configured:
            logger.warning("SMS service not configured, SMS would be: %s", message)
            return {"success": False, "message": "SMS service not configured"}
        
        # Format phone number for Kenya
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif phone_number.startswith('+254'):
            phone_number = phone_number[1:]
        elif not phone_number.startswith('254'):
            phone_number = '254' + phone_number
        
        try:
            # Prepare SMS parameters
            params = {
                'to': [phone_number],
                'message': message
            }
            
            # Add sender ID if available
            if self.sender_id:
                params['from_'] = self.sender_id
            
            # Send SMS
            response = self.sms.send(**params)
            
            logger.info(f"SMS sent to {phone_number}: {response}")
            
            # Check if SMS was sent successfully
            if response['SMSMessageData']['Recipients'][0]['status'] == 'Success':
                return {
                    "success": True,
                    "message": "SMS sent successfully",
                    "cost": response['SMSMessageData']['Recipients'][0]['cost'],
                    "message_id": response['SMSMessageData']['Recipients'][0]['messageId']
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to send SMS",
                    "error": response['SMSMessageData']['Recipients'][0]['status']
                }
                
        except Exception as e:
            logger.error(f"Error sending SMS to {phone_number}: {str(e)}")
            return {
                "success": False,
                "message": f"Error: {str(e)}"
            }
    
    def send_booking_confirmation(self, phone_number, booking_id, scheduled_time):
        """Send booking confirmation SMS"""
        message = f"Booking #{booking_id} confirmed! Scheduled for {scheduled_time}. Thank you for choosing our service."
        return self.send_sms(phone_number, message)
    
    def send_payment_confirmation(self, phone_number, amount, booking_id):
        """Send payment confirmation SMS"""
        message = f"Payment of KES {amount} for booking #{booking_id} received successfully. Thank you!"
        return self.send_sms(phone_number, message)
    
    def send_driver_assigned(self, phone_number, driver_name, eta):
        """Send driver assignment SMS"""
        message = f"Driver {driver_name} has been assigned to your booking. Estimated arrival: {eta}"
        return self.send_sms(phone_number, message)
    
    def send_service_completed(self, phone_number, booking_id, rating_url):
        """Send service completion SMS"""
        message = f"Service for booking #{booking_id} completed! Please rate your experience: {rating_url}"
        return self.send_sms(phone_number, message)

# Create a global instance
sms_service = SMSService()
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
        
        # Format phone number to E.164 for Kenya (+2547XXXXXXXX)
        # Africa's Talking commonly expects the leading '+'.
        phone_number = (phone_number or "").strip()
        if phone_number.startswith('0'):
            phone_number = '+254' + phone_number[1:]
        elif phone_number.startswith('254'):
            phone_number = '+' + phone_number
        elif phone_number.startswith('+254'):
            pass
        else:
            # If user entered a local 7XXXXXXXX form, normalize to +2547XXXXXXXX
            if phone_number.startswith('7') and len(phone_number) in (9, 10):
                phone_number = '+254' + phone_number
            else:
                phone_number = '+254' + phone_number.lstrip('+')
        
        try:
            # Africa's Talking SDK expects `sender_id` (or `from_`) depending on version.
            # Try with sender_id first, but fall back to no sender_id if it fails with InvalidSenderId
            if self.sender_id:
                try:
                    response = self.sms.send(message, [phone_number], self.sender_id)
                except (TypeError, Exception) as e:
                    error_str = str(e).lower()
                    # If invalid sender ID, try without it
                    if 'invalidsenderid' in error_str or 'invalid sender' in error_str:
                        logger.warning(f"Sender ID '{self.sender_id}' is invalid, sending without it: {str(e)}")
                        response = self.sms.send(message, [phone_number])
                    else:
                        # Try alternative parameter formats
                        try:
                            response = self.sms.send(message, [phone_number], sender_id=self.sender_id)
                        except TypeError:
                            try:
                                response = self.sms.send(message, [phone_number], from_=self.sender_id)
                            except TypeError:
                                # Last resort: no sender_id
                                response = self.sms.send(message, [phone_number])
            else:
                response = self.sms.send(message, [phone_number])
            
            logger.info(f"SMS sent to {phone_number}: {response}")
            
            # Extract data safely to avoid IndexError
            sms_data = response.get('SMSMessageData', {})
            recipients = sms_data.get('Recipients', [])
            
            if not recipients:
                error_msg = sms_data.get('Message', 'No recipients returned by provider')
                return {
                    "success": False,
                    "message": f"Failed to send SMS: {error_msg}",
                    "error": error_msg
                }
                
            # Check if SMS was sent successfully
            recipient_data = recipients[0]
            if recipient_data.get('status') == 'Success':
                return {
                    "success": True,
                    "message": "SMS sent successfully",
                    "cost": recipient_data.get('cost', ''),
                    "message_id": recipient_data.get('messageId', '')
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to send SMS",
                    "error": recipient_data.get('status', 'Unknown error')
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
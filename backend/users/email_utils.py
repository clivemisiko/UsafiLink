from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_verification_email(user, frontend_url='http://localhost:5173'):
    """
    Send email verification link to user
    """
    verification_token = user.email_verification_token
    verification_link = f"{frontend_url}/verify-email/{verification_token}"
    
    subject = 'Verify Your UsafiLink Account'
    
    # HTML email content
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .button {{
                display: inline-block;
                padding: 15px 30px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                color: #6b7280;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚛 UsafiLink</h1>
                <p>Welcome to Professional Exhauster Services</p>
            </div>
            <div class="content">
                <h2>Hello {user.first_name or user.username}!</h2>
                <p>Thank you for registering with UsafiLink. We're excited to have you on board!</p>
                <p>To complete your registration and start using our services, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center;">
                    <a href="{verification_link}" class="button">Verify Email Address</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #2563eb;">{verification_link}</p>
                
                <p><strong>This link will expire in 24 hours.</strong></p>
                
                <p>If you didn't create an account with UsafiLink, please ignore this email.</p>
                
                <div class="footer">
                    <p>© 2026 UsafiLink. All rights reserved.</p>
                    <p>Professional Exhauster Services in Nairobi, Kenya</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    plain_message = f"""
    Hello {user.first_name or user.username}!
    
    Thank you for registering with UsafiLink. We're excited to have you on board!
    
    To complete your registration and start using our services, please verify your email address by clicking the link below:
    
    {verification_link}
    
    This link will expire in 24 hours.
    
    If you didn't create an account with UsafiLink, please ignore this email.
    
    © 2026 UsafiLink. All rights reserved.
    Professional Exhauster Services in Nairobi, Kenya
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False


def send_welcome_email(user):
    """
    Send welcome email after successful verification
    """
    subject = 'Welcome to UsafiLink! 🎉'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .feature {{
                background: white;
                padding: 15px;
                margin: 10px 0;
                border-left: 4px solid #2563eb;
                border-radius: 4px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Email Verified!</h1>
                <p>Your account is now active</p>
            </div>
            <div class="content">
                <h2>Welcome to UsafiLink, {user.first_name or user.username}!</h2>
                <p>Your email has been successfully verified. You can now access all features of your {user.role} account.</p>
                
                <h3>What's Next?</h3>
                
                <div class="feature">
                    <strong>🔐 Login to Your Account</strong>
                    <p>Use your credentials to access your dashboard</p>
                </div>
                
                <div class="feature">
                    <strong>📅 Book Services</strong>
                    <p>Schedule exhauster services at your convenience</p>
                </div>
                
                <div class="feature">
                    <strong>💳 Secure Payments</strong>
                    <p>Pay via M-PESA or Bank Transfer</p>
                </div>
                
                <div class="feature">
                    <strong>📱 Track in Real-Time</strong>
                    <p>Monitor your service requests live</p>
                </div>
                
                <p style="margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
                
                <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
                    <p>© 2026 UsafiLink. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Welcome to UsafiLink, {user.first_name or user.username}!
    
    Your email has been successfully verified. You can now access all features of your {user.role} account.
    
    What's Next?
    - Login to Your Account
    - Book Services
    - Make Secure Payments
    - Track Services in Real-Time
    
    If you have any questions, feel free to contact our support team.
    
    © 2026 UsafiLink. All rights reserved.
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending welcome email: {e}")
        return False

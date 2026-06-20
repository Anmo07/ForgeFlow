import os
import json
from typing import Optional
from abc import ABC, abstractmethod
from datetime import datetime
import logging
logger = logging.getLogger(__name__)

class EmailBackend(ABC):

    @abstractmethod
    def send(self, to: str, subject: str, html_body: str, text_body: Optional[str]=None) -> bool:
        pass

class SMTPBackend(EmailBackend):

    def __init__(self):
        self.host = os.getenv('SMTP_HOST', 'localhost')
        self.port = int(os.getenv('SMTP_PORT', '587'))
        self.username = os.getenv('SMTP_USERNAME')
        self.password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('SMTP_FROM_EMAIL', 'noreply@forgeflow.local')
        self.use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'

    def send(self, to: str, subject: str, html_body: str, text_body: Optional[str]=None) -> bool:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to
            if text_body:
                msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))
            with smtplib.SMTP(self.host, self.port) as server:
                if self.use_tls:
                    server.starttls()
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.send_message(msg)
            logger.info(f'Email sent to {to}: {subject}')
            return True
        except Exception as e:
            logger.error(f'SMTP send failed: {e}')
            return False

class ConsoleBackend(EmailBackend):

    def send(self, to: str, subject: str, html_body: str, text_body: Optional[str]=None) -> bool:
        logger.info(f'\n        ───────────────────────────────────────\n        EMAIL: {subject}\n        TO: {to}\n        ───────────────────────────────────────\n        {text_body or html_body}\n        ───────────────────────────────────────\n        ')
        return True

class FileBackend(EmailBackend):

    def __init__(self):
        self.log_dir = os.getenv('EMAIL_LOG_DIR', '/tmp/forgeflow_emails')
        os.makedirs(self.log_dir, exist_ok=True)

    def send(self, to: str, subject: str, html_body: str, text_body: Optional[str]=None) -> bool:
        try:
            timestamp = datetime.utcnow().isoformat()
            filename = f"{self.log_dir}/email_{timestamp.replace(':', '-')}.json"
            data = {'timestamp': timestamp, 'to': to, 'subject': subject, 'text_body': text_body, 'html_body': html_body}
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info(f'Email logged to {filename}')
            return True
        except Exception as e:
            logger.error(f'File logging failed: {e}')
            return False

def get_email_backend() -> EmailBackend:
    backend_name = os.getenv('EMAIL_BACKEND', 'console').lower()
    if backend_name == 'smtp':
        return SMTPBackend()
    elif backend_name == 'file':
        return FileBackend()
    else:
        return ConsoleBackend()

class EmailService:

    def __init__(self):
        self.backend = get_email_backend()
        self.from_email = os.getenv('SMTP_FROM_EMAIL', 'noreply@forgeflow.local')

    def send_invite_email(self, to_email: str, invite_token: str, org_name: str, inviter_name: str) -> bool:
        api_url = os.getenv('NEXT_PUBLIC_API_URL', 'https://app.forgeflow.local')
        accept_url = f'{api_url}/accept-invite?token={invite_token}'
        subject = f"You're invited to join {org_name} on ForgeFlow"
        html_body = f'''\n        <html>\n            <body style="font-family: Arial, sans-serif;">\n                <h2>You're invited to {org_name}!</h2>\n                <p>Hi,</p>\n                <p>{inviter_name} has invited you to join <strong>{org_name}</strong> on ForgeFlow.</p>\n                <p>\n                    <a href="{accept_url}" \n                       style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">\n                        Accept Invitation\n                    </a>\n                </p>\n                <p style="color: #666; font-size: 12px;">\n                    Or copy this link: {accept_url}\n                </p>\n                <p style="color: #666; font-size: 12px;">\n                    This invitation expires in 7 days.\n                </p>\n            </body>\n        </html>\n        '''
        text_body = f"\n        You're invited to join {org_name} on ForgeFlow!\n        \n        {inviter_name} has invited you to join {org_name}.\n        \n        Accept your invitation here: {accept_url}\n        \n        This invitation expires in 7 days.\n        "
        return self.backend.send(to_email, subject, html_body, text_body)

    def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        api_url = os.getenv('NEXT_PUBLIC_API_URL', 'https://app.forgeflow.local')
        reset_url = f'{api_url}/reset-password?token={reset_token}'
        subject = 'Reset your ForgeFlow password'
        html_body = f'''\n        <html>\n            <body style="font-family: Arial, sans-serif;">\n                <h2>Reset your password</h2>\n                <p>Hi,</p>\n                <p>We received a request to reset your ForgeFlow password.</p>\n                <p>\n                    <a href="{reset_url}" \n                       style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">\n                        Reset Password\n                    </a>\n                </p>\n                <p style="color: #666; font-size: 12px;">\n                    Or copy this link: {reset_url}\n                </p>\n                <p style="color: #666; font-size: 12px;">\n                    This link expires in 15 minutes.\n                </p>\n                <p style="color: #666; font-size: 12px;">\n                    If you didn't request this, you can safely ignore this email.\n                </p>\n            </body>\n        </html>\n        '''
        text_body = f"\n        We received a request to reset your ForgeFlow password.\n        \n        Reset your password here: {reset_url}\n        \n        This link expires in 15 minutes.\n        \n        If you didn't request this, you can safely ignore this email.\n        "
        return self.backend.send(to_email, subject, html_body, text_body)

    def send_email_verification(self, to_email: str, verification_token: str) -> bool:
        api_url = os.getenv('NEXT_PUBLIC_API_URL', 'https://app.forgeflow.local')
        verify_url = f'{api_url}/verify-email?token={verification_token}'
        subject = 'Verify your ForgeFlow email address'
        html_body = f'\n        <html>\n            <body style="font-family: Arial, sans-serif;">\n                <h2>Verify your email address</h2>\n                <p>Hi,</p>\n                <p>Please verify your email address to complete your ForgeFlow registration.</p>\n                <p>\n                    <a href="{verify_url}" \n                       style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">\n                        Verify Email\n                    </a>\n                </p>\n                <p style="color: #666; font-size: 12px;">\n                    Or copy this link: {verify_url}\n                </p>\n                <p style="color: #666; font-size: 12px;">\n                    This link expires in 24 hours.\n                </p>\n            </body>\n        </html>\n        '
        text_body = f'\n        Please verify your email address to complete your ForgeFlow registration.\n        \n        Verify your email here: {verify_url}\n        \n        This link expires in 24 hours.\n        '
        return self.backend.send(to_email, subject, html_body, text_body)
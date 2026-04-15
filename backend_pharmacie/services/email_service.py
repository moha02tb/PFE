"""SMTP email delivery service."""

import os
import smtplib
from email.message import EmailMessage


class EmailService:
    """Send transactional emails through an SMTP server."""

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "").strip()
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "").strip()
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_from_email = os.getenv("SMTP_FROM_EMAIL", "").strip()
        self.smtp_from_name = os.getenv("SMTP_FROM_NAME", "PharmacieConnect").strip()
        self.use_tls = os.getenv("SMTP_USE_TLS", "true").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }
        self.use_ssl = os.getenv("SMTP_USE_SSL", "false").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }
        self.backend_public_url = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000").rstrip("/")

    def _ensure_configured(self):
        if not self.smtp_host or not self.smtp_from_email:
            raise RuntimeError(
                "SMTP is not configured. Set SMTP_HOST and SMTP_FROM_EMAIL to enable email verification."
            )

    def _build_message(self, recipient_email: str, subject: str, body: str) -> EmailMessage:
        message = EmailMessage()
        message["From"] = f"{self.smtp_from_name} <{self.smtp_from_email}>"
        message["To"] = recipient_email
        message["Subject"] = subject
        message.set_content(body)
        return message

    def send_email(self, recipient_email: str, subject: str, body: str) -> None:
        self._ensure_configured()
        message = self._build_message(recipient_email, subject, body)

        if self.use_ssl:
            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                if self.smtp_username:
                    server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)
            return

        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.ehlo()
            if self.use_tls:
                server.starttls()
                server.ehlo()
            if self.smtp_username:
                server.login(self.smtp_username, self.smtp_password)
            server.send_message(message)

    def send_verification_email(self, recipient_email: str, username: str, code: str) -> None:
        subject = "Your PharmacieConnect verification code"
        body = (
            f"Hello {username},\n\n"
            "Thanks for creating your PharmacieConnect account.\n"
            "Use the verification code below to activate your account:\n\n"
            f"{code}\n\n"
            "This code expires in 15 minutes.\n\n"
            "If you did not create this account, you can ignore this email.\n"
        )
        self.send_email(recipient_email, subject, body)

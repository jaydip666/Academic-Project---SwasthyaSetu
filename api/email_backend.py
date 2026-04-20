# ================= BACKEND FILE =================
# File: email_backend.py
# Purpose: Custom SMTP backend for Python 3.12+ compatibility
# Handles: Secure SMTP connection and authentication for system emails

import smtplib
import socket
import ssl
from django.core.mail.backends.smtp import EmailBackend as DjangoEmailBackend

class EmailBackend(DjangoEmailBackend):
    """
    Custom SMTP Email Backend for Python 3.12+ compatibility with Django 3.0.x.
    Python 3.12+ removed 'keyfile' and 'certfile' arguments from SMTP.starttls().
    Django 3.0.x relies on these arguments.
    """
    def open(self):
        if self.connection:
            return False
        
        connection_params = {}
        if self.timeout is not None:
            connection_params['timeout'] = self.timeout
        
        try:
            self.connection = self.connection_class(self.host, self.port, **connection_params)
            
            if self.use_tls:
                # In Python 3.12+, keyfile and certfile are removed from starttls().
                # Creating a default SSL context.
                context = ssl.create_default_context()
                self.connection.starttls(context=context)
                
            if self.username and self.password:
                self.connection.login(self.username, self.password)
            return True
        except (socket.error, smtplib.SMTPException):
            if not self.fail_silently:
                raise
            return False

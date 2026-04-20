# ================= BACKEND FILE =================
# File: utils.py
# Purpose: Utility functions for asynchronous email notifications and system notifications
# Handles: Email sending, Appointment notifications, and Admin notifications

from django.core.mail import send_mail
from django.conf import settings
import threading

def send_email_async(subject, recipient_list, message, html_message=None):
    """
    Sends an email asynchronously to avoid blocking the API response.
    """
    def _send():
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
            print(f"Email sent to {recipient_list}")
        except Exception as e:
            print(f"Failed to send email: {e}")

    thread = threading.Thread(target=_send)
    thread.start()

def notify_appointment_booking(appointment, doctor_email, patient_email):
    """
    Sends booking notifications to both doctor and patient.
    """
    # Notify Patient
    patient_subject = "Appointment Request Received - Swasthya Setu"
    patient_msg = f"Hello {appointment['patient_name']},\n\nYour appointment with Dr. {appointment['doctor_name']} is booked for {appointment['appointment_date']} at {appointment['appointment_time']}.\nStatus: {appointment['status'].replace('_', ' ').title()}\n\nRegards,\nSwasthya Setu Team"
    send_email_async(patient_subject, [patient_email], patient_msg)

    # Notify Doctor
    doctor_subject = "New Appointment Request - Swasthya Setu"
    doctor_msg = f"Hello Dr. {appointment['doctor_name']},\n\nYou have a new appointment request from {appointment['patient_name']}.\nDate: {appointment['appointment_date']}\nTime: {appointment['appointment_time']}\n\nRegards,\nSwasthya Setu Team"
    send_email_async(doctor_subject, [doctor_email], doctor_msg)

def notify_payment_confirmation(appointment, transaction_number, doctor_email, patient_email):
    """
    Sends payment confirmation notifications to both doctor and patient.
    """
    # Notify Patient
    patient_subject = "Appointment Confirmed - Swasthya Setu"
    patient_msg = f"Hello {appointment['patient_name']},\n\nYour appointment with Dr. {appointment['doctor_name']} has been successfully confirmed.\nDate: {appointment['appointment_date']}\nTime: {appointment['appointment_time']}\nTransaction ID: {transaction_number}\n\nRegards,\nSwasthya Setu Team"
    send_email_async(patient_subject, [patient_email], patient_msg)

    # Notify Doctor
    doctor_subject = "Payment Confirmed: New Appointment - Swasthya Setu"
    doctor_msg = f"Hello Dr. {appointment['doctor_name']},\n\nPayment has been received for your appointment with {appointment['patient_name']}.\nDate: {appointment['appointment_date']}\nTime: {appointment['appointment_time']}\n\nPlease check your dashboard for further details.\n\nRegards,\nSwasthya Setu Team"
    send_email_async(doctor_subject, [doctor_email], doctor_msg)

def create_notification(user_id, notification_type, title, message):
    """
    Creates an internal notification record in MongoDB.
    """
    from datetime import datetime
    from .db import notifications_collection
    
    notification = {
        'notification_id': get_next_id('notifications', prefix='n'),
        'user_id': user_id,
        'notification_type': notification_type,
        'title': title,
        'message': message,
        'is_read': False,
        'created_at': datetime.now()
    }
    notifications_collection.insert_one(notification)

def notify_admins(notification_type, title, message):
    """
    Creates an internal notification record for all admins.
    """
    from .db import users_collection
    admins = list(users_collection.find({'role': 'admin'}))
    for admin in admins:
        create_notification(str(admin['_id']), notification_type, title, message)

def notify_reschedule_proposal(appointment, doctor_name, patient_email):
    """
    Notifies patient about a reschedule proposal.
    """
    subject = "Appointment Reschedule Proposed - Swasthya Setu"
    message = f"Hello {appointment['patient_name']},\n\nDr. {doctor_name} has proposed to reschedule your appointment to {appointment['proposed_date']} at {appointment['proposed_time']}.\n\nPlease log in to your dashboard to review and accept/decline the proposal.\n\nRegards,\nSwasthya Setu Team"
    send_email_async(subject, [patient_email], message)

def notify_reschedule_response(appointment, action, doctor_email):
    """
    Notifies doctor about patient's response to reschedule.
    """
    status_text = "accepted" if action == 'accept' else "declined"
    subject = f"Reschedule Proposal {status_text.title()} - Swasthya Setu"
    message = f"Hello Dr. {appointment['doctor_name']},\n\n{appointment['patient_name']} has {status_text} your proposal to reschedule the appointment.\n\nRegards,\nSwasthya Setu Team"
    send_email_async(subject, [doctor_email], message)
def notify_doctor_registration_action(doctor_name, doctor_email, status):
    """
    Notifies doctor about their registration approval or rejection.
    """
    from datetime import datetime
    subject = f"Registration {status.title()} - Swasthya Setu"
    
    if status.lower() == 'approved':
        message = f"Hello Dr. {doctor_name},\n\nCongratulations! Your registration request with Swasthya Setu has been approved. Your account is now active and you can log in to your dashboard.\n\nStatus: Approved\nDate & Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\nRegards,\nSwasthya Setu Team"
    else:
        message = f"Hello Dr. {doctor_name},\n\nWe regret to inform you that your registration request with Swasthya Setu was not approved at this time.\n\nStatus: Rejected\nDate & Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\nRegards,\nSwasthya Setu Team"
        
    send_email_async(subject, [doctor_email], message)

def notify_token_generated(appointment, token_number, patient_email):
    """
    Notifies patient when a token number is generated for their appointment.
    """
    subject = "Token Number Generated - Swasthya Setu"
    message = (
        f"Hello {appointment['patient_name']},\n\n"
        f"A token number has been generated for your appointment with Dr. {appointment['doctor_name']}.\n\n"
        f"Token Number: {token_number}\n"
        f"Appointment Date: {appointment['appointment_date']}\n"
        f"Appointment Time: {appointment['appointment_time']}\n\n"
        f"Please show this token number at the reception on your arrival.\n\n"
        f"Regards,\nSwasthya Setu Team"
    )
    send_email_async(subject, [patient_email], message)

def get_next_id(name, prefix='', padding=3):
    """
    Atomically increments and returns the next sequential integer ID
    for a given collection name, using MongoDB's findOneAndUpdate.
    
    Returns a formatted string like 'u001' or 'p001' if a prefix is provided.
    
    On first use, seeds the counter from the current document count
    in that collection so it never collides with existing records.
    """
    from .db import db
    from pymongo import ReturnDocument

    # Seeding Logic: If the counter doesn't exist, seed it with the current collection count
    existing = db['counters'].find_one({'name': name})
    if not existing:
        try:
            current_count = db[name].count_documents({})
        except Exception:
            current_count = 0
        db['counters'].update_one(
            {'name': name},
            {'$setOnInsert': {'name': name, 'value': current_count}},
            upsert=True
        )

    result = db['counters'].find_one_and_update(
        {'name': name},
        {'$inc': {'value': 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    
    value = result['value']
    if prefix:
        return f"{prefix}{value:0{padding}d}"
    return value

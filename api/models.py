# ================= BACKEND FILE =================
# File: models.py
# Purpose: Database schema definitions for Swasthya Setu
# Handles: User, Patient, Doctor, Hospital, Appointment, and Record entities
"""
Swasthya Setu - Database Models
Healthcare Management System Models based on Data Dictionary
"""

from djongo import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


# User Model - Base authentication model
class User(AbstractUser):
    """
    Base User model for authentication
    Extends Django's AbstractUser
    """
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    phone_no = models.CharField(max_length=15)
    user_id = models.CharField(max_length=50, null=True, blank=True, default='0')
    security_question = models.CharField(max_length=255, null=True, blank=True)
    security_answer = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.username} ({self.role})"


# Patient Model
class Patient(models.Model):
    """
    Patient information model
    Stores patient demographics and contact details
    """
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    patient_id = models.CharField(max_length=50, primary_key=True)
    patient_name = models.CharField(max_length=100)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    age = models.IntegerField()
    dob = models.DateField()
    address = models.CharField(max_length=200)
    phone_no = models.CharField(max_length=20, unique=True)
    created_at = models.DateField(auto_now_add=True)
    
    class Meta:
        db_table = 'patients'
    
    def __str__(self):
        return f"{self.patient_name} (ID: {self.patient_id})"


# Doctor Model
class Doctor(models.Model):
    """
    Doctor information model
    Stores doctor professional details
    """
    MEDICAL_SYSTEM_CHOICES = [
        ('Allopathic', 'Allopathic'),
        ('Homeopathic', 'Homeopathic'),
        ('Ayurvedic', 'Ayurvedic'),
        ('Other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('suspended', 'Suspended'),
    ]
    
    doctor_id = models.CharField(max_length=50, primary_key=True)
    doctor_name = models.CharField(max_length=100)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialization = models.CharField(max_length=100)
    medical_system = models.CharField(max_length=20, choices=MEDICAL_SYSTEM_CHOICES, default='Allopathic')
    email = models.EmailField(unique=True)
    phone_no = models.CharField(max_length=15)
    license_no = models.CharField(max_length=50, blank=True, null=True)
    experience = models.IntegerField(default=0)
    consultation_fee = models.IntegerField(default=500)
    commission_percentage = models.IntegerField(default=0)
    max_patients_per_slot = models.IntegerField(default=10)
    clinic_address = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    education = models.TextField(blank=True, null=True) 
    hospital = models.ForeignKey('Hospital', on_delete=models.SET_NULL, null=True, blank=True, related_name='doctors')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    schedule = models.JSONField(default=list) # Structure: [{"day": "Monday", "start_time": "09:00", "end_time": "17:00"}]
    created_at = models.DateField(auto_now_add=True)
    
    class Meta:
        db_table = 'doctors'
    
    def __str__(self):
        return f"Dr. {self.doctor_name} - {self.specialization}"


# Hospital Model
class Hospital(models.Model):
    """
    Hospital information model
    Stores hospital details and location
    """
    hospital_id = models.CharField(max_length=50, primary_key=True)
    hospital_name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone_no = models.CharField(max_length=15)
    created_at = models.DateField(auto_now_add=True)
    
    class Meta:
        db_table = 'hospitals'
    
    def __str__(self):
        return self.hospital_name


# Appointment Model
class Appointment(models.Model):
    """
    Appointment booking model
    Manages patient-doctor appointments
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    CONSULTATION_CHOICES = [
        ('General Consultation', 'General Consultation'),
        ('Specialized Case', 'Specialized Case'),
        ('Emergency Sync', 'Emergency Sync'),
        ('Neural/Follow-up', 'Neural/Follow-up'),
    ]
    
    appointment_id = models.CharField(max_length=50, primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True)
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    consultation_type = models.CharField(max_length=50, choices=CONSULTATION_CHOICES, default='General Consultation')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    token_number = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'appointments'
        ordering = ['-appointment_date', '-appointment_time']
    
    def __str__(self):
        return f"Appointment {self.appointment_id} - {self.patient.patient_name} with Dr. {self.doctor.doctor_name}"
    
    def generate_token(self):
        """Generate unique token for appointment"""
        self.token_number = f"P{self.patient.patient_id}-A{self.appointment_id}"
        self.save()


# Medical Records Model
class MedicalRecord(models.Model):
    """
    Medical records model
    Stores patient medical history and prescriptions
    """
    record_id = models.CharField(max_length=50, primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_records')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, related_name='medical_records')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True)
    prescription = models.TextField()
    diagnosis = models.TextField(blank=True)
    file_path = models.CharField(max_length=500, blank=True)  # Path to uploaded medical reports
    record_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'medical_records'
        ordering = ['-record_date']
    
    def __str__(self):
        return f"Record {self.record_id} - {self.patient.patient_name}"


# Payment Model
class Payment(models.Model):
    """
    Payment transaction model
    Tracks appointment payments
    """
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('netbanking', 'Net Banking'),
    ]
    
    payment_id = models.CharField(max_length=50, primary_key=True)
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='payment')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='payments')
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.payment_id} - {self.patient.patient_name} - ₹{self.payment_amount}"


# Report Model (Admin Reports)
class Report(models.Model):
    """
    System reports model
    Admin-generated system analytics and reports
    """
    report_id = models.CharField(max_length=50, primary_key=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='generated_reports')
    report_type = models.CharField(max_length=50)  # e.g., 'revenue', 'appointments', 'patients'
    description = models.TextField()
    report_data = models.JSONField(default=dict)  # Store report data as JSON
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'reports'
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"Report {self.report_id} - {self.report_type}"


# Notification Model
class Notification(models.Model):
    """
    Notification model
    System notifications for users
    """
    NOTIFICATION_TYPES = [
        ('appointment', 'Appointment'),
        ('payment', 'Payment'),
        ('system', 'System'),
        ('reminder', 'Reminder'),
    ]
    
    notification_id = models.CharField(max_length=50, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


# Doctor Time Slot Model
class DoctorTimeSlot(models.Model):
    """
    Doctor availability time slots
    Manages doctor's available appointment slots
    """
    slot_id = models.CharField(max_length=50, primary_key=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='time_slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    max_patients = models.IntegerField(default=10)
    booked_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'doctor_time_slots'
        ordering = ['date', 'start_time']
        unique_together = ['doctor', 'date', 'start_time']
    
    def __str__(self):
        return f"Dr. {self.doctor.doctor_name} - {self.date} {self.start_time}-{self.end_time}"
    
    def is_slot_available(self):
        """Check if slot has capacity"""
        return self.is_available and self.booked_count < self.max_patients


class Review(models.Model):
    """
    Doctor review and rating model
    """
    review_id = models.CharField(max_length=50, primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='reviews')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()  # 1-5
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']

    def __str__(self):
        return f"Review {self.review_id} - {self.patient.patient_name} for Dr. {self.doctor.doctor_name}"
class ClinicalReceipt(models.Model):
    """
    Clinical Receipt / Medical Invoice model
    Stores detailed billing and treatment info
    """
    receipt_id = models.CharField(max_length=50, primary_key=True)
    receipt_number = models.CharField(max_length=50, unique=True)
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='clinical_receipt')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, null=True, blank=True)
    
    admission_date = models.DateTimeField()
    discharge_date = models.DateTimeField()
    
    consultation_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    procedure_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    medicine_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    payment_method = models.CharField(max_length=20) # Cash / Online
    payment_status = models.CharField(max_length=20) # Completed
    
    diagnosis = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clinical_receipts'
        ordering = ['-created_at']

    def __str__(self):
        return f"Receipt {self.receipt_number} - {self.patient.patient_name}"

class AISymptomCheck(models.Model):
    """
    AI Symptom Checker history model
    Stores logs of AI-powered health assessments
    """
    check_id = models.CharField(max_length=50, primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='symptom_checks')
    symptoms = models.TextField()
    ai_response = models.TextField()
    prediction = models.CharField(max_length=200)
    specialist_suggested = models.CharField(max_length=100)
    confidence_score = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_symptom_checks'
        ordering = ['-created_at']

    def __str__(self):
        return f"Check {self.check_id} - {self.patient.patient_name}"

class Counter(models.Model):
    """
    Counter model for auto-incrementing IDs in MongoDB
    """
    name = models.CharField(max_length=50, unique=True)
    value = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'counters'
    
    def __str__(self):
        return f"{self.name}: {self.value}"

class ChatMessage(models.Model):
    """
    AI Chatbot conversation history model
    """
    user_id = models.CharField(max_length=100, db_index=True)
    session_id = models.CharField(max_length=255, db_index=True, null=True, blank=True)
    role = models.CharField(max_length=10) # 'user' or 'bot'
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.text[:30]}..."

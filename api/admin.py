"""
Swasthya Setu - Django Admin Configuration
Admin panel configuration for all models
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Patient, Doctor, Hospital, Appointment,
    MedicalRecord, Payment, Report, Notification, DoctorTimeSlot, Counter
)


# ============================================
# USER ADMIN
# ============================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin"""
    list_display = ['username', 'email', 'role', 'first_name', 'last_name', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone_no')}),
    )


# ============================================
# PATIENT ADMIN
# ============================================

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    """Patient admin"""
    list_display = ['patient_id', 'patient_name', 'gender', 'age', 'phone_no']
    list_filter = ['gender', 'age']
    search_fields = ['patient_name', 'phone_no', 'address']
    ordering = ['-patient_id']


# ============================================
# DOCTOR ADMIN
# ============================================

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    """Doctor admin"""
    list_display = ['doctor_id', 'doctor_name', 'specialization', 'email', 'phone_no']
    list_filter = ['specialization']
    search_fields = ['doctor_name', 'specialization', 'email']
    ordering = ['-doctor_id']


# ============================================
# HOSPITAL ADMIN
# ============================================

@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    """Hospital admin"""
    list_display = ['hospital_id', 'hospital_name', 'address', 'phone_no']
    search_fields = ['hospital_name', 'address']
    ordering = ['-hospital_id']


# ============================================
# APPOINTMENT ADMIN
# ============================================

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Appointment admin"""
    list_display = ['appointment_id', 'patient', 'doctor', 'appointment_date', 'appointment_time', 'status', 'token_number']
    list_filter = ['status', 'appointment_date']
    search_fields = ['patient__patient_name', 'doctor__doctor_name', 'token_number']
    ordering = ['-appointment_date', '-appointment_time']
    
    def get_queryset(self, request):
        """Customize queryset"""
        qs = super().get_queryset(request)
        return qs.select_related('patient', 'doctor', 'hospital')


# ============================================
# TIME SLOT ADMIN
# ============================================

@admin.register(DoctorTimeSlot)
class DoctorTimeSlotAdmin(admin.ModelAdmin):
    """Doctor Time Slot admin"""
    list_display = ['slot_id', 'doctor', 'date', 'start_time', 'end_time', 'is_available', 'booked_count', 'max_patients']
    list_filter = ['is_available', 'date']
    search_fields = ['doctor__doctor_name']
    ordering = ['-date', 'start_time']


# ============================================
# MEDICAL RECORD ADMIN
# ============================================

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    """Medical Record admin"""
    list_display = ['record_id', 'patient', 'doctor', 'record_date']
    list_filter = ['record_date']
    search_fields = ['patient__patient_name', 'doctor__doctor_name', 'diagnosis']
    ordering = ['-record_date']
    
    def get_queryset(self, request):
        """Customize queryset"""
        qs = super().get_queryset(request)
        return qs.select_related('patient', 'doctor')


# ============================================
# PAYMENT ADMIN
# ============================================

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Payment admin"""
    list_display = ['payment_id', 'patient', 'payment_amount', 'payment_method', 'payment_status', 'payment_date', 'transaction_number']
    list_filter = ['payment_status', 'payment_method', 'payment_date']
    search_fields = ['patient__patient_name', 'transaction_number']
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        """Customize queryset"""
        qs = super().get_queryset(request)
        return qs.select_related('patient', 'appointment')


# ============================================
# REPORT ADMIN
# ============================================

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Report admin"""
    list_display = ['report_id', 'report_type', 'generated_by', 'generated_at']
    list_filter = ['report_type', 'generated_at']
    search_fields = ['report_type', 'description']
    ordering = ['-generated_at']


# ============================================
# NOTIFICATION ADMIN
# ============================================

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Notification admin"""
    list_display = ['notification_id', 'user', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__username']
    ordering = ['-created_at']



# ============================================
# COUNTER ADMIN
# ============================================

@admin.register(Counter)
class CounterAdmin(admin.ModelAdmin):
    """Counter admin for auto-incrementing IDs"""
    list_display = ['name', 'value']
    search_fields = ['name']

# Customize admin site
admin.site.site_header = "Swasthya Setu Admin"
admin.site.site_title = "Swasthya Setu"
admin.site.index_title = "Healthcare Management System Status"

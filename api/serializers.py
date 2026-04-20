# ================= BACKEND FILE =================
# File: serializers.py
# Purpose: Data transformation / Serialization for API responses
# Handles: Converting Django/Djongo objects to JSON and vice-versa
"""
Swasthya Setu - API Serializers
Django REST Framework serializers for all models
"""

from rest_framework import serializers
from .models import (
    User, Patient, Doctor, Hospital, Appointment,
    MedicalRecord, Payment, Report, Notification, DoctorTimeSlot, Review
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'user_id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_no']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        """Create user with encrypted password"""
        user = User.objects.create_user(**validated_data)
        return user


class PatientSerializer(serializers.ModelSerializer):
    """Serializer for Patient model"""
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Patient
        fields = '__all__'


class DoctorSerializer(serializers.ModelSerializer):
    """Serializer for Doctor model"""
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Doctor
        fields = '__all__'


class HospitalSerializer(serializers.ModelSerializer):
    """Serializer for Hospital model"""
    
    class Meta:
        model = Hospital
        fields = '__all__'


class DoctorTimeSlotSerializer(serializers.ModelSerializer):
    """Serializer for Doctor Time Slots"""
    doctor_name = serializers.CharField(source='doctor.doctor_name', read_only=True)
    
    class Meta:
        model = DoctorTimeSlot
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for Appointment model"""
    patient_name = serializers.CharField(source='patient.patient_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.doctor_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.hospital_name', read_only=True)
    
    class Meta:
        model = Appointment
        fields = '__all__'


class MedicalRecordSerializer(serializers.ModelSerializer):
    """Serializer for Medical Records"""
    patient_name = serializers.CharField(source='patient.patient_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.doctor_name', read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    patient_name = serializers.CharField(source='patient.patient_name', read_only=True)
    appointment_details = AppointmentSerializer(source='appointment', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for System Reports"""
    generated_by_name = serializers.CharField(source='generated_by.username', read_only=True)
    
    class Meta:
        model = Report
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notifications"""
    
    class Meta:
        model = Notification
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Doctor Reviews"""
    patient_name = serializers.CharField(source='patient.patient_name', read_only=True)
    
    class Meta:
        model = Review
        fields = '__all__'


# Registration Serializers
class UserRegistrationSerializer(serializers.Serializer):
    """Serializer for user registration"""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    role = serializers.ChoiceField(choices=['admin', 'doctor', 'patient'])
    phone_no = serializers.CharField(max_length=15)
    
    # Additional fields based on role
    # For Patient
    gender = serializers.ChoiceField(choices=['M', 'F', 'O'], required=False)
    age = serializers.IntegerField(required=False)
    dob = serializers.DateField(required=False)
    address = serializers.CharField(required=False)
    
    # For Doctor
    specialization = serializers.CharField(required=False)
    
    def validate(self, data):
        """Validate registration data based on role"""
        role = data.get('role')
        
        if role == 'patient':
            required_fields = ['gender', 'age', 'dob', 'address']
            for field in required_fields:
                if field not in data:
                    raise serializers.ValidationError(f"{field} is required for patient registration")
        
        elif role == 'doctor':
            if 'specialization' not in data:
                raise serializers.ValidationError("Specialization is required for doctor registration")
        
        return data


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

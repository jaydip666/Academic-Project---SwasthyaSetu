# ================= BACKEND FILE =================
# File: urls.py
# Purpose: API routing matrix for the clinical backend
# Handles: Mapping endpoints to view functions in views.py

from django.urls import path
from . import views

print("TELEMETRY: Initializing clinical routing matrix in api/urls.py")

urlpatterns = [
    # Auth
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('auth/reset-password/', views.reset_password, name='reset-password'),
    path('auth/get-security-question/', views.get_security_question, name='get-security-question'),
    path('auth/select-role/', views.select_role, name='select-role'),
    path('auth/logout/', views.logout_user, name='logout'),
    path('auth/me/', views.current_user_details, name='current-user'),
    path('auth/check-session/', views.check_session, name='check-session'),
    
    # Doctor
    path('doctors/', views.search_doctors, name='list-doctors'),
    path('doctors/search/', views.search_doctors, name='search-doctors'),
    path('doctor/availability-calendar/', views.get_doctor_availability_calendar, name='doctor-availability-calendar'),
    path('time-slots/available/', views.get_available_slots, name='available-slots'),
    
    # Appointments
    path('appointments/', views.get_appointments, name='get_appointments'),
    path('appointments/create', views.create_appointment, name='create_appointment'),
    path('appointments/<str:pk>/update_status/', views.update_appointment_status, name='update_appointment_status'),
    path('appointments/<str:pk>/propose_reschedule/', views.propose_reschedule, name='propose_reschedule'),
    path('appointments/<str:pk>/respond_reschedule/', views.respond_to_reschedule, name='respond_to_reschedule'),
    path('appointments/<str:pk>/suggestions/', views.get_appointment_suggestions, name='appointment_suggestions'),
    path('appointments/reschedule/respond', views.respond_to_reschedule_v2, name='respond_reschedule_v2'),
    path('admin/stats/', views.get_admin_stats, name='admin_stats'),
    path('admin/analytics/', views.get_filtered_analytics, name='admin_analytics'),
    path('admin/analytics/pdf/', views.export_analytics_pdf, name='admin_analytics_pdf'),
    path('predict-symptoms/', views.predict_symptoms, name='predict-symptoms'),
    path('predict-symptoms/history/', views.get_chat_history, name='get-chat-history'),
    path('predict-symptoms/clear/', views.clear_chat_history, name='clear-chat-history'),
    path('save-symptom-check/', views.save_symptom_check, name='save-symptom-check'),
    path('media/upload', views.upload_file, name='file_upload'),
    path('media/list', views.get_user_files, name='file_list'),
    path('media/patient-files', views.get_patient_files, name='patient_file_list'),
    
    # Profile & Settings
    path('auth/update-profile/', views.update_profile, name='update_profile'),
    path('auth/upload-avatar/', views.upload_profile_picture, name='upload_avatar'),
    path('auth/change-password/', views.change_password, name='change_password'),
    
    # Doctor Schedule & Earnings
    path('doctor/schedule/', views.get_doctor_schedule, name='get_schedule'),
    path('doctor/schedule/update/', views.update_doctor_schedule, name='update_schedule'),
    path('doctor/earnings/', views.get_doctor_earnings, name='doctor_earnings'),
    path('doctor/earnings/pdf/', views.export_doctor_earnings_pdf, name='doctor_earnings_pdf'),

    # Payments
    path('payment/create-order/', views.create_order, name='create_order'),
    path('payment/verify/', views.verify_payment, name='verify_payment'),
    path('patient/ledger/', views.get_patient_ledger, name='patient_ledger'),
    path('patient/ledger/pdf/', views.export_ledger_pdf, name='patient_ledger_pdf'),
    
    # Hospital Management
    path('admin/hospitals/', views.manage_hospitals, name='manage_hospitals'),
    path('media/hospital-upload/', views.upload_hospital_image, name='hospital_upload'),
    path('admin/hospitals/<str:pk>/', views.get_hospital_details, name='hospital_details'),
    path('admin/hospitals/<str:pk>/delete/', views.delete_hospital, name='delete_hospital'),
    
    # User Management
    path('admin/users/<str:role>/', views.get_users_by_role, name='get_users_by_role'),
    path('admin/assign-doctor/', views.assign_doctor_to_hospital, name='assign_doctor'),
    path('admin/users/<str:pk>/delete/', views.delete_user, name='delete_user'),
    path('admin/doctor-registrations/', views.get_pending_doctor_registrations, name='pending_doctors'),
    path('admin/doctor-registrations/<str:pk>/status/', views.update_doctor_registration_status, name='update_doctor_status'),
    
    # Inquiries
    path('inquiries/submit/', views.submit_inquiry, name='submit_inquiry'),
    path('admin/inquiries/', views.get_all_inquiries, name='get_inquiries'),
    path('admin/inquiries/<str:pk>/delete/', views.delete_inquiry, name='delete_inquiry'),
    
    # Reviews
    path('reviews/submit/', views.submit_review, name='submit_review'),
    path('admin/reviews/', views.get_all_reviews, name='admin_reviews'),
    path('reviews/doctor/<str:doctor_id>/', views.get_doctor_reviews, name='doctor_reviews'),
    
    # Notifications
    path('notifications/', views.get_notifications, name='get_notifications'),
    path('notifications/<str:pk>/read/', views.mark_notification_as_read, name='mark_notification_read'),
    path('notifications/read-all/', views.mark_all_notifications_as_read, name='mark_all_notifications_read'),
    
    # Reports Request
    path('reports/request/', views.request_report, name='request_report'),
    
    # Clinical Receipts
    path('clinical-receipts/', views.get_clinical_receipts, name='get_clinical_receipts'),
    path('clinical-receipts/<str:receipt_id>/pdf/', views.export_clinical_receipt_pdf, name='export_clinical_receipt_pdf'),
    
    # Admin Report Tracking
    path('admin/report-tracks/', views.get_all_report_tracks, name='admin_report_tracks'),
    
    # Specializations
    path('specializations/', views.get_all_specializations, name='all_specializations'),
    
    # Account Management
    path('auth/delete-account/', views.delete_account, name='delete_account'),
]

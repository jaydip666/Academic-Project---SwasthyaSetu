# pyre-ignore-all
# ================= BACKEND FILE =================
# File: views.py
# Purpose: Main API view controllers for the Swasthya Setu system
# Handles: Authentication, Doctor Search, Appointments, Clinical Receipts, Admin Analytics, etc.

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password, check_password

from pymongo.errors import DuplicateKeyError
from bson.objectid import ObjectId
from datetime import datetime, timedelta
import random
import re

from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .utils import (
    send_email_async, 
    notify_appointment_booking, 
    notify_payment_confirmation, 
    create_notification,
    notify_reschedule_proposal,
    notify_reschedule_response,
    notify_admins,
    notify_token_generated,
    get_next_id
)
from django.template.loader import render_to_string
from django.http import HttpResponse
from xhtml2pdf import pisa
import io

from .db import (
    users_collection,
    patients_collection,
    doctors_collection,
    appointments_collection,
    medical_records_collection,
    inquiries_collection,
    reviews_collection,
    notifications_collection,
    hospitals_collection,
    payments_collection,
    clinical_receipts_collection,
    report_tracks_collection,
    symptom_checks_collection,
    chat_messages_collection,
)

# ============================================================
# Helper: Serialize MongoDB ObjectId
# ============================================================

def serialize_mongo(data):
    from bson import ObjectId
    import datetime
    
    def convert(obj):
        if isinstance(obj, list):
            return [convert(item) for item in obj]
        if isinstance(obj, dict):
            new_obj = {}
            for k, v in obj.items():
                if k == '_id':
                    new_obj['id'] = str(v)
                elif k == 'id' and '_id' in obj:
                    new_obj['internal_id'] = v
                else:
                    new_obj[k] = convert(v)
            if 'id' not in new_obj and '_id' in obj:
                new_obj['id'] = str(obj['_id'])
            return new_obj
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        if isinstance(obj, ObjectId):
            return str(obj)
        return obj
    
    return convert(data)


# ============================================================
# AUTHENTICATION
# ============================================================

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user directly to MongoDB"""
    print("DEBUG: Register endpoint hit")
    data = request.data
    print(f"DEBUG: Registration data received: {data}")

    # Required fields validation
    required_fields = [
        'username', 'email', 'password',
        'first_name', 'last_name',
        'role', 'phone_no'
    ]

    for field in required_fields:
        if not data.get(field):
            return Response(
                {'error': f'{field} is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Role validation
    if data['role'] not in ['patient', 'doctor']:
        return Response(
            {'error': 'Invalid role'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Normalize data
    username = data.get('username', '').lower().strip()
    email = data.get('email', '').lower().strip()

    # Check existing user
    existing_username = users_collection.find_one({'username': {'$regex': f'^{re.escape(username)}$', '$options': 'i'}})
    if existing_username:
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
    existing_email = users_collection.find_one({'email': {'$regex': f'^{re.escape(email)}$', '$options': 'i'}})
    if existing_email:
        return Response({'error': 'Email address already exists. Please try logging in or use a different email.'}, status=status.HTTP_400_BAD_REQUEST)
        
    existing_phone = users_collection.find_one({'phone_no': data.get('phone_no')})
    if existing_phone:
        return Response({'error': 'Phone number already exists'}, status=status.HTTP_400_BAD_REQUEST)

    # Create user document
    user_doc = {
        'user_id': get_next_id('users', prefix='u'),
        'username': username,
        'email': email,
        'password': make_password(data['password']),
        'first_name': data['first_name'],
        'last_name': data['last_name'],
        'role': data['role'],
        'phone_no': data['phone_no'],
        'security_question': data.get('security_question', ''),
        'security_answer': make_password(data.get('security_answer', '').lower().strip()) if data.get('security_answer') else '',
        'date_joined': datetime.now()
    }

    try:
        result = users_collection.insert_one(user_doc)
    except DuplicateKeyError as e:
        return Response(
            {'error': 'User registration failed due to system conflict'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user_id = str(result.inserted_id)

    # Create role profile
    if data['role'] == 'patient':
        patients_collection.insert_one({
            'patient_id': get_next_id('patients', prefix='p'),
            'user_id': user_id,
            'patient_name': f"{data['first_name']} {data['last_name']}",
            'phone_no': data['phone_no'],
            'gender': data.get('gender', 'M'),
            'age': int(data.get('age', 0)) if data.get('age') else 0,
            'address': data.get('address', ''),
            'dob': data.get('dob', '2000-01-01'),
            'created_at': datetime.now()
        })

    elif data['role'] == 'doctor':
        license_path = ""
        license_file = request.FILES.get('license_file')
        if license_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{timestamp}_{license_file.name.replace(' ', '_')}"
            storage_path = f"certificates/{data['username']}/{filename}"
            license_path = default_storage.save(storage_path, ContentFile(license_file.read()))
            license_path = license_path.replace('\\', '/')

        doctors_collection.insert_one({
            'doctor_id': get_next_id('doctors', prefix='d'),
            'user_id': user_id,
            'doctor_name': f"{data['first_name']} {data['last_name']}",
            'email': email,
            'phone_no': data['phone_no'],
            'gender': data.get('gender', 'M'),
            'age': int(data.get('age', 0)) if data.get('age') else 0,
            'specialization': data.get('specialization', 'General Physician'),
            'medical_system': data.get('medical_system', 'Allopathic'),
            'license_no': data.get('license_no', ''),
            'license_certificate': license_path,
            'experience': int(data.get('experience', 0)) if data.get('experience') else 0,
            'consultation_fee': int(float(data.get('consultation_fee', 500))),
            'commission_percentage': int(data.get('commission_percentage', 0)) if data.get('commission_percentage') else 0,
            'max_patients_per_slot': int(data.get('max_patients_per_slot', 10)) if data.get('max_patients_per_slot') else 10,
            'clinic_address': data.get('address', ''),
            'description': data.get('description', ''),
            'education': data.get('education', ''),
            'status': 'pending',
            'schedule': {},
            'created_at': datetime.now()
        })
        try:
            notify_admins('new_doctor', 'New Doctor Registration', f"A new medical practitioner Dr. {data['first_name']} {data['last_name']} has applied.")
        except Exception as notify_err:
            print(f"DEBUG: notify_admins error: {notify_err}")

    return Response(
        {'message': 'User registered successfully', 'id': user_id},
        status=status.HTTP_201_CREATED
    )


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username and password required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Special case for admin login
        if username == 'admin' and password == 'admin123':
            user = users_collection.find_one({'username': 'admin'})
            if not user:
                # Create default admin user if it doesn't exist
                user_doc = {
                    'user_id': get_next_id('users', prefix='u'),
                    'username': 'admin',
                    'email': 'admin@swasthyasetu.com',
                    'password': make_password('admin123'),
                    'first_name': 'System',
                    'last_name': 'Admin',
                    'role': 'admin',
                    'phone_no': '0000000000',
                    'date_joined': datetime.now()
                }
                users_collection.insert_one(user_doc)
                user = users_collection.find_one({'username': 'admin'})
        else:
            # Case-insensitive username lookup
            user = users_collection.find_one({'username': {'$regex': f'^{re.escape(username)}$', '$options': 'i'}})

        if not user or not check_password(password, user['password']):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Multi-role Detection Protocol
        available_roles = []
        user_id_str = str(user['_id'])
        
        # Check Admin Role (Stored in main User document)
        if user['role'] == 'admin':
            available_roles.append('admin')
            
        # Check Patient Profile Link
        if patients_collection.find_one({'user_id': user_id_str}):
            available_roles.append('patient')
            
        # Check Doctor Profile Link
        if doctors_collection.find_one({'user_id': user_id_str}):
            available_roles.append('doctor')

        # If multiple roles exist, require role selection
        if len(available_roles) > 1:
            # We don't set the full session yet, just store the user_id temporarily?
            # Or we let the user pick.
            return Response({
                'multi_role': True,
                'available_roles': available_roles,
                'user_id': user_id_str,
                'message': 'Multiple account roles detected. Please select your account type.'
            }, status=status.HTTP_200_OK)

        # Proceed with single role if only one or if logic falls through
        request.session['user_id'] = user_id_str
        request.session['role'] = user['role'] if not available_roles else available_roles[0]

        # Merging role-specific profile data
        extra_data = {}
        if user['role'] == 'patient':
            patient = patients_collection.find_one({'user_id': str(user['_id'])})
            if patient:
                extra_data = serialize_mongo(patient)
        elif user['role'] == 'doctor':
            doctor = doctors_collection.find_one({'user_id': str(user['_id'])})
            if doctor:
                if doctor.get('status') != 'approved':
                    return Response(
                        {'error': 'Your registration is pending approval from the administrator.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                extra_data = serialize_mongo(doctor)

        user_data = {
            'id': str(user['_id']),
            'username': user['username'],
            'first_name': user.get('first_name', ''),
            'last_name': user.get('last_name', ''),
            'email': user['email'],
            'role': user['role'],
            'phone_no': user.get('phone_no', ''),
            **extra_data
        }

        return Response(
            {'message': 'Login successful', 'user': user_data},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def select_role(request):
    try:
        user_id = request.data.get('user_id')
        selected_role = request.data.get('role')
        
        if not user_id or not selected_role:
            return Response({'error': 'Incomplete credentials for account selection'}, status=400)
            
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return Response({'error': 'Account not found'}, status=404)
            
        # Verify permissions for the selected role
        authorized = False
        if selected_role == 'admin' and user.get('role') == 'admin':
            authorized = True
        elif selected_role == 'patient' and patients_collection.find_one({'user_id': user_id}):
            authorized = True
        elif selected_role == 'doctor':
            doctor = doctors_collection.find_one({'user_id': user_id})
            if doctor:
                if doctor.get('status') != 'approved':
                    return Response({'error': 'Access denied: Your doctor profile is waiting for approval.'}, status=403)
                authorized = True
                
        if not authorized:
            return Response({'error': 'Unauthorized role elevation attempt'}, status=403)
            
        # Synchronize session
        request.session['user_id'] = user_id
        request.session['role'] = selected_role
        
        # Merging profile metadata
        extra_data = {}
        if selected_role == 'patient':
            patient = patients_collection.find_one({'user_id': user_id})
            if patient:
                extra_data = serialize_mongo(patient)
        elif selected_role == 'doctor':
            doctor = doctors_collection.find_one({'user_id': user_id})
            if doctor:
                extra_data = serialize_mongo(doctor)
                
        user_data = {
            'id': user_id,
            'username': user['username'],
            'first_name': user.get('first_name', ''),
            'last_name': user.get('last_name', ''),
            'email': user['email'],
            'role': selected_role,
            **extra_data
        }
        
        return Response({'message': 'Account selected successfully', 'user': user_data})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def get_security_question(request):
    """Retrieve security question for a given user identity"""
    try:
        identity = request.data.get('identity', '').strip()
        if not identity:
            return Response({'error': 'Identity is required'}, status=400)
            
        identity_regex = f"^{re.escape(identity)}$"
        user = users_collection.find_one({
            '$or': [
                {'username': {'$regex': identity_regex, '$options': 'i'}},
                {'email': {'$regex': identity_regex, '$options': 'i'}}
            ]
        })
        
        if not user:
            return Response({'error': 'User not found'}, status=404)
            
        if not user.get('security_question'):
            return Response({'error': 'No security question set for this account. Please contact support.'}, status=400)
            
        return Response({'security_question': user['security_question']})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset user password using identity (username or email)"""
    try:
        raw_identity = request.data.get('identity', '').strip()
        new_password = request.data.get('new_password')
        security_answer = request.data.get('security_answer', '').lower().strip()

        if not raw_identity or not new_password or not security_answer:
            return Response({'error': 'Identity, security answer, and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'Security Protocol: Password must be at least 6 characters long'}, status=status.HTTP_400_BAD_REQUEST)

        # Lookup user by username or email (case-insensitive, exact match)
        identity_regex = f"^{raw_identity}$"
        user = users_collection.find_one({
            '$or': [
                {'username': {'$regex': identity_regex, '$options': 'i'}},
                {'email': {'$regex': identity_regex, '$options': 'i'}}
            ]
        })

        if not user:
            print(f"LOG: [ResetPassword] Identity [{raw_identity}] not found.")
            return Response({'error': 'User not found with the provided credentials'}, status=status.HTTP_404_NOT_FOUND)

        # Verify security answer
        stored_answer = user.get('security_answer')
        if not stored_answer or not check_password(security_answer, stored_answer):
            return Response({'error': 'Invalid security answer'}, status=status.HTTP_401_UNAUTHORIZED)

        username = user.get('username')
        print(f"TELEMETRY: [ResetPassword] Found user record for: {username}")

        # Hash password (forcing bcrypt if specified in requirements)
        # Django will use its bcrypt hasher if configured7
        try:
            hashed_password = make_password(new_password)
        except Exception as hash_err:
            print(f"TELEMETRY: [ResetPassword] Hashing error: {hash_err}")
            hashed_password = make_password(new_password) # Fallback to default

        result = users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {
                'password': hashed_password,
                'last_password_reset': datetime.now()
            }}
        )

        if result.matched_count == 1:
            print(f"LOG: [ResetPassword] Database update confirmed for: {username}")
            return Response({
                'message': 'Update Complete: Password updated successfully. You can now login with your new credentials.'
            })
        else:
            print(f"LOG: [ResetPassword] DB update failed for: {username}")
            return Response({'error': 'Database Error: Unable to complete password update.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': f'System Error: {str(e)}'}, status=500)


@api_view(['POST'])
def logout_user(request):
    request.session.flush()
    return Response({'message': 'Logout successful'})


@api_view(['GET'])
def current_user_details(request):
    user_id = request.session.get('user_id')

    if not user_id:
        return Response(
            {'error': 'Not logged in'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Merging role-specific profile data
    extra_data = {}
    if user['role'] == 'patient':
        patient = patients_collection.find_one({'user_id': str(user['_id'])})
        if patient:
            extra_data = serialize_mongo(patient)
    elif user['role'] == 'doctor':
        doctor = doctors_collection.find_one({'user_id': str(user['_id'])})
        if doctor:
            extra_data = serialize_mongo(doctor)

    return Response({
        **serialize_mongo(user),
        **extra_data
    })


# ============================================================
# DOCTORS
# ============================================================

@api_view(['GET'])
def search_doctors(request):
    doctors = list(
        doctors_collection.find(
            {'status': 'approved'},
            {
                '_id': 1, 'doctor_name': 1, 'email': 1, 'phone_no': 1, 
                'specialization': 1, 'medical_system': 1, 'consultation_fee': 1, 'experience': 1, 
                'clinic_address': 1, 'description': 1, 'education': 1,
                'profile_picture': 1, 'hospital_id': 1
            }
        )
    )
    
    # Enrich with intelligence: Calculate Ratings
    for doctor in doctors:
        d_id = str(doctor['_id'])
        d_reviews = list(reviews_collection.find({'doctor_id': d_id}))
        if d_reviews:
            avg_rating = sum(r['rating'] for r in d_reviews) / len(d_reviews)
            doctor['average_rating'] = round(avg_rating, 1)
            doctor['review_count'] = len(d_reviews)
        else:
            doctor['average_rating'] = 4.5  # Base rating for new specialists
            doctor['review_count'] = 0

    return Response(serialize_mongo(doctors))


# ============================================================
# APPOINTMENTS
# ============================================================

@api_view(['POST'])
def create_appointment(request):
    try:
        user_id = request.session.get('user_id')
        role = request.session.get('role')

        if not user_id or role != 'patient':
            return Response(
                {'error': 'Unauthorized'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        data = request.data
        doctor_id = data.get('doctor_id')
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')

        if not all([doctor_id, appointment_date, appointment_time]):
            return Response(
                {'error': 'Missing appointment details'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            doctor = doctors_collection.find_one({'_id': ObjectId(doctor_id)})
            if not doctor:
                return Response({'error': 'Doctor not found'}, status=404)
        except Exception as e:
            return Response(
                {'error': f'Invalid doctor ID: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        patient = patients_collection.find_one({'user_id': user_id})
        if not patient:
            return Response(
                {'error': 'Patient profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get full user details for email
        patient_user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not patient_user:
            return Response({'error': 'User authentication node missing'}, status=401)

        hospital_id = data.get('hospital_id')
        hospital_name = 'Central Medical Hub' # Default
        if hospital_id:
            try:
                h_obj = hospitals_collection.find_one({'_id': ObjectId(hospital_id)})
                if h_obj:
                    hospital_name = h_obj.get('name', hospital_name)
            except:
                pass

        # Token Generation & Capacity Logic
        # Find existing appointments count for this doctor, date, and time slot
        existing_count = appointments_collection.count_documents({
            'doctor_id': str(doctor['_id']),
            'appointment_date': appointment_date,
            'appointment_time': appointment_time,
            'status': {'$ne': 'rejected'} # Only count active/pending/completed
        })
        
        schedule = doctor.get('schedule', {})
        day_config = schedule.get(appointment_date, schedule.get(datetime.strptime(appointment_date, '%Y-%m-%d').strftime('%A'), []))
        
        # Determine capacity limit for this specific day/slot configuration
        if isinstance(day_config, dict):
            max_limit = int(day_config.get('limit', doctor.get('max_patients_per_slot', 10)))
        else:
            max_limit = int(doctor.get('max_patients_per_slot', 10))

        if existing_count >= max_limit:
            return Response(
                {'error': f'This slot is fully booked (Limit: {max_limit}). Please select another time.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment = {
            'appointment_id': get_next_id('appointments', prefix='a'),
            'patient_id': str(patient['_id']),
            'patient_name': patient['patient_name'],
            'patient_phone': patient.get('phone_no', patient_user.get('phone_no') or ''),
            'patient_email': patient_user.get('email'),
            'doctor_id': str(doctor['_id']),
            'doctor_name': doctor['doctor_name'],
            'hospital_id': hospital_id,
            'hospital_name': hospital_name,
            'appointment_date': appointment_date,
            'appointment_time': appointment_time,
            'amount': float(doctor.get('consultation_fee') or 0),
            'status': 'pending', 
            'token_number': None,
            'token_id': None,
            'created_at': datetime.now()
        }

        result = appointments_collection.insert_one(appointment)

        # Internal Notification for Doctor
        try:
            create_notification(
                user_id=doctor['user_id'],
                notification_type='appointment',
                title='New Appointment Request',
                message=f"New appointment request from {patient['patient_name']} for {appointment_date} at {appointment_time}."
            )
        except Exception as e:
            print(f"Doctor notification failed: {e}")
        
        # User-facing notification
        try:
            create_notification(
                user_id=user_id,
                notification_type='appointment',
                title='Appointment Request Sent',
                message=f"Your request for Dr. {doctor['doctor_name']} has been transmitted. Status: Pending Doctor Approval."
            )
        except:
            pass

        return Response(
            {
                'message': 'Appointment request transmitted successfully', 
                'appointment_id': str(result.inserted_id),
                'status': 'pending'
            },
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e), 'trace': traceback.format_exc()}, status=500)


@api_view(['GET'])
def get_appointments(request):
    user_id = request.session.get('user_id')
    role = request.session.get('role')

    if not user_id:
        return Response(
            {'error': 'Unauthorized'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if role == 'patient':
        patient = patients_collection.find_one({'user_id': user_id})
        if not patient:
            return Response([])

        appointments = list(
            appointments_collection.find(
                {'patient_id': str(patient['_id'])}
            ).sort('created_at', -1)
        )
        
        # Enrich with doctor profile picture
        for app in appointments:
            doc_profile = doctors_collection.find_one({'_id': ObjectId(app['doctor_id'])}) if 'doctor_id' in app else None
            if doc_profile:
                app['doctor_profile_picture'] = doc_profile.get('profile_picture')
            
            # Check if paid
            payment = payments_collection.find_one({
                '$or': [
                    {'appointment_id': str(app['_id'])},
                    {'appointment_id': app['_id']},
                    {'appointment_id': ObjectId(app['_id']) if isinstance(app['_id'], str) else app['_id']}
                ],
                'payment_status': 'completed'
            })
            
            # Check if review exists
            review = reviews_collection.find_one({
                '$or': [
                    {'appointment_id': str(app['_id'])},
                    {'appointment_id': app['_id']}
                ]
            })
            app['is_reviewed'] = True if review else False

            app['is_paid'] = True if (payment or app.get('status') == 'confirmed') else False
            app['payment_method'] = payment.get('payment_method') if payment else None

            # --- Queue Management Intelligence ---
            if app.get('status') in ['NOW SERVING', 'WAITING'] and app.get('token_number'):
                try:
                    # Find count of people before this token who are yet to be served
                    # (status != 'completed' and token_number < current)
                    people_ahead = appointments_collection.count_documents({
                        'doctor_id': app['doctor_id'],
                        'appointment_date': app['appointment_date'],
                        'appointment_time': app['appointment_time'],
                        'token_number': {'$lt': app['token_number']},
                        'status': {'$in': ['WAITING', 'NOW SERVING']}
                    })
                    app['people_ahead'] = people_ahead
                    
                    # Serving token is the lowest token_number with status "NOW SERVING" 
                    # for this slot (or just the first one in the queue)
                    serving_doc = appointments_collection.find_one({
                        'doctor_id': app['doctor_id'],
                        'appointment_date': app['appointment_date'],
                        'appointment_time': app['appointment_time'],
                        'status': 'NOW SERVING'
                    })
                    if serving_doc:
                        app['serving_token'] = f"TOKEN #{serving_doc['token_number']}"
                    else:
                        app['serving_token'] = "Initializing..."
                    app['tokens_ahead'] = people_ahead
                    
                    # Estimated wait time (15 mins per patient ahead)
                    app['est_wait_time'] = people_ahead * 15
                except:
                    app['serving_token'] = "TOKEN #1"
                    app['tokens_ahead'] = 0
                    app['est_wait_time'] = 0

        return Response(serialize_mongo(appointments))

    elif role == 'doctor':
        doctor = doctors_collection.find_one({'user_id': user_id})
        if not doctor:
            return Response([])
            
        appointments = list(
            appointments_collection.find(
                {'doctor_id': str(doctor['_id'])}
            ).sort('appointment_date', 1)
        )
        
        # Enrich with patient profile picture
        for app in appointments:
            pat_profile = patients_collection.find_one({'_id': ObjectId(app['patient_id'])}) if 'patient_id' in app else None
            if pat_profile:
                app['patient_profile_picture'] = pat_profile.get('profile_picture')
            
            # Check if paid
            payment = payments_collection.find_one({
                '$or': [
                    {'appointment_id': str(app['_id'])},
                    {'appointment_id': app['_id']},
                    {'appointment_id': ObjectId(app['_id']) if isinstance(app['_id'], str) else app['_id']}
                ],
                'payment_status': 'completed'
            })
            app['is_paid'] = True if (payment or app.get('status') == 'confirmed') else False
            app['payment_method'] = payment.get('payment_method') if payment else None
        
        # Calculate Revenue
        doctor_fee = float(doctor.get('consultation_fee') or 500)
        total_revenue = sum(float(a.get('amount') or doctor_fee) for a in appointments if a.get('status') in ['completed', 'confirmed'])
        
        return Response({
            'appointments': serialize_mongo(appointments),
            'revenue': total_revenue
        })

    elif role == 'admin':
        appointments = list(
            appointments_collection.find().sort('created_at', -1)
        )
        
        # Enrich for admin view (Add display IDs)
        for app in appointments:
            try:
                if 'patient_id' in app:
                    pat = patients_collection.find_one({'_id': ObjectId(app['patient_id'])})
                    if pat:
                        app['patient_display_id'] = pat.get('patient_id')
                
                if 'doctor_id' in app:
                    doc = doctors_collection.find_one({'_id': ObjectId(app['doctor_id'])})
                    if doc:
                        app['doctor_display_id'] = doc.get('doctor_id')
            except:
                pass
                
        return Response(serialize_mongo(appointments))

    return Response([])

@api_view(['POST'])
def respond_to_reschedule_v2(request):
    """
    Standardized endpoint for patients to respond to doctor-proposed reschedules.
    Expects: appointment_id, action (accept/decline)
    """
    try:
        from .db import appointments_collection
        from bson.objectid import ObjectId
        
        data = request.data
        appointment_id = data.get('appointment_id')
        action = data.get('action') # 'accept' or 'decline'
        
        if not appointment_id:
            return Response({'error': 'appointment_id is required'}, status=400)
            
        appointment = appointments_collection.find_one({'_id': ObjectId(appointment_id)})
        if not appointment:
            return Response({'error': 'Appointment not found'}, status=404)
            
        if action == 'accept':
            # 1. Verify proposal exists
            if not appointment.get('proposed_date') or not appointment.get('proposed_time'):
                return Response({'error': 'No pending reschedule proposal found'}, status=400)
                
            from .db import payments_collection
            payment = payments_collection.find_one({
                '$or': [
                    {'appointment_id': str(appointment_id)},
                    {'appointment_id': appointment_id},
                    {'appointment_id': ObjectId(appointment_id)}
                ],
                'payment_status': 'completed'
            })

            new_status = 'confirmed' if payment else 'accepted'

            update_data = {
                'status': new_status,
                'appointment_date': appointment['proposed_date'],
                'appointment_time': appointment['proposed_time'],
                'previous_appointment_date': appointment.get('appointment_date'),
                'previous_appointment_time': appointment.get('appointment_time'),
                'rescheduled_by': 'Doctor',
                'rescheduled_at': datetime.now()
            }
            
            # If already paid, generate a fresh token for the new date's queue
            if payment:
                t_count = appointments_collection.count_documents({
                    'doctor_id': str(appointment['doctor_id']),
                    'appointment_date': appointment['proposed_date'],
                    'status': {'$in': ['confirmed', 'completed', 'NOW SERVING', 'WAITING']}
                })
                token_num = t_count + 1
                token_val = f"TOKEN-{token_num:03d}"
                update_data['token_number'] = token_num
                update_data['token_id'] = token_val

            appointments_collection.update_one(
                {'_id': ObjectId(appointment_id)},
                {'$set': update_data,
                '$unset': {
                    'proposed_date': "",
                    'proposed_time': ""
                }}
            )
            
            # 3. Notification Logic
            try:
                from .utils import create_notification
                msg_end = " It is now confirmed." if payment else " Please navigate to your dashboard and complete the payment to receive your token."
                create_notification(
                    user_id=appointment['patient_id'],
                    title="Appointment Synchronized",
                    message=f"Your session with Dr. {appointment.get('doctor_name')} has been moved to {appointment['proposed_date']}." + msg_end
                )
            except: pass
            
            return Response({'message': 'Appointment accepted successfully.' + ('' if payment else ' Awaiting payment.')}, status=200)
            
        elif action == 'reject':
            appointments_collection.update_one(
                {'_id': ObjectId(appointment_id)},
                {
                    '$set': {'status': 'reschedule_rejected'},
                    '$unset': {
                        'proposed_date': "",
                        'proposed_time': ""
                    }
                }
            )
            return Response({'message': 'Proposal rejected.'}, status=200)
            
        elif action == 'decline':
            appointments_collection.update_one(
                {'_id': ObjectId(appointment_id)},
                {'$unset': {
                    'proposed_date': "",
                    'proposed_time': ""
                }}
            )
            return Response({'message': 'Proposal declined. Showing alternatives...'}, status=200)
            
        return Response({'error': 'Invalid action'}, status=400)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def update_appointment_status(request, pk):
    user_id = request.session.get('user_id')
    role = request.session.get('role')
    
    if role not in ['doctor', 'admin']:
        return Response({'error': 'Unauthorized'}, status=401)
        
    doctor = None
    if role == 'doctor':
        doctor = doctors_collection.find_one({'user_id': user_id})
        if not doctor:
            return Response({'error': 'Doctor profile not found'}, status=404)
        
    new_status = request.data.get('status')
    if new_status not in ['accepted', 'rejected', 'completed', 'rescheduled', 'cancelled', 'confirmed']:
        return Response({'error': 'Invalid status'}, status=400)
        
    # Verify appointment belongs to this doctor if not admin
    query = {'_id': ObjectId(pk)}
    if role == 'doctor':
        query['$or'] = [
            {'doctor_id': str(doctor['_id'])},
            {'doctor_id': doctor['_id']}
        ]

    if new_status == 'completed':
        # Enforce financial verification guard to guarantee tokens are locked into payment
        appointment = appointments_collection.find_one({'_id': ObjectId(pk)})
        payment = payments_collection.find_one({
            '$or': [
                {'appointment_id': str(pk)},
                {'appointment_id': pk},
                {'appointment_id': ObjectId(pk) if isinstance(pk, str) else pk}
            ],
            'payment_status': 'completed'
        })
        if not payment and appointment.get('status') != 'confirmed':
             return Response({'error': 'Cannot close session. Patient payment is still pending.'}, status=400)

    appointment = appointments_collection.find_one({'_id': ObjectId(pk)})
    if not appointment:
        return Response({'error': 'Appointment not found'}, status=404)

    update_payload = {'status': new_status}
    
    if new_status == 'rescheduled':
        new_date = request.data.get('new_date')
        new_time = request.data.get('new_time')
        if not new_date or not new_time:
             return Response({'error': 'New date and time are required for rescheduling'}, status=400)
        
        update_payload.update({
            'previous_appointment_date': appointment.get('appointment_date'),
            'previous_appointment_time': appointment.get('appointment_time'),
            'appointment_date': new_date,
            'appointment_time': new_time,
            'rescheduled_by': role.capitalize(),
            'rescheduled_at': datetime.now()
        })

    # Record clinical data if provided
    diagnosis = request.data.get('diagnosis')
    prescription = request.data.get('prescription')
    treatment_notes = request.data.get('treatment_notes')
    
    if diagnosis: update_payload['diagnosis'] = diagnosis
    if prescription: update_payload['prescription'] = prescription
    if treatment_notes: update_payload['treatment_notes'] = treatment_notes

    result = appointments_collection.update_one(
        query,
        {'$set': update_payload}
    )
    
    if result.matched_count == 0:
        return Response({'error': 'Appointment not found'}, status=404)
        
    # Generate Token if status is being set to confirmed manually
    if new_status == 'confirmed':
        appointment = appointments_collection.find_one({'_id': ObjectId(pk)})
        if appointment and not appointment.get('token_number'):
            t_count = appointments_collection.count_documents({
                'doctor_id': str(appointment['doctor_id']),
                'appointment_date': appointment['appointment_date'],
                'status': {'$in': ['confirmed', 'completed', 'NOW SERVING', 'WAITING']}
            })
            token_num = t_count + 1
            token_val = f"TOKEN-{token_num:03d}"
            appointments_collection.update_one(
                {'_id': ObjectId(pk)},
                {'$set': {
                    'token_number': token_num,
                    'token_id': token_val
                }}
            )
            
            # Internal Notification for Token
            patient = patients_collection.find_one({'_id': ObjectId(appointment['patient_id'])})
            if patient:
                create_notification(
                    user_id=patient['user_id'],
                    notification_type='appointment',
                    title='Token Generated',
                    message=f"A token number ({token_val}) has been generated for your appointment with Dr. {doctor['doctor_name']}."
                )
                
                # Email Notification for Token
                patient_user = users_collection.find_one({'_id': ObjectId(patient['user_id'])})
                if patient_user and patient_user.get('email'):
                    notify_token_generated(appointment, token_val, patient_user['email'])
    # Generate Clinical Receipt if completed
    if new_status == 'completed':
        try:
            appointment = appointments_collection.find_one({'_id': ObjectId(pk)})
            patient = patients_collection.find_one({'_id': ObjectId(appointment['patient_id'])})
            doctor = doctors_collection.find_one({'_id': ObjectId(appointment['doctor_id'])})
            
            # Find payment details
            payment = payments_collection.find_one({
                '$or': [
                    {'appointment_id': pk},
                    {'appointment_id': str(pk)},
                    {'appointment_id': ObjectId(pk) if isinstance(pk, str) else pk}
                ]
            })

            # Check if receipt already exists
            existing_receipt = clinical_receipts_collection.find_one({'appointment_id': str(pk)})
            if not existing_receipt:
                consultation_fee = float(doctor.get('consultation_fee', 500))
                total_amount = consultation_fee
                
                receipt_number = f"CR-{get_next_id('receipts'):04d}"
                
                receipt_doc = {
                    'receipt_number': receipt_number,
                    'appointment_id': str(pk),
                    'patient_id': str(patient['_id']),
                    'patient_name': patient['patient_name'],
                    'doctor_id': str(doctor['_id']),
                    'doctor_name': doctor['doctor_name'],
                    'doctor_specialization': doctor.get('specialization', 'General Physician'),
                    'hospital_id': appointment.get('hospital_id'),
                    'hospital_name': appointment.get('hospital_name', 'Swasthya Setu Hospital'),
                    'admission_date': appointment.get('created_at', datetime.now()),
                    'discharge_date': datetime.now(),
                    'consultation_charges': consultation_fee,
                    'total_amount': total_amount,
                    'payment_method': payment.get('payment_method', 'online') if payment else 'cash',
                    'payment_status': 'Completed',
                    'appointment_date': appointment.get('appointment_date'),
                    'appointment_time': appointment.get('appointment_time'),
                    'diagnosis': appointment.get('diagnosis', 'Standard Consultation'),
                    'prescription': appointment.get('prescription', ''),
                    'treatment_notes': appointment.get('treatment_notes', ''),
                    'created_at': datetime.now()
                }
                clinical_receipts_collection.insert_one(receipt_doc)
        except Exception as e:
            print(f"TELEMETRY: Automated receipt generation failed: {e}")

    # Internal Notification for Patient
    try:
        appointment = appointments_collection.find_one({'_id': ObjectId(pk)})
        patient = patients_collection.find_one({'_id': ObjectId(appointment['patient_id'])})
        
        if new_status == 'completed':
            notification_title = 'Discharge Summary & Receipt Available'
            notification_message = "You have been successfully discharged. Your Clinical Receipt is now available. Please log in to your dashboard and download it from the Clinical Receipts section."
        else:
            action_text = "confirmed" if new_status == 'accepted' else "declined" if new_status == 'rejected' else new_status
            notification_title = f'Appointment {new_status.title()}'
            notification_message = f"Your appointment with Dr. {doctor['doctor_name']} has been {action_text}." + (" Please finalize your booking by completing the payment." if new_status == 'accepted' else "")
            
        create_notification(
            user_id=patient['user_id'],
            notification_type='appointment',
            title=notification_title,
            message=notification_message
        )

        # Notify Patient via Email
        patient_user = users_collection.find_one({'_id': ObjectId(patient['user_id'])})
        
        if patient_user and patient_user.get('email'):
            send_email_async(
                subject=notification_title,
                recipient_list=[patient_user['email']],
                message=notification_message
            )
    except Exception as e:
        print(f"Notification failed: {e}")
        
    if new_status == 'cancelled':
        notify_admins('appointment_cancelled', 'Appointment Cancelled', f"Appointment {pk} was cancelled by {role}.")
    elif new_status == 'rescheduled':
        notify_admins('appointment_rescheduled', 'Appointment Rescheduled', f"Appointment {pk} was rescheduled by {role}.")

    return Response({'message': 'Status updated'})

@api_view(['POST'])
def propose_reschedule(request, pk):
    try:
        user_id = request.session.get('user_id')
        role = request.session.get('role')
        
        if role != 'doctor':
            return Response({'error': 'Unauthorized'}, status=401)
            
        doctor = doctors_collection.find_one({'user_id': user_id})
        if not doctor:
            return Response({'error': 'Doctor profile not found'}, status=404)
            
        data = request.data
        new_date = data.get('new_date')
        new_time = data.get('new_time')
        
        if not new_date or not new_time:
            return Response({'error': 'New date and time are required'}, status=400)
            
        # Query to match appointment by ID and doctor
        query = {
            '_id': ObjectId(pk),
            '$or': [
                {'doctor_id': str(doctor['_id'])},
                {'doctor_id': doctor['_id']}
            ]
        }
        
        result = appointments_collection.update_one(
            query,
            {'$set': {
                'status': 'reschedule_proposed',
                'proposed_date': new_date,
                'proposed_time': new_time
            }}
        )
        
        if result.matched_count == 1:
            appointment = appointments_collection.find_one({'_id': ObjectId(pk)})
            patient = patients_collection.find_one({'_id': ObjectId(appointment['patient_id'])})
            
            create_notification(
                user_id=patient['user_id'],
                notification_type='appointment',
                title='Reschedule Proposed',
                message=f"Dr. {doctor['doctor_name']} has proposed to reschedule your appointment to {new_date} at {new_time}. Please review."
            )

            # Email Notification
            try:
                patient_user = users_collection.find_one({'_id': ObjectId(patient['user_id'])})
                if patient_user and patient_user.get('email'):
                    notify_reschedule_proposal(appointment, doctor['doctor_name'], patient_user['email'])
            except Exception as e:
                print(f"Reschedule email failed: {e}")

            return Response({'message': 'Reschedule proposed to patient'})
        
        return Response({'error': 'Appointment not found'}, status=404)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e), 'trace': traceback.format_exc()}, status=500)

@api_view(['GET'])
def get_appointment_suggestions(request, pk):
    """
    Returns smart suggestions for a patient when they want to reschedule or reject a proposed time.
    Suggestions include:
    1. Alternative slots for the same doctor
    2. Other doctors in the same hospital (same specialization)
    3. Other hospitals/doctors in the area (same specialization)
    """
    try:
        from .db import doctors_collection, hospitals_collection, appointments_collection
        
        # 1. Fetch current appointment
        appointment = appointments_collection.find_one({'_id': ObjectId(pk)})
        if not appointment:
            return Response({'error': 'Appointment node not found'}, status=404)
        
        doctor_id = str(appointment['doctor_id'])
        hospital_id = str(appointment.get('hospital_id', ''))
        specialization = appointment.get('specialization', '')
        
        doctor_doc = doctors_collection.find_one({'_id': ObjectId(doctor_id)})
        if not specialization and doctor_doc:
            specialization = doctor_doc.get('specialization', '')
            
        def format_time_ampm(time_str):
            try:
                if not time_str: return "N/A"
                from datetime import datetime
                t = datetime.strptime(time_str, "%H:%M")
                return t.strftime("%I:%M %p")
            except: return time_str

        # 2. Same Doctor - Next 5 Available Slots
        doctor_slots = []
        today = datetime.now()
        
        # Check next 7 days for availability
        for i in range(7):
            target_date = (today + timedelta(days=i)).strftime('%Y-%m-%d')
            day_name = (today + timedelta(days=i)).strftime('%A')
            
            if doctor_doc:
                schedule = doctor_doc.get('schedule', {})
                day_slots = schedule.get(target_date, schedule.get(day_name, []))
                
                for s in day_slots:
                    if len(doctor_slots) >= 10: break # Increased limit for variety
                    
                    slot_time_24 = s['start']
                    # Basic check: skip if same as current proposed or original
                    if target_date == appointment.get('appointment_date') and slot_time_24 == appointment.get('appointment_time'):
                        continue
                        
                    doctor_slots.append({
                        'date': target_date,
                        'time': format_time_ampm(slot_time_24),
                        'raw_time': slot_time_24,
                        'doctor_name': doctor_doc.get('doctor_name'),
                        'doctor_id': doctor_id
                    })
        
        # 3. Same Hospital - Other Doctors (Same Specialization)
        hospital_alternatives = []
        if hospital_id and specialization:
            other_docs = list(doctors_collection.find({
                'hospital_id': hospital_id,
                '_id': {'$ne': ObjectId(doctor_id)},
                'specialization': specialization,
                'status': 'approved'
            }).limit(3))
            
            for doc in other_docs:
                hospital_alternatives.append({
                    'doctor_name': doc.get('doctor_name'),
                    'doctor_id': str(doc['_id']),
                    'hospital_name': appointment.get('hospital_name', 'This Hospital'),
                    'specialization': specialization,
                    'profile_picture': doc.get('profile_picture')
                })
        
        # 4. Area Alternatives - Other Hospitals (Same Specialization)
        area_alternatives = []
        if specialization:
            query = {
                'specialization': specialization,
                'status': 'approved'
            }
            if hospital_id:
                query['hospital_id'] = {'$ne': hospital_id}
            
            nearby_docs = list(doctors_collection.find(query).limit(3))
            for doc in nearby_docs:
                area_alternatives.append({
                    'doctor_name': doc.get('doctor_name'),
                    'doctor_id': str(doc['_id']),
                    'hospital_name': doc.get('hospital_name', 'Affiliated Clinic'),
                    'specialization': specialization,
                    'profile_picture': doc.get('profile_picture')
                })
                
        return Response({
            'smart_message': "This slot may not work for you. You can choose another time, explore other doctors, or book in a nearby hospital.",
            'doctor_slots': doctor_slots,
            'hospital_alternatives': hospital_alternatives,
            'area_alternatives': area_alternatives
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

def respond_to_reschedule(request, pk):
    try:
        user_id = request.session.get('user_id')
        role = request.session.get('role')
        
        if role != 'patient':
            return Response({'error': 'Unauthorized'}, status=401)
            
        data = request.data
        action = data.get('action') # 'accept' or 'decline'
        
        appointment = appointments_collection.find_one({'_id': ObjectId(pk)})
        if not appointment or appointment['status'] != 'reschedule_proposed':
            return Response({'error': 'Reschedule proposal not found'}, status=404)
            
        doctor = doctors_collection.find_one({'_id': ObjectId(appointment['doctor_id'])})
        
        if action == 'accept':
            appointments_collection.update_one(
                {'_id': ObjectId(pk)},
                {'$set': {
                    'status': 'rescheduled',
                    'previous_appointment_date': appointment.get('appointment_date'),
                    'previous_appointment_time': appointment.get('appointment_time'),
                    'appointment_date': appointment['proposed_date'],
                    'appointment_time': appointment['proposed_time'],
                    'rescheduled_by': 'Doctor', # Since doctor proposed this
                    'rescheduled_at': datetime.now()
                }}
            )
            create_notification(
                user_id=doctor['user_id'],
                notification_type='appointment',
                title='Reschedule Accepted',
                message=f"{appointment['patient_name']} has accepted the new schedule for {appointment['proposed_date']}."
            )

            # Email Notification
            try:
                doctor_user = users_collection.find_one({'_id': ObjectId(doctor['user_id'])})
                if doctor_user and doctor_user.get('email'):
                    notify_reschedule_response(appointment, action, doctor_user['email'])
            except Exception as e:
                print(f"Reschedule response email failed: {e}")

            return Response({'message': 'Reschedule accepted'})
        else:
            appointments_collection.update_one(
                {'_id': ObjectId(pk)},
                {'$set': {'status': 'rejected'}}
            )
            create_notification(
                user_id=doctor['user_id'],
                notification_type='appointment',
                title='Reschedule Declined',
                message=f"{appointment['patient_name']} has declined the reschedule proposal."
            )

            # Email Notification
            try:
                doctor_user = users_collection.find_one({'_id': ObjectId(doctor['user_id'])})
                if doctor_user and doctor_user.get('email'):
                    notify_reschedule_response(appointment, action, doctor_user['email'])
            except Exception as e:
                print(f"Reschedule response email failed: {e}")

            return Response({'message': 'Reschedule declined'})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e), 'trace': traceback.format_exc()}, status=500)

@api_view(['POST'])
def request_report(request):
    try:
        user_id = request.session.get('user_id')
        role = request.session.get('role')
        
        if role != 'doctor':
            return Response({'error': 'Unauthorized'}, status=401)
            
        doctor = doctors_collection.find_one({'user_id': user_id})
        if not doctor:
            return Response({'error': 'Doctor profile not found'}, status=404)

        data = request.data
        patient_id = data.get('patient_id') # Patient's _id string
        report_type = data.get('report_type')
        message = data.get('message', '')
        
        if not patient_id or not report_type:
            return Response({'error': 'Patient ID and report type are required'}, status=400)
            
        patient = patients_collection.find_one({'_id': ObjectId(patient_id)})
        if not patient:
            return Response({'error': 'Patient not found'}, status=404)
            
        # Internal Notification
        create_notification(
            user_id=patient['user_id'],
            notification_type='report_request',
            title='Additional Report Requested',
            message=f"Dr. {doctor['doctor_name']} has requested a {report_type} report. {message}"
        )
        
        # Email Notification
        try:
            patient_user = users_collection.find_one({'_id': ObjectId(patient['user_id'])})
            if patient_user and patient_user.get('email'):
                subject = "Additional Medical Report Requested - Swasthya Setu"
                email_message = f"Hello {patient['patient_name']},\n\nDr. {doctor['doctor_name']} has requested you to upload an additional {report_type} report to your medical vault.\n\nDoctor's Message: {message}\n\nPlease log in to your dashboard to upload the requested document.\n\nRegards,\nSwasthya Setu Team"
                send_email_async(subject, [patient_user['email']], email_message)
        except Exception as e:
            print(f"Report request email failed: {e}")
            
        return Response({'message': 'Report request sent to patient'})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_available_slots(request):
    doctor_id = request.query_params.get('doctor_id')
    date = request.query_params.get('date')

    if not doctor_id or not date:
        return Response(
            {'error': 'doctor_id and date are required'},
            status=400
        )

    try:
        doctor = doctors_collection.find_one({'_id': ObjectId(doctor_id)})
        if not doctor:
            return Response({'error': 'Doctor not found'}, status=404)
            
        # Parse date to get day name
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        day_name = date_obj.strftime('%A') # e.g. Monday
        
        schedule = doctor.get('schedule', {})
        # Prioritize specific date override, then fallback to weekly pattern
        day_config = schedule.get(date, schedule.get(day_name, []))
        
        # Handle new structure: { slots: [], limit: 10 } vs old list structure
        if isinstance(day_config, dict):
            day_slots = day_config.get('slots', [])
            max_limit = int(day_config.get('limit', doctor.get('max_patients_per_slot', 10)))
        else:
            day_slots = day_config
            max_limit = int(doctor.get('max_patients_per_slot', 10))
            
        formatted_slots = []
        for idx, slot in enumerate(day_slots):
            # Count existing bookings for this specific slot
            booked_count = appointments_collection.count_documents({
                'doctor_id': doctor_id,
                'appointment_date': date,
                'appointment_time': slot['start'],
                'status': {'$ne': 'rejected'}
            })
            
            remaining = max_limit - booked_count
            
            formatted_slots.append({
                'slot_id': f"{day_name}_{idx}",
                'start_time': slot['start'],
                'end_time': slot['end'],
                'is_available': remaining > 0,
                'max_capacity': max_limit,
                'booked_count': booked_count,
                'remaining': max(0, remaining)
            })
            
        return Response(formatted_slots)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
@api_view(['GET'])
def get_doctor_availability_calendar(request):
    """
    Returns simplified availability status for a doctor over a requested month/range.
    """
    doctor_id = request.query_params.get('doctor_id')
    month = int(request.query_params.get('month'))
    year = int(request.query_params.get('year'))

    if not doctor_id or not month or not year:
        return Response({'error': 'doctor_id, month, and year are required'}, status=400)

    try:
        doctor = doctors_collection.find_one({'_id': ObjectId(doctor_id)})
        if not doctor:
            return Response({'error': 'Doctor not found'}, status=404)

        schedule = doctor.get('schedule', {})
        calendar_data = {}
        
        # Calculate for each day of the month
        import calendar as pycalendar
        _, num_days = pycalendar.monthrange(year, month)
        
        for day in range(1, num_days + 1):
            date_str = f"{year}-{month:02d}-{day:02d}"
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            day_name = date_obj.strftime('%A')
            
            # Check availability
            # 1. Override date check
            # 2. Weekly day check
            day_slots = schedule.get(date_str, schedule.get(day_name, []))
            
            # Simple binary availability for now
            calendar_data[date_str] = {
                'available': len(day_slots) > 0,
                'slots_count': len(day_slots)
            }
            
        return Response(calendar_data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_admin_stats(request):
    # Determine if user is admin (simplified check)
    user_id = request.session.get('user_id')
    user = users_collection.find_one({'_id': ObjectId(user_id)}) if user_id else None
    
    # In a real app, strict role check: if not user or user['role'] != 'admin':
    #    return Response({'error': 'Unauthorized'}, status=403)

    # Calculate Active Users (active in last 15 mins)
    fifteen_mins_ago = datetime.now()
    # Note: Using raw MongoDB query for date comparison
    # We need to fetch all users and check python side if date structure is complex, 
    # but $gt query is efficient.
    
    # Simple online check
    # offline/online logic
    online_threshold = datetime.now().timestamp() - 15 * 60
    # MongoDB stores datetime objects usually, so:
    from datetime import timedelta
    threshold_time = datetime.now() - timedelta(minutes=15)
    
    online_patients = users_collection.count_documents({
        'role': 'patient', 'last_active': {'$gt': threshold_time}
    })
    online_doctors = users_collection.count_documents({
        'role': 'doctor', 'last_active': {'$gt': threshold_time}
    })

    stats = {
        'total_patients': list(patients_collection.find()) if False else patients_collection.count_documents({}),
        'total_doctors': doctors_collection.count_documents({'status': 'approved'}),
        'total_hospitals': hospitals_collection.count_documents({}),
        'appointments': appointments_collection.count_documents({}),
        'today_appointments': appointments_collection.count_documents({
            'appointment_date': datetime.now().strftime('%Y-%m-%d')
        }),
        'online_patients': online_patients,
        'online_doctors': online_doctors,
        'total_revenue': list(payments_collection.aggregate([
            {"$match": {"payment_status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]))[0]['total'] if payments_collection.count_documents({"payment_status": "completed"}) > 0 else 0
    }
    return Response(stats)

def _fetch_analytics_data(year=None, month=None, day=None):
    from datetime import datetime, timedelta
    
    if not year:
        now = datetime.now()
        year = now.year
        month = now.month
        day = now.day
    else:
        year = int(year)
        month = int(month) if month else None
        day = int(day) if day else None

    # Calculate range
    if month and day:
        start_date = datetime(year, month, day)
        end_date = start_date + timedelta(days=1)
    elif month:
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
    else:
        start_date = datetime(year, 1, 1)
        end_date = datetime(year + 1, 1, 1)

    # Registrations
    reg_patients = users_collection.count_documents({
        'role': 'patient',
        'date_joined': {'$gte': start_date, '$lt': end_date}
    })
    reg_doctors = users_collection.count_documents({
        'role': 'doctor',
        'date_joined': {'$gte': start_date, '$lt': end_date}
    })
    
    # Appointments
    app_count = appointments_collection.count_documents({
        'created_at': {'$gte': start_date, '$lt': end_date}
    })
    
    # Revenue
    payments = list(payments_collection.find({
        'payment_status': 'completed',
        'created_at': {'$gte': start_date, '$lt': end_date}
    }))
    
    total_revenue = sum(p.get('amount', 0) for p in payments)
    
    doctor_revenue = {}
    for p in payments:
        doc_id = p.get('doctor_id')
        doc_name = p.get('doctor_name')
        app = None

        if p.get('appointment_id'):
            try:
                app = appointments_collection.find_one({'_id': ObjectId(p.get('appointment_id'))})
            except:
                pass

        if not doc_id and app:
            doc_id = str(app.get('doctor_id', ''))
            doc_name = app.get('doctor_name', 'Unknown')

        hospital_name = app.get('hospital_name') if app else None
        
        if not hospital_name and doc_id:
            try:
                # Need to handle if doc_id is valid ObjectId
                doc_profile = None
                if ObjectId.is_valid(doc_id):
                    doc_profile = doctors_collection.find_one({'_id': ObjectId(doc_id)})
                if not doc_profile:
                    doc_profile = doctors_collection.find_one({'user_id': doc_id})
                    
                if doc_profile and doc_profile.get('hospital_id'):
                    if ObjectId.is_valid(doc_profile['hospital_id']):
                        h_obj = hospitals_collection.find_one({'_id': ObjectId(doc_profile['hospital_id'])})
                        if h_obj:
                            hospital_name = h_obj.get('name')
            except Exception:
                pass

        if not hospital_name:
            hospital_name = 'Central Medical Hub'
        
        if doc_id:
            if doc_id not in doctor_revenue:
                doctor_revenue[doc_id] = {'name': doc_name, 'amount': 0, 'count': 0, 'hospitals': set()}
            doctor_revenue[doc_id]['amount'] += p.get('amount', 0)
            doctor_revenue[doc_id]['count'] += 1
            doctor_revenue[doc_id]['hospitals'].add(hospital_name)

    for doc in doctor_revenue.values():
        doc['hospital_name'] = " & ".join(list(doc['hospitals']))
        del doc['hospitals']

    # Total Users
    total_users = users_collection.count_documents({})

    # Ratings Aggregation
    doctor_rating_res = list(reviews_collection.aggregate([
        {"$group": {"_id": "$doctor_id", "avg_rating": {"$avg": "$rating"}}}
    ]))
    doctor_ratings = {str(item['_id']): round(item['avg_rating'] or 0, 1) for item in doctor_rating_res}

    hospital_rating_res = list(reviews_collection.aggregate([
        {"$match": {"hospital_rating": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": "$hospital_id", "avg_rating": {"$avg": "$hospital_rating"}}}
    ]))
    hospital_ratings = {str(item['_id']): round(item['avg_rating'], 1) for item in hospital_rating_res}

    # Overall averages
    overall_doctor_avg = round(sum([r for r in doctor_ratings.values()]) / len(doctor_ratings), 1) if doctor_ratings else 0
    overall_hospital_avg = round(sum([r for r in hospital_ratings.values()]) / len(hospital_ratings), 1) if hospital_ratings else 0
    total_users = users_collection.count_documents({})
    
    # Monthly Growth (Last 12)
    monthly_growth = []
    for i in range(11, -1, -1):
        # Calculate month/year
        m = (datetime.now().month - i - 1) % 12 + 1
        y = datetime.now().year if (datetime.now().month - i > 0) else datetime.now().year - 1
        ms = datetime(y, m, 1)
        me = datetime(y, m % 12 + 1, 1) if m < 12 else datetime(y + 1, 1, 1)
        count = users_collection.count_documents({'date_joined': {'$gte': ms, '$lt': me}})
        monthly_growth.append({'label': ms.strftime("%b %y"), 'count': count})

    # Yearly Growth (Last 5)
    yearly_growth = []
    for i in range(4, -1, -1):
        y = datetime.now().year - i
        ys = datetime(y, 1, 1)
        ye = datetime(y + 1, 1, 1)
        count = users_collection.count_documents({'date_joined': {'$gte': ys, '$lt': ye}})
        yearly_growth.append({'label': str(y), 'count': count})
        
    # Ratings Average
    doctor_avg_rating = 0
    hospital_avg_rating = 0
    
    doc_res = list(reviews_collection.aggregate([{"$group": {"_id": None, "avg": {"$avg": "$rating"}}}]))
    if doc_res and doc_res[0].get('avg'):
        doctor_avg_rating = round(doc_res[0]['avg'], 1)

    hosp_res = list(reviews_collection.aggregate([
        {"$match": {"hospital_rating": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": None, "avg": {"$avg": "$hospital_rating"}}}
    ]))
    if hosp_res and hosp_res[0].get('avg'):
        hospital_avg_rating = round(hosp_res[0]['avg'], 1)

    # Consultation Types Aggregation
    consultation_types_res = list(appointments_collection.aggregate([
        {'$match': {'created_at': {'$gte': start_date, '$lt': end_date}}},
        {'$group': {'_id': '$consultation_type', 'count': {'$sum': 1}}}
    ]))
    # Ensure all defined types are present even if count is 0
    defined_types = ['General Consultation', 'Specialized Case', 'Emergency Sync', 'Neural/Follow-up']
    consultation_stats = {t: 0 for t in defined_types}
    for item in consultation_types_res:
        ctype = item['_id'] or 'General Consultation'
        if ctype in consultation_stats:
            consultation_stats[ctype] = item['count']
        else:
            consultation_stats[ctype] = item['count']

    return {
        'period': {
            'year': year,
            'month': month,
            'day': day,
            'start_date': start_date,
            'end_date': end_date
        },
        'registrations': {
            'patients': reg_patients,
            'doctors': reg_doctors
        },
        'appointments': app_count,
        'revenue': {
            'total': total_revenue,
            'breakdown': list(doctor_revenue.values())
        },
        'user_stats': {
            'total': total_users,
            'monthly_growth': monthly_growth,
            'yearly_growth': yearly_growth
        },
        'ratings': {
            'doctor_ratings': doctor_ratings,
            'hospital_ratings': hospital_ratings,
            'overall_doctor_avg': overall_doctor_avg,
            'overall_hospital_avg': overall_hospital_avg
        },
        'consultation_stats': consultation_stats
    }

@api_view(['GET'])
def get_filtered_analytics(request):
    try:
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        day = request.query_params.get('day')
        
        data = _fetch_analytics_data(year, month, day)
        return Response(data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def export_analytics_pdf(request):
    try:
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        day = request.query_params.get('day')
        
        data = _fetch_analytics_data(year, month, day)
        
        month_names = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        month_label = month_names[data['period']['month']] if data['period']['month'] else ""
        period_label = f"{data['period']['day']} {month_label}" if data['period']['day'] else (month_label if month_label else "Full Year")
        
        # Register fonts in reportlab for better support
        try:
            from reportlab.pdfbase import pdfmetrics
            from reportlab.pdfbase.ttfonts import TTFont
            from reportlab.lib.fonts import addMapping
            import os
            font_dir = os.path.join(os.environ.get('WINDIR', 'C:/Windows'), 'Fonts')
            reg_font = os.path.join(font_dir, 'arial.ttf')
            bold_font = os.path.join(font_dir, 'arialbd.ttf')
            
            if os.path.exists(reg_font):
                pdfmetrics.registerFont(TTFont('Arial', reg_font))
                addMapping('Arial', 0, 0, 'Arial')
            if os.path.exists(bold_font):
                pdfmetrics.registerFont(TTFont('Arial', bold_font))
                addMapping('Arial', 1, 0, 'Arial') # Map bold style
                pdfmetrics.registerFont(TTFont('ArialBold', bold_font))
                addMapping('Arial', 1, 0, 'ArialBold')

        except Exception as e:
            print(f"Font registration failed: {e}")

        # HTML template for PDF (Professional & Minimalist Redesign)
        html_content = f"""
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @page {{
                    size: a4 portrait;
                    margin: 1.5cm;
                    @frame footer {{
                        -pdf-frame-content: footer_content;
                        bottom: 1cm;
                        margin-left: 1.5cm;
                        margin-right: 1.5cm;
                        height: 1cm;
                    }}
                }}

                body {{ 
                    font-family: 'Arial', sans-serif; 
                    color: #1a202c; 
                    line-height: 1.5;
                    background-color: #ffffff;
                }}
                b, strong {{ font-family: 'ArialBold', 'Arial', sans-serif; font-weight: bold; }}
                
                /* Header Styling */
                .header {{
                    border-bottom: 2px solid #edf2f7;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }}
                .header-table {{
                    width: 100%;
                }}
                .brand-logo {{
                    font-size: 32px;
                    font-weight: 800;
                    color: #3182ce;
                    letter-spacing: -1px;
                }}
                .report-subtitle {{
                    font-size: 14px;
                    color: #718096;
                    font-weight: 600;
                    margin-top: 4px;
                }}
                .meta-data {{
                    text-align: right;
                    font-size: 11px;
                    color: #a0aec0;
                }}

                /* Section Branding */
                .section-header {{
                    background-color: #f8fafc;
                    padding: 10px 15px;
                    border-left: 4px solid #3182ce;
                    font-size: 12px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #2d3748;
                    margin: 25px 0 15px 0;
                    letter-spacing: 0.5px;
                }}

                /* Statistics Cards */
                .stats-grid {{
                    width: 100%;
                    margin-bottom: 20px;
                }}
                .stat-box {{
                    background-color: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 15px;
                    text-align: center;
                }}
                .stat-value {{
                    font-size: 24px;
                    font-weight: 800;
                    color: #2d3748;
                    margin-bottom: 5px;
                }}
                .stat-label {{
                    font-size: 9px;
                    font-weight: 700;
                    color: #718096;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }}
                
                /* Table Styling */
                table.data-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                }}
                table.data-table th {{
                    background-color: #f1f5f9;
                    color: #475569;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 12px 10px;
                    text-align: left;
                    border-bottom: 2px solid #e2e8f0;
                    text-transform: uppercase;
                }}
                table.data-table td {{
                    padding: 12px 10px;
                    font-size: 11px;
                    border-bottom: 1px solid #f1f5f9;
                    color: #334155;
                }}
                .money-cell {{
                    font-weight: 700;
                    color: #059669;
                    text-align: right;
                }}
                .centered-cell {{
                    text-align: center;
                }}
                
                /* Empty State */
                .empty-message {{
                    padding: 40px;
                    text-align: center;
                    color: #94a3b8;
                    font-style: italic;
                    font-size: 13px;
                    background-color: #f8fafc;
                    border-radius: 8px;
                    border: 1px dashed #cbd5e1;
                }}

                #footer_content {{
                    text-align: center;
                    color: #94a3b8;
                    font-size: 9px;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 5px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <table class="header-table">
                    <tr>
                        <td>
                            <div class="brand-logo">Swasthya Setu</div>
                            <div class="report-subtitle">Clinic Performance Report &ndash; {period_label} {data['period']['year']}</div>
                        </td>
                        <td class="meta-data">
                            Generation ID: SS-{int(datetime.now().timestamp())}<br/>
                            Generated on: {datetime.now().strftime('%d %B %Y')}<br/>
                            Time: {datetime.now().strftime('%I:%M %p')}
                        </td>
                    </tr>
                </table>
            </div>

            <div class="section-header">Platform Summary</div>
            <table class="stats-grid">
                <tr>
                    <td width="25%" style="padding-right: 8px;">
                        <div class="stat-box">
                            <div class="stat-value">{data['user_stats']['total']}</div>
                            <div class="stat-label">Total Network Users</div>
                        </div>
                    </td>
                    <td width="25%" style="padding: 0 4px;">
                        <div class="stat-box">
                            <div class="stat-value">{data['registrations']['patients'] + data['registrations']['doctors']}</div>
                            <div class="stat-label">New Registrations</div>
                        </div>
                    </td>
                    <td width="25%" style="padding: 0 4px;">
                        <div class="stat-box">
                            <div class="stat-value">{data['appointments']}</div>
                            <div class="stat-label">Clinical Sessions</div>
                        </div>
                    </td>
                    <td width="25%" style="padding-left: 8px;">
                        <div class="stat-box" style="border-color: #3182ce;">
                            <div class="stat-value" style="color: #3182ce;">₹{float(data['revenue']['total']):,.0f}</div>
                            <div class="stat-label">Gross Revenue</div>
                        </div>
                    </td>
                </tr>
            </table>

            <div class="section-header">Ecosystem Growth Breakdown</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th width="70%">Strategic Vertical</th>
                        <th width="30%" style="text-align:right;">New Registrations</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Patient Network Shards</td>
                        <td style="text-align:right; font-weight: 700;">{data['registrations']['patients']}</td>
                    </tr>
                    <tr>
                        <td>Medical Faculty Nodes</td>
                        <td style="text-align:right; font-weight: 700;">{data['registrations']['doctors']}</td>
                    </tr>
                </tbody>
            </table>

            <div class="section-header">Practitioner Performance (Revenue)</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th width="30%">Doctor Name</th>
                        <th width="30%">Associated Hospital</th>
                        <th width="15%" class="centered-cell">Appointments</th>
                        <th width="25%" style="text-align:right;">Revenue (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join([f"<tr><td>Dr. {d['name']}</td><td>{d.get('hospital_name', 'Central Hub')}</td><td class='centered-cell'>{d['count']}</td><td class='money-cell'>₹{float(d['amount']):,.2f}</td></tr>" for d in data['revenue']['breakdown']]) if data['revenue']['breakdown'] else '<tr><td colspan="4"><div class="empty-message">No appointments available for the selected period.</div></td></tr>'}
                </tbody>
            </table>

            <div id="footer_content">
                CONFIDENTIAL: This report is intended for internal clinical administration only. 
                &copy; {datetime.now().year} Swasthya Setu Health Tech. All rights reserved.
            </div>
        </body>
        </html>
        """

        result = io.BytesIO()
        pdf = pisa.pisaDocument(io.BytesIO(html_content.encode("UTF-8")), result, encoding='UTF-8')

        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            filename = f"analytics_report_{data['period']['year']}_{data['period']['month'] or ''}_{data['period']['day'] or ''}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        return Response({'error': f'PDF generation failed: {pdf.err}'}, status=500)


    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

# ============================================================
# HOSPITAL MANAGEMENT (Admin)
# ============================================================

@api_view(['GET', 'POST'])
def manage_hospitals(request):
    if request.method == 'GET':
        hospitals = list(hospitals_collection.find())
        # Enhance with extra portfolio info for display
        for h in hospitals:
            if 'specialties' not in h or not h['specialties']:
                h['specialties'] = ['Emergency Care', 'Cardiology', 'Neurology', 'Pediatrics']
            if 'overview' not in h:
                h['overview'] = f"{h['name']} is a leading healthcare node in {h['location']}, providing 24/7 medical surveillance and advanced surgical procedures."
            if 'capacity' not in h:
                h['capacity'] = '500+ Beds'
            if 'rating' not in h:
                h['rating'] = 4.8
        return Response(serialize_mongo(hospitals))
    
    elif request.method == 'POST':
        # Check Admin
        # user_id = request.session.get('user_id') ... verify admin ...
        
        data = request.data
        if not data.get('name') or not data.get('location'):
             return Response({'error': 'Name and Location required'}, status=400)
        
        # Check if hospital already exists by name
        existing_hospital = hospitals_collection.find_one({'name': data['name']})
        if existing_hospital:
            return Response({'error': f'Hospital with name "{data["name"]}" already exists'}, status=400)
             
        hospital = {
            'hospital_id': get_next_id('hospitals', prefix='h'),
            'name': data['name'],
            'location': data['location'],
            'address': data.get('address', ''),
            'contact': data.get('contact', ''),
            'image_url': data.get('image_url', ''),
            'specialties': data.get('specialties', []),
            'created_at': datetime.now()
        }
        
        try:
            result = hospitals_collection.insert_one(hospital)
            return Response({'message': 'Hospital added', 'id': str(result.inserted_id)})
        except DuplicateKeyError:
            return Response({'error': 'A hospital with this unique information already exists'}, status=400)

@api_view(['DELETE'])
def delete_hospital(request, pk):
    try:
        from bson.errors import InvalidId
        result = hospitals_collection.delete_one({'_id': ObjectId(pk)})
        if result.deleted_count == 0:
            return Response({'error': 'Hospital not found'}, status=404)
        return Response({'message': 'Hospital deleted'})
    except Exception as e:
        with open('error_log.txt', 'a') as f:
            f.write(f"DeleteHospitalError: {str(e)}\n")
        return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT'])
def get_hospital_details(request, pk):
    if request.method == 'GET':
        try:
            hospital = hospitals_collection.find_one({'_id': ObjectId(pk)})
            if not hospital:
                return Response({'error': 'Hospital not found'}, status=404)
            
            # Associated doctors - Filter by hospital_id and status
            doctors = list(doctors_collection.find({'hospital_id': pk, 'status': 'approved'}))
            
            hospital_data = serialize_mongo(hospital)
            hospital_data['doctors'] = serialize_mongo(doctors)
            
            return Response(hospital_data)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
            
    elif request.method == 'PUT':
        data = request.data
        update_fields = {}
        
        # Whitelisted fields for update
        fields = ['name', 'location', 'address', 'contact', 'image_url', 'specialties']
        for field in fields:
            if field in data:
                update_fields[field] = data[field]
                
        if not update_fields:
            return Response({'error': 'No fields to update'}, status=400)
            
        try:
            result = hospitals_collection.update_one(
                {'_id': ObjectId(pk)},
                {'$set': update_fields}
            )
            
            if result.matched_count == 0:
                return Response({'error': 'Hospital not found'}, status=404)
                
            updated_hospital = hospitals_collection.find_one({'_id': ObjectId(pk)})
            return Response(serialize_mongo(updated_hospital))
        except Exception as e:
            return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def assign_doctor_to_hospital(request):
    # Admin check implied
    data = request.data
    doctor_id = data.get('doctor_id') # User ID (from users_collection)
    hospital_id = data.get('hospital_id') # MongoDB ObjectId string

    if not doctor_id or not hospital_id:
        return Response({'error': 'Doctor ID and Hospital ID required'}, status=400)

    try:
        # Update doctor's profile in both collections for consistency
        # Some dashboards might use doctors_collection, others users_collection via Auth
        doctors_collection.update_one(
            {'user_id': doctor_id},
            {'$set': {'hospital_id': hospital_id}}
        )
        users_collection.update_one(
            {'_id': ObjectId(doctor_id)},
            {'$set': {'hospital_id': hospital_id}}
        )
        return Response({'message': 'Doctor assigned to node successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# ============================================================
# USER MANAGEMENT (Admin)
# ============================================================

@api_view(['GET'])
def get_users_by_role(request, role):
    print(f"DEBUG: Fetching users for role: {role}")
    users = list(users_collection.find({'role': role}))
    print(f"DEBUG: Found {len(users)} users")
    
    # Enrich with profile data and filter for doctors
    enriched_users = []
    for user in users:
        enrichment = {}
        if role == 'patient':
            profile = patients_collection.find_one({'user_id': str(user['_id'])})
            if profile:
                enrichment = profile
        elif role == 'doctor':
            profile = doctors_collection.find_one({
                'user_id': str(user['_id']),
                'status': 'approved'
            })
            if profile:
                enrichment = profile
            else:
                # If doctor but not approved, exclude from this (active) list
                continue
        
        if enrichment:
            # Handle profile _id to avoid conflict
            profile_id = enrichment.pop('_id', None)
            enrichment['profile_id'] = profile_id
            
            # Merge profile data into user object - avoid overwriting original user _id
            user.update(enrichment)
        
        enriched_users.append(user)
            
    return Response(serialize_mongo(enriched_users))

# ============================================================
# DOCTOR REGISTRATION MANAGEMENT (Admin)
# ============================================================

@api_view(['GET'])
def get_pending_doctor_registrations(request):
    """Fetch all pending doctor registration requests for admin review"""
    if request.session.get('role') != 'admin':
        return Response({'error': 'Unauthorized'}, status=401)
        
    pending_doctors = list(doctors_collection.find({'status': 'pending'}).sort('created_at', -1))
    return Response(serialize_mongo(pending_doctors))

@api_view(['POST'])
def update_doctor_registration_status(request, pk):
    """Approve or Reject a doctor registration request"""
    if request.session.get('role') != 'admin':
        return Response({'error': 'Unauthorized'}, status=401)
        
    action = request.data.get('action') 
    if action not in ['approve', 'reject']:
        return Response({'error': 'Invalid action. Must be approve or reject.'}, status=400)
        
    status_map = {
        'approve': 'approved',
        'reject': 'rejected'
    }
    
    new_status = status_map[action]
    
    # Update doctor record
    result = doctors_collection.update_one(
        {'_id': ObjectId(pk)},
        {'$set': {'status': new_status}}
    )
    
    if result.matched_count == 0:
        return Response({'error': 'Doctor registration request not found'}, status=404)
        
    # Get doctor details for email notification
    doctor = doctors_collection.find_one({'_id': ObjectId(pk)})
    if doctor:
        from .utils import notify_doctor_registration_action
        notify_doctor_registration_action(
            doctor_name=doctor['doctor_name'],
            doctor_email=doctor['email'],
            status=new_status
        )
        
        # If rejected, we might want to also deactivate the user account or keep it for records
        # For now, we only update the status in the doctor collection which prevents login
        
    return Response({'message': f'Doctor registration {new_status} successfully'})

@api_view(['DELETE'])
def delete_user(request, pk):
    try:
        result = users_collection.delete_one({'_id': ObjectId(pk)})
        
        # Also delete from role-specific collections
        patients_collection.delete_many({'user_id': pk})
        doctors_collection.delete_many({'user_id': pk})
        
        if result.deleted_count == 0:
            return Response({'error': 'User not found'}, status=404)
        return Response({'message': 'User deleted'})
    except Exception as e:
        with open('error_log.txt', 'a') as f:
            f.write(f"DeleteUserError: {str(e)}\n")
        return Response({'error': str(e)}, status=500)

from .symptom_logic import generate_chat_session, analyze_symptom_message

# Server-side transient memory cache for AI model instances.
# Conversation content is persisted in MongoDB.
active_chat_sessions = {}

@api_view(['POST'])
def predict_symptoms(request):
    user_id = request.session.get('user_id', 'anonymous')
    message = request.data.get('message', '')
    
    if not message:
        return Response({'error': 'No message provided'}, status=400)
    
    # Check if a chat session is already active for this user connection
    session_id = request.session.session_key
    if not session_id:
        request.session.save()
        session_id = request.session.session_key
        
    # Load history from DB to prime session if memory cache was cleared
    history_query = {'user_id': user_id} if user_id != 'anonymous' else {'session_id': session_id}
    db_history = list(chat_messages_collection.find(history_query).sort('created_at', 1))
    formatted_history = [{'role': m['role'], 'text': m['text']} for m in db_history]

    # Get OR create session (history primes it if created NEW)
    from .symptom_logic import session_manager, analyze_symptom_message
    chat_model = session_manager.get_session(session_id, formatted_history)
    
    # Save the new user message to DB
    user_msg_doc = {
        'user_id': user_id,
        'session_id': session_id,
        'role': 'user',
        'text': message,
        'created_at': datetime.now()
    }
    chat_messages_collection.insert_one(user_msg_doc)
    
    # Process through the Generative AI Model
    llm_result = analyze_symptom_message(chat_model, session_id, message, formatted_history)
    
    # --- DATA ENRICHMENT ---
    status = llm_result.get('status', 'need_more_info')
    response_text = llm_result.get('response', '')
    
    llm_result['doctors'] = []
    llm_result['hospitals'] = []

    # If status is complete, we perform special summary storage and enrichment
    if status == 'complete':
        result_data = llm_result.get('result', {})
        specialty = result_data.get('recommended_doctor', '')
        
        # 1. Enrichment: Find matching specialists for the diagnosed condition
        if specialty:
            docs = list(doctors_collection.find({
                'specialization': {'$regex': specialty, '$options': 'i'},
                'status': 'approved'
            }).limit(4))
            llm_result['doctors'] = serialize_mongo(docs)
            
        # 2. Persistence: Store clinical assessment if requested
        if llm_result.get('session_update', {}).get('store'):
            summary_doc = {
                'user_id': user_id,
                'session_id': session_id,
                'diagnosis': result_data.get('primary_disease'),
                'alternatives': result_data.get('possible_diseases'),
                'severity': result_data.get('severity'),
                'doctor_type': specialty,
                'action': result_data.get('recommended_action'),
                'explanation': result_data.get('explanation'),
                'created_at': datetime.now()
            }
            symptom_checks_collection.insert_one(summary_doc)
    
    # Else if need_more_info, join questions into response for better UI if not already done
    elif status == 'need_more_info':
        questions = llm_result.get('session_update', {}).get('new_questions', [])
        if questions and "?" not in response_text:
             llm_result['response'] = response_text + "\n\n" + "\n".join([f"- {q}" for q in questions])

    # Save the AI response (the conversational part) to DB
    bot_msg_doc = {
        'user_id': user_id,
        'session_id': session_id,
        'role': 'bot',
        'text': llm_result.get('response', ''),
        'created_at': datetime.now(),
        'metadata': llm_result
    }
    chat_messages_collection.insert_one(bot_msg_doc)

    return Response(llm_result)

@api_view(['GET'])
def get_chat_history(request):
    user_id = request.session.get('user_id', 'anonymous')
    session_id = request.session.session_key
    
    if not session_id:
        return Response([])

    history_query = {'user_id': user_id} if user_id != 'anonymous' else {'session_id': session_id}
    messages = list(chat_messages_collection.find(history_query).sort('created_at', 1).limit(50))
    
    return Response(serialize_mongo(messages))

@api_view(['POST'])
def clear_chat_history(request):
    user_id = request.session.get('user_id', 'anonymous')
    session_id = request.session.session_key
    
    if not session_id:
        return Response({'message': 'No session to clear'})

    history_query = {'user_id': user_id} if user_id != 'anonymous' else {'session_id': session_id}
    chat_messages_collection.delete_many(history_query)
    
    # Also reset the AI session instance in the manager
    from .symptom_logic import session_manager
    session_manager.clear(session_id)
        
    return Response({'message': 'Conversation history cleared'})


# --- Medical Records ---
@api_view(['POST'])
def upload_file(request):
    try:
        user_id = request.session.get('user_id')
        if not user_id:
            return Response({'error': 'Unauthorized'}, status=401)
            
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=400)
            
        # Standardize filename to avoid conflicts
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file_obj.name.replace(' ', '_')}"
        
        # Save file - Ensure forward slashes for URL compatibility
        relative_path = f"reports/{user_id}/{safe_filename}"
        file_path = default_storage.save(relative_path, ContentFile(file_obj.read()))
        
        # Normalize path for cross-platform and URL consistency
        normalized_path = file_path.replace('\\', '/')
        
        # Store metadata in MongoDB
        record = {
            'record_id': get_next_id('medical_records', prefix='mr'),
            'user_id': user_id,
            'file_name': file_obj.name,
            'file_path': normalized_path,
            'file_type': file_obj.content_type,
            'uploaded_at': datetime.now(),
            'description': request.data.get('description', 'Medical Report')
        }
        
        medical_records_collection.insert_one(record)
        
        notify_admins('report_upload', 'Patient Report Uploaded', f"A new medical report '{file_obj.name}' was uploaded by {user_id}.")

        # Track the share and check if it's a Discharge Summary to generate a receipt
        doctor_id = request.data.get('doctor_id')
        description = request.data.get('description', 'Medical Report')
        
        if description == 'Discharge Summary' and (doctor_id or request.session.get('role') == 'doctor'):
            try:
                # If doctor is uploading, user_id is doctor_id
                # If patient is uploading, doctor_id must be provided
                actual_doctor_id = user_id if request.session.get('role') == 'doctor' else doctor_id
                actual_patient_id = request.data.get('patient_id') if request.session.get('role') == 'doctor' else None
                
                if not actual_patient_id and request.session.get('role') == 'patient':
                    patient = patients_collection.find_one({'user_id': user_id})
                    actual_patient_id = str(patient['_id'])
                
                patient_doc = patients_collection.find_one({'_id': ObjectId(actual_patient_id)})
                doctor_doc = doctors_collection.find_one({'_id': ObjectId(actual_doctor_id)}) if not request.session.get('role') == 'doctor' else doctors_collection.find_one({'user_id': user_id})
                
                if patient_doc and doctor_doc:
                    consultation_fee = float(doctor_doc.get('consultation_fee', 500))
                    receipt_number = f"CRD-{get_next_id('receipts'):04d}"
                    
                    receipt_doc = {
                        'receipt_number': receipt_number,
                        'appointment_id': 'manual_discharge',
                        'patient_id': str(patient_doc['_id']),
                        'patient_name': patient_doc['patient_name'],
                        'doctor_id': str(doctor_doc['_id']),
                        'doctor_name': doctor_doc['doctor_name'],
                        'doctor_specialization': doctor_doc.get('specialization', 'Specialist'),
                        'hospital_name': doctor_doc.get('hospital_name', 'Swasthya Setu Hospital'),
                        'admission_date': datetime.now() - timedelta(days=1), # Mocking 1 day admission
                        'discharge_date': datetime.now(),
                        'consultation_charges': consultation_fee,
                        'total_amount': consultation_fee,
                        'payment_method': 'offline',
                        'payment_status': 'Completed',
                        'diagnosis': 'Clinical Discharge',
                        'treatment_notes': 'Manual discharge record uploaded.',
                        'record_link': str(record['record_id']),
                        'created_at': datetime.now()
                    }
                    clinical_receipts_collection.insert_one(receipt_doc)
            except Exception as ex:
                print(f"TELEMETRY: Automated receipt generation from discharge record failed: {ex}")

        if doctor_id:
            try:
                doctor = doctors_collection.find_one({'_id': ObjectId(doctor_id)})
                patient = patients_collection.find_one({'user_id': user_id})
                
                if doctor and patient:
                    track_doc = {
                        'track_id': get_next_id('report_tracks', prefix='tr'),
                        'patient_id': str(patient['_id']),
                        'patient_name': patient.get('patient_name'),
                        'doctor_id': str(doctor['_id']),
                        'doctor_name': doctor.get('doctor_name'),
                        'report_id': str(record['record_id']),
                        'file_name': record['file_name'],
                        'uploaded_at': record['uploaded_at'],
                        'status': 'Pending',
                        'viewed_at': None
                    }
                    report_tracks_collection.insert_one(track_doc)
            except:
                pass
        
        return Response({'message': 'File uploaded successfully', 'path': normalized_path})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def upload_hospital_image(request):
    # Admin check implied
    try:
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=400)
            
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"hospital_{timestamp}_{file_obj.name.replace(' ', '_')}"
        
        # Save to media/hospitals/
        relative_path = f"hospitals/{safe_filename}"
        file_path = default_storage.save(relative_path, ContentFile(file_obj.read()))
        
        normalized_path = file_path.replace('\\', '/')
        # Return the public URL path
        return Response({'message': 'Upload successful', 'path': f'/media/{normalized_path}'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_user_files(request):
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)

    doctor_id = request.query_params.get('doctor_id')
    
    if doctor_id:
        # Get patient profile to match tracks
        patient = patients_collection.find_one({'user_id': user_id})
        if not patient:
            return Response([])
            
        # Find reports specifically shared with this doctor
        tracks = list(report_tracks_collection.find({
            'patient_id': str(patient['_id']),
            'doctor_id': doctor_id
        }))
        
        shared_report_ids = [t['report_id'] for t in tracks if t.get('report_id')]
        
        # Only fetch reports that have a track record for this doctor
        reports = list(medical_records_collection.find({
            'user_id': user_id,
            'record_id': {'$in': shared_report_ids}
        }).sort('uploaded_at', -1))
    else:
        # Global view: all reports Belonging to the user
        reports = list(medical_records_collection.find({'user_id': user_id}).sort('uploaded_at', -1))
    
    return Response(serialize_mongo(reports))


@api_view(['GET'])
def get_patient_files(request):
    user_id = request.session.get('user_id') # The logged-in doctor's User ID
    role = request.session.get('role')
    patient_profile_id = request.query_params.get('patient_id') # Patient Profile ID from appointments

    if not user_id or role != 'doctor':
        return Response({'error': 'Unauthorized'}, status=401)
        
    if not patient_profile_id:
        return Response({'error': 'Patient ID required'}, status=400)

    # 1. Get Doctor Profile to find their Profile ID
    doctor = doctors_collection.find_one({'user_id': user_id})
    if not doctor:
        return Response({'error': 'Doctor profile not found'}, status=404)

    # 2. Verify clinical relationship using Profile IDs
    appointment = appointments_collection.find_one({
        'doctor_id': str(doctor['_id']),
        'patient_id': patient_profile_id,
        'status': {'$in': ['pending', 'accepted', 'completed']}
    })

    if not appointment:
        return Response({'error': 'Access denied: No valid clinical relationship detected.'}, status=403)

    # 3. Get Patient's User ID to fetch their records (indexed by User ID)
    patient = patients_collection.find_one({'_id': ObjectId(patient_profile_id)})
    if not patient:
         return Response({'error': 'Patient profile not found'}, status=404)
    
    patient_user_id = patient.get('user_id')
    if not patient_user_id:
        return Response({'error': 'Patient link broken'}, status=500)

    reports = list(medical_records_collection.find({'user_id': patient_user_id}).sort('uploaded_at', -1))
    
    # Update track status to Viewed
    try:
        report_ids = [str(r['record_id']) for r in reports]
        report_tracks_collection.update_many(
            {
                'doctor_id': str(doctor['_id']),
                'patient_id': patient_profile_id,
                'report_id': {'$in': report_ids},
                'status': 'Pending'
            },
            {
                '$set': {
                    'status': 'Viewed',
                    'viewed_at': datetime.now()
                }
            }
        )
    except:
        pass

    return Response(serialize_mongo(reports))

@api_view(['GET'])
def get_all_report_tracks(request):
    role = request.session.get('role')
    if role != 'admin':
        return Response({'error': 'Unauthorized'}, status=401)
        
    tracks = list(report_tracks_collection.find().sort('uploaded_at', -1))
    
    for t in tracks:
        p_id = t.get('patient_id')
        if p_id and len(str(p_id)) == 24:
            patient = patients_collection.find_one({'user_id': str(p_id)}) or patients_collection.find_one({'_id': ObjectId(str(p_id))})
            if patient and patient.get('patient_id'):
                t['patient_id'] = patient.get('patient_id')
                
        d_id = t.get('doctor_id')
        if d_id and len(str(d_id)) == 24:
            doctor = doctors_collection.find_one({'user_id': str(d_id)}) or doctors_collection.find_one({'_id': ObjectId(str(d_id))})
            if doctor and doctor.get('doctor_id'):
                t['doctor_id'] = doctor.get('doctor_id')
                
    return Response(serialize_mongo(tracks))


# ============================================================
# USER SETTINGS (Profile & Security)
# ============================================================

@api_view(['POST'])
def upload_profile_picture(request):
    try:
        user_id = request.session.get('user_id')
        role = request.session.get('role')
        if not user_id:
            return Response({'error': 'Unauthorized'}, status=401)
            
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=400)
            
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"avatar_{user_id}_{timestamp}_{file_obj.name.replace(' ', '_')}"
        
        # Save to media/avatars/
        relative_path = f"avatars/{safe_filename}"
        file_path = default_storage.save(relative_path, ContentFile(file_obj.read()))
        
        normalized_path = file_path.replace('\\', '/')
        avatar_url = f"/media/{normalized_path}"
        
        # Update collections
        users_collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'profile_picture': avatar_url}})
        
        if role == 'patient':
            patients_collection.update_one({'user_id': user_id}, {'$set': {'profile_picture': avatar_url}})
        elif role == 'doctor':
            doctors_collection.update_one({'user_id': user_id}, {'$set': {'profile_picture': avatar_url}})
            
        return Response({'message': 'Profile picture updated', 'path': avatar_url})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def update_profile(request):
    user_id = request.session.get('user_id')
    role = request.session.get('role')
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
    
    data = request.data
    update_data = {}
    
    # Allowed fields to update (Global + Role Specific)
    allowed_fields = [
        'first_name', 'last_name', 'phone_no', 'address', 
        'date_of_birth', 'blood_group', 'emergency_contact',
        'specialization', 'license_no', 'experience', 
        'clinic_address', 'consultation_fee', 'description', 'education', 'medical_system',
        'profile_picture', 'commission_percentage', 'max_patients_per_slot'
    ]
    
    # Dynamic type casting for integer fields
    int_fields = ['experience', 'consultation_fee', 'commission_percentage', 'max_patients_per_slot', 'age']
    
    for field in allowed_fields:
        if field in data:
            if field in int_fields:
                try:
                    update_data[field] = int(float(data[field]))
                except (ValueError, TypeError):
                    update_data[field] = 0
            else:
                update_data[field] = data[field]
            
    if not update_data:
        return Response({'message': 'No changes detected'})

    # Update User Collection
    users_collection.update_one({'_id': ObjectId(user_id)}, {'$set': update_data})
    
    # Synchronization: Handle display names if names updated
    full_name = None
    if 'first_name' in update_data or 'last_name' in update_data:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()

    # Update Role Specific Collection
    if role == 'patient':
        role_update = {**update_data}
        if full_name:
            role_update['patient_name'] = full_name
        patients_collection.update_one({'user_id': user_id}, {'$set': role_update})
    elif role == 'doctor':
        role_update = {**update_data}
        if full_name:
            role_update['doctor_name'] = full_name
        doctors_collection.update_one({'user_id': user_id}, {'$set': role_update})
        
        updated_doc_name = role_update.get('doctor_name', full_name or 'Unknown')
        notify_admins('profile_update', 'Doctor Profile Updated', f"Dr. {updated_doc_name} updated their profile.")
        
    return Response({'message': 'Profile updated successfully'})

@api_view(['POST'])
def change_password(request):
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
        
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    
    if not check_password(current_password, user['password']):
        return Response({'error': 'Incorrect current password'}, status=400)
        
    users_collection.update_one(
        {'_id': ObjectId(user_id)}, 
        {'$set': {'password': make_password(new_password)}}
    )
    
    return Response({'message': 'Password changed successfully'})

# ============================================================
# DOCTOR SCHEDULE
# ============================================================

@api_view(['GET'])
def get_doctor_schedule(request):
    user_id = request.session.get('user_id')
    role = request.session.get('role')
    
    if not user_id or role != 'doctor':
        return Response({'error': 'Unauthorized'}, status=401)
        
    doctor = doctors_collection.find_one({'user_id': user_id})
    if not doctor:
        return Response({'error': 'Doctor profile not found'}, status=404)
        
    # Return schedule or default empty dictionary if not set
    schedule = doctor.get('schedule', {})
    if not isinstance(schedule, dict):
        # Fallback if it's currently a list from previous buggy saves
        schedule = {}
        
    return Response(schedule)

@api_view(['POST'])
def update_doctor_schedule(request):
    user_id = request.session.get('user_id')
    role = request.session.get('role')
    
    if not user_id or role != 'doctor':
        return Response({'error': 'Unauthorized'}, status=401)
        
    payload = request.data
    schedule_data = payload.get('schedule') if isinstance(payload, dict) and 'schedule' in payload else payload
    
    # Validation: Ensure it's a dictionary of slot arrays
    if not isinstance(schedule_data, dict):
        return Response({'error': 'Schedule Error: The schedule format is incorrect.'}, status=400)
    
    # Optional deeper validation of slots if needed
    for key, day_config in schedule_data.items():
        # Handle both old (list) and new (dict) structures
        slots = day_config if isinstance(day_config, list) else day_config.get('slots', [])
        
        if not isinstance(slots, list):
             continue
             
        for slot in slots:
             if not all(k in slot for k in ('start', 'end')):
                  return Response({'error': f'Schedule Format Error in {key}: Time slots must have start and end times.'}, status=400)

    # Save to Doctor Collection
    update_ops = {'schedule': schedule_data}
    
    # If removed_date was provided, it means we might want to unset specific slots 
    # but currently we overwrite the whole schedule so we don't need special unset logic 
    # unless we want to be more efficient with partial updates.
    
    doctors_collection.update_one(
        {'user_id': user_id},
        {'$set': update_ops}
    )
    
    return Response({'message': 'Schedule updated successfully', 'debug_keys': list(schedule_data.keys())})

# ============================================================
# PAYMENTS (Mock Razorpay)
# ============================================================
import uuid

@api_view(['POST'])
def create_order(request):
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
        
    amount = request.data.get('amount', 500) # Default 500 INR
    
    # Create Mock Order ID
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    
    return Response({
        'id': order_id,
        'amount': amount * 100, # Razorpay expects paise
        'currency': 'INR',
        'key': 'rzp_test_placeholder' # Frontend will mock this
    })

@api_view(['POST'])
def verify_payment(request):
    appointment = None
    try:
        user_id = request.session.get('user_id')
        if not user_id:
            return Response({'error': 'Unauthorized'}, status=401)
        
        patient = patients_collection.find_one({'user_id': user_id})
        if not patient:
            return Response({'error': 'Patient profile not found'}, status=404)

        payment_data = request.data
        appointment_id = payment_data.get('appointment_id')
        
        if not appointment_id:
             return Response({'error': 'Missing appointment_id'}, status=400)

        # Check if payment for this appointment already exists (Idempotency)
        search_id = str(appointment_id).strip()
        match_criteria = [
            {'appointment_id': search_id},
            {'appointment_id': appointment_id}
        ]
        
        # Handle Integer ID format (Crucial for Sequential IDs)
        try:
            match_criteria.append({'appointment_id': int(search_id)})
        except (ValueError, TypeError):
             pass
             
        # Handle ObjectId format
        if ObjectId.is_valid(search_id):
             match_criteria.append({'appointment_id': ObjectId(search_id)})
             
        existing_payment = payments_collection.find_one({'$or': match_criteria})
        
        if existing_payment:
            # Still update the appointment status just in case it was missed
            try:
                appointments_collection.update_one(
                    {'_id': ObjectId(search_id) if ObjectId.is_valid(search_id) else search_id},
                    {'$set': {'status': 'confirmed'}}
                )
            except: pass
            return Response({'status': 'success', 'message': 'Payment already verified'}, status=200)

        if appointment_id:
            appointment = appointments_collection.find_one({'_id': ObjectId(search_id)})
            if not appointment:
                return Response({'error': 'Appointment not found'}, status=404)

        payment_id = get_next_id('payments', prefix='pay')
        payment_method = payment_data.get('payment_method', 'online')
        
        # Prepare structured payment record
        transaction_record = {
            'payment_id': payment_id,
            'transaction_number': f"TXN-{get_next_id('transactions', prefix='')}",
            'user_id': user_id,
            'patient_id': str(patient['_id']),
            'appointment_id': payment_data.get('appointment_id'),
            'doctor_id': str(appointment['doctor_id']) if appointment else None,
            'doctor_name': appointment['doctor_name'] if appointment else None,
            'amount': payment_data.get('amount'),
            'payment_method': payment_method,
            'razorpay_order_id': payment_data.get('razorpay_order_id'),
            'razorpay_payment_id': payment_data.get('razorpay_payment_id'),
            'payment_status': 'completed',
            'created_at': datetime.now()
        }
        
        payments_collection.insert_one(transaction_record)

        if appointment_id:
            # Generate unique Token ID (Queue Number) for this doctor and date
            # We count existing confirmed/completed appointments for this doctor on this day
            t_count = appointments_collection.count_documents({
                'doctor_id': str(appointment['doctor_id']),
                'appointment_date': appointment['appointment_date'],
                'status': {'$in': ['confirmed', 'completed', 'NOW SERVING', 'WAITING']}
            })
            token_num = t_count + 1
            token_val = f"TOKEN-{token_num:03d}"

            appointments_collection.update_one(
                {'_id': ObjectId(appointment_id)},
                {'$set': {
                    'status': 'confirmed',
                    'token_number': token_num,
                    'token_id': token_val
                }} # Finalized after payment
            )

            # Re-fetch appointment with token_number
            appointment = appointments_collection.find_one({'_id': ObjectId(appointment_id)})
            
            # Internal Notification for Token
            create_notification(
                user_id=user_id,
                notification_type='appointment',
                title='Token Generated',
                message=f"Your appointment is confirmed. Token Number: {token_val}"
            )

            # Email Notification for Token
            patient_user = users_collection.find_one({'_id': ObjectId(user_id)})
            if patient_user and patient_user.get('email'):
                notify_token_generated(appointment, token_val, patient_user['email'])

            # Internal Notifications — guard against appointment being None
            if appointment:
                create_notification(
                    user_id=user_id,
                    notification_type='payment',
                    title='Payment Successful',
                    message=f"Payment for appointment with Dr. {appointment.get('doctor_name', 'Unknown')} confirmed. Transaction: {transaction_record['transaction_number']}"
                )
                
                try:
                    doctor_profile = doctors_collection.find_one({'_id': ObjectId(appointment['doctor_id'])})
                    if doctor_profile:
                        create_notification(
                            user_id=doctor_profile['user_id'],
                            notification_type='payment',
                            title='Payment Received',
                            message=f"Payment received for appointment with {patient['patient_name']} on {appointment.get('appointment_date', 'N/A')}."
                        )
                except Exception as e:
                    print(f"Doctor notification failed: {e}")
                    
            notify_admins('payment_received', 'Payment Received', f"Payment of {payment_data.get('amount')} received for appointment {appointment_id}.")
            
            # Notify Patient and Doctor via Email
            try:
                doctor = doctors_collection.find_one({'_id': ObjectId(appointment['doctor_id'])})
                
                doctor_email = doctor.get('email')
                patient_user = users_collection.find_one({'_id': ObjectId(user_id)})
                patient_email = patient_user.get('email')

                if doctor_email and patient_email:
                    notify_payment_confirmation(
                        appointment, 
                        transaction_record['transaction_number'],
                        doctor_email, 
                        patient_email
                    )
            except Exception as e:
                print(f"Failed to send confirmation emails: {e}")
        
        return Response({'status': 'success', 'message': 'Payment verified and appointment confirmed'})
    except Exception as e:
        import traceback
        traceback.print_exc()
        with open('error_log.txt', 'a') as f:
            f.write(f"PaymentError: {str(e)}\n")
        return Response({'error': str(e)}, status=500)

@api_view(['GET', 'POST'])
def get_notifications(request):
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
        
    if request.method == 'GET':
        notifications = list(notifications_collection.find({'user_id': user_id}).sort('created_at', -1).limit(20))
        for n in notifications:
            n['_id'] = str(n['_id'])
            if 'created_at' in n:
                n['created_at'] = n['created_at'].isoformat()
                
        return Response(notifications)
    
    elif request.method == 'POST':
        data = request.data
        target_user_id = data.get('user_id')
        if not target_user_id:
            return Response({'error': 'Target user_id required'}, status=400)
            
        from .utils import create_notification
        create_notification(
            user_id=target_user_id,
            notification_type=data.get('notification_type', 'general'),
            title=data.get('title', 'New Notification'),
            message=data.get('message', '')
        )
        return Response({'message': 'Notification created'})

@api_view(['POST'])
def mark_notification_as_read(request, pk):
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
        
    notifications_collection.update_one(
        {'_id': ObjectId(pk), 'user_id': user_id},
        {'$set': {'is_read': True}}
    )
    return Response({'message': 'Notification marked as read'})

@api_view(['POST'])
def mark_all_notifications_as_read(request):
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
        
    notifications_collection.update_many(
        {'user_id': user_id, 'is_read': False},
        {'$set': {'is_read': True}}
    )
    return Response({'message': 'All notifications marked as read'})

# ============================================================
# INQUIRIES (Contact Form)
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def submit_inquiry(request):
    data = request.data
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    message = data.get('message')

    if not all([first_name, last_name, email, message]):
        return Response({'error': 'All fields are required'}, status=400)

    try:
        inquiry = {
            'inquiry_id': get_next_id('inquiries', prefix='inq'),
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'message': message,
            'created_at': datetime.now(),
            'status': 'new'
        }

        inquiries_collection.insert_one(inquiry)
        return Response({'message': 'Inquiry submitted successfully'}, status=201)
    except Exception as e:
        return Response({'error': f'Database submission failed: {str(e)}'}, status=500)

@api_view(['GET'])
def get_all_inquiries(request):
    # Admin check (implicit in production, add explicitly if needed)
    inquiries = list(inquiries_collection.find().sort('created_at', -1))
    return Response(serialize_mongo(inquiries))

@api_view(['DELETE'])
def delete_inquiry(request, pk):
    result = inquiries_collection.delete_one({'_id': ObjectId(pk)})
    if result.deleted_count == 0:
        return Response({'error': 'Inquiry not found'}, status=404)
    return Response({'message': 'Inquiry deleted successfully'})
 
 
@api_view(['POST'])
def submit_review(request):
    user_id = request.session.get('user_id')
    role = request.session.get('role')

    if not user_id or role != 'patient':
        return Response({'error': 'Unauthorized'}, status=401)

    data = request.data
    doctor_id = data.get('doctor_id')
    appointment_id = data.get('appointment_id')
    hospital_id = data.get('hospital_id')
    rating = data.get('rating')
    hospital_rating = data.get('hospital_rating')
    comment = data.get('comment', '')

    if not all([doctor_id, rating]):
        return Response({'error': 'Doctor ID and Doctor Rating are required'}, status=400)

    patient = patients_collection.find_one({'user_id': user_id})
    if not patient:
        return Response({'error': 'Patient profile not found'}, status=404)

    review = {
        'review_id': get_next_id('reviews', prefix='rev'),
        'appointment_id': appointment_id,
        'patient_id': str(patient['_id']),
        'patient_name': patient['patient_name'],
        'doctor_id': doctor_id,
        'hospital_id': hospital_id,
        'rating': int(rating),
        'hospital_rating': int(hospital_rating) if hospital_rating else None,
        'comment': comment,
        'created_at': datetime.now()
    }

    reviews_collection.insert_one(review)
    
    # Also update appointment status if appointment_id provided
    if appointment_id:
        try:
            appointments_collection.update_one(
                {'_id': ObjectId(appointment_id)},
                {'$set': {'is_reviewed': True}}
            )
        except:
            pass

    return Response({'message': 'Review submitted successfully', 'id': str(review['review_id'])}, status=201)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_doctor_reviews(request, doctor_id):
    reviews = list(reviews_collection.find({'doctor_id': doctor_id}).sort('created_at', -1))
    return Response(serialize_mongo(reviews))

@api_view(['GET'])
def get_all_reviews(request):
    role = request.session.get('role')
    if role != 'admin':
        return Response({'error': 'Unauthorized'}, status=401)
        
    reviews = list(reviews_collection.find().sort('created_at', -1))
    for r in reviews:
        if r.get('doctor_id'):
            doc = doctors_collection.find_one({'_id': ObjectId(r['doctor_id'])})
            if doc:
                r['doctor_name'] = doc.get('doctor_name')
        if r.get('hospital_id'):
            hosp = hospitals_collection.find_one({'_id': ObjectId(r['hospital_id'])})
            if hosp:
                r['hospital_name'] = hosp.get('name')
                
    return Response(serialize_mongo(reviews))

@api_view(['GET'])
def get_clinical_receipts(request):
    """Fetch clinical receipts for the logged-in patient"""
    user_id = request.session.get('user_id')
    role = request.session.get('role')
    
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
        
    if role == 'patient':
        patient = patients_collection.find_one({'user_id': user_id})
        if not patient:
            return Response([])
        
        receipts = list(clinical_receipts_collection.find({'patient_id': str(patient['_id'])}).sort('created_at', -1))
        
        # Also find any medical records tagged as 'Discharge Summary' that might not be in receipts
        # To avoid duplicates, we can check if a receipt refers to that record or just show all unique ones
        discharge_records = list(medical_records_collection.find({
            'user_id': user_id,
            'description': 'Discharge Summary'
        }))
        
        # Convert medical records to a receipt-like format for display
        for record in discharge_records:
            # Check if this record is already represented in receipts
            is_duplicate = any(r.get('record_link') == str(record['record_id']) for r in receipts)
            if not is_duplicate:
                # Add a virtual receipt entry
                receipts.append({
                    '_id': record['_id'],
                    'receipt_number': f"DIS-{record['record_id']}",
                    'doctor_name': 'Medical Staff',
                    'doctor_specialization': 'Clinical Department',
                    'hospital_name': 'Swasthya Setu Hospital',
                    'discharge_date': record['uploaded_at'],
                    'total_amount': 0.0,
                    'is_virtual_record': True,
                    'file_path': record['file_path'],
                    'diagnosis': 'Clinical Discharge Summary'
                })
        
        receipts.sort(key=lambda x: x.get('created_at', x.get('discharge_date', datetime.now())), reverse=True)
        return Response(serialize_mongo(receipts))
    
    elif role == 'doctor':
        doctor = doctors_collection.find_one({'user_id': user_id})
        if not doctor:
            return Response([])
            
        receipts = list(clinical_receipts_collection.find({'doctor_id': str(doctor['_id'])}).sort('created_at', -1))
        return Response(serialize_mongo(receipts))
        
    return Response([])

@api_view(['GET'])
def export_clinical_receipt_pdf(request, receipt_id):
    """Generates a detailed Clinical Receipt PDF"""
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)

    try:
        receipt = clinical_receipts_collection.find_one({'_id': ObjectId(receipt_id)})
        if not receipt:
            return Response({'error': 'Receipt not found'}, status=404)

        # Permission check: must be the patient or the doctor involved
        patient = patients_collection.find_one({'user_id': user_id})
        doctor = doctors_collection.find_one({'user_id': user_id})
        
        is_authorized = False
        if patient and str(patient['_id']) == receipt['patient_id']:
            is_authorized = True
        elif doctor and str(doctor['_id']) == receipt['doctor_id']:
            is_authorized = True
        elif request.session.get('role') == 'admin':
            is_authorized = True
        
        if not is_authorized:
            return Response({'error': 'Access denied to this clinical node'}, status=403)

        # Prepare data for PDF
        admission_dt = receipt.get('admission_date')
        discharge_dt = receipt.get('discharge_date')
        generation_dt = receipt.get('created_at', datetime.now())
        
        # Robust date parsing
        def parse_dt(dt_val):
            if isinstance(dt_val, datetime): return dt_val
            if isinstance(dt_val, str):
                try: return datetime.fromisoformat(dt_val)
                except: return datetime.now()
            return datetime.now()

        admission_dt = parse_dt(admission_dt)
        discharge_dt = parse_dt(discharge_dt)
        generation_dt = parse_dt(generation_dt)

        html_content = f"""
        <html>
        <head>
            <style>
                @page {{ size: a4 portrait; margin: 1cm; }}
                body {{ font-family: 'Helvetica', sans-serif; color: #1a202c; line-height: 1.6; }}
                .receipt-header {{ text-align: center; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }}
                .hospital-name {{ font-size: 28px; font-weight: 900; color: #6366f1; text-transform: uppercase; }}
                .hospital-info {{ font-size: 10px; color: #718096; }}
                .receipt-title {{ font-size: 18px; font-weight: 700; margin-top: 10px; color: #2d3748; background: #f7fafc; display: inline-block; padding: 5px 20px; border-radius: 50px; }}
                
                .info-section {{ display: table; width: 100%; margin-bottom: 20px; }}
                .info-column {{ display: table-cell; width: 50%; vertical-align: top; }}
                .info-label {{ font-size: 10px; font-weight: 800; color: #a0aec0; text-transform: uppercase; margin-bottom: 2px; }}
                .info-value {{ font-size: 13px; font-weight: 600; color: #2d3748; margin-bottom: 10px; }}
                
                .charges-table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                .charges-table th {{ background: #f8fafc; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; color: #4a5568; border-bottom: 2px solid #e2e8f0; }}
                .charges-table td {{ padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 12px; }}
                .total-row {{ background: #f8fafc; font-weight: 900; font-size: 16px; color: #6366f1; }}
                
                .receipt-footer {{ margin-top: 50px; text-align: center; font-size: 10px; color: #a0aec0; border-top: 1px dashed #e2e8f0; padding-top: 20px; }}
                .stamp {{ border: 2px solid #10b981; color: #10b981; font-weight: 900; text-transform: uppercase; padding: 5px 10px; display: inline-block; transform: rotate(-5deg); border-radius: 4px; }}
                
                .clinical-section {{ margin-top: 25px; border-top: 1px solid #edf2f7; padding-top: 15px; }}
                .clinical-title {{ font-size: 14px; font-weight: 800; color: #4a5568; text-transform: uppercase; margin-bottom: 8px; }}
                .clinical-box {{ background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 11px; color: #2d3748; white-space: pre-wrap; }}
            </style>
        </head>
        <body>
            <div class="receipt-header">
                <div class="hospital-name">{receipt.get('hospital_name', 'Swasthya Setu Hospital')}</div>
                <div class="hospital-info">
                    Sector 12, Health City, Digital India | Contact: +91 98765 43210 | Email: care@swasthyasetu.com
                </div>
                <div class="receipt-title">CLINICAL RECEIPT</div>
            </div>

            <div class="info-section">
                <div class="info-column">
                    <div class="info-label">Patient Details</div>
                    <div class="info-value">{receipt.get('patient_name')}</div>
                    <div class="info-label">Patient ID</div>
                    <div class="info-value">SS-PAT-{str(receipt.get('patient_id'))[-6:]}</div>
                    <div class="info-label">Diagnosis/Reason</div>
                    <div class="info-value">{receipt.get('diagnosis', 'Standard Consultation')}</div>
                </div>
                <div class="info-column">
                    <div class="info-label">Doctor Details</div>
                    <div class="info-value">Dr. {receipt.get('doctor_name')}</div>
                    <div class="info-label">Specialization</div>
                    <div class="info-value">{receipt.get('doctor_specialization', 'Specialist')}</div>
                    <div class="info-label">Receipt Number</div>
                    <div class="info-value">{receipt.get('receipt_number')}</div>
                </div>
            </div>

            <div class="info-section" style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                <div class="info-column">
                    <div class="info-label">Appointment Scheduled</div>
                    <div class="info-value">{receipt.get('appointment_date')} at {receipt.get('appointment_time')}</div>
                    <div class="info-label">Admission Time</div>
                    <div class="info-value">{admission_dt.strftime('%d %b %Y, %I:%M %p')}</div>
                </div>
                <div class="info-column">
                    <div class="info-label">Discharge Time</div>
                    <div class="info-value">{discharge_dt.strftime('%d %b %Y, %I:%M %p')}</div>
                </div>
            </div>

            <table class="charges-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: right;">Amount (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Professional Consultation Charges (Dr. {receipt.get('doctor_name')})</td>
                        <td style="text-align: right;">{float(receipt.get('consultation_charges', 0)):.2f}</td>
                    </tr>
                    <tr class="total-row">
                        <td>TOTAL PAYABLE AMOUNT</td>
                        <td style="text-align: right;">INR {float(receipt.get('total_amount', 0)):.2f}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 30px;">
                <div class="info-label">Payment Information</div>
                <div class="info-value">Status: <span style="color: #10b981;">{receipt.get('payment_status', 'Completed')}</span></div>
                <div class="info-value">Method: {str(receipt.get('payment_method', 'online')).upper()}</div>
            </div>

            <div class="clinical-section">
                <div class="clinical-title">Discharge Summary / Treatment Notes</div>
                <div class="clinical-box">{receipt.get('treatment_notes') if receipt.get('treatment_notes') else 'Patient was examined clinically. All parameters stable at the time of discharge. Advised rest and adherence to prescribed regimen.'}</div>
            </div>

            <div class="clinical-section">
                <div class="clinical-title">Prescription / Medication Advised</div>
                <div class="clinical-box">{receipt.get('prescription') if receipt.get('prescription') else 'No specific medication recorded for this encounter.'}</div>
            </div>

            <div style="text-align: right; margin-top: 20px;">
                <div class="stamp">Electronically Verified</div>
            </div>

            <div class="receipt-footer">
                Generated on {generation_dt.strftime('%d %b %Y at %I:%M %p')} | This is a computer-generated document and does not require a physical signature.
                <br/>Swasthya Setu - Bridging clinical Excellence with Digital Intelligence
            </div>
        </body>
        </html>
        """
        
        result = io.BytesIO()
        pisa.CreatePDF(io.BytesIO(html_content.encode("UTF-8")), dest=result)
        
        response = HttpResponse(result.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Receipt_{receipt.get("receipt_number")}.pdf"'
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def check_session(request):
    """Secure telemetry to verify session state and identity tokens."""
    return Response({
        'user_id': request.session.get('user_id'),
        'role': request.session.get('role'),
        'session_id': request.session.session_key
    })

@api_view(['GET'])
def get_patient_ledger(request):
    """Retrieve the unified financial ledger for the authenticated patient profile."""
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Unauthorized access to fiscal nexus.'}, status=401)

    patient = patients_collection.find_one({'user_id': user_id})
    if not patient:
        return Response({
            'error': 'Patient profile not detected in clinical registry.',
            'debug_user_id': user_id,
            'nexus_code': 'NP-404'
        }, status=404)

    payment_type = request.query_params.get('payment_type', '').lower()
    doctor_name = request.query_params.get('doctor_name', '').lower()

    query = {'patient_id': str(patient['_id'])}
    if payment_type and payment_type != 'all':
        query['payment_method'] = payment_type
    if doctor_name:
        query['doctor_name'] = {'$regex': doctor_name, '$options': 'i'}

    # Use clinical receipts as the ultimate source of truth for finalized engagements
    receipts = list(clinical_receipts_collection.find(query).sort('created_at', -1))
    
    ledger_data = []
    for doc in receipts:
        amount = float(doc.get('total_amount', doc.get('consultation_charges', 500)))
        subtotal = round(amount / 1.18, 2)
        tax = round(amount - subtotal, 2)
        
        # Safely parse date
        dt = doc.get('created_at', datetime.now())
        if isinstance(dt, str):
            try: dt = datetime.strptime(dt, '%Y-%m-%d %H:%M:%S')
            except: dt = datetime.now()
            
        ledger_data.append({
            'transaction_id': doc.get('receipt_number', 'N/A'),
            'date': dt.strftime('%Y-%m-%d %H:%M'),
            'doctor_name': doc.get('doctor_name'),
            'doctor_specialty': doc.get('doctor_specialization', 'Specialist'),
            'method': doc.get('payment_method', 'online').upper(),
            'subtotal': subtotal,
            'tax': tax,
            'total': amount,
            'status': doc.get('payment_status', 'completed').upper()
        })

    department_totals = {}
    for item in ledger_data:
        dept = item.get('doctor_specialty')
        if not dept or dept.lower() == 'specialist':
            dept = 'General Care'
        department_totals[dept] = department_totals.get(dept, 0) + item.get('total', 0)
        
    top_department = None
    if department_totals:
        top_dept_name = max(department_totals, key=department_totals.get)
        top_department = {
            'name': top_dept_name,
            'amount': department_totals[top_dept_name]
        }

    return Response({
        'patient_name': patient.get('patient_name'),
        'patient_id': f"SS-{str(patient['_id'])[-6:]}",
        'ledger': ledger_data,
        'top_department': top_department
    })


@api_view(['GET'])
def export_ledger_pdf(request):
    """Generates a high-fidelity PDF document of the patient's financial ledger or a single transaction."""
    user_id = request.session.get('user_id')
    txn_id = request.query_params.get('txn_id')
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)

    patient = patients_collection.find_one({'user_id': user_id})
    if not patient:
        return Response({
            'error': 'Patient profile not detected in clinical registry.',
            'debug_user_id': user_id,
            'nexus_code': 'NP-404'
        }, status=404)
    
    search_query = {
        'patient_id': str(patient['_id'])
    }
    
    payment_type = request.query_params.get('payment_type', '').lower()
    doctor_name = request.query_params.get('doctor_name', '').lower()
    if payment_type and payment_type != 'all':
        search_query['payment_method'] = payment_type
    if doctor_name:
        search_query['doctor_name'] = {'$regex': doctor_name, '$options': 'i'}
    
    if txn_id and txn_id != 'null' and not txn_id.startswith('[object'):
        search_query['receipt_number'] = txn_id
        doc_title = "Clinical Receipt"
    else:
        doc_title = "Official Financial Statement"
        
    receipts = list(clinical_receipts_collection.find(search_query).sort('created_at', -1))
    
    print(len(receipts))
    
    ledger_items = []
    total_paid = 0
    for p in receipts:
        # Resolve numeric safety
        try:
            amount = float(p.get('total_amount', p.get('consultation_charges', 500)))
        except (TypeError, ValueError):
            amount = 500.0
            
        subtotal = round(amount / 1.18, 2)
        tax = round(amount - subtotal, 2)
        total_paid += amount
        
        # Resolve Date Safety
        dt = p.get('created_at')
        if isinstance(dt, str):
            try:
                dt = datetime.strptime(dt, '%Y-%m-%d %H:%M:%S')
            except:
                dt = datetime.now()
        elif not dt:
            dt = datetime.now()

        ledger_items.append({
            'date': dt.strftime('%d %b %Y'),
            'txn': p.get('receipt_number', 'N/A'),
            'doctor': p.get('doctor_name', 'Clinical Specialist'),
            'method': str(p.get('payment_method', 'cash')).upper(),
            'subtotal': f"INR {subtotal:,.2f}",
            'tax': f"INR {tax:,.2f}",
            'total': f"INR {amount:,.2f}"
        })

    # High-Fidelity Row Construction
    rows_html = ""
    for i in ledger_items:
        rows_html += f"""
        <tr>
            <td>{i['date']}</td>
            <td><span style="font-family:courier; font-size:7px;">{i['txn']}</span></td>
            <td>{i['doctor']}</td>
            <td>{i['method']}</td>
            <td>{i['subtotal']}</td>
            <td>{i['tax']}</td>
            <td>{i['total']}</td>
        </tr>
        """

    html_content = f"""
    <html>
    <head>
        <style>
            @page {{ size: a4 portrait; margin: 1.5cm; }}
            body {{ font-family: 'Helvetica', sans-serif; color: #1a202c; }}
            .header {{ 
                border-bottom: 2px solid #6366f1; 
                padding-bottom: 15px; 
                margin-bottom: 25px; 
            }}
            .brand {{ font-size: 20px; font-weight: 800; color: #6366f1; }}
            .title {{ font-size: 10px; text-transform: uppercase; color: #718096; letter-spacing: 1px; }}
            .patient-box {{ 
                background: #f7fafc; 
                padding: 12px; 
                border-radius: 6px; 
                margin-bottom: 25px; 
                border: 1px solid #edf2f7;
            }}
            table {{ width: 100%; border-collapse: collapse; table-layout: fixed; }}
            th {{ background: #f8fafc; padding: 8px; font-size: 8px; text-align: left; color: #4a5568; border-bottom: 1px solid #e2e8f0; }}
            td {{ padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 7.5px; vertical-align: middle; word-wrap: break-word; }}
            .footer {{ position: fixed; bottom: 0; text-align: center; font-size: 7px; color: #a0aec0; width: 100%; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">{doc_title}</div>
            <div class="brand">Swasthya Setu clinical nexus</div>
        </div>
        
        <div class="patient-box">
            <table style="border:none; width:100%;">
                <tr>
                    <td style="border:none; font-weight:800; width:15%;">Patient:</td>
                    <td style="border:none; width:35%;">{patient.get('patient_name', 'Verified Patient')}</td>
                    <td style="border:none; font-weight:800; width:20%;">Statement Date:</td>
                    <td style="border:none; width:30%;">{datetime.now().strftime('%d %b %Y')}</td>
                </tr>
                <tr>
                    <td style="border:none; font-weight:800;">Identity:</td>
                    <td style="border:none;">SS-{str(patient['_id'])[-6:]}</td>
                    <td style="border:none; font-weight:800;">Total Capital:</td>
                    <td style="border:none; font-weight:800; color:#6366f1;">INR {total_paid:,.2f}</td>
                </tr>
            </table>
        </div>

        <table>
            <thead>
                <tr>
                    <th width="10%">DATE</th>
                    <th width="30%">TRANSACTION ID</th>
                    <th width="20%">DOCTOR</th>
                    <th width="10%">METHOD</th>
                    <th width="10%">SUBTOTAL</th>
                    <th width="10%">GST (18%)</th>
                    <th width="10%">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {rows_html}
            </tbody>
        </table>

        <div class="footer">
            This artifact is computer-generated and synchronized from the Swasthya Setu clinical registry. Protocol: {'SINGLE_RECEIPT' if txn_id else 'FULL_LEDGER'}
        </div>
    </body>
    </html>
    """
    
    result = io.BytesIO()
    pisa.pisaDocument(io.BytesIO(html_content.encode("UTF-8")), result)
    
    filename = f"Receipt_{txn_id}.pdf" if txn_id else f"Ledger_{patient['patient_name']}.pdf"
    response = HttpResponse(result.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response

@api_view(['GET'])
def get_doctor_earnings(request):
    """
    Retrieve comprehensive revenue analytics and financial artifacts for the practitioner profile.
    """
    user_id = request.session.get('user_id')
    role = request.session.get('role')

    if not user_id or role != 'doctor':
        return Response({'error': 'Unauthorized access to fiscal registry.'}, status=401)

    doctor = doctors_collection.find_one({'user_id': user_id})
    if not doctor:
        return Response({'error': 'Doctor profile not detected in clinical registry.'}, status=404)

    # Resolve all financial engagement artifacts
    doctor_id_str = str(doctor['_id'])
    
    patient_filter = request.query_params.get('patient')
    if patient_filter:
        patient_filter = patient_filter.lower()
        
    receipts_raw = list(clinical_receipts_collection.find({'doctor_id': doctor_id_str}).sort('created_at', -1))
    
    payments = []
    all_patients_set = set()
    
    for r in receipts_raw:
        patient_name = r.get('patient_name', 'Verified Patient')
        all_patients_set.add(patient_name)
        
        if patient_filter and patient_filter not in patient_name.lower():
            continue
            
        r['computed_patient_name'] = patient_name
        r['amount'] = float(r.get('total_amount') or r.get('consultation_charges') or 500)
        r['payment_status'] = r.get('payment_status', 'completed').lower()
        r['payment_method'] = r.get('payment_method', 'cash').lower()
        r['transaction_number'] = r.get('receipt_number', 'N/A')
        if not r.get('created_at'):
            r['created_at'] = datetime.now()
            
        payments.append(r)
        
    total_revenue = sum(float(p.get('amount') or 500) for p in payments if p.get('payment_status') == 'completed')
    pending_settlements = sum(float(p.get('amount') or 500) for p in payments if p.get('payment_status') == 'pending')
    
    # 2. Advanced Treasury Breakdown
    from collections import defaultdict
    daily_map = defaultdict(float)
    monthly_map = defaultdict(float)
    yearly_map = defaultdict(float)
    patient_map = defaultdict(float)
    
    current_day_key = datetime.now().strftime('%Y-%m-%d')
    current_month_key = datetime.now().strftime('%Y-%m')
    current_year_key = datetime.now().strftime('%Y')
    
    for p in payments:
        if p.get('payment_status') == 'completed':
            try:
                dt = p.get('created_at')
                if isinstance(dt, str):
                    dt = datetime.strptime(dt, '%Y-%m-%d %H:%M:%S')
                day_key = dt.strftime('%Y-%m-%d')
                month_key = dt.strftime('%Y-%m')
                year_key = dt.strftime('%Y')
                amount = float(p.get('amount') or 500)
                
                daily_map[day_key] += amount
                monthly_map[month_key] += amount
                yearly_map[year_key] += amount
                
                patient_name = p.get('computed_patient_name', 'Verified Patient')
                patient_map[patient_name] += amount
                
            except:
                continue
                
    # Sort and format for time-series artifacts
    daily_series = [{'period': k, 'amount': v} for k, v in sorted(daily_map.items(), reverse=True)[:14]] # Last 14 days
    monthly_series = [{'period': k, 'amount': v} for k, v in sorted(monthly_map.items(), reverse=True)[:12]] # Last 12 months
    yearly_series = [{'period': k, 'amount': v} for k, v in sorted(yearly_map.items(), reverse=True)[:5]] # Last 5 years
    
    patient_series = [{'name': k, 'amount': v} for k, v in sorted(patient_map.items(), key=lambda x: x[1], reverse=True)[:10]] # Top 10 patients
        
    # 3. Micro-transaction Ledger
    detailed_ledger = []
    for p in payments[:50]: # Last 50 interactions for detailed view
        detailed_ledger.append({
            'txn_id': p.get('transaction_number', 'N/A'),
            'date': p.get('created_at').strftime('%Y-%m-%d %H:%M') if isinstance(p.get('created_at'), datetime) else str(p.get('created_at')),
            'patient': p.get('computed_patient_name', 'Verified Patient'),
            'amount': float(p.get('amount') or 500),
            'method': p.get('payment_method', 'online').upper(),
            'status': p.get('payment_status', 'completed').upper()
        })

    return Response({
        'practitioner': doctor.get('doctor_name'),
        'all_patients': sorted(list(all_patients_set)),
        'metrics': {
            'total_lifetime_revenue': total_revenue,
            'current_day_revenue': daily_map.get(current_day_key, 0.0),
            'current_month_revenue': monthly_map.get(current_month_key, 0.0),
            'current_year_revenue': yearly_map.get(current_year_key, 0.0),
            'pending_audit_capital': pending_settlements,
            'average_consultation_value': total_revenue / len(payments) if payments else 0,
            'total_engagements': len(payments)
        },
        'time_series_daily': daily_series[::-1],
        'time_series_monthly': monthly_series[::-1],
        'time_series_yearly': yearly_series[::-1],
        'patient_revenue': patient_series,
        'financial_ledger': detailed_ledger
    })


@api_view(['GET'])
def export_doctor_earnings_pdf(request):
    """Generates a high-fidelity PDF document of the doctor's financial ledger."""
    user_id = request.session.get('user_id')
    role = request.session.get('role')

    if not user_id or role != 'doctor':
        return Response({'error': 'Unauthorized'}, status=401)

    doctor = doctors_collection.find_one({'user_id': user_id})
    if not doctor:
        return Response({'error': 'Doctor profile not detected.'}, status=404)
        
    doctor_id_str = str(doctor['_id'])
    patient_filter = request.query_params.get('patient')
    if patient_filter:
        patient_filter = patient_filter.lower()
        
    receipts_raw = list(clinical_receipts_collection.find({'doctor_id': doctor_id_str}).sort('created_at', -1))
    
    ledger_items = []
    total_paid = 0
    
    for p in receipts_raw:
        if p.get('payment_status', 'completed').lower() != 'completed':
            continue
            
        patient_name = p.get('patient_name', 'Verified Patient')
        
        if patient_filter and patient_filter not in patient_name.lower():
            continue
            
        p['amount'] = float(p.get('total_amount') or p.get('consultation_charges') or 500)
        p['transaction_number'] = p.get('receipt_number', 'N/A')

        try:
            amount = float(p.get('amount', 500))
        except (TypeError, ValueError):
            amount = 500.0
            
        subtotal = round(amount / 1.18, 2)
        tax = round(amount - subtotal, 2)
        total_paid += amount
        
        dt = p.get('created_at')
        if isinstance(dt, str):
            try:
                dt = datetime.strptime(dt, '%Y-%m-%d %H:%M:%S')
            except:
                dt = datetime.now()
        elif not dt:
            dt = datetime.now()

        ledger_items.append({
            'date': dt.strftime('%d %b %Y'),
            'txn': p.get('transaction_number', 'N/A'),
            'patient_name': patient_name,
            'method': p.get('payment_method', 'ONLINE').upper(),
            'subtotal': subtotal,
            'tax': tax,
            'total': amount
        })

    # High-Fidelity Row Construction
    rows_html = ""
    for i in ledger_items:
        rows_html += f"""
        <tr>
            <td>{i['date']}</td>
            <td><span style="font-family:courier; font-size:7px;">{i['txn']}</span></td>
            <td>{i['patient_name']}</td>
            <td>{i['method']}</td>
            <td>INR {i['subtotal']:.2f}</td>
            <td>INR {i['tax']:.2f}</td>
            <td>INR {i['total']:.2f}</td>
        </tr>
        """

    doc_title = "Treasury Audit Report"
    filter_label = f"Patient Filter: {patient_filter.title()}" if patient_filter else "All Verified Patients"

    html_content = f"""
    <html>
    <head>
        <style>
            @page {{ size: a4 portrait; margin: 1.5cm; }}
            body {{ font-family: 'Helvetica', sans-serif; color: #1a202c; }}
            .header {{ 
                border-bottom: 2px solid #10b981; 
                padding-bottom: 15px; 
                margin-bottom: 25px; 
            }}
            .brand {{ font-size: 20px; font-weight: 800; color: #10b981; }}
            .title {{ font-size: 10px; text-transform: uppercase; color: #718096; letter-spacing: 1px; }}
            .doctor-box {{ 
                background: #f7fafc; 
                padding: 12px; 
                border-radius: 6px; 
                margin-bottom: 25px; 
                border: 1px solid #edf2f7;
            }}
            table {{ width: 100%; border-collapse: collapse; }}
            th {{ background: #f8fafc; padding: 8px; font-size: 8px; text-align: left; color: #4a5568; border-bottom: 1px solid #e2e8f0; }}
            td {{ padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 7.5px; vertical-align: middle; word-wrap: break-word; }}
            .footer {{ position: fixed; bottom: 0; text-align: center; font-size: 7px; color: #a0aec0; width: 100%; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">{doc_title}</div>
            <div class="brand">Swasthya Setu clinical nexus</div>
        </div>
        
        <div class="doctor-box">
            <table style="border:none; width:100%;">
                <tr>
                    <td style="border:none; font-weight:800; width:20%;">Practitioner:</td>
                    <td style="border:none; width:30%;">{doctor.get('doctor_name')}</td>
                    <td style="border:none; font-weight:800; width:20%;">Statement Date:</td>
                    <td style="border:none; width:30%;">{datetime.now().strftime('%d %b %Y')}</td>
                </tr>
                <tr>
                    <td style="border:none; font-weight:800;">Specialization:</td>
                    <td style="border:none;">{doctor.get('specialization', 'Specialist')}</td>
                    <td style="border:none; font-weight:800;">Scope:</td>
                    <td style="border:none; color: #10b981;">{filter_label}</td>
                </tr>
            </table>
        </div>

        <div style="margin-bottom:20px;">
            <div style="font-size:14px; font-weight:800; color:#2d3748; margin-bottom:10px;">Aggregated Capital Generation</div>
            <table style="border:none; width:100%; background:#f8fafc; border:1px solid #e2e8f0;">
                <tr>
                    <td style="font-size:10px; font-weight:800; text-align:center; padding:15px; border-right:1px solid #e2e8f0;">
                        VERIFIED ENGAGEMENTS<br>
                        <span style="font-size:14px; color:#10b981;">{len(ledger_items)}</span>
                    </td>
                    <td style="font-size:10px; font-weight:800; text-align:center; padding:15px;">
                        TOTAL TREASURY<br>
                        <span style="font-size:14px; color:#10b981;">INR {total_paid:,.2f}</span>
                    </td>
                </tr>
            </table>
        </div>

        <table>
            <thead>
                <tr>
                    <th width="12%">DATE</th>
                    <th width="32%">ARTIFACT ID</th>
                    <th width="18%">PATIENT</th>
                    <th width="12%">METHOD</th>
                    <th width="8%">SUBTOTAL</th>
                    <th width="8%">TAX(18%)</th>
                    <th width="10%">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {rows_html if rows_html else '<tr><td colspan="7" style="text-align:center; padding:20px;">No Verified Transactions Found.</td></tr>'}
            </tbody>
        </table>

        <div class="footer">
            Generated via Swasthya Setu Treasury Nexus. This is an auto-generated clinical transcript and requires no physical signature.<br>
            Temporal Hash: {int(datetime.now().timestamp() * 1000)} | Authority: Dr. {doctor.get('doctor_name')}
        </div>
    </body>
    </html>
    """

    pdf_file = io.BytesIO()
    pisa_status = pisa.CreatePDF(io.StringIO(html_content), dest=pdf_file)

    if pisa_status.err:
        return Response({'error': 'Failed to synthesize semantic PDF.'}, status=500)

    pdf_file.seek(0)
    response = HttpResponse(pdf_file, content_type='application/pdf')
    filename = f"Treasury_Audit_{datetime.now().strftime('%Y%m%d')}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response



@api_view(['POST'])
def save_symptom_check(request):
    """
    Log AI Symptom Checker results to the database.
    """
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Not authenticated'}, status=401)

    data = request.data
    patient = patients_collection.find_one({'user_id': user_id})

    if not patient:
        return Response({'error': 'Patient not found'}, status=404)

    try:
        check_doc = {
            'check_id': get_next_id('symptom_checks', prefix='sc'),
            'patient_pk': str(patient['_id']),
            'patient_display_id': patient.get('patient_id'),
            'patient_name': patient.get('patient_name'),
            'symptoms': data.get('symptoms', ''),
            'ai_response': data.get('ai_response', ''),
            'prediction': data.get('prediction', ''),
            'specialist_suggested': data.get('specialist_suggested', ''),
            'confidence_score': data.get('confidence_score', 0),
            'created_at': datetime.now()
        }

        result = symptom_checks_collection.insert_one(check_doc)
        return Response({'message': 'Symptom check saved', 'id': str(result.inserted_id)}, status=201)

    except Exception as e:
        return Response({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_specializations(request):
    """Retrieve all unique specializations from approved doctors."""
    try:
        # Use specialization field from approved doctors
        specs = doctors_collection.distinct('specialization', {'status': 'approved'})
        # Filter out empty or null specs
        specs = sorted([s for s in specs if s and s.strip()])
        return Response({'specializations': specs})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['DELETE'])
def delete_account(request):
    """Securely purge the current user session and all associated identity records from the Swasthya Setu ecosystem."""
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Unauthorized access'}, status=401)
    
    try:
        # 1. Fetch user to determine role
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return Response({'error': 'User not found'}, status=404)
        
        role = user.get('role')
        display_id = user.get('user_id')

        # 2. Cleanup role-specific collections
        if role == 'patient':
            patients_collection.delete_one({'user_id': user_id})
        elif role == 'doctor':
            doctors_collection.delete_one({'user_id': user_id})

        # 3. Purge main authentication record
        users_collection.delete_one({'_id': ObjectId(user_id)})
        
        # 4. Invalidate session
        request.session.flush()
        
        return Response({'message': 'Your account has been permanently removed from the system.'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# pyre-ignore-all
# ================= BACKEND FILE =================
# File: db.py
# Purpose: Direct MongoDB connection and collection references
# Handles: Low-level database access via PyMongo

from pymongo import MongoClient

try:
    # Using 127.0.0.1 for better compatibility on Windows/macOS and adding timeout
    client = MongoClient('mongodb://127.0.0.1:27017/', serverSelectionTimeoutMS=5000)
    # Ping the server to verify connection
    client.admin.command('ping')
except Exception as e:
    print(f"CRITICAL ERROR: Could not connect to MongoDB: {e}")
    # Fallback/Dummy client for static analysis consistency if needed
    client = MongoClient('mongodb://127.0.0.1:27017/', connect=False)

db = client['swasthya_setu']

# Collections
users_collection = db['users']
patients_collection = db['patients']
doctors_collection = db['doctors']
hospitals_collection = db['hospitals']
appointments_collection = db['appointments']
medical_records_collection = db['medical_records']
payments_collection = db['payments']
notifications_collection = db['notifications']
doctor_time_slots_collection = db['doctor_time_slots']
inquiries_collection = db['inquiries']
reviews_collection = db['reviews']
clinical_receipts_collection = db['clinical_receipts']
report_tracks_collection = db['report_tracks']
symptom_checks_collection = db['symptom_checks']
chat_messages_collection = db['chat_messages']

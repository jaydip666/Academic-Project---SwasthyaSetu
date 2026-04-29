# pyre-ignore-all
# ================= BACKEND FILE =================
# File: db.py
# Purpose: Direct MongoDB connection and collection references
# Handles: Low-level database access via PyMongo

import os
from pymongo import MongoClient

# Use Environment Variable for Vercel, fallback to local for development
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://127.0.0.1:27017/')

try:
    # Set serverSelectionTimeoutMS for quick failure if DB is down
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Ping the server to verify connection
    client.admin.command('ping')
except Exception as e:
    print(f"CRITICAL ERROR: Could not connect to MongoDB: {e}")
    # Fallback to avoid crashing the whole server during startup
    client = MongoClient(MONGODB_URI, connect=False)

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

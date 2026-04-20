"""
Swasthya Local Backend - Deterministic Version
File: symptom_logic.py
Features: Local keyword matching (No API Quotas), Simple Triage, Hardcoded Fallbacks
"""

import json
import re
from typing import List, Dict
from datetime import datetime

class SessionManager:
    def __init__(self):
        self.cache = {}
    def get_session(self, session_id: str, history: List[Dict] = None):
        if session_id not in self.cache:
            self.cache[session_id] = {'turn': 0}
        return self.cache[session_id]
    def clear(self, session_id: str):
        if session_id in self.cache:
            del self.cache[session_id]

session_manager = SessionManager()

def is_garbage(text: str) -> bool:
    t = text.strip().lower()
    if not t or len(t) <= 1: return True
    return False

def extract_symptoms(text: str) -> dict:
    t = text.lower()
    
    if any(k in t for k in ['heart', 'chest', 'bp', 'pressure', 'palpitation', 'breath']):
        return {
            'primary_disease': 'Cardiovascular Issue',
            'severity': 'High',
            'recommended_doctor': 'Cardiology',
            'recommended_action': 'Seek immediate medical attention or book a cardiologist.'
        }
    elif any(k in t for k in ['head', 'migraine', 'dizzy', 'stroke', 'brain', 'numb']):
        return {
            'primary_disease': 'Neurological Issue',
            'severity': 'Medium',
            'recommended_doctor': 'Neurology',
            'recommended_action': 'Consult a neurologist for further evaluation.'
        }
    elif any(k in t for k in ['skin', 'rash', 'itch', 'acne', 'pimple', 'redness']):
        return {
            'primary_disease': 'Dermatological Issue',
            'severity': 'Low',
            'recommended_doctor': 'Dermatology',
            'recommended_action': 'Use mild moisturizers and consult a dermatologist.'
        }
    elif any(k in t for k in ['bone', 'joint', 'fracture', 'back', 'knee', 'pain', 'muscle']):
        return {
            'primary_disease': 'Musculoskeletal Issue',
            'severity': 'Medium',
            'recommended_doctor': 'Orthopedics',
            'recommended_action': 'Avoid heavy lifting and consult an orthopedist.'
        }
    elif any(k in t for k in ['sad', 'depress', 'anxiety', 'stress', 'panic', 'sleep']):
        return {
            'primary_disease': 'Psychological Stress',
            'severity': 'Medium',
            'recommended_doctor': 'Psychiatry',
            'recommended_action': 'Rest, practice mindfulness, and consider consulting a psychiatrist.'
        }
    else:
        return {
            'primary_disease': 'General Viral Infection',
            'severity': 'Low',
            'recommended_doctor': 'General Medicine',
            'recommended_action': 'Stay hydrated, rest well, and consult a general physician if symptoms persist.'
        }

def analyze_symptom_message(chat_session, session_id: str, user_message: str, history: List[Dict] = None):
    # Dummy chat session variable is ignored
    sess = session_manager.get_session(session_id, history)
    
    if is_garbage(user_message):
        return {
            "status": "need_more_info",
            "response": "I didn't quite catch that. Could you describe your symptoms more clearly?",
            "session_update": {"new_questions": []}
        }
        
    sess['turn'] += 1
    
    # Need at least a bit of info (2 turns, or explicitly a long message)
    if sess['turn'] < 2 and len(user_message.split()) < 5:
        return {
            "status": "need_more_info",
            "response": "Thank you for sharing that. To give you a better recommendation, could you provide a bit more detail? How severe is it and when did it start?",
            "session_update": {
                "new_questions": ["When did these symptoms first appear?", "How bad is it on a scale of 1-10?"]
            }
        }
        
    # Generate assessment using local logic
    # Fetch user total context from history if available
    full_context = user_message
    if history:
         full_context = " ".join([m.get("text", "") for m in history]) + " " + user_message

    result_data = extract_symptoms(full_context)
    
    # Synthesize a response
    primary = result_data.get('primary_disease')
    action = result_data.get('recommended_action')
    response_text = f"Based on your symptoms, this could be related to a **{primary}**. I recommend you **{action}**."
    
    llm_result = {
        "status": "complete",
        "response": response_text,
        "result": result_data,
        "session_update": {
            "store": True
        },
        "disclaimer": "This is a deterministic local triage assessment. It is not a medical diagnosis."
    }
    
    # Clear session so next time they start fresh
    session_manager.clear(session_id)
    
    return llm_result

# We provide a no-op implementation of generate_chat_session
# since views.py expects it to be available (even if it's unused now).
def generate_chat_session(history=None):
    return None
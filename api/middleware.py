# ================= BACKEND FILE =================
# File: middleware.py
# Purpose: Custom Django middleware for system-wide request/response processing
# Handles: Updating user 'last_active' timestamp on every authenticated request

from datetime import datetime
from .db import users_collection
from bson.objectid import ObjectId

class UpdateLastActiveMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.session.get('user_id'):
            user_id = request.session.get('user_id')
            # Fire and forget update (non-blocking ideally, but fine here)
            try:
                users_collection.update_one(
                    {'_id': ObjectId(user_id)},
                    {'$set': {'last_active': datetime.now()}}
                )
            except:
                pass

        response = self.get_response(request)
        return response

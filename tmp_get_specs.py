from pymongo import MongoClient

client = MongoClient('mongodb://127.0.0.1:27017/')
db = client['swasthya_setu']
specs = db.doctors.distinct('specialization', {'status': 'approved'})
print("Approved Doctor Specializations:", specs)

from pymongo import MongoClient

db = MongoClient('mongodb://127.0.0.1:27017/')['swasthya_setu']
doc = db.report_tracks.find_one()
print(doc)

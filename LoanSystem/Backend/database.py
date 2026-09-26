import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "loan_system")

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000
)

db = client[DATABASE_NAME]

# Main collections
users_collection = db["users"]
customers_collection = db["customers"]
loans_collection = db["loans"]
risk_history_collection = db["risk_history"]
alerts_collection = db["alerts"]
excel_imports_collection = db["excel_imports"]
excel_records_collection = db["excel_records"]
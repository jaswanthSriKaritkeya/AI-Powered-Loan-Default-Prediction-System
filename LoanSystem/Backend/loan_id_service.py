from datetime import datetime, timezone
from pymongo import ReturnDocument
from database import db


counters_collection = db["counters"]


def generate_loan_id():
    year = datetime.now(timezone.utc).year

    counter = counters_collection.find_one_and_update(
        {"_id": f"loan_counter_{year}"},
        {"$inc": {"sequence": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    sequence = counter["sequence"]

    return f"LN-{year}-{sequence:06d}"
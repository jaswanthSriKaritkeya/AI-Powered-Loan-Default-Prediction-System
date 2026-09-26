from app.database import customers_collection


def get_customer_by_pan(pan: str):
    customer = customers_collection.find_one(
        {"pan": pan.upper()},
        {"_id": 0}
    )

    return customer


def update_customer_by_pan(pan: str, update_data: dict):
    pan = pan.upper()

    result = customers_collection.update_one(
        {"pan": pan},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return None

    return customers_collection.find_one(
        {"pan": pan},
        {"_id": 0}
    )
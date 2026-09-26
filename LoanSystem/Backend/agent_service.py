from database import users_collection
from auth import hash_password


def create_agent(
    name: str,
    email: str,
    password: str
):

    email = email.lower().strip()

    existing_user = users_collection.find_one({
        "email": email
    })

    if existing_user:
        return None

    agent = {
        "name": name,
        "email": email,
        "password": hash_password(password),
        "role": "agent",
        "assigned_customers": [],
        "is_active": True
    }

    result = users_collection.insert_one(agent)

    return str(result.inserted_id)
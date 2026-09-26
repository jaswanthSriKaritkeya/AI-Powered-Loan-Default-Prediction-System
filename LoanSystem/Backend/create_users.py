from getpass import getpass

from database import users_collection
from auth import hash_password


def create_admin():

    print("\n========== CREATE ADMIN ==========")

    name = input("Name: ").strip()
    email = input("Email: ").strip().lower()
    password = getpass("Password: ")

    if not name or not email or not password:

        print("Name, email and password are required.")
        return

    existing_user = users_collection.find_one({
        "email": email
    })

    if existing_user:

        print("An account with this email already exists.")
        return

    admin = {
        "name": name,
        "email": email,
        "password": hash_password(password),
        "role": "admin",
        "assigned_customers": [],
        "is_active": True
    }

    users_collection.insert_one(admin)

    print("Admin account created successfully!")


if __name__ == "__main__":
    create_admin()
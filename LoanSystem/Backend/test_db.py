from database import client, db

try:
    # Check whether MongoDB is reachable
    client.admin.command("ping")

    print("MongoDB connected successfully!")
    print("Database:", db.name)

    # Insert a temporary test document
    db["connection_test"].insert_one({
        "message": "LoanSystem database is working"
    })

    print("Test document inserted successfully!")

except Exception as e:
    print("MongoDB connection failed:", e)

finally:
    client.close()
from app.database import customers_collection


customers = [
    {
        "pan": "ABCDE1234F",
        "name": "Rahul Kumar",
        "dob": "1998-08-15",
        "gender": "Male",
        "phone": "9000000001",
        "email": "rahul@example.com",

        "income": 50000,
        "credit_score": 740,
        "months_employed": 36,
        "num_credit_lines": 3,
        "dti_ratio": 0.30,

        "education": "Bachelor",
        "employment_type": "Salaried",
        "marital_status": "Single",
        "has_mortgage": "No",
        "has_dependents": "Yes"
    },

    {
        "pan": "PQRST5678G",
        "name": "Priya Sharma",
        "dob": "1995-03-22",
        "gender": "Female",
        "phone": "9000000002",
        "email": "priya@example.com",

        "income": 75000,
        "credit_score": 780,
        "months_employed": 60,
        "num_credit_lines": 2,
        "dti_ratio": 0.22,

        "education": "Master",
        "employment_type": "Salaried",
        "marital_status": "Married",
        "has_mortgage": "Yes",
        "has_dependents": "Yes"
    },

    {
        "pan": "LMNOP1234H",
        "name": "Arjun Reddy",
        "dob": "1999-11-10",
        "gender": "Male",
        "phone": "9000000003",
        "email": "arjun@example.com",

        "income": 30000,
        "credit_score": 520,
        "months_employed": 8,
        "num_credit_lines": 6,
        "dti_ratio": 0.78,

        "education": "High School",
        "employment_type": "Unemployed",
        "marital_status": "Single",
        "has_mortgage": "No",
        "has_dependents": "Yes"
    }
]


if __name__ == "__main__":

    customers_collection.delete_many({})

    customers_collection.insert_many(customers)

    print(f"Inserted {len(customers)} customers")
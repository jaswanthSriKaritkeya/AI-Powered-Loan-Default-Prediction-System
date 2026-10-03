from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from database import (
    loans_collection,
    customers_collection,
    risk_history_collection,
    alerts_collection
)

from auth_router import get_current_user
from predictor import loanPredict
from risk_buckets import risk_bucket
from shap_utils import get_shap_explainer
from loan_id_service import generate_loan_id


router = APIRouter(
    prefix="/loans",
    tags=["Loans"]
)

loans_collection.create_index(
    "loan_id",
    unique=True,
    sparse=True
)
# =========================================================
# REQUEST MODEL
# =========================================================

class CreateLoanRequest(BaseModel):
    pan: str
    loan_amount: int = Field(gt=0)
    interest_rate: float = Field(ge=0)
    loan_term: int = Field(gt=0)
    loan_purpose: str
    has_cosigner: str


# =========================================================
# CREATE LOAN
# =========================================================

@router.post("/")
def create_loan(
    request: CreateLoanRequest,
    current_user: dict = Depends(get_current_user)
):

    # 1. Normalize PAN
    pan = request.pan.upper().strip()

    # 2. Find customer using PAN
    customer = customers_collection.find_one({
        "pan": pan
    })

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found. Fetch customer using PAN first."
        )

    # 3. Get internal customer ID
    customer_id = str(customer["_id"])

    # 4. Calculate customer age
    try:

        dob = datetime.fromisoformat(
            customer["dob"].replace("Z", "+00:00")
        ).date()

        today = datetime.now(timezone.utc).date()

        age = (
            today.year
            - dob.year
            - ((today.month, today.day) < (dob.month, dob.day))
        )

    except (ValueError, TypeError, KeyError):

        raise HTTPException(
            status_code=400,
            detail="Customer has an invalid or missing date of birth"
        )

    # 5. Prepare ML input
    loan_data = {
        "Age": age,
        "Income": customer["income"],
        "LoanAmount": request.loan_amount,
        "CreditScore": customer["credit_score"],
        "MonthsEmployed": customer["months_employed"],
        "NumCreditLines": customer["num_credit_lines"],
        "InterestRate": request.interest_rate,
        "LoanTerm": request.loan_term,
        "DTIRatio": customer["dti_ratio"],

        "Education": customer["education"],
        "EmploymentType": customer["employment_type"],
        "MaritalStatus": customer["marital_status"],
        "HasMortgage": customer["has_mortgage"],
        "HasDependents": customer["has_dependents"],

        "LoanPurpose": request.loan_purpose,
        "HasCoSigner": request.has_cosigner
    }

    # 6. Run ML model
    prediction_res = loanPredict(loan_data)

    probability = prediction_res["probability"]

    # 7. Calculate initial risk
    risk = risk_bucket(
        probablity=probability
    )

    # 8. Generate SHAP explanation
    explanations = get_shap_explainer(
        loan_data
    )

    now = datetime.now(timezone.utc)

    business_loan_id = generate_loan_id()
    # 9. Create loan
    #
    # Monitoring is NOT active yet.
    # It becomes active only after approval.
    loan = {
        "customer_id": customer_id,
        "loan_id": business_loan_id,
        "pan": pan,

        "loan_amount": request.loan_amount,
        "interest_rate": request.interest_rate,
        "loan_term": request.loan_term,
        "loan_purpose": request.loan_purpose,
        "has_cosigner": request.has_cosigner,

        "status": "application",

        # Initial / baseline risk
        "initial_risk": risk,
        "initial_default_probability": probability,

        # Current risk initially equals baseline
        "current_risk": risk,
        "default_probability": probability,

        # Continuous monitoring
        "monitoring_status": "inactive",
        "last_assessment_date": None,
        "next_assessment_date": None,

        "created_by": str(current_user["_id"]),
        "created_at": now,
        "updated_at": now
    }

    # 10. Save loan
    result = loans_collection.insert_one(loan)

    loan["_id"] = str(result.inserted_id)

    # 11. Save initial risk history
    assessment = {
        "customer_id": customer_id,
        "pan": pan,
        "loan_id": loan["_id"],

        "assessed_by": str(current_user["_id"]),
        "assessment_type": "initial",

        "loan_data": loan_data,

        "prediction": prediction_res["prediction"],
        "default_probability": probability,
        "risk_bucket": risk,

        "explanations": explanations,

        "created_at": now
    }

    risk_history_collection.insert_one(assessment)

    # 12. Convert datetime values for response
    loan["created_at"] = now.isoformat()
    loan["updated_at"] = now.isoformat()

    return {
        "message": "Loan created successfully",
        "loan": loan
    }


# =========================================================
# APPROVE LOAN
# =========================================================

@router.put("/{loan_id}/approve")
def approve_loan(
    loan_id: str,
    current_user: dict = Depends(get_current_user)
):

    # 1. Find loan using BUSINESS Loan ID
    loan = loans_collection.find_one({
        "loan_id": loan_id
    })

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    # 2. Only applications can be approved
    if loan.get("status") != "application":
        raise HTTPException(
            status_code=400,
            detail="Only loan applications can be approved"
        )

    # 3. Approval time
    now = datetime.now(timezone.utc)

    # First monitoring assessment after 30 days
    next_assessment = now + timedelta(days=30)

    # 4. Approve loan and activate monitoring
    loans_collection.update_one(
        {
            "_id": loan["_id"]
        },
        {
            "$set": {
                "status": "approved",

                "approved_by": str(current_user["_id"]),
                "approved_at": now,

                "monitoring_status": "active",
                "last_assessment_date": now,
                "next_assessment_date": next_assessment,

                "updated_at": now
            }
        }
    )

    # 5. Get updated loan
    updated_loan = loans_collection.find_one({
        "_id": loan["_id"]
    })

    # 6. Convert MongoDB ObjectId
    updated_loan["_id"] = str(updated_loan["_id"])

    # 7. Convert datetime fields
    datetime_fields = [
        "created_at",
        "updated_at",
        "approved_at",
        "last_assessment_date",
        "next_assessment_date"
    ]

    for field in datetime_fields:
        if updated_loan.get(field):
            updated_loan[field] = updated_loan[field].isoformat()

    return {
        "message": "Loan approved successfully",
        "loan": updated_loan
    }

# =========================================================
# TEST CONTINUOUS MONITORING
# =========================================================
#
# DEVELOPMENT ONLY
#
# This allows us to test monitoring without waiting 30 days.
# Remove this endpoint after the system is fully tested.
# =========================================================

@router.post("/{loan_id}/test-monitor")
async def test_monitor_loan(
    loan_id: str,
    current_user: dict = Depends(get_current_user)
):

    from monitoring_service import monitor_single_loan

    # 1. Find loan using BUSINESS Loan ID
    loan = loans_collection.find_one({
        "loan_id": loan_id
    })

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    # 2. Only approved loans can be reassessed
    if loan.get("status") != "approved":
        raise HTTPException(
            status_code=400,
            detail="Only approved loans can be reassessed"
        )

    # monitoring_status check intentionally removed:
    # Manual reassessment via this endpoint is independent of the
    # 30-day automatic monitoring schedule and works on any approved loan.

    try:

        result = await monitor_single_loan(loan)

        return {
            "message": "Loan monitoring completed successfully",
            "result": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Monitoring failed: {str(e)}"
        )
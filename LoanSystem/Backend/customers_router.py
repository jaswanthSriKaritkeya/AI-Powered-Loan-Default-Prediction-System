from fastapi import APIRouter, HTTPException, Depends
from datetime import date, datetime, timezone
from bson import ObjectId

from database import (
    customers_collection,
    risk_history_collection
)

from pan_service import fetch_pan_details
from auth_router import get_current_user

from schemas import LoanRequest, LoanAssessmentRequest
from predictor import loanPredict
from risk_buckets import risk_bucket
from shap_utils import get_shap_explainer


router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


# =========================================================
# STATIC CUSTOMER FIELDS
# =========================================================
# These fields represent identity/profile information.
# We keep the existing MongoDB values once the customer
# has been created.

STATIC_FIELDS = [
    "pan",
    "name",
    "dob",
    "gender"
]


# =========================================================
# DYNAMIC CUSTOMER FIELDS
# =========================================================
# These fields can change and should be refreshed from
# the PAN Simulator.

DYNAMIC_FIELDS = [
    "income",
    "credit_score",
    "months_employed",
    "num_credit_lines",
    "dti_ratio",
    "education",
    "employment_type",
    "marital_status",
    "has_mortgage",
    "has_dependents"
]


# =========================================================
# UPDATE DYNAMIC CUSTOMER DATA
# =========================================================

def update_dynamic_customer_data(
    customer_id,
    pan_data,
    updated_at
):
    dynamic_data = {}

    for field in DYNAMIC_FIELDS:

        if field in pan_data:
            dynamic_data[field] = pan_data[field]

    dynamic_data["updated_at"] = updated_at

    customers_collection.update_one(
        {
            "_id": customer_id
        },
        {
            "$set": dynamic_data
        }
    )


# =========================================================
# FETCH CUSTOMER USING PAN
# =========================================================

@router.post("/fetch-pan")
async def fetch_customer_from_pan(
    pan: str,
    current_user: dict = Depends(get_current_user)
):

    # -----------------------------------------------------
    # 1. Normalize PAN
    # -----------------------------------------------------

    pan = pan.upper().strip()

    # -----------------------------------------------------
    # 2. ALWAYS fetch latest data from PAN Simulator
    # -----------------------------------------------------

    try:

        pan_data = await fetch_pan_details(pan)

    except Exception as e:

        raise HTTPException(
            status_code=502,
            detail=f"PAN service error: {str(e)}"
        )

    # -----------------------------------------------------
    # 3. Check whether customer already exists
    # -----------------------------------------------------

    existing_customer = customers_collection.find_one(
        {
            "pan": pan
        }
    )

    now = datetime.now(timezone.utc)

    # =====================================================
    # EXISTING CUSTOMER
    # =====================================================

    if existing_customer:

        # ---------------------------------------------
        # Update ONLY dynamic information
        # ---------------------------------------------

        update_data = {}

        for field in DYNAMIC_FIELDS:

            if field in pan_data:
                update_data[field] = pan_data[field]

        update_data["updated_at"] = now

        customers_collection.update_one(
            {
                "_id": existing_customer["_id"]
            },
            {
                "$set": update_data
            }
        )

        # ---------------------------------------------
        # Get updated customer
        # ---------------------------------------------

        updated_customer = customers_collection.find_one(
            {
                "_id": existing_customer["_id"]
            }
        )

        updated_customer["_id"] = str(
            updated_customer["_id"]
        )

        # Convert datetime if present
        if isinstance(
            updated_customer.get("updated_at"),
            datetime
        ):
            updated_customer["updated_at"] = (
                updated_customer["updated_at"].isoformat()
            )

        if isinstance(
            updated_customer.get("created_at"),
            datetime
        ):
            updated_customer["created_at"] = (
                updated_customer["created_at"].isoformat()
            )

        return {
            "message": "Customer data refreshed successfully",
            "customer": updated_customer
        }

    # =====================================================
    # NEW CUSTOMER
    # =====================================================

    # Keep the complete PAN response when creating
    # the customer for the first time.

    pan_data["created_by"] = str(
        current_user["_id"]
    )

    pan_data["created_at"] = now
    pan_data["updated_at"] = now

    result = customers_collection.insert_one(
        pan_data
    )

    pan_data["_id"] = str(
        result.inserted_id
    )

    pan_data["created_at"] = now.isoformat()
    pan_data["updated_at"] = now.isoformat()

    return {
        "message": "Customer fetched and saved successfully",
        "customer": pan_data
    }


# =========================================================
# PRE-LOAN RISK ASSESSMENT
# =========================================================

@router.post("/assess-by-pan")
async def assess_customer_risk(
    pan: str,
    request: LoanAssessmentRequest,
    current_user: dict = Depends(get_current_user)
):

    # -----------------------------------------------------
    # 1. Normalize PAN
    # -----------------------------------------------------

    pan = pan.upper().strip()

    # -----------------------------------------------------
    # 2. Make sure customer exists locally
    # -----------------------------------------------------

    customer = customers_collection.find_one(
        {
            "pan": pan
        }
    )

    if not customer:

        raise HTTPException(
            status_code=404,
            detail=(
                "Customer not found. "
                "Fetch customer using PAN first."
            )
        )

    # -----------------------------------------------------
    # 3. Fetch LATEST PAN data
    # -----------------------------------------------------

    try:

        pan_data = await fetch_pan_details(pan)

    except Exception as e:

        raise HTTPException(
            status_code=502,
            detail=f"PAN service error: {str(e)}"
        )

    # -----------------------------------------------------
    # 4. Synchronize dynamic data into MongoDB
    # -----------------------------------------------------

    now = datetime.now(timezone.utc)

    update_data = {}

    for field in DYNAMIC_FIELDS:

        if field in pan_data:
            update_data[field] = pan_data[field]

    update_data["updated_at"] = now

    customers_collection.update_one(
        {
            "_id": customer["_id"]
        },
        {
            "$set": update_data
        }
    )

    # -----------------------------------------------------
    # 5. Get customer ID
    # -----------------------------------------------------

    customer_id = str(
        customer["_id"]
    )

    # -----------------------------------------------------
    # 6. Calculate age from LATEST PAN data
    # -----------------------------------------------------

    try:

        dob_value = pan_data["dob"]

        if isinstance(dob_value, str):

            dob = date.fromisoformat(
                dob_value.replace("Z", "")[:10]
            )

        elif isinstance(dob_value, date):

            dob = dob_value

        else:

            raise ValueError(
                "Invalid DOB format"
            )

        today = datetime.now(
            timezone.utc
        ).date()

        age = (
            today.year
            - dob.year
            - (
                (today.month, today.day)
                < (dob.month, dob.day)
            )
        )

    except (
        ValueError,
        TypeError,
        KeyError
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "PAN Simulator returned "
                "an invalid date of birth"
            )
        )

    # -----------------------------------------------------
    # 7. Prepare ML input
    # -----------------------------------------------------
    # IMPORTANT:
    # Dynamic fields come directly from the latest
    # PAN Simulator response.

    loan_data = {

        "Age": age,

        "Income": pan_data["income"],

        "LoanAmount": request.LoanAmount,

        "CreditScore": pan_data["credit_score"],

        "MonthsEmployed": pan_data["months_employed"],

        "NumCreditLines": pan_data["num_credit_lines"],

        "InterestRate": request.InterestRate,

        "LoanTerm": request.LoanTerm,

        "DTIRatio": pan_data["dti_ratio"],

        "Education": pan_data["education"],

        "EmploymentType": pan_data["employment_type"],

        "MaritalStatus": pan_data["marital_status"],

        "HasMortgage": pan_data["has_mortgage"],

        "HasDependents": pan_data["has_dependents"],

        "LoanPurpose": request.LoanPurpose,

        "HasCoSigner": request.HasCoSigner
    }

    # -----------------------------------------------------
    # 8. Validate ML input
    # -----------------------------------------------------

    validated_data = LoanRequest(
        **loan_data
    )

    loan_data = validated_data.model_dump()

    # -----------------------------------------------------
    # 9. Run ML model
    # -----------------------------------------------------

    prediction_res = loanPredict(
        loan_data
    )

    probability = prediction_res[
        "probability"
    ]

    # -----------------------------------------------------
    # 10. Calculate risk bucket
    # -----------------------------------------------------

    risk = risk_bucket(
        probablity=probability
    )

    # -----------------------------------------------------
    # 11. Generate SHAP explanation
    # -----------------------------------------------------

    explanations = get_shap_explainer(
        loan_data
    )

    # -----------------------------------------------------
    # 12. Save assessment history
    # -----------------------------------------------------

    assessment = {

        "customer_id": customer_id,

        "pan": pan,

        "assessed_by": str(
            current_user["_id"]
        ),

        "assessment_type": "pre_loan",

        "loan_data": loan_data,

        "prediction": prediction_res[
            "prediction"
        ],

        "default_probability": probability,

        "risk_bucket": risk,

        "explanations": explanations,

        "created_at": now
    }

    result = risk_history_collection.insert_one(
        assessment
    )

    assessment["_id"] = str(
        result.inserted_id
    )

    assessment["created_at"] = (
        now.isoformat()
    )

    # -----------------------------------------------------
    # 13. Return result
    # -----------------------------------------------------

    return {

        "message": (
            "Risk assessment completed successfully"
        ),

        "assessment": assessment
    }
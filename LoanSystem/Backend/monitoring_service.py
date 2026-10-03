
from datetime import datetime, timezone, timedelta

from bson import ObjectId

from database import (
    loans_collection,
    customers_collection,
    risk_history_collection,
    alerts_collection
)

from pan_service import fetch_pan_details
from predictor import loanPredict
from risk_buckets import risk_bucket
from shap_utils import get_shap_explainer


def calculate_age(dob):
    """Calculate age from the latest PAN Simulator DOB."""

    if isinstance(dob, str):
        dob = datetime.fromisoformat(dob.replace("Z", "+00:00")).date()
    elif isinstance(dob, datetime):
        dob = dob.date()

    today = datetime.now(timezone.utc).date()

    return (
        today.year - dob.year
        - ((today.month, today.day) < (dob.month, dob.day))
    )


async def monitor_single_loan(loan):
    """
    Reassess one approved loan using the latest PAN Simulator data.

    Business Loan ID:
        Used for API/frontend responses.

    MongoDB _id:
        Used internally for database relationships and updates.
    """

    now = datetime.now(timezone.utc)

    # ---------------------------------------------------------
    # 1. Keep both IDs separate
    # ---------------------------------------------------------

    mongo_loan_id = str(loan["_id"])
    business_loan_id = loan["loan_id"]

    pan = loan["pan"]

    # ---------------------------------------------------------
    # 2. Fetch the latest borrower data
    # ---------------------------------------------------------

    pan_data = await fetch_pan_details(pan)

    # ---------------------------------------------------------
    # 3. Calculate latest borrower age
    # ---------------------------------------------------------

    dob = pan_data.get("dob")

    if not dob:
        raise ValueError(
            "PAN Simulator did not return date of birth"
        )

    age = calculate_age(dob)

    # ---------------------------------------------------------
    # 4. Prepare ML input
    # ---------------------------------------------------------
    # Approved loan terms remain unchanged.
    # Only borrower information comes from latest PAN data.

    loan_data = {
        "Age": age,
        "Income": pan_data["income"],
        "LoanAmount": loan["loan_amount"],
        "CreditScore": pan_data["credit_score"],
        "MonthsEmployed": pan_data["months_employed"],
        "NumCreditLines": pan_data["num_credit_lines"],
        "InterestRate": loan["interest_rate"],
        "LoanTerm": loan["loan_term"],
        "DTIRatio": pan_data["dti_ratio"],

        "Education": pan_data["education"],
        "EmploymentType": pan_data["employment_type"],
        "MaritalStatus": pan_data["marital_status"],
        "HasMortgage": pan_data["has_mortgage"],
        "HasDependents": pan_data["has_dependents"],

        "LoanPurpose": loan["loan_purpose"],
        "HasCoSigner": loan["has_cosigner"]
    }

    # ---------------------------------------------------------
    # 5. Run ML model
    # ---------------------------------------------------------

    prediction_res = loanPredict(loan_data)

    probability = prediction_res["probability"]

    # ---------------------------------------------------------
    # 6. Calculate current risk
    # ---------------------------------------------------------

    risk = risk_bucket(
        probablity=probability
    )

    # ---------------------------------------------------------
    # 7. Generate SHAP explanation
    # ---------------------------------------------------------

    explanations = get_shap_explainer(
        loan_data
    )

    # ---------------------------------------------------------
    # 8. Get previous risk
    # ---------------------------------------------------------

    previous_risk = loan.get("current_risk")

    # ---------------------------------------------------------
    # 9. Store assessment in risk history
    # ---------------------------------------------------------
    # IMPORTANT:
    # risk_history uses MongoDB _id internally.

    assessment = {
        "customer_id": loan["customer_id"],
        "pan": pan,

        "loan_id": mongo_loan_id,

        "assessed_by": "system",
        "assessment_type": "periodic",

        "loan_data": loan_data,

        "prediction": prediction_res["prediction"],
        "default_probability": probability,
        "risk_bucket": risk,

        "previous_risk_bucket": previous_risk,

        "explanations": explanations,

        "created_at": now
    }

    risk_history_collection.insert_one(
        assessment
    )

    # ---------------------------------------------------------
    # 10. Calculate next assessment date
    # ---------------------------------------------------------

    next_assessment = now + timedelta(
        days=30
    )

    # ---------------------------------------------------------
    # 11. Update loan
    # ---------------------------------------------------------
    # MongoDB _id is used internally.

    loans_collection.update_one(
        {
            "_id": loan["_id"]
        },
        {
            "$set": {
                "current_risk": risk,
                "default_probability": probability,

                "last_assessment_date": now,
                "next_assessment_date": next_assessment,

                "updated_at": now
            }
        }
    )

    # ---------------------------------------------------------
    # 12. Generate High / Critical risk alert
    # ---------------------------------------------------------

    if risk in ["High Risk", "Critical"]:

        # Alert when:
        # 1. Entering High/Critical
        # OR
        # 2. Moving between High and Critical

        should_alert = (
            previous_risk not in ["High Risk", "Critical"]
            or previous_risk != risk
        )

        if should_alert:

            alert = {
                "loan_id": mongo_loan_id,

                "customer_id": loan["customer_id"],
                "pan": pan,

                "alert_type": f"{risk.upper()}_RISK",

                "message": (
                    f"Borrower risk is now {risk}. "
                    f"Default probability: "
                    f"{probability:.2%}"
                ),

                "risk_bucket": risk,
                "default_probability": probability,

                "previous_risk_bucket": previous_risk,

                "reasons": explanations,

                "status": "unread",

                "created_at": now
            }

            alerts_collection.insert_one(
                alert
            )

    # ---------------------------------------------------------
    # 13. Return result
    # ---------------------------------------------------------
    # IMPORTANT:
    # API returns BUSINESS Loan ID, not MongoDB _id.

    return {
        "loan_id": business_loan_id,

        "previous_risk": previous_risk,

        "current_risk": risk,

        "default_probability": probability,

        "next_assessment_date": (
            next_assessment.isoformat()
        )
    }


async def monitor_due_loans():
    """
    Process all approved loans whose monitoring date is due.
    """

    now = datetime.now(timezone.utc)

    due_loans = loans_collection.find({
        "status": "approved",
        "monitoring_status": "active",
        "next_assessment_date": {"$lte": now}
    })

    results = []

    for loan in due_loans:
        try:
            result = await monitor_single_loan(loan)
            results.append({
                "status": "success",
                **result
            })

        except Exception as e:
            # Do not stop monitoring other loans if one fails.
            results.append({
                "status": "failed",
                "loan_id": str(loan["loan_id"]),
                "error": str(e)
            })

    return results
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from database import (
    customers_collection,
    loans_collection,
    risk_history_collection,
    alerts_collection
)

from auth_router import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@router.get("/summary")
def dashboard_summary(
    current_user: dict = Depends(get_current_user)
):

    total_customers = customers_collection.count_documents({})

    total_loans = loans_collection.count_documents({})

    approved_loans = loans_collection.count_documents({
        "status": "approved"
    })

    low_risk = loans_collection.count_documents({
        "status": "approved",
        "current_risk": "Low Risk"
    })

    moderate_risk = loans_collection.count_documents({
        "status": "approved",
        "current_risk": "Moderate Risk"
    })

    high_risk = loans_collection.count_documents({
        "status": "approved",
        "current_risk": "High Risk"
    })

    critical_risk = loans_collection.count_documents({
        "status": "approved",
        "current_risk": "Critical"
    })

    unread_alerts = alerts_collection.count_documents({
        "status": "unread"
    })

    return {
        "total_customers": total_customers,
        "total_loans": total_loans,
        "approved_loans": approved_loans,

        "risk_distribution": {
            "low": low_risk,
            "moderate": moderate_risk,
            "high": high_risk,
            "critical": critical_risk
        },

        "unread_alerts": unread_alerts
    }


# =========================================================
# GET ALL LOANS
# =========================================================

@router.get("/loans")
def dashboard_loans(
    current_user: dict = Depends(get_current_user)
):

    loans = loans_collection.find({})

    result = []

    for loan in loans:

        customer_id = loan.get("customer_id")

        if not customer_id:
            continue

        try:
            customer = customers_collection.find_one({
                "_id": ObjectId(customer_id)
            })
        except Exception:
            customer = None

        if not customer:
            continue

        result.append({
            # Business loan ID shown to frontend
            "loan_id": loan.get("loan_id"),

            # Customer information
            "customer_id": loan.get("customer_id"),
            "customer_name": customer.get("name"),
            "pan": loan.get("pan"),

            # Loan information
            "loan_amount": loan.get("loan_amount"),
            "interest_rate": loan.get("interest_rate"),
            "loan_term": loan.get("loan_term"),
            "loan_purpose": loan.get("loan_purpose"),

            # Status
            "status": loan.get("status"),

            # Initial assessment
            "initial_risk": loan.get("initial_risk"),
            "initial_default_probability": loan.get(
                "initial_default_probability"
            ),

            # Current assessment
            "current_risk": loan.get("current_risk"),
            "default_probability": loan.get(
                "default_probability"
            ),

            # Monitoring dates
            "last_assessment_date": (
                loan["last_assessment_date"].isoformat()
                if loan.get("last_assessment_date")
                else None
            ),

            "next_assessment_date": (
                loan["next_assessment_date"].isoformat()
                if loan.get("next_assessment_date")
                else None
            ),

            # Loan timestamps
            "created_at": (
                loan["created_at"].isoformat()
                if loan.get("created_at")
                else None
            ),

            "approved_at": (
                loan["approved_at"].isoformat()
                if loan.get("approved_at")
                else None
            )
        })

    return {
        "count": len(result),
        "loans": result
    }


# =========================================================
# GET LOAN RISK HISTORY
# =========================================================

@router.get("/loans/{loan_id}/history")
def get_loan_history(
    loan_id: str,
    current_user: dict = Depends(get_current_user)
):

    # -----------------------------------------------------
    # loan_id is the BUSINESS ID
    # Example: LN-2026-000002
    # -----------------------------------------------------

    loan = loans_collection.find_one({
        "loan_id": loan_id
    })

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    # -----------------------------------------------------
    # risk_history.loan_id stores MongoDB _id internally
    # -----------------------------------------------------

    mongo_loan_id = str(loan["_id"])

    six_months_ago = (
        datetime.now(timezone.utc) - timedelta(days=180)
    )

    history = list(
        risk_history_collection.find({
            "loan_id": mongo_loan_id,
            "created_at": {
                "$gte": six_months_ago
            }
        }).sort("created_at", 1)
    )

    result = []

    for item in history:

        result.append({
            "assessment_id": str(item["_id"]),

            "assessment_type": item.get(
                "assessment_type"
            ),

            "date": (
                item["created_at"].isoformat()
                if item.get("created_at")
                else None
            ),

            "risk_bucket": item.get(
                "risk_bucket"
            ),

            "default_probability": item.get(
                "default_probability"
            ),

            "previous_risk_bucket": item.get(
                "previous_risk_bucket"
            ),

            "explanations": item.get(
                "explanations",
                []
            )
        })

    return {
        # Business ID returned to frontend
        "loan_id": loan.get("loan_id"),

        "customer_id": loan.get(
            "customer_id"
        ),

        "pan": loan.get(
            "pan"
        ),

        "current_risk": loan.get(
            "current_risk"
        ),

        "current_default_probability": loan.get(
            "default_probability"
        ),

        "history": result
    }


# =========================================================
# GET ALERTS
# =========================================================

@router.get("/alerts")
def get_alerts(
    current_user: dict = Depends(get_current_user)
):

    alerts = alerts_collection.find(
        {}
    ).sort(
        "created_at",
        -1
    )

    result = []

    for alert in alerts:

        # -------------------------------------------------
        # alerts.loan_id stores MongoDB _id internally
        # Resolve it to business loan_id for frontend
        # -------------------------------------------------

        business_loan_id = None

        internal_loan_id = alert.get("loan_id")

        if internal_loan_id:

            try:
                loan = loans_collection.find_one({
                    "_id": ObjectId(internal_loan_id)
                })

                if loan:
                    business_loan_id = loan.get(
                        "loan_id"
                    )

            except Exception:
                business_loan_id = None

        result.append({
            "alert_id": str(alert["_id"]),

            # Business loan ID shown to frontend
            "loan_id": business_loan_id,

            "customer_id": alert.get(
                "customer_id"
            ),

            "pan": alert.get(
                "pan"
            ),

            "alert_type": alert.get(
                "alert_type"
            ),

            "message": alert.get(
                "message"
            ),

            "risk_bucket": alert.get(
                "risk_bucket"
            ),

            "default_probability": alert.get(
                "default_probability"
            ),

            "previous_risk_bucket": alert.get(
                "previous_risk_bucket"
            ),

            "reasons": alert.get(
                "reasons",
                []
            ),

            "status": alert.get(
                "status"
            ),

            "created_at": (
                alert["created_at"].isoformat()
                if alert.get("created_at")
                else None
            )
        })

    return {
        "count": len(result),
        "alerts": result
    }


# =========================================================
# MARK ALERT AS READ
# =========================================================

@router.put("/alerts/{alert_id}/read")
def mark_alert_as_read(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):

    if not ObjectId.is_valid(alert_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    alert = alerts_collection.find_one({
        "_id": ObjectId(alert_id)
    })

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    alerts_collection.update_one(
        {
            "_id": ObjectId(alert_id)
        },
        {
            "$set": {
                "status": "read",
                "read_at": datetime.now(timezone.utc),
                "read_by": str(
                    current_user["_id"]
                )
            }
        }
    )

    return {
        "message": "Alert marked as read"
    }
